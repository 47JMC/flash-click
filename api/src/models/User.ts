import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    id: { type: String, unique: true, required: true },
    username: { type: String, required: true },
    global_name: { type: String },
    avatar: {
      type: String,
      default: "https://cdn.discordapp.com/embed/avatars/0.png",
    },
  },
  { timestamps: true },
);

export default model("User", userSchema);
