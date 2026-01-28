import { useState } from "react";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { toast } from "sonner";
import { SheetForm } from "./components/sheetForm";
import { useFlights } from "./useFlights";
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

export const FlightPage = () => {
  const { flights, removeFlights } = useFlights();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const selectAll = selected.size === flights.length && flights.length !== 0;

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

  const HandleDelete = async () => {
    if (selected.size === 0) {
      toast.warning("Please select at least one flight to delete", {
        position: "top-center",
      });
      return;
    }
    toast.warning("Are you sure you want to delete these flights?", {
      position: "top-center",
      duration: Infinity,
      action: {
        label: "Delete",
        onClick: async () => {
          toast.promise(
            removeFlights.mutateAsync(Array.from(selected)).then(() => {
              setSelected(new Set());
            }),
            {
              position: "top-center",
              loading: "Removing flights...",
              success: "Flights removed successfully",
              error: "Failed to remove flights",
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
        <AddFlightForm />
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
            <TableCell>Flight Number</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flights.map((flight) => {
            return (
              <TableRow id={flight.id.toString()}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(flight.id)}
                    onCheckedChange={(checked: boolean) =>
                      HandleSelectRow(flight.id, checked)
                    }
                  />
                </TableCell>
                <TableCell>{flight.flight || "–"}</TableCell>
                <TableCell>
                  {flight.departed ? (
                    <p className="text-green-400">Departed</p>
                  ) : (
                    <p className="text-yellow-300">Not yet departed</p>
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

const AddFlightForm = () => {
  const [flight, setFlight] = useState("");
  const { addFlight } = useFlights();

  const handleSubmit = async () => {
    return new Promise<void>(async (resolve) => {
      toast.promise(
        addFlight
          .mutateAsync({
            flight,
          })
          .then(() => {
            setFlight("");
            resolve();
          })
          .catch((err) => {
            throw new Error(err);
          }),
        {
          position: "top-center",
          loading: "Adding flight...",
          success: "Flight added successfully",
          error: (err) => err.message || "Failed to add flight",
        },
      );
    });
  };

  return (
    <SheetForm
      title="Add a Flight"
      label="Add Flight"
      handleSubmit={handleSubmit}
    >
      <Label>Airline</Label>
      <Input
        type="text"
        className="border rounded-lg"
        value={flight}
        onChange={(e) => setFlight(e.target.value)}
      ></Input>
    </SheetForm>
  );
};
