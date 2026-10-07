/** "2026-11" -> "November" (adds the year when it is not the current one). */
export function returnLabel(expected?: string, now: Date = new Date()): string | null {
	if (!expected) return null;
	const date = new Date(`${expected.slice(0, 7)}-01T12:00:00Z`);
	if (Number.isNaN(date.getTime())) return null;
	const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
	return date.getUTCFullYear() === now.getFullYear() ? month : `${month} ${date.getUTCFullYear()}`;
}
