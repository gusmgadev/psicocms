import { exigirSesion } from "@/lib/auth-guard";
import { listarPacientesHistorial } from "@/services/historias";
import { obtenerTimezone } from "@/services/disponibilidad";
import HistoriasPanel from "./HistoriasPanel";

export default async function PaginaHistorias() {
  await exigirSesion();
  const [inicial, timezone] = await Promise.all([listarPacientesHistorial(), obtenerTimezone()]);
  return <HistoriasPanel inicial={inicial} timezone={timezone} />;
}
