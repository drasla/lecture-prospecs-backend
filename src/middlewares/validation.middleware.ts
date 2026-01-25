import { NextFunction, Request, Response } from "express";
import { ZodError, ZodObject, ZodType } from "zod";

export const validateBody =
    (schema: ZodObject<any, any>) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));

                res.status(400).json({ message: "Validation Error", errors });
                return; // 함수 종료
            }
            next(error);
        }
    };

export const validateQuery =
    (schema: ZodType) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsedQuery = await schema.parseAsync(req.query);

            for (const key in req.query) {
                delete (req.query as any)[key];
            }

            Object.assign(req.query, parsedQuery);

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map(issue => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));
                res.status(400).json({ message: "Query Validation Error", errors });
                return;
            }
            next(error);
        }
    };
