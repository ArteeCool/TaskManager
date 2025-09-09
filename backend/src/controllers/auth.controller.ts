import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
