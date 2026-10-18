import { notFound } from "next/navigation";
import { exigirSesion } from "@/lib/auth-guard";
import { obtenerPaciente, listarCitasDelPaciente } from "@/services/pacientes";
import { obtenerTimezone } from "@/services/disponibilidad";
import PacienteDetalle from "./PacienteDetalle";

export default async function PaginaPaciente({ params }: { params: Promise<{ id: string }> }) {
  await exigirSesion();
  const { id } = await params;

  const [paciente, citas, timezone] = await Promise.all([
    obtenerPaciente(id),
    listarCitasDelPaciente(id),
    obtenerTimezone(),
  ]);

  if (!paciente) notFound();

  return <PacienteDetalle inicial={paciente} citas={citas} timezone={timezone} />;
}
