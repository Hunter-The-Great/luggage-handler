import { Elysia, t } from "elysia";
import index from "./index.html";
import chalk from "chalk";
import { nanoid } from "nanoid";
import { jwt } from "@elysiajs/jwt";
import { db } from "./lib/db";
import { flightTable, lower, passengerTable, usersTable } from "./db/schema";
import { eq, ilike, inArray } from "drizzle-orm";
import { env } from "./lib/env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { generatePassword } from "./lib/password";
import { ChangePassword } from "./changePassword";
import { transport } from "./lib/email";

export type Todo = {
  id: string;
  text: string;
  complete: boolean;
};

const todos: Todo[] = [
  {
    text: "water plants",
    id: "89239jvksjdkf",
    complete: false,
  },
];

const todoRouter = new Elysia({ prefix: "/todos" })
  .get("/", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return todos;
  })
  .post(
    "/",
    ({ body }) => {
      const newTodo = {
        id: nanoid(),
        text: body.text,
        complete: false,
      };
      todos.push(newTodo);
      return newTodo;
    },
    {
      body: t.Object({
        text: t.String(),
      }),
    },
  )
  .put(
    "/:id",
    ({ params, body }) => {
      const todo = todos.find((todo) => todo.id === params.id);
      if (!todo) return 404;
      todo.text = body.text;
      todo.complete = body.complete;
      return todo;
    },
    {
      body: t.Object({
        text: t.String(),
        complete: t.Boolean(),
      }),
    },
  )
  .delete("/:id", ({ params }) => {
    const index = todos.findIndex((todo) => todo.id === params.id);
    if (index === -1) return 404;
    todos.splice(index, 1);
    return 204;
  });

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
      .select()
      .from(flightTable)
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
        const tickets = flights.flatMap((flight) => flight.tickets);
        await db
          .delete(passengerTable)
          .where(inArray(passengerTable.ticket, tickets));
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
  .use(todoRouter)
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
      if (user.role === "airline" || user.role === "gate") {
        if (
          !query.airline ||
          query.airline?.toLowerCase() !== user.airline.toLowerCase()
        ) {
          return status(403);
        }
      }
      if (query.airline !== "") {
        const passengers = await db
          .select()
          .from(passengerTable)
          .where(ilike(passengerTable.flight, `${query.airline}%`))
          .orderBy(passengerTable.flight)
          .catch(() => {
            throw status(500, "Failed to fetch passengers");
          });
        return status(200, passengers);
      }
      const passengers = await db
        .select()
        .from(passengerTable)
        .orderBy(passengerTable.flight)
        .catch(() => {
          throw status(500, "Failed to fetch passengers");
        });
      return status(200, passengers);
    },
    {
      query: t.Object({
        airline: t.String(),
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
      await db
        .delete(passengerTable)
        .where(inArray(passengerTable.id, body.ids));
      return status(204);
    },
    {
      body: t.Object({
        ids: t.Array(t.Number()),
      }),
    },
  )
  .put(
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
      const ticket = parseInt(body.ticket);
      if (isNaN(ticket) || ticket > 9999999999 || ticket < 1000000000) {
        return status(400, "Invalid ticket number");
      }
      const flightRegex = /^\w{2}[0-9]{4}$/;
      if (!flightRegex.test(body.flight)) {
        return status(400, "Invalid flight number");
      }
      // TODO: check to see if flight already exists?
      // TODO: random ticket number?
      await db
        .insert(passengerTable)
        .values({
          firstName: body.firstName,
          lastName: body.lastName,
          identification: identification,
          ticket: ticket,
          flight: body.flight,
        })
        .catch((err) => {
          if (err.cause.message.includes("duplicate key value")) {
            throw status(400, "Ticket number already exists");
          }
        });
      return status(204);
    },
    {
      body: t.Object({
        firstName: t.String(),
        lastName: t.String(),
        identification: t.String(),
        ticket: t.String(),
        flight: t.String(),
      }),
    },
  );

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
