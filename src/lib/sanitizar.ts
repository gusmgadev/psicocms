// src/lib/sanitizar.ts
// Saneado de HTML de editores wysiwyg (blog, plantillas, historias).
// Único camino permitido para renderizar HTML con dangerouslySetInnerHTML.

import DOMPurify from "isomorphic-dompurify";

export function sanitizarHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
