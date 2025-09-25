import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
    createList,
    updateList,
    deleteList,
} from "../controllers/lists.controller.ts";

const router = Router();

router.post("/create", authMiddleware, createList);
router.put("/update/:id", authMiddleware, updateList);
router.delete("/delete/:id", authMiddleware, deleteList);

export default router;
