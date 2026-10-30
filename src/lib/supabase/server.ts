import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public-server";

function sesionCaducada(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
  const trozos = cookieStore
    .getAll()
    .filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => indiceTrozo(a.name) - indiceTrozo(b.name));

  if (trozos.length === 0) return true;

  const valor = trozos.map((c) => c.value).join("");
  const codificado = valor.startsWith("base64-") ? valor.slice("base64-".length) : valor;

  try {
    const sesion = JSON.parse(
      Buffer.from(codificado, "base64url").toString("utf8")
    ) as { expires_at?: number; access_token?: string };

    if (typeof sesion.expires_at === "number") {
      return sesion.expires_at * 1000 <= Date.now();
    }

    if (sesion.access_token) {
      const segmentos = sesion.access_token.split(".");
      if (segmentos.length >= 2) {
        const payload = JSON.parse(
          Buffer.from(segmentos[1], "base64url").toString("utf8")
        ) as { exp?: number };
        if (typeof payload.exp === "number") return payload.exp * 1000 <= Date.now();
      }
    }

    return true;
  } catch {
    return true;
  }
}

function indiceTrozo(nombre: string): number {
  const coincidencia = nombre.match(/\.(\d+)$/);
  return coincidencia ? Number(coincidencia[1]) : 0;
}

function crearClienteSesion(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  if (sesionCaducada(cookieStore)) {
    return createPublicClient();
  }

  return crearClienteSesion(cookieStore);
}

// Cliente para flujos de autenticación (login, logout, MFA, cambio de contraseña):
// siempre con cookies para que la sesión se guarde o se cierre de verdad.
export async function createAuthClient() {
  const cookieStore = await cookies();
  return crearClienteSesion(cookieStore);
}
