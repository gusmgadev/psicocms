import type { Metadata } from "next";
import Link from "next/link";
import { obtenerConfigTema } from "@/services/temas";
import { obtenerSecciones } from "@/services/secciones";
import { obtenerInformacionPublica } from "@/services/informacion-publica";
import { listarRedesActivas, opcionRed } from "@/services/redes";
import { seccionActiva } from "@/lib/panel-tema";
import { jsonLd, urlBase } from "@/lib/seo";
import { texto, obtenerTextosWeb } from "@/services/textos-web";
import "@/themes/todos-los-temas.css";
import styles from "./publico.module.css";

interface EnlaceNav {
  href: string;
  texto: string;
}

function construirEnlaces(
  esLanding: boolean,
  secciones: Awaited<ReturnType<typeof obtenerSecciones>>,
  textos: Awaited<ReturnType<typeof obtenerTextosWeb>>
): EnlaceNav[] {
  const ancla = (id: string) => (esLanding ? `/#${id}` : `/${id}`);
  const enlaces: EnlaceNav[] = [
    { href: esLanding ? "/#inicio" : "/inicio", texto: texto(textos, "nav.inicio", "Inicio") },
    { href: ancla("sobre-mi"), texto: texto(textos, "nav.sobre_mi", "Sobre mí") },
  ];
  if (seccionActiva(secciones, "services")) {
    enlaces.push({ href: ancla("servicios"), texto: texto(textos, "nav.servicios", "Servicios") });
  }
  if (seccionActiva(secciones, "blog")) {
    enlaces.push({ href: "/blog", texto: texto(textos, "nav.blog", "Blog") });
  }
  if (seccionActiva(secciones, "faq")) {
    enlaces.push({ href: ancla("faq"), texto: texto(textos, "nav.faq", "Preguntas frecuentes") });
  }
  if (seccionActiva(secciones, "booking")) {
    enlaces.push({ href: ancla("pide-cita"), texto: texto(textos, "nav.pide_cita", "Pide cita") });
  }
  enlaces.push({ href: ancla("contacto"), texto: texto(textos, "nav.contacto", "Contacto") });
  return enlaces;
}

export async function generateMetadata(): Promise<Metadata> {
  const info = await obtenerInformacionPublica();
  const nombre = info.fullName?.trim() || "Psicología";
  const descripcion =
    info.tagline?.trim() ||
    "Psicología online y presencial. Acompañamiento profesional para tu bienestar.";

  return {
    title: {
      default: nombre,
      template: `%s | ${nombre}`,
    },
    description: descripcion,
    metadataBase: new URL(urlBase()),
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: nombre,
    },
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { temaActivo, modoLayout } = await obtenerConfigTema();
  const [secciones, info, textos, redes] = await Promise.all([
    obtenerSecciones(),
    obtenerInformacionPublica(),
    obtenerTextosWeb(),
    listarRedesActivas(),
  ]);
  const esLanding = modoLayout === "landing";
  const enlaces = construirEnlaces(esLanding, secciones, textos);
  const nombre = info.fullName?.trim() || "PsicoCMS";
  const eslogan = info.tagline?.trim() || "";
  const anio = new Date().getFullYear();

  const datosSitio = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: nombre,
    description: info.tagline?.trim() || undefined,
    telephone: info.phonePublic?.trim() || undefined,
    email: info.emailPublic?.trim() || undefined,
    address: info.address?.trim() || undefined,
    url: urlBase(),
  };

  return (
    <div className={`tema-${temaActivo} ${styles.temaContenedor}${esLanding ? ` ${styles.modoLanding}` : ""}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(datosSitio) }}
      />
      <header className={styles.header}>
        <div className={styles.headerContenedor}>
          <Link href={esLanding ? "/#inicio" : "/inicio"} className={styles.logoCaja}>
            <span className={styles.logo}>{nombre}</span>
            {eslogan && <span className={styles.eslogan}>{eslogan}</span>}
          </Link>
          <nav className={styles.nav} aria-label="Navegación principal">
            {enlaces.map((enlace) => (
              <Link key={enlace.href} href={enlace.href} className={styles.navEnlace}>
                {enlace.texto}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerContenedor}>
          {redes.length > 0 && (
            <ul className={styles.footerRedes}>
              {redes.map((red) => (
                <li key={red.id}>
                  <a
                    href={red.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.footerRedEnlace}
                    aria-label={opcionRed(red.platform)?.nombre ?? red.platform}
                  >
                    <i className={red.icon} aria-hidden="true"></i>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p>
            © {anio} {nombre}. {texto(textos, "footer.rights", "Todos los derechos reservados")}.{" "}
            <Link href="/politica-privacidad" className={styles.navEnlace}>
              {texto(textos, "footer.privacy", "Política de privacidad")}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
