import Atproto from '@atproto/api';
const { BskyAgent } = Atproto as any;
import * as dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory (project root)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Path to quotes directory (relative to this file)
const quotesDir = join(__dirname, '..', 'quotes');

/**
 * Load all quote files and return a combined array of all quotes with their game names
 */
function loadAllQuotes() {
  const quotes: Array<{ quote: string; gameName: string }> = [];
  const files = readdirSync(quotesDir).filter(file => file.endsWith('.json'));
  
  for (const file of files) {
    try {
      const filePath = join(quotesDir, file);
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      
      if (data.gameName && Array.isArray(data.quotes)) {
        data.quotes.forEach((quote: string) => {
          quotes.push({
            quote: quote,
            gameName: data.gameName
          });
        });
      }
    } catch (error) {
      console.error(`Error loading ${file}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  return quotes;
}

/**
 * Select a random quote from the loaded quotes
 */
function getRandomQuote() {
  const allQuotes = loadAllQuotes();
  if (allQuotes.length === 0) {
    throw new Error('No quotes found');
  }
  
  const randomIndex = Math.floor(Math.random() * allQuotes.length);
  return allQuotes[randomIndex];
}

/**
 * Format quote for Bluesky
 * Bluesky has a 300 character limit per post, but we'll format it nicely
 */
function formatPost(quote: string, gameName: string): string {
  // Format: "Quote" - Game Name
  return `"${quote}"\n\n- ${gameName}`;
}

/**
 * Post a random quote to Bluesky
 */
async function postQuote() {
  try {
    // Verify credentials are set
    if (!process.env.BLUESKY_USERNAME || !process.env.BLUESKY_PASSWORD) {
      throw new Error('Bluesky credentials are missing. Please set BLUESKY_USERNAME and BLUESKY_PASSWORD in your .env file.');
    }
    
    // Get a random quote
    const { quote, gameName } = getRandomQuote();
    console.log(`Selected quote from ${gameName}: ${quote.substring(0, 50)}...`);
    
    // Format the post
    const postText = formatPost(quote, gameName);
    console.log(`Post length: ${postText.length} characters`);
    console.log(`Post content:\n${postText}`);
    
    // Create a Bluesky Agent
    const agent = new BskyAgent({
      service: 'https://bsky.social',
    });
    
    // Login
    await agent.login({ 
      identifier: process.env.BLUESKY_USERNAME, 
      password: process.env.BLUESKY_PASSWORD 
    });
    
    // Post the quote
    const response = await agent.post({
      text: postText
    });
    
    console.log('Quote posted successfully!');
    if (response.uri) {
      const postUrl = `https://bsky.app/profile/${process.env.BLUESKY_USERNAME}/post/${response.uri.split('/').pop()}`;
      console.log(`Post URL: ${postUrl}`);
    }
    
    return response;
  } catch (error) {
    console.error('Error posting quote:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid identifier or password')) {
        throw new Error('Bluesky authentication failed. Please check your credentials.');
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

// Run the bot
postQuote()
  .then(() => {
    console.log('Bot execution completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Bot execution failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });