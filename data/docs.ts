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
  /** Brief description for LLM indexing and SEO */
  description: string;
}

export const docPages: DocPage[] = [
  {
    path: "/AI/",
    file: "./AI.md",
    title: "AI Scenario Testing",
    label: "AI",
    description:
      "How to have AI write and run Probitas scenario tests with Claude plugins",
  },
  {
    path: "/docs/",
    file: "./docs/overview.md",
    title: "Overview",
    label: "Overview",
    description: "Introduction to Probitas, quick start, and core concepts",
  },
  {
    path: "/docs/installation/",
    file: "./docs/installation.md",
    title: "Installation",
    label: "Installation",
    description:
      "Install Probitas CLI via shell script, Homebrew, or Nix flake with project integration",
  },
  {
    path: "/docs/scenario/",
    file: "./docs/scenario.md",
    title: "Scenario",
    label: "Scenario",
    description:
      "How to write test scenarios with resources, setup hooks, and steps",
  },
  {
    path: "/docs/client/",
    file: "./docs/client.md",
    title: "Client",
    label: "Client",
    description:
      "Client API reference for HTTP, SQL, gRPC, GraphQL, Redis, MongoDB, and more",
  },
  {
    path: "/docs/expect/",
    file: "./docs/expect.md",
    title: "Expect",
    label: "Expect",
    description:
      "Type-safe assertion API for HTTP, SQL, Redis, MongoDB, and other client responses",
  },
  {
    path: "/docs/configuration/",
    file: "./docs/configuration.md",
    title: "Configuration",
    label: "Configuration",
    description:
      "Configuration options for timeouts, retries, and customization",
  },
];

/** Site-wide metadata for LLM and SEO */
export const siteMetadata = {
  name: "Probitas",
  tagline: "Scenario-based testing framework for Deno",
  description:
    "Probitas is a scenario-based testing framework for Deno that enables declarative, readable integration tests for APIs, databases, message queues, and other backend services.",
  github: "https://github.com/probitas-test/probitas",
  jsr: "https://jsr.io/@probitas/probitas",
  baseUrl: Deno.env.get("BASE_URL") ??
    "https://probitas-test.github.io/documents",
};

/**
 * Base path for all URLs (e.g., "/documents" for GitHub Pages).
 * Set via BASE_PATH environment variable, defaults to empty string.
 */
export const basePath = Deno.env.get("BASE_PATH") ?? "";
