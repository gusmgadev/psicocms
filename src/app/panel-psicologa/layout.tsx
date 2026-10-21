import { exigirSesion } from "@/lib/auth-guard";
import { cookies } from "next/headers";
import { obtenerCabeceraUsuario } from "@/services/perfil-privado";
import { obtenerPreferencias } from "@/services/preferencias";
import { COOKIE_PREFERENCIAS, parsearPreferenciasCookie } from "@/lib/panel-tema";
import PanelShell from "./PanelShell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await exigirSesion();

  const [cabecera, cookieStore] = await Promise.all([obtenerCabeceraUsuario(user), cookies()]);
  const preferencias =
    parsearPreferenciasCookie(cookieStore.get(COOKIE_PREFERENCIAS)?.value) ??
    (await obtenerPreferencias());

  return (
    <PanelShell usuario={cabecera} preferencias={preferencias}>
      {children}
    </PanelShell>
  );
}
