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
  startedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
