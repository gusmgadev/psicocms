// src/lib/calendarjs-loader.ts
// Carga Calendar.js (ficheros vendor en /public) solo en el navegador.
// El paquete npm jcalendar.js es un script global sin módulos: se sirve
// desde /public/vendor como Font Awesome, con versión fijada.

import type { EventoCalendarJs, InstanciaCalendarJs, OpcionesCalendarJs } from "@/types/calendarjs";

const RUTA_CSS = "/vendor/calendarjs/calendar.min.css";
const RUTA_JS = "/vendor/calendarjs/calendar.min.js";
const RUTA_ES = "/vendor/calendarjs/translations/calendar.translations.es.js";

interface ApiCalendario {
  addEvents(eventos: EventoCalendarJs[], updateDom?: boolean, disparar?: boolean): unknown;
  removeEvent(id: string, updateDom?: boolean, disparar?: boolean): boolean;
  clearEvents(updateDom?: boolean, disparar?: boolean): unknown;
  refresh(): unknown;
  getCurrentDisplayDate(): Date;
  updateEventDateTimes(
    id: string,
    from: Date,
    to: Date,
    repeatEnds?: Date | null,
    updateDom?: boolean,
    disparar?: boolean,
  ): boolean;
  destroy(): unknown;
}

let promesa: Promise<void> | null = null;

function inyectarScript(src: string): Promise<void> {
  return new Promise((resolver, rechazar) => {
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existente) {
      if (window.calendarJs || src === RUTA_ES) resolver();
      else {
        existente.addEventListener("load", () => resolver());
        existente.addEventListener("error", () => rechazar(new Error("calendarjs")));
      }
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolver();
    s.onerror = () => rechazar(new Error("calendarjs"));
    document.body.appendChild(s);
  });
}

export function cargarCalendarJs(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Calendar.js solo se carga en el navegador."));
  }
  if (window.calendarJs) return Promise.resolve();
  if (promesa) return promesa;

  promesa = (async () => {
    if (!document.querySelector(`link[href="${RUTA_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = RUTA_CSS;
      document.head.appendChild(link);
    }
    await inyectarScript(RUTA_JS);
    try {
      await inyectarScript(RUTA_ES);
    } catch {
      // La traducción es opcional: el calendario funciona en inglés.
    }
  })();

  return promesa;
}

export function crearInstanciaCalendarJs(
  elemento: HTMLElement,
  opciones: OpcionesCalendarJs,
): InstanciaCalendarJs | null {
  if (typeof window === "undefined" || typeof window.calendarJs !== "function") return null;
  window.calendarJs(elemento, opciones);

  const api = window as unknown as Partial<ApiCalendario>;
  const { addEvents, removeEvent, clearEvents, refresh, getCurrentDisplayDate, updateEventDateTimes, destroy } = api;
  if (
    typeof addEvents !== "function" ||
    typeof removeEvent !== "function" ||
    typeof clearEvents !== "function" ||
    typeof refresh !== "function" ||
    typeof getCurrentDisplayDate !== "function" ||
    typeof updateEventDateTimes !== "function" ||
    typeof destroy !== "function"
  ) {
    return null;
  }

  return {
    addEvents: (eventos, updateDom, disparar) => {
      addEvents(eventos, updateDom, disparar);
    },
    removeEvent: (id, updateDom, disparar) => removeEvent(id, updateDom, disparar),
    clearEvents: (updateDom, disparar) => {
      clearEvents(updateDom, disparar);
    },
    refresh: () => {
      refresh();
    },
    getCurrentDisplayDate: () => getCurrentDisplayDate(),
    updateEventDateTimes: (id, from, to, repeatEnds, updateDom, disparar) =>
      updateEventDateTimes(id, from, to, repeatEnds, updateDom, disparar),
    destroy: () => {
      destroy();
    },
  };
}

export function opcionesConEspañol(base: OpcionesCalendarJs): OpcionesCalendarJs {
  const traduccion = typeof window !== "undefined" ? window.__TRANSLATION_OPTIONS : undefined;
  return { ...(traduccion ?? {}), ...base };
}
