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
  const [joinCode, setJoinCode] = useState("");
  const [settings, setSettings] = useState<Settings>({
    duration: 15,
    countdown: 3,
    clickGoal: 0,
    powerups: false,
    maxPlayers: 2,
  });
  const [status, setStatus] = useState<"idle" | "creating">("idle");
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    const socket = initSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on("room_created", ({ code }: { code: string }) => {
      router.push(`/lobby/${code}`);
    });

    socket.on("room_joined", ({ code }: { code: string }) => {
      router.push(`/lobby/${code}`);
    });

    socket.on("error", ({ message }: { message: string }) => {
      console.error(message);
      setStatus("idle");
    });

    return () => {
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("error");
    };
  }, [router]);

  const handleCreateRoom = () => {
    socketRef.current?.emit("create_room", { settings });
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) return;
    socketRef.current?.emit("join_room", { code: joinCode.toUpperCase() });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex flex-col bg-indigo-950 rounded-lg p-4 m-2 w-full max-w-sm">
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
        </div>
      ) : (
        <a href={`${API_BASE_URL}/auth/login`}>Login</a>
      )}
    </div>
  );
}

export default Lobby;
