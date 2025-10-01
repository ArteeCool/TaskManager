import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
    sendInvite,
    acceptInvite,
    getCurrentBoardInvites,
    cancelInvite,
} from "../controllers/invitation.controller.ts";

const router = Router();

router.post("/send-invite/:id", authMiddleware, sendInvite);
router.get("/accept-invite", authMiddleware, acceptInvite);
router.get("/current-invites/:id", authMiddleware, getCurrentBoardInvites);
router.post("cancel-invite/:id", authMiddleware, cancelInvite);

export default router;
