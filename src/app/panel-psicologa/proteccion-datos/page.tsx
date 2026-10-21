import { exigirSesion } from "@/lib/auth-guard";
import { obtenerPlantillaProteccion, obtenerDatosResponsable } from "@/services/proteccion-datos";
import ProteccionDatosPanel from "./ProteccionDatosPanel";

export default async function PaginaProteccionDatos() {
  await exigirSesion();

  const [plantilla, responsable] = await Promise.all([
    obtenerPlantillaProteccion(),
    obtenerDatosResponsable(),
  ]);

  return <ProteccionDatosPanel plantilla={plantilla} responsable={responsable} />;
}
