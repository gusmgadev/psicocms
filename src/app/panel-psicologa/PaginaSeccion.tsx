import { EmptyState } from "@/components/ui/EmptyState";
import styles from "./panel.module.css";

interface PaginaSeccionProps {
  titulo: string;
  descripcion: string;
  icono: string;
}

export function PaginaSeccion({ titulo, descripcion, icono }: PaginaSeccionProps) {
  return (
    <div className={styles.paginaInicio}>
      <div>
        <h1 className={styles.paginaTitulo}>{titulo}</h1>
        <p className={styles.paginaSubtitulo}>{descripcion}</p>
      </div>
      <div className="tarjeta">
        <EmptyState
          icono={icono}
          titulo="Sección en preparación"
          descripcion="Esta sección estará disponible en una fase posterior del desarrollo."
        />
      </div>
    </div>
  );
}
