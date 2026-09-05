/**
 * Halo Quotes - website front-end
 *
 * Every quote file is loaded once at startup and flattened into a single pool,
 * so each quote is equally likely to appear. Picking a random file first and a
 * random quote second would over-represent the smaller games by a wide margin.
 */

// Quote files in chronological order, matching the API's game list.
const GAMES = [
    { id: 'halo-ce', file: 'quotes/halo-ce.json' },
    { id: 'halo-2', file: 'quotes/halo-2.json' },
    { id: 'halo-3', file: 'quotes/halo-3.json' },
    { id: 'halo-wars', file: 'quotes/halo-wars.json' },
    { id: 'halo-odst', file: 'quotes/halo-odst.json' },
    { id: 'halo-reach', file: 'quotes/halo-reach.json' },
    { id: 'halo-4', file: 'quotes/halo-4.json' },
    { id: 'halo-5', file: 'quotes/halo-5.json' },
    { id: 'halo-wars-2', file: 'quotes/halo-wars-2.json' },
    { id: 'halo-infinite', file: 'quotes/halo-infinite.json' },
    { id: 'halo-multiplayer', file: 'quotes/halo-multiplayer.json' }
];

const quoteTextElement = document.getElementById('quote-text');
const quoteSourceElement = document.getElementById('quote-source');
const nextQuoteBtn = document.getElementById('next-quote-btn');
const previousQuoteBtn = document.getElementById('previous-quote-btn');
const copyBtn = document.getElementById('copy-btn');
const copyIcon = document.getElementById('copy-icon');
const checkIcon = document.getElementById('check-icon');
const copyText = document.getElementById('copy-text');
const copyStatus = document.getElementById('copy-status');

// Every quote from every game, flattened. Populated once by loadQuotes().
let quotePool = [];

// Quotes the user has already seen, so Previous can walk back through them.
let quoteHistory = [];
let currentQuoteIndex = -1;
let copyResetTimer = null;

/**
 * Fetch and validate a single quote file. Returns its quotes as pool entries.
 */
async function loadGame(game) {
    const response = await fetch(game.file);

    if (!response.ok) {
        throw new Error(`${game.file}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.gameName || !Array.isArray(data.quotes) || data.quotes.length === 0) {
        throw new Error(`${game.file}: invalid quote file format`);
    }

    return data.quotes.map((text, index) => ({
        text,
        game: data.gameName,
        gameId: game.id,
        index
    }));
}

/**
 * Load every quote file in parallel and build the pool. A game that fails to
 * load is skipped rather than taking the whole site down with it.
 */
async function loadQuotes() {
    const results = await Promise.allSettled(GAMES.map(loadGame));
    const pool = [];

    results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            pool.push(...result.value);
        } else {
            console.error(`Could not load ${GAMES[i].file}:`, result.reason);
        }
    });

    if (pool.length === 0) {
        throw new Error('No quotes could be loaded.');
    }

    return pool;
}

/**
 * Pick a uniformly random quote, avoiding an immediate repeat of the one on
 * screen. With a pool this size a back-to-back repeat is rare but jarring.
 */
function pickRandomQuote() {
    if (quotePool.length === 1) {
        return quotePool[0];
    }

    const current = quoteHistory[currentQuoteIndex];
    let pick;

    do {
        pick = quotePool[Math.floor(Math.random() * quotePool.length)];
    } while (current && pick.text === current.text && pick.gameId === current.gameId);

    return pick;
}

/**
 * Enable or disable the controls to match the current state. Called from every
 * path — including the error path, so a failed load can never strand the user
 * with a permanently disabled Previous button.
 */
function updateControls({ loading = false } = {}) {
    const hasQuote = currentQuoteIndex >= 0 && Boolean(quoteHistory[currentQuoteIndex]);

    previousQuoteBtn.disabled = loading || currentQuoteIndex <= 0;
    nextQuoteBtn.disabled = loading || quotePool.length === 0;
    copyBtn.disabled = loading || !hasQuote;
}

function showLoading() {
    quoteTextElement.textContent = 'Loading...';
    quoteSourceElement.textContent = '';
    updateControls({ loading: true });
}

function showError(message) {
    quoteTextElement.textContent = message;
    quoteSourceElement.textContent = '';
    updateControls();
}

/**
 * Render the quote at the current history position.
 */
function showQuote() {
    const quote = quoteHistory[currentQuoteIndex];

    if (!quote) {
        return;
    }

    quoteTextElement.textContent = `"${quote.text}"`;
    quoteSourceElement.textContent = `- ${quote.game}`;
    updateControls();
}

/**
 * Advance to the next quote: forward through history if the user has stepped
 * back, otherwise draw a new one from the pool.
 */
function showNextQuote() {
    if (quotePool.length === 0) {
        return;
    }

    if (currentQuoteIndex < quoteHistory.length - 1) {
        currentQuoteIndex++;
    } else {
        quoteHistory.push(pickRandomQuote());
        currentQuoteIndex = quoteHistory.length - 1;
    }

    showQuote();
}

function showPreviousQuote() {
    if (currentQuoteIndex > 0) {
        currentQuoteIndex--;
        showQuote();
    }
}

/**
 * Put the copy button into its "copied" state and schedule a reset.
 */
function flashCopySuccess() {
    copyIcon.classList.add('hidden');
    checkIcon.classList.remove('hidden');
    copyText.textContent = 'Copied!';
    copyBtn.classList.add('is-copied');
    copyStatus.textContent = 'Quote copied to clipboard.';

    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
        copyIcon.classList.remove('hidden');
        checkIcon.classList.add('hidden');
        copyText.textContent = 'Copy';
        copyBtn.classList.remove('is-copied');
        copyStatus.textContent = '';
    }, 2000);
}

/**
 * Copy the current quote, falling back to execCommand where the async
 * Clipboard API is unavailable (older browsers, or a non-secure context).
 */
async function copyQuoteToClipboard() {
    const quote = quoteHistory[currentQuoteIndex];

    if (!quote) {
        return;
    }

    const textToCopy = `"${quote.text}"\n\n- ${quote.game}`;

    try {
        await navigator.clipboard.writeText(textToCopy);
        flashCopySuccess();
        return;
    } catch (error) {
        console.error('Failed to copy:', error);
    }

    try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        flashCopySuccess();
    } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        copyText.textContent = 'Failed';
        copyStatus.textContent = 'Could not copy the quote.';
        clearTimeout(copyResetTimer);
        copyResetTimer = setTimeout(() => {
            copyText.textContent = 'Copy';
        }, 2000);
    }
}

// Hamburger menu
const hamburgerBtn = document.getElementById('hamburger-btn');
const menuPanel = document.getElementById('menu-panel');

function isMenuOpen() {
    return menuPanel.classList.contains('menu-open');
}

/**
 * The closed panel is only translated off screen, so without `inert` its links
 * stay in the tab order and keyboard users land in an invisible menu.
 */
function setMenuOpen(open, { restoreFocus = false } = {}) {
    menuPanel.classList.toggle('menu-open', open);
    // Set the attribute rather than the IDL property: it reflects everywhere,
    // including engines that do not implement `inert` as a property.
    menuPanel.toggleAttribute('inert', !open);
    hamburgerBtn.setAttribute('aria-expanded', String(open));

    if (open) {
        const firstLink = menuPanel.querySelector('a');
        if (firstLink) {
            firstLink.focus();
        }
    } else if (restoreFocus) {
        hamburgerBtn.focus();
    }
}

function toggleMenu() {
    setMenuOpen(!isMenuOpen());
}

document.addEventListener('click', (event) => {
    const isClickInsideMenu = menuPanel.contains(event.target);
    const isClickOnButton = hamburgerBtn.contains(event.target);

    if (!isClickInsideMenu && !isClickOnButton && isMenuOpen()) {
        setMenuOpen(false);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
        setMenuOpen(false, { restoreFocus: true });
    }
});

nextQuoteBtn.addEventListener('click', showNextQuote);
previousQuoteBtn.addEventListener('click', showPreviousQuote);
copyBtn.addEventListener('click', copyQuoteToClipboard);
hamburgerBtn.addEventListener('click', toggleMenu);

/**
 * Load the pool once, then show the first quote.
 */
async function init() {
    showLoading();

    try {
        quotePool = await loadQuotes();
        showNextQuote();
    } catch (error) {
        console.error('Error loading quotes:', error);
        const isNetworkError = error instanceof TypeError;
        showError(
            isNetworkError
                ? 'Unable to load quotes. This site needs to be served from a web server, not opened directly as a file.'
                : 'Unable to load quotes. Please check your connection and try again.'
        );
    }
}

init();
