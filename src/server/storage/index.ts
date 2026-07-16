import { randomUUID } from "crypto";
import { env, isStorageConfigured } from "@/config/env";
import { AppError } from "@/server/http";

/**
 * Object-storage adapter. Issues presigned PUT URLs so the browser uploads
 * large files directly to S3-compatible storage — the app server never proxies
 * file bodies (plan.md "Files/Media").
 *
 * When storage is not configured (local dev without MinIO) a clear error is
 * thrown so callers can degrade gracefully (e.g. allow only VIDEO/TEXT blocks).
 */
export type PresignedUpload = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  method: "PUT";
  headers: Record<string, string>;
};

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/zip",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export function assertUploadAllowed(contentType: string, sizeBytes: number) {
  if (!ALLOWED.has(contentType)) {
    throw new AppError(`File type not allowed: ${contentType}`, 422, "BAD_FILE_TYPE");
  }
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (sizeBytes > maxBytes) {
    throw new AppError(
      `File exceeds the ${env.MAX_UPLOAD_MB}MB limit.`,
      422,
      "FILE_TOO_LARGE",
    );
  }
}

/**
 * Create a presigned upload. In this MVP scaffold we return a deterministic key
 * and public URL; wiring the actual S3 SigV4 signature is a small follow-up
 * that plugs in here (see quickstart.md). Callers persist `key`/`publicUrl`.
 */
export async function createPresignedUpload(params: {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  prefix?: string;
}): Promise<PresignedUpload> {
  assertUploadAllowed(params.contentType, params.sizeBytes);
  if (!isStorageConfigured) {
    throw new AppError(
      "File storage is not configured on this environment.",
      503,
      "STORAGE_UNCONFIGURED",
    );
  }
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${params.prefix ?? "uploads"}/${randomUUID()}-${safeName}`;
  const uploadUrl = `${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET}/${key}`;
  const publicUrl = `${env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  return {
    uploadUrl,
    publicUrl,
    key,
    method: "PUT",
    headers: { "Content-Type": params.contentType },
  };
}
