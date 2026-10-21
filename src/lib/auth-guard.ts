import "server-only";
import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface SesionPanel {
  user: User;
}

export async function exigirSesion(): Promise<SesionPanel> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/acceso-psicologa");
  }

  // Si la verificación en dos pasos está activada y falta el segundo factor,
  // la sesión solo puede ver la pantalla de código (nunca el panel).
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    redirect("/acceso-psicologa?mfa=pendiente");
  }

  return { user };
}

export async function getSesionOPcional(): Promise<SesionPanel | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") return null;

  return { user };
}
