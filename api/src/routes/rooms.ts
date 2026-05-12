import { Router } from "express";
import Room from "../models/Room.js";

const roomsRouter = Router();

// Fetches all public rooms
roomsRouter.get("/", async (req, res) => {
  const rooms = await Room.find({
    visibility: "public",
    status: "waiting",
  }).select("code players maxPlayers duration powerups clickGoal");
  res.json(rooms);
});

// Fetch room by room code
roomsRouter.get("/:code", async (req, res) => {
  const room = await Room.findOne({ code: req.params.code });

  if (!room) return res.status(404).json({ error: "Room not found!" });
  res.json(room);
});

export default roomsRouter;
