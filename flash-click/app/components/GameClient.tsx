"use client";

import { initSocket } from "@/lib/socket";
import { Room } from "@/lib/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { useAuth } from "./UserProvider";
import Link from "next/link";

type GameClientProps = {
  room: Room;
};

function GameClient({ room }: GameClientProps) {
  const [myClicks, setMyClicks] = useState<number>(0);
  const [oppClicks, setOppClicks] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(room.duration);
  const [phase, setPhase] = useState<
    "waiting" | "countdown" | "running" | "done"
  >("waiting");
  const [results, setResults] = useState<{
    winner: { username: string } | null;
    host: { username: string; clicks: number };
    guest: { username: string; clicks: number };
  } | null>(null);
  const clicksRef = useRef<number>(0);

  const { user } = useAuth();
  const isHost = user?.id === room.host.id;
  const me = isHost ? room.host : room.guest;
  const opponent = isHost ? room.guest : room.host;

  const socketRef = useRef<Socket | null>(null);

  const addClick = () => {
    if (phase !== "running") return;
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

    socketRef.current.on("countdown_start", () => setPhase("countdown"));

    socketRef.current.on(
      "countdown_tick",
      ({ countdown }: { countdown: number }) => {
        setTimeLeft(countdown);
      },
    );

    socketRef.current.on("game_start", ({ duration }: { duration: number }) => {
      setPhase("running");
      setTimeLeft(duration);
    });

    socketRef.current.on("timer_tick", ({ timeLeft }: { timeLeft: number }) => {
      setTimeLeft(timeLeft);
    });

    socketRef.current.on("game_over", (data) => {
      setPhase("done");
      setResults(data);
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
      socketRef.current?.off("countdown_start");
      socketRef.current?.off("countdown_tick");
      socketRef.current?.off("game_start");
      socketRef.current?.off("timer_tick");
      socketRef.current?.off("game_over");
    };
  }, [room.code]);

  const total = myClicks + oppClicks;
  const myPct = total === 0 ? 50 : Math.round((myClicks / total) * 100);
  const iWon = results?.winner?.username === me?.username;

  return (
    <div className="relative min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 gap-6">
      {/* Results overlay */}
      {phase === "done" && results && (
        <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center gap-8 z-10">
          <div className="text-center">
            <p className="text-6xl mb-4">
              {results.winner ? (iWon ? "🏆" : "😤") : "🤝"}
            </p>
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">
              {results.winner ? "winner" : "tie game"}
            </p>
            <p className="text-4xl font-bold text-yellow-400">
              {results.winner ? results.winner.username : "Nobody"}
            </p>
          </div>

          <div className="flex gap-12 items-center">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">
                {results.host.username}
              </p>
              <p className="text-5xl font-bold text-indigo-400">
                {results.host.clicks}
              </p>
            </div>
            <p className="text-gray-600 font-bold">vs</p>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">
                {results.guest.username}
              </p>
              <p className="text-5xl font-bold text-rose-400">
                {results.guest.clicks}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold"
          >
            Back to lobby
          </Link>
        </div>
      )}

      {/* Timer */}
      <div className="text-center">
        {phase === "waiting" && (
          <p className="text-gray-500 text-2xl animate-pulse">
            Waiting for players...
          </p>
        )}
        {phase === "countdown" && (
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
              Get ready
            </p>
            <p className="text-8xl font-bold text-yellow-400">{timeLeft}</p>
          </div>
        )}
        {phase === "running" && (
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
              Time left
            </p>
            <p
              className={`text-7xl font-bold tabular-nums ${timeLeft <= 5 ? "text-rose-400" : "text-indigo-400"}`}
            >
              {timeLeft}s
            </p>
          </div>
        )}
      </div>

      {/* Players */}
      <div className="w-full max-w-md flex justify-between items-center">
        <div className="text-center">
          <Image
            width={48}
            height={48}
            src={me?.avatar}
            alt={me?.username}
            className="rounded-full mx-auto mb-1 border-2 border-indigo-500"
          />
          <p className="text-xs text-gray-400 mb-1">
            {me?.global_name ?? me?.username}
          </p>
          <p className="text-4xl font-bold text-indigo-400">{myClicks}</p>
        </div>

        <div className="text-gray-600 text-lg font-bold">VS</div>

        <div className="text-center">
          <Image
            width={48}
            height={48}
            src={opponent?.avatar}
            alt={opponent?.username}
            className="rounded-full mx-auto mb-1 border-2 border-rose-500"
          />
          <p className="text-xs text-gray-400 mb-1">
            {opponent?.global_name ?? opponent?.username}
          </p>
          <p className="text-4xl font-bold text-rose-400">{oppClicks}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${myPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{myPct}%</span>
          <span>{100 - myPct}%</span>
        </div>
      </div>

      {/* Click button */}
      <button
        onClick={addClick}
        disabled={phase !== "running"}
        className="w-44 h-44 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-90 transition-all text-2xl font-bold shadow-2xl shadow-indigo-900/50 border-4 border-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-indigo-600"
      >
        {phase === "waiting"
          ? "..."
          : phase === "countdown"
            ? "⏳"
            : phase === "running"
              ? "CLICK"
              : "✓"}
      </button>
    </div>
  );
}

export default GameClient;
