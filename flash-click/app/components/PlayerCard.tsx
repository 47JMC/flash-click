"use client";

import { User } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";

type PlayerCardProps = {
  player: User;
  user: User | null;
  amHost: boolean;
  onPlayerKick: (playerId: string) => void;
};

function PlayerCard({ player, user, amHost, onPlayerKick }: PlayerCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  const handleInteraction = () => setIsHovering((prev) => !prev);

  return (
    <div
      className="flex items-center gap-3 bg-gray-900 rounded-lg px-4 py-3 border border-gray-800"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleInteraction}
    >
      <Image
        src={player.avatar}
        alt={player.username}
        width={36}
        height={36}
        className="rounded-full"
      />
      <div className="flex-1">
        <p className="text-sm font-semibold">
          {player.global_name ?? player.username}
        </p>
        <p className="text-xs text-gray-500">@{player.username}</p>
      </div>
      {player.isHost && (
        <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700">
          host
        </span>
      )}
      {player.id === user?.id && (
        <span className="text-xs text-gray-600">you</span>
      )}
      {!player.isHost && amHost && isHovering && (
        <button
          className="bg-red-500 border-4 border-red-700 font-semibold text-lg px-3 mx-2 hover:bg-red-600 transition-colors rounded-md"
          onClick={() => onPlayerKick(player.id)}
        >
          Kick
        </button>
      )}
    </div>
  );
}

export default PlayerCard;
