import { client } from "./client";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { RoleType } from "./db/schema";

const getPassengers = async (airline: string | null) => {
  const loaded = await client.api.passengers.get({ query: { airline } });
  if (loaded.error) {
    throw new Error("Failed to load passengers");
  }
  return loaded.data;
};

export const usePassengers = (airline: string | null) => {
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
      role: RoleType | null;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      airline: string;
    }) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.admin.register.post({
          role: body.role,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          airline: body.airline,
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
    passengers
    removePassengers,
    addPassenger,
    isLoading: isFetching,
  };
};
