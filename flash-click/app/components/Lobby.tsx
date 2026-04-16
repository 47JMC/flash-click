"use client";

import { initSocket } from "@/lib/socket";
import { useAuth } from "./UserProvider";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function Lobby() {
  const socketRef = useRef<Socket | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [status, setStatus] = useState<"idle" | "waiting" | "joining">("idle");

  const { user, loading } = useAuth();

  useEffect(() => {
    const socket = initSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("room_created", ({ code }: { code: string }) => {
      setRoomCode(code);
      setStatus("waiting");
    });

    socket.on("player_joined", ({ username }: { username: string }) => {
      console.log(`${username} joined`);
      // navigate to game screen
    });

    socket.on("room_joined", () => {
      // navigate to game screen
    });

    socket.on("error", ({ message }: { message: string }) => {
      console.error(message);
      setStatus("idle");
    });

    return () => {
      socket.off("room_created");
      socket.off("player_joined");
      socket.off("room_joined");
      socket.off("error");
    };
  }, []);

  const handleCreateRoom = () => {
    socketRef.current?.emit("create_room", { username: user?.username });
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return;
    socketRef.current?.emit("join_room", {
      code: joinCode.toUpperCase(),
      username: user?.username,
    });
    setStatus("joining");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex flex-col bg-indigo-950 rounded-lg p-4 m-2">
      {user ? (
        <div className="flex flex-col gap-3">
          {status === "idle" && (
            <>
              <button
                onClick={handleCreateRoom}
                className="transition-colors cursor-pointer border-2 bg-blue-400 hover:bg-blue-700 hover:border-green-400 px-4 py-2 rounded"
              >
                Create Room
              </button>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Room code"
                  maxLength={4}
                  className="px-3 py-2 rounded bg-indigo-900 text-white tracking-widest uppercase"
                />
                <button
                  onClick={handleJoinRoom}
                  className="transition-colors cursor-pointer border-2 bg-blue-400 hover:bg-blue-700 hover:border-green-400 px-4 py-2 rounded"
                >
                  Join Room
                </button>
              </div>
            </>
          )}

          {status === "waiting" && (
            <div className="text-white text-center">
              <p className="text-lg">Room created!</p>
              <p className="tracking-widest text-3xl font-bold text-green-400">
                {roomCode}
              </p>
              <p className="text-sm text-indigo-300">Waiting for opponent...</p>
            </div>
          )}

          {status === "joining" && (
            <p className="text-white text-center">Joining room {joinCode}...</p>
          )}
        </div>
      ) : (
        <a href={`${API_BASE_URL}/auth/login`}>Login</a>
      )}
    </div>
  );
}

export default Lobby;
