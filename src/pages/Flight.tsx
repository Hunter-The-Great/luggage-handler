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
import type { Status } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useBags } from "@/queries/useBags";

export const Flight = () => {
  const { id } = useParams();
  const { flights } = useFlights();
  const { passengers, updateStatus } = usePassengers(id!);
  const { bags } = useBags();

  const checkBags = (ticket: number): boolean => {
    const absentBags = bags.filter(
      (bag) => bag.ticket === ticket && bag.location.type !== "gate",
    );
    if (absentBags.length !== 0) return false;
    return true;
  };

  const flight = flights.find((f) => f.flight === id!.toUpperCase());
  if (!flight) {
    return <NotFound />;
  }

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

  const board = (id: number) => {
    toast.promise(
      updateStatus.mutateAsync({ id, status: "boarded" }).catch((err) => {
        throw new Error(err);
      }),
      {
        position: "top-center",
        loading: "Boarding passenger...",
        success: "Passenger boarded successfully",
        error: "Failed to board passenger",
      },
    );
  };

  return (
    <div className="flex flex-col justify-center items-center p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Identification</TableCell>
            <TableCell>Ticket</TableCell>
            <TableCell>All Bags at Gate?</TableCell>
            <TableCell>Status</TableCell>
            <TableCell className="text-center">Actions</TableCell>
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
                <TableCell>{passenger.firstName || "–"}</TableCell>
                <TableCell>{passenger.lastName || "–"}</TableCell>
                <TableCell>{passenger.identification || "–"}</TableCell>
                <TableCell>{passenger.ticket || "–"}</TableCell>
                <TableCell>
                  {checkBags(passenger.ticket) ? (
                    <p className="text-green-500">yes</p>
                  ) : (
                    <p className="text-red-500">no</p>
                  )}
                </TableCell>
                <TableCell>
                  {passenger.remove ? (
                    <p className="text-red-500 text-shadow-xs text-shadow-black/50 ">
                      Flagged for removal
                    </p>
                  ) : (
                    parseStatus(passenger.status)
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant={"primary"}
                    className="w-full"
                    onClick={() => board(passenger.id)}
                    disabled={
                      passenger.status !== "checked-in" || passenger.remove // TODO: add check for all bags
                    }
                  >
                    Board
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
