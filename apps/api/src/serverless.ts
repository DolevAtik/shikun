import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./bootstrap";

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * The Vercel function entry point (see api/index.js).
 *
 * The Nest app is built once per function instance and reused by every request
 * that instance serves — only a cold instance pays for module init and the
 * Prisma connection. The promise, not the result, is cached, so concurrent
 * requests on a cold instance share one boot instead of racing to start several.
 */
let handler: Promise<Handler> | undefined;

async function boot(): Promise<Handler> {
  const app = await createApp();
  await app.init();
  return app.getHttpAdapter().getInstance() as Handler;
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  handler ??= boot().catch((error: unknown) => {
    // A failed boot must not be cached: the next request should try again.
    handler = undefined;
    throw error;
  });
  (await handler)(req, res);
}
