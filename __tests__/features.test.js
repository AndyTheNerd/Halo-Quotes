import { describe, it, expect } from 'vitest';
import { loadPage, createFetchStub, readRepoFile } from './helpers/load-page.js';

const SITE = 'https://haloquotes.teamrespawntv.com/';

function fire(window, key, target) {
    const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    (target || window.document.body).dispatchEvent(event);
    return event;
}

describe('game filter', () => {
    it('lists every loaded game plus an "all" option', async () => {
        const dom = await loadPage();
        const select = dom.window.document.getElementById('game-filter');
        const values = [...select.options].map((option) => option.value);

        expect(values[0]).toBe('all');
        expect(values).toContain('halo-2');
        expect(values).toContain('halo-infinite');
        expect(values.length).toBe(12); // 11 games plus "all"
    });

    it('omits a game that failed to load', async () => {
        const { createFetchStub } = await import('./helpers/load-page.js');
        const dom = await loadPage({ fetchStub: createFetchStub({ failing: ['quotes/halo-2.json'] }) });
        const values = [...dom.window.document.getElementById('game-filter').options].map((o) => o.value);

        expect(values).not.toContain('halo-2');
        expect(values.length).toBe(11);
    });

    it('restricts quotes to the selected game', async () => {
        const dom = await loadPage();
        const { document } = dom.window;
        const select = document.getElementById('game-filter');

        select.value = 'halo-3';
        select.dispatchEvent(new dom.window.Event('change'));

        const next = document.getElementById('next-quote-btn');
        for (let i = 0; i < 60; i++) {
            expect(document.getElementById('quote-source').textContent).toBe('- Halo 3');
            next.click();
        }
    });

    it('goes back to every game when "all" is reselected', async () => {
        const dom = await loadPage();
        const { document } = dom.window;
        const select = document.getElementById('game-filter');
        const next = document.getElementById('next-quote-btn');

        select.value = 'halo-odst';
        select.dispatchEvent(new dom.window.Event('change'));
        select.value = 'all';
        select.dispatchEvent(new dom.window.Event('change'));

        const sources = new Set();
        for (let i = 0; i < 200; i++) {
            next.click();
            sources.add(document.getElementById('quote-source').textContent);
        }

        expect(sources.size).toBeGreaterThan(3);
    });

    it('remembers the choice for the next visit', async () => {
        const dom = await loadPage();
        const select = dom.window.document.getElementById('game-filter');

        select.value = 'halo-reach';
        select.dispatchEvent(new dom.window.Event('change'));

        expect(dom.window.localStorage.getItem('halo-quotes:game')).toBe('halo-reach');
    });
});

describe('permalinks', () => {
    it('writes a permalink for the quote on screen', async () => {
        const dom = await loadPage();
        const { window } = dom;

        expect(window.location.hash).toMatch(/^#\/[a-z0-9-]+\/[a-z0-9]+$/);
    });

    it('reopens the exact quote a permalink names', async () => {
        const halo2 = JSON.parse(readRepoFile('quotes/halo-2.json'));
        const quote = halo2.quotes[7];

        const dom = await loadPage({ url: `${SITE}#/halo-2/${quote.id}` });
        const { document } = dom.window;

        expect(document.getElementById('quote-text').textContent).toBe(`"${quote.text}"`);
        expect(document.getElementById('quote-source').textContent).toBe('- Halo 2');
    });

    it('still resolves a pre-id permalink by position', async () => {
        const halo2 = JSON.parse(readRepoFile('quotes/halo-2.json'));

        const dom = await loadPage({ url: `${SITE}#/halo-2/7` });
        const { document } = dom.window;

        expect(document.getElementById('quote-text').textContent).toBe(`"${halo2.quotes[7].text}"`);
        // The address bar is rewritten to the quote's own id.
        expect(dom.window.location.hash).toBe(`#/halo-2/${halo2.quotes[7].id}`);
    });

    it('rewrites a permalink to follow its quote after the file changes', async () => {
        const halo2 = JSON.parse(readRepoFile('quotes/halo-2.json'));
        const quote = halo2.quotes[3];

        // Same quote, moved to the front of the file: the id still finds it.
        const moved = {
            gameName: halo2.gameName,
            quotes: [quote, ...halo2.quotes.filter((q) => q.id !== quote.id)]
        };

        const dom = await loadPage({
            url: `${SITE}#/halo-2/${quote.id}`,
            fetchStub: createFetchStub({ overrides: { 'quotes/halo-2.json': moved } })
        });

        expect(dom.window.document.getElementById('quote-text').textContent).toBe(`"${quote.text}"`);
    });

    it('falls back to a random quote for a permalink that does not resolve', async () => {
        const dom = await loadPage({ url: `${SITE}#/halo-2/99999` });
        const text = dom.window.document.getElementById('quote-text').textContent;

        expect(text.startsWith('"')).toBe(true);
        expect(text).not.toContain('Unable to load');
    });

    it('ignores a malformed hash', async () => {
        const dom = await loadPage({ url: `${SITE}#not-a-permalink` });
        const text = dom.window.document.getElementById('quote-text').textContent;

        expect(text.startsWith('"')).toBe(true);
    });

    it('does not push a history entry per quote', async () => {
        const dom = await loadPage();
        const { window } = dom;
        const before = window.history.length;

        const next = window.document.getElementById('next-quote-btn');
        for (let i = 0; i < 10; i++) {
            next.click();
        }

        // replaceState keeps the browser Back button from becoming a second
        // Previous button.
        expect(window.history.length).toBe(before);
    });
});

describe('share links', () => {
    it('builds Bluesky and X links carrying the quote and its permalink', async () => {
        const halo2 = JSON.parse(readRepoFile('quotes/halo-2.json'));
        const permalink = `#/halo-2/${halo2.quotes[0].id}`;

        const dom = await loadPage({ url: `${SITE}${permalink}` });
        const { document } = dom.window;
        const bluesky = document.getElementById('share-bluesky').href;
        const x = document.getElementById('share-x').href;

        expect(bluesky.startsWith('https://bsky.app/intent/compose?text=')).toBe(true);
        expect(x.startsWith('https://x.com/intent/tweet?text=')).toBe(true);

        const blueskyText = decodeURIComponent(new URL(bluesky).searchParams.get('text'));
        expect(blueskyText).toContain('Halo 2');
        expect(blueskyText).toContain(permalink);

        const xUrl = new URL(x).searchParams.get('url');
        expect(xUrl).toContain(permalink);

        // A short quote should survive intact.
        if (halo2.quotes[0].text.length < 150) {
            expect(blueskyText).toContain(halo2.quotes[0].text);
        }
    });

    it('keeps the Bluesky composer within the 300 character limit', async () => {
        const dom = await loadPage();
        const { document } = dom.window;
        const next = document.getElementById('next-quote-btn');

        for (let i = 0; i < 150; i++) {
            const href = document.getElementById('share-bluesky').href;
            const text = decodeURIComponent(new URL(href).searchParams.get('text'));
            expect(text.length, `share text too long: ${text.length}`).toBeLessThanOrEqual(300);
            next.click();
        }
    });

    it('updates the links when the quote changes', async () => {
        const dom = await loadPage();
        const { document } = dom.window;

        const before = document.getElementById('share-bluesky').href;
        document.getElementById('next-quote-btn').click();

        expect(document.getElementById('share-bluesky').href).not.toBe(before);
    });
});

describe('keyboard shortcuts', () => {
    it('moves forward with ArrowRight and back with ArrowLeft', async () => {
        const dom = await loadPage();
        const { window, window: { document } } = dom;
        const textOf = () => document.getElementById('quote-text').textContent;

        const first = textOf();
        fire(window, 'ArrowRight');
        const second = textOf();
        expect(second).not.toBe(first);

        fire(window, 'ArrowLeft');
        expect(textOf()).toBe(first);
    });

    it('does nothing on ArrowLeft at the start of history', async () => {
        const dom = await loadPage();
        const { window, window: { document } } = dom;
        const first = document.getElementById('quote-text').textContent;

        fire(window, 'ArrowLeft');
        expect(document.getElementById('quote-text').textContent).toBe(first);
    });

    it('copies with C', async () => {
        const dom = await loadPage();
        const { window, window: { document } } = dom;

        let copied = null;
        window.navigator.clipboard = { writeText: async (text) => { copied = text; } };

        fire(window, 'c');
        await new Promise((resolve) => window.setTimeout(resolve, 10));

        expect(copied).toContain(document.getElementById('quote-source').textContent.replace('- ', ''));
    });

    it('leaves the shortcut keys alone while a control has focus', async () => {
        const dom = await loadPage();
        const { window, window: { document } } = dom;

        const select = document.getElementById('game-filter');
        const before = document.getElementById('quote-text').textContent;

        // Typing in the select should not advance the quote.
        fire(window, 'ArrowRight', select);
        expect(document.getElementById('quote-text').textContent).toBe(before);
    });

    it('ignores shortcuts combined with a modifier key', async () => {
        const dom = await loadPage();
        const { window, window: { document } } = dom;
        const before = document.getElementById('quote-text').textContent;

        const event = new window.KeyboardEvent('keydown', {
            key: 'ArrowRight', ctrlKey: true, bubbles: true, cancelable: true
        });
        document.body.dispatchEvent(event);

        expect(document.getElementById('quote-text').textContent).toBe(before);
    });

    it('documents the shortcuts on the page', () => {
        const html = readRepoFile('index.html');
        expect(html).toContain('class="shortcuts"');
        expect(html).toContain('<kbd>');
    });
});
