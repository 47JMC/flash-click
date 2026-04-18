import { Server, Socket } from "socket.io";
import Room from "../../models/Room.js";

import { roomSockets } from "../state.js";

const DEV_MODE = process.env.DEV_MODE;

export async function createRoom(io: Server, socket: Socket) {
  try {
    const user = socket.data.user;

    const checkAlreadyInRoom = await Room.findOne({
      $or: [{ "host.id": user.id }, { "guest.id": user.id }],
      status: { $ne: "done" },
    });

    if (checkAlreadyInRoom) {
      return io
        .to(socket.id)
        .emit("error", { message: "User already in a room" });
    }

    let randomCode = Math.random().toString(36).slice(2, 6).toUpperCase();

    while (await Room.exists({ code: randomCode })) {
      randomCode = Math.random().toString(36).slice(2, 6).toUpperCase();
    }

    const createdRoom = new Room({
      code: randomCode,
      host: user,
    });

    await createdRoom.save();

    socket.join(randomCode);
    roomSockets.set(randomCode, { host: socket.id });

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
  const user = socket.data.user;

  const checkAlreadyInRoom = await Room.findOne({
    $or: [{ "host.id": user.id }, { "guest.id": user.id }],
    status: { $ne: "done" },
  });

  if (checkAlreadyInRoom && !DEV_MODE) {
    return io
      .to(socket.id)
      .emit("error", { message: "User already in a room" });
  }

  const room = await Room.findOne({ code: data.code, status: { $ne: "done" } });

  if (!room)
    return io.to(socket.id).emit("error", { message: "Room doenst exists!" });

  if (room.guest)
    return io.to(socket.id).emit("error", { message: "Room is full" });

  room.guest = user;
  await room.save();

  const existing = roomSockets.get(room.code);
  roomSockets.set(room.code, { host: existing!.host, guest: socket.id });

  socket.join(room.code);

  const roomSocket = roomSockets.get(room.code);
  if (!roomSocket)
    return io.emit("error", { message: "Room socket not found" });

  // tell the host someone joined
  io.to(roomSocket.host).emit("player_joined", {
    username: user.username,
    avatar: user.avatar,
  });

  // tell the guest they successfully joined
  socket.emit("room_joined", { code: room.code });
}

export async function syncClicks(
  io: Server,
  socket: Socket,
  data: { code: string; clicks: number },
) {
  console.log("sync_clicks received", data); // add this
  const roomSocket = roomSockets.get(data.code);
  if (!roomSocket) return socket.emit("error", { message: "Room not found" });

  const oppSocketId =
    roomSocket.host === socket.id ? roomSocket.guest : roomSocket.host;

  console.log(oppSocketId);
  if (!oppSocketId) return;

  io.to(oppSocketId).emit("update_clicks", { clicks: data.clicks });
}

export async function rejoinRoom(
  io: Server,
  socket: Socket,
  data: { code: string },
) {
  const room = await Room.findOne({ code: data.code });
  if (!room) return socket.emit("error", { message: "Room not found" });

  const isHost = room.host.id === socket.data.user.id;

  const existing = roomSockets.get(data.code) || { host: "", guest: "" };

  if (isHost) {
    roomSockets.set(data.code, { ...existing, host: socket.id });
  } else {
    roomSockets.set(data.code, { ...existing, guest: socket.id });
  }

  socket.join(data.code);
}
