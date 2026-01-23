import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { client } from "./client";

type auth = {
  user: any;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<null | auth>(null);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<null | {
    username: string;
    role: "admin" | "airline" | "gate" | "ground";
  }>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const response = await client.profile.get();

    if (response.error) {
      console.log(response.error);
    }
    setUser(response.data);
  };

  const login = async (username: string, password: string) => {
    const response = await client.login.post({
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
    const response = await client.logout.post();
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
    return (
      fallback || (
        <div className="text-red-600">Please log in to view this content</div>
      )
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      fallback || (
        <div className="text-yellow-600">
          You don't have permission to view this content
        </div>
      )
    );
  }

  return <>{children}</>;
};

export { AuthProvider, useAuth, RoleGuard };
