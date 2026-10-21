// src/lib/panel-tema.ts
// Preferencias visuales del panel: modo claro/oscuro, color principal
// y secciones activas de la web. Módulo compartido (servidor y cliente).

export type ModoPanel = "light" | "dark";

export interface PreferenciasPanel {
  modo: ModoPanel;
  colorPrimario: string;
}

export const COOKIE_PREFERENCIAS = "psicocms-preferencias-panel";

export const COLORES_PANEL: readonly { valor: string; nombre: string }[] = [
  { valor: "#2563eb", nombre: "Azul" },
  { valor: "#0d9488", nombre: "Verde menta" },
  { valor: "#7c3aed", nombre: "Lavanda" },
  { valor: "#db2777", nombre: "Rosa" },
  { valor: "#976147", nombre: "Terracota" },
  { valor: "#4f46e5", nombre: "Índigo" },
  { valor: "#15803d", nombre: "Verde bosque" },
  { valor: "#a16207", nombre: "Ámbar" },
];

export const PREFERENCIAS_POR_DEFECTO: PreferenciasPanel = {
  modo: "light",
  colorPrimario: "#2563eb",
};

export function esModoPanel(valor: unknown): valor is ModoPanel {
  return valor === "light" || valor === "dark";
}

export function esColorPanel(valor: unknown): valor is string {
  return typeof valor === "string" && COLORES_PANEL.some((c) => c.valor === valor);
}

export function parsearPreferenciasCookie(
  valor: string | undefined | null,
): PreferenciasPanel | null {
  if (!valor) return null;
  try {
    const datos = JSON.parse(valor) as { modo?: unknown; colorPrimario?: unknown };
    if (!esModoPanel(datos.modo) || !esColorPanel(datos.colorPrimario)) return null;
    return { modo: datos.modo, colorPrimario: datos.colorPrimario };
  } catch {
    return null;
  }
}

export interface SeccionWeb {
  clave: string;
  nombre: string;
  icono: string;
  descripcion: string;
}

export const SECCIONES_WEB: readonly SeccionWeb[] = [
  {
    clave: "booking",
    nombre: "Reservas de citas",
    icono: "fa-calendar-check",
    descripcion: "El formulario público para pedir cita.",
  },
  {
    clave: "services",
    nombre: "Servicios",
    icono: "fa-heart",
    descripcion: "La sección con tus servicios de consulta.",
  },
  {
    clave: "specialties",
    nombre: "Especialidades",
    icono: "fa-brain",
    descripcion: "La lista de tus especialidades.",
  },
  {
    clave: "plans",
    nombre: "Planes y precios",
    icono: "fa-tags",
    descripcion: "Los planes con precios online y presencial.",
  },
  {
    clave: "blog",
    nombre: "Blog",
    icono: "fa-pen-nib",
    descripcion: "Los artículos y sus categorías.",
  },
  {
    clave: "faq",
    nombre: "Preguntas frecuentes",
    icono: "fa-circle-question",
    descripcion: "Las dudas frecuentes de tus pacientes.",
  },
];

export type SeccionesWeb = Record<string, boolean>;

export function parsearSecciones(valor: unknown): SeccionesWeb {
  const entradas: Record<string, unknown> =
    typeof valor === "object" && valor !== null ? (valor as Record<string, unknown>) : {};

  const secciones: SeccionesWeb = {};
  for (const { clave } of SECCIONES_WEB) {
    secciones[clave] = entradas[clave] === false ? false : true;
  }
  return secciones;
}

export function seccionActiva(secciones: SeccionesWeb, clave: string): boolean {
  return secciones[clave] !== false;
}
