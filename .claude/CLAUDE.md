# Probitas Documentation

Documentation site for Probitas - a scenario-based testing framework for Deno.

Repository: `probitas/documents`

## Quick Reference

- **Runtime**: Deno 2.x
- **Framework**: Hono (web server)
- **Deploy**: New Deno Deploy (`documents.probitas.deno.net`)

## Commands

```bash
deno task dev      # Start dev server with watch mode
deno task start    # Start production server
deno check main.ts # Type check
```

## Deployment

This project uses the **new Deno Deploy** (not Deploy Classic).

### Key Differences from Deploy Classic

| Feature | New Deno Deploy | Deploy Classic |
| --- | --- | --- |
| URL format | `{app}.{org}.deno.net` | `{project}.deno.dev` |
| Console | `console.deno.com` | `dash.deno.com` |
| Build | Integrated CI/CD or external | External only (`deployctl`) |
| CLI | `deno` CLI built-in | Separate `deployctl` |

### New Deno Deploy Features

- **Integrated CI/CD**: Connect GitHub repo for automatic branch deploys and
  previews
- **`--tunnel` flag**: `deno run --tunnel` exposes local dev to public URL with
  environment variables from dashboard
- **OpenTelemetry**: Built-in logging, tracing, and metrics
- **Framework detection**: Auto-detects Hono and optimizes configuration

### Deployment Methods

1. **GitHub Integration** (recommended): Connect repo, auto-deploy on push
2. **Manual trigger**: Select branch and trigger build from console
3. **Local tunnel**: `deno run --tunnel main.ts` for testing with production env

### Console Access

- Dashboard: https://console.deno.com

## Related Documentation

- [Architecture](./architecture.md) - Site structure and design decisions
- [Content](./content.md) - Documentation content guidelines

---

## STRICT RULES (MUST FOLLOW)

### 1. Git Commit Restriction

**NEVER commit without explicit user permission.**

- Commits are forbidden by default
- Only perform a commit ONCE when the user explicitly grants permission
- After committing, MUST recite this rule:
  > "Reminder: Commits are forbidden by default. I will not commit again unless
  > explicitly permitted."

### 2. Backup Before Destructive Operations

**ALWAYS create a backup before any operation that may lose working tree
state.**

Examples: `git restore`, `git reset`, `git checkout` (with uncommitted changes),
`git stash drop`, file deletion/overwrite of uncommitted work.

### 3. Pre-Completion Verification

BEFORE reporting task completion, run and ensure zero errors/warnings:

```bash
deno check main.ts
```

### 4. English for Version-Controlled Content

**Use English for ALL content tracked by Git** (code, comments, documentation,
commit messages).

### 5. Worktree Isolation

- **Stay in worktree**: Never leave `.worktrees/{branch}/` during worktree tasks
- **No git stash**: Use backup branches instead (stash is shared across
  worktrees)

### 6. Reference Probitas Packages

When referencing `@probitas/*` API or documentation:

- Use `deno doc --json jsr:@probitas/{package}` for API data
- Check `../probitas/` for core framework source code
- Check `../probitas-client/` for client package source code
