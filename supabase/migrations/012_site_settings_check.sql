-- 012_site_settings_check.sql
-- Restricciones de validación en site_settings (formato de la web).
-- Nota: active_theme NO se restringe con CHECK para mantener plug and play
-- (añadir un tema nuevo no debe exigir migración); se valida en el servidor
-- contra el índice de temas (src/themes/index.ts).

ALTER TABLE site_settings
    ADD CONSTRAINT site_settings_layout_mode_check
    CHECK (layout_mode IN ('landing', 'multipage'));
