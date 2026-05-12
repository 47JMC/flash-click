import ToggleButton from "./ToggleButton";
import type { Settings } from "@/lib/types";
import { motion } from "motion/react";

type RoomSettingsProps = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onConfirm: () => void;
  onBack: () => void;
};

type SettingRowProps = {
  label: string;
  children: React.ReactNode;
};

function SettingRow({ label, children }: SettingRowProps) {
  return (
    <div className="flex justify-between items-center w-full py-2 border-b border-indigo-900/50 last:border-0">
      <p className="text-sm font-medium text-indigo-200">{label}</p>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  min,
  max,
  placeholder,
  onChange,
}: {
  value: number | string;
  min?: number;
  max?: number;
  placeholder?: string;
  onChange: (val: string) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 text-center bg-indigo-950/80 border border-indigo-700 hover:border-indigo-500 focus:border-indigo-400 focus:outline-none rounded-lg p-1.5 text-sm font-semibold transition-colors placeholder:text-indigo-700 text-white"
    />
  );
}

function RoomSettings({
  settings,
  onBack,
  setSettings,
  onConfirm,
}: RoomSettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-1 w-full"
    >
      <p className="text-base font-fredoka font-semibold text-indigo-300 uppercase tracking-widest mb-2 text-center">
        Room Settings
      </p>

      <div className="bg-indigo-950/50 border border-indigo-900 rounded-xl px-4 py-2 flex flex-col">
        <SettingRow label="Duration">
          <NumberInput
            value={settings.duration}
            min={5}
            max={300}
            onChange={(v) => setSettings((s) => ({ ...s, duration: +v }))}
          />
        </SettingRow>

        <SettingRow label="Click goal">
          <NumberInput
            value={settings.clickGoal ?? ""}
            min={10}
            placeholder="None"
            onChange={(v) =>
              setSettings((s) => ({ ...s, clickGoal: v ? +v : null }))
            }
          />
        </SettingRow>

        <SettingRow label="Countdown">
          <NumberInput
            value={settings.countdown ?? ""}
            min={0}
            max={30}
            placeholder="0"
            onChange={(v) =>
              setSettings((s) => ({ ...s, countdown: v ? +v : 0 }))
            }
          />
        </SettingRow>

        <SettingRow label="Max players">
          <NumberInput
            value={settings.maxPlayers ?? 2}
            min={2}
            max={10}
            onChange={(v) =>
              setSettings((s) => ({ ...s, maxPlayers: v ? +v : 2 }))
            }
          />
        </SettingRow>

        <SettingRow label="Power-ups">
          <ToggleButton
            toggled={settings.powerups}
            setToggle={(val) => setSettings((s) => ({ ...s, powerups: val }))}
          />
        </SettingRow>

        <SettingRow label="Visibility">
          <div className="flex items-center gap-2">
            <span className="text-sm text-indigo-400">
              {settings.visibility === "private" ? "Private" : "Public"}
            </span>
            <ToggleButton
              toggled={settings.visibility === "private"}
              setToggle={(val) =>
                setSettings((s) => ({
                  ...s,
                  visibility: val ? "private" : "public",
                }))
              }
            />
          </div>
        </SettingRow>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onBack}
          className="flex-1 py-2 rounded-lg bg-transparent hover:bg-indigo-900/50 border border-indigo-800 hover:border-indigo-600 transition-all text-sm text-indigo-300"
        >
          ← Back
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all font-semibold text-sm text-white border border-indigo-400"
        >
          Create →
        </button>
      </div>
    </motion.div>
  );
}

export default RoomSettings;
