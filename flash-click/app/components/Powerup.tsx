"use client";

type PowerUpsProps = {
  phase: "waiting" | "countdown" | "running" | "done";
  myClicks: number;
  powerupActive: boolean;
  onUse: (type: string) => void;
  type: string;
  cost: number;
  label: string;
  description: string;
  emoji: string;
};

function Powerup({
  phase,
  onUse,
  powerupActive,
  myClicks,
  type,
  cost,
  label,
  description,
  emoji,
}: PowerUpsProps) {
  const canAfford = myClicks >= cost;
  const canUse = phase === "running" && canAfford && !powerupActive;

  return (
    <button
      onClick={() => onUse(type)}
      disabled={!canUse}
      className={`flex flex-col gap-1 p-3 rounded-xl border transition-all text-left w-full
        ${
          powerupActive
            ? "bg-green-900/40 border-green-500 shadow-lg shadow-green-900/30"
            : canUse
              ? "bg-gray-900 border-gray-700 hover:border-indigo-500 hover:bg-gray-800"
              : "bg-gray-900/50 border-gray-800 opacity-40 cursor-not-allowed"
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="text-sm font-semibold">
            {powerupActive ? `${label} active!` : label}
          </span>
        </div>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            canAfford
              ? "text-indigo-300 bg-indigo-900/50 border-indigo-700"
              : "text-gray-500 bg-gray-800 border-gray-700"
          }`}
        >
          {cost} clicks
        </span>
      </div>
      <p className="text-xs text-gray-500 pl-7">{description}</p>
    </button>
  );
}

export default Powerup;
