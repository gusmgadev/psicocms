"use client";

import { useState, FormEvent } from "react";

interface PasoInfoProfesionalProps {
  onComplete: (data: Record<string, any>) => void;
}

const initialData = {
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
  services: [] as string[],
  specialties: [] as string[],
  plans: [] as any[],
  availability: [] as any[],
};

export default function PasoInfoProfesional({ onComplete }: PasoInfoProfesionalProps) {
  const [data, setData] = useState(initialData);
  const [newService, setNewService] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");

  const handleChange = (field: string, value: any) => {
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
    const submitData = {
      ...data,
      services: JSON.stringify(data.services),
      specialties: JSON.stringify(data.specialties),
      plans: JSON.stringify(data.plans),
      availability: JSON.stringify(data.availability),
    };
    onComplete(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-texto)] mb-2">Paso 3: Información profesional</h2>
        <p className="text-[var(--color-texto-suave)]">
          Estos datos se mostrarán en la web pública. Podrás modificarlos después en el panel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="fullName" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Nombre y apellidos *
          </label>
          <input
            id="fullName"
            type="text"
            value={data.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            required
            className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="tagline" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Frase gancho / Eslogan
          </label>
          <input
            id="tagline"
            type="text"
            value={data.tagline}
            onChange={(e) => handleChange("tagline", e.target.value)}
            placeholder="Ej: Psicología para tu bienestar"
            className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="licenseNumber" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Número de colegiado
          </label>
          <input
            id="licenseNumber"
            type="text"
            value={data.licenseNumber}
            onChange={(e) => handleChange("licenseNumber", e.target.value)}
            className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="phonePublic" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Teléfono público (para la web)
          </label>
          <input
            id="phonePublic"
            type="tel"
            value={data.phonePublic}
            onChange={(e) => handleChange("phonePublic", e.target.value)}
            placeholder="+34 600 000 000"
            className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="emailPublic" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Email público (para la web)
          </label>
          <input
            id="emailPublic"
            type="email"
            value={data.emailPublic}
            onChange={(e) => handleChange("emailPublic", e.target.value)}
            className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="locationName" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Nombre del lugar de consulta
          </label>
          <input
            id="locationName"
            type="text"
            value={data.locationName}
            onChange={(e) => handleChange("locationName", e.target.value)}
            placeholder="Ej: Centro de Psicología Bienestar"
            className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Dirección
          </label>
          <input
            id="address"
            type="text"
            value={data.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Ej: Gran Vía 23, 28013 Madrid"
            className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="bio" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Sobre mí / Biografía
          </label>
          <textarea
            id="bio"
            value={data.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
        </div>
      </div>

      <div className="border-t border-[var(--color-borde)] pt-6">
        <h3 className="text-lg font-medium text-[var(--color-texto)] mb-4">Configuración de sesiones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sessionDurationOnline" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
              Duración sesión online (minutos)
            </label>
            <input
              id="sessionDurationOnline"
              type="number"
              value={data.sessionDurationOnline}
              onChange={(e) => handleChange("sessionDurationOnline", parseInt(e.target.value) || 50)}
              min={15}
              max={120}
              className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="sessionDurationInperson" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
              Duración sesión presencial (minutos)
            </label>
            <input
              id="sessionDurationInperson"
              type="number"
              value={data.sessionDurationInperson}
              onChange={(e) => handleChange("sessionDurationInperson", parseInt(e.target.value) || 50)}
              min={15}
              max={120}
              className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="breakEnabledOnline"
              type="checkbox"
              checked={data.breakEnabledOnline}
              onChange={(e) => handleChange("breakEnabledOnline", e.target.checked)}
              className="w-4 h-4 text-[var(--color-primario)] border-[var(--color-borde)] rounded focus:ring-[var(--color-primario)]"
            />
            <label htmlFor="breakEnabledOnline" className="text-sm text-[var(--color-texto)]">
              Activar descanso entre sesiones online
            </label>
          </div>

          <div>
            <label htmlFor="breakBetweenSessionsOnline" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
              Descanso online (minutos)
            </label>
            <input
              id="breakBetweenSessionsOnline"
              type="number"
              value={data.breakBetweenSessionsOnline}
              onChange={(e) => handleChange("breakBetweenSessionsOnline", parseInt(e.target.value) || 0)}
              min={0}
              max={60}
              disabled={!data.breakEnabledOnline}
              className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent disabled:bg-[var(--color-fondo-alt)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="breakEnabledInperson"
              type="checkbox"
              checked={data.breakEnabledInperson}
              onChange={(e) => handleChange("breakEnabledInperson", e.target.checked)}
              className="w-4 h-4 text-[var(--color-primario)] border-[var(--color-borde)] rounded focus:ring-[var(--color-primario)]"
            />
            <label htmlFor="breakEnabledInperson" className="text-sm text-[var(--color-texto)]">
              Activar descanso entre sesiones presencial
            </label>
          </div>

          <div>
            <label htmlFor="breakBetweenSessionsInperson" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
              Descanso presencial (minutos)
            </label>
            <input
              id="breakBetweenSessionsInperson"
              type="number"
              value={data.breakBetweenSessionsInperson}
              onChange={(e) => handleChange("breakBetweenSessionsInperson", parseInt(e.target.value) || 0)}
              min={0}
              max={60}
              disabled={!data.breakEnabledInperson}
              className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent disabled:bg-[var(--color-fondo-alt)]"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-borde)] pt-6">
        <h3 className="text-lg font-medium text-[var(--color-texto)] mb-4">Servicios principales</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
            placeholder="Ej: Terapia individual"
            className="flex-1 px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
          <button type="button" onClick={addService} className="px-4 py-3 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors">
            Añadir
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.services.map((s, i) => (
            <span key={i} className="px-3 py-1 bg-[var(--color-primario)]/10 text-[var(--color-primario)] rounded-full text-sm flex items-center gap-1">
              {s}
              <button type="button" onClick={() => removeService(i)} className="hover:text-red-600">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--color-borde)] pt-6">
        <h3 className="text-lg font-medium text-[var(--color-texto)] mb-4">Especialidades</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
            placeholder="Ej: Ansiedad"
            className="flex-1 px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          />
          <button type="button" onClick={addSpecialty} className="px-4 py-3 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors">
            Añadir
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.specialties.map((s, i) => (
            <span key={i} className="px-3 py-1 bg-[var(--color-primario)]/10 text-[var(--color-primario)] rounded-full text-sm flex items-center gap-1">
              {s}
              <button type="button" onClick={() => removeSpecialty(i)} className="hover:text-red-600">×</button>
            </span>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors font-medium"
      >
        Continuar
      </button>
    </form>
  );
}