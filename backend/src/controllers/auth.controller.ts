import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { queryDB } from "../database/db.ts";
import { type Request, type Response } from "express";
import { generateRandomString } from "../utils/index.ts";
import { type MutatedRequest } from "../types/auth.types.ts";
import { sendEmail } from "./email.controller.ts";

export const signUp = async (req: Request, res: Response) => {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const existingUser = await queryDB(
            "SELECT * FROM users WHERE email = $1;",
            [email]
        );

        if (existingUser && existingUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const confirmationKey = generateRandomString(64);

        const roles = ["user"];

        const avatarurl = `${process.env.SERVER_URL}/api/images/default.png`;

        await queryDB(
            "INSERT INTO users (fullname, email, password, avatarurl, roles, confirmation_key) VALUES ($1, $2, $3, $4, $5, $6);",
            [fullname, email, hashedPassword, avatarurl, roles, confirmationKey]
        );

        const confirmationLink = `${process.env.CLIENT_URL}/email-confirmation?key=${confirmationKey}`;

        sendEmail(
            email,
            "Email Confirmation",
            `<p>Thank you for signing up, ${fullname}!</p>
            <p>Please confirm your email by clicking the link below:</p>
            <a href="${confirmationLink}">Confirm Email</a>`
        ).catch((err) => console.error("Email error:", err));

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
            error: error,
        });
    }
};

export const logIn = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const user = await queryDB("SELECT * FROM users WHERE email = $1;", [
            email,
        ]);

        if (!user || user.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const { password: hashedPassword, id } = user.rows[0];

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id }, process.env.JWT_SECRET as string, {
            expiresIn: "1d",
        });

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.status(200).json({ message: "User logged in successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
            error: error,
        });
    }
};

export const logOut = async (req: MutatedRequest, res: Response) => {
    res.clearCookie("token");
    res.status(200).json({ message: "User logged out successfully" });
};

export const getMe = async (req: MutatedRequest, res: Response) => {
    const userId = req.user.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const user = await queryDB(
            "SELECT id, fullname, email, avatarurl, roles, confirmation_key FROM users WHERE id = $1;",
            [userId]
        );

        if (!user || user.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        res.status(200).json(user.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
            error: error,
        });
    }
};

export const confirmEmail = async (req: Request, res: Response) => {
    const { key } = req.query;

    if (!key || typeof key !== "string") {
        return res.status(400).json({ message: "Invalid confirmation key" });
    }

    try {
        const user = await queryDB(
            "SELECT * FROM users WHERE confirmation_key = $1;",
            [key]
        );

        if (!user || user.rows.length === 0) {
            return res
                .status(400)
                .json({ message: "Invalid confirmation key" });
        }

        await queryDB(
            "UPDATE users SET confirmation_key = NULL WHERE confirmation_key = $1;",
            [key]
        );

        res.status(200).json({ message: "Email confirmed successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
            error: error,
        });
    }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const result = await queryDB("SELECT * FROM users WHERE email = $1;", [
            email,
        ]);
        const user = result?.rows[0];

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await queryDB(
            `UPDATE users 
             SET reset_password_token = $1, reset_password_expires = $2 
             WHERE id = $3;`,
            [hashedToken, expires, user.id]
        );

        const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        await sendEmail(
            user.email,
            "Password Reset Request",
            `
                <h2>Password Reset</h2>
                <p>Click the link below to reset your password:</p>
                <a href="${resetURL}">${resetURL}</a>
                <p>This link will expire in 15 minutes.</p>
            `
        );

        return res.json({ message: "Password reset email sent" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res
                .status(400)
                .json({ message: "Token and password are required" });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const result = await queryDB(
            `SELECT * FROM users 
             WHERE reset_password_token = $1 AND reset_password_expires > $2;`,
            [hashedToken, new Date(Date.now())]
        );

        const user = result?.rows[0];
        if (!user) {
            return res
                .status(400)
                .json({ message: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await queryDB(
            `UPDATE users 
             SET password = $1, reset_password_token = NULL, reset_password_expires = NULL 
             WHERE id = $2;`,
            [hashedPassword, user.id]
        );

        return res.json({ message: "Password successfully reset" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
