import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkAll, healthReport } from './health';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

const reply = (body: unknown, init: ResponseInit = {}) =>
	Promise.resolve(new Response(JSON.stringify(body), { status: 200, ...init }));

describe('health checks', () => {
	it('reports working sources, failing ones, and keys that are not set', async () => {
		vi.stubEnv('WSDOT_CODE', 'k');
		vi.stubEnv('WINDY_API_KEY', '');
		vi.stubEnv('GITHUB_ISSUES_TOKEN', 't');
		vi.stubGlobal(
			'fetch',
			vi.fn((url: string) => {
				if (url.includes('BorderCrossings')) return reply([{ CrossingName: 'I5', WaitTime: 5 }]);
				if (url.includes('terminalsailingspace'))
					return reply({ Message: 'bad key' }, { status: 401 });
				if (url.includes('api.github.com'))
					return reply(
						{},
						{
							headers: {
								'github-authentication-token-expiration': new Date(Date.now() + 10 * 86_400_000)
									.toISOString()
									.replace('T', ' ')
									.replace(/\.\d+Z$/, ' UTC')
							}
						}
					);
				if (url.includes('tripcheck') || url.includes('TripCheck'))
					return Promise.resolve(new Response(new Uint8Array([0xff, 0xd8, 1, 2])));
				return reply({});
			})
		);
		await checkAll(0);
		const { sources, github_token_expires_in_days } = healthReport();
		expect(sources.wsdot.status).toBe('ok');
		expect(sources['wsdot-ferries']).toMatchObject({
			status: 'failing',
			problem: 'answered 401',
			failures_in_a_row: 2
		});
		expect(sources.windy.status).toBe('not-configured');
		expect(sources.nws.status).toBe('ok');
		expect(github_token_expires_in_days).toBe(9);
	});
});
