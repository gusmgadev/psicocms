// src/themes/index.ts
// Índice de temas visuales (plug and play).
// Cada tema es una carpeta en src/themes/<nombre>/ con su tokens.css.
// El tema activo se guarda en site_settings.active_theme.
// IMPORTANTE: este módulo es seguro para cliente y servidor (sin server-only),
// porque lo usan el selector del panel, la instalación y el servidor.

export interface TemaInfo {
  id: string;
  nombre: string;
  descripcion: string;
  /** Colores para las muestras del panel (datos, no estilos fijos) */
  colores: {
    primario: string;
    fondo: string;
    texto: string;
    acento: string;
  };
}

export const TEMAS: TemaInfo[] = [
  {
    id: "base",
    nombre: "Base",
    descripcion: "Tema original cálido y profesional",
    colores: { primario: "#976147", fondo: "#eee8e5", texto: "#1a1414", acento: "#c0a090" },
  },
  {
    id: "calma",
    nombre: "Calma",
    descripcion: "Tonos azules suaves, transmiten tranquilidad",
    colores: { primario: "#3d6f8c", fondo: "#f2f6f8", texto: "#1a2b36", acento: "#a8c5d4" },
  },
  {
    id: "naturaleza",
    nombre: "Naturaleza",
    descripcion: "Verdes y tierra, conexión con lo natural",
    colores: { primario: "#4f7350", fondo: "#f3f5ef", texto: "#1f2a1c", acento: "#a8c3a0" },
  },
  {
    id: "moderno",
    nombre: "Moderno",
    descripcion: "Limpio y minimalista, con acentos de color",
    colores: { primario: "#0f766e", fondo: "#fafafa", texto: "#18181b", acento: "#99f6e4" },
  },
  {
    id: "elegancia",
    nombre: "Elegancia",
    descripcion: "Oscuro y sofisticado, para consultas premium",
    colores: { primario: "#c4a265", fondo: "#14161a", texto: "#ece8e1", acento: "#dcc49a" },
  },
];

export const IDS_TEMAS = TEMAS.map((t) => t.id);

export function esTemaValido(id: string): boolean {
  return IDS_TEMAS.includes(id);
}

export type ModoLayout = "landing" | "multipage";

export const MODOS_LAYOUT: { id: ModoLayout; nombre: string; descripcion: string; icono: string }[] = [
  {
    id: "multipage",
    nombre: "Multipágina",
    descripcion: "Secciones en URLs separadas, con menú de navegación",
    icono: "fa-copy",
  },
  {
    id: "landing",
    nombre: "Landing",
    descripcion: "Una sola página larga con scroll suavizado",
    icono: "fa-file-lines",
  },
];

export function esModoLayoutValido(modo: string): modo is ModoLayout {
  return modo === "landing" || modo === "multipage";
}
