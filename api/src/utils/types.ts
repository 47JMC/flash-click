export type UserData = {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  clicks: number;
};

export type RoomType = {
  code: String;
  host: UserData;
  guest: UserData;
  status: "waiting" | "countdown" | "running" | "done";
  duration: Number;
  countdown: { type: Number; default: 3 };
  clickGoal: { type: Number; default: 0 };
  powerups: { type: Boolean; default: false };
  startedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Settings = {
  duration: number;
  countdown: number;
  clickGoal: number | null;
  powerups: boolean;
};
