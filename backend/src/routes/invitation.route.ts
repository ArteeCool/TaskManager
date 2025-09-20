import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
    sendInvite,
    acceptInvite,
} from "../controllers/invitation.controller.ts";

const router = Router();

router.post("/send-invite/:id", authMiddleware, sendInvite);
router.get("/accept-invite/:id", authMiddleware, acceptInvite);

export default router;
