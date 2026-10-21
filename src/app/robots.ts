import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/panel-psicologa",
          "/acceso-psicologa",
          "/instalacion",
          "/preview-tema",
          "/api",
        ],
      },
    ],
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
