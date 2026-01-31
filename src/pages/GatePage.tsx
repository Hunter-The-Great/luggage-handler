import { Button } from "@/components/ui/button";
import { useFlights } from "@/queries/useFlights";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router";

export const GatePage = () => {
  const { flights } = useFlights();
  const navigate = useNavigate();

  return (
    <div className="flex flex-row justify-center pt-10">
      <div className="flex flex-col grid-cols-2 gap-4 w-1/2 center items-center">
        <h1 className="text-3xl font-bold">Flights</h1>
        <Separator />
        <div className="grid grid-cols-2 gap-4 w-full">
          {flights.map((flight) => {
            return (
              <Button
                onClick={() => navigate(`/flights/${flight.flight}`)}
                className={`w-full ${flight.departed ? "dark:bg-green-500/80 dark:border-green-400/80 dark:hover:bg-green-600/80 dark:hover:border-green-500/80" : ""}`}
                variant={"large"}
              >
                {flight.flight}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
