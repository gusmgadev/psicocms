# Prompt 07: Auditoría de seguridad (antes de publicar y tras cambios grandes)
Modelo recomendado: Opus

Actúa como auditor de seguridad. Lee @AGENTS.md (sección "Seguridad" incluida) y @MAP.md y revisa el proyecto sin modificar nada.

Comprueba:
1. Todas las tablas tienen RLS activado. Las políticas de authenticated usan is_owner(). El rol anon nunca accede a pacientes, citas, historias, email_settings ni datos privados del perfil.
2. Las funciones RPC (SECURITY DEFINER) tienen search_path fijado, validan las entradas y no exponen datos de más. Lista, función por función, quién puede ejecutarla (PUBLIC, anon, authenticated, service_role) y señala las que tengan permisos de más. create_public_booking y check_rate_limit solo deben ser ejecutables por service_role.
3. Los buckets: clinical-files es privado y se usa con URLs firmadas cortas; public-images solo permite escritura del dueño; hay límites de tipo y tamaño y no se admite SVG en el bucket público.
4. La service_role key solo se usa en servidor (import 'server-only', sin prefijo NEXT_PUBLIC_), no aparece en componentes de cliente, en el bundle ni en el repositorio. .env.local está en .gitignore.
5. Toda Server Action y Route Handler del panel verifica la sesión en el servidor (getUser); no dependen solo del middleware.
6. No hay secretos (contraseña de Gmail, claves) devueltos al cliente. email_settings solo se lee en servidor y la contraseña no es legible con la sesión de la psicóloga.
7. Todo uso de dangerouslySetInnerHTML pasa por DOMPurify (blog, plantilla de protección de datos e historias clínicas).
8. La Server Action instalar exige INSTALL_TOKEN, se bloquea cuando ya existe usuario o la instalación está completa, y /instalacion no queda abierta tras instalar.
9. El registro público de usuarios está desactivado en Supabase y las URLs permitidas de Auth son las correctas. Un segundo usuario de prueba no puede ver ni escribir nada.
10. Las reservas públicas: no se puede llamar a create_public_booking directamente con la anon key, hay honeypot o captcha, límite de intentos, máximo de citas por teléfono, validación en servidor y respuesta genérica.
11. El login: contraseña fuerte, límite de intentos, mensajes genéricos, recuperación de contraseña sin revelar si la cuenta existe, reautenticación para cambios sensibles y cookies seguras. Indica si la verificación en dos pasos está activa.
12. El email de aviso no incluye el motivo de la consulta ni datos de salud.
13. Consentimiento: el formulario de reserva exige aceptar la política de privacidad y se guarda consent_at y consent_version. Existe exportación y eliminación/anonimización de datos de paciente.
14. Cabeceras de seguridad (CSP, frame-ancestors, Referrer-Policy, Permissions-Policy, HSTS), errores sin detalles internos, logs sin datos personales y resultado de npm audit.

Entrega una lista de hallazgos por gravedad (crítico, alto, medio, bajo) con cómo corregir cada uno. No corrijas nada hasta que yo lo confirme.
