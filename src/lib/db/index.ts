
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config({ path: '.env' });

let db: PostgresJsDatabase<typeof schema>;

if (!process.env.POSTGRES_URL) {
  // If the URL is not set, we'll create a proxy object.
  // When any method is called on it, it will throw the helpful error.
  // This allows the app to build and run, and the error will be caught
  // gracefully by our UI components instead of crashing the server.
  db = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'then') {
            return undefined; // Avoids issues with Promise-like checks
        }
        throw new Error(
          'POSTGRES_URL environment variable is not set. Please add it to the .env file to connect to the database.'
        );
      },
    }
  ) as PostgresJsDatabase<typeof schema>;
} else {
  // If the URL is set, initialize the real database connection.
  const url = new URL(process.env.POSTGRES_URL);

  // Neon connection strings can contain parameters not supported by the postgres.js library.
  // We'll parse the URL and remove any problematic parameters to ensure a stable connection.
  url.searchParams.delete('channel_binding');

  // Ensure sslmode is set, as it's required for all Neon connections.
  if (!url.searchParams.has('sslmode')) {
      url.searchParams.set('sslmode', 'require');
  }

  const client = postgres(url.toString());
  db = drizzle(client, { schema, logger: true });
}

export { db };
