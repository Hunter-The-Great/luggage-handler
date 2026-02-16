import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useBags } from "@/queries/useBags";
import { MoreHorizontalIcon } from "lucide-react";
import type { BagLocation } from "@/db/schema";
import { usePassengers } from "@/queries/usePassengers";

export const BagsPage = () => {
  const { bags, updateLocation } = useBags({});
  const { passengers, updateStatus } = usePassengers(null);
  // const [selected, setSelected] = useState<Set<number>>(new Set());

  const getPassenger = (ticket: number) => {
    return passengers.find((p) => p.ticket === ticket);
  };

  // const selectAll = selected.size === flights.length && flights.length !== 0;

  /*
  const HandleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(flights.map((flight) => flight.id)));
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
  */

  const parseLocation = (location: BagLocation) => {
    switch (location.type) {
      case "check-in":
        return (
          <p className="text-amber-300">{`Check in, terminal ${location.terminal}, counter ${location.counter}`}</p>
        );
      case "security":
        return <p className="text-amber-300">Security</p>;
      case "gate":
        return <p className="text-blue-600">{`Gate ${location.gate}`}</p>;
      case "loaded":
        return <p className="text-green-500">{`Loaded: ${location.flight}`}</p>;
      default:
        return "–";
    }
  };

  const HandleClear = async (id: number, flight?: string) => {
    if (!flight) {
      toast.error("Error fetching flight");
      return;
    }
    toast.promise(
      updateLocation
        .mutateAsync({ id, flight, location: "gate" })
        .catch((err) => {
          throw new Error(err);
        }),
      {
        position: "top-center",
        loading: "Moving bag...",
        success: "Bag moved successfully",
        error: "Failed to move bag",
      },
    );
  };

  const HandleMove = async (id: number) => {
    toast.promise(
      updateLocation
        .mutateAsync({ id, flight: "", location: "security" })
        .catch((err) => {
          throw new Error(err);
        }),
      {
        position: "top-center",
        loading: "Moving bag...",
        success: "Bag moved successfully",
        error: "Failed to move bag",
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

  /* TODO: add a button to move selected bags
    *
      <div className="flex flex-row w-full justify-between gap-4 pb-4">
        <Button
          variant={"destructive"}
          disabled={selected.size === 0}
          onClick={HandleMove}
        >
          Delete
        </Button>
        <AddPassengerForm />
      </div>
  */

  return (
    <div className="flex flex-row w-full items-start">
      <div className="flex flex-col justify-center gap-4 items-center p-6 w-full">
        <div className="text-2xl font-bold">Ready to go to Security</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ticket</TableCell>
              <TableCell>Flight</TableCell>
              <TableCell>Location</TableCell>
              <TableCell className="text-center">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bags
              .filter((bag) => bag.location.type === "check-in")
              .map((bag) => {
                const passenger = getPassenger(bag.ticket);
                return (
                  <TableRow
                    id={bag.id.toString()}
                    className={
                      passenger?.remove
                        ? "bg-red-800/50 dark:hover:bg-red-900/60"
                        : ""
                    }
                  >
                    <TableCell>{bag.id || "–"}</TableCell>
                    <TableCell>{bag.ticket || "–"}</TableCell>
                    <TableCell>{bag.flight || "–"}</TableCell>
                    <TableCell>{parseLocation(bag.location)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontalIcon />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => HandleMove(bag.id)}
                            disabled={
                              bag.location.type !== "check-in" ||
                              passenger?.remove
                            }
                            className="text-sm text-left px-2 py-1 rounded-sm text-neutral-400/80 dark:dark:hover:text-neutral-400/80 dark:hover:bg-neutral-700/60 w-full"
                          >
                            Move Bag
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (passenger) flag(passenger.id);
                              else toast.warning("Error fetching passenger");
                            }}
                            variant="destructive"
                            disabled={passenger?.remove}
                          >
                            Flag for Removal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col justify-center gap-4 items-center p-6 w-full">
        <div className="text-2xl font-bold">Awaiting Security Check</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ticket</TableCell>
              <TableCell>Flight</TableCell>
              <TableCell>Location</TableCell>
              <TableCell className="text-center">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bags
              .filter((bag) => bag.location.type === "security")
              .map((bag) => {
                const passenger = getPassenger(bag.ticket);
                return (
                  <TableRow
                    id={bag.id.toString()}
                    className={
                      passenger?.remove
                        ? "bg-red-800/50 dark:hover:bg-red-900/60"
                        : ""
                    }
                  >
                    <TableCell>{bag.id || "–"}</TableCell>
                    <TableCell>{bag.ticket || "–"}</TableCell>
                    <TableCell>{bag.flight || "–"}</TableCell>
                    <TableCell>{parseLocation(bag.location)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontalIcon />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              HandleClear(bag.id, passenger?.flight)
                            }
                            disabled={
                              bag.location.type !== "security" ||
                              passenger?.remove
                            }
                            className="text-sm text-left px-2 py-1 rounded-sm text-neutral-400/80 dark:dark:hover:text-neutral-400/80 dark:hover:bg-neutral-700/60 w-full"
                          >
                            Clear Bag
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (passenger) flag(passenger.id);
                              else toast.warning("Error fetching passenger");
                            }}
                            variant="destructive"
                            disabled={passenger?.remove}
                          >
                            Flag for Removal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
