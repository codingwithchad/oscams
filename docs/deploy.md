# Deploying to Render

The app is a single Node server (`node build`). `render.yaml` describes it.

1. In Render, choose New > Blueprint and connect the `codingwithchad/oscams` GitHub repo.
2. When asked for `WSDOT_CODE`, paste your WSDOT access code (never commit it).
3. Render builds and gives you an https URL. Camera and data changes go live when you push to `main`.

Notes
- The free plan sleeps when idle and takes about a minute to wake. Switch the service to the Starter plan to keep it always on.
- Health check: `/healthz` reports how many cameras, weather sources and places loaded.
- Installable offline mode only works over https, so test it on the Render URL.
