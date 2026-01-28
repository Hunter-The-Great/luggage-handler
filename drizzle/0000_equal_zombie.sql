CREATE TYPE "public"."roles" AS ENUM('admin', 'airline', 'gate', 'ground');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('not-checked-in', 'checked-in', 'boarded');--> statement-breakpoint
CREATE TABLE "bags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ticket" integer NOT NULL,
	"location" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "flights_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"flight" varchar(6) NOT NULL,
	"tickets" integer[] DEFAULT '{}' NOT NULL,
	"departed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "flights_flight_unique" UNIQUE("flight")
);
--> statement-breakpoint
CREATE TABLE "passengers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "passengers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"firstName" varchar(255) NOT NULL,
	"lastName" varchar(255) NOT NULL,
	"identification" integer NOT NULL,
	"ticket" integer NOT NULL,
	"flight" varchar(6) NOT NULL,
	"status" "status" DEFAULT 'not-checked-in' NOT NULL,
	"remove" boolean DEFAULT false NOT NULL,
	CONSTRAINT "passengers_ticket_unique" UNIQUE("ticket")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"new_account" boolean DEFAULT true NOT NULL,
	"role" "roles" NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(255),
	"airline" varchar(255),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
