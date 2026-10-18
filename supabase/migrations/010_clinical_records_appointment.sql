-- FASE 8B: enlace opcional entre una nota de historia clínica y su cita.
-- appointment_id es nullable: la nota es propia de la historia (session_date
-- propio) y sobrevive si la cita se borra (ON DELETE SET NULL) o se cancela
-- (el servicio de citas vacía el enlace). Una sola nota por cita.

ALTER TABLE clinical_records
    ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_records_appointment_id
    ON clinical_records (appointment_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinical_records_appointment_unique
    ON clinical_records (appointment_id)
    WHERE appointment_id IS NOT NULL;
