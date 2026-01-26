import { createContext, useContext, useEffect, useState } from "react";
import "./index.css";
import type { Todo } from ".";
import { useTodos } from "./useTodos";
import { useQueryClient, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { client } from "./client";
import type { RoleType } from "./db/schema";
import { roles } from "./db/schema";
import { Input } from "./components/ui/input";
import { Form } from "./components/form";
import { Label } from "./components/ui/label";
import { toast } from "sonner";
import {
  NativeSelect,
  NativeSelectOption,
} from "./components/ui/native-select";

export function App() {
  return (
    <div className="flex flex-col justify-center items-center p-6">
      <AddUserForm />
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
}

const Todo = (props: { todo: Todo; toggleTodo: (text: string) => void }) => {
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
  const [success, setSuccess] = useState<null | string>(null);

  const handleSubmit = async () => {
    /*
    toast.success("User created successfully", {
      position: "top-center",
      dismissible: true,
    });
    return;
    */
    setSuccess(null);
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
      setLoading(null);
      setError(null);
      setSuccess("Success");
      setEmail("");
      setPhone("");
      setAirline("");
      setFirstName("");
      setLastName("");
      toast.success("User created successfully", {
        position: "top-center",
        dismissible: true,
      });
    }
  };

  return (
    <Form
      title="Add a User"
      loading={loading}
      error={error}
      success={success}
      handleSubmit={handleSubmit}
    >
      <Label>Role</Label>
      <NativeSelect onChange={(e) => setRole(e.target.value as RoleType)}>
        <NativeSelectOption value="">Select a role</NativeSelectOption>
        {roles.enumValues.map((role) => {
          if (role === "admin") return;
          return <NativeSelectOption value={role}>{role}</NativeSelectOption>;
        })}
      </NativeSelect>
      <div className="flex h-2" />
      <div className="flex gap-4">
        <div className="grow">
          <Label>First Name</Label>
          <Input
            type="text"
            className="border rounded-lg"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          ></Input>
        </div>
        <div className="grow">
          <Label>Last Name</Label>
          <Input
            type="text"
            className="border rounded-lg"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          ></Input>
        </div>
      </div>
      <div className="flex h-2" />
      <Label>Email</Label>
      <Input
        type="text"
        className="border rounded-lg"
        placeholder="example@gmail.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      ></Input>
      <div className="flex h-2" />
      <Label>Phone</Label>
      <Input
        type="text"
        className="border rounded-lg"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      ></Input>
      <div className="flex h-2" />
      <Label>Airline</Label>
      <Input
        type="text"
        className="border rounded-lg"
        value={airline}
        onChange={(e) => setAirline(e.target.value)}
      ></Input>
    </Form>
  );
};

export default App;
