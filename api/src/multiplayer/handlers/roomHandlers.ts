import { Server, Socket } from "socket.io";
import Room from "../../models/Room.js";

import { Settings } from "../../utils/types.js";
import { endGame } from "./gameHandlers.js";
import { playerClickHistory } from "../state.js";

const DEV_MODE = process.env.DEV_MODE;

const POWERUP_CONFIG: Record<
  string,
  { cost: number; duration: number; cooldown: number }
> = {
  double: { cost: 15, duration: 3000, cooldown: 3000 },
  ghost: { cost: 20, duration: 5000, cooldown: 2000 },
  overclock: { cost: 25, duration: 2000, cooldown: 2000 },
};

export async function createRoom(
  io: Server,
  socket: Socket,
  { settings }: { settings: Settings },
) {
  try {
    const user = socket.data.user;

    const checkAlreadyInRoom = await Room.findOne({
      "players.id": user.id,
      status: { $ne: "done" },
    });

    if (checkAlreadyInRoom) {
      return socket.emit("error", { message: "User already in a room" });
    }

    let randomCode = Math.random().toString(36).slice(2, 6).toUpperCase();
    while (await Room.exists({ code: randomCode })) {
      randomCode = Math.random().toString(36).slice(2, 6).toUpperCase();
    }

    const createdRoom = new Room({
      code: randomCode,
      players: [
        {
          id: user.id,
          username: user.username,
          global_name: user.global_name,
          avatar: user.avatar,
          clicks: 0,
          socketId: socket.id,
          nameplateUrl: user.nameplateUrl,
          isHost: true,
        },
      ],
      maxPlayers: settings.maxPlayers,
      duration: settings.duration,
      clickGoal: settings.clickGoal,
      powerups: settings.powerups,
      countdown: settings.countdown,
    });

    await createdRoom.save();

    socket.join(randomCode);
    socket.emit("room_created", { code: randomCode });
  } catch (error) {
    console.log(error);
    return socket.emit("error", { message: "Failed to create room" });
  }
}

export async function joinRoom(
  io: Server,
  socket: Socket,
  data: { code: string },
) {
  try {
    const user = socket.data.user;

    const checkAlreadyInRoom = await Room.findOne({
      "players.id": user.id,
      status: { $ne: "done" },
    });

    if (checkAlreadyInRoom && !DEV_MODE) {
      return socket.emit("error", { message: "User already in a room" });
    }

    const room = await Room.findOne({
      code: data.code,
      status: { $ne: "done" },
    });

    if (!room) return socket.emit("error", { message: "Room doesn't exist" });

    if (room.players.length >= room.maxPlayers)
      return socket.emit("error", { message: "Room is full" });

    await Room.updateOne(
      { code: data.code },
      {
        $push: {
          players: {
            id: user.id,
            username: user.username,
            global_name: user.global_name,
            avatar: user.avatar,
            clicks: 0,
            socketId: socket.id,
            nameplateUrl: user.nameplateUrl,
            isHost: false,
          },
        },
      },
    );

    socket.join(room.code);

    // tell everyone else someone joined
    socket.to(room.code).emit("player_joined", {
      username: user.username,
      avatar: user.avatar,
    });

    // tell the guest they successfully joined
    socket.emit("room_joined", { code: room.code });
  } catch (error) {
    console.log(error);
    return socket.emit("error", { message: "Failed to join room" });
  }
}

export async function syncClicks(
  io: Server,
  socket: Socket,
  data: { code: string; clicks: number },
) {
  try {
    const room = await Room.findOne({ code: data.code });
    if (!room) return socket.emit("error", { message: "Room not found" });

    const key = `${data.code}:${socket.id}`;
    const lastClicks = playerClickHistory.get(key) ?? 0;

    const delta = data.clicks - lastClicks;
    const maxDeltaPerSync = 20 * 3 * 0.5; // 20cps * max multiplier * 500ms sync interval

    let validatedClicks: number;

    if (delta > maxDeltaPerSync) {
      validatedClicks = lastClicks + Math.floor(maxDeltaPerSync);
    } else {
      validatedClicks = data.clicks;
    }

    if (delta < 0) {
      socket.to(data.code).emit("update_clicks", {
        playerId: socket.data.user.id,
        clicks: lastClicks,
      });
      return;
    }

    playerClickHistory.set(key, validatedClicks);

    await Room.updateOne(
      { code: data.code, "players.id": socket.data.user.id },
      { $set: { "players.$.clicks": validatedClicks } },
    );

    if (room.clickGoal > 0 && validatedClicks >= room.clickGoal) {
      await endGame(io, data.code);
      return;
    }

    socket.to(data.code).emit("update_clicks", {
      playerId: socket.data.user.id,
      clicks: validatedClicks,
    });
  } catch (error) {
    console.log(error);
  }
}

export async function rejoinRoom(
  io: Server,
  socket: Socket,
  data: { code: string },
) {
  try {
    const room = await Room.findOne({ code: data.code });
    if (!room) return socket.emit("error", { message: "Room not found" });

    await Room.updateOne(
      { code: data.code, "players.id": socket.data.user.id },
      { $set: { "players.$.socketId": socket.id } },
    );

    socket.join(data.code);

    const updatedRoom = await Room.findOne({ code: data.code });
    const allJoined = updatedRoom?.players.every((p) => p.socketId);
  } catch (error) {
    console.log(error);
    return socket.emit("error", { message: "Failed to rejoin room" });
  }
}

export async function leaveRoom(
  io: Server,
  socket: Socket,
  data: { code: string },
) {
  try {
    const user = socket.data.user;
    const room = await Room.findOne({ code: data.code });

    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === user.id);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    const wasHost = player.isHost;

    await Room.updateOne(
      { code: data.code },
      { $pull: { players: { id: user.id } } },
    );

    // Notify other players
    io.to(data.code).emit("player_left", {
      playerId: user.id,
      wasHost,
    });

    if (wasHost && room.status === "waiting") {
      const updatedRoom = await Room.findOne({ code: data.code });
      if (updatedRoom && updatedRoom.players.length > 0) {
        await Room.updateOne(
          { code: data.code },
          { $set: { "players.0.isHost": true } },
        );
        io.to(data.code).emit("new_host", {
          newHostId: updatedRoom.players[0].id,
        });
      }
    }

    socket.leave(data.code);
  } catch (error) {
    console.log(error);
  }
}

export async function kickPlayer(
  io: Server,
  socket: Socket,
  data: { code: string; playerId: string },
) {
  try {
    const room = await Room.findOne({ code: data.code });
    if (!room) return;

    const kicker = room.players.find((p) => p.id === socket.data.user.id);
    if (!kicker?.isHost)
      return socket.emit("error", { message: "Only host can kick" });

    const kicked = room.players.find((p) => p.id === data.playerId);
    if (!kicked) return;

    await Room.updateOne(
      { code: data.code },
      { $pull: { players: { id: data.playerId } } },
    );

    // tell the kicked player
    if (kicked.socketId) {
      io.to(kicked.socketId).emit("kicked");
    }

    // tell everyone else
    socket.to(data.code).emit("player_left", { playerId: data.playerId });
  } catch (error) {
    console.log(error);
  }
}

export async function usePowerUp(
  io: Server,
  socket: Socket,
  data: { code: string; type: string },
) {
  try {
    const room = await Room.findOne({ code: data.code });
    if (!room) return socket.emit("error", { message: "Room not found" });

    if (room.status !== "running")
      return socket.emit("error", { message: "Game not running" });
    if (!room.powerups)
      return socket.emit("error", { message: "Power-ups disabled" });

    const player = room.players.find((p) => p.id === socket.data.user.id);
    if (!player) return socket.emit("error", { message: "Player not found" });

    const powerup = POWERUP_CONFIG[data.type];
    if (!powerup) return socket.emit("error", { message: "Invalid power-up" });

    if (player.clicks < powerup.cost)
      return socket.emit("error", { message: "Not enough clicks" });

    await Room.updateOne(
      { code: data.code, "players.id": socket.data.user.id },
      { $inc: { "players.$.clicks": -powerup.cost } },
    );

    socket.emit("powerup_active", {
      type: data.type,
      duration: powerup.duration,
    });
  } catch (error) {
    console.log(error);
    return socket.emit("error", { message: "Failed to use power-up" });
  }
}
