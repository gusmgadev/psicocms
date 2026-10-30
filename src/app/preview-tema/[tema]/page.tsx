import { notFound } from "next/navigation";
import { exigirSesion } from "@/lib/auth-guard";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import { listarItemsPublicos } from "@/services/catalogo-web";
import { esTemaValido, TEMAS } from "@/themes";
import "@/themes/todos-los-temas.css";
import styles from "./preview.module.css";

export default async function PaginaPreviewTema({
  params,
}: {
  params: Promise<{ tema: string }>;
}) {
  await exigirSesion();
  const { tema } = await params;
  if (!esTemaValido(tema)) notFound();

  const info = await obtenerInformacionPublica();
  const servicios = (await listarItemsPublicos("servicios")).filter((s) => s.activo).slice(0, 3);
  const meta = TEMAS.find((t) => t.id === tema);

  return (
    <div className={`tema-${tema} ${styles.preview}`}>
      <div className={styles.barra}>
        <p className={styles.barraTexto}>
          Vista previa del tema «{meta?.nombre}» con tus datos reales. Así verá tu web cualquier
          visitante.
        </p>
        <a href="/panel-psicologa/temas" className={styles.barraEnlace}>
          <i className="fa fa-arrow-left" aria-hidden="true"></i> Volver a temas
        </a>
      </div>

      <header className={styles.header}>
        <p className={styles.logo}>{info.fullName || "Tu nombre"}</p>
        <nav className={styles.nav} aria-label="Navegación de ejemplo">
          <span>Inicio</span>
          <span>Sobre mí</span>
          <span>Servicios</span>
          <span>Blog</span>
          <span className={styles.navCta}>Pide cita</span>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.heroEtiqueta}>Psicología online y presencial</p>
        <h1 className={styles.heroTitulo}>
          {info.tagline || "Psicología para tu bienestar"}
        </h1>
        <p className={styles.heroTexto}>
          Acompañamiento profesional para gestionar emociones, superar dificultades y recuperar tu
          equilibrio.
        </p>
        <span className={styles.heroBoton}>Pide tu cita</span>
      </section>

      {servicios.length > 0 && (
        <section className={styles.seccion}>
          <h2 className={styles.seccionTitulo}>Servicios</h2>
          <div className={styles.rejilla}>
            {servicios.map((servicio) => (
              <article key={servicio.id} className={styles.tarjeta}>
                {servicio.icono && (
                  <i className={`fa ${servicio.icono} ${styles.tarjetaIcono}`} aria-hidden="true"></i>
                )}
                <h3 className={styles.tarjetaTitulo}>{servicio.nombre}</h3>
                <p className={styles.tarjetaTexto}>{servicio.descripcion}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className={styles.seccionAlterna}>
        <h2 className={styles.seccionTitulo}>Contacto</h2>
        <div className={styles.datos}>
          {info.phonePublic && (
            <p>
              <i className="fa fa-phone" aria-hidden="true"></i> {info.phonePublic}
            </p>
          )}
          {info.emailPublic && (
            <p>
              <i className="fa fa-envelope" aria-hidden="true"></i> {info.emailPublic}
            </p>
          )}
          {(info.address || info.locationName) && (
            <p>
              <i className="fa fa-location-dot" aria-hidden="true"></i>{" "}
              {[info.address, info.locationName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          © {new Date().getFullYear()} {info.fullName || "Tu nombre"}. Todos los derechos
          reservados.
        </p>
      </footer>
    </div>
  );
}
