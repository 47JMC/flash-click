import Lobby from "./components/Lobby";
import UserProfile from "./components/UserProfile";
import { UserProvider } from "./components/UserProvider";

function page() {
  return (
    <UserProvider>
      <div className="relative min-h-screen flex flex-col justify-center items-center pt-20 sm:pt-0">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <UserProfile />
        </div>
        <Lobby />
      </div>
    </UserProvider>
  );
}

export default page;
