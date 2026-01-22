import { Elysia, t } from "elysia";
import index from "./index.html";
import chalk from "chalk";
import { nanoid } from "nanoid";
import { jwt } from "@elysiajs/jwt";
import { db } from "./lib/db";
import { usersTable } from "./db/schema";
import { eq } from "drizzle-orm";
import { env } from "./lib/env";

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

const authRouter = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
    }),
  )
  .post("/login", async ({ body, jwt, cookie: { auth }, set }) => {
    const { username, password } = body as {
      username: string;
      password: string;
    };

    const user = (
      await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, username))
    )[0];

    // TODO: use bcrypt.compare
    if (!user || user.password !== password) {
      set.status = 401;
      return {
        success: false,
        message: "Invalid credentials",
      };
    }

    const token = await jwt.sign({
      id: user.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    });

    auth?.set({
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return {
      success: true,
      token,
      user: { name: user.username },
    };
  })
  .get("/sign/:name", async ({ jwt, params: { name }, cookie: { auth } }) => {
    const value = await jwt.sign({ name });

    auth?.set({
      value,
      httpOnly: true,
      maxAge: 7 * 86400,
      path: "/profile",
    });

    return `Sign in as ${value}`;
  })
  .get("/profile", async ({ jwt, status, cookie: { auth } }) => {
    const profile = await jwt.verify(auth.value);

    if (!profile) return status(401, "Unauthorized");

    return `Hello ${profile.name}`;
  });

const elysia = new Elysia()
  .get("/", index)
  .use(todoRouter)
  .use(authRouter)
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
