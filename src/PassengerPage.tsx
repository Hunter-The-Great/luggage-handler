import { useState } from "react";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { toast } from "sonner";
import { SheetForm } from "./components/sheetForm";
import { usePassengers } from "./usePassengers";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { Checkbox } from "./components/ui/checkbox";
import { Button } from "./components/ui/button";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAuth } from "./checkAuth";
import type { Status } from "./db/schema";

export const PassengerPage = () => {
  const { user } = useAuth();
  const { passengers, removePassengers } = usePassengers(
    user.role === "admin" ? "" : user.airline,
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const selectAll =
    selected.size === passengers.length && passengers.length !== 0;

  const HandleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(passengers.map((passenger) => passenger.id)));
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
      toast.warning("Please select at least one passenger to delete", {
        position: "top-center",
      });
      return;
    }
    toast.warning("Are you sure you want to delete these passengers?", {
      position: "top-center",
      duration: Infinity,
      action: {
        label: "Delete",
        onClick: async () => {
          toast.promise(
            removePassengers
              .mutateAsync(Array.from(selected))
              .then(() => {
                setSelected(new Set());
              })
              .catch((err) => {
                throw new Error(err);
              }),
            {
              position: "top-center",
              loading: "Removing Passengers...",
              success: "Passengers removed successfully",
              error: "Failed to remove passengers",
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

  const parseStatus = (status: Status) => {
    switch (status) {
      case "not-checked-in":
        return <p className="text-amber-300">Not checked in</p>;
      case "checked-in":
        return <p className="text-blue-600">Checked in</p>;
      case "boarded":
        return <p className="text-green-500">Boarded</p>;
      default:
        return "–";
    }
  };

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
        <AddPassengerForm />
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
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Identification</TableCell>
            <TableCell>Ticket</TableCell>
            <TableCell>Flight Number</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {passengers.map((passenger) => {
            return (
              <TableRow
                className={
                  passenger.remove
                    ? "bg-red-800/50 dark:hover:bg-red-900/60"
                    : ""
                }
                id={passenger.id.toString()}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(passenger.id)}
                    onCheckedChange={(checked: boolean) =>
                      HandleSelectRow(passenger.id, checked)
                    }
                  />
                </TableCell>
                <TableCell>{passenger.firstName || "–"}</TableCell>
                <TableCell>{passenger.lastName || "–"}</TableCell>
                <TableCell>{passenger.identification || "–"}</TableCell>
                <TableCell>{passenger.ticket || "–"}</TableCell>
                <TableCell>{passenger.flight || "–"}</TableCell>
                <TableCell>
                  {passenger.remove ? (
                    <p className="text-red-500 text-shadow-xs text-shadow-black/50 ">
                      Flagged for removal
                    </p>
                  ) : (
                    parseStatus(passenger.status)
                  )}
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

const AddPassengerForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [identification, setIdentification] = useState("");
  const [flight, setFlight] = useState("");
  const { user } = useAuth();
  const { addPassenger } = usePassengers(
    user.role === "admin" ? "" : user.airline,
  );

  const handleSubmit = async () => {
    return new Promise<void>(async (resolve) => {
      toast.promise(
        addPassenger
          .mutateAsync({
            firstName,
            lastName,
            identification: identification,
            flight,
          })
          .then(() => {
            setFlight("");
            setFirstName("");
            setLastName("");
            setIdentification("");
            resolve();
          })
          .catch((err) => {
            throw new Error(err);
          }),
        {
          position: "top-center",
          loading: "Adding passenger...",
          success: "Passenger added successfully",
          error: (err) => err.message || "Failed to add Passenger",
        },
      );
    });
  };

  // TODO: make flight number a dropdown menu?
  // maybe this: https://ui.shadcn.com/docs/components/radix/combobox
  return (
    <SheetForm
      title="Add a Passenger"
      label="Add User"
      handleSubmit={handleSubmit}
    >
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
      <Label>Identification</Label>
      <Input
        type="string"
        className="border rounded-lg"
        placeholder="000000"
        value={identification || ""}
        onChange={(e) => setIdentification(e.target.value)}
      ></Input>
      <div className="flex h-2" />
      <Label>Flight Number</Label>
      <Input
        type="text"
        className="border rounded-lg"
        placeholder="XX0000"
        value={flight}
        onChange={(e) => setFlight(e.target.value)}
      ></Input>
    </SheetForm>
  );
};
