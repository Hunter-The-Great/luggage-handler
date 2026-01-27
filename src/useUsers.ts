import { client } from "./client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const getUsers = async () => {
  const loaded = await client.api.admin.users.get();
  if (loaded.error) {
    throw new Error("Failed to load users");
  }
  return loaded.data;
};

export const useUsers = () => {
  const queryClient = useQueryClient();

  const {
    data: users,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    initialData: [],
  });

  const RemoveUsers = useMutation({
    mutationFn: async (ids: number[]) =>
      await client.api.admin.users.delete({ ids }),

    onSuccess() {
      refetch();
    },
  });

  return {
    users,
    RemoveUsers,
    isLoading: isFetching,
  };
};
