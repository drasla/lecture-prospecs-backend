import { prisma } from "../config/prisma";

export const cartService = {
    // 1. 장바구니 가져오기 (없으면 생성)
    async getCart(userId: number) {
        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        productSize: {
                            include: {
                                productColor: {
                                    include: {
                                        product: true, // 상품 정보 (이름, 가격 등)
                                        images: true, // 이미지
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        // 장바구니가 없으면 빈 장바구니 생성
        if (!cart) {
            cart = (await prisma.cart.create({
                data: { userId },
                include: { items: true }, // 타입 맞추기용 (빈 배열)
            })) as any;
        }

        return cart;
    },

    // 2. 장바구니 담기
    async addToCart(userId: number, productSizeId: number, quantity: number) {
        // 1) 장바구니 확보
        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { userId } });
        }

        // 2) 이미 담겨있는지 확인
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
    async updateQuantity(cartItemId: number, quantity: number) {
        return prisma.cartItem.update({
            where: { id: cartItemId },
            data: { quantity },
        });
    },

    // 4. 삭제
    async removeItem(cartItemId: number) {
        return prisma.cartItem.delete({
            where: { id: cartItemId },
        });
    },
};
