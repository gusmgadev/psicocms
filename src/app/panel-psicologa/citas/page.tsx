import { exigirSesion } from "@/lib/auth-guard";
import { listarCitas, listarPacientesParaCita } from "@/services/citas";
import { getEstadoDisponibilidad } from "@/services/disponibilidad";
import { hoyEnZona } from "@/lib/fechas";
import CitasPanel from "./CitasPanel";

export default async function PaginaCitas() {
  await exigirSesion();
  const estado = await getEstadoDisponibilidad();

  const [citas, pacientes] = await Promise.all([
    listarCitas({ pagina: 1, desde: hoyEnZona(estado.timezone) }),
    listarPacientesParaCita(),
  ]);

  return (
    <CitasPanel
      inicial={citas}
      pacientes={pacientes}
      timezone={estado.timezone}
      config={estado.config}
    />
  );
}
