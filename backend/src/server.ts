import express from "express";
/* import https from "https";
import fs from "fs"; */
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import { connectDB, dbInit, disconnectDB, queryDB } from "./database/db.ts";

import authRouter from "./routes/auth.route.ts";
import profileRouter from "./routes/profile.route.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5678;

/* const server = https.createServer(
    {
        key: fs.readFileSync("./certs/arteecool.com.ua-key.pem"),
        cert: fs.readFileSync("./certs/arteecool.com.ua-crt.pem"),
        ca: fs.readFileSync("./certs/arteecool.com.ua-chain.pem"),
        passphrase: process.env.SSL_PASSPHRASE || "",
    },
    app
); */

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
    limit: 150,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: 60,
});

app.use(limiter);

app.use("/api/images", express.static(path.join(process.cwd(), "images")));

app.use("/api/auth/", authRouter);
app.use("/api/profile/", profileRouter);

app.listen(PORT as number, "0.0.0.0", async () => {
    console.log(`Server started on port ${PORT}`);
    await dbInit();
    await connectDB();
}).on("close", () => {
    disconnectDB();
    console.log("Server stopped");
});
