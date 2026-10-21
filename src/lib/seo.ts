// src/lib/seo.ts
// Utilidades de SEO compartidas por las páginas públicas (servidor).

import type { Metadata } from "next";

export function urlBase(): string {
  const valor = process.env.NEXT_PUBLIC_URL?.trim();
  if (valor) return valor.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export function urlAbsoluta(ruta: string): string {
  const base = urlBase();
  if (!ruta || ruta === "/") return base;
  return `${base}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
}

interface OpcionesMetadatos {
  titulo: string;
  descripcion: string;
  ruta?: string;
  tipo?: "website" | "article";
  imagen?: string;
}

export function metadatosPublicos({
  titulo,
  descripcion,
  ruta,
  tipo = "website",
  imagen,
}: OpcionesMetadatos): Metadata {
  const url = ruta ? urlAbsoluta(ruta) : undefined;
  const image = imagen ? urlAbsoluta(imagen) : undefined;

  return {
    title: titulo,
    description: descripcion,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: titulo,
      description: descripcion,
      type: tipo,
      locale: "es_ES",
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: titulo,
      description: descripcion,
    },
  };
}

export function jsonLd(objeto: Record<string, unknown>): string {
  return JSON.stringify(objeto).replace(/</g, "\\u003c");
}
