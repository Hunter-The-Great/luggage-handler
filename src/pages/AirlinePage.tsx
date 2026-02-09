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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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

export const AirlinePage = () => {
  const { user } = useAuth();
  if (!user.airline) return <div>Invalid airline</div>;
  const { passengers, updateStatus } = usePassengers(null);
  const { removeBags } = useBags({});

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
    <div className="flex flex-col justify-center items-center p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Identification</TableCell>
            <TableCell>Ticket</TableCell>
            <TableCell>Flight Number</TableCell>
            <TableCell>Number of Bags</TableCell>
            <TableCell>Status</TableCell>
            <TableCell className="text-right">Actions</TableCell>
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
                <TableCell>{passenger.flight || "–"}</TableCell>
                <TableCell>
                  {
                    <HoverCard>
                      <HoverCardTrigger>
                        <p className="underline">
                          {passenger.bags[0] ? passenger.bags.length : 0}
                        </p>
                      </HoverCardTrigger>
                      {passenger.bags[0] ? (
                        <HoverCardContent
                          side="bottom"
                          align="start"
                          className="w-min"
                        >
                          {passenger.bags.map((bag) => (
                            <>
                              <p>{bag?.id}</p>
                              <Separator />
                            </>
                          ))}
                        </HoverCardContent>
                      ) : (
                        <></>
                      )}
                    </HoverCard>
                  }
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
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => checkIn(passenger.id)}
                        disabled={
                          passenger.status !== "not-checked-in" ||
                          passenger.remove
                        }
                        className="text-sm text-left px-2 py-1 rounded-sm text-neutral-400/80 dark:dark:hover:text-neutral-400/80 dark:hover:bg-neutral-700/60 w-full"
                      >
                        Check In
                      </DropdownMenuItem>
                      <AddBagForm ticket={passenger.ticket} />
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRemoveBags(passenger.ticket)}
                        variant="destructive"
                      >
                        Remove all Bags
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => flag(passenger.id)}
                        variant="destructive"
                        disabled={passenger.remove}
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

const AddBagForm = (props: { ticket: number }) => {
  const { addBag } = useBags({});
  const [terminal, setTerminal] = useState("");
  const [counter, setCounter] = useState("");

  const handleSubmit = async (ticket: number) => {
    return new Promise<void>(async (resolve) => {
      toast.promise(
        new Promise((resolve) => {
          addBag
            .mutateAsync({
              terminal,
              counter,
              ticket,
            })
            .then((id) => {
              setTerminal("");
              setCounter("");
              console.log(id);
              resolve(id);
            })
            .catch((err) => {
              throw new Error(err);
            });
        }),
        {
          position: "top-center",
          loading: "Adding bag...",
          success: (id) => `Bag added successfully, id: ${id}`,
          error: (err) => err.message || "Failed to add bag",
        },
      );
      resolve();
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
