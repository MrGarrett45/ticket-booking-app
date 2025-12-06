import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { config } from "./config";

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

export type DbClient = PoolClient;

export const query = <T extends QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null | string[])[]
): Promise<QueryResult<T>> => pool.query<T>(text, params);

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function shutdownPool() {
  await pool.end();
}
