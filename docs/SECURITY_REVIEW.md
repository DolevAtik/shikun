# Security Review

Scope: authentication, authorization, session handling, input validation, file uploads,
secrets, and error handling of the API and the two Next.js frontends. This is a static
review of the current `main`; no penetration testing was performed.

**Overall posture: strong.** The security-critical paths are deliberately designed and,
in the case of the audience resolver, the most heavily tested code in the repo. The
findings below are hardening recommendations, not active exploits. Nothing here was
changed automatically — each item is behavior-adjacent and left for an explicit decision.

## What is done well

- **Tokens never reach client JavaScript.** Access and refresh tokens live in httpOnly,
  `sameSite=lax`, `secure`-in-production cookies (`web|admin/src/lib/session.ts`). Client
  components call a same-origin proxy that attaches the Bearer token server-side. An XSS
  bug does not become a session-theft bug.
- **Refresh tokens are opaque and single-use.** Random 48-byte strings stored **hashed**
  (SHA-256), rotated on every use; a replayed token is already revoked
  (`auth.service.ts`). They carry no claims, so they cannot be forged.
- **Passwords** are verified through the `AuthProvider` interface using **argon2**.
- **Layered guards**, applied globally in order: throttle → authenticate → authorize
  (`app.module.ts`). Auth is on by default (`@Public()` to opt out); authorization is
  explicit per route (`@RequirePermissions`). The API — not the UI — is the enforcement
  point, and scope is checked independently by the audience rules.
- **Input validation** is zod against shared contracts on every write (`@ZodBody`).
- **Error handling** never leaks stack traces; unhandled errors return a generic 500 while
  logging the stack server-side (`http-exception.filter.ts`). Auth failures return
  identical generic messages, so they do not reveal whether an email exists.
- **Abuse limits**: global 120 req/min, with `login` 10/min, `refresh` 30/min,
  `media/presign` 20/min. Request bodies are capped at 1 MB (`main.ts`).
- **CORS** is an explicit origin allow-list from `WEB_ORIGIN` (`main.ts`).
- **Upload keys** are namespaced (`YYYY-MM-DD/uuid-name`) and sanitized to ASCII with all
  path separators stripped — no path traversal, no key collision.

## Findings

### F-1 — `JWT_SECRET` falls back to a public dev value (Medium)
`issueTokens` signs with `config.get("JWT_SECRET") ?? "dev-only-change-me"`
(`auth.service.ts:70`). If the variable is ever unset in a deployed environment, the API
silently signs tokens with a value that is committed to the repo — anyone could forge a
valid access token. This is mitigated in practice by `render.yaml`
(`generateValue: true`), but the fallback removes the safety net.
**Recommendation:** fail fast at startup when `JWT_SECRET` is unset and
`NODE_ENV === "production"`. The same reasoning applies to the S3 credential fallbacks
(lower severity — a bad value makes uploads fail rather than forging identity).

### F-2 — Media presign has no content-type allow-list or size limit (Medium)
`MediaService.presign` signs a `PutObjectCommand` with a caller-supplied `contentType` and
no size constraint (`media.service.ts:45`). A holder of `content:publish` can obtain a
presigned URL for an arbitrary type (e.g. `text/html`) and arbitrary size. If the media
bucket is ever served from an origin the app trusts, an uploaded HTML file becomes a
stored-XSS vector; a very large upload is an availability/cost concern.
**Recommendation:** validate `contentType` against an allow-list (images + PDF) before
signing, and enforce a max size — either a presigned POST policy with
`content-length-range`, or a `ContentLength`/`ContentLengthRange` constraint. Serve media
from a distinct host (already the intended production shape via `S3_PUBLIC_URL`).

### F-3 — CSRF relies on `sameSite=lax` alone (Low / informational)
There is no anti-CSRF token. In practice this is well mitigated: cookies are `sameSite=lax`
(not sent on cross-site `POST`), state-changing requests go through the same-origin proxy,
and there are no cookie-authenticated cross-site form posts. Adequate for the current
design; revisit if a future flow needs `sameSite=none`.

### F-4 — Access cookie outlives the access token (Informational)
The access cookie has an 8-hour `maxAge` while the JWT TTL is 15 minutes. This is
intentional — the proxy transparently rotates via the refresh token on a 401 — and is
noted only so it is not mistaken for a bug.

## Suggested priority

1. **F-1** — one guard clause at bootstrap; removes a silent-forgery failure mode.
2. **F-2** — content-type allow-list + size cap on presign.
3. F-3 / F-4 — no action required now; documented for future changes.
