import { describe, it, expect } from "vitest";
import { normalizeVideoUrl, isEmbedVideo } from "@/lib/video";

describe("normalizeVideoUrl", () => {
  it("converts a YouTube watch URL to an embed URL", () => {
    expect(normalizeVideoUrl("https://www.youtube.com/watch?v=gSSsZReIFRk")).toBe(
      "https://www.youtube.com/embed/gSSsZReIFRk",
    );
  });

  it("converts a youtu.be short link to an embed URL", () => {
    expect(normalizeVideoUrl("https://youtu.be/gSSsZReIFRk")).toBe(
      "https://www.youtube.com/embed/gSSsZReIFRk",
    );
  });

  it("converts a YouTube Shorts URL to an embed URL", () => {
    expect(normalizeVideoUrl("https://www.youtube.com/shorts/abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("converts a Vimeo URL to a player embed URL", () => {
    expect(normalizeVideoUrl("https://vimeo.com/76979871")).toBe(
      "https://player.vimeo.com/video/76979871",
    );
  });

  it("passes through an already-embed URL unchanged", () => {
    const embed = "https://www.youtube.com/embed/gSSsZReIFRk";
    expect(normalizeVideoUrl(embed)).toBe(embed);
  });

  it("passes through a direct file URL unchanged", () => {
    const file = "https://xyz.supabase.co/storage/v1/object/public/media/videos/a/b.mp4";
    expect(normalizeVideoUrl(file)).toBe(file);
  });

  it("trims whitespace and tolerates non-URL input", () => {
    expect(normalizeVideoUrl("  not a url  ")).toBe("not a url");
  });
});

describe("isEmbedVideo", () => {
  it("treats YouTube/Vimeo hosts as embeds", () => {
    expect(isEmbedVideo("https://www.youtube.com/embed/x")).toBe(true);
    expect(isEmbedVideo("https://player.vimeo.com/video/1")).toBe(true);
  });

  it("treats a direct media file as a non-embed", () => {
    expect(
      isEmbedVideo("https://xyz.supabase.co/storage/v1/object/public/media/a.mp4"),
    ).toBe(false);
  });

  it("returns false for malformed URLs", () => {
    expect(isEmbedVideo("nonsense")).toBe(false);
  });
});
