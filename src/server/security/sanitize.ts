import sanitizeHtml from "sanitize-html";

/**
 * Sanitize instructor-authored rich text before it is stored and later rendered
 * with dangerouslySetInnerHTML. Allows a safe subset of formatting tags and
 * strips scripts, event handlers, and dangerous URLs (XSS defense).
 */
export function sanitizeRichText(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p", "br", "b", "strong", "i", "em", "u", "s", "blockquote",
      "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
      "a", "code", "pre", "hr", "span",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      span: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      // Force safe rel on links that open a new tab.
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer nofollow",
          ...(attribs.target ? { target: "_blank" } : {}),
        },
      }),
    },
  });
}
