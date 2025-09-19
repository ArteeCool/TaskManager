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
                bu.favorite,
                (SELECT COUNT(*) FROM board_users WHERE board_id = b.id) AS member_count,
                (SELECT COUNT(*) FROM tasks WHERE board_id = b.id) AS tasks_count
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

export const getBoard = async (req: MutatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const boardId = Number(req.params.id);

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const boardQuery = `
            SELECT 
                b.id,
                b.title,
                b.description,
                b.color_background,
                b.color_accent,
                b.last_updated,
                bu.role,
                bu.favorite,
                (SELECT COUNT(*) FROM board_users WHERE board_id = b.id) AS member_count,
                (SELECT COUNT(*) FROM tasks WHERE board_id = b.id) AS tasks_counts
            FROM boards b
            INNER JOIN board_users bu ON bu.board_id = b.id
            WHERE bu.user_id = $1 AND b.id = $2;
        `;
        const boardResult = await queryDB(boardQuery, [userId, boardId]);

        if (!boardResult?.rows.length) {
            return res.status(403).json({ message: "Not your board" });
        }

        const board = boardResult.rows[0];

        const listsQuery = `
            SELECT *
            FROM lists
            WHERE board_id = $1
            ORDER BY position;
        `;
        const listsResult = await queryDB(listsQuery, [boardId]);
        const lists = listsResult?.rows;

        const listIds = (lists || []).map((l) => l.id);
        let tasks: any[] = [];
        if (listIds.length > 0) {
            const tasksQuery = `
                SELECT *
                FROM tasks
                WHERE list_id = ANY($1::int[])
                ORDER BY position;
            `;
            const tasksResult = await queryDB(tasksQuery, [listIds]);
            tasks = tasksResult?.rows || [];
        }

        const listsWithTasks = (lists || []).map((list) => ({
            ...list,
            tasks: tasks.filter((task) => task.list_id === list.id),
        }));

        return res.status(200).json({
            board: {
                id: board.id,
                title: board.title,
                description: board.description,
                color_background: board.color_background,
                color_accent: board.color_accent,
                last_updated: board.last_updated,
                favorite: board.favorite,
                role: board.role,
                member_count: board.member_count,
                tasks_count: board.tasks_count,
            },
            lists: listsWithTasks,
        });
    } catch (error) {
        console.error("Error fetching board with lists and tasks:", error);
        return res.status(500).json({
            message: "Internal server error",
            error,
        });
    }
};

export const inviteUserToBoard = async (req: MutatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const boardId = Number(req.params.boardId);
        const { email } = req.body;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!email)
            return res.status(400).json({ message: "Email is required" });

        const isMemberRes = await queryDB(
            "SELECT 1 FROM board_users WHERE user_id = $1 AND board_id = $2",
            [userId, boardId]
        );
        if (!isMemberRes?.rows.length)
            return res.status(403).json({ message: "Not your board" });

        const userRes = await queryDB("SELECT id FROM users WHERE email = $1", [
            email,
        ]);
        const inviteeId = userRes?.rows[0]?.id;
        if (!inviteeId)
            return res.status(404).json({ message: "User not found" });

        const existsRes = await queryDB(
            "SELECT 1 FROM board_users WHERE user_id = $1 AND board_id = $2",
            [inviteeId, boardId]
        );
        if (existsRes?.rows.length)
            return res.status(400).json({ message: "User already on board" });

        await queryDB(
            "INSERT INTO board_users (user_id, board_id, role) VALUES ($1, $2, $3)",
            [inviteeId, boardId, "member"]
        );

        res.status(200).json({ message: "User invited successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error", error: err });
    }
};
