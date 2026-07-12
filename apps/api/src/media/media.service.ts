import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

export interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Media never passes through the API. The client asks for a presigned URL,
 * uploads straight to object storage, then sends us the resulting URL.
 *
 * MinIO locally, any S3 bucket in production — the API only speaks S3, so the
 * production bucket is a config change rather than a code change.
 */
@Injectable()
export class MediaService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(config: ConfigService) {
    const endpoint = config.get<string>("S3_ENDPOINT") ?? "http://localhost:9000";
    this.bucket = config.get<string>("S3_BUCKET") ?? "moch-media";
    // A managed bucket is read over its own public domain, which is not the S3
    // API endpoint. MinIO has no such domain, hence the path-style fallback.
    this.publicBase = config.get<string>("S3_PUBLIC_URL") ?? `${endpoint}/${this.bucket}`;

    this.client = new S3Client({
      endpoint,
      region: config.get<string>("S3_REGION") ?? "us-east-1",
      credentials: {
        accessKeyId: config.get<string>("S3_ACCESS_KEY") ?? "moch_minio",
        secretAccessKey: config.get<string>("S3_SECRET_KEY") ?? "moch_dev_password",
      },
      // MinIO serves buckets as a path, not as a subdomain. So does R2.
      forcePathStyle: true,
    });
  }

  async presign(fileName: string, contentType: string): Promise<PresignedUpload> {
    const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${sanitize(fileName)}`;

    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: 900 },
    );

    return { uploadUrl, publicUrl: `${this.publicBase}/${key}`, key };
  }
}

function sanitize(fileName: string): string {
  // Keep Hebrew letters — a file called "דוח שנתי.pdf" should survive the round trip.
  return fileName.replace(/[^\p{L}\p{N}._-]/gu, "-").slice(-80);
}
