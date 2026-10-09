// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			/** Which camera the full-screen viewer shows (its place in the list), when it is open. */
			camera?: number;
		}
		// interface Platform {}
	}
}

export {};
