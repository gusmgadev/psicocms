"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = 
  | { label: string; href: string; icon: string; external?: boolean }
  | { label: string; icon: string; children: { label: string; href: string }[] };

const menuItems: MenuItem[] = [
  { label: "Inicio", href: "/panel-psicologa", icon: "fa-house" },
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
    label: "Citas y pacientes",
    icon: "fa-calendar-check",
    children: [
      { label: "Calendario", href: "/panel-psicologa/calendario" },
      { label: "Citas", href: "/panel-psicologa/citas" },
      { label: "Pacientes", href: "/panel-psicologa/pacientes" },
      { label: "Historias clínicas", href: "/panel-psicologa/historias" },
      { label: "Disponibilidad", href: "/panel-psicologa/disponibilidad" },
      { label: "Vacaciones", href: "/panel-psicologa/vacaciones" },
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

function hasChildren(item: MenuItem): item is { label: string; icon: string; children: { label: string; href: string }[] } {
  return "children" in item;
}

function isExternal(item: MenuItem): item is { label: string; href: string; icon: string; external: true } {
  return "external" in item && item.external === true;
}

function isSimple(item: MenuItem): item is { label: string; href: string; icon: string } {
  return "href" in item && !("children" in item) && !("external" in item && item.external);
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-screen bg-[var(--color-fondo-alt)]">
      <aside className="w-64 bg-[var(--color-fondo)] border-r border-[var(--color-borde)] flex flex-col hidden lg:flex">
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (hasChildren(item)) {
              const isOpen = openMenus.includes(item.label);
              const hasActiveChild = item.children.some((c) => isActive(c.href));
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors ${
                      isOpen || hasActiveChild
                        ? "bg-[var(--color-primario)]/10 text-[var(--color-primario)]"
                        : "text-[var(--color-texto-suave)] hover:bg-[var(--color-fondo-alt)] hover:text-[var(--color-texto)]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                      {item.label}
                    </span>
                    <i className={`fa fa-chevron-down text-xs transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true"></i>
                  </button>
                  {isOpen && (
                    <ul className="mt-1 ml-6 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`block px-3 py-2 text-sm rounded-[var(--radius-sm)] transition-colors ${
                              isActive(child.href)
                                ? "bg-[var(--color-primario)]/10 text-[var(--color-primario)] font-medium"
                                : "text-[var(--color-texto-suave)] hover:bg-[var(--color-fondo-alt)] hover:text-[var(--color-texto)]"
                            }`}
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
            if (isExternal(item)) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors ${
                    isActive(item.href)
                      ? "bg-[var(--color-primario)]/10 text-[var(--color-primario)]"
                      : "text-[var(--color-texto-suave)] hover:bg-[var(--color-fondo-alt)] hover:text-[var(--color-texto)]"
                  }`}
                >
                  <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                  {item.label}
                </Link>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors ${
                  isActive(item.href)
                    ? "bg-[var(--color-primario)]/10 text-[var(--color-primario)]"
                    : "text-[var(--color-texto-suave)] hover:bg-[var(--color-fondo-alt)] hover:text-[var(--color-texto)]"
                }`}
              >
                <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--color-borde)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primario)]/10 flex items-center justify-center">
              <i className="fa fa-user text-[var(--color-primario)]" aria-hidden="true"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-texto)] truncate">Psicóloga</p>
              <p className="text-xs text-[var(--color-texto-suave)] truncate">psicologa@ejemplo.com</p>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[var(--color-fondo)] border-b border-[var(--color-borde)] flex items-center justify-between px-6 sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-[var(--color-texto)]">Panel de administración</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-[var(--color-texto-suave)] hover:text-[var(--color-texto)] hover:bg-[var(--color-fondo-alt)] rounded-[var(--radius-md)] transition-colors" title="Tema">
              <i className="fa fa-palette" aria-hidden="true"></i>
            </button>
            <button className="p-2 text-[var(--color-texto-suave)] hover:text-[var(--color-texto)] hover:bg-[var(--color-fondo-alt)] rounded-[var(--radius-md)] transition-colors" title="Notificaciones">
              <i className="fa fa-bell" aria-hidden="true"></i>
            </button>
            <button className="p-2 text-[var(--color-texto-suave)] hover:text-[var(--color-texto)] hover:bg-[var(--color-fondo-alt)] rounded-[var(--radius-md)] transition-colors" title="Ayuda">
              <i className="fa fa-circle-question" aria-hidden="true"></i>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}