# Halo Quotes

A modern, static web application that displays random quotes from the Halo video game series. Built with vanilla HTML, CSS, and JavaScript, featuring a beautiful UI with dynamic quote loading.

## Features

- **Random Quote Display**: Displays a random quote from across all Halo games
- **Dynamic Loading**: Quotes are loaded from separate JSON files for easy maintenance
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Beautiful interface with Halo-themed background and smooth animations
- **Fixed Layout**: Consistent box sizing and button positioning regardless of quote length
- **Error Handling**: User-friendly error messages with helpful troubleshooting tips
- **Security Hardened**: Content Security Policy and secure external link handling

## Repository Structure

```
Halo-Quotes/
├── index.html              # Main HTML file with embedded CSS and JavaScript
├── LICENSE                 # License file
├── README.md              # This file
└── quotes/                # Directory containing quote data files
    ├── halo-ce.json       # Halo: Combat Evolved quotes
    ├── halo-2.json        # Halo 2 quotes
    ├── halo-3.json        # Halo 3 quotes
    ├── halo-odst.json     # Halo 3: ODST quotes
    ├── halo-reach.json    # Halo: Reach quotes
    ├── halo-4.json        # Halo 4 quotes
    ├── halo-5.json        # Halo 5 quotes
    ├── halo-infinite.json # Halo Infinite quotes
    ├── halo-wars.json     # Halo Wars quotes
    ├── halo-wars-2.json   # Halo Wars 2 quotes
    └── halo-multiplayer.json # Halo Multiplayer quotes
```

## How It Works

The application uses a modular architecture:

1. **Quote Storage**: Each game's quotes are stored in separate JSON files within the `quotes/` directory
2. **Random Selection**: On page load or button click, the app:
   - Randomly selects a quote file from the available games
   - Fetches the JSON file using the Fetch API
   - Randomly selects a quote from that game's collection
   - Displays the quote with its game name

## Running Locally

**Important**: This application must be served through a web server due to browser CORS (Cross-Origin Resource Sharing) restrictions. Opening `index.html` directly in a browser will not work.

### Run Locally:


```bash
# Python 3
python -m http.server 8000
````


Then open `http://localhost:8000` in your browser.

## Security Improvements

This repository implements several security best practices:

### Content Security Policy (CSP)
- Added CSP meta tag to restrict resource loading
- Prevents XSS attacks by controlling which resources can be loaded
- Allows only trusted domains for scripts, styles, fonts, images, and frames

### CSP Inline Scripts and Styles
- The current CSP includes `'unsafe-inline'` for scripts and styles to allow inline code
- This is a known security trade-off that enables easier maintenance but reduces XSS protection
- For production hardening, consider moving inline code to external files and removing `unsafe-inline`

### Secure External Links
- All external links include `rel="noopener noreferrer"` attributes
- Prevents potential security vulnerabilities from opened windows
- Protects user privacy by not sending referrer information

### JSON Data Separation
- Quotes stored in separate JSON files instead of inline JavaScript arrays
- Prevents code injection vulnerabilities
- Easier to validate and sanitize data

### Error Handling
- Comprehensive error handling for network requests
- User-friendly error messages
- Console logging for debugging without exposing sensitive information

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

4. Save the file and refresh your browser


## Bots

This repository includes automated bots that post random Halo quotes to social media platforms.

### Bluesky Bot

A TypeScript bot that posts random Halo quotes to Bluesky.

#### Features

- Randomly selects quotes from all Halo games in the `quotes/` directory
- Formats posts as: `"Quote text"\n\n- Game Name`
- Automatically authenticates and posts to Bluesky
- Provides post URL after successful posting

#### Running Locally:

1. **Install dependencies:**
   ```bash
   cd bots
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the project root with your Bluesky credentials:
   ```env
   BLUESKY_USERNAME=your_username
   BLUESKY_PASSWORD=your_password
   ```

3. **Run the bot:**
   ```bash
   cd bots
   npm run bsky
   ```

#### Dependencies

- **`@atproto/api`**: Bluesky/AT Protocol API client for authentication and posting
- **`dotenv`**: Loads environment variables from `.env` file
- **`tsx`**: TypeScript execution environment (dev dependency)
- **`@types/node`**: TypeScript type definitions for Node.js (dev dependency)

### Twitter Bot

Coming soon - A bot to post quotes to X (Twitter).

## Found a Mistake?

Please feel free to open a Pull Request or report it in our Discord server: https://discord.com/invite/teamrespawn

## Special Thanks To

- The Halo 3 loading screen project for the background: https://github.com/Xephorium/Halo3LoadingScreen?tab=readme-ov-file