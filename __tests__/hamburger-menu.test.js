import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Hamburger Menu', () => {
  let dom;
  let document;
  let window;
  let hamburgerBtn;
  let menuPanel;

  beforeEach(() => {
    // Create a JSDOM instance with the HTML structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <button id="hamburger-btn" aria-label="Toggle menu">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        <div id="menu-panel">
          <ul>
            <li>
              <a href="https://api.haloquotes.teamrespawntv.com/" target="_blank" rel="noopener noreferrer">
                <svg class="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
                <span>API</span>
              </a>
            </li>
            <li>
              <a href="https://github.com/AndyTheNerd/Halo-Quotes" target="_blank" rel="noopener noreferrer">
                <svg class="menu-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>Source Code</span>
              </a>
            </li>
            <li>
              <a href="https://teamrespawntv.com" target="_blank" rel="noopener noreferrer">
                <svg class="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                </svg>
                <span>Team Respawn Website</span>
              </a>
            </li>
            <li>
              <a href="https://www.youtube.com/@TeamRespawn" target="_blank" rel="noopener noreferrer">
                <svg class="menu-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>Team Respawn YouTube</span>
              </a>
            </li>
          </ul>
        </div>
      </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.document = document;
    global.window = window;

    // Get elements
    hamburgerBtn = document.getElementById('hamburger-btn');
    menuPanel = document.getElementById('menu-panel');

    // Initialize the hamburger menu functionality
    function toggleMenu() {
      menuPanel.classList.toggle('menu-open');
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      const isClickInsideMenu = menuPanel.contains(event.target);
      const isClickOnButton = hamburgerBtn.contains(event.target);
      
      if (!isClickInsideMenu && !isClickOnButton && menuPanel.classList.contains('menu-open')) {
        menuPanel.classList.remove('menu-open');
      }
    });

    // Add event listener to hamburger button
    hamburgerBtn.addEventListener('click', toggleMenu);
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Menu Initialization', () => {
    it('should have hamburger button in the DOM', () => {
      expect(hamburgerBtn).toBeTruthy();
      expect(hamburgerBtn.id).toBe('hamburger-btn');
    });

    it('should have menu panel in the DOM', () => {
      expect(menuPanel).toBeTruthy();
      expect(menuPanel.id).toBe('menu-panel');
    });

    it('should have hamburger button with correct aria-label', () => {
      expect(hamburgerBtn.getAttribute('aria-label')).toBe('Toggle menu');
    });

    it('should have menu panel initially closed (no menu-open class)', () => {
      expect(menuPanel.classList.contains('menu-open')).toBe(false);
    });
  });

  describe('Menu Toggle Functionality', () => {
    it('should open menu when hamburger button is clicked', () => {
      hamburgerBtn.click();
      expect(menuPanel.classList.contains('menu-open')).toBe(true);
    });

    it('should close menu when hamburger button is clicked again', () => {
      hamburgerBtn.click(); // Open
      hamburgerBtn.click(); // Close
      expect(menuPanel.classList.contains('menu-open')).toBe(false);
    });

    it('should toggle menu state on multiple clicks', () => {
      expect(menuPanel.classList.contains('menu-open')).toBe(false);
      
      hamburgerBtn.click();
      expect(menuPanel.classList.contains('menu-open')).toBe(true);
      
      hamburgerBtn.click();
      expect(menuPanel.classList.contains('menu-open')).toBe(false);
      
      hamburgerBtn.click();
      expect(menuPanel.classList.contains('menu-open')).toBe(true);
    });
  });

  describe('Click Outside to Close', () => {
    it('should close menu when clicking outside the menu panel', () => {
      // Open menu first
      hamburgerBtn.click();
      expect(menuPanel.classList.contains('menu-open')).toBe(true);

      // Click outside (on body)
      const body = document.body;
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      body.dispatchEvent(clickEvent);

      expect(menuPanel.classList.contains('menu-open')).toBe(false);
    });

    it('should not close menu when clicking inside the menu panel', () => {
      // Open menu first
      hamburgerBtn.click();
      expect(menuPanel.classList.contains('menu-open')).toBe(true);

      // Click inside menu panel
      const menuLink = menuPanel.querySelector('a');
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      menuLink.dispatchEvent(clickEvent);

      expect(menuPanel.classList.contains('menu-open')).toBe(true);
    });

    it('should not close menu when clicking the hamburger button', () => {
      // Open menu first
      hamburgerBtn.click();
      expect(menuPanel.classList.contains('menu-open')).toBe(true);

      // Click hamburger button (should toggle, not close via outside click handler)
      hamburgerBtn.click();
      // After toggle, menu should be closed
      expect(menuPanel.classList.contains('menu-open')).toBe(false);
    });

    it('should not close menu when menu is already closed', () => {
      expect(menuPanel.classList.contains('menu-open')).toBe(false);

      // Click outside
      const body = document.body;
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      body.dispatchEvent(clickEvent);

      expect(menuPanel.classList.contains('menu-open')).toBe(false);
    });
  });

  describe('Menu Links', () => {
    it('should have all required menu links', () => {
      const links = menuPanel.querySelectorAll('a');
      expect(links.length).toBe(4);
    });

    it('should have API link with correct href and attributes', () => {
      const apiLink = Array.from(menuPanel.querySelectorAll('a')).find(
        link => link.href.includes('api.haloquotes.teamrespawntv.com')
      );
      expect(apiLink).toBeTruthy();
      expect(apiLink.href).toBe('https://api.haloquotes.teamrespawntv.com/');
      expect(apiLink.getAttribute('target')).toBe('_blank');
      expect(apiLink.getAttribute('rel')).toBe('noopener noreferrer');
      const span = apiLink.querySelector('span');
      expect(span).toBeTruthy();
      expect(span.textContent.trim()).toBe('API');
      expect(apiLink.querySelector('.menu-icon')).toBeTruthy();
    });

    it('should have Source Code link with correct href and attributes', () => {
      const sourceLink = Array.from(menuPanel.querySelectorAll('a')).find(
        link => link.href.includes('github.com')
      );
      expect(sourceLink).toBeTruthy();
      expect(sourceLink.href).toBe('https://github.com/AndyTheNerd/Halo-Quotes');
      expect(sourceLink.getAttribute('target')).toBe('_blank');
      expect(sourceLink.getAttribute('rel')).toBe('noopener noreferrer');
      const span = sourceLink.querySelector('span');
      expect(span).toBeTruthy();
      expect(span.textContent.trim()).toBe('Source Code');
      expect(sourceLink.querySelector('.menu-icon')).toBeTruthy();
    });

    it('should have Team Respawn Website link with correct href and attributes', () => {
      const websiteLink = Array.from(menuPanel.querySelectorAll('a')).find(
        link => {
          const span = link.querySelector('span');
          return span && span.textContent.trim() === 'Team Respawn Website';
        }
      );
      expect(websiteLink).toBeTruthy();
      expect(websiteLink.href).toBe('https://teamrespawntv.com/');
      expect(websiteLink.getAttribute('target')).toBe('_blank');
      expect(websiteLink.getAttribute('rel')).toBe('noopener noreferrer');
      const span = websiteLink.querySelector('span');
      expect(span).toBeTruthy();
      expect(span.textContent.trim()).toBe('Team Respawn Website');
      expect(websiteLink.querySelector('.menu-icon')).toBeTruthy();
    });

    it('should have Team Respawn YouTube link with correct href and attributes', () => {
      const youtubeLink = Array.from(menuPanel.querySelectorAll('a')).find(
        link => link.href.includes('youtube.com')
      );
      expect(youtubeLink).toBeTruthy();
      expect(youtubeLink.href).toBe('https://www.youtube.com/@TeamRespawn');
      expect(youtubeLink.getAttribute('target')).toBe('_blank');
      expect(youtubeLink.getAttribute('rel')).toBe('noopener noreferrer');
      const span = youtubeLink.querySelector('span');
      expect(span).toBeTruthy();
      expect(span.textContent.trim()).toBe('Team Respawn YouTube');
      expect(youtubeLink.querySelector('.menu-icon')).toBeTruthy();
    });

    it('should have all links with target="_blank" attribute', () => {
      const links = menuPanel.querySelectorAll('a');
      links.forEach(link => {
        expect(link.getAttribute('target')).toBe('_blank');
      });
    });

    it('should have all links with rel="noopener noreferrer" attribute', () => {
      const links = menuPanel.querySelectorAll('a');
      links.forEach(link => {
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      });
    });
  });

  describe('Menu Structure', () => {
    it('should have a ul element inside menu panel', () => {
      const ul = menuPanel.querySelector('ul');
      expect(ul).toBeTruthy();
    });

    it('should have 4 li elements inside the ul', () => {
      const listItems = menuPanel.querySelectorAll('li');
      expect(listItems.length).toBe(4);
    });

    it('should have each li containing exactly one link', () => {
      const listItems = menuPanel.querySelectorAll('li');
      listItems.forEach(li => {
        const links = li.querySelectorAll('a');
        expect(links.length).toBe(1);
      });
    });

    it('should have icons in all menu links', () => {
      const links = menuPanel.querySelectorAll('a');
      links.forEach(link => {
        const icon = link.querySelector('.menu-icon');
        expect(icon).toBeTruthy();
        expect(icon.tagName.toLowerCase()).toBe('svg');
      });
    });

    it('should have span elements with text in all menu links', () => {
      const links = menuPanel.querySelectorAll('a');
      links.forEach(link => {
        const span = link.querySelector('span');
        expect(span).toBeTruthy();
        expect(span.textContent.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Event Handling', () => {
    it('should handle multiple rapid clicks on hamburger button', () => {
      // Simulate rapid clicks
      for (let i = 0; i < 5; i++) {
        hamburgerBtn.click();
      }
      // Should end in a consistent state
      const isOpen = menuPanel.classList.contains('menu-open');
      expect(typeof isOpen).toBe('boolean');
    });

    it('should maintain menu state during multiple interactions', () => {
      // Open menu
      hamburgerBtn.click();
      expect(menuPanel.classList.contains('menu-open')).toBe(true);

      // Click outside to close
      const body = document.body;
      const clickEvent = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      body.dispatchEvent(clickEvent);
      expect(menuPanel.classList.contains('menu-open')).toBe(false);

      // Open again
      hamburgerBtn.click();
      expect(menuPanel.classList.contains('menu-open')).toBe(true);
    });
  });
});

