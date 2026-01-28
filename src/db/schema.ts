import {
  integer,
  pgTable,
  varchar,
  pgEnum,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { SQL, sql } from "drizzle-orm";

export const roles = pgEnum("roles", ["admin", "airline", "gate", "ground"]);

export const statuses = pgEnum("status", [
  "not-checked-in",
  "checked-in",
  "boarded",
]);

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

export const bagTable = pgTable("bags", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  ticket: integer().notNull(),
  location: jsonb().$type<BagLocation>().notNull(),
});

export const flightTable = pgTable("flights", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  flight: varchar({ length: 6 }).notNull().unique(),
  tickets: integer().array().notNull().default([]),
  departed: boolean().notNull().default(false),
});

export const passengerTable = pgTable("passengers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  identification: integer().notNull(),
  ticket: integer().notNull().unique(),
  flight: varchar({ length: 6 }).notNull(),
  status: statuses().notNull().default("not-checked-in"),
  remove: boolean().notNull().default(false),
  // TODO: Does this need a reason or no?
});

export type RoleType = (typeof roles.enumValues)[number];

export type BagLocation =
  | { type: "check-in"; terminal: string; counter: number }
  | { type: "security" }
  | { type: "gate"; terminal: string; gate: number }
  | { type: "loaded"; flight: string };
export type Status = (typeof statuses.enumValues)[number];

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
