"use client";

import { useEffect, useState } from "react";
import { Campo, Modal } from "@/components/ui";
import { crearPacienteAction, editarPacienteAction } from "@/actions/pacientes";
import type { InputPaciente, PacienteFila } from "@/services/pacientes";
import styles from "./PacienteModal.module.css";

const GENEROS: { valor: string; etiqueta: string }[] = [
  { valor: "femenino", etiqueta: "Femenino" },
  { valor: "masculino", etiqueta: "Masculino" },
  { valor: "otro", etiqueta: "Otro" },
  { valor: "no especificado", etiqueta: "Prefiero no decirlo" },
];

interface Props {
  abierto: boolean;
  editando: PacienteFila | null;
  onCerrar: () => void;
  onGuardado: (paciente: PacienteFila, aviso?: string) => void;
}

export default function PacienteModal({ abierto, editando, onCerrar, onGuardado }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [possibleDuplicate, setPossibleDuplicate] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    if (editando) {
      setNombre(editando.nombre);
      setTelefono(editando.telefono);
      setEmail(editando.email ?? "");
      setBirthDate(editando.birthDate ?? "");
      setGender(editando.gender ?? "");
      setAddress(editando.address ?? "");
      setNotes(editando.notes ?? "");
      setPossibleDuplicate(editando.possibleDuplicate);
    } else {
      setNombre("");
      setTelefono("");
      setEmail("");
      setBirthDate("");
      setGender("");
      setAddress("");
      setNotes("");
      setPossibleDuplicate(false);
    }
    setError(undefined);
  }, [abierto, editando]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (nombre.trim().length < 2 || nombre.trim().length > 100) {
      setError("El nombre debe tener entre 2 y 100 caracteres.");
      return;
    }
    if (!/^\d{6,15}$/.test(telefono.replace(/\D/g, ""))) {
      setError("El teléfono debe contener solo números (entre 6 y 15 dígitos).");
      return;
    }

    const input: InputPaciente = {
      nombre: nombre.trim(),
      telefono,
      email: email.trim() || undefined,
      birthDate: birthDate || undefined,
      gender: gender || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      possibleDuplicate,
    };

    setGuardando(true);
    const res = editando ? await editarPacienteAction(editando.id, input) : await crearPacienteAction(input);
    setGuardando(false);

    if (!res.ok || !res.paciente) {
      setError(res.error ?? "No se pudo guardar el paciente.");
      return;
    }

    onGuardado(res.paciente, res.aviso);
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={editando ? `Editar paciente · ${editando.numero}` : "Nuevo paciente"}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-paciente" className="boton boton--primario" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      <form id="form-paciente" className={styles.formulario} onSubmit={guardar}>
        <div className={styles.dosColumnas}>
          <Campo id="pac-nombre" etiqueta="Nombre completo" requerido>
            <input
              id="pac-nombre"
              type="text"
              className="campo-control"
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </Campo>
          <Campo id="pac-telefono" etiqueta="Teléfono" requerido pista="Solo números; es el dato de contacto principal.">
            <input
              id="pac-telefono"
              type="tel"
              className="campo-control"
              inputMode="numeric"
              placeholder="Ej.: 34600111222"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </Campo>
        </div>

        <div className={styles.dosColumnas}>
          <Campo id="pac-email" etiqueta="Email (opcional)">
            <input
              id="pac-email"
              type="email"
              className="campo-control"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Campo>
          <Campo id="pac-nacimiento" etiqueta="Fecha de nacimiento (opcional)">
            <input
              id="pac-nacimiento"
              type="date"
              className="campo-control"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </Campo>
        </div>

        <div className={styles.dosColumnas}>
          <Campo id="pac-genero" etiqueta="Género (opcional)">
            <select
              id="pac-genero"
              className="campo-control"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Sin especificar</option>
              {GENEROS.map((g) => (
                <option key={g.valor} value={g.valor}>
                  {g.etiqueta}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="pac-direccion" etiqueta="Dirección (opcional)">
            <input
              id="pac-direccion"
              type="text"
              className="campo-control"
              maxLength={250}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Campo>
        </div>

        <Campo id="pac-notas" etiqueta="Notas (opcional)" pista="No guardes datos de salud sensibles aquí: las historias clínicas van en su sección.">
          <textarea
            id="pac-notas"
            className="campo-control"
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Campo>

        {editando && (
          <label className="fila-check">
            <input
              type="checkbox"
              checked={possibleDuplicate}
              onChange={(e) => setPossibleDuplicate(e.target.checked)}
            />
            Marcar como posible duplicado para revisar
          </label>
        )}

        {error && (
          <p className="alerta alerta--error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
