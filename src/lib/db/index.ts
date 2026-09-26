import { env } from "cloudflare:workers";

import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

function getDatabaseUrl(): string {
    const databaseUrl =
        env?.HYPERDRIVE?.connectionString ??
        env?.DATABASE_URL ??
        process.env.DATABASE_URL;

    if (!databaseUrl) throw new Error("DATABASE_URL is required");

    return databaseUrl;
}

function createDb(client: Client) {
    return drizzle({ client });
}

export type Database = ReturnType<typeof createDb>;

/**
 * Cloudflare scopes database sockets to the request that created them. Drizzle's
 * string overload creates a module-level pg Pool whose connections can therefore
 * hang when reused by another request. Hyperdrive already provides connection
 * pooling, so use one lightweight Client for each request instead.
 */
export async function withDb<T>(
    operation: (db: Database) => Promise<T>,
): Promise<T> {
    const client = new Client({ connectionString: getDatabaseUrl() });
    await client.connect();

    try {
        return await operation(createDb(client));
    } finally {
        await client.end();
    }
}
