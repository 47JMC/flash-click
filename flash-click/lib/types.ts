export type User = {
  id: string;
  username: string;
  global_name: string;
  avatar: string;
  clicks: number;
};

export type Room = {
  code: string;
  host: User;
  guest: User;
  status: "waiting" | "countdown" | "running" | "done";
  duration: number;
  startedAt: Date;
};
