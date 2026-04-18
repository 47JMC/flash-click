import { User } from "@/lib/types";

function UserProfile({ userData }: { userData: User }) {
  return (
    <div className="p-3 m-3">
      <div className="flex font-fredoka font-medium justify-between">
        <p className="text-lg font-semibold">
          {userData.global_name ?? userData.username}
        </p>
        <p className="text-base text-gray-400">{userData.username}</p>
      </div>
    </div>
  );
}

export default UserProfile;
