/**
 * Documentation pages configuration
 */

export interface DocPage {
  /** URL path (e.g., "/docs/scenario") */
  path: string;
  /** Markdown file path relative to project root */
  file: string;
  /** Page title suffix */
  title: string;
  /** Navigation label */
  label: string;
}

export const docPages: DocPage[] = [
  {
    path: "/docs",
    file: "./docs/overview.md",
    title: "Overview",
    label: "Overview",
  },
  {
    path: "/docs/scenario",
    file: "./docs/scenario.md",
    title: "Scenario",
    label: "Scenario",
  },
  {
    path: "/docs/client",
    file: "./docs/client.md",
    title: "Client",
    label: "Client",
  },
  {
    path: "/docs/configuration",
    file: "./docs/configuration.md",
    title: "Configuration",
    label: "Configuration",
  },
];
