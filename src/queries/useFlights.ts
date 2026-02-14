import { client } from "@/client";
import { useMutation, useQuery } from "@tanstack/react-query";

const getFlights = async () => {
  const loaded = await client.api.flights.get();
  if (loaded.error) {
    throw new Error("Failed to load flights");
  }
  return loaded.data.sort((a, b) => a.flight.localeCompare(b.flight));
};

export const useFlights = () => {
  const {
    data: flights,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["flights"],
    queryFn: getFlights,
    initialData: [],
  });

  const removeFlights = useMutation({
    mutationFn: async (ids: number[]) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.admin.flights.delete({ ids });
        if (res.error) {
          reject(res.error.value);
        } else {
          resolve();
        }
      });
    },

    onSuccess() {
      refetch();
    },
  });

  const addFlight = useMutation({
    mutationFn: async (body: {
      flight: string;
      gate: string;
      airline: string;
      destination: string;
    }) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.admin.flights.post({
          flight: body.flight,
          gate: body.gate,
          airline: body.airline,
          destination: body.destination,
        });
        if (res.error) {
          reject(res.error.value);
        } else {
          resolve();
        }
      });
    },

    onSuccess() {
      refetch();
    },
  });

  const departFlight = useMutation({
    mutationFn: async (flight: string) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.flights({ flight }).put();
        if (res.error) {
          reject(res.error.value);
        } else {
          resolve();
        }
      });
    },

    onSuccess() {
      refetch();
    },
  });

  return {
    flights,
    removeFlights,
    addFlight,
    departFlight,
    isLoading: isFetching,
  };
};
