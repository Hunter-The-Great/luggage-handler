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
import { useMessages } from "@/queries/useMessages";
import { useAuth } from "@/queries/checkAuth";
import { Forbidden } from "./403";

export const Flight = () => {
  const { id } = useParams();
  const { addMessage } = useMessages();
  const { user, updateGate } = useAuth();
  const { flights, departFlight } = useFlights();
  const { passengers, updateStatus } = usePassengers(id!);
  const { bags } = useBags({ flight: id });

  const checkBags = (ticket: number): boolean => {
    console.log(bags);
    const absentBags = bags.filter(
      (bag) =>
        bag.ticket === ticket &&
        !(bag.location.type === "gate" || bag.location.type === "loaded"),
    );
    if (absentBags.length !== 0) return false;
    return true;
  };

  const checkAllBags = (): boolean => {
    const absentBags = bags.filter((bag) => bag.location.type !== "loaded");
    if (absentBags.length !== 0) return false;
    return true;
  };

  const checkReady = (): boolean => {
    const absentPassengers = passengers.filter(
      (passenger) => passenger.status !== "boarded",
    );
    if (absentPassengers.length !== 0 || !checkAllBags()) return false;
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
      updateStatus.mutateAsync({ id }).catch((err) => {
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

  const depart = () => {
    toast.promise(
      new Promise<void>((resolve, reject) => {
        departFlight.mutateAsync(id!).catch((err) => {
          reject(err);
        });
        addMessage
          .mutateAsync({
            airline: user.airline,
            to: "admin",
            body: `Flight ${id} departed`,
          })
          .catch((err) => {
            reject(err);
          });
        resolve();
      }),
      {
        position: "top-center",
        loading: "Departing flight...",
        success: "Flight departed successfully",
        error: "Failed to depart flight",
      },
    );
    updateGate("");
  };

  const DepartButton = () => {
    if (flight.departed) {
      return (
        <div className=" flex flex-1 justify-center text-lg font-bold text-green-500">
          Flight Departed
        </div>
      );
    } else {
      return (
        <div className="flex flex-1 justify-center">
          <Button variant={"primary"} onClick={depart} disabled={!checkReady()}>
            Ready for Departure
          </Button>
        </div>
      );
    }
  };

  if (user.gate !== flight.flight && user.gate !== "") {
    return <Forbidden />;
  }

  return (
    <div className="flex flex-col justify-center gap-4 items-center p-6">
      <h1 className="text-3xl font-bold">
        Gate {flight.gate}: Flight {id}
      </h1>
      <div className="flex flex-row w-full place-content-between">
        <div className="flex flex-1 gap-4 items-end">
          All Bags Loaded?
          {checkAllBags() ? (
            <div className="text-green-500">Yes</div>
          ) : (
            <div className="text-red-500">No</div>
          )}
        </div>
        <DepartButton />
        <div className="flex flex-1" />
      </div>
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
            const bags = checkBags(passenger.ticket);
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
                  {bags ? (
                    <p className="text-green-500">Yes</p>
                  ) : (
                    <p className="text-red-500">No</p>
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
                      passenger.status !== "checked-in" ||
                      passenger.remove ||
                      !bags ||
                      flight.departed
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
