import { db } from "./lib/db";
import { usersTable } from "./db/schema";
import { eq } from "drizzle-orm";

/* NOTE: will need to take a user object to work
 *
export const getPassword = async () => {
  const foundUser = (
    await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, user.username))
  )[0];

  if (!foundUser) return null;

  return foundUser.password;
};
*/

export const ChangePassword = async (
  user: any,
  oldPassword: string,
  newPassword: string,
  confirmation: string,
) => {
  if (newPassword !== confirmation) {
    throw new Error("Passwords do not match");
  }
  if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,}$/.test(newPassword)) {
    throw new Error(
      "New password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
    );
  }

  const foundUser = (
    await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, user.username))
  )[0];

  if (!foundUser) {
    throw new Error("User not found");
  }
  if (!(await Bun.password.verify(oldPassword, foundUser.password))) {
    throw new Error("Incorrect Password");
  }
  try {
    await db
      .update(usersTable)
      .set({
        password: await Bun.password.hash(newPassword),
        newAccount: false,
      })
      .where(eq(usersTable.id, foundUser.id));
    return;
  } catch (error) {
    throw new Error("Failed to change password");
  }
};
