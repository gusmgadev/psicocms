import { exigirSesion } from "@/lib/auth-guard";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import InfoPublicaPanel from "./InfoPublicaPanel";

export default async function PaginaInformacionPublica() {
  await exigirSesion();
  const datos = await obtenerInformacionPublica();
  return <InfoPublicaPanel inicial={datos} />;
}
