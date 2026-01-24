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
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

const ThemeContext = createContext<null | string>(null);

const queryClient = new QueryClient();

export function App() {
  const [mode, setMode] = useState("dark");

  return (
    <div className="flex flex-col justify-center items-center p-6">
      <AddUserForm />
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
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
    setError(null);
    setLoading("Processing...");
    const result = await client.api.admin.register.post({
      role: role || null,
      firstName,
      lastName,
      email,
      phone,
      airline,
    });
    if (result.error) {
      setError(result.error.value.toString());
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
    <div className="flex flex-col">
      <label>Role</label>
      <select
        className="p-1 border rounded-lg"
        onChange={(e) => setRole(e.target.value as RoleType)}
      >
        <option value="">Select a role</option>
        {roles.enumValues.map((role) => {
          if (role === "admin") return;
          return <option value={role}>{role}</option>;
        })}
      </select>
      <div className="flex h-2" />
      <label>First Name</label>
      <Input
        type="text"
        className="border rounded-lg"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      ></Input>
      <div className="flex h-2" />
      <label>Last Name</label>
      <Input
        type="text"
        className="border rounded-lg"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      ></Input>
      <div className="flex h-2" />
      <label>Email</label>
      <Input
        type="text"
        className="border rounded-lg"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      ></Input>
      <div className="flex h-2" />
      <label>Phone</label>
      <Input
        type="text"
        className="border rounded-lg"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      ></Input>
      <div className="flex h-2" />
      <label>Airline</label>
      <Input
        type="text"
        className="border rounded-lg"
        value={airline}
        onChange={(e) => setAirline(e.target.value)}
      ></Input>
      <div className="flex h-2" />
      <Button className="w-1/2 self-center" onClick={() => handleSubmit()}>
        Add User
      </Button>
      {loading ? <div className="text-center">{loading}</div> : null}
      {error ? <div className="text-red-600 text-center">{error}</div> : null}
    </div>
  );
};

export default App;
