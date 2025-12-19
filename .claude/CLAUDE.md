# Probitas Documentation Site

Documentation for Probitas - a scenario-based testing framework for Deno.

## Quick Reference

- **Runtime**: Deno 2.x
- **Framework**: Hono
- **Deploy**: GitHub Pages

## Commands

```bash
deno task dev      # Dev server with watch
deno task verify   # Run fmt, lint, check, test
deno task build    # Build static site
```

## Pre-Completion Verification

BEFORE reporting task completion, run and ensure zero errors:

```bash
deno task verify
```

## Reference Probitas Packages

When referencing `@probitas/*` API:

- Use `deno doc jsr:@probitas/{package}` for API data
- Check `../probitas/` for core framework source
- Check `../probitas-client/` for client package source
