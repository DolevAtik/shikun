# API Documentation

NestJS modular monolith. All routes are under the global prefix **`/api`**. Bodies are
validated against the shared zod contracts (`@moch/contracts`) via `@ZodBody`; errors are
shaped by a single `HttpExceptionFilter`.

## Authentication & authorization

- **Auth is on by default.** A route is public only if it carries `@Public()`.
- Access is a **JWT** in the `Authorization: Bearer` header (or, from the frontends, an
  httpOnly cookie the Next proxy converts to a Bearer). Default TTL 15 min (`JWT_ACCESS_TTL`).
- **Refresh tokens are opaque**, stored hashed server-side; `POST /auth/refresh` rotates
  them. Default TTL 7 days (`JWT_REFRESH_TTL`).
- **Authorization is opt-in per route** with `@RequirePermissions(...)` — every listed
  permission is required. Scope (which district/department a manager may act on) is
  enforced separately by the audience rules on the data. See the role→permission matrix in
  [ARCHITECTURE.md](ARCHITECTURE.md#authorization-model).

## Rate limiting

Global ceiling **120 req/min** (`ThrottlerGuard`). Tightened routes: `login` 10/min,
`refresh` 30/min, `media/presign` 20/min.

## Endpoints

Legend: 🔓 public · 🔒 authenticated · 🛡 requires the listed permission(s).

### Auth — `/api/auth`
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/auth/login` | 🔓 | 10/min |
| POST | `/auth/refresh` | 🔓 | 30/min; rotates the refresh token |
| POST | `/auth/logout` | 🔓 | revokes the refresh token |
| GET | `/auth/me` | 🔒 | current user + resolved permissions |

### Health — `/api/health`
| Method | Path | Access |
|---|---|---|
| GET | `/health` | 🔓 |

### Home — `/api/home`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/home` | 🔒 | ordered, viewer-resolved sections |

### Feed — `/api/feed`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/feed/channels` | 🔒 | |
| POST | `/feed/channels/:slug/follow` | 🔒 | |
| DELETE | `/feed/channels/:slug/follow` | 🔒 | |
| GET | `/feed/posts` | 🔒 | paginated |
| GET | `/feed/posts/:id` | 🔒 | |
| POST | `/feed/posts` | 🛡 `content:publish` | |
| POST | `/feed/posts/:id/like` | 🔒 | |
| POST | `/feed/posts/:id/bookmark` | 🔒 | |
| GET | `/feed/posts/:id/comments` | 🔒 | |
| POST | `/feed/posts/:id/comments` | 🔒 | |
| DELETE | `/feed/comments/:commentId` | 🔒 | author-scoped |

### Jobs — `/api/jobs`
| Method | Path | Access |
|---|---|---|
| GET | `/jobs` | 🔒 |

### Services — `/api/services`
| Method | Path | Access |
|---|---|---|
| GET | `/services` | 🔒 |

### Org — `/api/org`
| Method | Path | Access |
|---|---|---|
| GET | `/org/districts` | 🔒 |
| GET | `/org/departments` | 🔒 |
| GET | `/org/organizations` | 🔒 |

### Media — `/api/media`
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/media/presign` | 🛡 `content:publish` | 20/min; returns a presigned S3 upload URL |

### Telemetry — `/api/events`
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/events` | 🔒 | batched analytics beacon from the employee app; **not** under `/admin` by design — an ordinary employee posts without `admin:access` |

### Admin — `/api/admin` (all require 🛡 `admin:access` at minimum)
| Method | Path | Extra permission |
|---|---|---|
| GET | `/admin/dashboard` | — |
| GET | `/admin/search` | — |
| GET | `/admin/content` | — |
| POST | `/admin/content` | `content:publish` |
| POST | `/admin/content/bulk` | `content:edit` |
| GET | `/admin/content/:id` | — |
| PATCH | `/admin/content/:id` | `content:edit` |
| POST | `/admin/content/:id/publish` | `content:publish` |
| POST | `/admin/content/:id/unpublish` | `content:edit` |
| POST | `/admin/content/:id/archive` | `content:edit` |
| GET | `/admin/home/sections` | `feeds:manage` |
| PUT | `/admin/home/sections` | `feeds:manage` |

## Contracts

Request/response shapes live in `packages/contracts/src/` and are imported by the API and
both clients: `admin`, `audience`, `feed`, `home`, `jobs`, `list` (pagination), `org`,
`roles`, `services`, `user`. Changing a shape there is a single edit that re-typechecks
every consumer.
