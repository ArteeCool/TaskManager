import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
    getPublicProfile,
    updateProfile,
} from "../controllers/profile.controller.ts";
import { upload } from "../middleware/upload.middleware.ts";

const router = express.Router();

router.get("/get-public/:id", getPublicProfile);
router.put("/update", authMiddleware, upload.single("avatar"), updateProfile);

export default router;
