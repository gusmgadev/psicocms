"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PasoConexion from "@/components/instalacion/PasoConexion";
import PasoAcceso from "@/components/instalacion/PasoAcceso";
import PasoInfoProfesional from "@/components/instalacion/PasoInfoProfesional";
import PasoFoto from "@/components/instalacion/PasoFoto";
import PasoTema from "@/components/instalacion/PasoTema";

type Paso = "conexion" | "acceso" | "info" | "foto" | "tema";

interface FormData {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  tagline: string;
  licenseNumber: string;
  phonePublic: string;
  emailPublic: string;
  bio: string;
  address: string;
  locationName: string;
  sessionDurationOnline: number;
  sessionDurationInperson: number;
  breakBetweenSessionsOnline: number;
  breakBetweenSessionsInperson: number;
  breakEnabledOnline: boolean;
  breakEnabledInperson: boolean;
  services: string[];
  specialties: string[];
  plans: any[];
  availability: any[];
  photoPath?: string;
  theme: string;
  layoutMode: "landing" | "multipage";
  installToken: string;
}

const initialFormData: FormData = {
  email: "",
  phone: "",
  password: "",
  fullName: "",
  tagline: "",
  licenseNumber: "",
  phonePublic: "",
  emailPublic: "",
  bio: "",
  address: "",
  locationName: "",
  sessionDurationOnline: 50,
  sessionDurationInperson: 50,
  breakBetweenSessionsOnline: 0,
  breakBetweenSessionsInperson: 0,
  breakEnabledOnline: false,
  breakEnabledInperson: false,
  services: [],
  specialties: [],
  plans: [],
  availability: [],
  theme: "base",
  layoutMode: "multipage",
  installToken: "",
};

const pasos: { id: Paso; label: string }[] = [
  { id: "conexion", label: "Conexión" },
  { id: "acceso", label: "Acceso" },
  { id: "info", label: "Información" },
  { id: "foto", label: "Foto" },
  { id: "tema", label: "Tema" },
];

export default function InstalacionPage() {
  const router = useRouter();
  const [pasoActual, setPasoActual] = useState<Paso>("conexion");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    checkSetupCompleted();
  }, []);

  const checkSetupCompleted = async () => {
    try {
      const res = await fetch("/api/instalacion/verificar-instalacion");
      const data = await res.json();
      if (data.completed) {
        setSetupCompleted(true);
        router.push("/acceso-psicologa");
      }
    } catch {
      // Ignorar errores
    }
  };

  const handlePasoComplete = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    const currentIndex = pasos.findIndex(p => p.id === pasoActual);
    if (currentIndex < pasos.length - 1) {
      setPasoActual(pasos[currentIndex + 1].id);
    }
  };

  const handleFinalSubmit = async () => {
    setInstalling(true);
    setError(null);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            submitData.append(key, JSON.stringify(value));
          } else {
            submitData.append(key, String(value));
          }
        }
      });

      const res = await fetch("/api/instalacion/ejecutar", {
        method: "POST",
        body: submitData,
      });
      const result = await res.json();

      if (result.ok) {
        router.push("/panel-psicologa");
        router.refresh();
      } else {
        setError(result.error || "Error en la instalación");
        if (result.redirect) {
          router.push(result.redirect);
        }
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setInstalling(false);
    }
  };

  const handleSkipFoto = () => {
    const currentIndex = pasos.findIndex(p => p.id === pasoActual);
    if (currentIndex < pasos.length - 1) {
      setPasoActual(pasos[currentIndex + 1].id);
    }
  };

  if (setupCompleted) {
    return null; // Se redirige en el useEffect
  }

  const currentIndex = pasos.findIndex(p => p.id === pasoActual);
  const progress = ((currentIndex + 1) / pasos.length) * 100;

  return (
    <div className="min-h-screen bg-[var(--color-fondo-alt)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-[var(--color-texto-suave)] mb-2">
            {pasos.map((p, i) => (
              <span key={p.id} className={i === currentIndex ? "font-medium text-[var(--color-primario)]" : ""}>
                {p.label}
              </span>
            ))}
          </div>
          <div className="h-2 bg-[var(--color-borde)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primario)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-700" role="alert">
            {error}
          </div>
        )}

        {/* Steps */}
        <div className="bg-[var(--color-fondo)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-8">
          <h1 className="text-2xl font-bold text-[var(--color-texto)] mb-6 text-center">
            Instalación de PsicoCMS
          </h1>

          {pasoActual === "conexion" && (
            <PasoConexion onComplete={(installToken) => handlePasoComplete({ installToken })} />
          )}

          {pasoActual === "acceso" && (
            <PasoAcceso onComplete={(data) => handlePasoComplete(data)} />
          )}

          {pasoActual === "info" && (
            <PasoInfoProfesional onComplete={(data) => handlePasoComplete(data)} />
          )}

          {pasoActual === "foto" && (
            <PasoFoto
              onComplete={(photoPath) => handlePasoComplete({ photoPath })}
              onSkip={handleSkipFoto}
            />
          )}

          {pasoActual === "tema" && (
            <PasoTema onComplete={(data) => handlePasoComplete(data)} />
          )}
        </div>

        {/* Final submit button (only shown on last step) */}
        {pasoActual === "tema" && !installing && !error && (
          <button
            onClick={handleFinalSubmit}
            className="w-full mt-6 py-3 px-4 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors font-medium"
          >
            Finalizar instalación
          </button>
        )}
      </div>
    </div>
  );
}