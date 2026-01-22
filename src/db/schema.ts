import {
  integer,
  pgTable,
  varchar,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const roles = pgEnum("roles", ["admin", "airline", "gate", "ground"]);

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  newAccount: boolean("new_account").default(true),
  role: roles().notNull(),
});
