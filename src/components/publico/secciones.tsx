// src/components/publico/secciones.tsx
// Secciones reutilizables de la web pública (servidor).
// Los colores vienen de las variables del tema activo (var(--...)).
// Los datos llegan desde los servicios; nada fijo en el componente.

import Image from "next/image";
import Link from "next/link";
import type { InformacionPublica } from "@/services/informacion-publica";
import type { ItemCatalogo, Plan } from "@/services/catalogo-web";
import type { FaqFila } from "@/services/faqs";
import { formatearPrecio, texto, type TextosWeb } from "@/services/textos-web";
import { BotonesContacto } from "./botones-contacto";
import styles from "./publico-secciones.module.css";

export function VacioPublico({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div className={styles.vacio}>
      <i className="fa-regular fa-folder-open" aria-hidden="true"></i>
      <p className={styles.vacioTitulo}>{titulo}</p>
      {descripcion && <p className={styles.vacioTexto}>{descripcion}</p>}
    </div>
  );
}

interface HeroProps {
  info: InformacionPublica;
  textos: TextosWeb;
  imagenUrl: string;
  esLanding?: boolean;
  mostrarImagen?: boolean;
}

export function Hero({ info, textos, imagenUrl, esLanding = false, mostrarImagen = true }: HeroProps) {
  const titulo = texto(textos, "hero.title", info.tagline || "Psicología para tu bienestar");
  const subtitulo = texto(
    textos,
    "hero.subtitle",
    "Acompañamiento profesional para gestionar emociones, superar dificultades y recuperar tu equilibrio"
  );
  const cta = texto(textos, "hero.cta_text", "Pide tu cita");

  return (
    <section className={styles.hero} id={esLanding ? "inicio" : undefined} aria-label="Presentación">
      <div className={styles.heroContenido}>
        <p className={styles.heroEtiqueta}>{info.fullName || "Psicología"}</p>
        <h1 className={styles.heroTitulo}>{titulo}</h1>
        <p className={styles.heroTexto}>{subtitulo}</p>
        {info.licenseNumber && (
          <p className={styles.heroColegiada}>
            {texto(textos, "about.license_text", "Colegiada nº")} {info.licenseNumber}
          </p>
        )}
        <BotonesContacto
          phone={info.phonePublic}
          email={info.emailPublic}
          etiquetaCita={cta}
          hrefCita={esLanding ? "#pide-cita" : "/pide-cita"}
        />
      </div>
      {mostrarImagen && (
        <div className={styles.heroImagenCaja}>
          <Image
            src={imagenUrl}
            alt={info.fullName ? `Retrato de ${info.fullName}` : "Psicóloga"}
            width={520}
            height={620}
            priority
            className={styles.heroImagen}
          />
        </div>
      )}
    </section>
  );
}

interface SobreMiProps {
  info: InformacionPublica;
  textos: TextosWeb;
  imagenUrl: string;
  idAncora?: boolean;
}

export function SobreMi({ info, textos, imagenUrl, idAncora = false }: SobreMiProps) {
  const titulo = texto(textos, "about.title", "Sobre mí");
  const subtitulo = texto(textos, "about.subtitle", "Conoce mi formación y forma de trabajo");

  return (
    <section
      className={styles.seccionAlterna}
      id={idAncora ? "sobre-mi" : undefined}
      aria-labelledby="titulo-sobre-mi"
    >
      <div className={styles.sobreMi}>
        <div className={styles.sobreMiImagenCaja}>
          <Image
            src={imagenUrl}
            alt={info.fullName ? `Sobre ${info.fullName}` : "Sobre la psicóloga"}
            width={480}
            height={560}
            className={styles.sobreMiImagen}
          />
        </div>
        <div className={styles.sobreMiContenido}>
          <p className={styles.seccionEtiqueta}>{subtitulo}</p>
          <h2 className={styles.seccionTitulo} id="titulo-sobre-mi">
            {titulo}
          </h2>
          {info.fullName && <p className={styles.sobreMiNombre}>{info.fullName}</p>}
          {info.bioHtml ? (
            <div
              className={styles.prosa}
              dangerouslySetInnerHTML={{ __html: info.bioHtml }}
            />
          ) : (
            <p className={styles.seccionTexto}>
              Pronto encontrarás aquí información sobre mi formación y mi forma de trabajar.
            </p>
          )}
          <BotonesContacto
            phone={info.phonePublic}
            email={info.emailPublic}
            compacto
          />
        </div>
      </div>
    </section>
  );
}

interface CatalogoProps {
  items: ItemCatalogo[];
  textos: TextosWeb;
  idAncora?: boolean;
}

export function Servicios({ items, textos, idAncora = false }: CatalogoProps) {
  const visibles = items.filter((i) => i.activo);
  const titulo = texto(textos, "services.title", "Servicios");
  const subtitulo = texto(textos, "services.subtitle", "Terapias adaptadas a tus necesidades");

  return (
    <section
      className={styles.seccion}
      id={idAncora ? "servicios" : undefined}
      aria-labelledby="titulo-servicios"
    >
      <header className={styles.seccionCabecera}>
        <p className={styles.seccionEtiqueta}>{subtitulo}</p>
        <h2 className={styles.seccionTitulo} id="titulo-servicios">
          {titulo}
        </h2>
      </header>
      {visibles.length === 0 ? (
        <VacioPublico titulo="Aún no hay servicios publicados" />
      ) : (
        <ul className={styles.rejilla}>
          {visibles.map((servicio) => (
            <li key={servicio.id} className={styles.tarjeta}>
              {servicio.icono && (
                <i className={`fa ${servicio.icono} ${styles.tarjetaIcono}`} aria-hidden="true"></i>
              )}
              <h3 className={styles.tarjetaTitulo}>{servicio.nombre}</h3>
              {servicio.descripcion && (
                <p className={styles.tarjetaTexto}>{servicio.descripcion}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Especialidades({ items, idAncora = false }: { items: ItemCatalogo[]; idAncora?: boolean }) {
  const visibles = items.filter((i) => i.activo);
  if (visibles.length === 0) return null;

  return (
    <section
      className={styles.seccionAlterna}
      id={idAncora ? "especialidades" : undefined}
      aria-labelledby="titulo-especialidades"
    >
      <header className={styles.seccionCabecera}>
        <p className={styles.seccionEtiqueta}>Áreas de trabajo</p>
        <h2 className={styles.seccionTitulo} id="titulo-especialidades">
          Especialidades
        </h2>
      </header>
      <ul className={styles.listaChecks}>
        {visibles.map((esp) => (
          <li key={esp.id} className={styles.listaCheckItem}>
            <i className="fa-solid fa-check" aria-hidden="true"></i>
            <div>
              <p className={styles.checkTitulo}>{esp.nombre}</p>
              {esp.descripcion && <p className={styles.checkTexto}>{esp.descripcion}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Planes({ planes, textos, idAncora = false }: { planes: Plan[]; textos: TextosWeb; idAncora?: boolean }) {
  const visibles = planes.filter((p) => p.activo);
  if (visibles.length === 0) return null;

  const titulo = texto(textos, "plans.title", "Planes y precios");
  const subtitulo = texto(textos, "plans.subtitle", "Elige la opción que mejor se adapte a ti");
  const sufijo = texto(textos, "plans.per_session", "/ sesión");

  return (
    <section
      className={styles.seccion}
      id={idAncora ? "planes" : undefined}
      aria-labelledby="titulo-planes"
    >
      <header className={styles.seccionCabecera}>
        <p className={styles.seccionEtiqueta}>{subtitulo}</p>
        <h2 className={styles.seccionTitulo} id="titulo-planes">
          {titulo}
        </h2>
      </header>
      <ul className={styles.rejilla}>
        {visibles.map((plan) => (
          <li key={plan.id} className={`${styles.tarjeta} ${styles.planTarjeta}`}>
            <h3 className={styles.tarjetaTitulo}>{plan.nombre}</h3>
            {plan.descripcion && <p className={styles.tarjetaTexto}>{plan.descripcion}</p>}
            <div className={styles.precios}>
              {plan.precioOnline !== null && (
                <p className={styles.precio}>
                  <span className={styles.precioValor}>{formatearPrecio(plan.precioOnline)}</span>
                  <span className={styles.precioEtiqueta}>Online {sufijo}</span>
                </p>
              )}
              {plan.precioInperson !== null && (
                <p className={styles.precio}>
                  <span className={styles.precioValor}>{formatearPrecio(plan.precioInperson)}</span>
                  <span className={styles.precioEtiqueta}>Presencial {sufijo}</span>
                </p>
              )}
            </div>
            {plan.caracteristicas.length > 0 && (
              <ul className={styles.planLista}>
                {plan.caracteristicas.map((c, i) => (
                  <li key={i}>
                    <i className="fa-solid fa-circle" aria-hidden="true"></i>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/pide-cita" className={`${styles.boton} ${styles.botonPlan}`}>
              {texto(textos, "plans.choose_btn", "Reservar")}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface FaqProps {
  faqs: FaqFila[];
  textos: TextosWeb;
  idAncora?: boolean;
  tituloNivelH1?: boolean;
  ocultarCabecera?: boolean;
}

export function Faq({ faqs, textos, idAncora = false, tituloNivelH1 = false, ocultarCabecera = false }: FaqProps) {
  const visibles = faqs.filter((f) => f.isActive);
  if (visibles.length === 0) return null;

  const titulo = texto(textos, "faq.title", "Preguntas frecuentes");
  const subtitulo = texto(textos, "faq.subtitle", "Resolvemos tus dudas más comunes");
  const Titulo = tituloNivelH1 ? "h1" : "h2";

  return (
    <section
      className={styles.seccionAlterna}
      id={idAncora ? "faq" : undefined}
      aria-labelledby="titulo-faq"
    >
      {!ocultarCabecera && (
        <header className={styles.seccionCabecera}>
          <p className={styles.seccionEtiqueta}>{subtitulo}</p>
          <Titulo className={styles.seccionTitulo} id="titulo-faq">
            {titulo}
          </Titulo>
        </header>
      )}
      {ocultarCabecera && <span id="titulo-faq" className="sr-only">{titulo}</span>}
      <div className={styles.faqLista}>
        {visibles.map((faq) => (
          <details key={faq.id} className={styles.faqItem}>
            <summary className={styles.faqPregunta}>{faq.question}</summary>
            <div
              className={`${styles.prosa} ${styles.faqRespuesta}`}
              dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
            />
          </details>
        ))}
      </div>
    </section>
  );
}

interface CtaProps {
  info: InformacionPublica;
  textos: TextosWeb;
  idAncora?: boolean;
}

export function CtaCita({ info, textos, idAncora = false }: CtaProps) {
  const cta = texto(textos, "hero.cta_text", "Pide tu cita");
  const titulo = texto(textos, "booking.title", "Pide tu cita");
  const subtitulo = texto(
    textos,
    "booking.subtitle",
    "Reserva tu sesión de forma rápida y segura"
  );

  return (
    <section
      className={styles.cta}
      id={idAncora ? "pide-cita" : undefined}
      aria-labelledby="titulo-cta"
    >
      <h2 className={styles.ctaTitulo} id="titulo-cta">
        {titulo}
      </h2>
      <p className={styles.ctaTexto}>{subtitulo}</p>
      <BotonesContacto
        phone={info.phonePublic}
        email={info.emailPublic}
        etiquetaCita={cta}
      />
    </section>
  );
}

interface ContactoProps {
  info: InformacionPublica;
  textos: TextosWeb;
  imagenUrl?: string | null;
  idAncora?: boolean;
  mostrarMapa?: boolean;
}

export function Contacto({ info, textos, idAncora = false, mostrarMapa = true }: ContactoProps) {
  const titulo = texto(textos, "contact.title", "Contacto");
  const subtitulo = texto(textos, "contact.subtitle", "Estoy aquí para ayudarte");
  const tituloMapa = texto(textos, "contact.map_title", "Dónde estamos");
  const direccion = [info.address, info.locationName].filter(Boolean).join(", ");

  return (
    <section
      className={styles.seccion}
      id={idAncora ? "contacto" : undefined}
      aria-labelledby="titulo-contacto"
    >
      <header className={styles.seccionCabecera}>
        <p className={styles.seccionEtiqueta}>{subtitulo}</p>
        <h2 className={styles.seccionTitulo} id="titulo-contacto">
          {titulo}
        </h2>
      </header>
      <div className={styles.contactoRejilla}>
        <div className={styles.contactoDatos}>
          {info.phonePublic && (
            <p className={styles.datoFila}>
              <i className="fa-solid fa-phone" aria-hidden="true"></i>
              <span>
                <span className={styles.datoEtiqueta}>Teléfono</span>
                {info.phonePublic}
              </span>
            </p>
          )}
          {info.emailPublic && (
            <p className={styles.datoFila}>
              <i className="fa-solid fa-envelope" aria-hidden="true"></i>
              <span>
                <span className={styles.datoEtiqueta}>Email</span>
                {info.emailPublic}
              </span>
            </p>
          )}
          {direccion && (
            <p className={styles.datoFila}>
              <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
              <span>
                <span className={styles.datoEtiqueta}>Dirección</span>
                {direccion}
              </span>
            </p>
          )}
          <BotonesContacto
            phone={info.phonePublic}
            email={info.emailPublic}
            compacto
          />
        </div>
        {mostrarMapa && direccion && (
          <div className={styles.mapaCaja}>
            <h3 className={styles.mapaTitulo}>{tituloMapa}</h3>
            <iframe
              className={styles.mapa}
              src={`https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`}
              title={`Mapa: ${direccion}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </section>
  );
}
