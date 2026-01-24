import { createContext, useContext, useEffect, useState } from "react";
import "./index.css";
import type { Todo } from ".";
import { useTodos } from "./useTodos";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { client } from "./client";
import type { RoleType } from "./db/schema";
import { roles } from "./db/schema";
import { AuthProvider, RoleGuard, useAuth } from "./checkAuth";

const ThemeContext = createContext<null | string>(null);

const queryClient = new QueryClient();

export function App() {
  const [mode, setMode] = useState("dark");

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <LoginForm />
        <RoleGuard allowedRoles={["admin", "ground", "airline", "gate"]}>
          <LogoutButton />
        </RoleGuard>
        <br />
        <RoleGuard allowedRoles={["admin"]}>
          <AdminComponent />
          <AddUserForm />
        </RoleGuard>
        <Todos />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AuthProvider>
  );
}

const Todos = () => {
  const { todos, addTodo, isLoading } = useTodos();
  const [input, setInput] = useState("");
  const toggleTodo = (id: string) => {};
  return (
    <>
      <label>Todo Name</label>
      <input
        value={input}
        className="border"
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={() => addTodo.mutate(input)}>Add Todo</button>
      {isLoading ? <div>Loading...</div> : null}
      <div>
        {todos.map((todo) => (
          <Todo toggleTodo={toggleTodo} todo={todo} />
        ))}
      </div>
    </>
  );
};

const HelloWorld = (props: { name: string }) => {
  const mode = useContext(ThemeContext);
  if (!mode) {
    throw new Error("ThemeContext is not defined");
  }
  return <div>Current theme: {mode}</div>;
};

const LoginForm = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<null | string>(null);

  const handleSubmit = async (username: string, password: string) => {
    const result = await login(username, password);
    setUsername("");
    setPassword("");

    setError(result.message || null);
  };

  return (
    <>
      <label>Username</label>
      <input
        type="text"
        className="border"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <label>Password</label>
      <input
        type="password"
        className="border"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => handleSubmit(username, password)}>Login</button>
      {error ? <div className="text-red-600">{error}</div> : null}
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
      <button onClick={() => handleLogout()}>Logout</button>
    </>
  );
};

const Todo = (props: { todo: Todo; toggleTodo: (text: string) => void }) => {
  const queryClient = useQueryClient();

  return (
    <div>
      <input
        type="checkbox"
        checked={props.todo.complete}
        onClick={() => {
          props.toggleTodo(props.todo.text);
        }}
      ></input>
      {props.todo.text}
      <button className="pl-5">Delete</button>
    </div>
  );
};

const AdminComponent = () => {
  return (
    <div className="p-6 bg-blue-100 rounded-lg border-2 border-blue-500">
      <h2 className="text-2xl font-bold text-blue-800 mb-2">Admin Component</h2>
      <p className="text-blue-700">This is exclusive content for admins.</p>
    </div>
  );
};

const AddUserForm = () => {
  const [role, setRole] = useState<null | RoleType>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [airline, setAirline] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState<null | string>(null);

  const handleSubmit = async () => {
    setLoading("Processing...");
    setError(null);
    const result = await client.admin.register.post({
      role: role || null,
      firstName,
      lastName,
      email,
      phone,
      airline,
    });
    if (result.error) {
      setError("Failed to register user");
      setLoading(null);
    } else if (result.data.success === false) {
      setError(result.data.message || "Failed to register user");
      setLoading(null);
    } else {
      setLoading("Success");
      setError(null);
      setEmail("");
      setPhone("");
      setAirline("");
      setFirstName("");
      setLastName("");
    }
  };

  return (
    <div className="flex flex-col w-sm">
      <label>Role</label>
      <select onChange={(e) => setRole(e.target.value as RoleType)}>
        <option value="">Select a role</option>
        {roles.enumValues.map((role) => {
          if (role === "admin") return;
          return <option value={role}>{role}</option>;
        })}
      </select>
      <label>First Name</label>
      <input
        type="text"
        className="border"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      ></input>
      <label>Last Name</label>
      <input
        type="text"
        className="border"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      ></input>
      <label>Email</label>
      <input
        type="text"
        className="border"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      ></input>
      <label>Phone</label>
      <input
        type="text"
        className="border"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      ></input>
      <label>Airline</label>
      <input
        type="text"
        className="border"
        value={airline}
        onChange={(e) => setAirline(e.target.value)}
      ></input>
      <button onClick={() => handleSubmit()}>Add User</button>
      {loading ? <div>{loading}</div> : null}
      {error ? <div className="text-red-600">{error}</div> : null}
    </div>
  );
};

export default App;
