import { useFlights } from "@/queries/useFlights";
import { useParams } from "react-router";
import { NotFound } from "./404";

export const Flight = () => {
  const { id } = useParams();
  const { flights } = useFlights();

  const flight = flights.find((f) => f.flight === id?.toUpperCase());
  if (!flight) {
    return <NotFound />;
  }

  return <div>{flight.id}</div>;
};
