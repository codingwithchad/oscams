export interface SnowSample {
	/** Miles from the start of the drive. */
	along: number;
	/** Feet above sea level. */
	feet: number;
	/** Air temperature in °F when you get there. */
	tempF: number;
	/** Snow expected in the hour you get there, in inches. */
	snowIn: number;
}

export type Level = 'clear' | 'cold' | 'snow';

export interface SnowStretch {
	level: Exclude<Level, 'clear'>;
	from: number;
	to: number;
	/** Elevation where it starts, in feet. */
	feet: number;
}

export const levelOf = (s: SnowSample): Level =>
	s.snowIn >= 0.02 && s.tempF <= 35 ? 'snow' : s.tempF <= 32 ? 'cold' : 'clear';

/** Runs of road where it is snowing, or at/below freezing, in driving order. */
export function snowStretches(samples: SnowSample[]): SnowStretch[] {
	const out: SnowStretch[] = [];
	let cur: SnowStretch | null = null;
	for (let i = 0; i < samples.length; i++) {
		const s = samples[i];
		const level = levelOf(s);
		if (level === 'clear') {
			cur = null;
			continue;
		}
		if (cur && cur.level === level) {
			cur.to = s.along;
			continue;
		}
		// A stretch starts halfway back to the last sample, since the change happened somewhere between.
		const prev = samples[i - 1];
		const start = prev ? (prev.along + s.along) / 2 : s.along;
		cur = { level, from: start, to: s.along, feet: s.feet };
		out.push(cur);
	}
	return out;
}
