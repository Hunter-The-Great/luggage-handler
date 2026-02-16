import { Link, useNavigate } from "react-router";
import { useAuth } from "./queries/checkAuth";
import { Button } from "./components/ui/button";

export const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const ChangePasswordButton = () => {
    return (
      <>
        <Button variant={"link"} onClick={() => navigate("/change-password")}>
          Change Password
        </Button>
      </>
    );
  };

  const LogoutButton = () => {
    const { logout } = useAuth();

    const handleLogout = async () => {
      await logout();
    };
    return (
      <>
        <Button variant={"secondary"} onClick={() => handleLogout()}>
          Logout
        </Button>
      </>
    );
  };

  const LoginButton = () => {
    const handleLogin = async () => {
      navigate("/login");
    };
    return (
      <>
        <Button variant={"secondary"} onClick={() => handleLogin()}>
          Login
        </Button>
      </>
    );
  };

  const HomeButton = () => {
    return (
      <>
        <button className="bg-blue-800 border border-blue-600/70 hover:border-blue-700/70 text-blue-50 hover:bg-blue-900/90 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800 hover:shadow dark:hover:shadow p-1 rounded-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            className="h-6 w-6"
            onClick={() => navigate("/")}
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
        </button>
      </>
    );
  };

  const MessageButton = () => {
    return (
      <>
        <Button variant={"link"} onClick={() => navigate("/messages")}>
          Messages
        </Button>
      </>
    );
  };

  const ProfileButtons = () => {
    if (!user) return <LoginButton />;
    return (
      <>
        <MessageButton />
        <ChangePasswordButton />
        <LogoutButton />
      </>
    );
  };

  return (
    <nav className="flex flex-row p-3 justify-between shadow border-b-neutral-700 border-b items-center bg-neutral-900">
      <div className="flex-1">
        <HomeButton />
      </div>
      <div className="flex-1 flex justify-center">
        <h1 className="text-2xl font-bold" onClick={() => navigate("/")}>
          {user?.fullAirline ? user.fullAirline : ""}
        </h1>
      </div>
      <div className="flex-1 flex justify-end">
        <ProfileButtons />
      </div>
    </nav>
  );
};
