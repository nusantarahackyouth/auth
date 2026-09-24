import { env } from "cloudflare:workers";

import { drizzle } from "drizzle-orm/node-postgres";

const dbUrl =
    env?.HYPERDRIVE?.connectionString ??
    env?.DATABASE_URL ??
    process.env.DATABASE_URL;

if (!dbUrl) {
    throw new Error("DATABASE_URL is required");
}

export const db = drizzle(dbUrl);
