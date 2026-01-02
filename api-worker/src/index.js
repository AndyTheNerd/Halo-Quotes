/**
 * Halo Quotes API - Cloudflare Worker
 * Handles GET requests for random quotes from Halo games
 */

// Base URL for fetching quote JSON files from GitHub Pages
const BASE_URL = 'https://haloquotes.teamrespawntv.com/quotes';

// Map of game identifiers to their JSON file names
const GAME_FILES = {
  'halo-ce': 'halo-ce.json',
  'halo-2': 'halo-2.json',
  'halo-3': 'halo-3.json',
  'halo-odst': 'halo-odst.json',
  'halo-reach': 'halo-reach.json',
  'halo-4': 'halo-4.json',
  'halo-5': 'halo-5.json',
  'halo-infinite': 'halo-infinite.json',
  'halo-wars': 'halo-wars.json',
  'halo-wars-2': 'halo-wars-2.json',
  'halo-multiplayer': 'halo-multiplayer.json'
};

// All available game files for random selection
const ALL_GAME_FILES = Object.values(GAME_FILES);

/**
 * Get a random element from an array
 */
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Fetch and parse a quote file
 */
async function fetchQuoteFile(filename) {
  const url = `${BASE_URL}/${filename}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch quotes: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get a random quote from a specific game
 */
async function getRandomQuoteFromGame(gameId) {
  const filename = GAME_FILES[gameId];
  
  if (!filename) {
    throw new Error(`Invalid game: ${gameId}. Available games: ${Object.keys(GAME_FILES).join(', ')}`);
  }
  
  const data = await fetchQuoteFile(filename);
  
  if (!data.quotes || !Array.isArray(data.quotes) || data.quotes.length === 0) {
    throw new Error(`No quotes found in ${gameId}`);
  }
  
  const randomQuote = getRandomElement(data.quotes);
  
  return {
    quote: randomQuote,
    game: data.gameName,
    gameId: gameId
  };
}

/**
 * Get a random quote from all games
 */
async function getRandomQuoteFromAllGames() {
  // Pick a random game file
  const randomFile = getRandomElement(ALL_GAME_FILES);
  const data = await fetchQuoteFile(randomFile);
  
  if (!data.quotes || !Array.isArray(data.quotes) || data.quotes.length === 0) {
    throw new Error(`No quotes found in ${randomFile}`);
  }
  
  const randomQuote = getRandomElement(data.quotes);
  
  // Extract game ID from filename (remove .json extension)
  const gameId = randomFile.replace('.json', '');
  
  return {
    quote: randomQuote,
    game: data.gameName,
    gameId: gameId
  };
}

/**
 * Create CORS headers
 */
function createCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

/**
 * Handle OPTIONS request for CORS preflight
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: createCORSHeaders()
  });
}

/**
 * Create error response
 */
function createErrorResponse(message, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: status,
      headers: createCORSHeaders()
    }
  );
}

/**
 * Main request handler
 */
export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    // Only allow GET requests
    if (request.method !== 'GET') {
      return createErrorResponse('Method not allowed. Only GET requests are supported.', 405);
    }
    
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Handle /quote endpoint
      if (path === '/quote' || path === '/quote/') {
        const gameParam = url.searchParams.get('game');
        
        let result;
        if (gameParam) {
          // Get random quote from specific game
          result = await getRandomQuoteFromGame(gameParam);
        } else {
          // Get random quote from all games
          result = await getRandomQuoteFromAllGames();
        }
        
        return new Response(
          JSON.stringify(result, null, 2),
          {
            status: 200,
            headers: createCORSHeaders()
          }
        );
      }
      
      // Handle root path - return API info
      if (path === '/' || path === '') {
        return new Response(
          JSON.stringify({
            name: 'Halo Quotes API',
            version: '1.0.0',
            endpoints: {
              '/quote': 'Get a random quote from all games',
              '/quote?game=<game-id>': 'Get a random quote from a specific game',
            },
            availableGames: Object.keys(GAME_FILES),
            example: '/quote?game=halo-2'
          }, null, 2),
          {
            status: 200,
            headers: createCORSHeaders()
          }
        );
      }
      
      // 404 for unknown paths
      return createErrorResponse('Not found. Use /quote endpoint.', 404);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Check if it's a validation error (invalid game ID)
      if (error.message && error.message.includes('Invalid game:')) {
        return createErrorResponse(error.message, 400);
      }
      
      // Check if it's a "no quotes found" error (could be 400 or 500 depending on context)
      if (error.message && error.message.includes('No quotes found')) {
        return createErrorResponse(error.message, 500);
      }
      
      // Default to 500 for other errors
      return createErrorResponse(error.message || 'Internal server error', 500);
    }
  }
};


