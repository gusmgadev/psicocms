import { exigirSesion } from "@/lib/auth-guard";
import { obtenerConfigTema } from "@/services/temas";
import TemasPanel from "./TemasPanel";

export default async function PaginaTemas() {
  await exigirSesion();
  const config = await obtenerConfigTema();
  return <TemasPanel inicial={config} />;
}
