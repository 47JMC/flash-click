import "dotenv/config";

import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "node:http";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { initSocket } from "./multiplayer/socket.js";

import authRouter from "./routes/auth.js";
import roomsRouter from "./routes/rooms.js";

const app = express();
const server = createServer(app);

const { FRONTEND_URL, MONGODB_URI, PORT } = process.env;

if (!FRONTEND_URL || !MONGODB_URI || !PORT) {
  throw new Error("FRONTEND URL or MONGODB_URI is not set");
}

const io = new Server(server, {
  cors: { origin: FRONTEND_URL, credentials: true },
});

mongoose.connect(MONGODB_URI);

initSocket(io);

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.use("/auth", authRouter);
app.use("/rooms", roomsRouter);

server.listen(4000, () =>
  console.log(`Server is running on http://localhost:${PORT}`),
);
