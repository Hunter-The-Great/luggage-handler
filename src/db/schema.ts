import {
  integer,
  pgTable,
  varchar,
  pgEnum,
  boolean,
  jsonb,
  foreignKey,
  bigint,
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
  fullAirline: varchar({ length: 255 }),
});

export const bagTable = pgTable("bags", {
  id: integer().primaryKey(),
  ticket: bigint({ mode: "number" })
    .notNull()
    .references(() => passengerTable.ticket),
  location: jsonb().$type<BagLocation>().notNull(),
});

export const flightTable = pgTable(
  "flights",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    flight: varchar({ length: 6 }).notNull().unique(),
    gate: varchar({ length: 255 }).notNull().unique(),
    destination: varchar({ length: 255 }),
    airline: varchar({ length: 255 }),
    departed: boolean().notNull().default(false),
  },
  (table) => [
    foreignKey({
      columns: [table.flight],
      foreignColumns: [table.flight],
      name: "flight_fk",
    }),
  ],
);

export const passengerTable = pgTable(
  "passengers",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    firstName: varchar({ length: 255 }).notNull(),
    lastName: varchar({ length: 255 }).notNull(),
    identification: integer().notNull(),
    ticket: bigint({
      mode: "number",
    })
      .notNull()
      .unique(),
    flight: varchar({ length: 6 })
      .notNull()
      .references(() => flightTable.flight),
    status: statuses().notNull().default("not-checked-in"),
    remove: boolean().notNull().default(false),
    // TODO: Does this need a reason or no?
  },
  (table) => [
    foreignKey({
      columns: [table.ticket],
      foreignColumns: [table.ticket],
      name: "ticket_fk",
    }),
  ],
);

export const messageTable = pgTable("messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  to: varchar({ length: 255 }).notNull(),
  body: varchar({ length: 255 }).notNull(),
});

export type RoleType = (typeof roles.enumValues)[number];

export type BagLocation =
  | { type: "check-in"; terminal: string; counter: number }
  | { type: "security" }
  | { type: "gate"; gate: string }
  | { type: "loaded"; flight: string };
export type Status = (typeof statuses.enumValues)[number];

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
