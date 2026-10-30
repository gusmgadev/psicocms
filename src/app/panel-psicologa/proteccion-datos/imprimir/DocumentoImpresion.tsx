"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PacienteFila } from "@/services/pacientes";
import type { DatosResponsable, PlantillaProteccion } from "@/services/proteccion-datos";
import { formatearFecha, formatearFechaCadena } from "@/lib/fechas";
import { sanitizarHtml } from "@/lib/sanitizar";
import styles from "./impresion.module.css";

interface Props {
  plantilla: PlantillaProteccion;
  responsable: DatosResponsable | null;
  paciente: PacienteFila | null;
  timezone: string;
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <p className={styles.fila}>
      <span className={styles.filaEtiqueta}>{etiqueta}:</span>{" "}
      <span className={valor ? styles.filaValor : styles.filaBlanco}>{valor || "________________________________"}</span>
    </p>
  );
}

export default function DocumentoImpresion({ plantilla, responsable, paciente, timezone }: Props) {
  const router = useRouter();
  const hoy = formatearFecha(new Date().toISOString(), timezone);

  const contenido = plantilla.contentHtml.trim();

  return (
    <div className={styles.pagina}>
      <div className={`${styles.barra} no-imprimir`}>
        <button type="button" className="boton boton--primario" onClick={() => window.print()}>
          <i className="fa fa-file-pdf" aria-hidden="true"></i>
          Guardar como PDF
        </button>
        <button type="button" className="boton boton--secundario" onClick={() => router.back()}>
          <i className="fa fa-arrow-left" aria-hidden="true"></i>
          Volver
        </button>
        <Link href="/panel-psicologa/proteccion-datos" className="boton boton--secundario">
          Editar plantilla
        </Link>
      </div>

      <article className={styles.documento}>
        <header className={styles.documentoCabecera}>
          {responsable && <p className={styles.responsableNombre}>{responsable.fullName}</p>}
          <h1 className={styles.documentoTitulo}>Documento de protección de datos</h1>
          <p className={styles.documentoMeta}>
            Plantilla v. {plantilla.version} · Fecha de emisión: {hoy}
          </p>
        </header>

        <section className={styles.bloque}>
          <h2 className={styles.bloqueTitulo}>Datos del titular</h2>
          <Fila etiqueta="Nombre y apellidos" valor={paciente?.nombre} />
          <Fila etiqueta="Teléfono" valor={paciente?.telefono} />
          <Fila etiqueta="Email" valor={paciente?.email} />
          <Fila
            etiqueta="Fecha de nacimiento"
            valor={paciente?.birthDate ? formatearFechaCadena(paciente.birthDate) : null}
          />
          <Fila etiqueta="Dirección" valor={paciente?.address} />
          <Fila etiqueta="Número de ficha" valor={paciente?.numero} />
        </section>

        <section className={styles.contenidoHtml}>
          {contenido ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizarHtml(contenido) }} />
          ) : (
            <p className={styles.aviso}>
              Todavía no hay contenido en la plantilla. Vuelve al panel y escribe la política de protección de datos
              antes de descargar el documento.
            </p>
          )}
        </section>

        <footer className={styles.documentoPie}>
          {responsable && (
            <div className={styles.responsable}>
              <p>
                <strong>Responsable del tratamiento:</strong> {responsable.fullName}
                {responsable.licenseNumber ? ` · Colgiado: ${responsable.licenseNumber}` : ""}
              </p>
              {responsable.address && <p>{responsable.address}</p>}
              <p>
                {responsable.phonePublic && <span>Tel: {responsable.phonePublic}</span>}
                {responsable.phonePublic && responsable.emailPublic && " · "}
                {responsable.emailPublic && <span>{responsable.emailPublic}</span>}
              </p>
            </div>
          )}
          <div className={styles.firmas}>
            <div className={styles.firma}>
              <span className={styles.firmaLinea}></span>
              <p>Firma de la persona titular</p>
            </div>
            <div className={styles.firma}>
              <span className={styles.firmaLinea}></span>
              <p>Firma del/de la psicólogo/a</p>
            </div>
          </div>
          <p className={styles.pieFecha}>Fecha: ____ / ____ / ________</p>
        </footer>
      </article>
    </div>
  );
}
