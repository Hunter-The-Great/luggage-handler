import { useState } from "react";
import { useAuth } from "./checkAuth";

export const LoginForm = () => {
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
