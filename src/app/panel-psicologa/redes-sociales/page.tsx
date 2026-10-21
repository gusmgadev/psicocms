import { exigirSesion } from "@/lib/auth-guard";
import { listarRedes } from "@/services/redes";
import RedesPanel from "./RedesPanel";

export default async function PaginaRedes() {
  await exigirSesion();
  const redes = await listarRedes();
  return <RedesPanel iniciales={redes} />;
}
