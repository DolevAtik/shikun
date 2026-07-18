# Contributing

## Setup

Follow [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) to get the stack running locally.

## Ground rules

- **Contracts first.** Any shape that crosses the wire is defined in
  `packages/contracts` and imported by both the API and the clients. Do not hand-write a
  duplicate type in an app — change the contract and let the compiler find the callers.
- **RTL-first CSS.** Use logical properties (`ms-`/`me-`, `start`/`end`, `text-start`).
  Physical directions (`ml-`, `text-left`, …) are rejected by `check-logical-props.mjs`.
- **Accessibility is a gate, not a review.** New colors must pass contrast at card scale;
  images require alt text at publish time (enforced by the API). Run `pnpm check:a11y`.
- **Authorization on the server.** The API guard is the enforcement point. The admin UI
  reflecting a permission is not a substitute for `@RequirePermissions(...)` on the route.
- **Match the surrounding code.** Comment density, naming, and idiom are consistent per
  package — follow the file you are editing.

## Before you push

The same checks CI runs, in order of speed:

```bash
pnpm typecheck      # must be green
pnpm lint           # a11y gates + turbo lint
pnpm test           # unit tests
pnpm build          # must build
pnpm test:e2e       # Playwright + axe, if you touched UI (needs servers up)
```

## Database changes

- Edit `apps/api/prisma/schema.prisma`.
- Locally: `pnpm db:push` to sync, or `pnpm db:migrate` to create a migration.
- Production runs `prisma migrate deploy` on every release (see `render.yaml`), so a schema
  change must ship as a committed migration under `apps/api/prisma/migrations/`.
- Reseed with `pnpm db:reset` (wipes the local database).

## Commit conventions

Keep commit messages descriptive of the change — a reviewer should understand the "why"
from the log without opening the diff.

## Planning larger work

Non-trivial features start with a planning document in `docs/planning/` (see
`CLAUDE.md`): research, then codebase inspection, then a written plan — no code in a
planning session.
