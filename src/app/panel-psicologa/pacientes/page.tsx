import { exigirSesion } from "@/lib/auth-guard";
import { listarPacientes } from "@/services/pacientes";
import PacientesPanel from "./PacientesPanel";

export default async function PaginaPacientes() {
  await exigirSesion();
  const inicial = await listarPacientes({ pagina: 1 });
  return <PacientesPanel inicial={inicial} />;
}
