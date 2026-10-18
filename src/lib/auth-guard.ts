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

  return { user };
}

export async function getSesionOPcional(): Promise<SesionPanel | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { user };
}
