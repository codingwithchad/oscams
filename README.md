# OS Cams

Open Source Cameras. Search any location and see the public cameras and weather around it in one place. Works on a phone, no install needed.

## Run it

```
npm install
cp .env.example .env   # add your WSDOT_CODE (optional, enables WSDOT weather and road conditions)
npm run dev
```

Other commands: `npm test`, `npm run check`, `npm run build`.

## How it works

Cameras and weather sources are data files, never code. To add one, add a JSON file to `data/cameras/` or `data/weather-sources/`. See [docs/data-model.md](docs/data-model.md). Stack decisions are in [docs/decisions.md](docs/decisions.md).

Search turns a place into coordinates, then shows every approved camera and weather source within a radius (10 to 75 miles). Trip mode (`/trip`) plans a drive and lists cameras along the road in driving order.
