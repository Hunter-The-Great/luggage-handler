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
  newAccount: boolean("new_account").default(true).notNull(),
  role: roles().notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  airline: varchar({ length: 255 }),
});

export type RoleType = (typeof roles.enumValues)[number];
