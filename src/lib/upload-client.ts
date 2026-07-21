"use client";

import { createVideoUploadTicketAction } from "@/app/(teach)/studio/actions";

/**
 * Upload a file to the app's database-backed file store (`POST /api/files`).
 * Returns the served URL, original name, and size. Throws with a readable
 * message the caller can surface. No external storage required.
 */
export async function uploadFile(
  file: File,
): Promise<{ url: string; name: string; size: number }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/files", { method: "POST", body: form });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.message ?? "Upload failed.");
  }
  return { url: body.url, name: body.name, size: body.size };
}

/**
 * Upload a video by streaming it *directly* to Supabase Storage via a
 * server-minted signed URL (bypassing the app's request-body limit). Returns
 * the public URL to store on the VIDEO content block.
 */
export async function uploadVideo(file: File): Promise<{ url: string }> {
  const result = await createVideoUploadTicketAction({
    fileName: file.name,
    contentType: file.type || "video/mp4",
    size: file.size,
  });
  if ("error" in result) throw new Error(result.error);
  const { uploadUrl, publicUrl, contentType } = result.ticket;

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType, "x-upsert": "true" },
    body: file,
  });
  if (!put.ok) {
    const detail = (await put.text().catch(() => "")).slice(0, 200);
    throw new Error(`Upload to storage failed (${put.status}). ${detail}`.trim());
  }
  return { url: publicUrl };
}
