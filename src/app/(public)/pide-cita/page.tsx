import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { seccionActivaPublica } from "@/services/secciones";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import { obtenerTextosWeb, texto } from "@/services/textos-web";
import { obtenerPoliticaPrivacidad } from "@/services/politica-privacidad";
import { obtenerTimezone } from "@/services/disponibilidad";
import { metadatosPublicos } from "@/lib/seo";
import { Contacto } from "@/components/publico/secciones";
import { FormularioReserva } from "@/components/publico/formulario-reserva";
import styles from "../publico.module.css";

export async function generateMetadata(): Promise<Metadata> {
  return metadatosPublicos({
    titulo: "Pide cita",
    descripcion: "Reserva tu sesión online o presencial de forma rápida y segura.",
    ruta: "/pide-cita",
  });
}

export default async function PideCita() {
  if (!(await seccionActivaPublica("booking"))) notFound();

  const [info, textos, politica, timezone] = await Promise.all([
    obtenerInformacionPublica(),
    obtenerTextosWeb(),
    obtenerPoliticaPrivacidad(),
    obtenerTimezone(),
  ]);

  return (
    <>
      <section className={styles.pagina} aria-labelledby="titulo-pide-cita">
        <h1 className={styles.paginaTitulo} id="titulo-pide-cita">
          {texto(textos, "booking.title", "Pide tu cita")}
        </h1>
        <p className={styles.paginaTexto}>
          {texto(textos, "booking.subtitle", "Reserva tu sesión de forma rápida y segura")}
        </p>
        <FormularioReserva
          textosModalityOnline={texto(textos, "booking.modality_online", "Sesión online")}
          textosModalityInperson={texto(
            textos,
            "booking.modality_inperson",
            "Sesión presencial"
          )}
          timezone={timezone}
          consentVersion={politica.version}
        />
      </section>
      <Contacto info={info} textos={textos} idAncora />
    </>
  );
}
