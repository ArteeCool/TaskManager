import { type Response } from "express";
import { type MutatedRequest } from "../types/auth.types.ts";
import { queryDB } from "../database/db.ts";
import { io } from "../websockets/board.socket.ts";

const getTaskWithComments = async (taskId: number) => {
    const taskRes = await queryDB(`SELECT * FROM tasks WHERE id = $1`, [
        taskId,
    ]);
    if (!taskRes?.rows[0]) return null;

    const commentsRes = await queryDB(
        `SELECT 
            c.id,
            c.task_id,
            c.content,
            c.created_at,
            json_build_object(
                'id', u.id,
                'fullname', u.fullname,
                'email', u.email,
                'avatarurl', u.avatarurl
            ) as author
        FROM comments c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC`,
        [taskId]
    );

    return {
        ...taskRes.rows[0],
        comments: commentsRes?.rows || [],
    };
};

export const createTaskComment = async (req: MutatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { taskId, content } = req.body;

    try {
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!taskId)
            return res.status(400).json({ message: "Task ID is required" });
        if (!content)
            return res.status(400).json({ message: "Content is required" });

        const result = await queryDB(
            `INSERT INTO comments (task_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING 
                 id,
                 task_id,
                 user_id,
                 content,
                 created_at,
                 (SELECT json_build_object(
                     'id', users.id,
                     'fullname', users.fullname,
                     'email', users.email,
                     'avatarurl', users.avatarurl
                 ) FROM users WHERE users.id = $2) as author`,
            [taskId, userId, content]
        );

        const comment = result?.rows[0];

        const taskRes = await queryDB(
            "SELECT list_id FROM tasks WHERE id = $1",
            [comment.task_id]
        );
        const listId = taskRes?.rows[0]?.list_id;

        const boardRes = await queryDB(
            "SELECT board_id FROM lists WHERE id = $1",
            [listId]
        );
        const boardId = boardRes?.rows[0]?.board_id;

        io.to(`board_${boardId}`).emit("commentCreated", comment);

        return res.status(201).json({
            message: "Comment created successfully",
            comment,
        });
    } catch (error) {
        console.error("Error creating comment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const updateTaskComment = async (req: MutatedRequest, res: Response) => {
    const userId = req.user?.id;
    const commentId = Number(req.params.commentId);
    const { content } = req.body;

    try {
        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!content)
            return res.status(400).json({ message: "Content is required" });

        const ownership = await queryDB(
            `SELECT id, task_id FROM comments WHERE id = $1 AND user_id = $2`,
            [commentId, userId]
        );
        if (!ownership?.rows.length) {
            return res
                .status(403)
                .json({ message: "You cannot edit this comment" });
        }

        const result = await queryDB(
            `UPDATE comments SET content = $1 WHERE id = $2 RETURNING *;`,
            [content, commentId]
        );

        const updatedTask = await getTaskWithComments(result?.rows[0].task_id);

        if (!updatedTask)
            return res.status(404).json({ message: "Task not found" });

        const boardRes = await queryDB(
            "SELECT board_id FROM lists WHERE id = $1",
            [updatedTask.list_id]
        );
        const boardId = boardRes?.rows[0]?.board_id;

        if (boardId)
            io.to(`board_${boardId}`).emit("tasksUpdated", [updatedTask]);

        return res.status(200).json({
            message: "Comment updated successfully",
            comment: result?.rows[0],
        });
    } catch (error) {
        console.error("Error updating comment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteTaskComment = async (req: MutatedRequest, res: Response) => {
    const userId = req.user?.id;
    const commentId = Number(req.params.commentId);

    try {
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const commentRes = await queryDB(
            `SELECT id, task_id, user_id FROM comments WHERE id = $1`,
            [commentId]
        );
        const comment = commentRes?.rows[0];
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        if (comment.user_id !== userId)
            return res
                .status(403)
                .json({ message: "You cannot delete this comment" });

        await queryDB(`DELETE FROM comments WHERE id = $1`, [commentId]);

        const updatedTask = await getTaskWithComments(comment.task_id);

        if (!updatedTask)
            return res.status(404).json({ message: "Task not found" });

        const boardRes = await queryDB(
            "SELECT board_id FROM lists WHERE id = $1",
            [updatedTask.list_id]
        );
        const boardId = boardRes?.rows[0]?.board_id;

        if (boardId)
            io.to(`board_${boardId}`).emit("tasksUpdated", [updatedTask]);

        return res.status(200).json({
            message: "Comment deleted successfully",
            comment,
        });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
