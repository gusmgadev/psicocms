import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPanelRoute = request.nextUrl.pathname.startsWith("/panel-psicologa");
  const isLoginRoute = request.nextUrl.pathname.startsWith("/acceso-psicologa");
  const isInstallRoute = request.nextUrl.pathname.startsWith("/instalacion");

  let mfaPendiente = false;
  if (user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    mfaPendiente = aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2";
  }

  if (isPanelRoute && !user) {
    const redirectUrl = new URL("/acceso-psicologa", request.url);
    redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isPanelRoute && user && mfaPendiente) {
    const redirectUrl = new URL("/acceso-psicologa", request.url);
    redirectUrl.searchParams.set("mfa", "pendiente");
    return NextResponse.redirect(redirectUrl);
  }

  // Sesión de primer factor pendiente del código: se queda en el login
  if (isLoginRoute && user && mfaPendiente) {
    return response;
  }

  if ((isLoginRoute || isInstallRoute) && user) {
    return NextResponse.redirect(new URL("/panel-psicologa", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/panel-psicologa/:path*", "/acceso-psicologa/:path*", "/instalacion/:path*"],
};
