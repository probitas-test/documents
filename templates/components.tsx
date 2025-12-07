/**
 * Shared UI components for documentation pages
 */
import type { Child } from "hono/jsx";

interface TocItem {
  id: string;
  label: string;
}

interface TableOfContentsProps {
  items: readonly TocItem[];
}

/** Table of contents navigation */
export function TableOfContents({ items }: TableOfContentsProps) {
  return (
    <nav class="toc">
      <h3>On this page</h3>
      <ul>
        {items.map((item) => (
          <li>
            <a href={`#${item.id}`}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface DocLayoutProps {
  sidebar: Child;
  children: Child;
}

/** Two-column documentation layout */
export function DocLayout({ sidebar, children }: DocLayoutProps) {
  return (
    <div class="doc-layout">
      <aside class="doc-sidebar">{sidebar}</aside>
      <main class="doc-content">{children}</main>
    </div>
  );
}
