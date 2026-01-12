/**
 * Home page layout - separate from doc/api pages
 *
 * The home page has a distinct design with:
 * - Absolute positioned header (overlays hero)
 * - No logo in header (hero has the branding)
 * - Full-width sections
 */
import type { Child } from "hono/jsx";
import { siteMetadata } from "../../data/docs.ts";
import { basePath } from "../lib/path.ts";
import { themeInitScript } from "./scripts.ts";
import { SearchModal } from "../components/SearchModal.js";
import { ScrollToTop } from "../components/ScrollToTop.js";

const GITHUB_URL = "https://github.com/probitas-test/probitas";

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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KP54C7F4');`,
          }}
        />
        {/* End Google Tag Manager */}
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
        <link rel="stylesheet" href={basePath("/common.css")} />
        <link rel="stylesheet" href={basePath("/home.css")} />
        <link rel="icon" href={basePath("/favicon.ico")} />
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KP54C7F4"
            height="0"
            width="0"
            style="display:none;visibility:hidden"
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <HomeHeader />
        {children}
        <SearchModal />
        <ScrollToTop />
        <script src={basePath("/pagefind/pagefind-ui.js")} />
        <script type="module" src={basePath("/static/client.js")} />
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
