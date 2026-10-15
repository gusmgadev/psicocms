"use client";

import { useState } from "react";

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

    // Validar tipo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(f.type)) {
      setError("Solo se permiten imágenes JPG, PNG o WebP");
      return;
    }

    // Validar tamaño (5MB)
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-texto)] mb-2">Paso 4: Foto de la psicóloga</h2>
        <p className="text-[var(--color-texto-suave)]">
          Sube una foto tuya, preferiblemente sin fondo (formato PNG con transparencia o WebP).
          Se usará en la web pública. Máximo 5 MB.
        </p>
      </div>

      <div className="border-2 border-dashed border-[var(--color-borde)] rounded-[var(--radius-lg)] p-8 text-center">
        {preview ? (
          <div className="space-y-4">
            <img src={preview} alt="Previsualización" className="max-w-full max-h-64 mx-auto rounded-[var(--radius-md)]" />
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleUpload}
                disabled={uploading || success}
                className="px-6 py-3 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors font-medium disabled:opacity-50"
              >
                {uploading ? "Subiendo..." : success ? "✓ Subida correctamente" : "Subir foto"}
              </button>
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); setSuccess(false); }}
                className="px-6 py-3 border border-[var(--color-borde)] text-[var(--color-texto)] rounded-[var(--radius-md)] hover:bg-[var(--color-fondo-alt)] transition-colors"
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
            <label htmlFor="photo" className="cursor-pointer">
              <div className="mx-auto w-16 h-16 rounded-full bg-[var(--color-primario)]/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[var(--color-primario)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[var(--color-texto)] font-medium">Haz clic para seleccionar una foto</p>
              <p className="text-sm text-[var(--color-texto-suave)] mt-1">JPG, PNG o WebP · Máx. 5 MB</p>
            </label>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm mt-4" role="alert">{error}</p>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-[var(--radius-md)] p-4">
          <p className="text-green-700 font-medium">¡Foto subida correctamente!</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSkip}
        className="w-full py-3 px-4 border border-[var(--color-borde)] text-[var(--color-texto)] rounded-[var(--radius-md)] hover:bg-[var(--color-fondo-alt)] transition-colors font-medium"
      >
        Saltar (puedo subirla después en el panel)
      </button>
    </div>
  );
}