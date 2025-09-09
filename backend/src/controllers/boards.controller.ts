import type { Response } from "express";
import type { MutatedRequest } from "../types/auth.types.ts";
import { queryDB } from "../database/db.ts";

export const createBoard = async (req: MutatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { title, description, colorAccent, colorBackground } = req.body;

    if (!userId) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
    }

    if (!title || !description || !colorAccent || !colorBackground) {
        return res.status(400).json({
            success: false,
            message:
                "Title, description, colorAccent, and colorBackground are required",
        });
    }

    try {
        const createBoardQuery = `
            INSERT INTO boards (title, description, color_background, color_accent)
            VALUES ($1, $2, $3, $4)
            RETURNING id;
        `;

        const result = await queryDB(createBoardQuery, [
            title,
            description,
            colorBackground,
            colorAccent,
        ]);

        if (!result?.rows?.length) {
            return res
                .status(500)
                .json({ success: false, message: "Error creating board" });
        }

        const newBoard = result.rows[0];

        const linkUserQuery = `
            INSERT INTO board_users (board_id, user_id, role)
            VALUES ($1, $2, 'owner');
        `;
        await queryDB(linkUserQuery, [newBoard.id, userId]);

        return res.status(201).json({
            success: true,
            message: "Board created successfully",
            board: newBoard,
        });
    } catch (error) {
        console.error("Error creating board:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error,
        });
    }
};

export const getBoards = async (req: MutatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const query = `
            SELECT 
                b.id,
                b.title,
                b.description,
                b.color_background,
                b.color_accent,
                b.last_updated,
                bu.role,
                bu.favorite
            FROM boards b
            INNER JOIN board_users bu ON bu.board_id = b.id
            WHERE bu.user_id = $1
            ORDER BY b.last_updated DESC;
        `;

        const result = await queryDB(query, [userId]);

        if (!result) {
            return res.status(500).json({ message: "Error fetching boards" });
        }

        if (!result.rows.length) {
            return res.status(200).json([]);
        }

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching boards:", error);
        return res.status(500).json({
            message: "Internal server error",
            error,
        });
    }
};
