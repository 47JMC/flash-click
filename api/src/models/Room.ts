// src/models/Room.ts
import { Schema, model } from "mongoose";
import { userSchema } from "./User.js";

const roomSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    host: { type: userSchema, required: true },
    guest: { type: userSchema, default: null },
    status: {
      type: String,
      enum: ["waiting", "countdown", "running", "done"],
      default: "waiting",
    },
    duration: { type: Number, default: 15 },
    countdown: { type: Number, default: 3 },
    clickGoal: { type: Number, default: 0 },
    powerups: { type: Boolean, default: false },
    startedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default model("Room", roomSchema);
