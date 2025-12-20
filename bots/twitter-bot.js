import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
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
  const quotes = [];
  const files = readdirSync(quotesDir).filter(file => file.endsWith('.json'));
  
  for (const file of files) {
    try {
      const filePath = join(quotesDir, file);
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));
      
      if (data.gameName && Array.isArray(data.quotes)) {
        data.quotes.forEach(quote => {
          quotes.push({
            quote: quote,
            gameName: data.gameName
          });
        });
      }
    } catch (error) {
      console.error(`Error loading ${file}:`, error.message);
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
 * Format quote for X (Twitter)
 * X has a 280 character limit per post, but we'll format it nicely
 */
function formatPost(quote, gameName) {
  // X character limit is 280
  const maxLength = 280;
  
  // Format: "Quote" - Game Name
  let post = `"${quote}"\n\n- ${gameName}`;
  
  // If post is too long, truncate the quote and add ellipsis
  if (post.length > maxLength) {
    const gameNameLength = gameName.length + 4; // "- " + gameName + "\n\n"
    const availableLength = maxLength - gameNameLength - 4; // Account for quotes and ellipsis
    const truncatedQuote = quote.substring(0, availableLength - 3) + '..."';
    post = `"${truncatedQuote}\n\n- ${gameName}`;
  }
  
  return post;
}

/**
 * Post a random quote to X (Twitter)
 */
async function postQuote() {
  try {
    // Verify credentials are set
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET ||
        !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
      throw new Error('X (Twitter) API credentials are missing. Please set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_SECRET in your .env file.');
    }
    
    // Get a random quote
    const { quote, gameName } = getRandomQuote();
    console.log(`Selected quote from ${gameName}: ${quote.substring(0, 50)}...`);
    
    // Format the post
    const postText = formatPost(quote, gameName);
    console.log(`Post length: ${postText.length} characters`);
    console.log(`Post content:\n${postText}`);
    
    // Create Twitter API client
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
    
    // Post the quote
    const response = await client.v2.tweet(postText);
    
    console.log('Quote posted successfully!');
    if (response.data?.id) {
      const postUrl = `https://twitter.com/user/status/${response.data.id}`;
      console.log(`Post URL: ${postUrl}`);
    }
    
    return response;
  } catch (error) {
    console.error('Error posting quote:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.code === 401) {
        throw new Error('X (Twitter) API authentication failed. Please check your credentials.');
      } else if (error.code === 403) {
        throw new Error('X (Twitter) API access forbidden. Check your app permissions.');
      } else if (error.code === 429) {
        throw new Error('X (Twitter) API rate limit exceeded. Please wait before trying again.');
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