import { describe, it, expect } from "vitest";
import {
  normalizeVideoUrl,
  isEmbedVideo,
  videoProvider,
  youTubeId,
  vimeoId,
} from "@/lib/video";

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

  it("converts a Google Drive share link to a preview embed", () => {
    expect(
      normalizeVideoUrl("https://drive.google.com/file/d/1AbCdEf/view?usp=sharing"),
    ).toBe("https://drive.google.com/file/d/1AbCdEf/preview");
  });

  it("converts a Google Drive open?id link to a preview embed", () => {
    expect(
      normalizeVideoUrl("https://drive.google.com/open?id=1AbCdEf"),
    ).toBe("https://drive.google.com/file/d/1AbCdEf/preview");
  });

  it("leaves an already-preview Drive URL unchanged", () => {
    const preview = "https://drive.google.com/file/d/1AbCdEf/preview";
    expect(normalizeVideoUrl(preview)).toBe(preview);
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
  it("treats YouTube/Vimeo/Drive hosts as embeds", () => {
    expect(isEmbedVideo("https://www.youtube.com/embed/x")).toBe(true);
    expect(isEmbedVideo("https://player.vimeo.com/video/1")).toBe(true);
    expect(isEmbedVideo("https://drive.google.com/file/d/1AbCdEf/preview")).toBe(true);
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

describe("videoProvider", () => {
  it("classifies providers", () => {
    expect(videoProvider("https://www.youtube.com/embed/x")).toBe("youtube");
    expect(videoProvider("https://player.vimeo.com/video/1")).toBe("vimeo");
    expect(videoProvider("https://drive.google.com/file/d/x/preview")).toBe(
      "embed",
    );
    expect(
      videoProvider("https://xyz.supabase.co/storage/v1/object/public/m/a.mp4"),
    ).toBe("file");
  });
});

describe("id extraction", () => {
  it("pulls YouTube ids from several URL forms", () => {
    expect(youTubeId("https://www.youtube.com/embed/gSSsZReIFRk")).toBe(
      "gSSsZReIFRk",
    );
    expect(youTubeId("https://youtu.be/gSSsZReIFRk")).toBe("gSSsZReIFRk");
    expect(youTubeId("https://www.youtube.com/watch?v=gSSsZReIFRk")).toBe(
      "gSSsZReIFRk",
    );
  });

  it("pulls Vimeo ids", () => {
    expect(vimeoId("https://player.vimeo.com/video/76979871")).toBe("76979871");
    expect(vimeoId("https://vimeo.com/76979871")).toBe("76979871");
    expect(vimeoId("https://vimeo.com/not-a-number")).toBeNull();
  });
});
