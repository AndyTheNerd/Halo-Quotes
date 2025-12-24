# Halo Quotes

A comprehensive project featuring a website, API, and bots for displaying and sharing random quotes from the Halo video game series.

## Main Functions

This repository provides three main functions:

1. **Website**: A modern, static web application that displays random quotes from all Halo games
2. **Bots**: Automated bots that post quotes on a scheduled run to both Bluesky and Twitter (Coming soon)
3. **API**: A RESTful API that allows you to query quotes for your own projects

## Repository Structure

```
Halo-Quotes/
├── api-worker/                # Cloudflare Worker API
│   ├── src/
│   │   └── index.js          # API worker implementation
│   ├── package.json          # API dependencies
│   ├── wrangler.toml         # Cloudflare Worker configuration
│   └── README.md             # API-specific documentation
├── bots/                      # Social media bots (Coming soon)
│   ├── bsky-bot.ts           # Bluesky bot implementation
│   ├── twitter-bot.js        # Twitter bot implementation
│   ├── package.json          # Bot dependencies
│   └── package-lock.json     # Locked dependency versions
├── quotes/                    # Quote data files
│   ├── halo-ce.json          # Halo: Combat Evolved quotes
│   ├── halo-2.json           # Halo 2 quotes
│   ├── halo-3.json           # Halo 3 quotes
│   ├── halo-odst.json        # Halo 3: ODST quotes
│   ├── halo-reach.json       # Halo: Reach quotes
│   ├── halo-4.json           # Halo 4 quotes
│   ├── halo-5.json           # Halo 5: Guardians quotes
│   ├── halo-infinite.json    # Halo Infinite quotes
│   ├── halo-wars.json        # Halo Wars quotes
│   ├── halo-wars-2.json      # Halo Wars 2 quotes
│   └── halo-multiplayer.json # Halo Multiplayer quotes
├── img/                       # Image assets
│   ├── 256x256.png           # Favicon/icon image
│   └── Team-Respawn-Full.png # Team Respawn logo
├── index.html                 # Main website HTML file
├── CNAME                      # Custom domain configuration
├── robots.txt                 # Robots.txt for web crawlers
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

**Using Node.js (npx serve):**
```bash
npx serve
```

**Using Node.js (http-server):**
```bash
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

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
- **Bluesky**: Posts random quotes to Bluesky
- **Twitter/X**: Posts random quotes to Twitter/X (**coming soon**)

## Adding or Modifying Quotes

To add or modify quotes:

1. Navigate to the `quotes/` directory
2. Open the appropriate JSON file for the game you want to modify
3. Edit the `quotes` array following this format:

```json
{
  "gameName": "Halo Combat Evolved",
  "quotes": [
    "Quote 1",
    "Quote 2",
    "Quote 3"
  ]
}
```

4. Save the file and refresh your browser (for website) or redeploy the API (for API changes)

## Contributing

Found a mistake or want to contribute? Please feel free to:
- Open a Pull Request
- Fill out this form with the wrong quote: https://forms.gle/QRq66zXDMhUBrDYB8 
- Report issues in our Discord server: https://discord.com/invite/teamrespawn

## Special Thanks To

- The Halo 3 loading screen project for the background: https://github.com/Xephorium/Halo3LoadingScreen?tab=readme-ov-file