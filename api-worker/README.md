# Halo Quotes API

A Cloudflare Worker API for serving random quotes from the Halo game series.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Authenticate with Cloudflare:
```bash
npx wrangler login
```

## Development

Test locally:
```bash
npm run dev
```

This will start a local server (usually at `http://localhost:8787`).

## Testing

Run unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

The test suite includes:
- CORS header validation
- HTTP method validation
- Endpoint functionality (root, quote, quote with game parameter)
- Error handling (invalid games, network errors, malformed data)
- Response format validation
- Game ID validation

## Deployment

Deploy to Cloudflare:
```bash
npm run deploy
```

## API Endpoints

### Get Random Quote (All Games)
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

### Get Random Quote (Specific Game)
```
GET /quote?game=<game-id>
```
Returns a random quote from a specific game.

**Available game IDs:**
- `halo-ce` - Halo Combat Evolved
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

**Example:**
```
GET /quote?game=halo-2
```

**Response:**
```json
{
  "quote": "I need a weapon.",
  "game": "Halo 2",
  "gameId": "halo-2"
}
```

### API Info
```
GET /
```
Returns information about the API and available endpoints.

## Custom Domain Setup

After deploying, you can set up a custom domain:

1. Go to Cloudflare Dashboard → Workers & Pages → Your Worker
2. Go to Settings → Triggers
3. Add a custom domain or route
4. Update DNS:
   - Type: CNAME
   - Name: `api`
   - Target: Your worker's workers.dev URL

Then your API will be accessible at `api.haloquotes.teamrespawntv.com`

## Error Responses

All errors return JSON with an `error` field:
```json
{
  "error": "Invalid game: invalid-game. Available games: halo-ce, halo-2, ..."
}
```

Status codes:
- `400` - Bad Request (invalid game ID, etc.)
- `404` - Not Found (invalid endpoint)
- `405` - Method Not Allowed (non-GET requests)
- `500` - Internal Server Error


