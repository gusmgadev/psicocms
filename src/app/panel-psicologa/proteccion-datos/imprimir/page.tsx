import { notFound } from "next/navigation";
import { exigirSesion } from "@/lib/auth-guard";
import { obtenerPaciente } from "@/services/pacientes";
import { obtenerPlantillaProteccion, obtenerDatosResponsable } from "@/services/proteccion-datos";
import { obtenerTimezone } from "@/services/disponibilidad";
import DocumentoImpresion from "./DocumentoImpresion";

export default async function PaginaImprimirProteccion({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string }>;
}) {
  await exigirSesion();
  const { paciente: pacienteId } = await searchParams;

  const [plantilla, responsable, timezone] = await Promise.all([
    obtenerPlantillaProteccion(),
    obtenerDatosResponsable(),
    obtenerTimezone(),
  ]);

  const paciente = pacienteId ? await obtenerPaciente(pacienteId) : null;
  if (pacienteId && !paciente) notFound();

  return (
    <DocumentoImpresion plantilla={plantilla} responsable={responsable} paciente={paciente} timezone={timezone} />
  );
}
