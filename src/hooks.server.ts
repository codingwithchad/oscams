import { dev } from '$app/env';
import { getCatalog } from './lib/server/catalog';
import { startHistory } from './lib/server/history';

// Load secrets (e.g. WSDOT_CODE) from a local .env file when present. In production, set real environment variables.
try {
	process.loadEnvFile('.env');
} catch {
	// no .env file: rely on the real environment
}

// Read all the data files when the server starts so the first visitor does not wait for them.
getCatalog();

// Start saving the pass-camera pictures that power the replay. Off in development; set HISTORY=off to disable anywhere.
if (!dev && process.env.HISTORY !== 'off') startHistory();
