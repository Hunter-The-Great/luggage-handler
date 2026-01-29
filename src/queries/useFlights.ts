import { client } from "@/client";
import { useMutation, useQuery } from "@tanstack/react-query";

const getFlights = async () => {
  const loaded = await client.api.flights.get();
  if (loaded.error) {
    throw new Error("Failed to load flights");
  }
  return loaded.data;
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
    mutationFn: async (body: { flight: string; gate: string }) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.admin.flights.post({
          flight: body.flight,
          gate: body.gate,
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

  return {
    flights,
    removeFlights,
    addFlight,
    isLoading: isFetching,
  };
};
