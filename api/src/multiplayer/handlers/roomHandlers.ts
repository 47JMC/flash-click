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

    console.log("NUKE IT");
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
