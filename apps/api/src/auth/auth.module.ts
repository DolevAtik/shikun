import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { AUTH_PROVIDER } from "./providers/auth-provider";
import { LocalAuthProvider } from "./providers/local-auth.provider";

@Module({
  imports: [ConfigModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Swap this binding for an EntraAuthProvider and the rest of the API is
    // unchanged — that is the whole point of the AuthProvider interface.
    { provide: AUTH_PROVIDER, useClass: LocalAuthProvider },
  ],
  exports: [AuthService],
})
export class AuthModule {}
