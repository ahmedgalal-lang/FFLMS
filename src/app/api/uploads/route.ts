import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requirePrincipal } from "@/server/auth";
import { env, isStorageConfigured } from "@/config/env";
import { toErrorResponse, AppError } from "@/server/http";

const ALLOWED_CONTENT_TYPES = [
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
];

/**
 * Client-upload token endpoint for Vercel Blob. The browser calls this via
 * `upload()` (see src/lib/upload-client.ts); we authenticate the user and issue
 * a scoped, size/type-limited upload token, then the file streams straight to
 * Blob storage — never through this serverless function.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!isStorageConfigured) {
      throw new AppError(
        "File uploads are not enabled yet. Connect a Vercel Blob store (Storage tab) and redeploy.",
        503,
        "STORAGE_UNCONFIGURED",
      );
    }
    const body = (await request.json()) as HandleUploadBody;

    const json = await handleUpload({
      body,
      request,
      token: env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => {
        // Only authenticated users may upload.
        await requirePrincipal();
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      // Fires as a server-to-server webhook after upload; the client also
      // receives the URL directly, which is what we persist.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(json);
  } catch (err) {
    return toErrorResponse(err);
  }
}
