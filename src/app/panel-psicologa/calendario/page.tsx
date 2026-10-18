import { exigirSesion } from "@/lib/auth-guard";
import { listarCitas, listarPacientesParaCita } from "@/services/citas";
import { getEstadoDisponibilidad } from "@/services/disponibilidad";
import { hoyEnZona, sumarDias } from "@/lib/fechas";
import CalendarioPanel from "./CalendarioPanel";

export default async function PaginaCalendario() {
  await exigirSesion();
  const estado = await getEstadoDisponibilidad();
  const hoy = hoyEnZona(estado.timezone);

  const [citas, pacientes] = await Promise.all([
    listarCitas({
      pagina: 1,
      desde: sumarDias(hoy, -45),
      hasta: sumarDias(hoy, 45),
      porPagina: 500,
    }),
    listarPacientesParaCita(),
  ]);

  return (
    <CalendarioPanel
      inicial={citas}
      pacientes={pacientes}
      timezone={estado.timezone}
      config={estado.config}
    />
  );
}
