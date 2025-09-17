import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
    createList,
    getBoardListsWithTasks,
    updateList,
    deleteList,
} from "../controllers/lists.controller.ts";

const router = Router();

router.post("/create", authMiddleware, createList);
router.get("/get/:id", authMiddleware, getBoardListsWithTasks);
router.put("/update/:id", authMiddleware, updateList);
router.delete("/delete/:id", authMiddleware, deleteList);

export default router;
