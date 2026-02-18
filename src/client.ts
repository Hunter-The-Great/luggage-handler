import { treaty } from "@elysiajs/eden";
import type { Api } from ".";

export const client = treaty<Api>("window.location.origin");
