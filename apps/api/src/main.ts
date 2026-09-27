import { Logger } from "@nestjs/common";
import { createApp } from "./bootstrap";

async function bootstrap() {
  const app = await createApp();

  // PORT when a host injects one; API_PORT is the local convention.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  new Logger("Bootstrap").log(`API listening on port ${port}, under /api`);
}

void bootstrap();
