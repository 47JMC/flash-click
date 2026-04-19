"use client";

import { initSocket } from "@/lib/socket";
import { useAuth } from "./UserProvider";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import RoomSettings from "./RoomSettings";
import type { Settings } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function Lobby() {
  const socketRef = useRef<Socket | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [settings, setSettings] = useState<Settings>({
    duration: 15,
    countdown: 3,
    clickGoal: null,
    powerups: false,
  });
  const [status, setStatus] = useState<
    "idle" | "creating" | "waiting" | "joining"
  >("idle");

  const router = useRouter();
  const routerRef = useRef(router);
  const roomCodeRef = useRef(roomCode);

  const { user, loading } = useAuth();

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    const socket = initSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("room_created", ({ code }: { code: string }) => {
      setRoomCode(code);
      setStatus("waiting");
    });

    socket.on("player_joined", () => {
      routerRef.current.push(`/game/${roomCodeRef.current}`);
    });

    socket.on("room_joined", ({ code }: { code: string }) => {
      routerRef.current.push(`/game/${code}`);
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
    socketRef.current?.emit("create_room", { settings });
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return;
    socketRef.current?.emit("join_room", { code: joinCode.toUpperCase() });
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
                onClick={() => setStatus("creating")}
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

          {status === "creating" && (
            <RoomSettings
              settings={settings}
              setSettings={setSettings}
              onConfirm={handleCreateRoom}
              onBack={() => setStatus("idle")}
            />
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
