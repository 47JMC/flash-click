"use client";

import { initSocket } from "@/lib/socket";
import { useAuth } from "./UserProvider";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import * as motion from "motion/react-client";

import RoomSettings from "./RoomSettings";
import PublicRooms from "./PublicRooms";
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
    visibility: "public",
  });
  const [status, setStatus] = useState<"idle" | "creating">("idle");
  const [roomsOpen, setRoomsOpen] = useState(false);

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

  const handleJoinRoom = (code?: string) => {
    const roomCode = code ?? joinCode;
    if (!roomCode.trim()) return;
    socketRef.current?.emit("join_room", { code: roomCode.toUpperCase() });
  };

  if (loading) return <p>Loading...</p>;

  // replace the outer div and the rooms panel with:

  return (
    <motion.div
      layout
      className="flex bg-indigo-950 rounded-lg p-4 m-2"
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Left side */}
      <div className="flex flex-col gap-3 w-72 shrink-0">
        {user ? (
          <motion.div
            transition={{ duration: 0.2 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            {status === "idle" && (
              <>
                <button
                  onClick={() => setStatus("creating")}
                  className="transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg border border-indigo-400"
                >
                  Create Room
                </button>
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Room code"
                    maxLength={4}
                    className="flex-1 px-3 py-2 font-fredoka rounded-lg bg-indigo-900 border-indigo-700 border-2 focus:border-indigo-400 focus:outline-none text-white tracking-widest uppercase placeholder:text-indigo-600"
                  />
                  <button
                    onClick={() => handleJoinRoom()}
                    className="transition-all cursor-pointer bg-indigo-800 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg border border-indigo-600 hover:border-indigo-400"
                  >
                    Join
                  </button>
                </div>
                <button
                  onClick={() => setRoomsOpen((prev) => !prev)}
                  className="transition-all bg-indigo-900 hover:bg-indigo-800 text-indigo-300 text-sm font-semibold px-4 py-2 rounded-lg border border-indigo-700"
                >
                  {roomsOpen ? "Hide rooms ✕" : "Find rooms →"}
                </button>
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
          </motion.div>
        ) : (
          <a
            className="p-2 m-2 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-lg text-center font-semibold text-white"
            href={`${API_BASE_URL}/auth/login`}
          >
            Login
          </a>
        )}
      </div>

      {/* Divider */}
      {roomsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-px bg-indigo-800 mx-4 self-stretch"
        />
      )}

      {/* Right side — public rooms */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: roomsOpen ? 280 : 0, opacity: roomsOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden flex flex-col gap-2"
      >
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 whitespace-nowrap">
          Public Rooms
        </p>
        <PublicRooms onJoin={handleJoinRoom} />
      </motion.div>
    </motion.div>
  );
}

export default Lobby;
