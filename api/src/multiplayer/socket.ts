import { Server, Socket } from "socket.io";
import cookie from "cookie";
import { verifyUser } from "../utils/verifyUser.js";
import {
  createRoom,
  joinRoom,
  rejoinRoom,
  syncClicks,
  usePowerUp,
} from "./handlers/roomHandlers.js";
import Room from "../models/Room.js";
import { endGame, startGame } from "./handlers/gameHandlers.js";

const DEV_MODE = process.env.DEV_MODE;

async function handleDisconnect(io: Server, socket: Socket) {
  try {
    const room = await Room.findOne({
      "players.socketId": socket.id,
      status: { $in: ["running", "countdown"] },
    });

    if (!room) return;

    await endGame(io, room.code, socket.id);
  } catch (error) {
    console.log(error);
  }
}

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

    socket.on("create_room", (data) => createRoom(io, socket, data));
    socket.on("join_room", (data) => joinRoom(io, socket, data));
    socket.on("sync_clicks", (data) => syncClicks(io, socket, data));
    socket.on("rejoin_room", (data) => rejoinRoom(io, socket, data));

    socket.on("use_powerup", (data) => usePowerUp(io, socket, data));
    socket.on("start_game", () => startGame(io, socket));

    socket.on("disconnect", () => handleDisconnect(io, socket));
  });
}
