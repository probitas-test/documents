# Probitas Documentation

Documentation site for Probitas - a scenario-based testing framework for Deno.

Repository: `probitas/documents`

## Quick Reference

- **Runtime**: Deno 2.x
- **Framework**: Hono (web server)
- **Deploy**: GitHub Pages (`https://jsr-probitas.github.io/documents`)

## Commands

```bash
deno task dev      # Start dev server with watch mode
deno task start    # Start production server
deno task check    # Type check all .ts files
deno task verify   # Run fmt, lint, and check
deno task build    # Build static site for deployment
```

## Deployment

This project is deployed to **GitHub Pages** as a static site.

### Build Process

1. Run `deno task build` to generate static files in `dist/`
2. GitHub Actions automatically deploys on push to main branch

### Local Development

- `deno task dev` - Start dev server with hot reload
- `deno task start` - Start production server locally

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
deno task verify
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
