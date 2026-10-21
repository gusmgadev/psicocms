import type { Metadata } from "next";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import { obtenerTextosWeb } from "@/services/textos-web";
import { metadatosPublicos } from "@/lib/seo";
import { Contacto } from "@/components/publico/secciones";

export async function generateMetadata(): Promise<Metadata> {
  const info = await obtenerInformacionPublica();
  return metadatosPublicos({
    titulo: "Contacto",
    descripcion:
      "Datos de contacto, dirección de la consulta y formulario de contacto directo.",
    ruta: "/contacto",
  });
}

export default async function ContactoPagina() {
  const [info, textos] = await Promise.all([
    obtenerInformacionPublica(),
    obtenerTextosWeb(),
  ]);

  return <Contacto info={info} textos={textos} idAncora />;
}
