import express from "express";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/authRoutes";
import { specs } from "./config/swagger";
import { validateClientKey } from "./middlewares/clientAuthMiddleware";
import passport from "passport";
import { jwtStrategy } from "./config/passport";

const app = express();
const PORT = 4001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
passport.use(jwtStrategy); // 전략 등록

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(validateClientKey);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    console.log(`📄 Swagger Docs available at http://localhost:${PORT}/api-docs`);
});