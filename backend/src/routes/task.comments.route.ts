import express from "express";
import {
    createTaskComment,
    updateTaskComment,
    deleteTaskComment,
} from "../controllers/task.comments.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";

const router = express.Router();

router.post("/create", authMiddleware, createTaskComment);
router.put("/update/:commentId", authMiddleware, updateTaskComment);
router.delete("/delete/:commentId", authMiddleware, deleteTaskComment);

export default router;
