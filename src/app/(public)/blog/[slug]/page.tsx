import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { seccionActivaPublica } from "@/services/secciones";
import { obtenerArticuloPublicoPorSlug } from "@/services/blog-publico";
import { formatearFechaCadena } from "@/lib/fechas";
import { jsonLd, metadatosPublicos, urlAbsoluta } from "@/lib/seo";
import styles from "../../publico.module.css";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articulo = await obtenerArticuloPublicoPorSlug(slug);
  if (!articulo) return { title: "Artículo no encontrado" };
  return metadatosPublicos({
    titulo: articulo.titulo,
    descripcion: articulo.excerpt?.trim() || "Artículo del blog.",
    ruta: `/blog/${articulo.slug}`,
    tipo: "article",
    imagen: articulo.featuredImageUrl ?? undefined,
  });
}

export default async function ArticuloPagina({ params }: Props) {
  const { slug } = await params;
  if (!(await seccionActivaPublica("blog"))) notFound();

  const articulo = await obtenerArticuloPublicoPorSlug(slug);
  if (!articulo) notFound();

  const datosArticulo = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articulo.titulo,
    description: articulo.excerpt?.trim() || undefined,
    datePublished: articulo.publishedAt ?? undefined,
    image: articulo.featuredImageUrl ? urlAbsoluta(articulo.featuredImageUrl) : undefined,
    url: urlAbsoluta(`/blog/${articulo.slug}`),
  };

  return (
    <article className={styles.pagina}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(datosArticulo) }}
      />
      <p>
        <Link href="/blog" className={styles.navEnlace}>
          <i className="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver al blog
        </Link>
      </p>
      {articulo.categoriaNombre && <p className={styles.paginaTexto}>{articulo.categoriaNombre}</p>}
      <h1 className={styles.paginaTitulo}>{articulo.titulo}</h1>
      {articulo.publishedAt && (
        <p className={styles.paginaTexto}>
          <time dateTime={articulo.publishedAt}>
            {formatearFechaCadena(articulo.publishedAt.slice(0, 10))}
          </time>
        </p>
      )}
      {articulo.featuredImageUrl && (
        <Image
          src={articulo.featuredImageUrl}
          alt={articulo.titulo}
          width={1200}
          height={630}
          priority
          className={styles.prosa}
          style={{ width: "100%", height: "auto", borderRadius: "1.2rem", marginTop: "1.6rem" }}
        />
      )}
      <div
        className={styles.prosa}
        dangerouslySetInnerHTML={{ __html: articulo.contentHtml }}
      />
    </article>
  );
}
