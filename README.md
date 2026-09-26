# Best Coffee Near Me

A web app that gets cafes near you from Google Maps and ranks them, so you can find the best coffee close to you now.

## Ranking

Each cafe gets a score from 0 to 100. The score is a weighted average of six signals. Each signal is between 0 and 1. You set the weights (0–5) with the sliders.

| Signal | How it is calculated | Default weight |
|---|---|---|
| Coffee reviews | What the written Google reviews say about the coffee. See "Coffee reviews" below. No coffee mentions = 0.5. | 3 |
| Rating | Bayesian average of the Google rating. A prior of 4.0 stars with a weight of 25 reviews pulls cafes with few reviews towards the middle. The 3–5 star band maps to 0–1. | 2 |
| Closeness | Straight-line distance. The score halves every 750 m (about a 9 minute walk). | 3 |
| Menu match | The fraction of the products you selected that the cafe has: yes = 1, no = 0, unknown = 0.5. | 1 |
| Opening hours | Closed = 0. Open = minutes until close / 90, maximum 1. Open 24 hours = 1. | 2 |
| Delivery | Delivers = 1, does not deliver = 0, unknown = 0.5. | 1 |

Hard filters remove cafes before they are ranked: "Open now only", "Delivers only" and the search radius.

## Coffee reviews

The app does not scrape Google Maps. Scraping breaks the Google Maps Platform terms. The app reads the `reviews` field from the Places API. Google returns a maximum of 5 reviews for each place.

`src/lib/reviews.ts` analyses the review text with keywords:

1. It finds the sentences that talk about coffee (coffee, espresso, flat white, beans, barista, and similar words).
2. It counts positive words (smooth, best, great) and negative words (bitter, burnt, watery) in those sentences. A negation in the 3 words before a word ("not great") reverses it.
3. Score = positive / (positive + negative). With fewer than 4 coffee mentions, the score moves towards 0.5.
4. It finds coffee products: oat milk, specialty beans (single origin, roasts their own), filter and pour over, cold brew. These become filter chips. If no review mentions a product, the app records "unknown", not "no".
5. It shows the strongest coffee sentence as a quote, with the reviewer's name, as the Google terms require.

This method is simple and fast, and needs no server. It can misread sarcasm and unusual phrases. A language model would be more accurate, but it needs a back end to keep its API key secret.

## Map

The map uses the Google Maps JavaScript API. The Google terms do not allow Places data on a non-Google map. The key must allow **Maps JavaScript API** as well as **Places API (New)**.

The map uses Google's `DEMO_MAP_ID` for its markers. For production, create a Map ID in Google Cloud Console (**Google Maps Platform > Map management**) and set it in `VITE_GOOGLE_MAP_ID`.

In demo mode, the app shows a simple stand-in map with the same pins.

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

The requested fields (opening hours, delivery, `serves*`, reviews) are in the Places **Nearby Search Enterprise + Atmosphere** SKU. Each search sends 2 requests. Each page load also loads 1 dynamic map (Maps JavaScript API). Examine the current Google Maps Platform prices before you deploy.

## Deploy to GitHub Pages

The workflow `.github/workflows/deploy.yml` tests, builds and deploys the app on each push to `main`.

1. In the repository settings, go to **Pages**. Set **Source** to **GitHub Actions**.
2. Go to **Secrets and variables > Actions**. Add a repository secret named `VITE_GOOGLE_MAPS_API_KEY` with your key. Without the secret, the site runs in demo mode.
3. In Google Cloud Console, restrict the key to the HTTP referrer `https://jessfundtap.github.io/*`. The key is visible in the built JavaScript.
4. Push to `main`, or run the workflow from the **Actions** tab.

The site is at `https://jessfundtap.github.io/cafe-finder/`.

A GitHub Pages site is public, even when the repository is private.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Start the development server |
| `npm test` | Run the unit tests |
| `npm run build` | Type-check and build to `dist/` |
