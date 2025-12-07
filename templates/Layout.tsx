/**
 * Base HTML layout component
 */
import type { Child } from "hono/jsx";
import { docPages, siteMetadata } from "../data/docs.ts";
import { themeInitScript } from "./scripts.ts";

const GITHUB_URL = "https://github.com/jsr-probitas/probitas";

const CDN = {
  fonts:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
  tablerIcons:
    "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css",
  hljs: "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build",
};

interface LayoutProps {
  title: string;
  children: Child;
  /** Show logo in header (default: true) */
  showLogo?: boolean;
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
    showLogo = true,
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
        <link rel="stylesheet" href="/static/style.css" />
        <link rel="icon" href="/static/favicon.ico" />
        <link
          id="hljs-theme"
          rel="stylesheet"
          href={`${CDN.hljs}/styles/github-dark.min.css`}
        />
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
        <script src={`${CDN.hljs}/highlight.min.js`} />
        <script src={`${CDN.hljs}/languages/typescript.min.js`} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Header showLogo={showLogo} />
        {children}
      </body>
    </html>
  );
}

function Header({ showLogo }: { showLogo: boolean }) {
  return (
    <header class="global-header">
      {showLogo
        ? (
          <a href="/" class="logo">
            <img src="/static/probitas.png" alt="Probitas" class="logo-img" />
            <span class="logo-text">Probitas</span>
          </a>
        )
        : <div />}
      <nav class="header-nav">
        {docPages.map((doc) => <a key={doc.path} href={doc.path}>{doc.label}
        </a>)}
        <a href="/api">API</a>
      </nav>
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
