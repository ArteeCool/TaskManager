import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type MutatedRequest } from "../types/auth.types.ts";

export const authMiddleware = (
    req: MutatedRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.cookies.token;

    if (!token) {
        return res
            .status(401)
            .json({ message: "Token invalid or not provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = decoded;

        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
            error: error,
        });
    }
};
