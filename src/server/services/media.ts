import { randomUUID } from "node:crypto";
import type { Principal } from "@/server/access/policy";
import { AppError } from "@/server/http";
import { env, isSupabaseStorageEnabled } from "@/config/env";

/**
 * Large-media (video) uploads via Supabase Storage. The server mints a
 * short-lived signed upload URL; the browser then uploads the file *directly* to
 * Supabase, so the bytes never traverse the app server (Vercel caps request
 * bodies at ~4.5MB, which makes DB-backed video upload impossible in
 * production). The resulting public URL is stored on the VIDEO content block.
 */

export function isVideoUploadEnabled() {
  return isSupabaseStorageEnabled;
}

export type VideoUploadTicket = {
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
};

export async function createVideoUploadTicket(
  principal: Principal,
  input: { fileName: string; contentType: string; size: number },
): Promise<VideoUploadTicket> {
  if (principal.role !== "INSTRUCTOR" && principal.role !== "ADMIN") {
    throw new AppError("Not allowed to upload media.", 403, "FORBIDDEN");
  }
  if (!isSupabaseStorageEnabled) {
    throw new AppError(
      "Video upload is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (and create the storage bucket), or paste a YouTube/Vimeo link instead.",
      501,
      "STORAGE_NOT_CONFIGURED",
    );
  }
  if (!input.contentType.startsWith("video/")) {
    throw new AppError("Only video files can be uploaded here.", 422, "BAD_FILE_TYPE");
  }
  const maxBytes = env.MAX_VIDEO_MB * 1024 * 1024;
  if (input.size > maxBytes) {
    throw new AppError(
      `Video exceeds the ${env.MAX_VIDEO_MB}MB limit.`,
      422,
      "FILE_TOO_LARGE",
    );
  }

  const base = env.SUPABASE_URL.replace(/\/+$/, "");
  const bucket = env.SUPABASE_STORAGE_BUCKET;
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "video";
  const objectPath = `videos/${principal.id}/${randomUUID()}-${safeName}`;
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");

  const res = await fetch(
    `${base}/storage/v1/object/upload/sign/${bucket}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
    },
  );
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new AppError(
      `Could not start the upload (${res.status}). Confirm the '${bucket}' bucket exists and is public. ${detail}`.trim(),
      502,
      "STORAGE_ERROR",
    );
  }
  const body = (await res.json().catch(() => null)) as { url?: string } | null;
  if (!body?.url) {
    throw new AppError("Storage did not return an upload URL.", 502, "STORAGE_ERROR");
  }
  const signedPath = body.url.startsWith("/") ? body.url : `/${body.url}`;

  return {
    uploadUrl: `${base}/storage/v1${signedPath}`,
    publicUrl: `${base}/storage/v1/object/public/${bucket}/${encodedPath}`,
    contentType: input.contentType,
  };
}
