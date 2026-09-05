import { describe, it, expect } from 'vitest';
import { loadPage } from './helpers/load-page.js';

/**
 * These tests used to build their own copy of the menu markup and their own
 * copy of the toggle logic in a JSDOM string, so they stayed green no matter
 * what index.html did. They now drive the real page.
 *
 * Open/close behaviour, focus handling and ARIA live in accessibility.test.js;
 * this file covers the menu's structure and its links.
 */

const EXPECTED_LINKS = [
    { text: 'API', href: 'https://api.haloquotes.teamrespawntv.com/' },
    { text: 'Source Code', href: 'https://github.com/AndyTheNerd/Halo-Quotes' },
    { text: 'Team Respawn Website', href: 'https://teamrespawntv.com' },
    { text: 'Team Respawn YouTube', href: 'https://www.youtube.com/@TeamRespawn' }
];

async function menu() {
    const dom = await loadPage();
    return dom.window.document.getElementById('menu-panel');
}

describe('menu structure', () => {
    it('is present in the page', async () => {
        const dom = await loadPage();
        expect(dom.window.document.getElementById('hamburger-btn')).not.toBeNull();
        expect(dom.window.document.getElementById('menu-panel')).not.toBeNull();
    });

    it('has two sections with the expected headings', async () => {
        const panel = await menu();
        const headings = [...panel.querySelectorAll('.menu-heading')].map((h) => h.textContent.trim());

        expect(headings).toEqual(['Halo Quotes', 'Team Respawn']);
    });

    it('puts two links in each section', async () => {
        const panel = await menu();
        const sections = panel.querySelectorAll('.menu-section');

        expect(sections.length).toBe(2);
        for (const section of sections) {
            expect(section.querySelector('ul')).not.toBeNull();
            expect(section.querySelectorAll('a').length).toBe(2);
        }
    });

    it('wraps each link in its own list item', async () => {
        const panel = await menu();
        const items = panel.querySelectorAll('li');

        expect(items.length).toBe(4);
        for (const item of items) {
            expect(item.querySelectorAll('a').length).toBe(1);
        }
    });

    it('gives every link an icon and a text label', async () => {
        const panel = await menu();

        for (const link of panel.querySelectorAll('a')) {
            expect(link.querySelector('.menu-icon'), `${link.href} has no icon`).not.toBeNull();
            expect(link.querySelector('span')?.textContent.trim().length).toBeGreaterThan(0);
        }
    });
});

describe('menu links', () => {
    it('links to the expected destinations in order', async () => {
        const panel = await menu();
        const links = [...panel.querySelectorAll('a')].map((a) => ({
            text: a.querySelector('span').textContent.trim(),
            href: a.getAttribute('href')
        }));

        expect(links).toEqual(EXPECTED_LINKS);
    });

    it('opens external links safely', async () => {
        const panel = await menu();

        for (const link of panel.querySelectorAll('a')) {
            expect(link.getAttribute('target'), `${link.href} target`).toBe('_blank');
            // rel=noopener stops the opened page reaching back via window.opener.
            expect(link.getAttribute('rel'), `${link.href} rel`).toBe('noopener noreferrer');
        }
    });

    it('applies the same treatment to every external link on the page', async () => {
        const dom = await loadPage();

        for (const link of dom.window.document.querySelectorAll('a[href^="http"]')) {
            const href = link.getAttribute('href');
            expect(link.getAttribute('target'), `${href} target`).toBe('_blank');
            expect(link.getAttribute('rel'), `${href} rel`).toContain('noopener');
        }
    });
});

describe('menu interaction', () => {
    it('survives rapid repeated clicks', async () => {
        const dom = await loadPage();
        const { document } = dom.window;
        const button = document.getElementById('hamburger-btn');
        const panel = document.getElementById('menu-panel');

        for (let i = 0; i < 11; i++) {
            button.click();
        }

        // Odd number of clicks leaves it open, with state still consistent.
        expect(panel.classList.contains('menu-open')).toBe(true);
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(panel.hasAttribute('inert')).toBe(false);
    });

    it('stays open when clicking inside the panel', async () => {
        const dom = await loadPage();
        const { document } = dom.window;
        const button = document.getElementById('hamburger-btn');
        const panel = document.getElementById('menu-panel');

        button.click();
        panel.querySelector('.menu-heading').click();

        expect(panel.classList.contains('menu-open')).toBe(true);
    });

    it('does nothing when clicking outside an already closed menu', async () => {
        const dom = await loadPage();
        const { document } = dom.window;
        const panel = document.getElementById('menu-panel');

        document.querySelector('main').click();

        expect(panel.classList.contains('menu-open')).toBe(false);
        expect(document.getElementById('hamburger-btn').getAttribute('aria-expanded')).toBe('false');
    });

    it('does not interfere with the quote controls', async () => {
        const dom = await loadPage();
        const { document } = dom.window;

        const before = document.getElementById('quote-text').textContent;
        document.getElementById('hamburger-btn').click();
        document.getElementById('next-quote-btn').click();

        expect(document.getElementById('quote-text').textContent).not.toBe(before);
    });
});
