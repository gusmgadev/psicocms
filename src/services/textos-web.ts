// src/services/textos-web.ts
// Mapa de frases públicas configurables con valores por defecto.
// Las claves vienen del seed (006) y se editan en /panel-psicologa/frases.

import "server-only";
import { listarFrases } from "./frases";

export type TextosWeb = Record<string, string>;

const POR_DEFECTO: TextosWeb = {
  "hero.title": "Psicología para tu bienestar",
  "hero.subtitle":
    "Acompañamiento profesional para gestionar emociones, superar dificultades y recuperar tu equilibrio",
  "hero.cta_text": "Pide tu cita",
  "hero.cta_link": "/pide-cita",
  "about.title": "Sobre mí",
  "about.subtitle": "Conoce mi formación y forma de trabajo",
  "about.license_text": "Colegiada nº",
  "services.title": "Servicios",
  "services.subtitle": "Terapias adaptadas a tus necesidades",
  "plans.title": "Planes y precios",
  "plans.subtitle": "Elige la opción que mejor se adapte a ti",
  "plans.per_session": "/ sesión",
  "plans.choose_btn": "Reservar",
  "blog.title": "Blog",
  "blog.subtitle": "Artículos y recursos para tu bienestar",
  "blog.read_more": "Leer más",
  "blog.no_posts": "No hay artículos publicados aún",
  "blog.no_posts_category": "No hay artículos en esta categoría",
  "blog.all_categories": "Todas",
  "blog.prev": "Anterior",
  "blog.next": "Siguiente",
  "blog.page_of": "Página",
  "faq.title": "Preguntas frecuentes",
  "faq.subtitle": "Resolvemos tus dudas más comunes",
  "booking.title": "Pide tu cita",
  "booking.subtitle": "Reserva tu sesión de forma rápida y segura",
  "contact.title": "Contacto",
  "contact.subtitle": "Estoy aquí para ayudarte",
  "contact.map_title": "Dónde estamos",
  "footer.rights": "Todos los derechos reservados",
  "footer.privacy": "Política de privacidad",
};

export async function obtenerTextosWeb(): Promise<TextosWeb> {
  const mapa: TextosWeb = { ...POR_DEFECTO };
  try {
    const frases = await listarFrases();
    for (const frase of frases) {
      const valor = frase.value?.trim();
      if (valor) mapa[frase.key] = valor;
    }
  } catch {
    // Sin frases en BD se usan los valores por defecto.
  }
  return mapa;
}

export function texto(mapa: TextosWeb, clave: string, fallback: string): string {
  return mapa[clave]?.trim() || fallback;
}

export function formatearPrecio(valor: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(valor) ? 0 : 2,
  }).format(valor);
}

export function enlaceWhatsApp(telefono: string): string | null {
  const digitos = telefono.replace(/[^0-9]/g, "");
  if (digitos.length < 7) return null;
  return `https://wa.me/${digitos}`;
}

export function enlaceLlamada(telefono: string): string | null {
  const limpio = telefono.trim();
  if (!limpio) return null;
  return `tel:${limpio.replace(/\s+/g, "")}`;
}

export function enlaceEmail(email: string): string | null {
  const limpio = email.trim();
  if (!limpio) return null;
  return `mailto:${limpio}`;
}
