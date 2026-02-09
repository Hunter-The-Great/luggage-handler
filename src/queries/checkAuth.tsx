import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLocalStorage } from "@uidotdev/usehooks";
import { client } from "@/client";
import type { RoleType } from "@/db/schema";

type Auth = {
  user: any;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<null | Auth>(null);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useLocalStorage<null | {
    username: string;
    role: RoleType;
    airline: string;
    fullAirline: string;
    newAccount: boolean;
  }>("auth", null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const response = await client.api.auth.profile.get();

    if (response.error) {
      console.log(response.error);
    }
    setUser(response.data);
  };

  const login = async (username: string, password: string) => {
    const response = await client.api.auth.login.post({
      username,
      password,
    });

    if (response.status === 401) {
      return { success: false, message: "Invalid Credentials" };
    }
    if (response.error) {
      return { success: false, message: "Failed to login" };
    }

    const data = response.data;

    setUser(data.user);

    return { success: true };
  };

  const logout = async () => {
    const response = await client.api.auth.logout.post();
    if (response.error) throw new Error("Failed to logout");

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

const RoleGuard = ({
  allowedRoles,
  children,
  fallback = null,
}: {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback;
  }

  return <>{children}</>;
};

export { AuthProvider, useAuth, RoleGuard };
