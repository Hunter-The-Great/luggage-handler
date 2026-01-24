import { useNavigate } from "react-router";
import { useAuth } from "./checkAuth";

export const TopBar = () => {
  const navigate = useNavigate();

  const ChangePasswordButton = () => {
    return (
      <>
        <button
          className="px-2 py-1 rounded-lg  bg-blue-600 hover:bg-blue-700 transition duration-200"
          onClick={() => navigate("/change-password")}
        >
          Change Password
        </button>
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
        <button
          className="px-2 py-1 rounded-lg  bg-blue-600 hover:bg-blue-700 transition duration-200"
          onClick={() => handleLogout()}
        >
          Logout
        </button>
      </>
    );
  };

  const LoginButton = () => {
    const handleLogin = async () => {
      navigate("/login");
    };
    return (
      <>
        <button
          className="px-2 py-1 rounded-lg  bg-blue-600 hover:bg-blue-700 transition duration-200"
          onClick={() => handleLogin()}
        >
          Login
        </button>
      </>
    );
  };

  const HomeButton = () => {
    return (
      <>
        <button className="p-1 bg-blue-600 rounded-xl hover:bg-blue-700 transition duration-200">
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

  const ProfileButtons = () => {
    const { user } = useAuth();

    if (!user) return <LoginButton />;
    return (
      <>
        <ChangePasswordButton />
        <LogoutButton />
      </>
    );
  };

  return (
    <nav className="flex flex-row p-3 justify-between items-center bg-slate-900">
      <div className="flex-1">
        <HomeButton />
      </div>
      <div className="flex-1 flex justify-center">
        <h1 className="text-2xl font-bold" onClick={() => navigate("/")}>
          Super Cool Website
        </h1>
      </div>
      <div className="flex-1 flex gap-2 justify-end">
        <ProfileButtons />
      </div>
    </nav>
  );
};
