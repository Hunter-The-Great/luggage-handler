import { MoreHorizontalIcon } from "lucide-react";
import { useAuth } from "@/queries/checkAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Status } from "@/db/schema";
import { usePassengers } from "@/queries/usePassengers";
import { toast } from "sonner";
import { useBags } from "@/queries/useBags";
import { useState } from "react";
import { SheetForm } from "@/components/sheetForm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useFlights } from "@/queries/useFlights";
import { Separator } from "@/components/ui/separator";

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

export const GatePage = () => {
  const { user } = useAuth();
  if (!user.airline) return <div>Invalid airline</div>;
  const { passengers, updateStatus } = usePassengers(user.airline);
  const { removeBags } = useBags();
  const { flights } = useFlights();

  const checkIn = (id: number) => {
    toast.promise(
      updateStatus.mutateAsync({ id }).catch((err) => {
        throw new Error(err);
      }),
      {
        position: "top-center",
        loading: "Checking in passenger...",
        success: "Passenger checked in successfully",
        error: "Failed to check in passenger",
      },
    );
  };

  const flag = async (id: number) => {
    toast.promise(
      updateStatus.mutateAsync({ id, flag: true }).catch((err) => {
        throw new Error(err);
      }),
      {
        position: "top-center",
        loading: "Flagging passenger for removal...",
        success: "Passenger flagged successfully",
        error: "Failed to flag passenger",
      },
    );
  };

  const handleRemoveBags = async (ticket: number) => {
    toast.warning(
      "Are you sure you want to remove all bags from this passenger?",
      {
        position: "top-center",
        duration: Infinity,
        action: {
          label: "Remove",
          onClick: async () => {
            toast.promise(removeBags.mutateAsync(ticket), {
              position: "top-center",
              loading: "Removing bags...",
              success: "Bags removed successfully",
              error: "Failed to remove bags",
            });
          },
        },
        cancel: {
          label: "Cancel",
          onClick: () => {},
        },
      },
    );
  };

  return (
    <div className="flex flex-row justify-center pt-10">
      <div className="flex flex-col grid-cols-2 gap-4 w-1/2 center items-center">
        <h1 className="text-3xl font-bold">Flights</h1>
        <Separator />
        <div className="grid grid-cols-2 gap-4 w-full">
          {flights.map((flight) => {
            return (
              <Button className="w-full" variant={"large"}>
                {flight.flight}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AddBagForm = (props: { ticket: number }) => {
  const { addBag } = useBags();
  const [terminal, setTerminal] = useState("");
  const [counter, setCounter] = useState("");

  const handleSubmit = async (ticket: number) => {
    return new Promise<void>(async (resolve) => {
      toast.promise(
        addBag
          .mutateAsync({
            terminal,
            counter,
            ticket,
          })
          .then(() => {
            setTerminal("");
            setCounter("");
            resolve();
          })
          .catch((err) => {
            throw new Error(err);
          }),
        {
          position: "top-center",
          loading: "Adding bag...",
          success: "Bag added successfully",
          error: (err) => err.message || "Failed to add bag",
        },
      );
    });
  };

  return (
    <SheetForm
      title="Add a Bag"
      label="Add Bag"
      cssDisabled={true}
      handleSubmit={handleSubmit}
      submitArgs={[props.ticket]}
    >
      <Label>Terminal</Label>
      <Input
        type="text"
        className="border rounded-lg"
        value={terminal}
        onChange={(e) => setTerminal(e.target.value)}
      ></Input>
      <Label>Counter</Label>
      <Input
        type="text"
        className="border rounded-lg"
        value={counter}
        onChange={(e) => setCounter(e.target.value)}
      ></Input>
    </SheetForm>
  );
};
