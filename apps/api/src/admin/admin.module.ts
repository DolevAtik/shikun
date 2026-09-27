import { Module } from "@nestjs/common";
import { HomeModule } from "../home/home.module";
import { ProgressionModule } from "../progression/progression.module";
import { AdminController } from "./admin.controller";
import { AdminHomeController } from "./home.controller";
import { AdminHomeService } from "./home.service";
import { AdminHomeDataService } from "./home-data.service";
import { AdminServicesController } from "./services.controller";
import { AdminServicesService } from "./services.service";
import { AdminSessionsController } from "./sessions.controller";
import { AdminCommunityController } from "./community.controller";
import { AdminCommunityService } from "./community.service";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { ContentController } from "./content.controller";
import { AdminContentRepository } from "./content.repository";
import { DashboardService } from "./dashboard.service";
import { DistrictsController } from "./districts.controller";
import { AdminDistrictsService } from "./districts.service";
import { EmployeesController } from "./employees.controller";
import { AdminEmployeesRepository } from "./employees.repository";
import { EventsController } from "./events.controller";
import { SearchService } from "./search.service";
import { TelemetryService } from "./telemetry.service";
import { AdminQuestsController, AdminWorldMetricsController } from "./world.controller";
import { AdminWorldService } from "./world.service";

@Module({
  imports: [HomeModule, ProgressionModule],
  controllers: [
    AdminController,
    EventsController,
    ContentController,
    AdminHomeController,
    EmployeesController,
    DistrictsController,
    AuditController,
    AdminQuestsController,
    AdminWorldMetricsController,
    AdminServicesController,
    AdminSessionsController,
    AdminCommunityController,
  ],
  providers: [
    DashboardService,
    SearchService,
    AuditService,
    TelemetryService,
    AdminContentRepository,
    AdminHomeService,
    AdminEmployeesRepository,
    AdminDistrictsService,
    AdminWorldService,
    AdminHomeDataService,
    AdminServicesService,
    AdminCommunityService,
  ],
  exports: [AuditService, TelemetryService],
})
export class AdminModule {}
