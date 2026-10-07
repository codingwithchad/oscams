export const LAST_KEY = 'oscams:last';

/** Remember the place being viewed so the app can reopen to it next time. */
export function rememberPlace(path: string) {
	try {
		localStorage.setItem(LAST_KEY, path);
	} catch {
		// storage can be blocked (private mode); remembering is optional
	}
}
