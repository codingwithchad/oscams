// Load secrets (e.g. WSDOT_CODE) from a local .env file when present. In production, set real environment variables.
try {
	process.loadEnvFile('.env');
} catch {
	// no .env file: rely on the real environment
}
