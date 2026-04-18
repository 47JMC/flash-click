import { Router } from "express";
import Room from "../models/Room.js";

const roomsRouter = Router();

roomsRouter.get("/:code", async (req, res) => {
  const room = await Room.findOne({ code: req.params.code });

  if (!room) return res.status(404).json({ error: "Room not found!" });
  res.json(room);
});

export default roomsRouter;
