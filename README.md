# Halo Quotes

A comprehensive project featuring a website, API, and bots for displaying and sharing random quotes from the Halo video game series.

## Main Functions

This repository provides three main functions:

1. **Website**: https://haloquotes.teamrespawntv.com/ A modern, static web application that displays random quotes from all Halo games
2. **Bots**: https://bsky.app/profile/LocalUnits.bsky.social Automated bots that post quotes on a scheduled run to both Bluesky and Twitter
3. **API**: https://api.haloquotes.teamrespawntv.com/ A RESTful API that allows you to query quotes for your own projects

## Website Features

- **Uniform random quotes.** All quote files are loaded once at startup and
  flattened into a single pool, so every quote is equally likely regardless of
  how many quotes its game has.
- **Filter by game.** Pick a single game from the dropdown, or leave it on
  "All games". The choice is remembered between visits.
- **Permalinks.** Every quote has an address like
  `haloquotes.teamrespawntv.com/#/halo-2/42`, so a shared link reopens the same
  quote rather than a new random one.
- **Share and copy.** Copy the quote to the clipboard, or open it prefilled in
  the Bluesky or X composer.
- **History.** Previous and Next walk back and forth through the quotes you
  have already seen.
- **Keyboard shortcuts.** Left and right arrows browse, `C` copies.
- **Works without JavaScript.** The page ships with a quote in the markup and
  explains what is unavailable.

## Repository Structure

```
Halo-Quotes/
├── .github/                   # GitHub configuration
│   └── workflows/             # GitHub Actions workflows
│       ├── bsky-bot.yml       # Bluesky bot automation (every 3 hours)
│       └── tests.yml          # Test suite on every push and pull request
├── __tests__/                 # Website tests (run against index.html/app.js)
│   ├── helpers/
│   │   └── load-page.js       # Loads the real page into JSDOM
│   ├── accessibility.test.js  # Menu focus, ARIA, reduced motion
│   ├── features.test.js       # Filter, permalinks, sharing, shortcuts
│   ├── hamburger-menu.test.js # Menu structure and links
│   ├── metadata.test.js       # Social cards, icons, structured data
│   └── quotes.test.js         # Quote pool, history, quote data
├── api-worker/                # Cloudflare Worker API
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── index.test.js  # API tests
│   │   └── index.js           # API worker implementation
│   ├── package.json           # API dependencies
│   ├── package-lock.json      # Locked dependency versions
│   ├── vitest.config.js       # Vitest test configuration
│   ├── wrangler.toml          # Cloudflare Worker configuration
│   └── README.md              # API-specific documentation
├── bots/                      # Social media bots
│   ├── bsky-bot.ts            # Bluesky bot implementation
│   ├── twitter-bot.js         # Twitter bot implementation (not scheduled)
│   ├── package.json           # Bot dependencies
│   └── package-lock.json      # Locked dependency versions
├── quotes/                    # Quote data files
│   ├── halo-ce.json           # Halo: Combat Evolved quotes
│   ├── halo-2.json            # Halo 2 quotes
│   ├── halo-3.json            # Halo 3 quotes
│   ├── halo-odst.json         # Halo 3: ODST quotes
│   ├── halo-reach.json        # Halo: Reach quotes
│   ├── halo-4.json            # Halo 4 quotes
│   ├── halo-5.json            # Halo 5: Guardians quotes
│   ├── halo-infinite.json     # Halo Infinite quotes
│   ├── halo-wars.json         # Halo Wars quotes
│   ├── halo-wars-2.json       # Halo Wars 2 quotes
│   └── halo-multiplayer.json  # Halo Multiplayer quotes
├── img/                       # Image assets
│   ├── 256x256.png            # Favicon
│   ├── apple-touch-icon.png   # iOS home screen icon
│   ├── icon-192.png           # Web manifest icon
│   ├── bg-1920.webp           # Background, desktop
│   ├── bg-1280.webp           # Background, laptop
│   ├── bg-960.webp            # Background, mobile
│   ├── bg-1280.jpg            # Background fallback for browsers without WebP
│   └── Team-Respawn-Full.png  # Team Respawn logo
├── index.html                 # Main website HTML file
├── 404.html                   # Not found page
├── app.js                     # Website behaviour
├── styles.css                 # Website styles
├── og-image.jpg               # Social sharing card (1200x630)
├── site.webmanifest           # Web app manifest
├── package.json               # Root package.json
├── package-lock.json          # Root locked dependency versions
├── vitest.config.js           # Root Vitest test configuration
├── CNAME                      # Custom domain configuration
├── robots.txt                 # Robots.txt for web crawlers
├── sitemap.xml                # Sitemap for search engines
├── LICENSE                    # License file
└── README.md                  # This file
```

## Running Locally

### Website

The website must be served through a web server due to browser CORS restrictions. Opening `index.html` directly in a browser will not work.

**Using Python:**
```bash
# Python 3
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Tests

The website tests run against the real `index.html` and `app.js`, so they fail
if the shipped page breaks.

```bash
npm install
npm test          # website tests
npm run test:watch
```

The API worker has its own suite:

```bash
cd api-worker
npm install
npm test
```

Both run automatically on every push and pull request via
`.github/workflows/tests.yml`, along with a check that validates every file in
`quotes/`.

### API (Cloudflare Worker)

To run the API locally for development:

1. **Navigate to the API worker directory:**
   ```bash
   cd api-worker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Authenticate with Cloudflare (first time only):**
   ```bash
   npx wrangler login
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

   This will start a local server (usually at `http://localhost:8787`).

5. **Test the API:**
   - Visit `http://localhost:8787/` for API information
   - Visit `http://localhost:8787/quote` for a random quote
   - Visit `http://localhost:8787/quote?game=halo-2` for a quote from a specific game

## API Documentation

The Halo Quotes API is a Cloudflare Worker that provides programmatic access to random quotes from the Halo game series.

### Base URL

**Production:** `https://api.haloquotes.teamrespawntv.com`

**Local Development:** `http://localhost:8787` (when running `npm run dev`)

### Endpoints

#### Get API Information

```
GET /
```

Returns information about the API and available endpoints.

**Response:**
```json
{
  "name": "Halo Quotes API",
  "version": "1.0.0",
  "endpoints": {
    "/quote": "Get a random quote from all games",
    "/quote?game=<game-id>": "Get a random quote from a specific game"
  },
  "availableGames": [
    "halo-ce",
    "halo-2",
    "halo-3",
    "halo-odst",
    "halo-reach",
    "halo-4",
    "halo-5",
    "halo-infinite",
    "halo-wars",
    "halo-wars-2",
    "halo-multiplayer"
  ],
  "example": "/quote?game=halo-2"
}
```

#### Get Random Quote (All Games)

```
GET /quote
```

Returns a random quote from any Halo game.

**Response:**
```json
{
  "quote": "I need a weapon.",
  "game": "Halo 2",
  "gameId": "halo-2"
}
```

#### Get Random Quote (Specific Game)

```
GET /quote?game=<game-id>
```

Returns a random quote from a specific game.

**Available Game IDs:**
- `halo-ce` - Halo: Combat Evolved
- `halo-2` - Halo 2
- `halo-3` - Halo 3
- `halo-odst` - Halo 3: ODST
- `halo-reach` - Halo: Reach
- `halo-4` - Halo 4
- `halo-5` - Halo 5: Guardians
- `halo-infinite` - Halo Infinite
- `halo-wars` - Halo Wars
- `halo-wars-2` - Halo Wars 2
- `halo-multiplayer` - Halo Multiplayer

**Example Request:**
```
GET /quote?game=halo-3
```

**Response:**
```json
{
  "quote": "What is it? More Brutes?",
  "game": "Halo 3",
  "gameId": "halo-3"
}
```

### Error Responses

All errors return JSON with an `error` field:

```json
{
  "error": "Invalid game: invalid-game. Available games: halo-ce, halo-2, ..."
}
```

**Status Codes:**
- `400` - Bad Request (invalid game ID, etc.)
- `404` - Not Found (invalid endpoint)
- `405` - Method Not Allowed (non-GET requests)
- `500` - Internal Server Error

### CORS

The API supports CORS and can be accessed from any origin. All responses include appropriate CORS headers.

## Bots

Automated bots that post random Halo quotes to social media platforms on a scheduled basis.

The bots support:
- **Bluesky**: Posts random quotes to Bluesky every 3 hours via
  `.github/workflows/bsky-bot.yml`
- **Twitter/X**: `bots/twitter-bot.js` is implemented but has no workflow, so
  it does not currently run on a schedule. Run it manually with
  `npm start` from `bots/`, or add a workflow modelled on `bsky-bot.yml`.

## Contributing

Found a mistake or want to contribute? Please feel free to:
- Open a Pull Request
- Fill out this form with the wrong quote: https://forms.gle/QRq66zXDMhUBrDYB8 
- Report issues in our Discord server: https://discord.com/invite/teamrespawn

## Special Thanks To

- The Halo 3 loading screen project for the background: https://github.com/Xephorium/Halo3LoadingScreen?tab=readme-ov-file