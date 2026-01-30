import { client } from "@/client";
import { useMutation, useQuery } from "@tanstack/react-query";

const getPassengers = async (flight: string | null) => {
  const loaded = await client.api.passengers.get({
    query: { flight: flight || "" },
  });
  if (loaded.error) {
    console.log(loaded.error.value);
    throw new Error("Failed to load passengers");
  }
  return loaded.data;
};

export const usePassengers = (flight: string | null) => {
  const {
    data: passengers,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["passengers"],
    queryFn: () => getPassengers(flight),
    initialData: [],
  });

  const removePassengers = useMutation({
    mutationFn: async (ids: number[]) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.passengers.delete({ ids });
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

  const addPassenger = useMutation({
    mutationFn: async (body: {
      firstName: string;
      lastName: string;
      identification: string;
      flight: string;
    }) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.passengers.post({
          firstName: body.firstName,
          lastName: body.lastName,
          identification: body.identification,
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

  const updateStatus = useMutation({
    mutationFn: async ({ id, flag }: { id: number; flag?: boolean }) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.passengers.put({
          id,
          flag: flag || false,
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
    updateStatus,
    isLoading: isFetching,
  };
};
