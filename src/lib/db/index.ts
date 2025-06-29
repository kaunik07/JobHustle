
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config({ path: '.env' });

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Neon connection strings can contain parameters not supported by the postgres.js library.
// We'll parse the URL and remove any problematic parameters to ensure a stable connection.
const url = new URL(process.env.POSTGRES_URL);

// 'channel_binding' is a SCRAM-based security feature that is not supported by the
// underlying driver, which can cause connection failures. We remove it here.
url.searchParams.delete('channel_binding');

// Ensure sslmode is set, as it's required for all Neon connections.
if (!url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require');
}

const client = postgres(url.toString());
export const db = drizzle(client, { schema, logger: true });
