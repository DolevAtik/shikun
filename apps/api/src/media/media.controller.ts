import { Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { z } from "zod";
import { RequirePermissions } from "../auth/decorators";
import { ZodBody } from "../common/zod-body.decorator";
import { MediaService, type PresignedUpload } from "./media.service";

const PresignRequestSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post("presign")
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @RequirePermissions("content:publish")
  presign(
    @ZodBody(PresignRequestSchema) body: { fileName: string; contentType: string },
  ): Promise<PresignedUpload> {
    return this.media.presign(body.fileName, body.contentType);
  }
}
