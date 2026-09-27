import { Module } from "@nestjs/common";
import { ProgressionModule } from "../progression/progression.module";
import { WorldController } from "./world.controller";
import { WorldService } from "./world.service";

@Module({
  imports: [ProgressionModule],
  controllers: [WorldController],
  providers: [WorldService],
  exports: [WorldService],
})
export class WorldModule {}
