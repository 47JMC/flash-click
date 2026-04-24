import { Server, Socket } from "socket.io";
import Room from "../../models/Room.js";

import { Settings } from "../../utils/types.js";
import { endGame } from "./gameHandlers.js";

const DEV_MODE = process.env.DEV_MODE;

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

    // update this player's clicks
    await Room.updateOne(
      { code: data.code, "players.id": socket.data.user.id },
      { $set: { "players.$.clicks": data.clicks } },
    );

    // check click goal
    if (room.clickGoal > 0 && data.clicks >= room.clickGoal) {
      await endGame(io, data.code);
      return;
    }

    // broadcast to all other players in the room
    socket.to(data.code).emit("update_clicks", {
      playerId: socket.data.user.id,
      clicks: data.clicks,
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

    if (player.clicks < 15)
      return socket.emit("error", { message: "Not enough clicks" });

    await Room.updateOne(
      { code: data.code, "players.id": socket.data.user.id },
      { $inc: { "players.$.clicks": -15 } },
    );

    socket.emit("powerup_active", { type: data.type, duration: 3000 });
  } catch (error) {
    console.log(error);
    return socket.emit("error", { message: "Failed to use power-up" });
  }
}
