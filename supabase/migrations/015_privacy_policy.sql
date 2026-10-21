-- 015_privacy_policy.sql
-- FASE 15: política de privacidad editable y versionada (una sola fila),
-- legible por el público (página /politica-privacidad y enlace del formulario
-- de reserva) y editable solo desde el panel.

CREATE TABLE privacy_policy (
    id boolean PRIMARY KEY DEFAULT true,
    content_html text NOT NULL DEFAULT '',
    version text NOT NULL DEFAULT '1.0',
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT privacy_policy_single_row CHECK (id = true)
);

CREATE TRIGGER update_privacy_policy_updated_at
BEFORE UPDATE ON privacy_policy
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE privacy_policy ENABLE ROW LEVEL SECURITY;

-- Pública: solo lectura
CREATE POLICY "anon_read_privacy_policy" ON privacy_policy
FOR SELECT TO anon
USING (true);

-- Dueña: CRUD completo
CREATE POLICY "owner_full_access_privacy_policy" ON privacy_policy
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- Service role: acceso total (Server Actions con cliente admin si hiciera falta)
CREATE POLICY "service_role_full_access_privacy_policy" ON privacy_policy
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Permisos explícitos (defensa en profundidad)
GRANT SELECT ON privacy_policy TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON privacy_policy TO authenticated;
GRANT ALL ON privacy_policy TO service_role;

-- ============================================================
-- Texto base orientativo (la psicóloga o un profesional del derecho lo revisan;
-- el sistema solo lo muestra y gestiona)
-- ============================================================
INSERT INTO privacy_policy (id, content_html, version)
VALUES (
    true,
    '<h2>Responsable del tratamiento</h2><p>Los datos personales que facilites a través de esta web son tratados por la titular del sitio con la única finalidad de gestionar tus citas y atender tus consultas.</p><h2>Datos que recogemos</h2><p>Al solicitar una cita recogemos tu nombre, tu número de teléfono y, de forma opcional, el motivo de la consulta. Estos datos se utilizan exclusivamente para gestionar la agenda y contactar contigo.</p><h2>Conservación</h2><p>Los datos se conservan mientras sean necesarios para prestar el servicio y, posteriormente, durante los plazos legalmente exigibles. Puedes solicitar el acceso, la rectificación o la supresión de tus datos en cualquier momento.</p><h2>Derechos</h2><p>Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación y oposición escribiendo a la dirección de contacto que aparece en esta web.</p><h2>Modificaciones</h2><p>Esta política puede actualizarse. La versión vigente es siempre la publicada en esta página, con su fecha y número de versión.</p>',
    '1.0'
)
ON CONFLICT (id) DO NOTHING;
