type PowerUpsProps = {
  phase: "waiting" | "countdown" | "running" | "done";
  myClicks: number;
  doubleActive: boolean;
  onUse: (type: string) => void;
};

function Powerup({ phase, onUse, doubleActive, myClicks }: PowerUpsProps) {
  return (
    <button
      onClick={() => onUse("double")}
      disabled={phase !== "running" || myClicks < 15}
      className={`px-4 ${doubleActive ? "bg-green-500" : "bg-indigo-800"} py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-30 text-sm font-semibold transition-all`}
    >
      {doubleActive ? "2x active!" : "Double (15)"}
    </button>
  );
}

export default Powerup;
