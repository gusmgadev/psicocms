import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { ToastProvider } from "@/components/ui/Toast";
import PanelShell from "./PanelShell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/acceso-psicologa");
  }

  const meta = user.user_metadata as { full_name?: string } | undefined;

  return (
    <ToastProvider>
      <PanelShell
        usuario={{
          nombre: meta?.full_name ?? null,
          email: user.email ?? null,
        }}
      >
        {children}
      </PanelShell>
    </ToastProvider>
  );
}
