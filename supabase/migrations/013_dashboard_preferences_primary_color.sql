-- 013_dashboard_preferences_primary_color.sql
-- FASE 14: el color principal del panel solo puede ser uno de los 8
-- colores ofrecidos en el modal de tema (se valida también en el servidor
-- contra src/lib/panel-tema.ts).

ALTER TABLE dashboard_preferences
    DROP CONSTRAINT IF EXISTS dashboard_preferences_primary_color_check;

ALTER TABLE dashboard_preferences
    ADD CONSTRAINT dashboard_preferences_primary_color_check
    CHECK (primary_color IN (
        '#2563eb',
        '#0d9488',
        '#7c3aed',
        '#db2777',
        '#976147',
        '#4f46e5',
        '#15803d',
        '#a16207'
    ));
