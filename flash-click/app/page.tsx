import Lobby from "./components/Lobby";
import { UserProvider } from "./components/UserProvider";

function page() {
  return (
    <div className="flex min-h-screen flex-col justify-center items-center">
      <UserProvider>
        <Lobby />
      </UserProvider>
    </div>
  );
}

export default page;
