// src/services/blog.ts
// Blog del panel: artículos y categorías con validación en servidor.
// El HTML se sanea con DOMPurify al guardar y al devolverlo.

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sanitizarHtml } from "@/lib/sanitizar";

export type EstadoArticulo = "draft" | "published";

export interface ArticuloFila {
  id: string;
  titulo: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  featuredImagePath: string | null;
  featuredImageUrl: string | null;
  status: EstadoArticulo;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  categoriaNombre: string | null;
}

export interface CategoriaFila {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  orderIndex: number;
  isActive: boolean;
}

export interface FiltroArticulos {
  pagina?: number;
  porPagina?: number;
  busqueda?: string;
  estado?: string;
  categoriaId?: string;
}

export interface ResultadoArticulos {
  articulos: ArticuloFila[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface InputArticulo {
  titulo: string;
  slug?: string;
  excerpt?: string;
  contentHtml: string;
  categoryId?: string | null;
  status: EstadoArticulo;
  featuredImagePath?: string | null;
}

export interface InputCategoria {
  name: string;
  description?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface ResultadoBlog {
  ok: boolean;
  error?: string;
  articulo?: ArticuloFila;
  categoria?: CategoriaFila;
}

const POR_PAGINA = 10;
const LIMITE_TITULO = 200;
const LIMITE_EXCERPT = 300;

interface FilaArticulo {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_html: string;
  featured_image_path: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  category: { name: string } | null;
}

interface FilaCategoria {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
}

function urlPublica(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/public-images/${path}`;
}

function aArticuloFila(f: FilaArticulo): ArticuloFila {
  return {
    id: f.id,
    titulo: f.title,
    slug: f.slug,
    excerpt: f.excerpt,
    contentHtml: sanitizarHtml(f.content_html),
    featuredImagePath: f.featured_image_path,
    featuredImageUrl: f.featured_image_path ? urlPublica(f.featured_image_path) : null,
    status: f.status as EstadoArticulo,
    publishedAt: f.published_at,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
    categoryId: f.category_id,
    categoriaNombre: f.category?.name ?? null,
  };
}

function aCategoriaFila(f: FilaCategoria): CategoriaFila {
  return {
    id: f.id,
    name: f.name,
    slug: f.slug,
    description: f.description,
    orderIndex: f.order_index,
    isActive: f.is_active,
  };
}

export function generarSlug(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "sin-titulo";
}

async function slugUnico(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  base: string,
  excluirId?: string,
): Promise<string> {
  let candidato = base;
  let intento = 1;
  for (;;) {
    let q = supabase.from("blog_posts").select("id").eq("slug", candidato).limit(1);
    if (excluirId) q = q.neq("id", excluirId);
    const { data } = await q;
    if ((data?.length ?? 0) === 0) return candidato;
    intento += 1;
    candidato = `${base}-${intento}`;
  }
}

async function slugUnicoCategoria(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  base: string,
  excluirId?: string,
): Promise<string> {
  let candidato = base;
  let intento = 1;
  for (;;) {
    let q = supabase.from("blog_categories").select("id").eq("slug", candidato).limit(1);
    if (excluirId) q = q.neq("id", excluirId);
    const { data } = await q;
    if ((data?.length ?? 0) === 0) return candidato;
    intento += 1;
    candidato = `${base}-${intento}`;
  }
}

function revalidarBlogPublico(): void {
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
}

// ---------------------------------------------------------------
// Artículos
// ---------------------------------------------------------------

export async function listarArticulos(filtro: FiltroArticulos): Promise<ResultadoArticulos> {
  const supabase = await createServerClient();
  const pagina = Math.max(1, filtro.pagina ?? 1);
  const porPagina = filtro.porPagina ?? POR_PAGINA;

  let q = supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, content_html, featured_image_path, status, published_at, created_at, updated_at, category_id, category:blog_categories(name)", {
      count: "exact",
    });

  if (filtro.estado === "draft" || filtro.estado === "published") {
    q = q.eq("status", filtro.estado);
  }
  if (filtro.categoriaId) {
    q = q.eq("category_id", filtro.categoriaId);
  }
  const busqueda = filtro.busqueda?.trim().replace(/[,()]/g, " ");
  if (busqueda) {
    q = q.or(`title.ilike.%${busqueda}%,slug.ilike.%${busqueda}%`);
  }

  const desde = (pagina - 1) * porPagina;
  const { data, count, error } = await q
    .order("created_at", { ascending: false })
    .range(desde, desde + porPagina - 1);

  if (error) {
    return { articulos: [], total: 0, pagina: 1, totalPaginas: 0 };
  }

  const total = count ?? 0;
  return {
    articulos: ((data ?? []) as unknown as FilaArticulo[]).map(aArticuloFila),
    total,
    pagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
}

export async function obtenerArticulo(id: string): Promise<ArticuloFila | null> {
  if (!id) return null;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, content_html, featured_image_path, status, published_at, created_at, updated_at, category_id, category:blog_categories(name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return aArticuloFila(data as unknown as FilaArticulo);
}

function validarInputArticulo(input: InputArticulo): string | null {
  const titulo = input.titulo?.trim() ?? "";
  if (titulo.length < 3 || titulo.length > LIMITE_TITULO) {
    return `El título debe tener entre 3 y ${LIMITE_TITULO} caracteres.`;
  }
  if (input.excerpt && input.excerpt.trim().length > LIMITE_EXCERPT) {
    return `El resumen no puede superar ${LIMITE_EXCERPT} caracteres.`;
  }
  if (!sanitizarHtml(input.contentHtml ?? "").trim()) {
    return "El contenido del artículo no puede estar vacío.";
  }
  if (input.status !== "draft" && input.status !== "published") {
    return "Estado no válido.";
  }
  if (input.slug !== undefined && input.slug !== null && input.slug !== "") {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug)) {
      return "El enlace (slug) solo puede contener letras minúsculas, números y guiones.";
    }
  }
  return null;
}

export async function crearArticulo(input: InputArticulo): Promise<ResultadoBlog> {
  const errorValidacion = validarInputArticulo(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const slugBase = generarSlug(input.slug?.trim() || input.titulo);
  const slug = await slugUnico(supabase, slugBase);
  const contentHtml = sanitizarHtml(input.contentHtml);
  const ahora = new Date().toISOString();

  let categoryId: string | null = null;
  if (input.categoryId) {
    const { data: cat } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("id", input.categoryId)
      .maybeSingle();
    categoryId = cat ? (cat.id as string) : null;
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title: input.titulo.trim(),
      slug,
      excerpt: input.excerpt?.trim() || null,
      content_html: contentHtml,
      category_id: categoryId,
      status: input.status,
      published_at: input.status === "published" ? ahora : null,
      featured_image_path: input.featuredImagePath ?? null,
    })
    .select("id, title, slug, excerpt, content_html, featured_image_path, status, published_at, created_at, updated_at, category_id, category:blog_categories(name)")
    .single();

  if (error || !data) return { ok: false, error: "No se pudo crear el artículo." };

  revalidarBlogPublico();
  return { ok: true, articulo: aArticuloFila(data as unknown as FilaArticulo) };
}

export async function editarArticulo(id: string, input: InputArticulo): Promise<ResultadoBlog> {
  if (!id) return { ok: false, error: "Artículo no válido." };
  const errorValidacion = validarInputArticulo(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: previa } = await supabase
    .from("blog_posts")
    .select("id, status, slug, featured_image_path")
    .eq("id", id)
    .maybeSingle();

  if (!previa) return { ok: false, error: "El artículo ya no existe." };

  const slugBase = generarSlug(input.slug?.trim() || input.titulo);
  const slug = await slugUnico(supabase, slugBase, id);
  const contentHtml = sanitizarHtml(input.contentHtml);

  let categoryId: string | null = null;
  if (input.categoryId) {
    const { data: cat } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("id", input.categoryId)
      .maybeSingle();
    categoryId = cat ? (cat.id as string) : null;
  }

  const eraPublicado = (previa.status as string) === "published";
  const ahora = new Date().toISOString();

  const actualizacion: Record<string, unknown> = {
    title: input.titulo.trim(),
    slug,
    excerpt: input.excerpt?.trim() || null,
    content_html: contentHtml,
    category_id: categoryId,
    status: input.status,
    featured_image_path: input.featuredImagePath ?? null,
  };
  if (input.status === "published" && !eraPublicado) {
    actualizacion.published_at = ahora;
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(actualizacion)
    .eq("id", id)
    .select("id, title, slug, excerpt, content_html, featured_image_path, status, published_at, created_at, updated_at, category_id, category:blog_categories(name)")
    .single();

  if (error || !data) return { ok: false, error: "No se pudieron guardar los cambios." };

  revalidarBlogPublico();
  return { ok: true, articulo: aArticuloFila(data as unknown as FilaArticulo) };
}

export async function eliminarArticulo(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Artículo no válido." };
  const supabase = await createServerClient();

  const { data: previa } = await supabase
    .from("blog_posts")
    .select("id, featured_image_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el artículo." };

  if (previa?.featured_image_path) {
    await supabase.storage.from("public-images").remove([previa.featured_image_path as string]);
  }

  revalidarBlogPublico();
  return { ok: true };
}

// ---------------------------------------------------------------
// Imagen destacada (bucket public-images, validada en servidor)
// ---------------------------------------------------------------

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const LIMITE_IMAGEN = 5 * 1024 * 1024;

export async function subirImagenDestacada(archivo: File): Promise<{ ok: boolean; path?: string; error?: string }> {
  if (!archivo || archivo.size === 0) {
    return { ok: false, error: "No se ha seleccionado ningún archivo." };
  }
  if (!TIPOS_IMAGEN.includes(archivo.type)) {
    return { ok: false, error: "Solo se permiten imágenes JPG, PNG o WebP." };
  }
  if (archivo.size > LIMITE_IMAGEN) {
    return { ok: false, error: "La imagen no debe superar 5 MB." };
  }

  const supabase = await createServerClient();
  const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "webp";
  const sufijo = extension === "jpeg" ? "jpg" : extension === "png" ? "png" : extension === "webp" ? "webp" : "webp";
  const path = `blog/${crypto.randomUUID()}.${sufijo}`;

  const { error } = await supabase.storage
    .from("public-images")
    .upload(path, archivo, { contentType: archivo.type, upsert: false });

  if (error) return { ok: false, error: "No se pudo subir la imagen." };
  return { ok: true, path };
}

export async function borrarImagenDestacada(path: string): Promise<{ ok: boolean }> {
  if (!path) return { ok: false };
  const supabase = await createServerClient();
  const { error } = await supabase.storage.from("public-images").remove([path]);
  return { ok: !error };
}

// ---------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------

export async function listarCategorias(incluirInactivas = true): Promise<CategoriaFila[]> {
  const supabase = await createServerClient();
  let q = supabase.from("blog_categories").select("id, name, slug, description, order_index, is_active");
  if (!incluirInactivas) q = q.eq("is_active", true);
  const { data } = await q.order("order_index", { ascending: true }).order("name");
  return ((data ?? []) as unknown as FilaCategoria[]).map(aCategoriaFila);
}

export async function crearCategoria(input: InputCategoria): Promise<ResultadoBlog> {
  const name = input.name?.trim() ?? "";
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "El nombre de la categoría debe tener entre 2 y 80 caracteres." };
  }
  if (input.description && input.description.trim().length > 300) {
    return { ok: false, error: "La descripción no puede superar 300 caracteres." };
  }

  const supabase = await createServerClient();
  const slug = await slugUnicoCategoria(supabase, generarSlug(name));

  const { data, error } = await supabase
    .from("blog_categories")
    .insert({
      name,
      slug,
      description: input.description?.trim() || null,
      order_index: input.orderIndex ?? 0,
      is_active: input.isActive ?? true,
    })
    .select("id, name, slug, description, order_index, is_active")
    .single();

  if (error || !data) return { ok: false, error: "No se pudo crear la categoría." };

  revalidarBlogPublico();
  return { ok: true, categoria: aCategoriaFila(data as unknown as FilaCategoria) };
}

export async function editarCategoria(id: string, input: InputCategoria): Promise<ResultadoBlog> {
  if (!id) return { ok: false, error: "Categoría no válida." };
  const name = input.name?.trim() ?? "";
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "El nombre de la categoría debe tener entre 2 y 80 caracteres." };
  }
  if (input.description && input.description.trim().length > 300) {
    return { ok: false, error: "La descripción no puede superar 300 caracteres." };
  }

  const supabase = await createServerClient();
  const { data: previa } = await supabase.from("blog_categories").select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "La categoría ya no existe." };

  const slug = await slugUnicoCategoria(supabase, generarSlug(name), id);

  const { data, error } = await supabase
    .from("blog_categories")
    .update({
      name,
      slug,
      description: input.description?.trim() || null,
      order_index: input.orderIndex ?? 0,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)
    .select("id, name, slug, description, order_index, is_active")
    .single();

  if (error || !data) return { ok: false, error: "No se pudieron guardar los cambios." };

  revalidarBlogPublico();
  return { ok: true, categoria: aCategoriaFila(data as unknown as FilaCategoria) };
}

export async function eliminarCategoria(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Categoría no válida." };
  const supabase = await createServerClient();

  const { data: previa } = await supabase.from("blog_categories").select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "La categoría ya no existe." };

  const { error } = await supabase.from("blog_categories").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la categoría." };

  revalidarBlogPublico();
  return { ok: true };
}
