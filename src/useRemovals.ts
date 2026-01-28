import { client } from "./client";
import { useMutation, useQuery } from "@tanstack/react-query";

const getRemovals = async () => {
  const loaded = await client.api.admin.removals.get();
  if (loaded.error) {
    throw new Error("Failed to load removals");
  }
  return loaded.data;
};

export const useRemovals = () => {
  const { data: removals, isFetching } = useQuery({
    queryKey: ["removals"],
    queryFn: getRemovals,
    initialData: { passengers: 0, flights: 0 },
  });

  return {
    removals,
    isLoading: isFetching,
  };
};
