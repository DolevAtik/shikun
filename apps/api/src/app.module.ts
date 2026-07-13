import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "./auth/guards/permissions.guard";
import { HealthController } from "./common/health.controller";
import { PrismaModule } from "./common/prisma/prisma.module";
import { FeedModule } from "./feed/feed.module";
import { HomeModule } from "./home/home.module";
import { JobsModule } from "./jobs/jobs.module";
import { MediaModule } from "./media/media.module";
import { OrgModule } from "./org/org.module";
import { ServicesModule } from "./services/services.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    // Global ceiling; sensitive routes can tighten further with @Throttle().
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    HomeModule,
    ServicesModule,
    JobsModule,
    FeedModule,
    OrgModule,
    MediaModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // Authentication is on by default; routes opt out with @Public().
    // Authorization is opt-in per route with @RequirePermissions().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
