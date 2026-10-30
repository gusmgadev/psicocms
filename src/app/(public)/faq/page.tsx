import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { seccionActivaPublica } from "@/services/secciones";
import { listarFaqsPublicas } from "@/services/faqs";
import { obtenerTextosWeb } from "@/services/textos-web";
import { metadatosPublicos } from "@/lib/seo";
import { Faq, VacioPublico } from "@/components/publico/secciones";
import styles from "../publico.module.css";

export async function generateMetadata(): Promise<Metadata> {
  return metadatosPublicos({
    titulo: "Preguntas frecuentes",
    descripcion: "Resolvemos tus dudas más comunes sobre terapia, citas y sesiones.",
    ruta: "/faq",
  });
}

export default async function FaqPagina() {
  if (!(await seccionActivaPublica("faq"))) notFound();

  const [faqs, textos] = await Promise.all([listarFaqsPublicas(), obtenerTextosWeb()]);
  const visibles = faqs.filter((f) => f.isActive);

  if (visibles.length === 0) {
    return (
      <div className={styles.pagina}>
        <h1 className={styles.paginaTitulo}>Preguntas frecuentes</h1>
        <VacioPublico titulo="Aún no hay preguntas frecuentes publicadas" />
      </div>
    );
  }

  return <Faq faqs={faqs} textos={textos} tituloNivelH1 />;
}
