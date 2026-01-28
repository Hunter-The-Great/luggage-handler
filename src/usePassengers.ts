import { client } from "./client";
import { useMutation, useQuery } from "@tanstack/react-query";

const getPassengers = async (airline: string) => {
  const loaded = await client.api.passengers.get({
    query: { airline: airline || "" },
  });
  if (loaded.error) {
    console.log(loaded.error.value);
    throw new Error("Failed to load passengers");
  }
  return loaded.data;
};

export const usePassengers = (airline: string) => {
  const {
    data: passengers,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["passengers", airline],
    queryFn: () => getPassengers(airline),
    initialData: [],
  });

  const removePassengers = useMutation({
    mutationFn: async (ids: number[]) =>
      await client.api.passengers.delete({ ids }),

    onSuccess() {
      refetch();
    },
  });

  const addPassenger = useMutation({
    mutationFn: async (body: {
      firstName: string;
      lastName: string;
      identification: string;
      ticket: string;
      flight: string;
    }) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.passengers.put({
          firstName: body.firstName,
          lastName: body.lastName,
          identification: body.identification,
          ticket: body.ticket,
          flight: body.flight,
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
    passengers,
    removePassengers,
    addPassenger,
    isLoading: isFetching,
  };
};
