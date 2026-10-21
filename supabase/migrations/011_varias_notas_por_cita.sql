-- Decisión 2026-10-18 (AGENTS.md, FASE 8): una cita puede tener varias notas.
-- La migración 010 (ya aplicada) creó un índice único parcial que limitaba a
-- una nota por cita; se elimina para permitir varias notas enlazadas a la
-- misma cita. El servicio de historias deja de rechazar la segunda nota.
-- Sin cambios de RLS ni de permisos (solo se elimina un índice).

DROP INDEX IF EXISTS idx_clinical_records_appointment_unique;
