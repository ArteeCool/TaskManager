import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

export const initSocket = (server: any) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: ["https://arteecool.com.ua", "http://localhost:5173"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("joinBoard", (boardId) => {
            socket.join(`board_${boardId}`);
        });

        socket.on("disconnect", (reason) => {
            console.log(`User disconnected: ${socket.id} (${reason})`);
        });

        socket.on("error", (err) => {
            console.error(`Socket error from ${socket.id}:`, err);
        });
    });

    io.on("error", (err) => {
        console.error("Socket.IO server error:", err);
    });

    return io;
};

export { io };
