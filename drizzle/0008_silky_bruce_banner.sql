CREATE TABLE "messages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"to" varchar(255) NOT NULL,
	"body" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_gate_unique" UNIQUE("gate");