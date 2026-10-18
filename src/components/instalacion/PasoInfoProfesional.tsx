"use client";

import { useState, FormEvent } from "react";
import styles from "@/app/instalacion/instalacion.module.css";

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

interface InfoData {
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
}

interface PasoInfoProfesionalProps {
  onComplete: (data: InfoData) => void;
}

const initialData: InfoData = {
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
};

export default function PasoInfoProfesional({ onComplete }: PasoInfoProfesionalProps) {
  const [data, setData] = useState<InfoData>(initialData);
  const [newService, setNewService] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");

  const handleChange = <K extends keyof InfoData>(field: K, value: InfoData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    if (newService.trim()) {
      setData(prev => ({ ...prev, services: [...prev.services, newService.trim()] }));
      setNewService("");
    }
  };

  const removeService = (index: number) => {
    setData(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setData(prev => ({ ...prev, specialties: [...prev.specialties, newSpecialty.trim()] }));
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (index: number) => {
    setData(prev => ({ ...prev, specialties: prev.specialties.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onComplete(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className={styles.pasoTitulo}>Paso 3: Información profesional</h2>
      <p className={styles.pasoDescripcion}>
        Estos datos se mostrarán en la web pública. Podrás modificarlos después en el panel.
      </p>

      <div className={`${styles.pasoGrupo} ${styles.pasoGrupoScroll}`}>
        <div className={styles.rejilla2}>
          <div className={styles.anchoCompleto}>
            <label htmlFor="fullName" className="campo-label">Nombre y apellidos *</label>
            <input
              id="fullName"
              type="text"
              value={data.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              required
              className="campo-control"
            />
          </div>

          <div className={styles.anchoCompleto}>
            <label htmlFor="tagline" className="campo-label">Frase gancho / Eslogan</label>
            <input
              id="tagline"
              type="text"
              value={data.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
              placeholder="Ej: Psicología para tu bienestar"
              className="campo-control"
            />
          </div>

          <div>
            <label htmlFor="licenseNumber" className="campo-label">Número de colegiado</label>
            <input
              id="licenseNumber"
              type="text"
              value={data.licenseNumber}
              onChange={(e) => handleChange("licenseNumber", e.target.value)}
              className="campo-control"
            />
          </div>

          <div>
            <label htmlFor="phonePublic" className="campo-label">Teléfono público (para la web)</label>
            <input
              id="phonePublic"
              type="tel"
              value={data.phonePublic}
              onChange={(e) => handleChange("phonePublic", e.target.value)}
              placeholder="+34 600 000 000"
              className="campo-control"
            />
          </div>

          <div className={styles.anchoCompleto}>
            <label htmlFor="emailPublic" className="campo-label">Email público (para la web)</label>
            <input
              id="emailPublic"
              type="email"
              value={data.emailPublic}
              onChange={(e) => handleChange("emailPublic", e.target.value)}
              className="campo-control"
            />
          </div>

          <div className={styles.anchoCompleto}>
            <label htmlFor="locationName" className="campo-label">Nombre del lugar de consulta</label>
            <input
              id="locationName"
              type="text"
              value={data.locationName}
              onChange={(e) => handleChange("locationName", e.target.value)}
              placeholder="Ej: Centro de Psicología Bienestar"
              className="campo-control"
            />
          </div>

          <div className={styles.anchoCompleto}>
            <label htmlFor="address" className="campo-label">Dirección</label>
            <input
              id="address"
              type="text"
              value={data.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Ej: Gran Vía 23, 28013 Madrid"
              className="campo-control"
            />
          </div>

          <div className={styles.anchoCompleto}>
            <label htmlFor="bio" className="campo-label">Sobre mí / Biografía</label>
            <textarea
              id="bio"
              value={data.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={4}
              className="campo-control"
            />
          </div>
        </div>

        <div className={styles.seccion}>
          <h3 className={styles.seccionTitulo}>Configuración de sesiones</h3>
          <div className={styles.rejilla2}>
            <div>
              <label htmlFor="sessionDurationOnline" className="campo-label">Duración sesión online (minutos)</label>
              <input
                id="sessionDurationOnline"
                type="number"
                value={data.sessionDurationOnline}
                onChange={(e) => handleChange("sessionDurationOnline", parseInt(e.target.value) || 50)}
                min={15}
                max={120}
                className="campo-control"
              />
            </div>

            <div>
              <label htmlFor="sessionDurationInperson" className="campo-label">Duración sesión presencial (minutos)</label>
              <input
                id="sessionDurationInperson"
                type="number"
                value={data.sessionDurationInperson}
                onChange={(e) => handleChange("sessionDurationInperson", parseInt(e.target.value) || 50)}
                min={15}
                max={120}
                className="campo-control"
              />
            </div>

            <label className="fila-check">
              <input
                id="breakEnabledOnline"
                type="checkbox"
                checked={data.breakEnabledOnline}
                onChange={(e) => handleChange("breakEnabledOnline", e.target.checked)}
              />
              Activar descanso entre sesiones online
            </label>

            <div>
              <label htmlFor="breakBetweenSessionsOnline" className="campo-label">Descanso online (minutos)</label>
              <input
                id="breakBetweenSessionsOnline"
                type="number"
                value={data.breakBetweenSessionsOnline}
                onChange={(e) => handleChange("breakBetweenSessionsOnline", parseInt(e.target.value) || 0)}
                min={0}
                max={60}
                disabled={!data.breakEnabledOnline}
                className="campo-control"
              />
            </div>

            <label className="fila-check">
              <input
                id="breakEnabledInperson"
                type="checkbox"
                checked={data.breakEnabledInperson}
                onChange={(e) => handleChange("breakEnabledInperson", e.target.checked)}
              />
              Activar descanso entre sesiones presencial
            </label>

            <div>
              <label htmlFor="breakBetweenSessionsInperson" className="campo-label">Descanso presencial (minutos)</label>
              <input
                id="breakBetweenSessionsInperson"
                type="number"
                value={data.breakBetweenSessionsInperson}
                onChange={(e) => handleChange("breakBetweenSessionsInperson", parseInt(e.target.value) || 0)}
                min={0}
                max={60}
                disabled={!data.breakEnabledInperson}
                className="campo-control"
              />
            </div>
          </div>
        </div>

        <div className={styles.seccion}>
          <h3 className={styles.seccionTitulo}>Servicios principales</h3>
          <div className={styles.chipsEntrada}>
            <input
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
              placeholder="Ej: Terapia individual"
              className={`campo-control ${styles.campoControlFlex}`}
            />
            <button type="button" onClick={addService} className="boton boton--primario">
              Añadir
            </button>
          </div>
          <div className={styles.chipsLista}>
            {data.services.length === 0 && (
              <p className={styles.chipsVacio}>Aún no has añadido servicios.</p>
            )}
            {data.services.map((s, i) => (
              <span key={i} className={styles.chip}>
                {s}
                <button type="button" onClick={() => removeService(i)} className={styles.chipQuitar} aria-label={`Quitar ${s}`}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className={styles.seccion}>
          <h3 className={styles.seccionTitulo}>Especialidades</h3>
          <div className={styles.chipsEntrada}>
            <input
              type="text"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
              placeholder="Ej: Ansiedad"
              className={`campo-control ${styles.campoControlFlex}`}
            />
            <button type="button" onClick={addSpecialty} className="boton boton--primario">
              Añadir
            </button>
          </div>
          <div className={styles.chipsLista}>
            {data.specialties.length === 0 && (
              <p className={styles.chipsVacio}>Aún no has añadido especialidades.</p>
            )}
            {data.specialties.map((s, i) => (
              <span key={i} className={styles.chip}>
                {s}
                <button type="button" onClick={() => removeSpecialty(i)} className={styles.chipQuitar} aria-label={`Quitar ${s}`}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" className="boton boton--primario boton--bloque" style={{ marginTop: "1.6rem" }}>
        Continuar
      </button>
    </form>
  );
}
