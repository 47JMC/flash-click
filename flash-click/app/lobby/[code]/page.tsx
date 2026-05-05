import { UserProvider } from "@/app/components/UserProvider";
import LobbyClient from "@/app/components/LobbyClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const res = await fetch(`${API_BASE_URL}/rooms/${code}`);

  if (!res.ok) return <p>Room not found</p>;

  const room = await res.json();

  return (
    <UserProvider>
      <LobbyClient room={room} />
    </UserProvider>
  );
}

export default page;
