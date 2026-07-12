import type { User } from "@prisma/client";

/**
 * The seam that matters most in the whole codebase.
 *
 * Today credentials are verified against our own password hashes. Tomorrow the
 * Ministry authenticates against Microsoft Entra ID, and that becomes a second
 * implementation of this interface — an `EntraAuthProvider` that validates an
 * OIDC token and maps Entra groups onto our roles.
 *
 * Nothing outside this folder knows which provider is in use, so the migration
 * touches this directory and nowhere else.
 */
export interface AuthProvider {
  readonly name: string;

  /**
   * Verify a credential and return the matching user, or null.
   * `secret` is a password today, an OIDC id_token tomorrow.
   */
  verify(identifier: string, secret: string): Promise<User | null>;
}

export const AUTH_PROVIDER = Symbol("AUTH_PROVIDER");
