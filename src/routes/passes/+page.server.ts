import { getCatalog } from '../../lib/server/catalog';
import { livePasses } from '../../lib/server/passes';
import type { PageServerLoad } from './$types';

const GROUP_ORDER = ['Cross-Cascades', 'Foothills and ski roads', 'Eastern Washington'];

export const load: PageServerLoad = async ({ setHeaders }) => {
	const { passes } = getCatalog();
	const live = await livePasses();
	setHeaders({ 'cache-control': 'public, max-age=60' });
	const rows = passes.map((p) => ({ ...p, report: live.get(p.pass_id) ?? null }));
	const groups = GROUP_ORDER.map((name) => ({
		name,
		passes: rows.filter((r) => r.group === name)
	})).filter((g) => g.passes.length);
	const counts: Record<string, number> = {};
	for (const r of rows)
		counts[r.report?.status ?? 'unknown'] = (counts[r.report?.status ?? 'unknown'] ?? 0) + 1;
	return { groups, counts, reachable: live.size > 0 };
};
