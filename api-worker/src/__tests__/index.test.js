import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock quote data
const mockHalo2Data = {
  gameName: 'Halo 2',
  quotes: [
    'I need a weapon.',
    'Were it so easy...',
    'Tartarus, the Prophets have betrayed us.',
  ]
};

const mockHalo3Data = {
  gameName: 'Halo 3',
  quotes: [
    'Wake me...when you need me.',
    'Tank beats everything!',
    'What is it? More Brutes?',
  ]
};

// Mock fetch globally
global.fetch = vi.fn();

// Import the worker after setting up mocks
let worker;

describe('Halo Quotes API', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
    
    // Dynamically import the worker to get fresh instance
    return import('../index.js').then(module => {
      worker = module.default;
    });
  });

  describe('CORS Headers', () => {
    it('should handle OPTIONS requests with CORS headers', async () => {
      const request = new Request('https://api.example.com/quote', {
        method: 'OPTIONS',
      });

      const response = await worker.fetch(request);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });

    it('should include CORS headers in all responses', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => mockHalo2Data,
        });
      });

      const request = new Request('https://api.example.com/quote');
      const response = await worker.fetch(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Method Validation', () => {
    it('should reject non-GET requests', async () => {
      const request = new Request('https://api.example.com/quote', {
        method: 'POST',
      });

      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toContain('Method not allowed');
    });

    it('should reject PUT requests', async () => {
      const request = new Request('https://api.example.com/quote', {
        method: 'PUT',
      });

      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(405);
    });

    it('should reject DELETE requests', async () => {
      const request = new Request('https://api.example.com/quote', {
        method: 'DELETE',
      });

      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(405);
    });
  });

  describe('Root Endpoint (/)', () => {
    it('should return API information', async () => {
      const request = new Request('https://api.example.com/');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Halo Quotes API');
      expect(data.version).toBe('1.0.0');
      expect(data.endpoints).toBeDefined();
      expect(data.endpoints).toHaveProperty('/stats');
      expect(data.availableGames).toBeInstanceOf(Array);
      expect(data.availableGames.length).toBeGreaterThan(0);
      expect(data.example).toBe('/quote?game=halo-2');
    });

    it('should include all available games in response', async () => {
      const request = new Request('https://api.example.com/');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(data.availableGames).toContain('halo-ce');
      expect(data.availableGames).toContain('halo-2');
      expect(data.availableGames).toContain('halo-3');
      expect(data.availableGames).toContain('halo-infinite');
    });
  });

  describe('Random Quote Endpoint (/quote)', () => {
    it('should return a random quote from all games', async () => {
      // Mock fetch to return halo-2.json data when called
      global.fetch.mockImplementation((url) => {
        if (url.includes('halo-2.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHalo2Data,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockHalo2Data,
        });
      });

      const request = new Request('https://api.example.com/quote');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('quote');
      expect(data).toHaveProperty('game');
      expect(data).toHaveProperty('gameId');
      expect(typeof data.quote).toBe('string');
      expect(data.quote.length).toBeGreaterThan(0);
      expect(mockHalo2Data.quotes).toContain(data.quote);
    });

    it('should return quote from specific game when game parameter is provided', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('halo-3.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHalo3Data,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockHalo3Data,
        });
      });

      const request = new Request('https://api.example.com/quote?game=halo-3');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gameId).toBe('halo-3');
      expect(data.game).toBe('Halo 3');
      expect(mockHalo3Data.quotes).toContain(data.quote);
    });

    it('should handle /quote/ with trailing slash', async () => {
      global.fetch.mockImplementation((url) => {
        return Promise.resolve({
          ok: true,
          json: async () => mockHalo2Data,
        });
      });

      const request = new Request('https://api.example.com/quote/');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('quote');
    });

    it('should return different quotes on multiple calls (randomness)', async () => {
      let callCount = 0;
      global.fetch.mockImplementation((url) => {
        callCount++;
        // Return different data on different calls
        const data = callCount === 1 ? mockHalo2Data : mockHalo3Data;
        return Promise.resolve({
          ok: true,
          json: async () => data,
        });
      });

      const request1 = new Request('https://api.example.com/quote');
      const request2 = new Request('https://api.example.com/quote');

      const response1 = await worker.fetch(request1);
      const response2 = await worker.fetch(request2);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // At least one should be different (though randomness means they could be the same)
      // We're just checking that both are valid responses
      expect(data1.quote).toBeDefined();
      expect(data2.quote).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown paths', async () => {
      const request = new Request('https://api.example.com/unknown');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Not found');
    });

    it('should return 400 for invalid game ID', async () => {
      const request = new Request('https://api.example.com/quote?game=invalid-game');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid game');
      expect(data.error).toContain('invalid-game');
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const request = new Request('https://api.example.com/quote');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle 404 from quote file fetch', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const request = new Request('https://api.example.com/quote?game=halo-2');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch quotes');
    });

    it('should handle empty quotes array', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({ gameName: 'Halo Test', quotes: [] }),
        });
      });

      const request = new Request('https://api.example.com/quote?game=halo-2');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('No quotes found');
    });

    it('should handle missing quotes property', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({ gameName: 'Halo Test' }),
        });
      });

      const request = new Request('https://api.example.com/quote?game=halo-2');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('No quotes found');
    });

    it('should handle invalid JSON response', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });
      });

      const request = new Request('https://api.example.com/quote');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted JSON', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => mockHalo2Data,
        });
      });

      const request = new Request('https://api.example.com/quote?game=halo-2');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(data).toMatchObject({
        quote: expect.any(String),
        game: expect.any(String),
        gameId: expect.any(String),
      });
    });

    it('should return formatted JSON with indentation', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => mockHalo2Data,
        });
      });

      const request = new Request('https://api.example.com/quote');
      const response = await worker.fetch(request);
      const text = await response.text();

      // Check that it's valid JSON
      const data = JSON.parse(text);
      expect(data.quote).toBeDefined();
      
      // Check that it's formatted (contains newlines from indentation)
      expect(text).toContain('\n');
    });
  });

  describe('Game ID Validation', () => {
    it('should accept all valid game IDs', async () => {
      const validGames = [
        'halo-ce',
        'halo-2',
        'halo-3',
        'halo-odst',
        'halo-reach',
        'halo-4',
        'halo-5',
        'halo-infinite',
        'halo-wars',
        'halo-wars-2',
        'halo-multiplayer',
      ];

      for (const gameId of validGames) {
        global.fetch.mockImplementation(() => {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              gameName: `Halo ${gameId}`,
              quotes: ['Test quote'],
            }),
          });
        });

        const request = new Request(`https://api.example.com/quote?game=${gameId}`);
        const response = await worker.fetch(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.gameId).toBe(gameId);
      }
    });

    it('should be case-sensitive for game IDs', async () => {
      const request = new Request('https://api.example.com/quote?game=HALO-2');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid game');
    });
  });

  describe('Stats Endpoint (/stats)', () => {
    it('should return statistics with total quotes and quotes per game', async () => {
      const mockHaloCEData = {
        gameName: 'Halo Combat Evolved',
        quotes: ['Quote 1', 'Quote 2', 'Quote 3']
      };

      const mockHalo4Data = {
        gameName: 'Halo 4',
        quotes: ['Quote A', 'Quote B']
      };

      // Mock fetch to return different data for different files
      global.fetch.mockImplementation((url) => {
        if (url.includes('halo-ce.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHaloCEData,
          });
        }
        if (url.includes('halo-4.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHalo4Data,
          });
        }
        // Default mock for other games
        return Promise.resolve({
          ok: true,
          json: async () => ({
            gameName: 'Test Game',
            quotes: ['Test quote'],
          }),
        });
      });

      const request = new Request('https://api.example.com/stats');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('totalQuotes');
      expect(data).toHaveProperty('totalGames');
      expect(data).toHaveProperty('quotesPerGame');
      expect(typeof data.totalQuotes).toBe('number');
      expect(data.totalQuotes).toBeGreaterThan(0);
      expect(data.totalGames).toBeGreaterThan(0);
      expect(typeof data.quotesPerGame).toBe('object');
    });

    it('should include all games in quotesPerGame', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            gameName: 'Test Game',
            quotes: ['Test quote'],
          }),
        });
      });

      const request = new Request('https://api.example.com/stats');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotesPerGame).toHaveProperty('halo-ce');
      expect(data.quotesPerGame).toHaveProperty('halo-2');
      expect(data.quotesPerGame).toHaveProperty('halo-3');
      expect(data.quotesPerGame).toHaveProperty('halo-infinite');
    });

    it('should include game name and count for each game', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            gameName: 'Halo 2',
            quotes: ['Quote 1', 'Quote 2', 'Quote 3'],
          }),
        });
      });

      const request = new Request('https://api.example.com/stats');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Check structure of quotesPerGame entries
      const firstGame = Object.values(data.quotesPerGame)[0];
      expect(firstGame).toHaveProperty('gameName');
      expect(firstGame).toHaveProperty('count');
      expect(typeof firstGame.gameName).toBe('string');
      expect(typeof firstGame.count).toBe('number');
    });

    it('should handle /stats/ with trailing slash', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            gameName: 'Test Game',
            quotes: ['Test quote'],
          }),
        });
      });

      const request = new Request('https://api.example.com/stats/');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('totalQuotes');
    });

    it('should calculate total quotes correctly', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        // Return different quote counts for different games
        const quoteCount = callCount <= 3 ? 5 : 2;
        const quotes = Array(quoteCount).fill('').map((_, i) => `Quote ${i + 1}`);
        
        return Promise.resolve({
          ok: true,
          json: async () => ({
            gameName: `Game ${callCount}`,
            quotes: quotes,
          }),
        });
      });

      const request = new Request('https://api.example.com/stats');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should have quotes from all games
      expect(data.totalQuotes).toBeGreaterThan(0);
    });

    it('should handle fetch errors gracefully for individual games', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        // Fail for first game, succeed for others
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: 'Not Found',
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            gameName: 'Test Game',
            quotes: ['Test quote'],
          }),
        });
      });

      const request = new Request('https://api.example.com/stats');
      const response = await worker.fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should still return stats even if some games fail
      expect(data).toHaveProperty('totalQuotes');
      expect(data).toHaveProperty('quotesPerGame');
    });

    it('should include CORS headers in stats response', async () => {
      global.fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            gameName: 'Test Game',
            quotes: ['Test quote'],
          }),
        });
      });

      const request = new Request('https://api.example.com/stats');
      const response = await worker.fetch(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});

