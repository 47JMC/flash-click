export type User = {
  id: string;
  username: string;
  global_name: string;
  avatar: string;
  clicks: number;
  isHost: boolean;
  socketId: string;
};

export type Room = {
  code: string;
  players: User[];
  status: "waiting" | "countdown" | "running" | "done";
  duration: number;
  countdown: number;
  clickGoal: number | null;
  powerups: boolean;
  maxPlayers: number;
  startedAt: Date;
};

export type Settings = {
  duration: number;
  countdown: number;
  clickGoal: number | null;
  powerups: boolean;
  maxPlayers: number;
};
