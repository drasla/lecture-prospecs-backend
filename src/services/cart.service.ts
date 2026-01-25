import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";

export const cartService = {
    // 1. 장바구니 조회
    async getCart(userId: number) {
        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    orderBy: { createdAt: "desc" }, // 최신순 정렬
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

        // 없으면 생성해서 반환
        if (!cart) {
            cart = (await prisma.cart.create({
                data: { userId },
                include: { items: true } as any, // 타입 우회 (빈 배열)
            })) as any;
        }

        return cart;
    },

    // 2. 장바구니 담기
    async addToCart(userId: number, productSizeId: number, quantity: number) {
        // 1) 유효한 상품 사이즈인지 확인
        const productSize = await prisma.productSize.findUnique({
            where: { id: productSizeId },
        });
        if (!productSize) {
            throw new HttpException(404, "존재하지 않는 상품 옵션입니다.");
        }

        // 2) 장바구니 확보
        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { userId } });
        }

        // 3) 중복 확인 및 처리
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productSizeId,
            },
        });

        if (existingItem) {
            // 이미 있으면 수량 추가
            return prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity },
            });
        } else {
            // 없으면 새로 추가
            return prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productSizeId,
                    quantity,
                },
            });
        }
    },

    // 3. 수량 변경
    async updateQuantity(userId: number, cartItemId: number, quantity: number) {
        // 내 장바구니의 아이템인지 확인 (보안)
        const item = await prisma.cartItem.findUnique({
            where: { id: cartItemId },
            include: { cart: true },
        });

        if (!item) throw new HttpException(404, "장바구니 아이템을 찾을 수 없습니다.");
        if (item.cart.userId !== userId) {
            throw new HttpException(403, "권한이 없습니다.");
        }

        return prisma.cartItem.update({
            where: { id: cartItemId },
            data: { quantity },
        });
    },

    // 4. 삭제
    async removeItem(userId: number, cartItemId: number) {
        // 권한 체크
        const item = await prisma.cartItem.findUnique({
            where: { id: cartItemId },
            include: { cart: true },
        });

        if (!item) throw new HttpException(404, "장바구니 아이템을 찾을 수 없습니다.");
        if (item.cart.userId !== userId) {
            throw new HttpException(403, "권한이 없습니다.");
        }

        return prisma.cartItem.delete({
            where: { id: cartItemId },
        });
    },
};
