import { useState } from "react";
import { useAuth } from "./checkAuth";
import { client } from "./client";

export const PasswordForm = () => {
  const [status, setStatus] = useState<null | string>(null);
  const [error, setError] = useState<null | string>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
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
    setStatus("Password changed – logging out...");
    setTimeout(() => {
      logout();
    }, 2000);
  };

  return (
    <div className="flex flex-col justify-center items-center p-6">
      <label>Old Password</label>
      <input
        className="border"
        type="password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
      />
      <div className="flex h-2" />
      <label>New Password</label>
      <input
        className="border"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <div className="flex h-2" />
      <label>Confirm New Password</label>
      <input
        className="border"
        type="password"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
      />
      <div className="flex h-2" />
      <button onClick={() => HandleSubmit()}>Change Password</button>
      {status ? <div>{status}</div> : null}
      {error ? <div className="text-red-600">{error}</div> : null}
    </div>
  );
};
