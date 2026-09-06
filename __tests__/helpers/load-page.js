import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');

export function readRepoFile(relativePath) {
    return readFileSync(join(repoRoot, relativePath), 'utf-8');
}

/**
 * Serve the repository's real quote files to the page under test. Pass
 * `failing` to make specific paths reject or 404, for error-path coverage.
 */
export function createFetchStub({ failing = [], networkError = false } = {}) {
    return async function fetchStub(resource) {
        const path = String(resource).replace(/^\.?\//, '');

        if (networkError) {
            throw new TypeError('Failed to fetch');
        }

        if (failing.includes(path)) {
            return { ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) };
        }

        const body = readRepoFile(path);
        return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => JSON.parse(body)
        };
    };
}

/**
 * Load the real index.html and run the real app.js against it, so the tests
 * break when the shipped page breaks.
 */
export async function loadPage({ fetchStub = createFetchStub(), url = 'https://haloquotes.teamrespawntv.com/' } = {}) {
    const dom = new JSDOM(readRepoFile('index.html'), {
        runScripts: 'dangerously',
        url,
        pretendToBeVisual: true
    });

    const { window } = dom;
    window.fetch = fetchStub;

    // JSDOM will not fetch the external <script src="app.js">, so run it here.
    const script = window.document.createElement('script');
    script.textContent = readRepoFile('app.js');
    window.document.body.appendChild(script);

    await flush(window);

    return dom;
}

/**
 * Let queued microtasks and timers settle before asserting.
 */
export function flush(window, times = 8) {
    return new Promise((resolve) => {
        let remaining = times;
        const tick = () => {
            if (remaining-- <= 0) {
                resolve();
                return;
            }
            window.setTimeout(tick, 0);
        };
        tick();
    });
}
