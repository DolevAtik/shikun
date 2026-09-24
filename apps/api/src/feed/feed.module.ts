import { Module } from "@nestjs/common";
import { WorldModule } from "../world/world.module";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";

@Module({
  imports: [WorldModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
