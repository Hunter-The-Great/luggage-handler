import { useState } from "react";
import { useAuth } from "./checkAuth";
import { useNavigate } from "react-router";
import { Form } from "./components/form";

export const LoginForm = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<null | string>(null);
  const navigate = useNavigate();

  const handleSubmit = async (username: string, password: string) => {
    const result = await login(username, password);
    console.log(username, password);

    setError(result.message || null);

    if (result.success) {
      setUsername("");
      setPassword("");
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex flex-col justify-center items-center self-center p-20 w-3/5">
        <Form
          title="Login"
          error={error}
          handleSubmit={handleSubmit}
          submitArgs={[username, password]}
        >
          <label className="opacity-80 text-sm">Username</label>
          <input
            type="text"
            className="border"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label className="pt-4 opacity-80 text-sm">Password</label>
          <input
            type="password"
            className="border"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form>
      </div>
    </div>
  );
};
