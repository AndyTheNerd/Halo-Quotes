/**
 * Stamp index.html's <script src="app.js"> with a hash of app.js.
 *
 * The site is served straight from the repository with no build step, so a
 * browser can hold a cached app.js while the quote files it fetches are
 * already the newly deployed ones. The stamp changes whenever app.js changes,
 * which makes the browser fetch the new script instead of reusing the old one.
 *
 * Run `npm run stamp` after editing app.js. `npm test` fails while the stamp
 * is stale, so a forgotten run is caught before it ships.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..');

/** The stamp for a file's contents. Short: it only has to change, not be unique. */
export function assetVersion(source) {
    return createHash('sha1').update(source).digest('hex').slice(0, 8);
}

/** Rewrite the app.js reference in `html` to carry `version`. */
export function stampHtml(html, version) {
    return html.replace(/src="app\.js(?:\?v=[a-z0-9]+)?"/, `src="app.js?v=${version}"`);
}

/** The version index.html currently asks for, or null if it asks for none. */
export function stampedVersion(html) {
    const match = /src="app\.js\?v=([a-z0-9]+)"/.exec(html);
    return match ? match[1] : null;
}

export function currentVersion() {
    return assetVersion(readFileSync(join(repoRoot, 'app.js'), 'utf-8'));
}

function main() {
    const indexPath = join(repoRoot, 'index.html');
    const html = readFileSync(indexPath, 'utf-8');
    const version = currentVersion();
    const stamped = stampHtml(html, version);

    if (stamped === html) {
        console.log(`index.html already stamped app.js?v=${version}`);
        return;
    }

    writeFileSync(indexPath, stamped);
    console.log(`index.html now loads app.js?v=${version}`);
}

// Only act when run as a command; the tests import the helpers above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
