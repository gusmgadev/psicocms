import { exigirSesion } from "@/lib/auth-guard";
import { listarImagenesSitio } from "@/services/imagenes";
import ImagenesPanel from "./ImagenesPanel";

export default async function PaginaImagenes() {
  await exigirSesion();
  const imagenes = await listarImagenesSitio();
  return <ImagenesPanel inicial={imagenes} />;
}
