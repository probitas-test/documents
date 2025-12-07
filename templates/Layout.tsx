/**
 * Base HTML layout component
 */
import type { Child } from "hono/jsx";
import { docPages } from "../data/docs.ts";
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
}

export function Layout({ title, children, showLogo = true }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
        <link
          id="hljs-theme"
          rel="stylesheet"
          href={`${CDN.hljs}/styles/github-dark.min.css`}
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
    <header>
      {showLogo
        ? (
          <a href="/" class="logo">
            <img src="/static/probitas.png" alt="Probitas" class="logo-img" />
            <span>Probitas</span>
          </a>
        )
        : <div />}
      <nav class="header-nav">
        {docPages.map((doc) => <a key={doc.path} href={doc.path}>{doc.label}
        </a>)}
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
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}
