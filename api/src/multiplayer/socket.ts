import { Server } from "socket.io";

export function initSocket(io: Server) {
  io.on("connect", (socket) => {
    console.log(`Connected: ${socket.id}`);
  });
}
