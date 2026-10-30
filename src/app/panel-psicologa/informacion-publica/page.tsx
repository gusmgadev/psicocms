import { exigirSesion } from "@/lib/auth-guard";
import { obtenerInformacionParaPanel } from "@/services/informacion-publica";
import InfoPublicaPanel from "./InfoPublicaPanel";

export default async function PaginaInformacionPublica() {
  await exigirSesion();
  const datos = await obtenerInformacionParaPanel();
  return <InfoPublicaPanel inicial={datos} />;
}
