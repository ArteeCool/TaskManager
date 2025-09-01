import express from "express";
import {
    signUp,
    logIn,
    getMe,
    logOut,
} from "../controllers/auth.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";

const app = express.Router();

app.post("/sign-up", signUp);
app.post("/log-in", logIn);
app.get("/log-out", authMiddleware, logOut);
app.get("/me", authMiddleware, getMe);

export default app;
