import { ArgumentMetadata, BadRequestException, Body, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Validates a request body against the shared zod contract.
 *
 * The contracts package is the single source of truth for request shapes — the
 * API and the clients compile against the same schema, so a drift between them
 * is a type error rather than a production bug.
 *
 * Note this is a pipe rather than a `createParamDecorator`: Nest sniffs a
 * decorator's argument for a `.transform` method to decide whether it is a
 * pipe, and every zod schema has one. Passing a schema as decorator data makes
 * Nest silently swallow it as a pipe and hand the factory `undefined`.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: "הבקשה אינה תקינה",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }
}

/** `@ZodBody(LoginRequestSchema) body: LoginRequest` — validated and typed. */
export const ZodBody = (schema: ZodSchema) => Body(new ZodValidationPipe(schema));
