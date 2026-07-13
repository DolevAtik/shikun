import { Module } from "@nestjs/common";
import { HomeModule } from "../home/home.module";
import { AdminController } from "./admin.controller";
import { AdminHomeController } from "./home.controller";
import { AdminHomeService } from "./home.service";
import { AuditService } from "./audit.service";
import { ContentController } from "./content.controller";
import { AdminContentRepository } from "./content.repository";
import { DashboardService } from "./dashboard.service";
import { EventsController } from "./events.controller";
import { SearchService } from "./search.service";
import { TelemetryService } from "./telemetry.service";

@Module({
  imports: [HomeModule],
  controllers: [AdminController, EventsController, ContentController, AdminHomeController],
  providers: [
    DashboardService,
    SearchService,
    AuditService,
    TelemetryService,
    AdminContentRepository,
    AdminHomeService,
  ],
  exports: [AuditService, TelemetryService],
})
export class AdminModule {}
