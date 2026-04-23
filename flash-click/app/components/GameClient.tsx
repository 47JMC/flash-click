"use client";

import { useEffect, useRef, useState } from "react";
import { initSocket } from "@/lib/socket";
import { Room } from "@/lib/types";
import { Socket } from "socket.io-client";
import { useAuth } from "./UserProvider";

import Image from "next/image";
import Link from "next/link";
import PowerupsBox from "./PowerupsBox";
import Powerup from "./Powerup";

type GameClientProps = {
  room: Room;
};

type ResultsType = {
  winner: { username: string; id: string } | null;
  players: { id: string; username: string; clicks: number }[];
};

function GameClient({ room }: GameClientProps) {
  const [myClicks, setMyClicks] = useState(0);
  const [playerClicks, setPlayerClicks] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(room.duration);
  const [phase, setPhase] = useState<
    "waiting" | "countdown" | "running" | "done"
  >("waiting");
  const [results, setResults] = useState<ResultsType | null>(null);
  const [doubleActive, setDoubleActive] = useState(false);

  const clicksRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  const me = room.players.find((p) => p.id === user?.id);
  const others = room.players.filter((p) => p.id !== user?.id);

  const addClick = () => {
    if (phase !== "running") return;
    const increment = doubleActive ? 2 : 1;
    clicksRef.current += increment;
    setMyClicks(clicksRef.current);
  };

  const handlePowerupUse = (type: string) =>
    socketRef.current?.emit("use_powerup", { code: room.code, type });

  useEffect(() => {
    socketRef.current = initSocket();
    socketRef.current.connect();

    const emitRejoin = () =>
      socketRef.current?.emit("rejoin_room", { code: room.code });

    socketRef.current.on("connect", emitRejoin);
    if (socketRef.current.connected) emitRejoin();

    socketRef.current.on(
      "update_clicks",
      ({ playerId, clicks }: { playerId: string; clicks: number }) => {
        setPlayerClicks((prev) => ({ ...prev, [playerId]: clicks }));
      },
    );

    socketRef.current.on("countdown_start", () => setPhase("countdown"));

    socketRef.current.on(
      "countdown_tick",
      ({ countdown }: { countdown: number }) => setTimeLeft(countdown),
    );

    socketRef.current.on("game_start", ({ duration }: { duration: number }) => {
      setPhase("running");
      setTimeLeft(duration);
    });

    socketRef.current.on("timer_tick", ({ timeLeft }: { timeLeft: number }) =>
      setTimeLeft(timeLeft),
    );

    socketRef.current.on("game_over", (data) => {
      setPhase("done");
      setResults(data);
    });

    socketRef.current.on(
      "powerup_active",
      ({ type, duration }: { type: string; duration: number }) => {
        if (type === "double") {
          setDoubleActive(true);
          setTimeout(() => setDoubleActive(false), duration);
        }
      },
    );

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
      socketRef.current?.off("connect");
      socketRef.current?.off("update_clicks");
      socketRef.current?.off("countdown_start");
      socketRef.current?.off("countdown_tick");
      socketRef.current?.off("game_start");
      socketRef.current?.off("timer_tick");
      socketRef.current?.off("game_over");
      socketRef.current?.off("powerup_active");
    };
  }, [room.code]);

  const totalClicks =
    myClicks + Object.values(playerClicks).reduce((a, b) => a + b, 0);
  const myPct =
    totalClicks === 0
      ? Math.round(100 / room.players.length)
      : Math.round((myClicks / totalClicks) * 100);
  const iWon = results?.winner?.id === user?.id;

  return (
    <div className="min-h-screen bg-[#1a0a22] text-white flex flex-col p-4 gap-4">
      {/* Results overlay */}
      {phase === "done" && results && (
        <div className="absolute inset-0 bg-[#1a0a22]/95 flex flex-col items-center justify-center gap-8 z-10">
          <div className="text-center">
            <p className="text-6xl mb-4">
              {results.winner ? (iWon ? "🏆" : "😤") : "🤝"}
            </p>
            <p className="text-sm text-purple-400 uppercase tracking-widest mb-2">
              {results.winner ? "winner" : "tie game"}
            </p>
            <p className="text-4xl font-bold font-fredoka">
              {results.winner ? results.winner.username : "Nobody"}
            </p>
          </div>

          {/* Leaderboard */}
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {[...results.players]
              .sort((a, b) => b.clicks - a.clicks)
              .map((p, i) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center bg-[#2a0a3a] rounded-lg px-4 py-2 border border-purple-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold w-4">
                      {i + 1}
                    </span>
                    <span className="font-fredoka font-medium">
                      {p.username}
                    </span>
                  </div>
                  <span className="font-bold text-purple-300">{p.clicks}</span>
                </div>
              ))}
          </div>

          <Link
            href="/"
            className="px-8 py-3 rounded-full bg-purple-700 hover:bg-purple-600 transition-all font-semibold"
          >
            Back to lobby
          </Link>
        </div>
      )}

      {/* Timer */}
      <div className="text-center pt-4">
        {phase === "waiting" && (
          <p className="text-purple-400 text-xl animate-pulse">
            Waiting for players...
          </p>
        )}
        {phase === "countdown" && (
          <div>
            <p className="text-xs text-purple-500 uppercase tracking-widest mb-1">
              Get ready
            </p>
            <p className="text-8xl font-bold font-fredoka text-yellow-400">
              {timeLeft}
            </p>
          </div>
        )}
        {phase === "running" && (
          <div>
            <p className="text-xs text-purple-500 uppercase tracking-widest mb-1">
              Time left
            </p>
            <p
              className={`text-7xl font-bold font-fredoka tabular-nums ${timeLeft <= 5 ? "text-red-400" : "text-purple-300"}`}
            >
              {timeLeft}s
            </p>
          </div>
        )}
      </div>

      {/* Players */}
      <div className="flex justify-around items-center bg-[#2a0a3a] rounded-xl border border-purple-900 p-4">
        {/* Me */}
        <div className="flex flex-col items-center gap-1">
          {me && (
            <Image
              src={me.avatar}
              alt={me.username}
              width={52}
              height={52}
              className="rounded-full border-2 border-purple-500"
            />
          )}
          <p className="text-xs text-purple-300 font-fredoka">
            {me?.global_name ?? me?.username}
          </p>
          <p className="text-3xl font-bold text-purple-300">{myClicks}</p>
        </div>

        <p className="text-purple-700 font-bold text-lg">VS</p>

        {/* Others */}
        {others.map((opponent, i) => (
          <div
            key={`${opponent.id}-${i}`}
            className="flex flex-col items-center gap-1"
          >
            <Image
              src={opponent.avatar}
              alt={opponent.username}
              width={52}
              height={52}
              className="rounded-full border-2 border-pink-500"
            />
            <p className="text-xs text-pink-300 font-fredoka">
              {opponent.global_name ?? opponent.username}
            </p>
            <p className="text-3xl font-bold text-pink-300">
              {playerClicks[opponent.id] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#2a0a3a] rounded-full h-2 overflow-hidden border border-purple-900">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${myPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-purple-700">
        <span>{myPct}%</span>
        <span>{100 - myPct}%</span>
      </div>

      {/* Click button */}
      <div className="flex justify-center py-4">
        <button
          onClick={addClick}
          disabled={phase !== "running"}
          className="w-44 h-44 rounded-full bg-purple-700 hover:bg-purple-600 active:scale-90 transition-all text-2xl font-bold font-fredoka shadow-2xl shadow-purple-900/50 border-4 border-purple-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-purple-700"
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

      {/* Power-ups */}
      {room.powerups && (
        <PowerupsBox>
          <Powerup
            onUse={handlePowerupUse}
            myClicks={myClicks}
            phase={phase}
            doubleActive={doubleActive}
          />
        </PowerupsBox>
      )}
    </div>
  );
}

export default GameClient;
