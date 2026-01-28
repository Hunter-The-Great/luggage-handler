import { useAuth } from "./checkAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { usePassengers } from "./usePassengers";

export const AirlinePage = () => {
  const { user } = useAuth();
  if (!user.airline) return <div>Invalid airline</div>;
  const { passengers } = usePassengers(user.airline);
  return (
    <Table>
      <TableHeader>
        <TableRow>
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
                passenger.remove ? "bg-red-800/50 dark:hover:bg-red-900/60" : ""
              }
              id={passenger.id.toString()}
            >
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
                  passenger.status || "–"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
