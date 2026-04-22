import { Server } from "socket.io";
import Room from "../../models/Room.js";
import { activeTimers, roomSockets } from "../state.js";

export async function endGame(
  io: Server,
  code: string,
  disconnectedSocketId?: string,
) {
  const finalRoom = await Room.findOne({ code });
  if (!finalRoom || !finalRoom.guest) return;

  await Room.updateOne({ code }, { status: "done" });
  activeTimers.delete(code);

  const roomSocket = roomSockets.get(code);
  let winner;

  if (disconnectedSocketId) {
    winner =
      roomSocket?.host === disconnectedSocketId
        ? finalRoom.guest
        : finalRoom.host;
  } else {
    winner =
      finalRoom.host.clicks > finalRoom.guest.clicks
        ? finalRoom.host
        : finalRoom.guest.clicks > finalRoom.host.clicks
          ? finalRoom.guest
          : null;
  }

  io.to(code).emit("game_over", {
    winner,
    host: { username: finalRoom.host.username, clicks: finalRoom.host.clicks },
    guest: {
      username: finalRoom.guest.username,
      clicks: finalRoom.guest.clicks,
    },
  });

  setTimeout(
    async () => {
      console.log("deleted room", code);
      await Room.deleteOne({ code });
      roomSockets.delete(code);
    },
    2 * 60 * 1000,
  );
}
