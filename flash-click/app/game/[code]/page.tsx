import GameClient from "@/app/components/GameClient";
import { UserProvider } from "@/app/components/UserProvider";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const res = await fetch(`${API_BASE_URL}/rooms/${code}`);

  if (!res.ok) return <p>Room not found</p>;

  const room = await res.json();

  return (
    <div>
      <UserProvider>
        <GameClient room={room} />
      </UserProvider>
    </div>
  );
}

export default page;
