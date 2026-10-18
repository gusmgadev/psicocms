"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./panel.module.css";

type ItemHijo = { label: string; href: string };

type MenuItem =
  | { label: string; href: string; icon: string; external?: boolean }
  | { label: string; icon: string; children: ItemHijo[] };

const menuItems: MenuItem[] = [
  { label: "Inicio", href: "/panel-psicologa", icon: "fa-house" },
  { label: "Citas", href: "/panel-psicologa/citas", icon: "fa-calendar-check" },
  { label: "Calendario", href: "/panel-psicologa/calendario", icon: "fa-calendar-days" },
  { label: "Pacientes", href: "/panel-psicologa/pacientes", icon: "fa-users" },
  { label: "Historias clínicas", href: "/panel-psicologa/historias", icon: "fa-notes-medical" },
  { label: "Disponibilidad", href: "/panel-psicologa/disponibilidad", icon: "fa-calendar-week" },
  {
    label: "Gestión web",
    icon: "fa-globe",
    children: [
      { label: "Servicios", href: "/panel-psicologa/servicios" },
      { label: "Especialidades", href: "/panel-psicologa/especialidades" },
      { label: "Planes y precios", href: "/panel-psicologa/planes" },
      { label: "Blog", href: "/panel-psicologa/blog" },
      { label: "Preguntas frecuentes", href: "/panel-psicologa/faqs" },
      { label: "Frases públicas", href: "/panel-psicologa/frases" },
      { label: "Redes sociales", href: "/panel-psicologa/redes-sociales" },
      { label: "Imágenes", href: "/panel-psicologa/imagenes" },
      { label: "Temas visuales", href: "/panel-psicologa/temas" },
    ],
  },
  {
    label: "Configuración",
    icon: "fa-gear",
    children: [
      { label: "Información pública", href: "/panel-psicologa/informacion-publica" },
      { label: "Email y notificaciones", href: "/panel-psicologa/email-notificaciones" },
      { label: "Protección de datos", href: "/panel-psicologa/proteccion-datos" },
      { label: "Perfil privado", href: "/panel-psicologa/perfil" },
      { label: "Preferencias del panel", href: "/panel-psicologa/preferencias" },
    ],
  },
  { label: "Ayuda", href: "/panel-psicologa/ayuda", icon: "fa-circle-info" },
  { label: "Ver web pública", href: "/inicio", icon: "fa-arrow-up-right-from-square", external: true },
];

function tieneHijos(item: MenuItem): item is { label: string; icon: string; children: ItemHijo[] } {
  return "children" in item;
}

function esExterno(item: MenuItem): item is { label: string; href: string; icon: string; external: true } {
  return "external" in item && item.external === true;
}

interface PanelShellProps {
  children: React.ReactNode;
  usuario: { nombre: string | null; email: string | null };
}

export default function PanelShell({ children, usuario }: PanelShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menusAbiertos, setMenusAbiertos] = useState<string[]>([]);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

  const alternarMenu = (label: string) => {
    setMenusAbiertos((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const esActivo = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const cerrarSesion = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/acceso-psicologa");
    router.refresh();
  };

  return (
    <div className={styles.shell}>
      {sidebarAbierta && (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setSidebarAbierta(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`${styles.sidebar} ${sidebarAbierta ? styles.sidebarAbierta : ""}`}>
        <div className={styles.sidebarHeader}>
          <p className={styles.logo}>
            <span className={styles.logoMarca} aria-hidden="true">
              <i className="fa fa-brain"></i>
            </span>
            <span className={styles.logoTexto}>PsicoCMS</span>
          </p>
        </div>

        <nav className={styles.nav} aria-label="Menú del panel">
          {menuItems.map((item) => {
            if (tieneHijos(item)) {
              const abierto = menusAbiertos.includes(item.label);
              const hijoActivo = item.children.some((c) => esActivo(c.href));
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => alternarMenu(item.label)}
                    className={`${styles.navItem} ${abierto || hijoActivo ? styles.navItemAbierto : ""}`}
                    aria-expanded={abierto}
                  >
                    <span className={styles.navItemIcono}>
                      <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                      {item.label}
                    </span>
                    <i
                      className={`fa fa-chevron-down ${styles.navItemFlecha} ${abierto ? styles.navItemFlechaAbierto : ""}`}
                      aria-hidden="true"
                    ></i>
                  </button>
                  {abierto && (
                    <ul className={styles.subnav}>
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setSidebarAbierta(false)}
                            className={`${styles.subnavEnlace} ${esActivo(child.href) ? styles.subnavEnlaceActivo : ""}`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }
            if (esExterno(item)) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.navItem} ${esActivo(item.href) ? styles.navItemActivo : ""}`}
                >
                  <span className={styles.navItemIcono}>
                    <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                    {item.label}
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarAbierta(false)}
                className={`${styles.navItem} ${esActivo(item.href) ? styles.navItemActivo : ""}`}
              >
                <span className={styles.navItemIcono}>
                  <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.usuarioFila}>
            <div className={styles.usuarioAvatar}>
              <i className="fa fa-user" aria-hidden="true"></i>
            </div>
            <div className={styles.usuarioInfo}>
              <p className={styles.usuarioNombre}>{usuario.nombre || "Psicóloga"}</p>
              <p className={styles.usuarioEmail}>{usuario.email || "—"}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerIzquierda}>
            <button
              type="button"
              className={`${styles.iconoBoton} ${styles.hamburguesa}`}
              onClick={() => setSidebarAbierta((prev) => !prev)}
              aria-label="Abrir menú"
              aria-expanded={sidebarAbierta}
            >
              <i className="fa fa-bars" aria-hidden="true"></i>
            </button>
            <p className={styles.headerTitulo}>Panel de administración</p>
          </div>
          <div className={styles.headerAcciones}>
            <Link href="/panel-psicologa/ayuda" className={styles.iconoBoton} title="Ayuda">
              <i className="fa fa-circle-question" aria-hidden="true"></i>
              <span className="sr-only">Ayuda</span>
            </Link>
            <button
              type="button"
              onClick={cerrarSesion}
              className={styles.logoutBoton}
              title="Cerrar sesión"
            >
              <i className="fa fa-right-from-bracket" aria-hidden="true"></i>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>
        <main className={styles.contenido}>{children}</main>
      </div>
    </div>
  );
}
