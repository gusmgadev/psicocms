// src/services/frases.ts
// Frases públicas configurables de los temas visuales (clave/valor).

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidarWebPublica } from "@/lib/revalidar-web";

export interface Frase {
  key: string;
  value: string;
  description: string | null;
}

export interface GrupoFrases {
  prefijo: string;
  titulo: string;
  frases: Frase[];
}

export const GRUPOS_FRASES: { prefijo: string; titulo: string }[] = [
  { prefijo: "nav", titulo: "Navegación" },
  { prefijo: "hero", titulo: "Portada" },
  { prefijo: "about", titulo: "Sobre mí" },
  { prefijo: "services", titulo: "Servicios" },
  { prefijo: "plans", titulo: "Planes y precios" },
  { prefijo: "blog", titulo: "Blog" },
  { prefijo: "faq", titulo: "Preguntas frecuentes" },
  { prefijo: "booking", titulo: "Reserva de citas" },
  { prefijo: "contact", titulo: "Contacto" },
  { prefijo: "footer", titulo: "Pie de página" },
  { prefijo: "general", titulo: "General" },
  { prefijo: "panel", titulo: "Panel" },
];

const LIMITE_VALOR = 1_000;

interface FilaFrase {
  key: string;
  value: string;
  description: string | null;
}

export async function listarFrases(): Promise<Frase[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("public_phrases")
    .select("key, value, description")
    .order("key", { ascending: true });
  const filas = (data ?? []) as unknown as FilaFrase[];
  return filas.map((f) => ({ key: f.key, value: f.value, description: f.description }));
}

export function agruparFrases(frases: Frase[]): GrupoFrases[] {
  const grupos = new Map<string, GrupoFrases>();

  for (const frase of frases) {
    const prefijo = frase.key.includes(".") ? frase.key.split(".")[0] : "otros";
    const definido = GRUPOS_FRASES.find((g) => g.prefijo === prefijo);
    const titulo = definido?.titulo ?? "Otros";
    let grupo = grupos.get(titulo);
    if (!grupo) {
      grupo = { prefijo: definido?.prefijo ?? "otros", titulo, frases: [] };
      grupos.set(titulo, grupo);
    }
    grupo.frases.push(frase);
  }

  const orden = GRUPOS_FRASES.map((g) => g.titulo);
  return [...grupos.values()].sort(
    (a, b) => orden.indexOf(a.titulo) - orden.indexOf(b.titulo)
  );
}

export interface CambioFrase {
  key: string;
  value: string;
}

export async function guardarFrases(
  cambios: CambioFrase[]
): Promise<{ ok: boolean; error?: string }> {
  if (!Array.isArray(cambios) || cambios.length === 0) {
    return { ok: false, error: "No hay cambios para guardar." };
  }
  if (cambios.length > 200) {
    return { ok: false, error: "Demasiados cambios a la vez." };
  }

  for (const cambio of cambios) {
    if (typeof cambio.key !== "string" || typeof cambio.value !== "string") {
      return { ok: false, error: "Datos no válidos." };
    }
    if (cambio.value.length > LIMITE_VALOR) {
      return {
        ok: false,
        error: `La frase «${cambio.key}» no puede superar ${LIMITE_VALOR} caracteres.`,
      };
    }
  }

  const supabase = await createServerClient();

  const { data: existentes } = await supabase
    .from("public_phrases")
    .select("key")
    .in("key", cambios.map((c) => c.key));

  const clavesExistentes = new Set(
    ((existentes ?? []) as { key: string }[]).map((f) => f.key)
  );
  if (cambios.some((c) => !clavesExistentes.has(c.key))) {
    return { ok: false, error: "Alguna frase ya no existe. Recarga la página." };
  }

  for (const cambio of cambios) {
    const { error } = await supabase
      .from("public_phrases")
      .update({ value: cambio.value })
      .eq("key", cambio.key);
    if (error) {
      return { ok: false, error: "No se pudieron guardar las frases." };
    }
  }

  revalidarWebPublica();
  return { ok: true };
}
