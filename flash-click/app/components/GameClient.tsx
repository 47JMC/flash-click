"use client";

import { initSocket } from "@/lib/socket";
import { Room } from "@/lib/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useAuth } from "./UserProvider";

type GameClientProps = {
  room: Room;
};

function GameClient({ room }: GameClientProps) {
  const [myClicks, setMyClicks] = useState<number>(0);
  const [oppClicks, setOppClicks] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(room.duration);
  const clicksRef = useRef<number>(0);

  const { user } = useAuth();

  const isHost = user?.id === room.host.id;

  const me = isHost ? room.host : room.guest;
  const opponent = isHost ? room.guest : room.host;

  const socketRef = useRef<Socket | null>(null);

  const addClick = () => {
    clicksRef.current += 1;
    setMyClicks(clicksRef.current);
  };

  useEffect(() => {
    socketRef.current = initSocket();
    socketRef.current.connect();

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("rejoin_room", { code: room.code });
    });

    socketRef.current.on("update_clicks", ({ clicks }: { clicks: number }) => {
      setOppClicks(clicks);
    });

    const interval = setInterval(() => {
      if (clicksRef.current > 0) {
        socketRef.current?.emit("sync_clicks", {
          code: room.code,
          clicks: clicksRef.current,
        });
      }
    }, 500);

    return () => {
      clearInterval(interval);
      socketRef.current?.off("update_clicks");
    };
  }, [room.code]);

  const total = myClicks + oppClicks;
  const myPct = total === 0 ? 50 : Math.round((myClicks / total) * 100);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 gap-6">
      {/* Timer */}
      <div className="text-6xl font-bold tabular-nums text-indigo-400">
        {timeLeft}s
      </div>

      {/* Players */}
      <div className="w-full max-w-md flex justify-between items-center">
        <div className="text-center">
          <Image
            width={75}
            height={75}
            src={me?.avatar}
            alt={me?.username}
            className="w-12 h-12 rounded-full mx-auto mb-1 border-2 border-indigo-500"
          />
          <p className="text-sm font-semibold">
            {me.global_name ?? me.username}
          </p>
          <p className="text-3xl font-bold text-indigo-400">{myClicks}</p>
        </div>

        <div className="text-gray-500 text-xl font-bold">VS</div>

        <div className="text-center">
          <Image
            width={75}
            height={75}
            src={opponent?.avatar}
            alt={opponent.username}
            className="w-12 h-12 rounded-full mx-auto mb-1 border-2 border-rose-500"
          />
          <p className="text-sm font-semibold">
            {opponent?.global_name ?? opponent?.username}
          </p>
          <p className="text-3xl font-bold text-rose-400">{oppClicks}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md bg-gray-800 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-150"
          style={{ width: `${myPct}%` }}
        />
      </div>
      <div className="w-full max-w-md flex justify-between text-xs text-gray-500">
        <span>{myPct}%</span>
        <span>{100 - myPct}%</span>
      </div>

      {/* Click button */}
      <button
        onClick={addClick}
        className="w-40 h-40 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-2xl font-bold shadow-lg shadow-indigo-900 border-4 border-indigo-400"
      >
        CLICK
      </button>
    </div>
  );
}

export default GameClient;
