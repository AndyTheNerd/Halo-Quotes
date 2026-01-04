/**
 * Halo Quotes API - Cloudflare Worker
 * Handles GET requests for random quotes from Halo games
 */

// Base URL for fetching quote JSON files from GitHub Pages
const BASE_URL = 'https://haloquotes.teamrespawntv.com/quotes';

// An array to define the chronological order of games
const GAME_FILES_ORDERED = [
  ['halo-ce', 'halo-ce.json'],
  ['halo-2', 'halo-2.json'],
  ['halo-3', 'halo-3.json'],
  ['halo-wars', 'halo-wars.json'],
  ['halo-odst', 'halo-odst.json'],
  ['halo-reach', 'halo-reach.json'],
  ['halo-4', 'halo-4.json'],
  ['halo-5', 'halo-5.json'],
  ['halo-wars-2', 'halo-wars-2.json'],
  ['halo-infinite', 'halo-infinite.json'],
  ['halo-multiplayer', 'halo-multiplayer.json']
];

// Map of game identifiers to their JSON file names for quick lookups
const GAME_FILES = Object.fromEntries(GAME_FILES_ORDERED);

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
 * Get statistics about all quotes
 */
async function getStats() {
  const stats = {
    totalQuotes: 0,
    totalGames: Object.keys(GAME_FILES).length,
    quotesPerGame: {}
  };
  
  // Fetch all game files in parallel, maintaining order
  const fetchPromises = GAME_FILES_ORDERED.map(async ([gameId, filename]) => {
    try {
      const data = await fetchQuoteFile(filename);
      const quoteCount = data.quotes && Array.isArray(data.quotes) ? data.quotes.length : 0;
      
      return { gameId, gameName: data.gameName || gameId, count: quoteCount };
    } catch (error) {
      // If a file fails to fetch, record it with 0 quotes
      return { gameId, gameName: gameId, count: 0, error: error.message };
    }
  });

  const results = await Promise.all(fetchPromises);

  // Populate stats from the ordered results
  results.forEach(result => {
    stats.quotesPerGame[result.gameId] = {
      gameName: result.gameName,
      count: result.count
    };
    if (result.error) {
      stats.quotesPerGame[result.gameId].error = result.error;
    }
    stats.totalQuotes += result.count;
  });
  
  // Ensure quotesPerGame is returned in the correct chronological order
  // by rebuilding the object using GAME_FILES_ORDERED
  const orderedQuotesPerGame = {};
  GAME_FILES_ORDERED.forEach(([gameId]) => {
    if (stats.quotesPerGame[gameId]) {
      orderedQuotesPerGame[gameId] = stats.quotesPerGame[gameId];
    }
  });
  
  return {
    totalQuotes: stats.totalQuotes,
    totalGames: stats.totalGames,
    quotesPerGame: orderedQuotesPerGame
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
      
      // Handle /stats endpoint
      if (path === '/stats' || path === '/stats/') {
        const stats = await getStats();
        
        return new Response(
          JSON.stringify(stats, null, 2),
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
              '/stats': 'Get statistics about total quotes and quotes per game',
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
      return createErrorResponse('Not found. Available endpoints: /quote, /stats', 404);
      
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


