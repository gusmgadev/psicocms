"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/ui";
import { enviarEmailPruebaAction, guardarConfigEmailAction } from "@/actions/email";
import type { ConfigEmail } from "@/services/email";
import styles from "./email.module.css";

interface EmailPanelProps {
  config: ConfigEmail;
  nombrePorDefecto: string;
}

export default function EmailPanel({ config, nombrePorDefecto }: EmailPanelProps) {
  const { mostrar } = useToast();
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);

  const [emailGmail, setEmailGmail] = useState(config.smtpUser || config.fromEmail);
  const [password, setPassword] = useState("");
  const [fromName, setFromName] = useState(config.fromName || nombrePorDefecto || "PsicoCMS");
  const [notificationsEnabled, setNotificationsEnabled] = useState(config.notificationsEnabled);
  const [notifyOnBooking, setNotifyOnBooking] = useState(config.notifyOnBooking);
  const [smtpHost, setSmtpHost] = useState(config.smtpHost);
  const [smtpPort, setSmtpPort] = useState(String(config.smtpPort));

  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (guardando) return;
    setError(null);
    setGuardando(true);

    const res = await guardarConfigEmailAction({
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUser: emailGmail.trim(),
      fromName: fromName.trim(),
      fromEmail: emailGmail.trim(),
      notificationsEnabled,
      notifyOnBooking,
      smtpPassword: password.trim() || undefined,
    });

    setGuardando(false);

    if (!res.ok) {
      setError(res.error ?? "No se pudo guardar la configuración.");
      return;
    }
    setPassword("");
    mostrar("Configuración de email guardada.");
  };

  const probar = async () => {
    if (probando || guardando) return;
    setError(null);
    setProbando(true);
    const res = await enviarEmailPruebaAction();
    setProbando(false);

    if (!res.ok) {
      setError(res.error ?? "No se pudo enviar el email de prueba.");
      return;
    }
    mostrar(`Email de prueba enviado a ${emailGmail || "tu email"}.`);
  };

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Email y notificaciones</h1>
          <p className={styles.subtitulo}>
            Recibe un aviso en tu Gmail cada vez que una paciente reserve una cita desde la web.
          </p>
        </div>
      </header>

      <div className={styles.rejilla}>
        <section className="tarjeta">
          <h2 className={styles.seccionTitulo}>Configuración</h2>

          <form onSubmit={(e) => void guardar(e)} className={styles.formulario}>
            {error && (
              <div className="alerta alerta--error" role="alert">
                {error}
              </div>
            )}

            {!config.hasPassword && (
              <div className="alerta alerta--aviso" role="status">
                Falta la contraseña de aplicación de Gmail: sin ella no se pueden enviar los avisos.
              </div>
            )}

            <div>
              <label htmlFor="email-gmail" className="campo-label">
                Email de Gmail <span aria-hidden="true" style={{ color: "var(--color-peligro)" }}>*</span>
              </label>
              <input
                id="email-gmail"
                type="email"
                required
                className="campo-control"
                placeholder="tu.cuenta@gmail.com"
                value={emailGmail}
                onChange={(e) => setEmailGmail(e.target.value)}
                autoComplete="username"
              />
              <span className="campo-hint">La cuenta desde la que se envían los avisos.</span>
            </div>

            <div>
              <label htmlFor="email-password" className="campo-label">
                Contraseña de aplicación
              </label>
              <input
                id="email-password"
                type="password"
                className="campo-control"
                placeholder={config.hasPassword ? "•••••••• (contraseña guardada)" : "Ej.: abcdefghijklmnop"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                minLength={8}
              />
              <span className="campo-hint">
                {config.hasPassword
                  ? "Déjala vacía para mantener la contraseña guardada."
                  : "Se consigue en tu cuenta de Google (mira el tutorial de la derecha)."}
              </span>
            </div>

            <div>
              <label htmlFor="email-nombre" className="campo-label">
                Nombre del remitente <span aria-hidden="true" style={{ color: "var(--color-peligro)" }}>*</span>
              </label>
              <input
                id="email-nombre"
                type="text"
                required
                maxLength={100}
                className="campo-control"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
              />
            </div>

            <div className={styles.interruptores}>
              <label className={styles.interruptorFila}>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
                <span>
                  <strong>Activar notificaciones por email</strong>
                  <span className={styles.interruptorTexto}>
                    Si lo desactivas, no se envía ningún aviso aunque guarde la configuración.
                  </span>
                </span>
              </label>

              <label className={styles.interruptorFila}>
                <input
                  type="checkbox"
                  checked={notifyOnBooking}
                  onChange={(e) => setNotifyOnBooking(e.target.checked)}
                  disabled={!notificationsEnabled}
                />
                <span>
                  <strong>Avisarme de cada nueva reserva</strong>
                  <span className={styles.interruptorTexto}>
                    Solo incluye nombre, fecha, hora y modalidad: nunca el motivo de la consulta.
                  </span>
                </span>
              </label>
            </div>

            <details className={styles.avanzado}>
              <summary>Configuración avanzada (servidor SMTP)</summary>
              <div className={styles.avanzadoCampos}>
                <div>
                  <label htmlFor="email-host" className="campo-label">
                    Servidor SMTP
                  </label>
                  <input
                    id="email-host"
                    type="text"
                    className="campo-control"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="email-puerto" className="campo-label">
                    Puerto
                  </label>
                  <input
                    id="email-puerto"
                    type="number"
                    min={1}
                    max={65535}
                    className="campo-control"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
              </div>
            </details>

            <div className={styles.botones}>
              <button type="submit" className="boton boton--primario" disabled={guardando || probando}>
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => void probar()}
                disabled={probando || guardando}
              >
                {probando ? "Enviando…" : "Enviar email de prueba"}
              </button>
            </div>
          </form>
        </section>

        <section className="tarjeta">
          <h2 className={styles.seccionTitulo}>Cómo conseguir la contraseña de Gmail</h2>
          <ol className={styles.tutorial}>
            <li>
              Abre{" "}
              <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">
                la seguridad de tu cuenta de Google
              </a>{" "}
              y activa la <strong>verificación en dos pasos</strong> (es obligatoria para usar
              contraseñas de aplicación).
            </li>
            <li>
              Entra en{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">
                Contraseñas de aplicaciones
              </a>
              .
            </li>
            <li>
              Escribe un nombre, por ejemplo <strong>PsicoCMS</strong>, y pulsa{" "}
              <strong>Crear</strong>.
            </li>
            <li>
              Google mostrará un código de 16 letras. <strong>Cópialo</strong> (sin espacios) y
              pégalo en el campo «Contraseña de aplicación».
            </li>
            <li>Guarda los cambios y pulsa «Enviar email de prueba» para comprobarlo.</li>
          </ol>
          <p className={styles.nota}>
            Google solo muestra el código una vez: si lo pierdes, crea otra contraseña de
            aplicación. Si cambias la contraseña de tu cuenta Google, la anterior deja de funcionar.
          </p>
        </section>
      </div>
    </div>
  );
}
