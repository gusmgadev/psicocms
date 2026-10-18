import Link from "next/link";
import { getResumenInicio } from "@/services/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { obtenerTimezone } from "@/services/disponibilidad";
import { formatearFecha, formatearHora } from "@/lib/fechas";
import styles from "./panel.module.css";

export default async function PanelHome() {
  const [resumen, timezone] = await Promise.all([getResumenInicio(), obtenerTimezone()]);

  return (
    <div className={styles.paginaInicio}>
      <div>
        <h1 className={styles.paginaTitulo}>Inicio</h1>
        <p className={styles.paginaSubtitulo}>Aquí tienes un resumen de tu actividad</p>
      </div>

      <div className={styles.statsRejilla}>
        <StatCard label="Citas esta semana" value={String(resumen.citasSemana)} icon="fa-calendar-check" />
        <StatCard label="Pacientes" value={String(resumen.pacientesActivos)} icon="fa-users" />
        <StatCard label="Próximas citas" value={String(resumen.proximasCitas)} icon="fa-clock" tone="aviso" />
        <StatCard
          label="Nuevos pacientes este mes"
          value={String(resumen.nuevosPacientes)}
          icon="fa-user-plus"
          tone="exito"
        />
      </div>

      <div className={styles.contenidoRejilla}>
        <section className="tarjeta">
          <div className={styles.panelCabecera}>
            <h2 className={styles.panelTitulo}>Próximas citas</h2>
            <Link href="/panel-psicologa/citas" className={styles.panelEnlace}>
              Ver todas
            </Link>
          </div>
          {resumen.proximasCitasLista.length === 0 ? (
            <EmptyState
              icono="fa-calendar-check"
              titulo="Todavía no hay citas programadas"
              descripcion="Cuando tengas citas programadas, aparecerán aquí."
            />
          ) : (
            <ul className={styles.lista}>
              {resumen.proximasCitasLista.map((cita) => (
                <li key={cita.id} className={styles.listaItem}>
                  <span className={styles.listaIcono}>
                    <i className={`fa ${cita.modality === "online" ? "fa-video" : "fa-location-dot"}`} aria-hidden="true"></i>
                  </span>
                  <span className={styles.listaPrincipal}>
                    <span>{cita.pacienteNombre}</span>
                    <small>
                      {formatearFecha(cita.startsAt, timezone)} · {formatearHora(cita.startsAt, timezone)}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="tarjeta">
          <div className={styles.panelCabecera}>
            <h2 className={styles.panelTitulo}>Pacientes recientes</h2>
            <Link href="/panel-psicologa/pacientes" className={styles.panelEnlace}>
              Ver todos
            </Link>
          </div>
          {resumen.pacientesRecientes.length === 0 ? (
            <EmptyState
              icono="fa-users"
              titulo="Todavía no hay pacientes"
              descripcion="Los pacientes que crees o que reserven cita aparecerán aquí."
            />
          ) : (
            <ul className={styles.lista}>
              {resumen.pacientesRecientes.map((paciente) => (
                <li key={paciente.id} className={styles.listaItem}>
                  <span className={styles.listaIcono}>
                    <i className="fa fa-user" aria-hidden="true"></i>
                  </span>
                  <span className={styles.listaPrincipal}>
                    <span>{paciente.nombre}</span>
                    <small>
                      {paciente.numero} · alta {formatearFecha(paciente.createdAt, timezone)}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "primario",
}: {
  label: string;
  value: string;
  icon: string;
  tone?: "primario" | "aviso" | "exito";
}) {
  const iconClass =
    tone === "aviso" ? `${styles.statIcono} ${styles.statIconoAviso}` :
    tone === "exito" ? `${styles.statIcono} ${styles.statIconoExito}` :
    styles.statIcono;

  return (
    <div className={styles.statTarjeta}>
      <div>
        <p className={styles.statEtiqueta}>{label}</p>
        <p className={styles.statValor}>{value}</p>
      </div>
      <div className={iconClass}>
        <i className={`fa ${icon}`} aria-hidden="true"></i>
      </div>
    </div>
  );
}
