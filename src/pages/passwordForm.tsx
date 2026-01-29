import { useState } from "react";
import { useAuth } from "@/queries/checkAuth";
import { client } from "@/client";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/form";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const PasswordForm = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { logout } = useAuth();

  const HandleSubmit = async () => {
    toast.promise(
      new Promise<void>(async (resolve, reject) => {
        client.api.auth["change-password"]
          .post({
            oldPassword,
            newPassword,
            confirmation,
          })
          .then((res) => {
            if (res.error) {
              reject(res.error.value);
            } else {
              setOldPassword("");
              setNewPassword("");
              setConfirmation("");
              setTimeout(() => {
                logout();
              }, 2000);
              resolve();
            }
          });
      }),
      {
        position: "top-center",
        loading: "Changing password...",
        success: "Password changed successfully, logging out",
        error: (err) => err,
      },
    );
  };

  return (
    <div className="flex justify-center items-center p-6">
      <Form title="Change Password" handleSubmit={HandleSubmit}>
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
