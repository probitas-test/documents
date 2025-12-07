/**
 * Home page JSX template
 */
import { clients } from "../data/clients.ts";
import { features } from "../data/features.ts";
import { loadSampleCodes, type SampleCode } from "../data/sample_codes.ts";
import { Layout } from "./Layout.tsx";
import { mainScript } from "./scripts.ts";

function CarouselTabs({ sampleCodes }: { sampleCodes: SampleCode[] }) {
  return (
    <>
      {sampleCodes.map((sample, i) => (
        <button
          type="button"
          class={`carousel-tab${i === 0 ? " active" : ""}`}
          data-index={i}
        >
          {sample.label}
        </button>
      ))}
    </>
  );
}

function CarouselSlides({ sampleCodes }: { sampleCodes: SampleCode[] }) {
  return (
    <>
      {sampleCodes.map((sample, i) => (
        <div class={`carousel-slide${i === 0 ? " active" : ""}`} data-index={i}>
          <div class="code-header">
            <span class="code-dot" />
            <span class="code-dot" />
            <span class="code-dot" />
            <span class="code-title">{sample.title}</span>
          </div>
          <pre>
            <code class="language-typescript">{sample.code}</code>
          </pre>
        </div>
      ))}
    </>
  );
}

function Features() {
  return (
    <>
      {features.map((f) => (
        <div class="feature">
          <div class="feature-icon">{f.icon}</div>
          <h3>{f.title}</h3>
          <p>{f.description}</p>
        </div>
      ))}
    </>
  );
}

function ClientTags() {
  return (
    <>
      {clients.map((c) => (
        <a href={c.url} class="client-tag" target="_blank" rel="noopener">
          {c.name}
        </a>
      ))}
    </>
  );
}

function Hero({ sampleCodes }: { sampleCodes: SampleCode[] }) {
  return (
    <section class="hero">
      <div class="hero-badge">
        <span>●</span> TypeScript Native
      </div>
      <h1 class="hero-title">Probitas</h1>
      <p class="tagline">
        Scenario-based testing framework designed for API, database, and message
        queue testing
      </p>
      <div class="cta-group">
        <a href="/docs" class="btn btn-primary">
          Get Started
        </a>
        <a href="/docs/scenario" class="btn btn-secondary">
          Learn Scenarios
        </a>
      </div>

      <div class="code-carousel">
        <div class="carousel-tabs">
          <CarouselTabs sampleCodes={sampleCodes} />
        </div>
        <div class="carousel-container">
          <button
            type="button"
            class="carousel-nav carousel-prev"
            aria-label="Previous"
          >
            <i class="ti ti-chevron-left" />
          </button>
          <div class="code-preview">
            <CarouselSlides sampleCodes={sampleCodes} />
          </div>
          <button
            type="button"
            class="carousel-nav carousel-next"
            aria-label="Next"
          >
            <i class="ti ti-chevron-right" />
          </button>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section class="features">
      <Features />
    </section>
  );
}

function ClientsSection() {
  return (
    <section class="clients-section">
      <div class="section-header">
        <span class="section-icon">📡</span>
        <h2>Built-in Clients</h2>
      </div>
      <p>Test any backend service with ready-to-use clients</p>
      <div class="client-grid">
        <ClientTags />
      </div>
    </section>
  );
}

function AiFriendlySection() {
  return (
    <section class="ai-friendly-section">
      <div class="section-header">
        <span class="section-icon">🤖</span>
        <h2>AI-Friendly Documentation</h2>
      </div>
      <p class="ai-friendly-description">
        This documentation follows the{" "}
        <a href="https://llmstxt.org/" target="_blank" rel="noopener">
          llms.txt standard
        </a>
        , making it easy for AI assistants like Claude, ChatGPT, and GitHub
        Copilot to understand and reference.
      </p>

      <div class="ai-friendly-grid">
        <div class="ai-friendly-card">
          <div class="ai-friendly-card-header">
            <i class="ti ti-file-text" />
            <span>/llms.txt</span>
          </div>
          <p>
            An index of all documentation pages with descriptions. AI agents use
            this as a "sitemap" to discover available content.
          </p>
          <a href="/llms.txt" class="ai-friendly-link">
            View llms.txt <i class="ti ti-arrow-right" />
          </a>
        </div>

        <div class="ai-friendly-card">
          <div class="ai-friendly-card-header">
            <i class="ti ti-file-stack" />
            <span>Root Markdown</span>
          </div>
          <p>
            Access <code>/</code> with <code>curl</code> or an
            <code>Accept: text/markdown</code>{" "}
            header to get an LLM-friendly Markdown overview. Add{" "}
            <code>?human=1</code> for the full HTML page.
          </p>
          <a href="/?human=1" class="ai-friendly-link">
            View human homepage <i class="ti ti-arrow-right" />
          </a>
        </div>

        <div class="ai-friendly-card">
          <div class="ai-friendly-card-header">
            <i class="ti ti-markdown" />
            <span>Raw Markdown</span>
          </div>
          <p>
            Every documentation page has a <code>.md</code> endpoint (e.g.,{" "}
            <code>/docs.md</code>) returning clean Markdown source.
          </p>
          <a href="/docs.md" class="ai-friendly-link">
            Example: /docs.md <i class="ti ti-arrow-right" />
          </a>
        </div>
      </div>
    </section>
  );
}

export async function HomePage() {
  const sampleCodes = await loadSampleCodes();

  return (
    <Layout
      title="Probitas - Scenario-based Testing Framework"
      showLogo={false}
    >
      <Hero sampleCodes={sampleCodes} />
      <FeaturesSection />
      <ClientsSection />
      <AiFriendlySection />
      <script dangerouslySetInnerHTML={{ __html: mainScript }} />
    </Layout>
  );
}
