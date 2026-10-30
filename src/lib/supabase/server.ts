import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public-server";
import { crearLectorCookies, sesionCaducada as sesionCaducadaPares } from "@/lib/supabase/cookies-sesion";

function crearClienteSesion(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const pares = cookieStore.getAll();
  const leer = crearLectorCookies(pares);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return leer(name) ?? cookieStore.get(name)?.value;
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

  if (sesionCaducadaPares(cookieStore.getAll())) {
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

// Borra las cookies de sesión de Supabase que el navegador guarde en el path
// raíz (incluidas las de formatos antiguos) para que cada login empiece limpio.
export async function limpiarCookiesSesion(): Promise<void> {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (/^sb-.*-auth-token(\.\d+)?$/.test(cookie.name)) {
      try {
        cookieStore.set({ name: cookie.name, value: "", maxAge: 0, path: "/" });
      } catch {
        // Ignorar si no se puede escribir (Server Component)
      }
    }
  }
}
