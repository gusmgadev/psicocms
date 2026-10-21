import { redirect } from "next/navigation";
import { obtenerConfigTema } from "@/services/temas";
import { obtenerSecciones } from "@/services/secciones";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import { listarItems, listarPlanes } from "@/services/catalogo-web";
import { listarFaqs } from "@/services/faqs";
import { obtenerImagenHueco } from "@/services/imagenes";
import { obtenerTextosWeb } from "@/services/textos-web";
import { seccionActiva } from "@/lib/panel-tema";
import {
  Contacto,
  CtaCita,
  Especialidades,
  Faq,
  Hero,
  Planes,
  Servicios,
  SobreMi,
} from "@/components/publico/secciones";

export default async function Raiz() {
  const { modoLayout } = await obtenerConfigTema();
  if (modoLayout !== "landing") redirect("/inicio");

  const [secciones, info, textos, servicios, especialidades, planes, faqs, heroImg, sobreImg] =
    await Promise.all([
      obtenerSecciones(),
      obtenerInformacionPublica(),
      obtenerTextosWeb(),
      listarItems("servicios"),
      listarItems("especialidades"),
      listarPlanes(),
      listarFaqs(),
      obtenerImagenHueco("hero"),
      obtenerImagenHueco("sobre-mi"),
    ]);

  return (
    <>
      <Hero
        info={info}
        textos={textos}
        imagenUrl={heroImg ?? "/images/stock/psicologa.jpg"}
        esLanding
      />
      <SobreMi
        info={info}
        textos={textos}
        imagenUrl={sobreImg ?? "/images/stock/why.jpg"}
        idAncora
      />
      {seccionActiva(secciones, "services") && (
        <Servicios items={servicios} textos={textos} idAncora />
      )}
      <Especialidades items={especialidades} idAncora />
      {seccionActiva(secciones, "plans") && <Planes planes={planes} textos={textos} idAncora />}
      {seccionActiva(secciones, "faq") && <Faq faqs={faqs} textos={textos} idAncora />}
      {seccionActiva(secciones, "booking") && <CtaCita info={info} textos={textos} idAncora />}
      <Contacto info={info} textos={textos} idAncora />
    </>
  );
}
