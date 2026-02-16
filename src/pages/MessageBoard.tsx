import { useAuth } from "@/queries/checkAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMessages } from "@/queries/useMessages";

export const MessageBoard = () => {
  const { user } = useAuth();
  const { messages } = useMessages();

  const filteredMessages = messages.filter((message) => {
    if (user.role === "admin") return true;

    return (
      message.airline === user.airline &&
      (message.to === user.role || message.to === "all")
    );
  });

  return (
    <div className="flex flex-col justify-center items-center p-6">
      <div className="w-1/2 max-w-4xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Messages</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-neutral-500">
                  No messages to display
                </TableCell>
              </TableRow>
            ) : (
              filteredMessages.map((message) => {
                return (
                  <TableRow key={message.id} id={message.id.toString()}>
                    <TableCell>{message.body || "–"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
