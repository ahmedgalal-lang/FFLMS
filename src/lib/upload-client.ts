"use client";

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
