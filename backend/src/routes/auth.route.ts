import express from "express";
import {
    signUp,
    logIn,
    getMe,
    logOut,
    confirmEmail,
    requestPasswordReset,
    resetPassword,
} from "../controllers/auth.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";

const router = express.Router();

router.post("/sign-up", signUp);
router.post("/log-in", logIn);
router.get("/log-out", authMiddleware, logOut);

router.get("/me", authMiddleware, getMe);

router.get("/confirm-email", confirmEmail);

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

export default router;
