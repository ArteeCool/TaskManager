import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
    createTask,
    updateTaskBatch,
    deleteTask,
} from "../controllers/tasks.controller.ts";

const router = Router();

router.post("/create", authMiddleware, createTask);
router.put("/batch-update/", authMiddleware, updateTaskBatch);
router.delete("/delete/:id", authMiddleware, deleteTask);

export default router;
