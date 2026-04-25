"use client";

import { initSocket } from "@/lib/socket";
import { Room, User } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useAuth } from "./UserProvider";
import { useRouter } from "next/navigation";

import PlayerCard from "./PlayerCard";

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

    socket.on("kicked", () => {
      router.push("/");
    });

    socket.on("player_left", ({ playerId }: { playerId: string }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    });

    socket.on("new_host", ({ newHostId }: { newHostId: string }) => {
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          isHost: p.id === newHostId,
        })),
      );
    });

    return () => {
      socket.off("connect");
      socket.off("player_joined");
      socket.off("game_start");
      socket.off("error");
      socket.off("player_left");
      socket.off("new_host");
    };
  }, [room.code, router]);

  const handleStart = () => {
    socketRef.current?.emit("start_game");
  };

  const handleLeave = () => {
    socketRef.current?.emit("leave_room", { code: room.code });
    router.push("/");
  };

  const handleKick = (playerId: string) => {
    socketRef.current?.emit("kick_player", { code: room.code, playerId });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 gap-6">
      {/* Room code */}
      <div className="text-center">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
          Room code
        </p>
        <p
          onClick={() => navigator.clipboard.writeText(room.code)}
          className="text-5xl font-bold tracking-widest text-white"
        >
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
          <PlayerCard
            user={user}
            player={p}
            key={`${p.id}-${i}`}
            amHost={isHost ?? false}
            onPlayerKick={handleKick}
          />
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

      <button
        onClick={handleLeave}
        className="bg-red-400 rounded-lg border-4 border-red-600 hover:bg-red-500 transition-all px-4 py-2 m-4"
      >
        Leave Room
      </button>
    </div>
  );
}

export default LobbyClient;
