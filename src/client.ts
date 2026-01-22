// client.ts
import { treaty } from "@elysiajs/eden";
import type { Api } from ".";

export const client = treaty<Api>("localhost:3000");
