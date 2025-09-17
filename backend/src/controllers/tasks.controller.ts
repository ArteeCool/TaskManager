import type { Response } from "express";
import { queryDB } from "../database/db.ts";
import type { MutatedRequest } from "../types/auth.types.ts";
import { io } from "../websockets/board.socket.ts";

export const createTask = async (req: MutatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { title, list_id } = req.body;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!title || !list_id)
            return res
                .status(400)
                .json({ message: "title and list_id required" });

        const boardRes = await queryDB(
            "SELECT board_id FROM lists WHERE id = $1",
            [list_id]
        );
        const boardId = boardRes?.rows[0]?.board_id;
        if (!boardId)
            return res.status(404).json({ message: "List not found" });

        const userBoardRes = await queryDB(
            "SELECT board_id FROM board_users WHERE user_id = $1 AND board_id = $2",
            [userId, boardId]
        );
        if (!userBoardRes?.rows.length)
            return res.status(403).json({ message: "Not your board" });

        const result = await queryDB(
            "INSERT INTO tasks (title, list_id) VALUES ($1, $2) RETURNING *;",
            [title, list_id]
        );

        io.to(`board_${boardId}`).emit("taskCreated", result?.rows[0]);

        res.status(201).json({
            message: "Task created",
            task: result?.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

export const updateTaskBatch = async (req: MutatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const tasks: {
            id: number;
            title?: string;
            list_id?: number;
            position?: number;
        }[] = req.body.tasks;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!Array.isArray(tasks) || tasks.length === 0)
            return res.status(400).json({ message: "No tasks to update" });

        const updatedTasks: any[] = [];

        for (const task of tasks) {
            const taskId = task.id;

            const taskRes = await queryDB(
                "SELECT list_id FROM tasks WHERE id = $1",
                [taskId]
            );
            const currentListId = taskRes?.rows[0]?.list_id;
            if (!currentListId) continue;

            const boardRes = await queryDB(
                "SELECT board_id FROM lists WHERE id = $1",
                [task.list_id || currentListId]
            );
            const boardId = boardRes?.rows[0]?.board_id;

            const userBoardRes = await queryDB(
                "SELECT board_id FROM board_users WHERE user_id = $1 AND board_id = $2",
                [userId, boardId]
            );
            if (!userBoardRes?.rows.length) continue;

            const result = await queryDB(
                `UPDATE tasks SET
                    title = COALESCE($1, title),
                    list_id = COALESCE($2, list_id),
                    position = COALESCE($3, position)
                 WHERE id = $4
                 RETURNING *, $5 AS board_id;`,
                [task.title, task.list_id, task.position, taskId, boardId]
            );

            if (result?.rows[0]) updatedTasks.push(result.rows[0]);
        }

        if (updatedTasks.length > 0) {
            const boardIdSet = new Set(
                updatedTasks.map((t: any) => t.board_id)
            );
            boardIdSet.forEach((boardId) =>
                io.to(`board_${boardId}`).emit("tasksUpdated", updatedTasks)
            );
        }

        res.status(200).json({ message: "Tasks updated", tasks: updatedTasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

export const deleteTask = async (req: MutatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const taskId = Number(req.params.id);

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const taskRes = await queryDB(
            "SELECT list_id FROM tasks WHERE id = $1",
            [taskId]
        );
        const listId = taskRes?.rows[0]?.list_id;
        if (!listId) return res.status(404).json({ message: "Task not found" });

        const boardRes = await queryDB(
            "SELECT board_id FROM lists WHERE id = $1",
            [listId]
        );
        const boardId = boardRes?.rows[0]?.board_id;

        const userBoardRes = await queryDB(
            "SELECT board_id FROM board_users WHERE user_id = $1 AND board_id = $2",
            [userId, boardId]
        );
        if (!userBoardRes?.rows.length)
            return res.status(403).json({ message: "Not your board" });

        await queryDB("DELETE FROM tasks WHERE id = $1", [taskId]);

        io.to(`board_${boardId}`).emit("taskDeleted", taskId);

        res.status(200).json({ message: "Task deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
