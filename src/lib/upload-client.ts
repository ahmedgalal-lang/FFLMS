"use client";

import { upload } from "@vercel/blob/client";

/**
 * Upload a file directly to Vercel Blob via the app's token endpoint
 * (`/api/uploads`). Returns the public URL and original file name. Throws with a
 * readable message the caller can surface.
 */
export async function uploadFile(
  file: File,
  prefix: string,
): Promise<{ url: string; name: string; size: number }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await upload(`${prefix}/${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/uploads",
    contentType: file.type || undefined,
  });
  return { url: blob.url, name: file.name, size: file.size };
}
