import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { createBoard, getBoards } from "../controllers/boards.controller.ts";

const app = express.Router();

app.post("/create", authMiddleware, createBoard);
app.get("/get", authMiddleware, getBoards);

export default app;
