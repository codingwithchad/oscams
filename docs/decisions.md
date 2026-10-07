# Decisions

## 2026-10-07: Stack

- **Installable web app (PWA), mobile-first.** No app stores, shareable by link. Car integration (Android Auto / CarPlay) is a possible later add-on; camera images are not expected to be allowed on car screens while driving.
- **TypeScript everywhere, SvelteKit.** One language for pages and server code. Chosen for small, fast pages on weak mountain signal.
- **Single Node server (SvelteKit adapter-node).** Target is about 1,000 users on one small server. Camera and weather files are read into memory, and upstream fetches (WSDOT, NWS) are cached so load on providers stays low.
- **Files in git remain the source of truth** for cameras and weather sources (see data-model.md).
- **Secrets stay in environment variables**, never in the repo.
