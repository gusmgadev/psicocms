import type { Metadata } from "next";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import { obtenerImagenHueco } from "@/services/imagenes";
import { obtenerTextosWeb, texto } from "@/services/textos-web";
import { metadatosPublicos } from "@/lib/seo";
import { Contacto, SobreMi } from "@/components/publico/secciones";

export async function generateMetadata(): Promise<Metadata> {
  const info = await obtenerInformacionPublica();
  return metadatosPublicos({
    titulo: "Sobre mí",
    descripcion:
      info.tagline?.trim() ||
      "Conoce mi formación, mi enfoque terapéutico y mi forma de trabajar.",
    ruta: "/sobre-mi",
  });
}

export default async function SobreMiPagina() {
  const [info, textos, imagen] = await Promise.all([
    obtenerInformacionPublica(),
    obtenerTextosWeb(),
    obtenerImagenHueco("sobre-mi"),
  ]);

  return (
    <>
      <SobreMi
        info={info}
        textos={textos}
        imagenUrl={imagen ?? "/images/stock/why.jpg"}
      />
      <Contacto info={info} textos={textos} mostrarMapa={false} />
    </>
  );
}
