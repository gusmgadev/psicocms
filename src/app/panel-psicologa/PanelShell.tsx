"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui";
import type { PreferenciasPanel } from "@/lib/panel-tema";
import TemaPanelModal from "./TemaPanelModal";
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
      { label: "Secciones de la web", href: "/panel-psicologa/secciones" },
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
      { label: "Política de privacidad", href: "/panel-psicologa/politica-privacidad" },
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
  usuario: { nombre: string | null; email: string | null; avatarUrl: string | null };
  preferencias: PreferenciasPanel;
}

export default function PanelShell({ children, usuario, preferencias }: PanelShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menusAbiertos, setMenusAbiertos] = useState<string[]>([]);
  const [sidebarAbierta, setSidebarAbierta] = useState(false);
  const [tema, setTema] = useState<PreferenciasPanel>(preferencias);
  const [modalTemaAbierto, setModalTemaAbierto] = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!menuUsuarioAbierto) return;
    const cerrar = () => setMenuUsuarioAbierto(false);
    document.addEventListener("click", cerrar);
    return () => document.removeEventListener("click", cerrar);
  }, [menuUsuarioAbierto]);

  useEffect(() => {
    setMenuUsuarioAbierto(false);
    setSidebarAbierta(false);
  }, [pathname]);

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

  const buscar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = busqueda.trim();
    if (!q) return;
    router.push(`/panel-psicologa/buscar?q=${encodeURIComponent(q)}`);
  };

  const iniciales = (usuario.nombre || usuario.email || "?")
    .split(/\s+/)
    .map((parte) => parte.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={styles.shell}
      data-modo-panel={tema.modo}
      style={{ "--color-primario": tema.colorPrimario } as CSSProperties}
    >
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
          <Link href="/panel-psicologa/perfil" className={`${styles.usuarioFila} ${styles.usuarioEnlace}`}>
            <span className={styles.usuarioAvatar}>
              {usuario.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.avatarImg} src={usuario.avatarUrl} alt="" />
              ) : (
                <i className="fa fa-user" aria-hidden="true"></i>
              )}
            </span>
            <span className={styles.usuarioInfo}>
              <span className={styles.usuarioNombre}>{usuario.nombre || "Psicólogo/a"}</span>
              <span className={styles.usuarioEmail}>{usuario.email || "—"}</span>
            </span>
          </Link>
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
            <form onSubmit={buscar} className={styles.buscador} role="search">
              <i className="fa fa-magnifying-glass" aria-hidden="true"></i>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar…"
                aria-label="Buscar en el panel"
                className={styles.buscadorInput}
              />
            </form>
            <button
              type="button"
              onClick={() => setModalTemaAbierto(true)}
              className={styles.iconoBoton}
              title="Cambiar tema del panel"
            >
              <i
                className={`fa ${tema.modo === "dark" ? "fa-sun" : "fa-moon"}`}
                aria-hidden="true"
              ></i>
              <span className="sr-only">Cambiar tema del panel</span>
            </button>
            <Link href="/panel-psicologa/ayuda" className={styles.iconoBoton} title="Ayuda">
              <i className="fa fa-circle-question" aria-hidden="true"></i>
              <span className="sr-only">Ayuda</span>
            </Link>
            <div className={styles.usuarioContenedor}>
              <button
                type="button"
                className={styles.usuarioBoton}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuUsuarioAbierto((prev) => !prev);
                }}
                aria-expanded={menuUsuarioAbierto}
                aria-haspopup="menu"
              >
                <span className={styles.usuarioAvatarCabecera}>
                  {usuario.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.avatarImg} src={usuario.avatarUrl} alt="" />
                  ) : (
                    <span aria-hidden="true">{iniciales}</span>
                  )}
                </span>
                <span className={styles.usuarioBotonNombre}>{usuario.nombre || "Mi perfil"}</span>
                <i className={`fa fa-chevron-down ${styles.usuarioBotonFlecha}`} aria-hidden="true"></i>
              </button>

              {menuUsuarioAbierto && (
                <div className={styles.usuarioMenu} role="menu">
                  <div className={styles.usuarioMenuCabecera}>
                    <p className={styles.usuarioMenuNombre}>{usuario.nombre || "Psicólogo/a"}</p>
                    <p className={styles.usuarioMenuEmail}>{usuario.email || "—"}</p>
                  </div>
                  <Link href="/panel-psicologa/perfil" className={styles.usuarioMenuItem} role="menuitem">
                    <i className="fa fa-id-badge" aria-hidden="true"></i>
                    Perfil privado
                  </Link>
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className={`${styles.usuarioMenuItem} ${styles.usuarioMenuItemPeligro}`}
                    role="menuitem"
                  >
                    <i className="fa fa-right-from-bracket" aria-hidden="true"></i>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <ToastProvider>
          <main className={styles.contenido}>{children}</main>
          {modalTemaAbierto && (
            <TemaPanelModal
              abierto
              onCerrar={() => setModalTemaAbierto(false)}
              preferencias={tema}
              onGuardado={(nuevas) => {
                setTema(nuevas);
                setModalTemaAbierto(false);
              }}
            />
          )}
        </ToastProvider>
      </div>
    </div>
  );
}
