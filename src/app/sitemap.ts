import type { MetadataRoute } from "next";
import { obtenerSecciones } from "@/services/secciones";
import { seccionActiva } from "@/lib/panel-tema";
import { listarArticulosPublicos } from "@/services/blog-publico";
import { urlAbsoluta } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [secciones, articulos] = await Promise.all([
    obtenerSecciones(),
    listarArticulosPublicos(100).catch(() => []),
  ]);

  const ahora = new Date();
  const entradas: MetadataRoute.Sitemap = [
    {
      url: urlAbsoluta("/"),
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: urlAbsoluta("/inicio"),
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: urlAbsoluta("/sobre-mi"),
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: urlAbsoluta("/contacto"),
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: urlAbsoluta("/politica-privacidad"),
      lastModified: ahora,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  if (seccionActiva(secciones, "services")) {
    entradas.push({
      url: urlAbsoluta("/servicios"),
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  if (seccionActiva(secciones, "faq")) {
    entradas.push({
      url: urlAbsoluta("/faq"),
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }
  if (seccionActiva(secciones, "booking")) {
    entradas.push({
      url: urlAbsoluta("/pide-cita"),
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }
  if (seccionActiva(secciones, "blog")) {
    entradas.push({
      url: urlAbsoluta("/blog"),
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.7,
    });
    for (const articulo of articulos) {
      entradas.push({
        url: urlAbsoluta(`/blog/${articulo.slug}`),
        lastModified: articulo.publishedAt ? new Date(articulo.publishedAt) : ahora,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entradas;
}
