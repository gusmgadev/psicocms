import { notFound } from "next/navigation";
import { exigirSesion } from "@/lib/auth-guard";
import { listarHistoriaPaciente } from "@/services/historias";
import { obtenerTimezone } from "@/services/disponibilidad";
import HistoriaPaciente from "./HistoriaPaciente";

export default async function PaginaHistoriaPaciente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cita?: string }>;
}) {
  await exigirSesion();
  const { id } = await params;
  const { cita } = await searchParams;

  const [historia, timezone] = await Promise.all([listarHistoriaPaciente(id), obtenerTimezone()]);

  if (!historia) notFound();

  return <HistoriaPaciente inicial={historia} timezone={timezone} citaPreseleccionada={cita ?? null} />;
}
