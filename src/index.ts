import { Elysia, t } from "elysia";
import index from "./index.html";
import chalk from "chalk";
import { nanoid } from "nanoid";
import { jwt } from "@elysiajs/jwt";
import { db } from "./lib/db";
import { usersTable } from "./db/schema";
import { eq } from "drizzle-orm";
import { env } from "./lib/env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { generatePassword } from "./lib/password";

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
        });

        auth?.set({
          value: token,
          httpOnly: true,
          maxAge: 604800,
          path: "/",
        });

        return {
          success: true,
          user: { username: user.username, id: user.id, role: user.role },
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
  .get("/", () => "admin")
  .post(
    "/register",
    async ({ body }) => {
      const emailRegex = /^\w+@\w+\.\w+$/;
      const phonesRegex = /^[1-9]\d{9}$/;
      switch (body.role) {
        case "gate":
        case "airline":
          if (!body.airline)
            return { success: false, message: "Airline is required" };
        case "ground":
          if (!body.firstName)
            return { success: false, message: "First name is required" };
          if (body.firstName.length < 2)
            return {
              success: false,
              message: "First name must be at least 2 characters",
            };
          if (!body.lastName)
            return { success: false, message: "Last name is required" };
          if (body.lastName.length < 2)
            return {
              success: false,
              message: "Last name must be at least 2 characters",
            };
          if (!body.email)
            return { success: false, message: "Email is required" };
          if (!emailRegex.test(body.email))
            return { success: false, message: "Invalid email" };
          if (!body.phone)
            return { success: false, message: "Phone is required" };
          if (!phonesRegex.test(body.phone))
            return { success: false, message: "Invalid phone number" };
          break;
        default:
          return { success: false, message: "Invalid role" };
      }
      try {
        let username = body.lastName;
        const lastNames = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.lastName, body.lastName));

        if (lastNames.length > 0) {
          lastNames.sort((a, b) => a.id - b.id);
          const prevName = lastNames[lastNames.length - 1];
          if (!prevName || !prevName.lastName)
            return { success: false, message: "Failed to generate username" };
          const id =
            parseInt(prevName.username.substring(prevName.lastName.length)) + 1;
          if (id < 0 || id > 99) {
            return {
              success: false,
              message: "Failed to generate username",
            };
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
        // TODO: email the login
        console.log(password);
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
          airline: body.airline,
        });
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          message: "Failed to register",
        };
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
  );

const elysia = new Elysia()
  .get("/", index)
  .use(todoRouter)
  .use(authRouter)
  .use(adminRouter)
  .listen(3000);

export type Api = typeof elysia;

if (!elysia.server) {
  console.log(chalk.red("Server failed to start"));
  process.exit(1);
}

console.log(
  chalk.green("Server running at"),
  chalk.yellow.underline(elysia.server?.url),
);

await migrate(db, {
  migrationsFolder: "./drizzle",
});

if (
  await db
    .select()
    .from(usersTable)
    .then((users) => users.length === 0)
) {
  process.stdout.write(
    chalk.yellow("Admin user not found, creating default admin account... "),
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
