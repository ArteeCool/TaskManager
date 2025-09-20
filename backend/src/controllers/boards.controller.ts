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
                (SELECT COUNT(*) FROM tasks WHERE board_id = b.id) AS tasks_count
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
        const lists = listsResult?.rows || [];

        const listIds = lists.map((l) => l.id);
        let tasks: any[] = [];

        if (listIds.length > 0) {
            const tasksQuery = `
                SELECT t.*
                FROM tasks t
                WHERE t.list_id = ANY($1::int[])
                ORDER BY t.position;
            `;
            const tasksResult = await queryDB(tasksQuery, [listIds]);
            tasks = tasksResult?.rows || [];

            const taskIds = tasks.map((t) => t.id);
            let assigneesMap: Record<
                number,
                Array<{
                    id: number;
                    fullname: string;
                    email: string;
                    avatarurl: string;
                }>
            > = {};
            if (taskIds.length > 0) {
                const assigneesRes = await queryDB(
                    `
                    SELECT 
                    ta.task_id,
                    u.id as user_id,
                    u.fullname,
                    u.email,
                    u.avatarurl
                    FROM task_assignees ta
                    LEFT JOIN users u ON u.id = ta.user_id
                    WHERE ta.task_id = ANY($1::int[])
                    `,
                    [taskIds]
                );
                assigneesRes?.rows.forEach((row) => {
                    if (!assigneesMap[row.task_id])
                        assigneesMap[row.task_id] = [];
                    assigneesMap[row.task_id].push({
                        id: row.user_id,
                        fullname: row.fullname,
                        email: row.email,
                        avatarurl: row.avatarurl,
                    });
                });
            }

            tasks = tasks.map((task) => ({
                ...task,
                assignees: assigneesMap[task.id] || [],
            }));
        }

        const listsWithTasks = lists.map((list) => ({
            ...list,
            tasks: tasks.filter((task) => task.list_id === list.id),
        }));

        const membersQuery = `
            SELECT u.id, u.email, u.fullname, u.avatarurl
            FROM users u
            INNER JOIN board_users bu ON bu.user_id = u.id
            WHERE bu.board_id = $1;
        `;
        const membersResult = await queryDB(membersQuery, [boardId]);
        const members = membersResult?.rows || [];

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
            members,
        });
    } catch (error) {
        console.error("Error fetching board with lists and tasks:", error);
        return res.status(500).json({
            message: "Internal server error",
            error,
        });
    }
};
