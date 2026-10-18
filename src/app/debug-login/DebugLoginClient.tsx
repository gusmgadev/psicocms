"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

interface Props {
  email: string;
  token: string;
  error?: string;
}

export default function DebugLoginClient({ email, token, error }: Props) {
  const router = useRouter();
  const [estado, setEstado] = useState(error ? `Error: ${error}` : "Entrando...");

  useEffect(() => {
    if (!token) return;
    const supabase = createClient();
    supabase.auth
      .verifyOtp({ email, token, type: "magiclink" })
      .then(({ data, error: err }) => {
        if (err || !data.session) {
          setEstado(`verifyOtp: ${err?.message ?? "sin sesión"}`);
          return;
        }
        setEstado("Sesión creada. Redirigiendo...");
        router.replace("/panel-psicologa/citas");
        router.refresh();
      })
      .catch((e: unknown) => {
        setEstado(`Fallo: ${e instanceof Error ? e.message : String(e)}`);
      });
  }, [email, token, router]);

  return (
    <main style={{ padding: "4rem", fontFamily: "monospace" }}>
      <h1>debug-login</h1>
      <p>{estado}</p>
    </main>
  );
}
