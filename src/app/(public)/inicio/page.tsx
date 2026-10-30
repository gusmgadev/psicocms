import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerConfigTema } from "@/services/temas";
import { obtenerSecciones } from "@/services/secciones";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import { listarItemsPublicos, listarPlanesPublicos } from "@/services/catalogo-web";
import { obtenerImagenHueco } from "@/services/imagenes";
import { obtenerTextosWeb } from "@/services/textos-web";
import { seccionActiva } from "@/lib/panel-tema";
import { metadatosPublicos } from "@/lib/seo";
import {
  CtaCita,
  Especialidades,
  Hero,
  Planes,
  Servicios,
} from "@/components/publico/secciones";

export async function generateMetadata(): Promise<Metadata> {
  const info = await obtenerInformacionPublica();
  return metadatosPublicos({
    titulo: "Inicio",
    descripcion:
      info.tagline?.trim() ||
      "Psicología online y presencial. Acompañamiento profesional para tu bienestar.",
    ruta: "/",
  });
}

export default async function Inicio() {
  const [modo, secciones, info, textos, servicios, especialidades, planes, heroImg] =
    await Promise.all([
      obtenerConfigTema(),
      obtenerSecciones(),
      obtenerInformacionPublica(),
      obtenerTextosWeb(),
      listarItemsPublicos("servicios"),
      listarItemsPublicos("especialidades"),
      listarPlanesPublicos(),
      obtenerImagenHueco("hero"),
    ]);

  if (modo.modoLayout === "landing") redirect("/#inicio");

  return (
    <>
      <Hero
        info={info}
        textos={textos}
        imagenUrl={heroImg ?? "/images/stock/psicologa.jpg"}
      />
      {seccionActiva(secciones, "services") && (
        <Servicios items={servicios} textos={textos} />
      )}
      <Especialidades items={especialidades} />
      {seccionActiva(secciones, "plans") && <Planes planes={planes} textos={textos} />}
      {seccionActiva(secciones, "booking") && <CtaCita info={info} textos={textos} />}
    </>
  );
}
