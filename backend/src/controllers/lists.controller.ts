import type { Response } from "express";
import { queryDB } from "../database/db.ts";
import type { MutatedRequest } from "../types/auth.types.ts";
import { io } from "../websockets/board.socket.ts";

export const createList = async (req: MutatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { board_id, title } = req.body;

        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!board_id || !title)
            return res
                .status(400)
                .json({ message: "board_id and title required" });

        const boardIdNum = Number(board_id);
        if (isNaN(boardIdNum))
            return res.status(400).json({ message: "Invalid board_id" });

        const boards = await queryDB(
            "SELECT board_id FROM board_users WHERE user_id = $1 AND board_id = $2",
            [userId, boardIdNum]
        );
        if (!boards?.rows.length)
            return res.status(403).json({ message: "Not your board" });

        const lastPositionQuery = await queryDB(
            "SELECT MAX(position) FROM lists WHERE board_id = $1;",
            [boardIdNum]
        );
        const lastPosition = (lastPositionQuery?.rows[0]?.max || 0) + 1;

        const result = await queryDB(
            `INSERT INTO lists (board_id, title, position)
             VALUES ($1, $2, $3)
             RETURNING *;`,
            [boardIdNum, title, lastPosition]
        );

        io.to(`board_${boardIdNum}`).emit("listCreated", result?.rows[0]);

        res.status(201).json({
            message: "List created",
            list: result?.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

export const getBoardListsWithTasks = async (
    req: MutatedRequest,
    res: Response
) => {
    try {
        const userId = req.user?.id;
        const board_id = Number(req.params.id);

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const boards = await queryDB(
            "SELECT board_id FROM board_users WHERE user_id = $1 AND board_id = $2",
            [userId, board_id]
        );
        if (!boards?.rows.length)
            return res.status(403).json({ message: "Not your board" });

        const listsResult = await queryDB(
            "SELECT * FROM lists WHERE board_id = $1 ORDER BY position;",
            [board_id]
        );

        const listIds = listsResult?.rows.map((list) => list.id) || [];
        let tasksResult = { rows: [] } as any;

        if (listIds.length > 0) {
            const taskRes = await queryDB(
                "SELECT * FROM tasks WHERE list_id = ANY($1::int[]) ORDER BY position;",
                [listIds]
            );
            tasksResult = taskRes;
        }

        const listsWithTasks = listsResult?.rows.map((list) => ({
            ...list,
            tasks: tasksResult.rows.filter(
                (task: any) => task.list_id === list.id
            ),
        }));

        res.status(200).json(listsWithTasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

export const updateList = async (req: MutatedRequest, res: Response) => {
    const userId = req.user?.id;
    const listId = Number(req.params.id);
    const { position } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (position === undefined || position === null)
        return res.status(400).json({ message: "Position is required" });

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const boardRes = await queryDB(
                "SELECT board_id, position FROM lists WHERE id = $1",
                [listId]
            );
            const row = boardRes?.rows[0];
            if (!row)
                return res.status(404).json({ message: "List not found" });

            const { board_id, position: oldPosition } = row;

            const access = await queryDB(
                "SELECT 1 FROM board_users WHERE user_id = $1 AND board_id = $2",
                [userId, board_id]
            );
            if (!access?.rows.length)
                return res.status(403).json({ message: "Not your board" });

            await queryDB("BEGIN");

            await queryDB(
                "SELECT id FROM lists WHERE board_id = $1 ORDER BY position FOR UPDATE",
                [board_id]
            );

            if (position < oldPosition) {
                await queryDB(
                    `UPDATE lists
                     SET position = position + 1
                     WHERE board_id = $1
                       AND position >= $2 AND position < $3
                       AND id <> $4`,
                    [board_id, position, oldPosition, listId]
                );
            } else if (position > oldPosition) {
                await queryDB(
                    `UPDATE lists
                     SET position = position - 1
                     WHERE board_id = $1
                       AND position <= $2 AND position > $3
                       AND id <> $4`,
                    [board_id, position, oldPosition, listId]
                );
            }

            const updateRes = await queryDB(
                "UPDATE lists SET position = $1 WHERE id = $2 RETURNING *",
                [position, listId]
            );

            await queryDB("COMMIT");

            io.to(`board_${board_id}`).emit("listUpdated", updateRes?.rows[0]);

            return res.status(200).json({
                message: "List moved",
                list: updateRes?.rows[0],
            });
        } catch (error: any) {
            await queryDB("ROLLBACK");
            if (error.code === "40P01" && attempt < 2) continue;
            console.error(error);
            return res
                .status(500)
                .json({ message: "Internal server error", error });
        }
    }
};

export const deleteList = async (req: MutatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const listId = Number(req.params.id);

        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const boardRes = await queryDB(
            "SELECT board_id FROM lists WHERE id = $1",
            [listId]
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

        await queryDB("DELETE FROM lists WHERE id = $1;", [listId]);
        await queryDB("DELETE FROM tasks WHERE list_id = $1;", [listId]);

        io.to(`board_${boardId}`).emit("listDeleted", listId);

        res.status(200).json({ message: "List deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
