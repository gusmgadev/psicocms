// src/lib/revalidar-web.ts
// Revalida las páginas públicas cuando la psicóloga cambia contenido de la web.

import "server-only";
import { revalidatePath } from "next/cache";

export function revalidarWebPublica(): void {
  revalidatePath("/");
  revalidatePath("/inicio");
  revalidatePath("/sobre-mi");
  revalidatePath("/servicios");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/faq");
  revalidatePath("/pide-cita");
  revalidatePath("/contacto");
  revalidatePath("/politica-privacidad");
  revalidatePath("/sitemap.xml");
}
