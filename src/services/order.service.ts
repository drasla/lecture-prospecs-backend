import { prisma } from "../config/prisma";
import { OrderStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { HttpException } from "../utils/exception.utils";
import { CreateOrderInput } from "../schemas/order.schema";
import { AdminOrderListQuery, UpdateTrackingInput } from "../schemas/admin.order.schema";

export const orderService = {
    // 1. 주문 생성 (트랜잭션)
    async createOrder(userId: number, data: CreateOrderInput) {
        return prisma.$transaction(
            async tx => {
                const orderNumber = uuidv4();
                let totalAmount = 0;
                const orderItemsData = [];

                // 2. 재고 확인 및 가격 계산
                for (const item of data.items) {
                    const productSize = await tx.productSize.findUnique({
                        where: { id: item.productSizeId },
                        include: { productColor: { include: { product: true } } },
                    });

                    if (!productSize) {
                        throw new HttpException(
                            404,
                            `상품 정보를 찾을 수 없습니다. (ID: ${item.productSizeId})`,
                        );
                    }
                    if (productSize.stock < item.quantity) {
                        throw new HttpException(
                            409,
                            `재고가 부족합니다: ${productSize.productColor.product.name} (${productSize.size})`,
                        );
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
                        userId,
                        orderNumber,
                        totalAmount,
                        status: OrderStatus.PENDING,

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

                        payment: {
                            create: {
                                method: data.paymentMethod,
                                amount: totalAmount,
                                status: "READY",
                            },
                        },
                    },
                    include: {
                        payment: true,
                    },
                });

                // 4. 장바구니 비우기 (해당 상품들만)
                const cart = await tx.cart.findUnique({ where: { userId } });
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
            { timeout: 20000 }, // 트랜잭션 타임아웃 설정
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
                payment: true, // 결제 정보 포함
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

        if (!order) throw new HttpException(404, "주문을 찾을 수 없습니다.");
        if (order.userId !== userId)
            throw new HttpException(403, "해당 주문에 대한 권한이 없습니다.");

        return order;
    },

    // 4. 결제 승인
    async confirmOrder(paymentKey: string, orderId: string, amount: number) {
        const order = await prisma.order.findUnique({
            where: { orderNumber: orderId },
            include: { payment: true },
        });

        if (!order) {
            throw new HttpException(404, "주문 정보를 찾을 수 없습니다.");
        }

        if (order.totalAmount !== amount) {
            throw new HttpException(400, "결제 금액이 일치하지 않습니다.");
        }

        const widgetSecretKey = process.env.TOSS_SECRET_KEY;
        const encryptedSecretKey = "Basic " + Buffer.from(widgetSecretKey + ":").toString("base64");

        try {
            const response = await axios.post(
                "https://api.tosspayments.com/v1/payments/confirm",
                { paymentKey, orderId, amount },
                {
                    headers: {
                        Authorization: encryptedSecretKey,
                        "Content-Type": "application/json",
                    },
                },
            );

            // DB 업데이트
            return await prisma.$transaction(async tx => {
                await tx.payment.update({
                    where: { orderId: order.id },
                    data: {
                        status: "DONE",
                        paymentKey: paymentKey,
                        method: response.data.method,
                        approvedAt: new Date(response.data.approvedAt),
                    },
                });

                return await tx.order.update({
                    where: { id: order.id },
                    data: { status: OrderStatus.PAID },
                    include: { payment: true, items: true },
                });
            });
        } catch (error: any) {
            console.error("Toss Confirm Error:", error.response?.data || error.message);
            // 토스 에러 메시지를 그대로 전달하거나 커스텀 메시지 사용
            throw new HttpException(
                400,
                error.response?.data?.message || "결제 승인 처리에 실패했습니다.",
            );
        }
    },

    async cancelOrder(userId: number, orderId: number, reason: string) {
        // 1. 주문 조회 (결제정보, 아이템 포함)
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                payment: true,
                items: true, // 재고 복구를 위해 필요
            },
        });

        if (!order) throw new HttpException(404, "주문을 찾을 수 없습니다.");
        if (order.userId !== userId)
            throw new HttpException(403, "해당 주문에 대한 권한이 없습니다.");

        // 2. 취소 가능 상태 확인
        // PENDING(입금대기/결제전) 혹은 PAID(결제완료) 상태만 취소 가능
        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAID) {
            throw new HttpException(
                400,
                "이미 배송 준비 중이거나 배송된 상품은 취소할 수 없습니다. (반품 문의 필요)",
            );
        }

        // 3. 결제가 완료된 상태(PAID)라면 PG사 결제 취소 API 호출
        if (order.status === OrderStatus.PAID && order.payment?.paymentKey) {
            const widgetSecretKey = process.env.TOSS_SECRET_KEY;
            const encryptedSecretKey =
                "Basic " + Buffer.from(widgetSecretKey + ":").toString("base64");

            try {
                // 토스 결제 취소 API
                await axios.post(
                    `https://api.tosspayments.com/v1/payments/${order.payment.paymentKey}/cancel`,
                    { cancelReason: reason },
                    {
                        headers: {
                            Authorization: encryptedSecretKey,
                            "Content-Type": "application/json",
                        },
                    },
                );
            } catch (error: any) {
                console.error("Toss Cancel Error:", error.response?.data || error.message);
                throw new HttpException(500, "PG사 결제 취소 연동 중 오류가 발생했습니다.");
            }
        }

        // 4. DB 상태 업데이트 및 재고 복구 (Transaction)
        return prisma.$transaction(async tx => {
            // (1) 주문 상태 변경 -> CANCELED
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.CANCELED },
            });

            // (2) 결제 상태 변경 (결제 정보가 있다면) -> CANCELED
            if (order.payment) {
                await tx.payment.update({
                    where: { orderId: orderId },
                    data: { status: "CANCELED" },
                });
            }

            // (3) 재고 복구 (Loop)
            // 주문했던 수량만큼 ProductSize.stock을 다시 증가시킴
            for (const item of order.items) {
                await tx.productSize.update({
                    where: { id: item.productSizeId },
                    data: {
                        stock: { increment: item.quantity },
                    },
                });
            }

            return updatedOrder;
        });
    },

    // ------------------------------------------------
    // [Admin] 전체 주문 목록 조회 (검색/필터)
    // ------------------------------------------------
    async getAdminOrders(params: AdminOrderListQuery) {
        const { page, limit, status, search } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        // 1. 상태 필터
        if (status) {
            where.status = status;
        }

        // 2. 검색 (주문번호 or 수령인명)
        if (search) {
            where.OR = [
                { orderNumber: { contains: search } }, // mysql은 contains가 대소문자 구분 안할 수 있음 (설정따라 다름)
                { recipientName: { contains: search } },
            ];
        }

        const [total, orders] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    payment: true,
                    // 리스트에서는 아이템 정보까지 다 불러오면 무거울 수 있으니 필요하면 include, 아니면 제외
                    items: {
                        take: 1, // 대표 아이템 1개만 보여주거나
                        include: {
                            productSize: {
                                include: { productColor: { include: { product: true } } },
                            },
                        },
                    },
                },
            }),
        ]);

        return {
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
            data: orders,
        };
    },

    // ------------------------------------------------
    // [Admin] 주문 상세 (관리자용은 권한 체크 없이 모든 주문 조회)
    // ------------------------------------------------
    async getAdminOrderDetail(orderId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                payment: true,
                items: {
                    include: {
                        productSize: {
                            include: {
                                productColor: {
                                    include: { product: true, images: true },
                                },
                            },
                        },
                    },
                },
                user: {
                    // 주문자 정보도 같이 조회
                    select: { id: true, email: true, name: true, phone: true },
                },
            },
        });

        if (!order) throw new HttpException(404, "주문을 찾을 수 없습니다.");
        return order;
    },

    // ------------------------------------------------
    // [Admin] 상태 변경
    // ------------------------------------------------
    async updateStatus(orderId: number, status: OrderStatus) {
        // 존재 여부 확인
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new HttpException(404, "주문을 찾을 수 없습니다.");

        return prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { payment: true },
        });
    },

    // ------------------------------------------------
    // [Admin] 운송장 입력 (입력 시 자동으로 SHIPPED 처리)
    // ------------------------------------------------
    async updateTracking(orderId: number, data: UpdateTrackingInput) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new HttpException(404, "주문을 찾을 수 없습니다.");

        return prisma.order.update({
            where: { id: orderId },
            data: {
                carrier: data.carrier,
                trackingNumber: data.trackingNumber,
                status: OrderStatus.SHIPPED, // 운송장이 나오면 배송중
            },
            include: { payment: true },
        });
    },
};
