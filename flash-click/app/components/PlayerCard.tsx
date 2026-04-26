"use client";

import { User } from "@/lib/types";
import { useState } from "react";
import Image from "next/image";
import Nameplate from "./Nameplate";

type PlayerCardProps = {
  player: User;
  user: User | null;
  amHost: boolean;
  onPlayerKick: (playerId: string) => void;
};

function PlayerCard({ player, user, amHost, onPlayerKick }: PlayerCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <Nameplate asset={player.nameplateUrl}>
      <div
        className="flex items-center gap-3 bg-black/40 rounded-lg px-4 py-3 border border-gray-800"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => setIsHovering((prev) => !prev)}
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

        <div className="flex items-center gap-2">
          {player.isHost && (
            <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700">
              host
            </span>
          )}
          {player.id === user?.id && (
            <span className="text-xs text-gray-600">you</span>
          )}
          {!player.isHost && amHost && player.id !== user?.id && isHovering && (
            <button
              className="bg-red-600 hover:bg-red-500 transition-colors text-xs font-semibold px-2 py-1 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                onPlayerKick(player.id);
              }}
            >
              Kick
            </button>
          )}
        </div>
      </div>
    </Nameplate>
  );
}

export default PlayerCard;
