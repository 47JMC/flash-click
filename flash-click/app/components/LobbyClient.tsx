"use client";

import { initSocket } from "@/lib/socket";
import { Room, User } from "@/lib/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useAuth } from "./UserProvider";
import { useRouter } from "next/navigation";

type LobbyClientProps = {
  room: Room;
};

function LobbyClient({ room }: LobbyClientProps) {
  const [players, setPlayers] = useState<User[]>(room.players);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const isHost = players.find((p) => p.id === user?.id)?.isHost;

  useEffect(() => {
    const socket = initSocket();
    socketRef.current = socket;
    socket.connect();

    const emitRejoin = () => socket.emit("rejoin_room", { code: room.code });

    socket.on("connect", emitRejoin);
    if (socket.connected) emitRejoin();

    socket.on(
      "player_joined",
      ({ username, avatar, global_name, id }: User) => {
        setPlayers((prev) => [
          ...prev,
          { username, avatar, global_name, id } as User,
        ]);
      },
    );

    socket.on("game_start", () => {
      router.push(`/game/${room.code}`);
    });

    socket.on("error", ({ message }: { message: string }) => {
      console.error(message);
    });

    return () => {
      socket.off("connect");
      socket.off("player_joined");
      socket.off("game_start");
      socket.off("error");
    };
  }, [room.code, router]);

  const handleStart = () => {
    socketRef.current?.emit("start_game");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 gap-6">
      {/* Room code */}
      <div className="text-center">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
          Room code
        </p>
        <p className="text-5xl font-bold tracking-widest text-white">
          {room.code}
        </p>
        <p className="text-xs text-gray-600 mt-2">
          Share this with your friends
        </p>
      </div>

      {/* Settings summary */}
      <div className="flex gap-4 text-center">
        <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
          <p className="text-xs text-gray-500">Duration</p>
          <p className="text-sm font-semibold">{room.duration}s</p>
        </div>
        <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
          <p className="text-xs text-gray-500">Click goal</p>
          <p className="text-sm font-semibold">{room.clickGoal || "None"}</p>
        </div>
        <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
          <p className="text-xs text-gray-500">Power-ups</p>
          <p className="text-sm font-semibold">
            {room.powerups ? "On" : "Off"}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
          <p className="text-xs text-gray-500">Max players</p>
          <p className="text-sm font-semibold">{room.maxPlayers}</p>
        </div>
      </div>

      {/* Players */}
      <div className="w-full max-w-sm flex flex-col gap-2">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
          Players — {players.length}/{room.maxPlayers}
        </p>
        {players.map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="flex items-center gap-3 bg-gray-900 rounded-lg px-4 py-3 border border-gray-800"
          >
            <Image
              src={p.avatar}
              alt={p.username}
              width={36}
              height={36}
              className="rounded-full"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {p.global_name ?? p.username}
              </p>
              <p className="text-xs text-gray-500">@{p.username}</p>
            </div>
            {p.isHost && (
              <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700">
                host
              </span>
            )}
            {p.id === user?.id && (
              <span className="text-xs text-gray-600">you</span>
            )}
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: room.maxPlayers - players.length }).map(
          (_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 bg-gray-900/50 rounded-lg px-4 py-3 border border-gray-800 border-dashed"
            >
              <div className="w-9 h-9 rounded-full bg-gray-800" />
              <p className="text-sm text-gray-700">Waiting for player...</p>
            </div>
          ),
        )}
      </div>

      {/* Start button */}
      {isHost && (
        <button
          onClick={handleStart}
          disabled={players.length < 2}
          className="px-10 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold"
        >
          {players.length < 2 ? "Waiting for players..." : "Start game →"}
        </button>
      )}

      {!isHost && (
        <p className="text-sm text-gray-600">Waiting for host to start...</p>
      )}
    </div>
  );
}

export default LobbyClient;
