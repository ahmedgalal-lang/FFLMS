/**
 * Pure helpers for classifying and normalizing lesson video URLs. Shared by the
 * authoring editor and the course player, so this module must stay free of any
 * server-only imports (safe to bundle on the client).
 */

const YT_HOSTS = ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"];
const VIMEO_HOSTS = ["vimeo.com", "www.vimeo.com", "player.vimeo.com"];

/**
 * Convert common YouTube/Vimeo share URLs to their embeddable player URL so an
 * instructor can paste a normal link (e.g. a `watch?v=…` or `youtu.be/…` URL)
 * and still get a working embed. Direct file URLs and already-embed URLs pass
 * through unchanged.
 */
export function normalizeVideoUrl(input: string): string {
  const raw = input.trim();
  if (!raw) return raw;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }
  const host = u.hostname.toLowerCase();

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube.com/embed/${id}` : raw;
  }
  if (YT_HOSTS.includes(host)) {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
    if (u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : raw;
    }
    return raw; // already an /embed/… URL
  }
  if (VIMEO_HOSTS.includes(host) && !host.startsWith("player.")) {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : raw;
  }
  return raw;
}

/**
 * True when the URL is an embeddable third-party player page (rendered in an
 * `<iframe>`); false for a direct media file (rendered in a `<video>` element).
 */
export function isEmbedVideo(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      YT_HOSTS.includes(host) ||
      VIMEO_HOSTS.includes(host) ||
      host.endsWith("youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}
