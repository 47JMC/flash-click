// src/models/Room.ts
import { Schema, model } from "mongoose";
import User from "./User.js";

const roomSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    host: { type: User, required: true },
    guest: { type: User, default: null },
    status: {
      type: String,
      enum: ["waiting", "countdown", "running", "done"],
      default: "waiting",
    },
    duration: { type: Number, default: 15 },
    startedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default model("Room", roomSchema);
