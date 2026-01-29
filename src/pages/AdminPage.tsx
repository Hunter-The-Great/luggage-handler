import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRemovals } from "@/queries/useRemovals";

const Removals = () => {
  const { removals } = useRemovals();
  const { passengers, flights } = removals;
  return (
    <div className="flex flex-row w-full gap-4">
      <div
        className={`w-1/2 text-xl text-neutral-50 font-bold border rounded-lg p-2 ${passengers === 0 ? "bg-green-500/80 border-green-400/80" : "bg-amber-300/80 border-amber-200/80"}`}
      >
        {`${passengers} passenger${passengers === 1 ? "" : "s"} awaiting removal.`}
      </div>
      <div
        className={`w-1/2 text-xl text-neutral-50 font-bold border rounded-lg p-2 ${flights === 0 ? "bg-green-500/80 border-green-400/80" : "bg-amber-300/80 border-amber-200/80"}`}
      >
        {`${flights} flight${flights === 1 ? "" : "s"} awaiting removal.`}
      </div>
    </div>
  );
};

export function AdminPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-[50vh] justify-center">
      <div className="flex flex-row gap-4">
        <div className="flex flex-1 flex-col items-center gap-4 pt-2">
          <Button variant={"large"} onClick={() => navigate("/users")}>
            Manage Users
          </Button>
          <Button variant={"large"} onClick={() => navigate("/passengers")}>
            Manage Passengers
          </Button>
          <Button variant={"large"} onClick={() => navigate("/flights")}>
            Manage Flights
          </Button>
          <ReactQueryDevtools initialIsOpen={false} />
        </div>
        <div className="flex flex-1 flex-col items-center pr-10">
          <div className="text-xl text-neutral-50 font-bold">Notices</div>
          <Separator />
          <div className="flex h-2" />
          <Removals />
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
