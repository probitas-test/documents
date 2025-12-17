/**
 * Home page layout - separate from doc/api pages
 *
 * The home page has a distinct design with:
 * - Absolute positioned header (overlays hero)
 * - No logo in header (hero has the branding)
 * - Full-width sections
 */
import type { Child } from "hono/jsx";
import { basePath, siteMetadata } from "../data/docs.ts";
import { themeInitScript } from "./scripts.ts";

const GITHUB_URL = "https://github.com/jsr-probitas/probitas";

const CDN = {
  fonts:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
  tablerIcons:
    "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.25.0/dist/tabler-icons.min.css",
  hljs: "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build",
};

interface HomeLayoutProps {
  title: string;
  children: Child;
}

function generateJsonLd(title: string, description: string): object {
  const baseUrl = siteMetadata.baseUrl;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": title,
    "headline": title,
    "description": description,
    "url": baseUrl,
    "publisher": {
      "@type": "Organization",
      "name": siteMetadata.name,
      "url": baseUrl,
    },
  };
}

export function HomeLayout({ title, children }: HomeLayoutProps) {
  const description = siteMetadata.description;
  const jsonLd = generateJsonLd(title, description);

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={description} />
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="anonymous"
        />
        <link href={CDN.fonts} rel="stylesheet" />
        <link rel="stylesheet" href={CDN.tablerIcons} />
        <link rel="stylesheet" href={`${basePath}/static/common.css`} />
        <link rel="stylesheet" href={`${basePath}/static/home.css`} />
        <link rel="icon" href={`${basePath}/static/favicon.ico`} />
        <link
          id="hljs-theme"
          rel="stylesheet"
          href={`${CDN.hljs}/styles/github-dark.min.css`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script src={`${CDN.hljs}/highlight.min.js`} />
        <script src={`${CDN.hljs}/languages/typescript.min.js`} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body class="page-home">
        <HomeHeader />
        {children}
        <SearchModal />
        <ScrollToTop />
        <script src={`${basePath}/pagefind/pagefind-ui.js`} />
        <script dangerouslySetInnerHTML={{ __html: searchScript }} />
        <script dangerouslySetInnerHTML={{ __html: scrollToTopScript }} />
      </body>
    </html>
  );
}

function HomeHeader() {
  return (
    <header class="home-header">
      <div />
      <div />
      <div class="header-right">
        <button
          type="button"
          class="theme-toggle"
          onclick="toggleTheme()"
          aria-label="Toggle theme"
        >
          <i class="ti ti-sun icon-sun" />
          <i class="ti ti-moon icon-moon" />
        </button>
        <a
          href={GITHUB_URL}
          class="github-link"
          target="_blank"
          rel="noopener"
        >
          <i class="ti ti-brand-github" />
          <span class="github-text">GitHub</span>
        </a>
      </div>
    </header>
  );
}

function SearchModal() {
  return (
    <div
      id="search-modal"
      class="search-modal"
      onclick="closeSearchOnBackdrop(event)"
    >
      <div class="search-modal-content">
        <div class="search-modal-header">
          <span class="search-modal-title">Search Documentation</span>
          <button
            type="button"
            class="search-modal-close"
            onclick="closeSearch()"
            aria-label="Close search"
          >
            <i class="ti ti-x" />
          </button>
        </div>
        <div id="search-container" />
      </div>
    </div>
  );
}

function ScrollToTop() {
  return (
    <button
      type="button"
      id="scroll-to-top"
      class="scroll-to-top"
      onclick="scrollToTop()"
      aria-label="Scroll to top"
    >
      <i class="ti ti-chevron-up" />
    </button>
  );
}

const scrollToTopScript = `
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
  const btn = document.getElementById('scroll-to-top');
  if (window.scrollY > 300) {
    btn.classList.add('visible');
  } else {
    btn.classList.remove('visible');
  }
});
`;

const searchScript = `
let searchInitialized = false;

function openSearch() {
  const modal = document.getElementById('search-modal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (!searchInitialized && typeof PagefindUI !== 'undefined') {
    new PagefindUI({
      element: '#search-container',
      showSubResults: true,
      showImages: false,
    });
    searchInitialized = true;
  }

  setTimeout(() => {
    const input = modal.querySelector('.pagefind-ui__search-input');
    if (input) input.focus();
  }, 100);
}

function closeSearch() {
  const modal = document.getElementById('search-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function closeSearchOnBackdrop(event) {
  if (event.target.id === 'search-modal') {
    closeSearch();
  }
}

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    closeSearch();
  }
});
`;
