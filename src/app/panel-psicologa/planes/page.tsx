import { exigirSesion } from "@/lib/auth-guard";
import { listarPlanes } from "@/services/catalogo-web";
import PlanesPanel from "./PlanesPanel";

export default async function PaginaPlanes() {
  await exigirSesion();
  const planes = await listarPlanes();
  return <PlanesPanel inicial={planes} />;
}
