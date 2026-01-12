/**
 * Base HTML layout component
 */
import type { Child } from "hono/jsx";
import { siteMetadata } from "../../data/docs.ts";
import { basePath } from "../lib/path.ts";
import { themeInitScript } from "./scripts.ts";
import { Header } from "../components/Header.js";
import { SearchModal } from "../components/SearchModal.js";
import { ScrollToTop } from "../components/ScrollToTop.js";

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
        <link rel="stylesheet" href={basePath("/common.css")} />
        <link rel="stylesheet" href={basePath("/content.css")} />
        <link rel="icon" href={basePath("/favicon.ico")} />
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
        <Header />
        {children}
        <SearchModal />
        <ScrollToTop />
        <script src={basePath("/pagefind/pagefind-ui.js")} />
        <script type="module" src={basePath("/static/client.js")} />
      </body>
    </html>
  );
}
