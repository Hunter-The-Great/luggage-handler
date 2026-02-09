import { client } from "@/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const getBags = async (flight?: string, ticket?: string) => {
  const loaded = await client.api.bags.get({
    query: {
      ticket: ticket || "",
      flight: flight || "",
    },
  });
  if (loaded.error) {
    console.log(loaded.error.value);
    throw new Error("Failed to load bags");
  }
  return loaded.data;
};

export const useBags = ({
  flight,
  ticket,
}: {
  flight?: string;
  ticket?: string;
}) => {
  const queryClient = useQueryClient();

  const {
    data: bags,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["bags"],
    queryFn: () => getBags(flight || "", ticket || ""),
    initialData: [],
  });

  const removeBags = useMutation({
    mutationFn: async (ticket: number) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.bags.delete({ ticket });
        if (res.error) {
          reject(res.error.value);
        } else {
          resolve();
        }
      });
    },

    onSuccess() {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["passengers"] });
    },
  });

  const addBag = useMutation({
    mutationFn: async (body: {
      terminal: string;
      counter: string;
      ticket: number;
    }) => {
      return new Promise<number>(async (resolve, reject) => {
        const counter = parseInt(body.counter);
        if (isNaN(counter)) {
          reject("Counter must be a number");
        }
        const res = await client.api.bags.post({
          ticket: body.ticket,
          terminal: body.terminal,
          counter: counter,
        });
        if (res.error) {
          reject(res.error.value);
        } else {
          resolve(res.data.id);
        }
      });
    },

    onSuccess() {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["passengers"] });
    },
  });

  const updateLocation = useMutation({
    mutationFn: async ({
      id,
      flight,
      location,
    }: {
      id: number;
      flight: string;
      location: string;
    }) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.bags.put({
          id,
          flight,
          location: location,
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
    bags,
    removeBags,
    addBag,
    updateLocation,
    isLoading: isFetching,
  };
};
