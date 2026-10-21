import { exigirSesion } from "@/lib/auth-guard";
import { listarItems } from "@/services/catalogo-web";
import CatalogoSeccion from "@/components/panel/CatalogoSeccion";

export default async function PaginaEspecialidades() {
  await exigirSesion();
  const especialidades = await listarItems("especialidades");
  return (
    <CatalogoSeccion
      tipo="especialidades"
      titulo="Especialidades"
      subtitulo="Gestiona las áreas de especialización de tu consulta. El orden de la lista es el que se muestra en la web."
      iconoVacio="fa-brain"
      textoVacio="Añade tus áreas de especialización para que tus pacientes sepan en qué puedes ayudarles."
      inicial={especialidades}
    />
  );
}
