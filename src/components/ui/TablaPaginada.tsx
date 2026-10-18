"use client";

import styles from "./TablaPaginada.module.css";

export interface ColumnaTabla<T extends object> {
  clave: string;
  titulo: string;
  render?: (fila: T) => React.ReactNode;
  alinear?: "izquierda" | "derecha" | "centro";
}

interface TablaPaginadaProps<T extends object> {
  columnas: ColumnaTabla<T>[];
  datos: T[];
  claveFila: (fila: T) => string;
  pagina: number;
  totalPaginas: number;
  onCambioPagina: (pagina: number) => void;
  totalRegistros?: number;
  etiquetaRegistros?: string;
}

export function TablaPaginada<T extends object>({
  columnas,
  datos,
  claveFila,
  pagina,
  totalPaginas,
  onCambioPagina,
  totalRegistros,
  etiquetaRegistros = "registros",
}: TablaPaginadaProps<T>) {
  const alineacionClase = (alinear?: string) => {
    if (alinear === "derecha") return styles.derecha;
    if (alinear === "centro") return styles.centro;
    return "";
  };

  return (
    <div className={styles.envoltorio}>
      <div className={styles.scroll}>
        <table className={styles.tabla}>
          <thead>
            <tr>
              {columnas.map((col) => (
                <th key={col.clave} className={`${styles.th} ${alineacionClase(col.alinear)}`}>
                  {col.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.map((fila) => (
              <tr key={claveFila(fila)} className={styles.fila}>
                {columnas.map((col) => (
                  <td key={col.clave} className={`${styles.td} ${alineacionClase(col.alinear)}`}>
                    {col.render ? col.render(fila) : String(col.clave in fila ? (fila as Record<string, React.ReactNode>)[col.clave] : "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pie}>
        <p className={styles.resumen}>
          {totalRegistros !== undefined
            ? `${totalRegistros} ${totalRegistros === 1 ? etiquetaRegistros.replace(/s$/, "") : etiquetaRegistros}`
            : ""}
        </p>
        <div className={styles.paginacion}>
          <button
            type="button"
            className={styles.paginaBoton}
            onClick={() => onCambioPagina(pagina - 1)}
            disabled={pagina <= 1}
            aria-label="Página anterior"
          >
            <i className="fa fa-chevron-left" aria-hidden="true"></i>
          </button>
          <span className={styles.paginaTexto}>
            Página {pagina} de {Math.max(totalPaginas, 1)}
          </span>
          <button
            type="button"
            className={styles.paginaBoton}
            onClick={() => onCambioPagina(pagina + 1)}
            disabled={pagina >= totalPaginas}
            aria-label="Página siguiente"
          >
            <i className="fa fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
