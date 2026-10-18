// Página temporal de diagnóstico (solo desarrollo): crea una sesión de la
// psicóloga con un token mágico para poder probar el panel en navegador.
// Se elimina al terminar los fixes.

import { notFound } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import DebugLoginClient from "./DebugLoginClient";

export const dynamic = "force-dynamic";

export default async function PaginaDebugLogin({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { t } = await searchParams;
  if (!t || t !== process.env.INSTALL_TOKEN) notFound();

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: usuarios } = await supabase.auth.admin.listUsers({ perPage: 1 });
  const email = usuarios?.users?.[0]?.email;
  if (!email) notFound();

  const { data: link, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: "http://localhost:3000/acceso-psicologa" },
  });
  if (error || !link?.action_link) {
    return <DebugLoginClient email={email} token="" error={error?.message ?? "No se pudo generar el enlace."} />;
  }

  const token = new URL(link.action_link).searchParams.get("token") ?? "";
  return <DebugLoginClient email={email} token={token} />;
}
