import { useFlights } from "@/queries/useFlights";
import { useParams } from "react-router";
import { NotFound } from "./404";
import { usePassengers } from "@/queries/usePassengers";
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
import type { BagLocation } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useBags } from "@/queries/useBags";
import { MoreHorizontalIcon } from "lucide-react";

export const GroundFlight = () => {
  const { id } = useParams();
  const { passengers, updateStatus } = usePassengers(id!);
  const { bags, updateLocation } = useBags({ flight: id });

  const checkPassenger = (passenger: any) => {
    if (!passenger || !passenger.status) return;
    return passenger.status === "boarded" ? (
      <p className="text-green-500">Yes</p>
    ) : (
      <p className="text-red-500">No</p>
    );
  };

  const getPassenger = (ticket: number) => {
    return passengers.find((p) => p.ticket === ticket);
  };

  const parseLocation = (location: BagLocation) => {
    switch (location.type) {
      case "check-in":
        return (
          <p className="text-amber-300">{`Check in, terminal ${location.terminal}, counter ${location.counter}`}</p>
        );
      case "security":
        return <p className="text-amber-300">Security</p>;
      case "gate":
        return (
          <p className="text-blue-600">{`Terminal ${location.terminal}: Gate ${location.gate}`}</p>
        );
      case "loaded":
        return <p className="text-green-500">{`Loaded: ${location.flight}`}</p>;
      default:
        return "–";
    }
  };

  const loadBag = (id: number, ticket: number) => {
    const flight = passengers.find((p) => p.ticket === ticket)?.flight;
    if (!flight) return;
    toast.promise(
      updateLocation.mutateAsync({ id, flight }).catch((err) => {
        console.log(err);
        throw new Error(err);
      }),
      {
        position: "top-center",
        loading: "Loading bag...",
        success: "Bag loaded successfully",
        error: "Failed to load bag",
      },
    );
  };

  const flag = async (id: number) => {
    toast.promise(
      updateStatus.mutateAsync({ id, flag: true }).catch((err) => {
        console.log(err);
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

  return (
    <div className="flex flex-col justify-center gap-4 items-center p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Ticket</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Passenger Boarded?</TableCell>
            <TableCell className="text-center">Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bags.map((bag) => {
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
                <TableCell>{parseLocation(bag.location)}</TableCell>
                <TableCell>{checkPassenger(passenger)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => loadBag(bag.id, bag.ticket)}
                        disabled={
                          bag.location.type !== "gate" || passenger?.remove
                        }
                        className="text-sm text-left px-2 py-1 rounded-sm text-neutral-400/80 dark:dark:hover:text-neutral-400/80 dark:hover:bg-neutral-700/60 w-full"
                      >
                        Load Bag
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
  );
};
