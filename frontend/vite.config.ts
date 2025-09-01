import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: "localhost",
        port: 443,
        https: {
            key: fs.readFileSync(
                path.resolve("../certs/arteecool.com.ua-key.pem")
            ),
            cert: fs.readFileSync(
                path.resolve("../certs/arteecool.com.ua-crt.pem")
            ),
            passphrase: "1234567890",
        },
        hmr: {
            host: "localhost",
            protocol: "wss",
        },
    },
    resolve: {
        alias: {
            "@": "/src",
        },
    },
});
