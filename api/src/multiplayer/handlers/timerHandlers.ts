import { Server } from "socket.io";
import Room from "../../models/Room.js";
import { roomSockets } from "../state.js";
import { RoomType } from "../../utils/types.js";

export async function startGameTimer(io: Server, code: string) {
  const room = await Room.findOne({ code: code });

  if (!room) return console.error("Room doesnt exists");
  if (room.status === "running") return;

  const roomSocket = roomSockets.get(code);

  if (!roomSocket) return console.error("Room socket doenst exist");

  await Room.updateOne({ code }, { status: "countdown" });

  io.to(code).emit("countdown_start");

  let countdown = 3;

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
          const finalRoom = await Room.findOne({ code });
          await Room.updateOne({ code }, { status: "done" });

          if (!finalRoom?.guest) return;

          const winner =
            finalRoom.host.clicks > finalRoom.guest.clicks
              ? finalRoom.host
              : finalRoom.guest.clicks > finalRoom.host.clicks
                ? finalRoom.guest
                : null;

          // delete room after 5 minutes
          setTimeout(
            async () => {
              await Room.deleteOne({ code });
              roomSockets.delete(code);
            },
            5 * 60 * 1000,
          );

          io.to(code).emit("game_over", {
            winner,
            host: {
              username: finalRoom.host.username,
              clicks: finalRoom.host.clicks,
            },
            guest: {
              username: finalRoom.guest.username,
              clicks: finalRoom.guest.clicks,
            },
          });
        }
      }, 1000);
    }
  }, 1000);
}
