import { Module } from "@nestjs/common";
import { ProgressionController } from "./progression.controller";
import { ProgressionService } from "./progression.service";
import { RecognitionService } from "./recognition.service";

@Module({
  controllers: [ProgressionController],
  providers: [ProgressionService, RecognitionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}
