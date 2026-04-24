import { Server } from "socket.io";
import Room from "../../models/Room.js";
import { activeTimers } from "../state.js";
import { endGame } from "./gameHandlers.js";

export async function startGameTimer(io: Server, code: string) {
  if (activeTimers.get(code)) return;
  activeTimers.set(code, true);

  const room = await Room.findOne({ code });
  if (!room) return console.error("Room doesn't exist");
  if (room.status === "running") return;

  await Room.updateOne({ code }, { status: "countdown" });
  io.to(code).emit("countdown_start");

  let countdown = room.countdown || 3;

  const countdownInterval = setInterval(async () => {
    io.to(code).emit("countdown_tick", { countdown });
    countdown--;

    if (countdown < 0) {
      clearInterval(countdownInterval);
      await Room.updateOne(
        { code },
        { status: "running", startedAt: new Date() },
      );
      io.to(code).emit("game_start", { duration: room.duration });

      let timeLeft = room.duration;

      const gameInterval = setInterval(async () => {
        timeLeft--;
        io.to(code).emit("timer_tick", { timeLeft });

        if (timeLeft <= 0) {
          clearInterval(gameInterval);
          activeTimers.delete(code);
          await endGame(io, code);
        }
      }, 1000);
    }
  }, 1000);
}
