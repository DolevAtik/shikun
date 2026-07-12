import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  // Validation is zod, via @ZodBody against the shared contracts — so there is
  // no class-validator pipe here on purpose.
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  });

  // Hosting platforms inject the port as PORT and expect us to bind every
  // interface; API_PORT is the local convention.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  new Logger("Bootstrap").log(`API listening on port ${port}, under /api`);
}

void bootstrap();
