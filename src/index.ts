import { Elysia } from "elysia";
import index from "./index.html";
import chalk from "chalk";

const elysia = new Elysia().get("/", index).listen(3000);

if (!elysia.server) {
  console.log(chalk.red("Server failed to start"));
  process.exit(1);
}

console.log(
  chalk.green("Server running at"),
  chalk.yellow.underline(elysia.server?.url),
);
