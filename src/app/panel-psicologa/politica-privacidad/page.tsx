import { exigirSesion } from "@/lib/auth-guard";
import { obtenerPoliticaPrivacidad } from "@/services/politica-privacidad";
import PoliticaPrivacidadPanel from "./PoliticaPrivacidadPanel";

export default async function PaginaPoliticaPrivacidad() {
  await exigirSesion();
  const politica = await obtenerPoliticaPrivacidad();
  return <PoliticaPrivacidadPanel politica={politica} />;
}
