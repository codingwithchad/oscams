# Deploying to Render

The app is a single Node server (`node build`). `render.yaml` describes it.

1. In Render, choose New > Blueprint and connect the `codingwithchad/oscams` GitHub repo.
2. When asked for `WSDOT_CODE`, paste your WSDOT access code (never commit it).
3. Render builds and gives you an https URL. Camera and data changes go live when you push to `main`.

Notes
- The free plan sleeps when idle and takes about a minute to wake. Switch the service to the Starter plan to keep it always on.
- Health check: `/healthz` reports how many cameras, weather sources and places loaded.
- Installable offline mode only works over https, so test it on the Render URL.

## Using your own domain (for example whatsupahead.com)

1. Buy the domain at a registrar (Cloudflare Registrar, Porkbun and Namecheap sell .com at or near cost).
2. In Render, open the service, then Settings, then Custom Domains. Add the root domain (`whatsupahead.com`) and `www.whatsupahead.com`. Render shows the exact DNS records to create; add them at the registrar (if you use Cloudflare, keep the records "DNS only", not proxied, until Render says the certificate is ready).
3. When Render shows the domain as verified with HTTPS, add the environment variable `CANONICAL_HOST=whatsupahead.com`. From then on any other address (the old `onrender.com` address, or `www.`) forwards there with a permanent redirect, so old links keep working. Set it only after step 2 works, or the site will forward visitors to an address that isn't ready.
4. Update the project identification on the Windy API key page to the new address.
