"use client";

import { useRef, useState, type FormEvent } from "react";
import { ConfirmarModal, Modal, useToast } from "@/components/ui";
import {
  cambiarEmailAccesoAction,
  guardarPerfilPrivadoAction,
  quitarAvatarAction,
  subirAvatarAction,
} from "@/actions/perfil";
import { updatePasswordAction } from "@/actions/auth";
import { activarMfaAction, desactivarMfaAction, iniciarMfaAction } from "@/actions/mfa";
import type { PerfilPrivado } from "@/services/perfil-privado";
import styles from "./perfil.module.css";

interface PerfilPanelProps {
  perfil: PerfilPrivado;
  email: string;
  mfaActivo: boolean;
}

export default function PerfilPanel({ perfil, email, mfaActivo }: PerfilPanelProps) {
  const { mostrar } = useToast();

  const [nombre, setNombre] = useState(perfil.nombre);
  const [telefono, setTelefono] = useState(perfil.telefonoPrivado);
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(perfil.avatarUrl);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);
  const [quitandoAvatar, setQuitandoAvatar] = useState(false);
  const inputAvatar = useRef<HTMLInputElement>(null);

  const [nuevoEmail, setNuevoEmail] = useState("");
  const [passwordEmail, setPasswordEmail] = useState("");
  const [cambiandoEmail, setCambiandoEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const [mfa, setMfa] = useState(mfaActivo);
  const [modalMfa, setModalMfa] = useState(false);
  const [iniciandoMfa, setIniciandoMfa] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secreto, setSecreto] = useState<string | null>(null);
  const [codigoMfa, setCodigoMfa] = useState("");
  const [activandoMfa, setActivandoMfa] = useState(false);
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false);
  const [desactivandoMfa, setDesactivandoMfa] = useState(false);

  const guardarDatos = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (guardandoDatos) return;
    setGuardandoDatos(true);
    const res = await guardarPerfilPrivadoAction(nombre, telefono);
    setGuardandoDatos(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudieron guardar los datos.", "error");
      return;
    }
    mostrar("Datos del perfil guardados.");
  };

  const subirAvatar = async (archivo: File | undefined) => {
    if (!archivo || subiendoAvatar) return;
    setSubiendoAvatar(true);

    const formData = new FormData();
    formData.set("archivo", archivo);
    const res = await subirAvatarAction(formData);
    setSubiendoAvatar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo subir la foto.", "error");
      return;
    }
    setAvatarUrl(res.url ?? null);
    mostrar("Foto de perfil actualizada.");
  };

  const quitarAvatar = async () => {
    if (quitandoAvatar) return;
    setQuitandoAvatar(true);
    const res = await quitarAvatarAction();
    setQuitandoAvatar(false);
    setConfirmarQuitar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo quitar la foto.", "error");
      return;
    }
    setAvatarUrl(null);
    mostrar("Foto de perfil eliminada.");
  };

  const cambiarEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cambiandoEmail) return;
    setCambiandoEmail(true);

    const formData = new FormData();
    formData.set("email", nuevoEmail);
    formData.set("password", passwordEmail);
    const res = await cambiarEmailAccesoAction(formData);
    setCambiandoEmail(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo cambiar el email.", "error");
      return;
    }
    setNuevoEmail("");
    setPasswordEmail("");
    mostrar("Email de acceso actualizado.");
  };

  const cambiarPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cambiandoPassword) return;
    setCambiandoPassword(true);

    const formData = new FormData();
    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);
    const res = await updatePasswordAction(formData);
    setCambiandoPassword(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo cambiar la contraseña.", "error");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    mostrar("Contraseña actualizada.");
  };

  const abrirActivacionMfa = async () => {
    if (iniciandoMfa) return;
    setCodigoMfa("");
    setFactorId(null);
    setQrCode(null);
    setSecreto(null);
    setModalMfa(true);
    setIniciandoMfa(true);

    const res = await iniciarMfaAction();
    setIniciandoMfa(false);

    if (!res.ok || !res.factorId) {
      mostrar(res.error ?? "No se pudo iniciar la verificación en dos pasos.", "error");
      setModalMfa(false);
      return;
    }
    setFactorId(res.factorId);
    setQrCode(res.qrCode ?? null);
    setSecreto(res.secret ?? null);
  };

  const activarMfa = async () => {
    if (activandoMfa || !factorId) return;
    setActivandoMfa(true);

    const res = await activarMfaAction(factorId, codigoMfa);
    setActivandoMfa(false);

    if (!res.ok) {
      mostrar(res.error ?? "El código no es correcto.", "error");
      return;
    }
    setMfa(true);
    setModalMfa(false);
    mostrar("Verificación en dos pasos activada.");
  };

  const desactivarMfa = async () => {
    if (desactivandoMfa) return;
    setDesactivandoMfa(true);

    const res = await desactivarMfaAction();
    setDesactivandoMfa(false);
    setConfirmarDesactivar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo desactivar la verificación.", "error");
      return;
    }
    setMfa(false);
    mostrar("Verificación en dos pasos desactivada.");
  };

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Perfil privado</h1>
          <p className={styles.subtitulo}>
            Tus datos de acceso, tu foto y la seguridad de tu cuenta. No se muestran en la web pública.
          </p>
        </div>
      </header>

      <div className={styles.rejilla}>
        <section className="tarjeta">
          <h2 className={styles.seccionTitulo}>Tus datos</h2>
          <p className={styles.seccionTexto}>
            El nombre es el que aparece en el panel y en la web pública. El teléfono privado es el que
            usas para iniciar sesión (junto al email y la contraseña).
          </p>

          <form className={styles.formulario} onSubmit={(e) => void guardarDatos(e)}>
            <div>
              <label htmlFor="perfil-nombre" className="campo-label">
                Nombre y apellidos <span style={{ color: "var(--color-peligro)" }}>*</span>
              </label>
              <input
                id="perfil-nombre"
                type="text"
                required
                maxLength={150}
                className="campo-control"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="perfil-telefono" className="campo-label">
                Teléfono privado (de acceso)
              </label>
              <input
                id="perfil-telefono"
                type="tel"
                maxLength={30}
                className="campo-control"
                placeholder="Ej.: 600 123 456"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                autoComplete="tel"
              />
              <span className="campo-hint">
                Se usa como tercer dato del login. Si lo dejas vacío, se usa tu teléfono público.
              </span>
            </div>

            <div className={styles.botones}>
              <button type="submit" className="boton boton--primario" disabled={guardandoDatos}>
                {guardandoDatos ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>

        <section className="tarjeta">
          <h2 className={styles.seccionTitulo}>Foto de perfil</h2>
          <p className={styles.seccionTexto}>
            Aparece en la cabecera y el pie del menú del panel. Formato JPG, PNG o WebP, máximo 2 MB.
          </p>

          <div className={styles.avatarZona}>
            <span className={styles.avatarGrande}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Foto de perfil" />
              ) : (
                <i className="fa fa-user" aria-hidden="true"></i>
              )}
            </span>
            <div className={styles.avatarAcciones}>
              <input
                ref={inputAvatar}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  void subirAvatar(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="boton boton--secundario"
                disabled={subiendoAvatar}
                onClick={() => inputAvatar.current?.click()}
              >
                {subiendoAvatar ? "Subiendo…" : avatarUrl ? "Cambiar foto" : "Subir foto"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  className="boton boton--peligro"
                  disabled={subiendoAvatar}
                  onClick={() => setConfirmarQuitar(true)}
                >
                  <i className="fa fa-trash" aria-hidden="true"></i>
                  Quitar foto
                </button>
              )}
            </div>
          </div>

          <p className={styles.nota}>
            Consejo: si puedes, sube una foto sin fondo: queda más limpia en la web pública.
          </p>
        </section>

        <section className="tarjeta">
          <h2 className={styles.seccionTitulo}>Email y contraseña de acceso</h2>
          <p className={styles.seccionTexto}>
            Con estos datos inicias sesión en el panel. Para cambios sensibles pedimos siempre la
            contraseña actual.
          </p>

          <form className={styles.formulario} onSubmit={(e) => void cambiarEmail(e)}>
            <div>
              <label htmlFor="perfil-email" className="campo-label">
                Email de acceso actual
              </label>
              <input id="perfil-email" type="email" className="campo-control" value={email} disabled />
            </div>

            <div>
              <label htmlFor="perfil-email-nuevo" className="campo-label">
                Nuevo email
              </label>
              <input
                id="perfil-email-nuevo"
                type="email"
                required
                maxLength={200}
                className="campo-control"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="perfil-email-password" className="campo-label">
                Contraseña actual <span style={{ color: "var(--color-peligro)" }}>*</span>
              </label>
              <input
                id="perfil-email-password"
                type="password"
                required
                className="campo-control"
                value={passwordEmail}
                onChange={(e) => setPasswordEmail(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className={styles.botones}>
              <button type="submit" className="boton boton--secundario" disabled={cambiandoEmail}>
                {cambiandoEmail ? "Cambiando…" : "Cambiar email"}
              </button>
            </div>
          </form>

          <hr className={styles.divisor} />

          <form className={styles.formulario} onSubmit={(e) => void cambiarPassword(e)}>
            <div>
              <label htmlFor="perfil-pwd-actual" className="campo-label">
                Contraseña actual <span style={{ color: "var(--color-peligro)" }}>*</span>
              </label>
              <input
                id="perfil-pwd-actual"
                type="password"
                required
                className="campo-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="perfil-pwd-nueva" className="campo-label">
                Nueva contraseña <span style={{ color: "var(--color-peligro)" }}>*</span>
              </label>
              <input
                id="perfil-pwd-nueva"
                type="password"
                required
                minLength={12}
                className="campo-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <span className="campo-hint">Mínimo 12 caracteres.</span>
            </div>

            <div>
              <label htmlFor="perfil-pwd-confirmar" className="campo-label">
                Repite la nueva contraseña <span style={{ color: "var(--color-peligro)" }}>*</span>
              </label>
              <input
                id="perfil-pwd-confirmar"
                type="password"
                required
                minLength={12}
                className="campo-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className={styles.botones}>
              <button type="submit" className="boton boton--secundario" disabled={cambiandoPassword}>
                {cambiandoPassword ? "Cambiando…" : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        </section>

        <section className="tarjeta">
          <h2 className={styles.seccionTitulo}>Verificación en dos pasos</h2>
          <p className={styles.seccionTexto}>
            Añade una capa extra de seguridad: además de la contraseña, deberás escribir un código de 6
            dígitos de una aplicación de autenticación (Google Authenticator, Authy, 1Password…).
          </p>

          <div className={styles.estadoFila}>
            {mfa ? (
              <span className={`${styles.insignia} ${styles.insigniaActiva}`}>
                <i className="fa fa-shield-halved" aria-hidden="true"></i> Activada
              </span>
            ) : (
              <span className={`${styles.insignia} ${styles.insigniaInactiva}`}>
                <i className="fa fa-shield" aria-hidden="true"></i> Desactivada
              </span>
            )}
          </div>

          {mfa ? (
            <button
              type="button"
              className="boton boton--peligro"
              onClick={() => setConfirmarDesactivar(true)}
            >
              Desactivar verificación en dos pasos
            </button>
          ) : (
            <button type="button" className="boton boton--primario" onClick={() => void abrirActivacionMfa()}>
              <i className="fa fa-shield-halved" aria-hidden="true"></i>
              Activar verificación en dos pasos
            </button>
          )}

          <p className={styles.nota}>
            Si pierdes el acceso a tu aplicación de autenticación, podrás recuperar el acceso siguiendo
            el proceso de recuperación documentado en el proyecto (MAP.md).
          </p>
        </section>
      </div>

      <Modal
        abierto={modalMfa}
        onCerrar={() => setModalMfa(false)}
        titulo="Activar verificación en dos pasos"
        pie={
          <>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => setModalMfa(false)}
              disabled={activandoMfa || iniciandoMfa}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="boton boton--primario"
              onClick={() => void activarMfa()}
              disabled={activandoMfa || iniciandoMfa || codigoMfa.length !== 6}
            >
              {activandoMfa ? "Activando…" : "Activar"}
            </button>
          </>
        }
      >
        {iniciandoMfa ? (
          <p className="campo-hint">Preparando la verificación…</p>
        ) : (
          <div className={styles.qrZona}>
            <ol className={styles.pasos}>
              <li>
                Abre tu aplicación de autenticación y añade una cuenta nueva con el botón de escanear.
              </li>
              <li>Escanea este código QR (o introduce el código de abajo a mano).</li>
              <li>Escribe el código de 6 dígitos que aparezca para terminar.</li>
            </ol>

            {qrCode ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.qrImagen} src={qrCode} alt="Código QR de activación" />
            ) : null}

            {secreto ? <p className={styles.qrSecreto}>{secreto}</p> : null}

            <div style={{ width: "100%" }}>
              <label htmlFor="mfa-codigo" className="campo-label">
                Código de verificación <span style={{ color: "var(--color-peligro)" }}>*</span>
              </label>
              <input
                id="mfa-codigo"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                className={`campo-control ${styles.codigoInput}`}
                placeholder="000000"
                value={codigoMfa}
                onChange={(e) => setCodigoMfa(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmarModal
        abierto={confirmarQuitar}
        onCancelar={() => setConfirmarQuitar(false)}
        onConfirmar={() => void quitarAvatar()}
        titulo="Quitar la foto de perfil"
        mensaje="La foto se eliminará y volverá a mostrarse tu inicial en el panel y en la web."
        textoConfirmar="Quitar foto"
        cargando={quitandoAvatar}
      />

      <ConfirmarModal
        abierto={confirmarDesactivar}
        onCancelar={() => setConfirmarDesactivar(false)}
        onConfirmar={() => void desactivarMfa()}
        titulo="Desactivar verificación en dos pasos"
        mensaje="Tu cuenta volverá a protegerse solo con la contraseña. Se recomienda mantenerla activada."
        textoConfirmar="Desactivar"
        cargando={desactivandoMfa}
      />
    </div>
  );
}
