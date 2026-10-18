"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PasoConexion from "@/components/instalacion/PasoConexion";
import PasoAcceso from "@/components/instalacion/PasoAcceso";
import PasoInfoProfesional from "@/components/instalacion/PasoInfoProfesional";
import PasoFoto from "@/components/instalacion/PasoFoto";
import PasoTema from "@/components/instalacion/PasoTema";
import styles from "./instalacion.module.css";

type Paso = "conexion" | "acceso" | "info" | "foto" | "tema";

interface PlanInstalacion {
  name: string;
  description: string;
  priceOnline: number;
  priceInperson: number;
  features: string[];
}

interface DisponibilidadInstalacion {
  modality: "online" | "inperson";
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface FormDataInstalacion {
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
  plans: PlanInstalacion[];
  availability: DisponibilidadInstalacion[];
  photoPath?: string;
  theme: string;
  layoutMode: "landing" | "multipage";
  installToken: string;
}

const initialFormData: FormDataInstalacion = {
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
  const [formData, setFormData] = useState<FormDataInstalacion>(initialFormData);
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

  const handlePasoComplete = (data: Partial<FormDataInstalacion>) => {
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
    return null;
  }

  const currentIndex = pasos.findIndex(p => p.id === pasoActual);
  const progress = ((currentIndex + 1) / pasos.length) * 100;

  return (
    <div className={styles.card}>
      <h1 className={styles.titulo}>Instalación de PsicoCMS</h1>

      <div className={styles.progresoEtiquetas}>
        {pasos.map((p, i) => (
          <span key={p.id} className={i === currentIndex ? styles.progresoEtiquetaActivo : undefined}>
            {p.label}
          </span>
        ))}
      </div>
      <div className={styles.progresoBarra}>
        <div className={styles.progresoRelleno} style={{ width: `${progress}%` }} />
      </div>

      {error && (
        <div className={`${styles.resultado} ${styles.resultadoError}`} role="alert">
          {error}
        </div>
      )}

      {pasoActual === "conexion" && (
        <PasoConexion
          onVerified={(installToken) => handlePasoComplete({ installToken })}
        />
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
        <>
          <PasoTema onData={(data) => setFormData(prev => ({ ...prev, ...data }))} />
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={installing}
            className={`boton boton--primario boton--bloque ${styles.botonFinal}`}
          >
            {installing ? "Instalando..." : "Finalizar instalación"}
          </button>
        </>
      )}
    </div>
  );
}
