import { TwitterApi } from 'twitter-api-v2';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Twitter API credentials from environment variables
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

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
 * Format quote for Twitter, ensuring it fits within 280 characters
 */
function formatTweet(quote, gameName) {
  // Twitter character limit is 280
  const maxLength = 280;
  
  // Format: "Quote" - Game Name
  let tweet = `"${quote}"\n\n- ${gameName}`;
  
  // If tweet is too long, truncate the quote and add ellipsis
  if (tweet.length > maxLength) {
    const gameNameLength = gameName.length + 4; // "- " + gameName + "\n\n"
    const availableLength = maxLength - gameNameLength - 4; // Account for quotes and ellipsis
    const truncatedQuote = quote.substring(0, availableLength - 3) + '..."';
    tweet = `"${truncatedQuote}\n\n- ${gameName}`;
  }
  
  return tweet;
}

/**
 * Post a tweet to Twitter
 */
async function postTweet() {
  try {
    // Verify credentials are set
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET ||
        !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_SECRET) {
      throw new Error('Twitter API credentials are missing. Please set all required environment variables.');
    }
    
    // Get a random quote
    const { quote, gameName } = getRandomQuote();
    console.log(`Selected quote from ${gameName}: ${quote.substring(0, 50)}...`);
    
    // Format the tweet
    const tweetText = formatTweet(quote, gameName);
    console.log(`Tweet length: ${tweetText.length} characters`);
    console.log(`Tweet content:\n${tweetText}`);
    
    // Post the tweet
    const tweet = await client.v2.tweet(tweetText);
    console.log('Tweet posted successfully!');
    console.log(`Tweet ID: ${tweet.data.id}`);
    console.log(`Tweet URL: https://twitter.com/user/status/${tweet.data.id}`);
    
    return tweet;
  } catch (error) {
    console.error('Error posting tweet:', error);
    
    // Provide helpful error messages
    if (error.code === 401) {
      throw new Error('Twitter API authentication failed. Please check your credentials.');
    } else if (error.code === 403) {
      throw new Error('Twitter API access forbidden. Check your app permissions.');
    } else if (error.code === 429) {
      throw new Error('Twitter API rate limit exceeded. Please wait before trying again.');
    } else {
      throw error;
    }
  }
}

// Run the bot
postTweet()
  .then(() => {
    console.log('Bot execution completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Bot execution failed:', error.message);
    process.exit(1);
  });