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

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

export { io };
