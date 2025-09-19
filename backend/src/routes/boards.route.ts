import express, { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
    createBoard,
    getBoards,
    inviteUserToBoard,
    getBoard,
} from "../controllers/boards.controller.ts";

const router = express.Router();

router.post("/create", authMiddleware, createBoard);
router.get("/get", authMiddleware, getBoards);
router.get("/get/:id", authMiddleware, getBoard);
router.post("/:boardId/invite", authMiddleware, inviteUserToBoard);

export default router;
