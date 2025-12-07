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
      <h2>Supported Clients</h2>
      <p>Test any backend service with built-in clients</p>
      <div class="client-grid">
        <ClientTags />
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
      <script dangerouslySetInnerHTML={{ __html: mainScript }} />
    </Layout>
  );
}
