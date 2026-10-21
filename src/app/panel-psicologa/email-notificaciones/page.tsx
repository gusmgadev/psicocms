import { exigirSesion } from "@/lib/auth-guard";
import { obtenerConfigEmail } from "@/services/email";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import EmailPanel from "./EmailPanel";

export default async function PaginaEmail() {
  await exigirSesion();
  const [config, info] = await Promise.all([
    obtenerConfigEmail(),
    obtenerInformacionPublica(),
  ]);
  return <EmailPanel config={config} nombrePorDefecto={info.fullName} />;
}
