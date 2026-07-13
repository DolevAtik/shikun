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

/**
 * Storage keys are ASCII. Supabase — and S3-compatible stores generally —
 * reject a key containing Hebrew with `InvalidKey`, so "דוח שנתי.pdf" cannot be
 * the key. It does not have to be: `Media.fileName` carries the name the
 * employee sees, and the key stays opaque.
 */
export function sanitize(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const rawName = dot > 0 ? fileName.slice(0, dot) : fileName;
  const rawExtension = dot > 0 ? fileName.slice(dot + 1) : "";

  const name = rawName
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60);
  const extension = rawExtension.replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toLowerCase();

  // A name with nothing ASCII left in it — a wholly Hebrew filename — would
  // otherwise sanitize down to an empty string.
  const safeName = /[A-Za-z0-9]/.test(name) ? name : "file";
  return extension ? `${safeName}.${extension}` : safeName;
}
