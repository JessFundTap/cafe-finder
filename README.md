# Best Coffee Near Me

A web app that gets cafes near you from Google Maps and ranks them, so you can find the best coffee close to you now.

## Ranking

Each cafe gets a score from 0 to 100. The score is a weighted average of five signals. Each signal is between 0 and 1. You set the weights (0–5) with the sliders.

| Signal | How it is calculated | Default weight |
|---|---|---|
| Rating | Bayesian average of the Google rating. A prior of 4.0 stars with a weight of 25 reviews pulls cafes with few reviews towards the middle. The 3–5 star band maps to 0–1. | 3 |
| Closeness | Straight-line distance. The score halves every 750 m (about a 9 minute walk). | 3 |
| Menu match | The fraction of the products you selected that the cafe has: yes = 1, no = 0, unknown = 0.5. | 1 |
| Opening hours | Closed = 0. Open = minutes until close / 90, maximum 1. Open 24 hours = 1. | 2 |
| Delivery | Delivers = 1, does not deliver = 0, unknown = 0.5. | 1 |

Hard filters remove cafes before they are ranked: "Open now only", "Delivers only" and the search radius.

The ranking logic is in `src/lib/scoring.ts`. The tests are in `src/lib/scoring.test.ts`.

## Data source

The app calls the Google **Places API (New)** Nearby Search endpoint from the browser. It sends two requests (closest first and most popular first) and merges the results. The API returns a maximum of 20 places per request, so the app ranks a maximum of 40 cafes.

Products come from the Places boolean fields: `servesCoffee`, `servesBreakfast`, `servesBrunch`, `servesLunch`, `servesDessert`, `servesVegetarianFood`, and the `bakery` place type. Google does not supply full menus.

Delivery comes from the `delivery` field. This field tells you if the cafe delivers. It does not tell you if the cafe delivers to your address.

## Set up

```bash
cd cafe-finder
npm install
cp .env.example .env    # then add your key
npm run dev
```

If `VITE_GOOGLE_MAPS_API_KEY` is empty, the app runs in demo mode with sample cafes.

To get a key:

1. In Google Cloud Console, enable **Places API (New)**.
2. Create an API key. Restrict it to Places API (New) and to your site's HTTP referrers. The key is visible in the browser.
3. Put the key in `.env`.

### Cost

The requested fields (opening hours, delivery, `serves*`) are in the Places **Nearby Search Enterprise + Atmosphere** SKU. Each search sends 2 requests. Examine the current Google Maps Platform prices before you deploy.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Start the development server |
| `npm test` | Run the unit tests |
| `npm run build` | Type-check and build to `dist/` |
