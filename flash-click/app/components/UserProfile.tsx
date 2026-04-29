"use client";

import Image from "next/image";
import { useAuth } from "./UserProvider";

function UserProfile() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-indigo-950 rounded-md">
      <Image
        src={user.avatar}
        alt={user.username}
        width={48}
        height={48}
        className="rounded-full"
      />
      <div className="flex flex-col font-fredoka font-medium">
        <p className="text-lg font-semibold">
          {user.global_name ?? user.username}
        </p>
        <p className="text-sm text-gray-400">@{user.username}</p>
      </div>
    </div>
  );
}

export default UserProfile;
