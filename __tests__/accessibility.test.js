import { describe, it, expect } from 'vitest';
import { loadPage, readRepoFile } from './helpers/load-page.js';

describe('menu accessibility', () => {
    it('starts closed, collapsed and inert', async () => {
        const dom = await loadPage();
        const { document } = dom.window;

        const button = document.getElementById('hamburger-btn');
        const panel = document.getElementById('menu-panel');

        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(button.getAttribute('aria-controls')).toBe('menu-panel');
        expect(panel.classList.contains('menu-open')).toBe(false);
        // Regression: the closed panel was only translated off screen, so its
        // links stayed in the tab order and keyboard users tabbed into an
        // invisible menu.
        expect(panel.hasAttribute('inert')).toBe(true);
    });

    it('opens on click, exposes the state and moves focus into the menu', async () => {
        const dom = await loadPage();
        const { document } = dom.window;

        const button = document.getElementById('hamburger-btn');
        const panel = document.getElementById('menu-panel');

        button.click();

        expect(panel.classList.contains('menu-open')).toBe(true);
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(panel.hasAttribute('inert')).toBe(false);
        expect(panel.contains(document.activeElement)).toBe(true);
    });

    it('closes on a second click and becomes inert again', async () => {
        const dom = await loadPage();
        const { document } = dom.window;

        const button = document.getElementById('hamburger-btn');
        const panel = document.getElementById('menu-panel');

        button.click();
        button.click();

        expect(panel.classList.contains('menu-open')).toBe(false);
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(panel.hasAttribute('inert')).toBe(true);
    });

    it('closes on Escape and returns focus to the button', async () => {
        const dom = await loadPage();
        const { document, KeyboardEvent } = dom.window;

        const button = document.getElementById('hamburger-btn');
        const panel = document.getElementById('menu-panel');

        button.click();
        expect(panel.classList.contains('menu-open')).toBe(true);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(panel.classList.contains('menu-open')).toBe(false);
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(button);
    });

    it('closes when clicking outside', async () => {
        const dom = await loadPage();
        const { document } = dom.window;

        const button = document.getElementById('hamburger-btn');
        const panel = document.getElementById('menu-panel');

        button.click();
        document.querySelector('main').click();

        expect(panel.classList.contains('menu-open')).toBe(false);
        expect(panel.hasAttribute('inert')).toBe(true);
    });

    it('is a labelled navigation landmark', async () => {
        const dom = await loadPage();
        const panel = dom.window.document.getElementById('menu-panel');

        expect(panel.tagName).toBe('NAV');
        expect(panel.getAttribute('aria-label')).toBeTruthy();
    });
});

describe('quote accessibility', () => {
    it('announces quote changes politely', async () => {
        const dom = await loadPage();
        const container = dom.window.document.getElementById('quote-container');

        expect(container.getAttribute('aria-live')).toBe('polite');
        expect(container.getAttribute('aria-atomic')).toBe('true');
    });

    it('ships a real quote in the markup for no-JS and pre-hydration', () => {
        const html = readRepoFile('index.html');
        const match = html.match(/<p id="quote-text">"([^"]+)"<\/p>/);

        expect(match, 'index.html should contain a static starting quote').not.toBeNull();

        // Guard against the hardcoded quote drifting away from the data.
        const halo2 = JSON.parse(readRepoFile('quotes/halo-2.json'));
        expect(halo2.quotes).toContain(match[1]);
    });

    it('explains itself when JavaScript is unavailable', () => {
        const html = readRepoFile('index.html');
        expect(html).toContain('<noscript>');
        expect(html).toContain('JavaScript is switched off');
    });

    it('has a live region for copy feedback', async () => {
        const dom = await loadPage();
        const status = dom.window.document.getElementById('copy-status');

        expect(status).not.toBeNull();
        expect(status.getAttribute('role')).toBe('status');
        expect(status.getAttribute('aria-live')).toBe('polite');
    });
});

describe('motion and decorative content', () => {
    it('honours prefers-reduced-motion', () => {
        const css = readRepoFile('styles.css');
        expect(css).toContain('@media (prefers-reduced-motion: reduce)');
        // The card zoom and the menu slide are the two motions worth killing.
        expect(css).toMatch(/prefers-reduced-motion[\s\S]*\.card:hover[\s\S]*transform: none/);
    });

    it('hides decorative SVGs and the background image from assistive tech', () => {
        const html = readRepoFile('index.html');
        const svgOpenTags = html.match(/<svg[^>]*>/g) || [];

        expect(svgOpenTags.length).toBeGreaterThan(0);
        for (const tag of svgOpenTags) {
            expect(tag, `decorative svg missing aria-hidden: ${tag}`).toContain('aria-hidden="true"');
        }

        expect(html).toMatch(/<img id="background"[^>]*alt=""/);
    });

    it('gives every control an accessible name', async () => {
        const dom = await loadPage();
        const { document } = dom.window;

        // Links included: the share buttons are icon-only anchors, so their
        // only accessible name is the aria-label.
        for (const control of document.querySelectorAll('button, a')) {
            const name = control.getAttribute('aria-label') || control.textContent.trim();
            const id = control.id || control.getAttribute('href');
            expect(name.length, `${control.tagName} ${id} has no accessible name`).toBeGreaterThan(0);
        }
    });
});
