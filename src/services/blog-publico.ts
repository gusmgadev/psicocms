// src/services/blog-publico.ts
// Lecturas públicas del blog: solo artículos publicados y categorías activas.
// El RLS de anon ya filtra, pero se refuerza en servidor por si la sesión
// es de la dueña (visita la web pública con login abierto).

import "server-only";
import { createPublicClient } from "@/lib/supabase/public-server";
import { sanitizarHtml } from "@/lib/sanitizar";

export interface ArticuloPublico {
  id: string;
  titulo: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  featuredImageUrl: string | null;
  publishedAt: string | null;
  categoriaNombre: string | null;
}

export interface CategoriaPublica {
  id: string;
  name: string;
  slug: string;
}

interface FilaArticulo {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_html: string;
  featured_image_path: string | null;
  published_at: string | null;
  category: { name: string } | null;
}

interface FilaCategoria {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

function urlPublica(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/public-images/${path}`;
}

function aArticulo(f: FilaArticulo): ArticuloPublico {
  return {
    id: f.id,
    titulo: f.title,
    slug: f.slug,
    excerpt: f.excerpt,
    contentHtml: sanitizarHtml(f.content_html ?? ""),
    featuredImageUrl: f.featured_image_path ? urlPublica(f.featured_image_path) : null,
    publishedAt: f.published_at,
    categoriaNombre: f.category?.name ?? null,
  };
}

const SELECT =
  "id, title, slug, excerpt, content_html, featured_image_path, published_at, category:blog_categories(name)";

interface OpcionesListado {
  desplazamiento?: number;
  categoriaSlug?: string;
}

export async function listarArticulosPublicos(
  limite = 12,
  opciones?: OpcionesListado
): Promise<ArticuloPublico[]> {
  const supabase = createPublicClient();
  let consulta = supabase
    .from("blog_posts")
    .select(SELECT)
    .eq("status", "published");
  if (opciones?.categoriaSlug) {
    consulta = consulta.eq("category.slug", opciones.categoriaSlug);
  }
  const { data } = await consulta
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limite)
    .range(
      opciones?.desplazamiento ?? 0,
      (opciones?.desplazamiento ?? 0) + limite - 1
    );
  return ((data ?? []) as unknown as FilaArticulo[]).map(aArticulo);
}

export async function contarArticulosPublicos(categoriaSlug?: string): Promise<number> {
  const supabase = createPublicClient();
  let consulta = supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (categoriaSlug) {
    consulta = consulta.eq("category.slug", categoriaSlug);
  }
  const { count } = await consulta;
  return count ?? 0;
}

export async function obtenerArticuloPublicoPorSlug(
  slug: string
): Promise<ArticuloPublico | null> {
  if (!slug) return null;
  const limpio = slug.trim().replace(/[,()]/g, " ");
  if (!limpio) return null;

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(SELECT)
    .eq("status", "published")
    .eq("slug", limpio)
    .maybeSingle();
  if (!data) return null;
  return aArticulo(data as unknown as FilaArticulo);
}

export async function listarCategoriasPublicas(): Promise<CategoriaPublica[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_categories")
    .select("id, name, slug, is_active")
    .eq("is_active", true)
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });
  return ((data ?? []) as unknown as FilaCategoria[]).map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
  }));
}
