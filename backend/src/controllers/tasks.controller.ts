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

        const posRes = await queryDB(
            "SELECT COALESCE(MAX(position), 0) + 1 AS new_pos FROM tasks WHERE list_id = $1",
            [list_id]
        );
        const position = posRes?.rows[0].new_pos;

        const result = await queryDB(
            "INSERT INTO tasks (title, list_id, position) VALUES ($1, $2, $3) RETURNING *;",
            [title, list_id, position]
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
            assignees?: number[];
        }[] = req.body;

        tasks.forEach((t) => console.log(t));

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const updatedTasks: any[] = [];

        for (const task of tasks) {
            const taskId = task.id;

            const taskRes = await queryDB(
                "SELECT list_id, position FROM tasks WHERE id = $1",
                [taskId]
            );
            const currentTask = taskRes?.rows[0];
            if (!currentTask) continue;

            const newListId = task.list_id ?? currentTask.list_id;
            const newPosition = task.position;

            const boardRes = await queryDB(
                "SELECT board_id FROM lists WHERE id = $1",
                [newListId]
            );
            const boardId = boardRes?.rows[0]?.board_id;
            if (!boardId) continue;

            const userBoardRes = await queryDB(
                "SELECT board_id FROM board_users WHERE user_id = $1 AND board_id = $2",
                [userId, boardId]
            );
            if (!userBoardRes?.rows.length) continue;

            const updates: string[] = [];
            const values: any[] = [];
            let idx = 1;

            if (task.title !== undefined) {
                updates.push(`title = $${idx++}`);
                values.push(task.title);
            }

            if (task.list_id !== undefined) {
                updates.push(`list_id = $${idx++}`);
                values.push(task.list_id);
            }

            if (newPosition !== undefined) {
                updates.push(`position = $${idx++}`);
                values.push(newPosition);
            }

            if (updates.length > 0) {
                values.push(taskId);
                await queryDB(
                    `UPDATE tasks SET ${updates.join(", ")} WHERE id = $${idx}`,
                    values
                );
            }

            if (Array.isArray(task.assignees)) {
                await queryDB("DELETE FROM task_assignees WHERE task_id = $1", [
                    taskId,
                ]);
                for (const assigneeId of task.assignees) {
                    await queryDB(
                        "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
                        [taskId, assigneeId]
                    );
                }
            }

            const fullTaskRes = await queryDB(
                "SELECT * FROM tasks WHERE id = $1",
                [taskId]
            );
            const assigneesRes = await queryDB(
                "SELECT user_id FROM task_assignees WHERE task_id = $1",
                [taskId]
            );
            const assignees = assigneesRes?.rows.map((r) => r.user_id) || [];

            if (fullTaskRes?.rows[0]) {
                updatedTasks.push({
                    ...fullTaskRes.rows[0],
                    board_id: boardId,
                    assignees,
                });
            }
        }

        if (updatedTasks.length > 0) {
            const tasksByBoard: Record<number, any[]> = {};
            updatedTasks.forEach((t) => {
                if (!tasksByBoard[t.board_id]) tasksByBoard[t.board_id] = [];
                tasksByBoard[t.board_id].push(t);
            });

            Object.entries(tasksByBoard).forEach(([boardId, tasks]) => {
                io.to(`board_${boardId}`).emit("tasksUpdated", tasks);
            });
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

        io.to(`board_${boardId}`).emit("taskDeleted", { taskId, listId });

        res.status(200).json({ message: "Task deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
