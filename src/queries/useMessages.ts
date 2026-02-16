import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/client";

export const useMessages = () => {
  const queryClient = useQueryClient();

  const { data: messages = [], isFetching } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await client.api.messages.get();
      if (response.error) {
        throw new Error("Failed to load messages");
      }
      return response.data;
    },
    initialData: [],
  });

  const addMessage = useMutation({
    mutationFn: async (data: { airline: string; to: string; body: string }) => {
      const response = await client.api.messages.post(data);
      if (response.error) {
        throw new Error(response.error.value as string);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const removeMessages = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await client.api.messages.delete({ ids });
      if (response.error) {
        throw new Error("Failed to remove messages");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  return {
    messages,
    isFetching,
    addMessage,
    removeMessages,
  };
};
