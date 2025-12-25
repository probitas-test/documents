/**
 * Base HTML layout component
 */
import type { Child } from "hono/jsx";
import { basePath, docPages, siteMetadata } from "../data/docs.ts";
import { mainScript, themeInitScript } from "./scripts.ts";

const GITHUB_URL = "https://github.com/probitas-test/probitas";

const CDN = {
  fonts:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
  // Pin to v3.25.0 - v3.26+ has rendering issues where icons appear filled/black
  // See: https://github.com/tabler/tabler-icons/issues/1310
  tablerIcons:
    "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.25.0/dist/tabler-icons.min.css",
  hljs: "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build",
};

interface LayoutProps {
  title: string;
  children: Child;
  /** URL path to alternate markdown source (for doc pages) */
  alternateMarkdown?: string;
  /** URL path to alternate JSON data (for API pages) */
  alternateJson?: string;
  /** Page description for SEO and JSON-LD */
  description?: string;
  /** Current page path for JSON-LD */
  pagePath?: string;
}

function generateJsonLd(
  title: string,
  description: string,
  pagePath?: string,
): object {
  const baseUrl = siteMetadata.baseUrl;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "name": title,
    "headline": title,
    "description": description,
    "url": pagePath ? `${baseUrl}${pagePath}` : baseUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": siteMetadata.name,
      "url": baseUrl,
      "description": siteMetadata.description,
    },
    "publisher": {
      "@type": "Organization",
      "name": siteMetadata.name,
      "url": baseUrl,
    },
  };
}

export function Layout(
  {
    title,
    children,
    alternateMarkdown,
    alternateJson,
    description,
    pagePath,
  }: LayoutProps,
) {
  const pageDescription = description || siteMetadata.description;
  const jsonLd = generateJsonLd(title, pageDescription, pagePath);

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={pageDescription} />
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
        <link rel="stylesheet" href={`${basePath}/static/content.css`} />
        <link rel="icon" href={`${basePath}/static/favicon.ico`} />
        <link
          id="hljs-theme"
          rel="stylesheet"
          href={`${CDN.hljs}/styles/github-dark.min.css`}
        />
        {/* Pagefind UI CSS intentionally not loaded - using custom styles in content.css */}
        {alternateMarkdown && (
          <link
            rel="alternate"
            type="text/markdown"
            href={alternateMarkdown}
            title="Markdown source"
          />
        )}
        {alternateJson && (
          <link
            rel="alternate"
            type="application/json"
            href={alternateJson}
            title="JSON data"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Header />
        {children}
        <SearchModal />
        <ScrollToTop />
        <script src={`${basePath}/pagefind/pagefind-ui.js`} />
        <script dangerouslySetInnerHTML={{ __html: searchScript }} />
        <script dangerouslySetInnerHTML={{ __html: scrollToTopScript }} />
        <script dangerouslySetInnerHTML={{ __html: mainScript }} />
      </body>
    </html>
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

function Header() {
  return (
    <header class="global-header">
      <a href={`${basePath}/`} class="logo">
        <img
          src={`${basePath}/static/probitas.png`}
          alt="Probitas"
          class="logo-img"
        />
        <span class="logo-text">Probitas</span>
      </a>
      <button
        type="button"
        class="mobile-menu-toggle"
        onclick="toggleMobileMenu()"
        aria-label="Toggle menu"
      >
        <i class="ti ti-menu-2 icon-menu" />
        <i class="ti ti-x icon-close" />
      </button>
      <nav class="header-nav">
        {docPages.map((doc) => (
          <a key={doc.path} href={`${basePath}${doc.path}`}>{doc.label}</a>
        ))}
        <a href={`${basePath}/api/`}>API</a>
      </nav>
      <div class="header-right">
        <button
          type="button"
          class="search-toggle"
          onclick="openSearch()"
          aria-label="Search"
        >
          <i class="ti ti-search" />
          <span class="search-shortcut">⌘K</span>
        </button>
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
