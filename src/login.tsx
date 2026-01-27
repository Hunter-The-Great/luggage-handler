import { useState } from "react";
import { useAuth } from "./checkAuth";
import { useNavigate } from "react-router";
import { Form } from "./components/form";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { toast } from "sonner";

export const LoginForm = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | string>(null);
  const navigate = useNavigate();

  const handleSubmit = async (username: string, password: string) => {
    setLoading(" ");
    await toast
      .promise(
        new Promise<void>(async (resolve, reject) => {
          const res = await login(username, password);
          if (res.success) {
            resolve();
          }
          reject();
        }),
        {
          position: "top-center",
          error: "Failed to login",
        },
      )
      .unwrap()
      .then(() => {
        setUsername("");
        setPassword("");
        navigate("/");
      })
      .catch(() => {
        setLoading(null);
      });
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex flex-col justify-center items-center self-center p-20 w-3/5">
        <Form
          title="Login"
          handleSubmit={handleSubmit}
          loading={loading}
          submitArgs={[username, password]}
        >
          <Label>Username</Label>
          <Input
            type="text"
            className="border"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Label>Password</Label>
          <Input
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
