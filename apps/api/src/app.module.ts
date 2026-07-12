import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "./auth/guards/permissions.guard";
import { PrismaModule } from "./common/prisma/prisma.module";
import { FeedModule } from "./feed/feed.module";
import { HomeModule } from "./home/home.module";
import { MediaModule } from "./media/media.module";
import { OrgModule } from "./org/org.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    PrismaModule,
    AuthModule,
    HomeModule,
    FeedModule,
    OrgModule,
    MediaModule,
  ],
  providers: [
    // Authentication is on by default; routes opt out with @Public().
    // Authorization is opt-in per route with @RequirePermissions().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
