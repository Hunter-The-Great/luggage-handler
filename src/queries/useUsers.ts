import { client } from "@/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { RoleType } from "@/db/schema";

const getUsers = async () => {
  const loaded = await client.api.admin.users.get();
  if (loaded.error) {
    throw new Error("Failed to load users");
  }
  return loaded.data;
};

export const useUsers = () => {
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
    mutationFn: async (ids: number[]) => {
      return new Promise<void>(async (resolve, reject) => {
        const res = await client.api.admin.users.delete({ ids });
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

  const AddUser = useMutation({
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
    users,
    RemoveUsers,
    AddUser,
    isLoading: isFetching,
  };
};
