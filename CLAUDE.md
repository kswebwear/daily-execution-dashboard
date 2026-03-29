# CLAUDE.md — Daily Execution Dashboard

## Project

Personal productivity dashboard. Next.js App Router, Tailwind CSS, Firebase (Firestore + Auth), deployed on Vercel.

Working directory: `ded-app/`

## Spec Files

- **R1 spec:** `DED-V1.md` — locked, do not modify
- **V2+ spec:** `DED-V2+.md` — always check before implementing any feature

## Git Practices

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <short description>

<optional body>

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

**Types:**

| Type | Use |
|------|-----|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `style` | CSS/UI-only changes |
| `docs` | Documentation only |
| `chore` | Tooling, config, dependencies |

**Scope** = version number or feature area:
- `feat(v2.8): momentum mode`
- `fix(v2.7.1): prompt user for daily commitment`
- `style(streak): full-width layout polish`
- `docs: update README`

### Git Tags

Tag every version release on the commit that completes it:

```bash
git tag v2.8
git push origin v2.8
```

This enables `git checkout v2.7`, `git diff v2.6..v2.7`, and clean rollbacks.

### Feature Branches

For each new version (V2.8, V2.9, etc.):

```bash
git checkout -b feat/v2.8-momentum-mode
# ... develop and commit ...
git checkout main
git merge feat/v2.8-momentum-mode
git tag v2.8
git push origin main --tags
git branch -d feat/v2.8-momentum-mode
```

**Exception:** Single-commit hotfixes can go directly to main.

### Commit Discipline

- **One logical change per commit.** Don't bundle unrelated changes.
- **Each commit should be independently revertable.**
- **Spec updates** (`DED-V2+.md`) go in the same commit as the feature they document.
- **Never force push to main.** Wrong commit? Revert with a new commit.
- **Never skip hooks** (`--no-verify`).

## Architectural Rules

- V1 core task behavior must never change
- Firestore schema changes must be backward compatible (all new fields optional)
- No heavy third-party libraries
- Theme system is CSS variables only
- Analytics compute client-side from already-fetched data
- No destructive migration of Firestore documents

## Build & Deploy

```bash
npm run dev          # local development
npx next build       # production build (verify before committing)
git push origin main # auto-deploys to Vercel
```

## Key Directories

```
app/          Pages, layout, globals.css
components/   React components
context/      ThemeContext, AuthContext, PomodoroContext
lib/          Types, storage, firestore, utilities
```
