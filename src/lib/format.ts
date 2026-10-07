/** "2026-11" -> "November" (adds the year when it is not the current one). */
export function returnLabel(expected?: string, now: Date = new Date()): string | null {
	if (!expected) return null;
	const date = new Date(`${expected.slice(0, 7)}-01T12:00:00Z`);
	if (Number.isNaN(date.getTime())) return null;
	const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
	return date.getUTCFullYear() === now.getFullYear() ? month : `${month} ${date.getUTCFullYear()}`;
}

/** "2 min ago", "3 h ago". */
export function ago(iso: string, now: number = Date.now()): string {
	const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
	if (mins < 1) return 'just now';
	if (mins < 60) return `${mins} min ago`;
	const hours = Math.round(mins / 60);
	return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
}
