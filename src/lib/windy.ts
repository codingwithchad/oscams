/** The parts of a Windy Webcams API v3 response we use. */
export interface WindyWebcam {
	status?: string;
	lastUpdatedOn?: string;
	images?: {
		current?: { preview?: string; thumbnail?: string };
		sizes?: { preview?: { width: number; height: number } };
	};
	urls?: { detail?: string; provider?: string };
}

export interface WindyView {
	url: string;
	width: number;
	height: number;
	modified: string | null;
	link: string;
	owner: string | null;
}

/** Windy image links must be used exactly as given, and every image links back to Windy. */
export function parseWindy(cam: WindyWebcam, id: string): WindyView | null {
	const url = cam.images?.current?.preview;
	if (!url || cam.status === 'inactive') return null;
	let owner: string | null = null;
	try {
		if (cam.urls?.provider) owner = new URL(cam.urls.provider).hostname.replace(/^www\./, '');
	} catch {
		// provider link is optional
	}
	return {
		url,
		width: cam.images?.sizes?.preview?.width ?? 400,
		height: cam.images?.sizes?.preview?.height ?? 224,
		modified: cam.lastUpdatedOn ?? null,
		link: cam.urls?.detail ?? `https://windy.com/webcams/${id}`,
		owner
	};
}
