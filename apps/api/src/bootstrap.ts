import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";

/**
 * The configured application, not yet listening.
 *
 * Shared by the two ways the API runs: a long-lived process locally (main.ts)
 * and a Vercel function in production (serverless.ts). Everything that shapes
 * a request lives here, so the two cannot drift apart.
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Explicit limits so a runaway client cannot pin the process with a huge body.
  app.use(json({ limit: "1mb" }));
  app.use(urlencoded({ extended: true, limit: "1mb" }));

  app.setGlobalPrefix("api");
  // Validation is zod, via @ZodBody against the shared contracts — so there is
  // no class-validator pipe here on purpose.
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  });

  return app;
}
