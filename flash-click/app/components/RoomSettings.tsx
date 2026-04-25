import ToggleButton from "./ToggleButton";
import type { Settings } from "@/lib/types";

import { motion } from "motion/react";

type RoomSettingsProps = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onConfirm: () => void;
  onBack: () => void;
};

function RoomSettings({
  settings,
  onBack,
  setSettings,
  onConfirm,
}: RoomSettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="p-4 flex flex-col gap-4 w-full"
    >
      <p className="text-xl font-fredoka font-semibold text-center">Settings</p>

      <div className="flex justify-between items-center w-full">
        <p className="font-medium">Duration</p>
        <input
          type="number"
          value={settings.duration}
          min={5}
          max={60}
          onChange={(e) =>
            setSettings((s) => ({ ...s, duration: +e.target.value }))
          }
          className="w-16 text-center bg-indigo-950 border border-indigo-700 hover:border-indigo-500 focus:border-indigo-400 focus:outline-none rounded-lg p-1.5 text-sm font-semibold transition-colors"
        />
      </div>

      <div className="flex justify-between items-center w-full">
        <p className="font-medium">Click goal</p>
        <input
          type="number"
          value={settings.clickGoal ?? ""}
          placeholder="None"
          min={10}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              clickGoal: e.target.value ? +e.target.value : null,
            }))
          }
          className="w-16 text-center bg-indigo-950 border border-indigo-700 hover:border-indigo-500 focus:border-indigo-400 focus:outline-none rounded-lg p-1.5 text-sm font-semibold transition-colors placeholder:text-indigo-600"
        />
      </div>
      <div className="flex justify-between items-center w-full">
        <p className="font-medium">Countdown</p>
        <input
          type="number"
          value={settings.countdown ?? ""}
          placeholder="None"
          min={1}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              countdown: e.target.value ? +e.target.value : 0,
            }))
          }
          className="w-16 text-center bg-indigo-950 border border-indigo-700 hover:border-indigo-500 focus:border-indigo-400 focus:outline-none rounded-lg p-1.5 text-sm font-semibold transition-colors placeholder:text-indigo-600"
        />
      </div>
      <div className="flex justify-between items-center w-full">
        <p className="font-medium">Max Players</p>
        <input
          type="number"
          value={settings.maxPlayers ?? 2}
          min={2}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              maxPlayers: e.target.value ? +e.target.value : 2,
            }))
          }
          className="w-16 text-center bg-indigo-950 border border-indigo-700 hover:border-indigo-500 focus:border-indigo-400 focus:outline-none rounded-lg p-1.5 text-sm font-semibold transition-colors placeholder:text-indigo-600"
        />
      </div>

      <div className="flex justify-between items-center w-full">
        <p className="font-medium">Power-ups</p>
        <ToggleButton
          toggled={settings.powerups}
          setToggle={(val) => setSettings((s) => ({ ...s, powerups: val }))}
        />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={onBack}
          className="flex-1 py-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 transition-all text-sm"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-all font-semibold text-sm"
        >
          Create →
        </button>
      </div>
    </motion.div>
  );
}

export default RoomSettings;
