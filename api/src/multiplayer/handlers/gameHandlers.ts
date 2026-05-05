import { Server, Socket } from "socket.io";
import Room from "../../models/Room.js";
import {
  activePowerups,
  activeTimers,
  playerClickHistory,
  playerLastSyncTime,
  flaggedPlayers,
} from "../state.js";
import { startGameTimer } from "./timerHandlers.js";

const DEV_MODE = process.env.DEV_MODE;

export async function startGame(io: Server, socket: Socket) {
  const room = await Room.findOne({
    "players.id": socket.data.user.id,
    status: "waiting",
  });

  if (!room) return socket.emit("error", { message: "Room not found" });

  const player = room.players.find((p) => p.id === socket.data.user.id);
  if (!player?.isHost)
    return socket.emit("error", { message: "Only host can start" });

  if (room.players.length < 2 && !DEV_MODE)
    return socket.emit("error", { message: "Need at least 2 players" });

  // emit to lobby so everyone redirects to game
  io.to(room.code).emit("game_start");

  await startGameTimer(io, room.code);
}

export async function endGame(
  io: Server,
  code: string,
  disconnectedSocketId?: string,
) {
  const finalRoom = await Room.findOne({ code });
  if (!finalRoom || finalRoom.players.length < 2) return;

  await Room.updateOne({ code }, { status: "done" });
  activeTimers.delete(code);

  let winner;

  if (disconnectedSocketId) {
    // find the player who disconnected and give win to someone else
    const disconnected = finalRoom.players.find(
      (p) => p.socketId === disconnectedSocketId,
    );
    winner = finalRoom.players.find((p) => p.socketId !== disconnectedSocketId);
    if (!disconnected) winner = null;
  } else {
    const sorted = [...finalRoom.players].sort((a, b) => b.clicks - a.clicks);
    winner = sorted[0].clicks > sorted[1].clicks ? sorted[0] : null; // null = tie
  }

  io.to(code).emit("game_over", {
    winner: winner ? { username: winner.username, id: winner.id } : null,
    players: finalRoom.players.map((p) => ({
      id: p.id,
      username: p.username,
      clicks: p.clicks,
    })),
  });

  setTimeout(async () => {
    await Room.deleteOne({ code });
  }, 500);

  for (const key of playerClickHistory.keys()) {
    if (key.startsWith(code)) playerClickHistory.delete(key);
  }

  for (const key of activePowerups.keys()) {
    if (key.startsWith(code)) activePowerups.delete(key);
  }

  for (const key of playerLastSyncTime.keys()) {
    if (key.startsWith(code)) playerLastSyncTime.delete(key);
  }

  for (const key of flaggedPlayers) {
    if (key.startsWith(code)) flaggedPlayers.delete(key);
  }
}
