// src/actions/blog.ts
// Server Actions de blog (todas verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  listarArticulos,
  obtenerArticulo,
  crearArticulo,
  editarArticulo,
  eliminarArticulo,
  subirImagenDestacada,
  borrarImagenDestacada,
  listarCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
  type FiltroArticulos,
  type InputArticulo,
  type InputCategoria,
  type ResultadoArticulos,
  type ResultadoBlog,
} from "@/services/blog";

export async function listarArticulosAction(filtro: FiltroArticulos): Promise<ResultadoArticulos> {
  await exigirSesion();
  return listarArticulos(filtro);
}

export async function obtenerArticuloAction(id: string): Promise<{ articulo: Awaited<ReturnType<typeof obtenerArticulo>> }> {
  await exigirSesion();
  return { articulo: await obtenerArticulo(id) };
}

export async function crearArticuloAction(input: InputArticulo): Promise<ResultadoBlog> {
  await exigirSesion();
  if (!input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return crearArticulo(input);
}

export async function editarArticuloAction(id: string, input: InputArticulo): Promise<ResultadoBlog> {
  await exigirSesion();
  if (!id || !input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return editarArticulo(id, input);
}

export async function eliminarArticuloAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  return eliminarArticulo(id);
}

export async function subirImagenAction(formData: FormData): Promise<{ ok: boolean; path?: string; error?: string }> {
  await exigirSesion();
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) return { ok: false, error: "No se ha seleccionado ningún archivo." };
  return subirImagenDestacada(archivo);
}

export async function borrarImagenAction(path: string): Promise<{ ok: boolean }> {
  await exigirSesion();
  return borrarImagenDestacada(path);
}

export async function listarCategoriasAction(incluirInactivas = true) {
  await exigirSesion();
  return listarCategorias(incluirInactivas);
}

export async function crearCategoriaAction(input: InputCategoria): Promise<ResultadoBlog> {
  await exigirSesion();
  if (!input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return crearCategoria(input);
}

export async function editarCategoriaAction(id: string, input: InputCategoria): Promise<ResultadoBlog> {
  await exigirSesion();
  if (!id || !input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return editarCategoria(id, input);
}

export async function eliminarCategoriaAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  return eliminarCategoria(id);
}
