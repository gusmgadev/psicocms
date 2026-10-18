import styles from "./publico.module.css";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerContenedor}>
          <p className={styles.logo}>PsicoCMS</p>
          <nav className={styles.nav} aria-label="Navegación principal">
            <a href="/inicio" className={styles.navEnlace}>Inicio</a>
            <a href="/sobre-mi" className={styles.navEnlace}>Sobre mí</a>
            <a href="/servicios" className={styles.navEnlace}>Servicios</a>
            <a href="/blog" className={styles.navEnlace}>Blog</a>
            <a href="/faq" className={styles.navEnlace}>Preguntas frecuentes</a>
            <a href="/pide-cita" className={styles.navEnlace}>Pide cita</a>
            <a href="/contacto" className={styles.navEnlace}>Contacto</a>
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerContenedor}>
          <p>&copy; {new Date().getFullYear()} PsicoCMS. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}
