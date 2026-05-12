"use client";

import { useEffect, useState } from "react";
import { Room } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Props = {
  onJoin: (code: string) => void;
};

function PublicRooms({ onJoin }: Props) {
  const [roomData, setRoomData] = useState<Room[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/rooms`);
        if (!res.ok) return console.error(await res.text());
        setRoomData(await res.json());
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-80">
      {loading && (
        <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
      )}
      {!loading && (!roomData || roomData.length === 0) && (
        <p className="text-xs text-gray-500 text-center py-4">
          No public rooms available.
        </p>
      )}
      {roomData?.map((room) => (
        <div
          key={room.code}
          className="flex items-center justify-between bg-indigo-900 border border-indigo-800 hover:border-indigo-500 rounded-lg px-3 py-2 transition-all"
        >
          <div className="flex flex-col gap-1">
            <p className="font-fredoka font-semibold tracking-widest text-indigo-300">
              {room.code}
            </p>
            <div className="flex gap-2 text-xs text-gray-400">
              <span>
                👥 {room.players.length}/{room.maxPlayers}
              </span>
              <span>⏱ {room.duration}s</span>
              <span>🎯 {room.clickGoal || "None"}</span>
            </div>
          </div>
          <button
            onClick={() => onJoin(room.code)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-xs font-semibold"
          >
            Join
          </button>
        </div>
      ))}
    </div>
  );
}

export default PublicRooms;
