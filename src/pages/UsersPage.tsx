import { useState } from "react";
import type { RoleType } from "@/db/schema";
import { roles } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { SheetForm } from "@/components/sheetForm";
import { useUsers } from "@/queries/useUsers";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const UsersPage = () => {
  const { users, RemoveUsers } = useUsers();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const selectAll = selected.size === users.length && users.length != 0;

  const HandleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(users.map((user) => user.id)));
    } else {
      setSelected(new Set());
    }
  };

  const HandleSelectRow = (id: number, checked: boolean) => {
    const newSelected = new Set(selected);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelected(newSelected);
  };

  const HandleDelete = async () => {
    if (selected.size === 0) {
      toast.warning("Please select at least one user to delete", {
        position: "top-center",
      });
      return;
    }
    toast.warning("Are you sure you want to delete these users?", {
      position: "top-center",
      duration: Infinity,
      action: {
        label: "Delete",
        onClick: async () => {
          toast.promise(
            RemoveUsers.mutateAsync(Array.from(selected)).then(() => {
              setSelected(new Set());
            }),
            {
              position: "top-center",
              loading: "Deleting users...",
              success: "Users deleted successfully",
              error: "Failed to delete users",
            },
          );
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  // TODO: filter by role?
  return (
    <div className="flex flex-col justify-center items-center p-6">
      <div className="flex flex-row w-full justify-between gap-4 pb-4">
        <Button
          variant={"destructive"}
          disabled={selected.size === 0}
          onClick={HandleDelete}
        >
          Delete
        </Button>
        <AddUserForm />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>
              <Checkbox
                checked={selectAll}
                onCheckedChange={(checked: boolean) => HandleSelectAll(checked)}
              />
            </TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Airline</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            if (user.role === "admin") return null;
            return (
              <TableRow id={user.id.toString()}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(user.id)}
                    onCheckedChange={(checked: boolean) =>
                      HandleSelectRow(user.id, checked)
                    }
                  />
                </TableCell>
                <TableCell>{user.username || "–"}</TableCell>
                <TableCell>{user.role || "–"}</TableCell>
                <TableCell>{user.firstName || "–"}</TableCell>
                <TableCell>{user.lastName || "–"}</TableCell>
                <TableCell>{user.email || "–"}</TableCell>
                <TableCell>{user.phone || "–"}</TableCell>
                <TableCell>
                  {(user.fullAirline || "–") + " | " + (user.airline || "–")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ReactQueryDevtools initialIsOpen={false} />
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
  const [fullAirline, setFullAirline] = useState("");
  const { AddUser } = useUsers();

  const handleSubmit = async () => {
    return new Promise<void>(async (resolve) => {
      toast.promise(
        AddUser.mutateAsync({
          role,
          firstName,
          lastName,
          email,
          phone,
          airline,
          fullAirline,
        })
          .then(() => {
            setEmail("");
            setPhone("");
            setAirline("");
            setFirstName("");
            setLastName("");
            resolve();
          })
          .catch((err) => {
            throw new Error(err);
          }),
        {
          position: "top-center",
          loading: "Creating user...",
          success: "User created successfully",
          error: (err) => err.message || "Failed to create user",
        },
      );
    });
  };

  return (
    <SheetForm title="Add a User" label="Add User" handleSubmit={handleSubmit}>
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
        value={fullAirline}
        onChange={(e) => setFullAirline(e.target.value)}
      ></Input>
      <Label>Airline Abbreviation</Label>
      <Input
        type="text"
        className="border rounded-lg"
        value={airline}
        onChange={(e) => setAirline(e.target.value)}
      ></Input>
    </SheetForm>
  );
};
