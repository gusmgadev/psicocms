// src/lib/supabase/cookies-sesion.ts
// Selección robusta de la cookie de sesión de Supabase. El navegador puede
// acumular cookies con el mismo nombre (paths distintos, formatos antiguos,
// troceadas) y @supabase/ssr se queda con la primera que encuentra, que puede
// ser una sesión caducada aunque haya una válida.

export interface ParCookie {
  name: string;
  value: string;
}

const PATRON_SESION = /^sb-.*-auth-token$/;
const PATRON_TROZO = /^(sb-.*-auth-token)\.(\d+)$/;

export function leerExpiracion(valor: string): number | null {
  const codificado = valor.startsWith("base64-") ? valor.slice("base64-".length) : valor;

  try {
    const sesion = JSON.parse(
      Buffer.from(codificado, "base64url").toString("utf8")
    ) as { expires_at?: number; access_token?: string };

    if (typeof sesion.expires_at === "number") {
      return sesion.expires_at * 1000;
    }

    if (sesion.access_token) {
      const segmentos = sesion.access_token.split(".");
      if (segmentos.length >= 2) {
        const payload = JSON.parse(
          Buffer.from(segmentos[1], "base64url").toString("utf8")
        ) as { exp?: number };
        if (typeof payload.exp === "number") return payload.exp * 1000;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function sesionValida(valor: string): boolean {
  const expiracion = leerExpiracion(valor);
  return expiracion !== null && expiracion > Date.now();
}

// Devuelve true si NO hay ninguna sesión válida entre las cookies de sesión.
export function sesionCaducada(pares: ParCookie[]): boolean {
  const sesion = pares.filter((c) => PATRON_SESION.test(c.name) || PATRON_TROZO.test(c.name));
  if (sesion.length === 0) return true;

  const candidatas: string[] = sesion.map((c) => c.value);

  const porClave = new Map<string, (string | undefined)[]>();
  for (const c of sesion) {
    const coincidencia = c.name.match(/^(sb-.*-auth-token)(?:\.(\d+))?$/);
    if (!coincidencia) continue;
    const clave = coincidencia[1];
    const indice = coincidencia[2] ? Number(coincidencia[2]) : 0;
    const trozos = porClave.get(clave) ?? [];
    trozos[indice] = c.value;
    porClave.set(clave, trozos);
  }
  for (const trozos of porClave.values()) {
    if (trozos.length > 1 && trozos.every((t) => typeof t === "string")) {
      candidatas.push((trozos as string[]).join(""));
    }
  }

  for (const valor of candidatas) {
    if (sesionValida(valor)) return false;
  }

  return true;
}

// Lector de cookies para el adaptador de @supabase/ssr: ante varias cookies con
// el mismo nombre gana la que contiene una sesión válida; si no hay ninguna y
// existen trozos, se devuelve vacío para que la librería combine los trozos.
export function crearLectorCookies(pares: ParCookie[]): (name: string) => string | undefined {
  return (name: string): string | undefined => {
    const mismos = pares.filter((c) => c.name === name);
    if (mismos.length === 0) return undefined;

    if (PATRON_SESION.test(name)) {
      const valida = mismos.find((c) => sesionValida(c.value));
      if (valida) return valida.value;

      const hayTrozos = pares.some((c) => PATRON_TROZO.test(c.name) && c.name.startsWith(`${name}.`));
      if (hayTrozos) return "";

      return mismos[0].value;
    }

    const noVacio = mismos.find((c) => c.value);
    return noVacio ? noVacio.value : mismos[0].value;
  };
}
