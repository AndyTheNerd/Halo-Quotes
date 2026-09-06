import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readRepoFile, repoRoot } from './helpers/load-page.js';
import { currentVersion, stampedVersion } from '../scripts/stamp-assets.mjs';

const SITE = 'https://haloquotes.teamrespawntv.com';

function html() {
    return readRepoFile('index.html');
}

/** Every local asset the pages reference, so a rename cannot go unnoticed. */
function localAssetRefs(source) {
    const refs = new Set();
    const patterns = [
        /(?:href|src)="(\/?(?:img|quotes)\/[^"]+)"/g,
        /(?:href|src)="(\/?(?:styles\.css|app\.js|site\.webmanifest|og-image\.jpg)(?:\?[^"]*)?)"/g,
        /srcset="(\/?img\/[^"]+)"/g
    ];
    for (const pattern of patterns) {
        for (const match of source.matchAll(pattern)) {
            // Drop the cache-busting query string before checking the path.
            refs.add(match[1].replace(/^\//, '').replace(/\?.*$/, ''));
        }
    }
    return [...refs];
}

describe('social sharing metadata', () => {
    it('points og:image at a file that actually exists', () => {
        // Regression: og:image referenced /og-image.jpg, which was never in
        // the repo, so every share rendered without a preview image.
        const match = html().match(/property="og:image" content="([^"]+)"/);
        expect(match).not.toBeNull();

        const url = match[1];
        expect(url.startsWith(SITE)).toBe(true);

        const path = url.slice(SITE.length).replace(/^\//, '');
        expect(existsSync(join(repoRoot, path)), `${path} is referenced but missing`).toBe(true);
    });

    it('declares the image dimensions and alt text', () => {
        const source = html();
        expect(source).toContain('property="og:image:width" content="1200"');
        expect(source).toContain('property="og:image:height" content="630"');
        expect(source).toMatch(/property="og:image:alt" content="[^"]+"/);
    });

    it('has a twitter:image so X does not fall back to og parsing', () => {
        expect(html()).toMatch(/name="twitter:image" content="https:\/\/[^"]+"/);
    });

    it('uses one consistent canonical URL', () => {
        const source = html();
        const canonical = source.match(/rel="canonical" href="([^"]+)"/);
        const ogUrl = source.match(/property="og:url" content="([^"]+)"/);

        expect(canonical).not.toBeNull();
        expect(canonical[1]).toBe(`${SITE}/`);
        expect(ogUrl[1]).toBe(canonical[1]);
        expect(readRepoFile('sitemap.xml')).toContain(`<loc>${canonical[1]}</loc>`);
    });
});

describe('icons and manifest', () => {
    it('links a manifest that parses and names existing icons', () => {
        expect(html()).toContain('rel="manifest" href="/site.webmanifest"');

        const manifest = JSON.parse(readRepoFile('site.webmanifest'));
        expect(manifest.name).toBeTruthy();
        expect(manifest.icons.length).toBeGreaterThan(0);

        for (const icon of manifest.icons) {
            const path = icon.src.replace(/^\//, '');
            expect(existsSync(join(repoRoot, path)), `manifest icon ${path} is missing`).toBe(true);
        }
    });

    it('has an apple-touch-icon and a theme colour', () => {
        const source = html();
        expect(source).toContain('rel="apple-touch-icon"');
        expect(source).toMatch(/name="theme-color" content="#[0-9a-fA-F]{6}"/);
        expect(existsSync(join(repoRoot, 'img/apple-touch-icon.png'))).toBe(true);
    });

    it('allows the manifest through the CSP', () => {
        expect(html()).toMatch(/manifest-src 'self'/);
    });
});

describe('structured data', () => {
    it('embeds valid JSON-LD', () => {
        const match = html().match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        expect(match, 'no JSON-LD block found').not.toBeNull();

        const data = JSON.parse(match[1]);
        expect(data['@context']).toBe('https://schema.org');

        const types = data['@graph'].map((node) => node['@type']);
        expect(types).toContain('WebSite');
        expect(types).toContain('Organization');
        expect(types).toContain('WebApplication');
    });

    it('quotes real data in the Quotation node', () => {
        const match = html().match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        const data = JSON.parse(match[1]);
        const quotation = data['@graph'].find((node) => node['@type'] === 'Quotation');

        expect(quotation).toBeDefined();

        const game = quotation.isPartOf.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const file = JSON.parse(readRepoFile(`quotes/${game}.json`));
        expect(file.quotes.map((quote) => quote.text)).toContain(quotation.text);
    });
});

describe('404 page', () => {
    it('exists and is excluded from indexing', () => {
        const page = readRepoFile('404.html');
        expect(page).toContain('name="robots" content="noindex"');
        expect(page).toContain('Page not found');
    });

    it('links back to the home page', () => {
        expect(readRepoFile('404.html')).toMatch(/<a class="btn" href="\/"/);
    });

    it('shows a real quote from the data', () => {
        const page = readRepoFile('404.html');
        const text = page.match(/<p id="quote-text">"([^"]+)"<\/p>/)[1];
        const source = page.match(/<p id="quote-source">- ([^<]+)<\/p>/)[1];

        const file = JSON.parse(readRepoFile('quotes/halo-infinite.json'));
        expect(file.gameName).toBe(source);
        expect(file.quotes.map((quote) => quote.text)).toContain(text);
    });
});

describe('asset references', () => {
    it('loads app.js with a stamp matching the file on disk', () => {
        // Without this the browser can pair a cached app.js with freshly
        // deployed quote files. Run `npm run stamp` after editing app.js.
        expect(
            stampedVersion(html()),
            'index.html stamp is stale - run `npm run stamp`'
        ).toBe(currentVersion());
    });

    it('resolves every local asset referenced by index.html', () => {
        for (const ref of localAssetRefs(html())) {
            expect(existsSync(join(repoRoot, ref)), `index.html references missing ${ref}`).toBe(true);
        }
    });

    it('resolves every local asset referenced by 404.html', () => {
        for (const ref of localAssetRefs(readRepoFile('404.html'))) {
            expect(existsSync(join(repoRoot, ref)), `404.html references missing ${ref}`).toBe(true);
        }
    });

    it('no longer references the deleted background PNG or the hotlinked wallpaper', () => {
        for (const file of ['index.html', '404.html', 'styles.css']) {
            const source = readRepoFile(file);
            expect(source).not.toContain('HCE-Environment');
            expect(source).not.toContain('wallpapers.com');
        }
    });
});
