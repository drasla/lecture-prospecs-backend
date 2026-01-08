import express from "express";
import swaggerUi from "swagger-ui-express";
import { specs } from "./swagger.config";

const app = express();
const port = 4001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});