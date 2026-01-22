import { prisma } from "../config/prisma";
import { OrderStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

interface OrderItemInput {
    productSizeId: number;
    quantity: number;
}

interface OrderInput {
    userId: number;
    items: OrderItemInput[];
    recipientName: string;
    recipientPhone: string;
    zipCode: string;
    address1: string;
    address2: string;
    gatePassword?: string;
    deliveryRequest?: string;
    paymentMethod: string; // 예: "카드", "토스페이" 등
}

export const orderService = {
    // 1. 주문 생성 (트랜잭션)
    async createOrder(data: OrderInput) {
        return prisma.$transaction(
            async tx => {
                // 1. 주문 번호 생성 (Toss용 UUID)
                const orderNumber = uuidv4();
                let totalAmount = 0;
                const orderItemsData = [];

                // 2. 재고 확인 및 가격 계산 (기존 로직 동일)
                for (const item of data.items) {
                    const productSize = await tx.productSize.findUnique({
                        where: { id: item.productSizeId },
                        include: { productColor: { include: { product: true } } },
                    });

                    if (!productSize)
                        throw new Error(`PRODUCT_NOT_FOUND: ID ${item.productSizeId}`);
                    if (productSize.stock < item.quantity) {
                        throw new Error(`OUT_OF_STOCK: ${productSize.productColor.product.name}`);
                    }

                    // 재고 차감
                    await tx.productSize.update({
                        where: { id: item.productSizeId },
                        data: { stock: { decrement: item.quantity } },
                    });

                    const price = productSize.productColor.product.price;
                    totalAmount += price * item.quantity;

                    orderItemsData.push({
                        productSizeId: item.productSizeId,
                        quantity: item.quantity,
                        price: price,
                    });
                }

                // 3. 주문 + 배송정보 + 결제정보 생성
                const newOrder = await tx.order.create({
                    data: {
                        userId: data.userId,
                        orderNumber: orderNumber, // UUID 저장
                        totalAmount,
                        status: OrderStatus.PENDING, // 아직 결제 전

                        // 배송 정보 저장
                        recipientName: data.recipientName,
                        recipientPhone: data.recipientPhone,
                        zipCode: data.zipCode,
                        address1: data.address1,
                        address2: data.address2,
                        gatePassword: data.gatePassword,
                        deliveryRequest: data.deliveryRequest,

                        items: {
                            create: orderItemsData,
                        },

                        // 결제 정보 초기화 (Payment 테이블 생성)
                        payment: {
                            create: {
                                method: data.paymentMethod,
                                amount: totalAmount,
                                status: "READY", // 결제 준비 상태
                            },
                        },
                    },
                    include: {
                        payment: true, // 응답에 결제 정보 포함
                    },
                });

                // 4. 장바구니 비우기 (기존 로직 동일)
                const cart = await tx.cart.findUnique({ where: { userId: data.userId } });
                if (cart) {
                    const productSizeIds = data.items.map(i => i.productSizeId);
                    await tx.cartItem.deleteMany({
                        where: {
                            cartId: cart.id,
                            productSizeId: { in: productSizeIds },
                        },
                    });
                }

                return newOrder;
            },
            { timeout: 20000 },
        );
    },

    // 2. 내 주문 목록 조회
    async getMyOrders(userId: number) {
        return prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                items: {
                    include: {
                        productSize: {
                            include: {
                                productColor: {
                                    include: {
                                        product: true,
                                        images: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    },

    // 3. 주문 상세 조회
    async getOrderDetail(userId: number, orderId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        productSize: {
                            include: {
                                productColor: {
                                    include: {
                                        product: true,
                                        images: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!order) throw new Error("ORDER_NOT_FOUND");
        if (order.userId !== userId) throw new Error("FORBIDDEN"); // 내 주문이 아님

        return order;
    },
    // 결제 승인 및 주문 상태 업데이트
    async confirmOrder(paymentKey: string, orderId: string, amount: number) {
        // 1. 주문 데이터 찾기 (orderId는 UUID인 orderNumber입니다)
        const order = await prisma.order.findUnique({
            where: { orderNumber: orderId },
            include: { payment: true },
        });

        if (!order) {
            throw new Error("ORDER_NOT_FOUND");
        }

        // 2. 금액 검증 (중요: 클라이언트 조작 방지)
        if (order.totalAmount !== amount) {
            throw new Error("AMOUNT_MISMATCH");
        }

        // 3. 토스페이먼츠 승인 API 호출
        const widgetSecretKey = process.env.TOSS_SECRET_KEY;
        const encryptedSecretKey = "Basic " + Buffer.from(widgetSecretKey + ":").toString("base64");

        try {
            // 토스 서버로 승인 요청
            const response = await axios.post(
                "https://api.tosspayments.com/v1/payments/confirm",
                {
                    paymentKey,
                    orderId,
                    amount,
                },
                {
                    headers: {
                        Authorization: encryptedSecretKey,
                        "Content-Type": "application/json",
                    },
                },
            );

            // 4. 승인 성공 시 DB 업데이트 (Transaction)
            const updatedOrder = await prisma.$transaction(async tx => {
                // (1) 결제 정보 업데이트
                await tx.payment.update({
                    where: { orderId: order.id }, // Order모델의 PK로 찾음
                    data: {
                        status: "DONE", // 결제 완료
                        paymentKey: paymentKey, // 추후 취소 시 필요
                        method: response.data.method, // 카드, 가상계좌 등
                        approvedAt: new Date(response.data.approvedAt),
                    },
                });

                // (2) 주문 상태 업데이트
                const result = await tx.order.update({
                    where: { id: order.id },
                    data: {
                        status: OrderStatus.PAID, // 주문 완료
                    },
                    include: { payment: true, items: true }, // 응답용
                });

                return result;
            });

            return updatedOrder;
        } catch (error: any) {
            // 토스 승인 실패 시 (잔액 부족, 한도 초과 등)
            // 주문 상태를 취소나 실패로 변경해도 됨 (선택사항)
            console.error("Toss Confirm Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "PAYMENT_CONFIRM_FAILED");
        }
    },
};
