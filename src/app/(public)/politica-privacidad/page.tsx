import type { Metadata } from "next";
import { formatearFechaCadena } from "@/lib/fechas";
import { obtenerPoliticaPrivacidad } from "@/services/politica-privacidad";
import styles from "../publico.module.css";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Cómo se tratan tus datos personales al usar esta web y al solicitar una cita.",
};

export default async function PoliticaPrivacidad() {
  const politica = await obtenerPoliticaPrivacidad();

  return (
    <div className={styles.pagina}>
      <h1 className={styles.paginaTitulo}>Política de privacidad</h1>
      <p className={styles.paginaTexto}>
        Versión {politica.version}
        {politica.updatedAt
          ? ` · Actualizada el ${formatearFechaCadena(politica.updatedAt.slice(0, 10))}`
          : ""}
      </p>
      <div className={styles.prosa} dangerouslySetInnerHTML={{ __html: politica.contentHtml }} />
    </div>
  );
}
