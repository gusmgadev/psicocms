// src/services/busqueda.ts
// Buscador general del panel: pacientes, citas, notas de sesión, artículos
// del blog y preguntas frecuentes. Solo accesible con sesión de la dueña.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { formatearFechaCadena, formatearFechaHora } from "@/lib/fechas";
import { obtenerTimezone } from "@/services/disponibilidad";

const LIMITE_GRUPO = 8;

export interface ItemBusqueda {
  id: string;
  href: string;
  titulo: string;
  detalle: string | null;
}

export interface GrupoBusqueda {
  clave: "pacientes" | "citas" | "notas" | "articulos" | "faqs";
  titulo: string;
  icono: string;
  items: ItemBusqueda[];
}

export interface ResultadoBusqueda {
  texto: string;
  grupos: GrupoBusqueda[];
  total: number;
}

function limpiarTexto(consulta: string): string {
  return (consulta ?? "").trim().replace(/[,()]/g, " ").slice(0, 80);
}

function recortarHtmlAfragmento(html: string, texto: string): string | null {
  const plano = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plano) return null;

  const posicion = plano.toLowerCase().indexOf(texto.toLowerCase());
  if (posicion < 0) return `${plano.slice(0, 90)}${plano.length > 90 ? "…" : ""}`;

  const inicio = Math.max(0, posicion - 40);
  const fin = Math.min(plano.length, posicion + texto.length + 60);
  return `${inicio > 0 ? "…" : ""}${plano.slice(inicio, fin)}${fin < plano.length ? "…" : ""}`;
}

export async function buscarEnPanel(consulta: string): Promise<ResultadoBusqueda> {
  const texto = limpiarTexto(consulta);
  if (!texto) return { texto: "", grupos: [], total: 0 };

  const supabase = await createServerClient();

  const [pacientesRes, notasRes, articulosRes, faqsRes, timezone] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name, phone, patient_number")
      .or(`full_name.ilike.%${texto}%,phone.ilike.%${texto}%,patient_number.ilike.%${texto}%`)
      .order("full_name", { ascending: true })
      .limit(LIMITE_GRUPO),
    supabase
      .from("clinical_records")
      .select(
        "id, patient_id, session_date, content, patient:patients(full_name, patient_number)"
      )
      .or(`content.ilike.%${texto}%`)
      .order("session_date", { ascending: false })
      .limit(LIMITE_GRUPO),
    supabase
      .from("blog_posts")
      .select("id, title, slug, status")
      .or(`title.ilike.%${texto}%,slug.ilike.%${texto}%`)
      .order("created_at", { ascending: false })
      .limit(LIMITE_GRUPO),
    supabase
      .from("faqs")
      .select("id, question")
      .ilike("question", `%${texto}%`)
      .order("order_index", { ascending: true })
      .limit(LIMITE_GRUPO),
    obtenerTimezone(),
  ]);

  const pacientes = (pacientesRes.data ?? []) as {
    id: string;
    full_name: string;
    phone: string | null;
    patient_number: string;
  }[];

  const ids = pacientes.map((p) => p.id);

  // Citas: de los pacientes encontrados o por el motivo escrito
  const condicionesCita = [`reason.ilike.%${texto}%`];
  if (ids.length > 0) condicionesCita.push(`patient_id.in.(${ids.join(",")})`);

  const citasRes = await supabase
    .from("appointments")
    .select("id, patient_id, starts_at, status, reason, patient:patients(full_name)")
    .or(condicionesCita.join(","))
    .order("starts_at", { ascending: false })
    .limit(LIMITE_GRUPO);

  const citas = (citasRes.data ?? []) as unknown as {
    id: string;
    starts_at: string;
    status: string;
    patient: { full_name: string } | null;
  }[];

  const notas = (notasRes.data ?? []) as unknown as {
    id: string;
    patient_id: string;
    session_date: string;
    content: string;
    patient: { full_name: string; patient_number: string } | null;
  }[];

  const articulos = (articulosRes.data ?? []) as {
    id: string;
    title: string;
    slug: string;
    status: string;
  }[];

  const faqs = (faqsRes.data ?? []) as { id: string; question: string }[];

  const todosGrupos: GrupoBusqueda[] = [
    {
      clave: "pacientes",
      titulo: "Pacientes",
      icono: "fa-users",
      items: pacientes.map((p) => ({
        id: p.id,
        href: `/panel-psicologa/pacientes/${p.id}`,
        titulo: p.full_name,
        detalle: `${p.patient_number}${p.phone ? ` · ${p.phone}` : ""}`,
      })),
    },
    {
      clave: "citas",
      titulo: "Citas",
      icono: "fa-calendar-check",
      items: citas.map((c) => ({
        id: c.id,
        href: "/panel-psicologa/citas",
        titulo: c.patient?.full_name ?? "Cita",
        detalle: formatearFechaHora(c.starts_at, timezone),
      })),
    },
    {
      clave: "notas",
      titulo: "Notas de sesión",
      icono: "fa-notes-medical",
      items: notas.map((n) => ({
        id: n.id,
        href: `/panel-psicologa/historias/${n.patient_id}`,
        titulo: n.patient ? `${n.patient.full_name} · ${n.patient.patient_number}` : "Nota de sesión",
        detalle: `${formatearFechaCadena(n.session_date.slice(0, 10))} · ${recortarHtmlAfragmento(n.content, texto) ?? ""}`,
      })),
    },
    {
      clave: "articulos",
      titulo: "Artículos del blog",
      icono: "fa-newspaper",
      items: articulos.map((a) => ({
        id: a.id,
        href: `/panel-psicologa/blog/articulos/${a.id}`,
        titulo: a.title,
        detalle: a.status === "published" ? "Publicado" : "Borrador",
      })),
    },
    {
      clave: "faqs",
      titulo: "Preguntas frecuentes",
      icono: "fa-circle-question",
      items: faqs.map((f) => ({
        id: f.id,
        href: "/panel-psicologa/faqs",
        titulo: f.question,
        detalle: null,
      })),
    },
  ];

  const grupos = todosGrupos.filter((g) => g.items.length > 0);

  return {
    texto,
    grupos,
    total: grupos.reduce((suma, g) => suma + g.items.length, 0),
  };
}
