import { useState } from "react";
import { useAuth } from "./checkAuth";
import { client } from "./client";
import { Input } from "./components/ui/input";
import { Form } from "./components/form";
import { Separator } from "./components/ui/separator";
import { Label } from "./components/ui/label";

export const PasswordForm = () => {
  const [status, setStatus] = useState<null | string>(null);
  const [error, setError] = useState<null | string>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [success, setSuccess] = useState<null | string>(null);
  const { logout } = useAuth();

  const HandleSubmit = async () => {
    setError(null);
    setStatus("Processing...");
    const response = await client.api.auth["change-password"].post({
      oldPassword,
      newPassword,
      confirmation,
    });
    console.log(response);
    if (response.error) {
      setStatus(null);
      setError(response.error.value.toString());
      return;
    }
    setStatus(null);
    setSuccess("Password changed – logging out...");
    setTimeout(() => {
      logout();
    }, 2000);
  };

  return (
    <div className="flex justify-center items-center p-6">
      <Form
        title="Change Password"
        loading={status}
        error={error}
        success={success}
        handleSubmit={HandleSubmit}
      >
        <Label>Old Password</Label>
        <Input
          className="border"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <div className="flex h-4" />
        <div className="flex gap-4">
          <div className="grow">
            <Label>New Password</Label>
            <Input
              className="border"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="grow">
            <Label>Confirm New Password</Label>
            <Input
              className="border"
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
        </div>
      </Form>
    </div>
  );
};
