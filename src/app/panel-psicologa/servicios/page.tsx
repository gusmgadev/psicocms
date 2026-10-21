import { exigirSesion } from "@/lib/auth-guard";
import { listarItems } from "@/services/catalogo-web";
import CatalogoSeccion from "@/components/panel/CatalogoSeccion";

export default async function PaginaServicios() {
  await exigirSesion();
  const servicios = await listarItems("servicios");
  return (
    <CatalogoSeccion
      tipo="servicios"
      titulo="Servicios"
      subtitulo="Gestiona los servicios que ofreces en tu web. El orden de la lista es el que se muestra en la web."
      iconoVacio="fa-hand-holding-heart"
      textoVacio="Crea el primer servicio para explicar a tus pacientes qué ofreces en la consulta."
      inicial={servicios}
    />
  );
}
