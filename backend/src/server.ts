import express from "express";
import https from "https";
import fs from "fs";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import { connectDB, dbInit, disconnectDB } from "./database/db.ts";

import authRouter from "./routes/auth.route.ts";
import profileRouter from "./routes/profile.route.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5678;

const server = https.createServer(
    {
        key: fs.readFileSync("../certs/arteecool.com.ua-key.pem"),
        cert: fs.readFileSync("../certs/arteecool.com.ua-crt.pem"),
        ca: fs.readFileSync("../certs/arteecool.com.ua-chain.pem"),
        passphrase: process.env.SSL_PASSPHRASE || "",
    },
    app
);

app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        origin: [
            "https://arteecool.com.ua",
            "https://26.160.187.155",
            "https://localhost",
            "http://localhost",
        ],
        credentials: true,
    })
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 150,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: 60,
});

app.use(limiter);

app.use("/images", express.static(path.join(process.cwd(), "images")));

app.use("/api/auth/", authRouter);
app.use("/api/profile/", profileRouter);
server
    .listen(PORT as number, async () => {
        console.log(`Server is running on port ${PORT}`);
        await dbInit();
        await connectDB();
    })
    .on("error", async (err) => {
        await disconnectDB();
        console.error("Server error:", err);
        process.exit(1);
    });
