import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadPage, createFetchStub, readRepoFile, repoRoot, flush } from './helpers/load-page.js';

function quoteFiles() {
    return readdirSync(join(repoRoot, 'quotes')).filter((f) => f.endsWith('.json')).sort();
}

function allQuotes() {
    return quoteFiles().flatMap((file) => {
        const data = JSON.parse(readRepoFile(join('quotes', file)));
        return data.quotes.map(({ id, text }) => ({ id, text, game: data.gameName }));
    });
}

describe('quote data', () => {
    it('has no duplicate quotes within a game', () => {
        for (const file of quoteFiles()) {
            const data = JSON.parse(readRepoFile(join('quotes', file)));
            const unique = new Set(data.quotes.map((quote) => quote.text));
            expect(unique.size, `${file} contains duplicate quotes`).toBe(data.quotes.length);
        }
    });

    it('gives every quote an id that is unique within its game', () => {
        for (const file of quoteFiles()) {
            const data = JSON.parse(readRepoFile(join('quotes', file)));

            for (const quote of data.quotes) {
                // Permalinks are built from these, so they have to survive a URL.
                expect(quote.id, `${file} has a quote without an id`).toMatch(/^[a-z0-9]+$/);
            }

            const unique = new Set(data.quotes.map((quote) => quote.id));
            expect(unique.size, `${file} contains duplicate quote ids`).toBe(data.quotes.length);
        }
    });

    it('gives every file a game name and a non-empty quote list', () => {
        for (const file of quoteFiles()) {
            const data = JSON.parse(readRepoFile(join('quotes', file)));
            expect(typeof data.gameName, `${file} gameName`).toBe('string');
            expect(data.gameName.length).toBeGreaterThan(0);
            expect(Array.isArray(data.quotes)).toBe(true);
            expect(data.quotes.length).toBeGreaterThan(0);
            expect(typeof data.quotes[0], `${file} quotes should be objects`).toBe('object');
        }
    });

    it('has no blank or untrimmed quotes', () => {
        for (const file of quoteFiles()) {
            const data = JSON.parse(readRepoFile(join('quotes', file)));
            for (const { text } of data.quotes) {
                expect(typeof text).toBe('string');
                expect(text.trim().length, `blank quote in ${file}`).toBeGreaterThan(0);
            }
        }
    });
});

describe('app.js quote list', () => {
    it('lists every quote file on disk', () => {
        const app = readRepoFile('app.js');
        for (const file of quoteFiles()) {
            expect(app, `app.js is missing quotes/${file}`).toContain(`quotes/${file}`);
        }
    });
});

describe('page behaviour', () => {
    it('shows a quote from the real data on load', async () => {
        const dom = await loadPage();
        const { document } = dom.window;

        const text = document.getElementById('quote-text').textContent;
        const source = document.getElementById('quote-source').textContent;

        expect(text).not.toBe('');
        expect(text).not.toContain('Loading');
        expect(text.startsWith('"')).toBe(true);
        expect(source.startsWith('- ')).toBe(true);

        const known = allQuotes().map((q) => `"${q.text}"`);
        expect(known).toContain(text);
    });

    it('draws from every game, not one game per click', async () => {
        // The old implementation picked a random FILE and then a random quote,
        // so a 7-quote game was as likely as a 116-quote game. With a flat pool
        // the observed distribution should track the underlying quote counts.
        const dom = await loadPage();
        const { document } = dom.window;
        const next = document.getElementById('next-quote-btn');

        const seenGames = new Map();
        for (let i = 0; i < 400; i++) {
            next.click();
            const source = document.getElementById('quote-source').textContent;
            seenGames.set(source, (seenGames.get(source) || 0) + 1);
        }

        // Halo Multiplayer holds 7 of 689 quotes (~1%). Under the old
        // file-first scheme it took ~9% of draws (1 in 11).
        const multiplayer = seenGames.get('- Halo Multiplayer') || 0;
        expect(multiplayer / 400).toBeLessThan(0.05);

        // Halo 2 holds 116 of 689 quotes (~17%), far above the old flat 1/11.
        const halo2 = seenGames.get('- Halo 2') || 0;
        expect(halo2 / 400).toBeGreaterThan(0.08);
    });

    it('never repeats the same quote twice in a row', async () => {
        const dom = await loadPage();
        const { document } = dom.window;
        const next = document.getElementById('next-quote-btn');

        let previous = document.getElementById('quote-text').textContent;
        for (let i = 0; i < 300; i++) {
            next.click();
            const current = document.getElementById('quote-text').textContent;
            expect(current).not.toBe(previous);
            previous = current;
        }
    });

    it('walks backwards and forwards through history', async () => {
        const dom = await loadPage();
        const { document } = dom.window;
        const next = document.getElementById('next-quote-btn');
        const previous = document.getElementById('previous-quote-btn');
        const textOf = () => document.getElementById('quote-text').textContent;

        const first = textOf();
        next.click();
        const second = textOf();
        next.click();
        const third = textOf();

        previous.click();
        expect(textOf()).toBe(second);
        previous.click();
        expect(textOf()).toBe(first);

        next.click();
        expect(textOf()).toBe(second);
        next.click();
        expect(textOf()).toBe(third);
    });

    it('disables Previous only at the start of history', async () => {
        const dom = await loadPage();
        const { document } = dom.window;
        const next = document.getElementById('next-quote-btn');
        const previous = document.getElementById('previous-quote-btn');

        expect(previous.disabled).toBe(true);
        next.click();
        expect(previous.disabled).toBe(false);
        previous.click();
        expect(previous.disabled).toBe(true);
    });

    it('fetches each quote file exactly once, no matter how many quotes are shown', async () => {
        const requested = [];
        const counting = createFetchStub();
        const dom = await loadPage({
            fetchStub: async (resource) => {
                requested.push(String(resource));
                return counting(resource);
            }
        });

        const before = requested.length;
        expect(before).toBe(quoteFiles().length);

        const next = dom.window.document.getElementById('next-quote-btn');
        for (let i = 0; i < 50; i++) {
            next.click();
        }
        await flush(dom.window);

        expect(requested.length).toBe(before);
    });

    it('still works when one game fails to load', async () => {
        const dom = await loadPage({ fetchStub: createFetchStub({ failing: ['quotes/halo-2.json'] }) });
        const { document } = dom.window;

        const text = document.getElementById('quote-text').textContent;
        expect(text.startsWith('"')).toBe(true);

        const next = document.getElementById('next-quote-btn');
        for (let i = 0; i < 100; i++) {
            next.click();
            expect(document.getElementById('quote-source').textContent).not.toBe('- Halo 2');
        }
    });

    it('reports an error when nothing can be loaded', async () => {
        const dom = await loadPage({ fetchStub: createFetchStub({ networkError: true }) });
        const { document } = dom.window;

        expect(document.getElementById('quote-text').textContent).toContain('Unable to load quotes');
        expect(document.getElementById('copy-btn').disabled).toBe(true);
    });

    it('does not strand the Previous button after a failed load', async () => {
        // Regression: showLoading() disabled all three buttons and only the
        // Next button was re-enabled afterwards, so an error left Previous
        // permanently disabled even when history existed.
        const dom = await loadPage({ fetchStub: createFetchStub({ networkError: true }) });
        const { document } = dom.window;

        const previous = document.getElementById('previous-quote-btn');
        // No history yet, so Previous is correctly disabled rather than stuck.
        expect(previous.disabled).toBe(true);
        expect(document.getElementById('next-quote-btn').disabled).toBe(true);
    });
});
