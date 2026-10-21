// src/components/publico/botones-contacto.tsx
// Botones de acción: pedir cita, llamar, WhatsApp y email (servidor).

import Link from "next/link";
import {
  enlaceEmail,
  enlaceLlamada,
  enlaceWhatsApp,
} from "@/services/textos-web";
import styles from "./publico-secciones.module.css";

interface BotonesContactoProps {
  phone?: string;
  email?: string;
  etiquetaCita?: string;
  hrefCita?: string;
  compacto?: boolean;
}

export function BotonesContacto({
  phone,
  email,
  etiquetaCita = "Pide tu cita",
  hrefCita = "/pide-cita",
  compacto = false,
}: BotonesContactoProps) {
  const tel = phone?.trim() ?? "";
  const mail = email?.trim() ?? "";
  const wa = tel ? enlaceWhatsApp(tel) : null;
  const llamar = tel ? enlaceLlamada(tel) : null;
  const correo = mail ? enlaceEmail(mail) : null;

  const clase = compacto ? `${styles.botones} ${styles.botonesCompacto}` : styles.botones;

  if (!hrefCita && !llamar && !wa && !correo) return null;

  return (
    <div className={clase}>
      {hrefCita && (
        <Link href={hrefCita} className={`${styles.boton} ${styles.botonPrimario}`}>
          <i className="fa-solid fa-calendar-check" aria-hidden="true"></i>
          <span>{etiquetaCita}</span>
        </Link>
      )}
      {llamar && (
        <a href={llamar} className={`${styles.boton} ${styles.botonSecundario}`}>
          <i className="fa-solid fa-phone" aria-hidden="true"></i>
          <span>Llamar</span>
        </a>
      )}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.boton} ${styles.botonWhatsapp}`}
        >
          <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
          <span>WhatsApp</span>
        </a>
      )}
      {correo && (
        <a href={correo} className={`${styles.boton} ${styles.botonSecundario}`}>
          <i className="fa-solid fa-envelope" aria-hidden="true"></i>
          <span>Email</span>
        </a>
      )}
    </div>
  );
}
