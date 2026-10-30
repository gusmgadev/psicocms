import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { seccionActivaPublica } from "@/services/secciones";
import { obtenerSecciones } from "@/services/secciones";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import { listarItemsPublicos, listarPlanesPublicos } from "@/services/catalogo-web";
import { obtenerTextosWeb } from "@/services/textos-web";
import { seccionActiva } from "@/lib/panel-tema";
import { metadatosPublicos } from "@/lib/seo";
import { CtaCita, Especialidades, Planes, Servicios } from "@/components/publico/secciones";

export async function generateMetadata(): Promise<Metadata> {
  const info = await obtenerInformacionPublica();
  return metadatosPublicos({
    titulo: "Servicios",
    descripcion:
      "Terapias y servicios de psicología online y presencial adaptados a tus necesidades.",
    ruta: "/servicios",
  });
}

export default async function ServiciosPagina() {
  if (!(await seccionActivaPublica("services"))) notFound();

  const [secciones, info, textos, servicios, especialidades, planes] = await Promise.all([
    obtenerSecciones(),
    obtenerInformacionPublica(),
    obtenerTextosWeb(),
    listarItemsPublicos("servicios"),
    listarItemsPublicos("especialidades"),
    listarPlanesPublicos(),
  ]);

  return (
    <>
      <Servicios items={servicios} textos={textos} />
      <Especialidades items={especialidades} />
      {seccionActiva(secciones, "plans") && <Planes planes={planes} textos={textos} />}
      <CtaCita info={info} textos={textos} />
    </>
  );
}
