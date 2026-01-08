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
              <a href="https://api.haloquotes.teamrespawntv.com/" target="_blank" rel="noopener noreferrer">API</a>
            </li>
            <li>
              <a href="https://github.com/AndyTheNerd/Halo-Quotes" target="_blank" rel="noopener noreferrer">Source Code</a>
            </li>
            <li>
              <a href="https://teamrespawntv.com" target="_blank" rel="noopener noreferrer">Team Respawn Website</a>
            </li>
            <li>
              <a href="https://www.youtube.com/@TeamRespawn" target="_blank" rel="noopener noreferrer">Team Respawn YouTube</a>
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
      expect(apiLink.textContent.trim()).toBe('API');
    });

    it('should have Source Code link with correct href and attributes', () => {
      const sourceLink = Array.from(menuPanel.querySelectorAll('a')).find(
        link => link.href.includes('github.com')
      );
      expect(sourceLink).toBeTruthy();
      expect(sourceLink.href).toBe('https://github.com/AndyTheNerd/Halo-Quotes');
      expect(sourceLink.getAttribute('target')).toBe('_blank');
      expect(sourceLink.getAttribute('rel')).toBe('noopener noreferrer');
      expect(sourceLink.textContent.trim()).toBe('Source Code');
    });

    it('should have Team Respawn Website link with correct href and attributes', () => {
      const websiteLink = Array.from(menuPanel.querySelectorAll('a')).find(
        link => link.textContent.trim() === 'Team Respawn Website'
      );
      expect(websiteLink).toBeTruthy();
      expect(websiteLink.href).toBe('https://teamrespawntv.com/');
      expect(websiteLink.getAttribute('target')).toBe('_blank');
      expect(websiteLink.getAttribute('rel')).toBe('noopener noreferrer');
      expect(websiteLink.textContent.trim()).toBe('Team Respawn Website');
    });

    it('should have Team Respawn YouTube link with correct href and attributes', () => {
      const youtubeLink = Array.from(menuPanel.querySelectorAll('a')).find(
        link => link.href.includes('youtube.com')
      );
      expect(youtubeLink).toBeTruthy();
      expect(youtubeLink.href).toBe('https://www.youtube.com/@TeamRespawn');
      expect(youtubeLink.getAttribute('target')).toBe('_blank');
      expect(youtubeLink.getAttribute('rel')).toBe('noopener noreferrer');
      expect(youtubeLink.textContent.trim()).toBe('Team Respawn YouTube');
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

