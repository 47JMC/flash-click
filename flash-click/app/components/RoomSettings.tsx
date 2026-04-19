import ToggleButton from "./ToggleButton";

import type { Settings } from "@/lib/types";

type RoomSettingsProps = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onConfirm: () => void;
  onBack: () => void;
};

function RoomSettings({
  settings,
  setSettings,
  onConfirm,
  onBack,
}: RoomSettingsProps) {
  return (
    <div className="p-10 m-4">
      <p className="text-xl font-fredoka font-semibold">Settings</p>
      <ToggleButton />
    </div>
  );
}

export default RoomSettings;
