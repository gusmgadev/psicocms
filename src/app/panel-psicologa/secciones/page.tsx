import { exigirSesion } from "@/lib/auth-guard";
import { obtenerSecciones } from "@/services/secciones";
import SeccionesPanel from "./SeccionesPanel";

export default async function PaginaSecciones() {
  await exigirSesion();
  const secciones = await obtenerSecciones();
  return <SeccionesPanel inicial={secciones} />;
}
