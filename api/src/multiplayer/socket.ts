import { Server } from "socket.io";
import cookie from "cookie";
import { verifyUser } from "../utils/verifyUser.js";
import { createRoom, joinRoom } from "./handlers/roomHandlers.js";

export function initSocket(io: Server) {
  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const user = await verifyUser(token);

      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = user;

      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on("create_room", () => createRoom(io, socket));
    socket.on("join_room", (data) => joinRoom(io, socket, data));

    socket.on("disconnect", () => console.log("Disconnected: ", socket.id));
  });
}
