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
const gameFilter = document.getElementById('game-filter');
const shareBluesky = document.getElementById('share-bluesky');
const shareX = document.getElementById('share-x');

// Every quote from every game, flattened. Populated once by loadQuotes().
let quotePool = [];

// Quotes the user has already seen, so Previous can walk back through them.
let quoteHistory = [];
let currentQuoteIndex = -1;
let copyResetTimer = null;

// 'all', or a gameId to draw from a single game.
let activeGameId = 'all';

const FILTER_STORAGE_KEY = 'halo-quotes:game';
// Bluesky's post limit. Long quotes are trimmed so the composer opens with
// something postable rather than silently over the limit.
const BLUESKY_LIMIT = 300;

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

    return data.quotes.map((entry, index) => ({
        // Quote files used to hold bare strings; tolerate that shape so a
        // cached or half-deployed file cannot blank the page.
        text: typeof entry === 'string' ? entry : entry.text,
        id: typeof entry === 'string' ? null : entry.id,
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
function activePool() {
    return activeGameId === 'all'
        ? quotePool
        : quotePool.filter((quote) => quote.gameId === activeGameId);
}

function pickRandomQuote() {
    const pool = activePool();

    if (pool.length === 0) {
        return null;
    }

    if (pool.length === 1) {
        return pool[0];
    }

    const current = quoteHistory[currentQuoteIndex];
    let pick;

    do {
        pick = pool[Math.floor(Math.random() * pool.length)];
    } while (current && pick.text === current.text && pick.gameId === current.gameId);

    return pick;
}

/**
 * Permalinks look like #/halo-2/1a2b3c4d: a game id and the quote's own id.
 * The id travels with the quote, so adding, removing or reordering quotes
 * leaves every shared link pointing at the same words.
 *
 * Links made before quotes had ids carry a position instead (#/halo-2/42).
 * Those are still resolved, by position, so they land on a quote rather than
 * dead-ending - but the quote they reach may have moved since.
 */
function quoteFromHash(hash) {
    const match = /^#\/([a-z0-9-]+)\/([a-z0-9]+)$/.exec(hash || '');

    if (!match) {
        return null;
    }

    const [, gameId, ref] = match;
    const byId = quotePool.find((quote) => quote.gameId === gameId && quote.id === ref);

    if (byId) {
        return byId;
    }

    if (!/^\d+$/.test(ref)) {
        return null;
    }

    return quotePool.find((quote) => quote.gameId === gameId && quote.index === Number(ref)) || null;
}

function permalinkFor(quote) {
    return `#/${quote.gameId}/${quote.id ?? quote.index}`;
}

/**
 * Keep the address bar in step without pushing an entry per quote, which
 * would turn the browser Back button into a second Previous button.
 */
function updatePermalink(quote) {
    const hash = permalinkFor(quote);

    if (window.location.hash === hash) {
        return;
    }

    try {
        window.history.replaceState(null, '', hash);
    } catch (error) {
        window.location.hash = hash;
    }
}

function shareText(quote) {
    const suffix = ` - ${quote.game}`;
    const url = `${window.location.origin}${window.location.pathname}${permalinkFor(quote)}`;
    const room = BLUESKY_LIMIT - suffix.length - url.length - 6;
    const body = quote.text.length > room ? `${quote.text.slice(0, Math.max(room - 1, 0)).trimEnd()}...` : quote.text;

    return { text: `"${body}"${suffix}`, url };
}

function updateShareLinks(quote) {
    const { text, url } = shareText(quote);

    shareBluesky.href = `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text}\n\n${url}`)}`;
    shareX.href = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

/**
 * Enable or disable the controls to match the current state. Called from every
 * path — including the error path, so a failed load can never strand the user
 * with a permanently disabled Previous button.
 */
function updateControls({ loading = false } = {}) {
    const hasQuote = currentQuoteIndex >= 0 && Boolean(quoteHistory[currentQuoteIndex]);

    previousQuoteBtn.disabled = loading || currentQuoteIndex <= 0;
    nextQuoteBtn.disabled = loading || activePool().length === 0;
    copyBtn.disabled = loading || !hasQuote;
    gameFilter.disabled = loading || quotePool.length === 0;

    for (const link of [shareBluesky, shareX]) {
        link.classList.toggle('is-disabled', !hasQuote);
        link.setAttribute('aria-disabled', String(!hasQuote));
    }
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
    updatePermalink(quote);
    updateShareLinks(quote);
    updateControls();
}

/**
 * Advance to the next quote: forward through history if the user has stepped
 * back, otherwise draw a new one from the pool.
 */
function showNextQuote() {
    if (currentQuoteIndex < quoteHistory.length - 1) {
        currentQuoteIndex++;
        showQuote();
        return;
    }

    const quote = pickRandomQuote();

    if (!quote) {
        return;
    }

    quoteHistory.push(quote);
    currentQuoteIndex = quoteHistory.length - 1;
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

/**
 * True when the key should go to what the user is typing in rather than to a
 * page shortcut.
 */
function isTypingTarget(target) {
    if (!target) {
        return false;
    }

    return target.isContentEditable
        || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
        setMenuOpen(false, { restoreFocus: true });
        return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) {
        return;
    }

    if (event.key === 'ArrowRight' && !nextQuoteBtn.disabled) {
        event.preventDefault();
        showNextQuote();
    } else if (event.key === 'ArrowLeft' && !previousQuoteBtn.disabled) {
        event.preventDefault();
        showPreviousQuote();
    } else if ((event.key === 'c' || event.key === 'C') && !copyBtn.disabled) {
        event.preventDefault();
        copyQuoteToClipboard();
    }
});

/**
 * localStorage is unavailable in some privacy modes, so every access is
 * guarded; the filter simply falls back to "All games".
 */
function readStoredFilter() {
    try {
        return window.localStorage.getItem(FILTER_STORAGE_KEY);
    } catch (error) {
        return null;
    }
}

function storeFilter(gameId) {
    try {
        window.localStorage.setItem(FILTER_STORAGE_KEY, gameId);
    } catch (error) {
        // Not worth surfacing: the filter still works for this visit.
    }
}

/**
 * Build the filter from what actually loaded, so a game that failed to fetch
 * is not offered as an option.
 */
function populateGameFilter() {
    const names = new Map();

    for (const quote of quotePool) {
        if (!names.has(quote.gameId)) {
            names.set(quote.gameId, quote.game);
        }
    }

    for (const game of GAMES) {
        if (!names.has(game.id)) {
            continue;
        }

        const option = document.createElement('option');
        option.value = game.id;
        option.textContent = names.get(game.id);
        gameFilter.appendChild(option);
    }
}

/**
 * Guard against a stale stored value or a hand-edited filter naming a game
 * that is not in the pool.
 */
function isKnownGameId(gameId) {
    return gameId === 'all' || quotePool.some((quote) => quote.gameId === gameId);
}

/**
 * Switch games and show a quote from the new selection.
 */
function applyFilter(gameId) {
    activeGameId = isKnownGameId(gameId) ? gameId : 'all';
    gameFilter.value = activeGameId;
    storeFilter(activeGameId);

    const quote = pickRandomQuote();

    if (quote) {
        quoteHistory.push(quote);
        currentQuoteIndex = quoteHistory.length - 1;
        showQuote();
    } else {
        updateControls();
    }
}

nextQuoteBtn.addEventListener('click', showNextQuote);
previousQuoteBtn.addEventListener('click', showPreviousQuote);
copyBtn.addEventListener('click', copyQuoteToClipboard);
hamburgerBtn.addEventListener('click', toggleMenu);
gameFilter.addEventListener('change', () => applyFilter(gameFilter.value));

// A permalink pasted into the address bar of an open tab should work too.
window.addEventListener('hashchange', () => {
    const quote = quoteFromHash(window.location.hash);

    if (quote && quote !== quoteHistory[currentQuoteIndex]) {
        quoteHistory.push(quote);
        currentQuoteIndex = quoteHistory.length - 1;
        showQuote();
    }
});

/**
 * Load the pool once, then show the first quote.
 */
async function init() {
    showLoading();

    try {
        quotePool = await loadQuotes();
        populateGameFilter();

        const stored = readStoredFilter();
        if (stored && isKnownGameId(stored)) {
            activeGameId = stored;
            gameFilter.value = stored;
        }

        // A permalink wins over a random draw, and over the stored filter.
        const linked = quoteFromHash(window.location.hash);

        if (linked) {
            quoteHistory.push(linked);
            currentQuoteIndex = 0;
            showQuote();
        } else {
            showNextQuote();
        }
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
