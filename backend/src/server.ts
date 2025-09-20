import express from "express";
import http from "http";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import { connectDB, dbInit, disconnectDB } from "./database/db.ts";

import authRouter from "./routes/auth.route.ts";
import profileRouter from "./routes/profile.route.ts";
import boardsRouter from "./routes/boards.route.ts";
import tasksRouter from "./routes/tasks.route.ts";
import listsRouter from "./routes/lists.route.ts";
import invitationController from "./routes/invitation.route.ts";

import { initSocket } from "./websockets/board.socket.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5678;

export const server = http.createServer(app);

app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        origin: ["https://arteecool.com.ua", "http://localhost:5173"],
        credentials: true,
    })
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    legacyHeaders: false,
    ipv6Subnet: 60,
});

app.use(limiter);

app.use("/api/images", express.static(path.join(process.cwd(), "images")));

app.use("/api/auth/", authRouter);
app.use("/api/profile/", profileRouter);
app.use("/api/boards/", boardsRouter);
app.use("/api/tasks/", tasksRouter);
app.use("/api/lists/", listsRouter);
app.use("/api/board-invites/", invitationController);

initSocket(server);

server
    .listen(PORT as number, "0.0.0.0", async () => {
        console.log(`Server started on port ${PORT}`);
        await dbInit();
        await connectDB();
    })
    .on("close", () => {
        disconnectDB();
        console.log("Server stopped");
    });
