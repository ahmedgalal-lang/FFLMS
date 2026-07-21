import { db } from "@/server/db";
import type { Principal } from "@/server/access/policy";
import { AppError } from "@/server/http";
import { env } from "@/config/env";

/**
 * Database-backed file storage. Files (lesson attachments, assignment
 * submissions) are stored as bytes in the DB and served via /api/files/{id}.
 * No external object storage required. Keep the cap modest — large media does
 * not belong in a relational DB.
 */

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

/** Max bytes for a DB-stored file. Bounded well under the request-body limit. */
export const MAX_FILE_BYTES = Math.min(env.MAX_UPLOAD_MB, 5) * 1024 * 1024;

export async function storeFile(
  principal: Principal,
  file: {
    fileName: string;
    contentType: string;
    bytes: Uint8Array;
  },
) {
  if (!ALLOWED.has(file.contentType)) {
    throw new AppError(`File type not allowed: ${file.contentType}`, 422, "BAD_FILE_TYPE");
  }
  if (file.bytes.length > MAX_FILE_BYTES) {
    throw new AppError(
      `File exceeds the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB limit.`,
      422,
      "FILE_TOO_LARGE",
    );
  }
  const safeName = file.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 200);
  // Copy into a fresh (non-shared) ArrayBuffer-backed view for Prisma's Bytes.
  const data = new Uint8Array(file.bytes.length);
  data.set(file.bytes);
  const asset = await db.fileAsset.create({
    data: {
      fileName: safeName,
      contentType: file.contentType,
      size: data.length,
      data,
      uploadedById: principal.id,
    },
    select: { id: true, fileName: true, size: true },
  });
  return { id: asset.id, name: asset.fileName, size: asset.size, url: `/api/files/${asset.id}` };
}

export async function getFile(id: string) {
  return db.fileAsset.findUnique({
    where: { id },
    select: { fileName: true, contentType: true, data: true },
  });
}
