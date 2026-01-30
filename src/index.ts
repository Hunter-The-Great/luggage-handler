import { Elysia, t } from "elysia";
import index from "./index.html";
import chalk from "chalk";
import { jwt } from "@elysiajs/jwt";
import { db } from "./lib/db";
import {
  bagTable,
  flightTable,
  lower,
  passengerTable,
  usersTable,
} from "./db/schema";
import type { BagLocation, Status } from "./db/schema";
import { and, count, eq, ilike, inArray, sql } from "drizzle-orm";
import { env } from "./lib/env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { generatePassword } from "./lib/password";
import { ChangePassword } from "./changePassword";
import { transport } from "./lib/email";

const authRouter = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      schema: t.Object({
        id: t.Number(),
        username: t.String(),
        role: t.UnionEnum(["admin", "airline", "gate", "ground"]),
        airline: t.String(),
        newAccount: t.Boolean(),
      }),
    }),
  )
  .post(
    "/login",
    async ({ body, status, jwt, cookie: { auth } }) => {
      const { username, password } = body;
      const user = (
        await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.username, username))
      )[0];

      if (user && (await Bun.password.verify(password, user.password))) {
        const token = await jwt.sign({
          id: user.id,
          username: user.username,
          role: user.role,
          airline: user.airline || "",
          newAccount: user.newAccount,
        });

        auth?.set({
          value: token,
          httpOnly: true,
          maxAge: 604800,
          path: "/",
        });

        return {
          success: true,
          user: {
            username: user.username,
            id: user.id,
            role: user.role,
            airline: user.airline || "",
            newAccount: user.newAccount,
          },
        };
      } else return status(401, "Unauthorized");
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  )
  .post("/logout", async ({ cookie: { auth } }) => {
    auth?.remove();
    return { success: true };
  })
  .derive(async ({ jwt, cookie }) => {
    const token = cookie.auth;
    if (!token) return { user: null };

    if (typeof token.value !== "string") return { user: null };
    const payload = await jwt.verify(token.value);
    if (!payload) return { user: null };

    return { user: payload };
  })
  .post(
    "/change-password",
    async ({ user, body, status, jwt, cookie: { auth } }) => {
      if (!auth) return status(401);

      if (typeof auth.value !== "string") return status(401);
      const payload = await jwt.verify(auth.value);
      if (!payload) return status(401);

      const { oldPassword, newPassword, confirmation } = body;

      try {
        await ChangePassword(user, oldPassword, newPassword, confirmation);
        return { success: true };
      } catch (error: any) {
        return status(400, error.message);
      }
    },
    {
      body: t.Object({
        oldPassword: t.String(),
        newPassword: t.String(),
        confirmation: t.String(),
      }),
    },
  )
  .get("/profile", async ({ user }) => {
    return user;
  });

const adminRouter = new Elysia({ prefix: "/admin" })
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      schema: t.Object({
        id: t.Number(),
        username: t.String(),
        role: t.UnionEnum(["admin", "airline", "gate", "ground"]),
        airline: t.String(),
        newAccount: t.Boolean(),
      }),
    }),
  )
  .derive(async ({ jwt, cookie }) => {
    const token = cookie.auth;
    if (!token) return { user: null };

    if (typeof token.value !== "string") return { user: null };
    const payload = await jwt.verify(token.value);
    if (!payload) return { user: null };

    return { user: payload };
  })
  .onBeforeHandle(({ user, status }) => {
    if (!user) return status(401);
    if (user.role !== "admin") return status(403);
  })
  .post(
    "/register",
    async ({ status, body }) => {
      const emailRegex = /^\w+@\w+\.\w+$/;
      const phonesRegex = /^[1-9]\d{9}$/;
      switch (body.role) {
        case "gate":
        case "airline":
          if (!body.airline) return status(400, "Airline is required");
        // TODO: enforce airline to be 2 characters?
        case "ground":
          if (!body.firstName) return status(400, "First name is required");
          if (body.firstName.length < 2)
            return status(400, "First name must be at least 2 characters");
          if (!body.lastName) return status(400, "Last name is required");
          if (body.lastName.length < 2)
            return status(400, "Last name must be at least 2 characters");
          if (!body.email) return status(400, "Email is required");
          if (!emailRegex.test(body.email)) return status(400, "Invalid email");
          if (!body.phone) return status(400, "Phone is required");
          if (!phonesRegex.test(body.phone))
            return status(400, "Invalid phone number");
          break;
        default:
          return status(400, "Invalid role");
      }
      try {
        let username = body.lastName.toLowerCase();
        const lastNames = await db
          .select()
          .from(usersTable)
          .where(eq(lower(usersTable.lastName), body.lastName.toLowerCase()));

        if (lastNames.length > 0) {
          lastNames.sort((a, b) => a.id - b.id);
          const prevName = lastNames[lastNames.length - 1];
          if (!prevName || !prevName.lastName)
            return status(400, "Failed to generate username");
          const id =
            parseInt(prevName.username.substring(prevName.lastName.length)) + 1;
          if (id < 0 || id > 99) {
            return status(400, "Failed to generate username");
          }
          if (id < 10) {
            username += "0" + id;
          } else {
            username += id;
          }
        } else {
          username += "00";
        }
        const password = generatePassword();
        await db.insert(usersTable).values({
          username: username,
          password: await Bun.password.hash(password, {
            algorithm: "argon2id",
          }),
          role: body.role,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          airline: body.airline?.toUpperCase(),
        });
        console.log(
          chalk.green("> "),
          chalk.yellow("Email service temporarily disabled"),
        );
        console.log(chalk.green("> "), password);
        return;
        await transport.sendMail({
          from: env.CLIENT_EMAIL,
          to: body.email,
          subject: "Luggage Handler Account Created",
          html: `<!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          h2 {
            color: #1a1a1a;
            font-weight: 500;
            margin-bottom: 24px;
          }
          .credentials {
            background-color: #f8f9fa;
            border-left: 3px solid #666;
            padding: 16px 20px;
            margin: 24px 0;
          }
          .credential-row {
            margin: 8px 0;
          }
          .label {
            color: #666;
            font-size: 14px;
          }
          .value {
            font-family: 'Courier New', monospace;
            color: #1a1a1a;
            font-size: 15px;
          }
          .note {
            color: #666;
            font-size: 14px;
            font-style: italic;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <h2>Hello ${body.firstName} ${body.lastName},</h2>

        <p>Your account has been created. Below are your login credentials:</p>

        <div class="credentials">
          <div class="credential-row">
            <div class="label">Email</div>
            <div class="value">${username}</div>
          </div>
          <div class="credential-row">
            <div class="label">Temporary Password</div>
            <div class="value">${password}</div>
          </div>
        </div>

        <p>Please note you will be required to change your password upon logging in for the first time.</p>
      </body>
      </html>`,
        });

        return { success: true };
      } catch (error) {
        console.log(error);
        return status(400, "Failed to register");
      }
    },
    {
      body: t.Object({
        role: t.Nullable(t.UnionEnum(["admin", "airline", "gate", "ground"])),
        firstName: t.Nullable(t.String()),
        lastName: t.Nullable(t.String()),
        email: t.Nullable(t.String()),
        phone: t.Nullable(t.String()),
        airline: t.Nullable(t.String()),
      }),
    },
  )
  .delete(
    "/users",
    async ({ body, status }) => {
      await db.delete(usersTable).where(inArray(usersTable.id, body.ids));
      return status(204);
    },
    {
      body: t.Object({
        ids: t.Array(t.Number()),
      }),
    },
  )
  .get(
    "/users",
    async ({ status, body }) => {
      if (body && body.role) {
        const users = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.role, body.role))
          .orderBy(usersTable.role)
          .catch(() => {
            throw status(500, "Failed to fetch users");
          });
        return status(200, users);
      }
      const users = await db
        .select()
        .from(usersTable)
        .orderBy(usersTable.role)
        .catch(() => {
          throw status(500, "Failed to fetch users");
        });
      return status(200, users);
    },
    {
      body: t.Object({
        role: t.Nullable(t.UnionEnum(["admin", "airline", "gate", "ground"])),
      }),
    },
  )
  .get("/flights", async ({ status }) => {
    const flights = await db
      .select({
        id: flightTable.id,
        flight: flightTable.flight,
        gate: flightTable.gate,
        departed: flightTable.departed,
        passengerCount: count(passengerTable.id),
      })
      .from(flightTable)
      .leftJoin(passengerTable, eq(flightTable.flight, passengerTable.flight))
      .groupBy(flightTable.id)
      .orderBy(flightTable.id)
      .catch(() => {
        throw status(500, "Failed to fetch flights");
      });
    return status(200, flights);
  })
  .post(
    "/flights",
    async ({ body, status }) => {
      const flightRegex = /^\w{2}[0-9]{4}$/;
      if (!flightRegex.test(body.flight)) {
        return status(400, "Invalid flight number");
      }
      await db
        .insert(flightTable)
        .values({
          flight: body.flight.toUpperCase(),
          gate: body.gate.toUpperCase(),
        })
        .catch((err) => {
          if (
            err.cause.message &&
            err.cause.message.includes("duplicate key value")
          ) {
            throw status(400, "Flight already exists");
          }
          throw status(500, "Failed to create flight");
        });
      return status(201);
    },
    {
      body: t.Object({
        flight: t.String(),
        gate: t.String(),
      }),
    },
  )
  .delete(
    "/flights",
    async ({ body, status }) => {
      try {
        const flights = await db
          .select()
          .from(flightTable)
          .where(inArray(flightTable.id, body.ids));
        const flightNumbers = flights.map((flight) => flight.flight);
        const passengers = await db
          .select()
          .from(passengerTable)
          .where(inArray(passengerTable.flight, flightNumbers))
          .catch(() => {
            throw status(500, "Failed to fetch passengers");
          });
        const tickets = passengers.map((passenger) => passenger.ticket);
        await db
          .delete(bagTable)
          .where(inArray(bagTable.ticket, tickets))
          .catch(() => {
            throw status(500, "Failed to delete bags");
          });
        await db
          .delete(passengerTable)
          .where(inArray(passengerTable.flight, flightNumbers))
          .catch(() => {
            throw status(500, "Failed to delete passengers");
          });
        await db.delete(flightTable).where(inArray(flightTable.id, body.ids));
        return status(204);
      } catch (error) {
        return status(500, "Failed to remove flights");
      }
    },
    {
      body: t.Object({
        ids: t.Array(t.Number()),
      }),
    },
  )
  .get("/removals", async ({ status }) => {
    const passengers = (
      await db
        .select()
        .from(passengerTable)
        .where(eq(passengerTable.remove, true))
        .catch(() => {
          throw status(500, "Failed to fetch passengers");
        })
    ).length;
    const flights = (
      await db
        .select()
        .from(flightTable)
        .where(eq(flightTable.departed, true))
        .catch(() => {
          throw status(500, "Failed to fetch flights");
        })
    ).length;
    return status(200, { passengers, flights });
  });

const elysia = new Elysia({ prefix: "/api" })
  .use(authRouter)
  .use(adminRouter)
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      schema: t.Object({
        id: t.Number(),
        username: t.String(),
        role: t.UnionEnum(["admin", "airline", "gate", "ground"]),
        airline: t.String(),
        newAccount: t.Boolean(),
      }),
    }),
  )
  .derive(async ({ jwt, cookie }) => {
    const token = cookie.auth;
    if (!token) return { user: null };

    if (typeof token.value !== "string") return { user: null };
    const payload = await jwt.verify(token.value);
    if (!payload) return { user: null };

    return { user: payload };
  })
  .onBeforeHandle(({ user, status }) => {
    if (!user) return status(401);
  })
  .get(
    "/passengers",
    async ({ user, status, query }) => {
      if (!user) return status(401);
      const airline =
        user.role === "airline" || user.role === "gate" ? user.airline : null;
      const parseQuery = () => {
        if (query.flight && query.flight !== "") {
          return eq(passengerTable.flight, query.flight);
        } else if (airline) {
          return ilike(passengerTable.flight, `${airline}%`);
        } else {
          return sql`true`;
        }
      };
      const passengers = await db
        .select({
          id: passengerTable.id,
          firstName: passengerTable.firstName,
          lastName: passengerTable.lastName,
          identification: passengerTable.identification,
          ticket: passengerTable.ticket,
          flight: passengerTable.flight,
          status: passengerTable.status,
          remove: passengerTable.remove,
          bags: count(bagTable.id),
        })
        .from(passengerTable)
        .where(parseQuery())
        .leftJoin(bagTable, eq(passengerTable.ticket, bagTable.ticket))
        .groupBy(passengerTable.id)
        .orderBy(passengerTable.flight)
        .catch((err) => {
          console.log(err);
          throw status(500, "Failed to fetch passengers");
        });
      return status(200, passengers);
    },
    {
      query: t.Object({
        flight: t.Nullable(t.String()),
      }),
    },
  )
  .delete(
    "/passengers",
    async ({ user, body, status }) => {
      if (!user) return status(401);
      if (user.role !== "admin") {
        return status(403);
      }
      const passengers = await db
        .select()
        .from(passengerTable)
        .where(inArray(passengerTable.id, body.ids))
        .catch(() => {
          throw status(500, "Failed to fetch passengers");
        });
      const tickets = passengers.map((passenger) => passenger.ticket);
      await db.delete(bagTable).where(inArray(bagTable.ticket, tickets));
      await db
        .delete(passengerTable)
        .where(inArray(passengerTable.id, body.ids))
        .catch(() => {
          throw status(500, "Failed to delete passengers");
        });
      return status(204);
    },
    {
      body: t.Object({
        ids: t.Array(t.Number()),
      }),
    },
  )
  .post(
    "/passengers",
    async ({ user, body, status }) => {
      if (!user) return status(401);
      if (user.role !== "admin") {
        return status(403);
      }
      const identification = parseInt(body.identification);
      if (
        isNaN(identification) ||
        identification > 999999 ||
        identification < 100000
      ) {
        return status(400, "Invalid identification number");
      }
      const ticket = Math.floor(1000000000 + Math.random() * 9000000000);
      const flightRegex = /^\w{2}[0-9]{4}$/;
      if (!flightRegex.test(body.flight)) {
        return status(400, "Invalid flight number");
      }
      await db
        .insert(passengerTable)
        .values({
          firstName: body.firstName,
          lastName: body.lastName,
          identification: identification,
          ticket: ticket,
          flight: body.flight.toUpperCase(),
        })
        .catch((err) => {
          if (err.cause.message.includes("violates foreign key constraint")) {
            throw status(400, "Flight does not exist");
          }
          if (err.cause.message.includes("duplicate key value")) {
            throw status(400, "Ticket number already exists");
          }
          console.log(err);
          throw status(500, "Failed to create passenger");
        });
      return status(204);
    },
    {
      body: t.Object({
        firstName: t.String(),
        lastName: t.String(),
        identification: t.String(),
        flight: t.String(),
      }),
    },
  )
  .put(
    "/passengers",
    async ({ user, body, status }) => {
      if (!user) return status(401);
      if (!(user.role === "airline" || user.role === "gate"))
        return status(403);
      const passenger = (
        await db
          .select()
          .from(passengerTable)
          .where(eq(passengerTable.id, body.id))
          .catch(() => {
            throw status(500, "Failed to fetch passenger");
          })
      )[0];
      if (!passenger) return status(404);
      if (!passenger.flight.includes(user.airline)) return status(403);

      let remove = passenger.remove;
      if (user.role === "airline" || user.role === "gate") {
        remove = body.flag;
      }

      let newStatus;
      if (user.role === "airline") {
        newStatus = "checked-in";
      } else if (user.role === "gate") {
        newStatus = "boarded";
      } else if (user.role === "ground") {
        newStatus = passenger.status;
      } else {
        return status(403);
      }

      await db
        .update(passengerTable)
        .set({
          status: remove ? passenger.status : (newStatus as Status),
          remove,
        })
        .where(eq(passengerTable.id, body.id))
        .catch(() => {
          throw status(500, "Failed to update passenger");
        });
      return status(204);
    },
    {
      body: t.Object({
        id: t.Number(),
        flag: t.Boolean(),
      }),
    },
  )
  .post(
    "/bags",
    async ({ user, body, status }) => {
      if (!user) return status(401);
      if (!(user.role === "airline" || user.role === "ground")) {
        return status(403);
      }
      const id = Math.floor(100000 + Math.random() * 900000);
      await db
        .insert(bagTable)
        .values({
          id,
          ticket: body.ticket,
          location: {
            type: "check-in",
            terminal: body.terminal,
            counter: body.counter,
          } as BagLocation,
        })
        .catch((err) => {
          if (err.cause.message.includes("violates foreign key constraint")) {
            throw status(400, "Flight does not exist");
          }
          if (err.cause.message.includes("duplicate key value")) {
            throw status(400, "Ticket number already exists");
          }
          console.log(err);
          throw status(500, "Failed to create bag");
        });
      return status(204);
    },
    {
      body: t.Object({
        ticket: t.Number(),
        terminal: t.String(),
        counter: t.Number(),
      }),
    },
  )
  .get(
    "/bags",
    async ({ user, query, status }) => {
      if (!user) return status(401);
      const parseQuery = () => {
        if (query.ticket && query.ticket !== "") {
          return eq(bagTable.ticket, parseInt(query.ticket));
        } else {
          return sql`true`;
        }
      };
      const bags = await db
        .select()
        .from(bagTable)
        .where(parseQuery())
        .orderBy(bagTable.id)
        .catch(() => {
          throw status(500, "Failed to fetch bags");
        });
      return status(200, bags);
    },
    {
      query: t.Object({
        ticket: t.String(),
      }),
    },
  )
  .delete(
    "/bags",
    async ({ user, body, status }) => {
      if (!user) return status(401);
      if (!(user.role === "airline")) {
        return status(403);
      }
      await db
        .delete(bagTable)
        .where(eq(bagTable.ticket, body.ticket))
        .catch(() => {
          throw status(500, "Failed to delete bags");
        });
      return status(204);
    },
    {
      body: t.Object({
        ticket: t.Number(),
      }),
    },
  )
  .get("/flights", async ({ user, status }) => {
    if (!user) return status(401);
    let flights;
    if (user.role === "gate") {
      if (!user.airline) return status(403);
      flights = await db
        .select({
          id: flightTable.id,
          flight: flightTable.flight,
          gate: flightTable.gate,
          departed: flightTable.departed,
          passengerCount: count(passengerTable.id),
        })
        .from(flightTable)
        .where(ilike(flightTable.flight, `${user.airline}%`))
        .leftJoin(passengerTable, eq(flightTable.flight, passengerTable.flight))
        .groupBy(flightTable.id)
        .orderBy(flightTable.id)
        .catch(() => {
          throw status(500, "Failed to fetch flights");
        });
    } else if (user.role === "admin") {
      flights = await db
        .select({
          id: flightTable.id,
          flight: flightTable.flight,
          gate: flightTable.gate,
          departed: flightTable.departed,
          passengerCount: count(passengerTable.id),
        })
        .from(flightTable)
        .leftJoin(passengerTable, eq(flightTable.flight, passengerTable.flight))
        .groupBy(flightTable.id)
        .orderBy(flightTable.id)
        .catch(() => {
          throw status(500, "Failed to fetch flights");
        });
    } else {
      return status(403);
    }

    return status(200, flights);
  });

const server = Bun.serve({
  port: 3000,
  routes: {
    "/api/*": elysia.handle,
    "/*": index,
  },
});

export type Api = typeof elysia;

console.log(
  chalk.green("> Server running at"),
  chalk.yellow.underline(server.url),
);

await migrate(db, {
  migrationsFolder: "./drizzle",
});

if (
  await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, "admin"))
    .then((users) => users.length === 0)
) {
  process.stdout.write(
    chalk.yellow("> Admin user not found, creating default admin account... "),
  );
  await db.insert(usersTable).values({
    username: "admin",
    password: await Bun.password.hash(env.ADMIN_PASSWORD, {
      algorithm: "argon2id",
    }),
    role: "admin",
    newAccount: false,
  });
  console.log(chalk.green("success"));
}

transport.verify((error) => {
  if (error) {
    console.log(chalk.red("> Error Initializing email service:\n"), error);
  } else {
    console.log(chalk.green("> Server is ready to send emails"));
  }
});
