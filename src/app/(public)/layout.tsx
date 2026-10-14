export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-[var(--color-borde)] bg-[var(--color-fondo)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-semibold text-[var(--color-primario)]">PsicoCMS</h1>
            <nav className="flex items-center gap-6 text-sm text-[var(--color-texto-suave)]">
              <a href="/inicio" className="hover:text-[var(--color-texto)]">Inicio</a>
              <a href="/sobre-mi" className="hover:text-[var(--color-texto)]">Sobre mí</a>
              <a href="/servicios" className="hover:text-[var(--color-texto)]">Servicios</a>
              <a href="/blog" className="hover:text-[var(--color-texto)]">Blog</a>
              <a href="/faq" className="hover:text-[var(--color-texto)]">Preguntas frecuentes</a>
              <a href="/pide-cita" className="hover:text-[var(--color-texto)]">Pide cita</a>
              <a href="/contacto" className="hover:text-[var(--color-texto)]">Contacto</a>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--color-borde)] bg-[var(--color-fondo-alt)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[var(--color-texto-suave)]">
          <p>&copy; {new Date().getFullYear()} PsicoCMS. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}