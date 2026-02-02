import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import { validateClientKey } from "./middlewares/clientAuthMiddleware";
import passport from "passport";
import { jwtStrategy } from "./config/passport";
import adminCategoryRoutes from "./routes/admin.category.routes";
import adminOrderRoutes from "./routes/admin.order.routes";
import adminProductRoutes from "./routes/admin.product.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import { generateOpenApiDocs } from "./config/openApi";
import { apiReference } from "@scalar/express-api-reference";
import { errorMiddleware } from "./middlewares/error.middleware";
import "./schemas/auth.schema";
import "./schemas/category.schema";
import "./schemas/product.schema";
import "./schemas/cart.schema";
import "./schemas/order.schema";
import "./schemas/admin.category.schema";
import "./schemas/admin.product.schema";
import "./schemas/admin.order.schema";
import uploadRoutes from "./routes/upload.routes";
import reviewRoute from "./routes/review.route";
import inquiryRoutes from "./routes/inquiry.routes";
import adminInquiryRoutes from "./routes/admin.inquiry.routes";

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
passport.use(jwtStrategy); // 전략 등록

const openApiDocument = generateOpenApiDocs();

app.use(
    "/api-docs",
    apiReference({
        spec: { content: openApiDocument },
        theme: "purple",
    }),
);

app.use(validateClientKey);
app.use("/api/auth", authRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/admin/inquiries", adminInquiryRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api", reviewRoute);

app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    console.log(`📄 Scalar Docs available at http://localhost:${PORT}/api-docs`);
});
