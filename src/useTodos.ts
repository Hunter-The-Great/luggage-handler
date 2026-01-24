import type { Todo } from ".";
import { client } from "./client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";

const getTodos = async () => {
  const loaded = await client.api.todos.get();
  if (loaded.error) {
    throw new Error("Oops");
  }
  return loaded.data;
};

export const useTodos = () => {
  const queryClient = useQueryClient();

  const {
    data: todos,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["todos"],
    queryFn: getTodos,
    initialData: [],
  });

  const addTodo = useMutation({
    mutationFn: (text: string) =>
      client.api.todos.post({
        text: text,
      }),

    onSuccess() {
      refetch();
    },

    onMutate(text) {
      queryClient.setQueryData(["todos"], (oldData: Todo[] | undefined) => {
        if (!oldData) return oldData;
        return [...oldData, { id: nanoid(), text, completed: false }];
      });
    },
  });

  return {
    addTodo,
    todos,
    isLoading: isFetching,
  };
};
