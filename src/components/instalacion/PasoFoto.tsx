"use client";

import { useState } from "react";
import styles from "@/app/instalacion/instalacion.module.css";

interface PasoFotoProps {
  onComplete: (photoPath: string | undefined) => void;
  onSkip: () => void;
}

export default function PasoFoto({ onComplete, onSkip }: PasoFotoProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(f.type)) {
      setError("Solo se permiten imágenes JPG, PNG o WebP");
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar 5 MB");
      return;
    }

    setFile(f);
    setError(null);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch("/api/instalacion/subir-foto", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        onComplete(data.path);
      } else {
        setError(data.error || "Error subiendo la imagen");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    onComplete(undefined);
    onSkip();
  };

  return (
    <div>
      <h2 className={styles.pasoTitulo}>Paso 4: Foto de la psicóloga</h2>
      <p className={styles.pasoDescripcion}>
        Sube una foto tuya, preferiblemente sin fondo (formato PNG con transparencia o WebP).
        Se usará en la web pública. Máximo 5 MB.
      </p>

      <div className={styles.zonaDrop}>
        {preview ? (
          <div>
            <img src={preview} alt="Previsualización de la foto" className={styles.fotoPreview} />
            <div className={styles.fotoAcciones}>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || success}
                className="boton boton--primario"
              >
                {uploading ? "Subiendo..." : success ? "Subida correctamente" : "Subir foto"}
                {success && <i className="fa fa-check" aria-hidden="true"></i>}
              </button>
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); setSuccess(false); }}
                className="boton boton--secundario"
              >
                Cambiar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="file"
              id="photo"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />
            <label htmlFor="photo">
              <div className={styles.dropIcono}>
                <i className="fa fa-camera" aria-hidden="true"></i>
              </div>
              <p className={styles.dropTexto}>Haz clic para seleccionar una foto</p>
              <p className={styles.dropAyuda}>JPG, PNG o WebP · Máx. 5 MB</p>
            </label>
          </div>
        )}

        {error && (
          <p className="campo-error" role="alert" style={{ marginTop: "1.2rem" }}>{error}</p>
        )}
      </div>

      {success && (
        <div className="alerta alerta--exito" style={{ marginBottom: "1.6rem" }}>
          ¡Foto subida correctamente!
        </div>
      )}

      <button
        type="button"
        onClick={handleSkip}
        className="boton boton--secundario boton--bloque"
      >
        Saltar (puedo subirla después en el panel)
      </button>
    </div>
  );
}
