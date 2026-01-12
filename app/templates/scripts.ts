/**
 * Inline scripts for SSG pages
 *
 * These scripts are embedded inline in the HTML to run before external scripts load.
 * Main functionality is in client.ts which is bundled as a module.
 */

/** Theme initialization script (runs before render to prevent FOUC) */
export const themeInitScript = `(function() {
  const stored = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (systemPrefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();`;
