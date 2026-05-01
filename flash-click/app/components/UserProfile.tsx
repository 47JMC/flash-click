"use client";

import Image from "next/image";
import { useAuth } from "./UserProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function UserProfile() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return (
    <div className="flex justify-center items-center gap-3 p-3 bg-indigo-950 rounded-md">
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
      <a
        href={`${API_URL}/auth/logout`}
        className="rounded-lg px-3 py-2 text-white text-sm mt-2 border-2 border-indigo-950 hover:border-red-600 hover:bg-red-400 transition-colors"
      >
        Logout
      </a>
    </div>
  );
}

export default UserProfile;
