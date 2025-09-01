import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { queryDB } from "../database/db.ts";
import { type MutatedRequest } from "../types/auth.types.ts";

export const getPublicProfile = async (req: Request, res: Response) => {
    const userId = req.params.id;
    const result = await queryDB(
        "SELECT fullname, avatarurl FROM users WHERE id = $1",
        [userId]
    );

    if (!result || result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ data: result.rows[0] });
};

export const updateProfile = async (req: MutatedRequest, res: Response) => {
    const userId = req.user.id;

    const { fullname, email, currentPassword, newPassword, confirmPassword } =
        req.body;

    if (!fullname && !email && !currentPassword && !newPassword && !req.file) {
        return res.status(400).json({ message: "No fields to update" });
    }

    const fieldsMap: Record<string, any> = {};
    if (fullname) fieldsMap.fullname = fullname;
    if (email) fieldsMap.email = email;

    if (req.file) {
        fieldsMap.avatarurl = `https://localhost:5678/images/${req.file.filename}`;
    }

    if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res
                .status(400)
                .json({ message: "All password fields are required" });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New password and confirmation do not match",
            });
        }

        const user = await queryDB("SELECT password FROM users WHERE id = $1", [
            userId,
        ]);
        if (!user || !user.rows[0]) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            user.rows[0].password
        );
        if (!passwordMatches) {
            return res
                .status(400)
                .json({ message: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        fieldsMap.password = hashedPassword;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const key in fieldsMap) {
        fields.push(`${key} = $${idx}`);
        values.push(fieldsMap[key]);
        idx++;
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: "Nothing to update" });
    }

    values.push(userId);

    const query = `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = $${idx}
        RETURNING id, fullname, email, avatarurl
    `;

    try {
        const updatedUser = await queryDB(query, values);
        res.status(200).json({
            message: "Profile updated successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database update failed" });
    }
};
