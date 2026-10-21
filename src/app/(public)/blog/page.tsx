import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { seccionActivaPublica } from "@/services/secciones";
import {
  contarArticulosPublicos,
  listarArticulosPublicos,
  listarCategoriasPublicas,
} from "@/services/blog-publico";
import { obtenerTextosWeb, texto } from "@/services/textos-web";
import { formatearFechaCadena } from "@/lib/fechas";
import { metadatosPublicos } from "@/lib/seo";
import { VacioPublico } from "@/components/publico/secciones";
import styles from "../publico.module.css";
import blogStyles from "./blog.module.css";

const POR_PAGINA = 9;

interface Props {
  searchParams: Promise<{ page?: string; categoria?: string }>;
}

function urlBlog(page: number, categoria?: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (categoria) params.set("categoria", categoria);
  const qs = params.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

export async function generateMetadata(): Promise<Metadata> {
  return metadatosPublicos({
    titulo: "Blog",
    descripcion: "Artículos y recursos de psicología para tu bienestar.",
    ruta: "/blog",
  });
}

export default async function BlogPagina({ searchParams }: Props) {
  if (!(await seccionActivaPublica("blog"))) notFound();

  const params = await searchParams;
  const categoriaSlug = params.categoria?.trim() || undefined;
  const pagina = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const desplazamiento = (pagina - 1) * POR_PAGINA;

  const [articulos, total, categorias, textos] = await Promise.all([
    listarArticulosPublicos(POR_PAGINA, { desplazamiento, categoriaSlug }),
    contarArticulosPublicos(categoriaSlug),
    listarCategoriasPublicas(),
    obtenerTextosWeb(),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const categoriaActual = categorias.find((c) => c.slug === categoriaSlug);
  const tituloPagina = categoriaActual?.name ?? texto(textos, "blog.title", "Blog");

  return (
    <div className={styles.pagina}>
      <h1 className={styles.paginaTitulo}>{tituloPagina}</h1>
      <p className={styles.paginaTexto}>
        {texto(textos, "blog.subtitle", "Artículos y recursos para tu bienestar")}
      </p>

      {categorias.length > 0 && (
        <nav className={blogStyles.filtros} aria-label="Filtrar por categoría">
          <Link
            href="/blog"
            className={!categoriaSlug ? blogStyles.filtroActivo : blogStyles.filtro}
          >
            {texto(textos, "blog.all_categories", "Todas")}
          </Link>
          {categorias.map((categoria) => (
            <Link
              key={categoria.id}
              href={urlBlog(1, categoria.slug)}
              className={
                categoriaSlug === categoria.slug
                  ? blogStyles.filtroActivo
                  : blogStyles.filtro
              }
            >
              {categoria.name}
            </Link>
          ))}
        </nav>
      )}

      {articulos.length === 0 ? (
        <VacioPublico
          titulo={
            categoriaSlug
              ? texto(textos, "blog.no_posts_category", "No hay artículos en esta categoría")
              : texto(textos, "blog.no_posts", "No hay artículos publicados aún")
          }
        />
      ) : (
        <ul className={blogStyles.rejilla}>
          {articulos.map((articulo) => (
            <li key={articulo.id} className={blogStyles.tarjeta}>
              <Link href={`/blog/${articulo.slug}`} className={blogStyles.enlace}>
                {articulo.featuredImageUrl ? (
                  <Image
                    src={articulo.featuredImageUrl}
                    alt={articulo.titulo}
                    width={640}
                    height={360}
                    className={blogStyles.imagen}
                  />
                ) : (
                  <div className={blogStyles.imagenVacia} aria-hidden="true">
                    <i className="fa-regular fa-newspaper"></i>
                  </div>
                )}
                <div className={blogStyles.cuerpo}>
                  {articulo.publishedAt && (
                    <time className={blogStyles.fecha} dateTime={articulo.publishedAt}>
                      {formatearFechaCadena(articulo.publishedAt.slice(0, 10))}
                    </time>
                  )}
                  {articulo.categoriaNombre && (
                    <span className={blogStyles.categoria}>{articulo.categoriaNombre}</span>
                  )}
                  <h2 className={blogStyles.titulo}>{articulo.titulo}</h2>
                  {articulo.excerpt && (
                    <p className={blogStyles.extracto}>{articulo.excerpt}</p>
                  )}
                  <span className={blogStyles.leer}>
                    {texto(textos, "blog.read_more", "Leer más")}{" "}
                    <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPaginas > 1 && (
        <nav className={blogStyles.paginacion} aria-label="Paginación del blog">
          {pagina > 1 ? (
            <Link href={urlBlog(pagina - 1, categoriaSlug)} className={blogStyles.paginaEnlace}>
              <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>{" "}
              {texto(textos, "blog.prev", "Anterior")}
            </Link>
          ) : (
            <span className={blogStyles.paginaDesactivada} aria-hidden="true">
              <i className="fa-solid fa-chevron-left"></i> {texto(textos, "blog.prev", "Anterior")}
            </span>
          )}
          <span className={blogStyles.paginaInfo}>
            {texto(textos, "blog.page_of", "Página")} {pagina} / {totalPaginas}
          </span>
          {pagina < totalPaginas ? (
            <Link href={urlBlog(pagina + 1, categoriaSlug)} className={blogStyles.paginaEnlace}>
              {texto(textos, "blog.next", "Siguiente")}{" "}
              <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </Link>
          ) : (
            <span className={blogStyles.paginaDesactivada} aria-hidden="true">
              {texto(textos, "blog.next", "Siguiente")} <i className="fa-solid fa-chevron-right"></i>
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
