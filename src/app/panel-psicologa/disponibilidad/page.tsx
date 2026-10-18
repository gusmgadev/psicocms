import { exigirSesion } from "@/lib/auth-guard";
import { getEstadoDisponibilidad } from "@/services/disponibilidad";
import DisponibilidadPanel from "./DisponibilidadPanel";

export default async function PaginaDisponibilidad() {
  await exigirSesion();
  const estado = await getEstadoDisponibilidad();
  return <DisponibilidadPanel inicial={estado} />;
}
