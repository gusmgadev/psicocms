"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui";
import EditorWysiwyg from "@/components/panel/EditorWysiwyg";
import { guardarInformacionPublicaAction } from "@/actions/informacion-publica";
import { sanitizarHtml } from "@/lib/sanitizar";
import type { InformacionPublica } from "@/services/informacion-publica";
import styles from "./informacion-publica.module.css";

interface Props {
  inicial: InformacionPublica;
}

export default function InfoPublicaPanel({ inicial }: Props) {
  const { mostrar } = useToast();

  const [fullName, setFullName] = useState(inicial.fullName);
  const [tagline, setTagline] = useState(inicial.tagline);
  const [licenseNumber, setLicenseNumber] = useState(inicial.licenseNumber);
  const [phonePublic, setPhonePublic] = useState(inicial.phonePublic);
  const [emailPublic, setEmailPublic] = useState(inicial.emailPublic);
  const [bioHtml, setBioHtml] = useState(inicial.bioHtml);
  const [address, setAddress] = useState(inicial.address);
  const [locationName, setLocationName] = useState(inicial.locationName);
  const [pestana, setPestana] = useState<"editar" | "preview">("editar");
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const res = await guardarInformacionPublicaAction({
      fullName,
      tagline,
      licenseNumber,
      phonePublic,
      emailPublic,
      bioHtml,
      address,
      locationName,
    });
    setGuardando(false);

    if (!res.ok || !res.datos) {
      mostrar(res.error ?? "No se pudo guardar la información.", "error");
      return;
    }
    mostrar("Información pública guardada.");
  };

  return (
    <form className={styles.pagina} onSubmit={guardar}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Información pública</h1>
          <p className={styles.subtitulo}>
            Estos son los datos que se muestran en tu web: quién eres, cómo contactarte y dónde atiendes.
          </p>
        </div>
      </div>

      <div className={styles.rejilla}>
        <div className={styles.principal}>
          <div className="tarjeta">
            <h2 className={styles.tituloTarjeta}>Datos básicos</h2>
            <div className={styles.campos}>
              <div>
                <label htmlFor="info-nombre" className="campo-label">
                  Nombre y apellidos *
                </label>
                <input
                  id="info-nombre"
                  className="campo-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={150}
                  required
                />
              </div>
              <div>
                <label htmlFor="info-colegiado" className="campo-label">
                  Número de colegiado
                </label>
                <input
                  id="info-colegiado"
                  className="campo-control"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className={styles.anchoCompleto}>
                <label htmlFor="info-eslogan" className="campo-label">
                  Eslogan
                </label>
                <input
                  id="info-eslogan"
                  className="campo-control"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={200}
                  placeholder="Ej.: Un espacio para cuidar de ti"
                />
              </div>
            </div>
          </div>

          <div className="tarjeta">
            <h2 className={styles.tituloTarjeta}>Contacto público</h2>
            <div className={styles.campos}>
              <div>
                <label htmlFor="info-telefono" className="campo-label">
                  Teléfono para citas
                </label>
                <input
                  id="info-telefono"
                  className="campo-control"
                  value={phonePublic}
                  onChange={(e) => setPhonePublic(e.target.value)}
                  maxLength={30}
                  placeholder="Ej.: 600 000 000"
                />
              </div>
              <div>
                <label htmlFor="info-email" className="campo-label">
                  Email para citas
                </label>
                <input
                  id="info-email"
                  className="campo-control"
                  type="email"
                  value={emailPublic}
                  onChange={(e) => setEmailPublic(e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
          </div>

          <div className="tarjeta">
            <h2 className={styles.tituloTarjeta}>Sobre mí</h2>
            <div className={styles.pestanas} role="tablist" aria-label="Contenido de la sección «Sobre mí»">
              <button
                type="button"
                role="tab"
                aria-selected={pestana === "editar"}
                className={`${styles.pestana} ${pestana === "editar" ? styles.pestanaActiva : ""}`}
                onClick={() => setPestana("editar")}
              >
                <i className="fa fa-pen" aria-hidden="true"></i> Editar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pestana === "preview"}
                className={`${styles.pestana} ${pestana === "preview" ? styles.pestanaActiva : ""}`}
                onClick={() => setPestana("preview")}
              >
                <i className="fa fa-eye" aria-hidden="true"></i> Vista previa
              </button>
            </div>

            {pestana === "editar" ? (
              <EditorWysiwyg
                valor={bioHtml}
                onChange={setBioHtml}
                placeholder="Cuéntales a tus pacientes quién eres, tu enfoque y cómo trabajas…"
              />
            ) : (
              <div className={styles.preview}>
                {bioHtml.trim() ? (
                  <div dangerouslySetInnerHTML={{ __html: sanitizarHtml(bioHtml) }} />
                ) : (
                  <p className="campo-hint">Todavía no hay texto que previsualizar.</p>
                )}
              </div>
            )}
          </div>

          <div className="tarjeta">
            <h2 className={styles.tituloTarjeta}>Dirección y consulta</h2>
            <div className={styles.campos}>
              <div>
                <label htmlFor="info-lugar" className="campo-label">
                  Lugar de consulta
                </label>
                <input
                  id="info-lugar"
                  className="campo-control"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  maxLength={150}
                  placeholder="Ej.: Consulta Centro"
                />
              </div>
              <div>
                <label htmlFor="info-direccion" className="campo-label">
                  Dirección
                </label>
                <input
                  id="info-direccion"
                  className="campo-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={250}
                  placeholder="Calle, número, código postal y ciudad"
                />
              </div>
            </div>
          </div>
        </div>

        <aside className={styles.lateral}>
          <div className="tarjeta">
            <h2 className={styles.tituloLateral}>Guardar cambios</h2>
            <p className="campo-hint">Al guardar, la web pública se actualiza automáticamente.</p>
            <div className={styles.accionesLateral}>
              <button type="submit" className="boton boton--primario boton--bloque" disabled={guardando}>
                {guardando ? "Guardando…" : "Guardar información"}
              </button>
            </div>
          </div>

          <div className="tarjeta">
            <h2 className={styles.tituloLateral}>Horarios y disponibilidad</h2>
            <p className="campo-hint">
              Los horarios en los que puedes recibir citas se configuran en la sección de Disponibilidad.
            </p>
            <Link href="/panel-psicologa/disponibilidad" className={styles.enlaceLateral}>
              <i className="fa fa-calendar-week" aria-hidden="true"></i>
              Ir a Disponibilidad
            </Link>
          </div>

          <div className="tarjeta">
            <h2 className={styles.tituloLateral}>Tu foto</h2>
            <p className="campo-hint">
              La foto que aparece en la web se gestiona desde tu perfil privado.
            </p>
            <Link href="/panel-psicologa/perfil" className={styles.enlaceLateral}>
              <i className="fa fa-user" aria-hidden="true"></i>
              Ir a Perfil privado
            </Link>
          </div>
        </aside>
      </div>
    </form>
  );
}
