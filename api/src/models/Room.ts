// src/models/Room.ts
import { Schema, model } from "mongoose";

const playerSchema = new Schema({
  id: { type: String, required: true },
  username: { type: String, required: true },
  global_name: { type: String },
  avatar: {
    type: String,
    default: "https://cdn.discordapp.com/embed/avatars/0.png",
  },
  clicks: { type: Number, default: 0 },
  socketId: { type: String },
  isHost: { type: Boolean, default: false },
});

const roomSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    players: [playerSchema],
    maxPlayers: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ["waiting", "countdown", "running", "done"],
      default: "waiting",
    },
    duration: { type: Number, default: 15 },
    countdown: { type: Number, default: 3 },
    clickGoal: { type: Number, default: 0 },
    powerups: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default model("Room", roomSchema);
