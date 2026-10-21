// src/services/email.ts
// Configuración de notificaciones por email y envío con nodemailer (SMTP de Gmail).
// La contraseña de aplicación se guarda cifrada (AES-256-GCM) y solo se lee
// en el servidor con service_role: nunca se devuelve al frontend.

import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ConfigEmail {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  fromName: string;
  fromEmail: string;
  notificationsEnabled: boolean;
  notifyOnBooking: boolean;
  hasPassword: boolean;
}

export interface InputConfigEmail {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  fromName: string;
  fromEmail: string;
  notificationsEnabled: boolean;
  notifyOnBooking: boolean;
  smtpPassword?: string;
}

export interface ResultadoEmail {
  ok: boolean;
  error?: string;
}

interface FilaEmailSettings {
  id: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password_encrypted: string | null;
  from_name: string;
  from_email: string;
  notifications_enabled: boolean;
  notify_on_booking: boolean;
}

const SELECT =
  "id, smtp_host, smtp_port, smtp_user, smtp_password_encrypted, from_name, from_email, notifications_enabled, notify_on_booking";

const CONFIG_POR_DEFECTO: ConfigEmail = {
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  fromName: "PsicoCMS",
  fromEmail: "",
  notificationsEnabled: false,
  notifyOnBooking: true,
  hasPassword: false,
};

// ============================================================
// Cifrado de la contraseña de aplicación
// ============================================================

function claveCifrado(): Buffer {
  const secreto = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secreto) {
    throw new Error("Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createHash("sha256").update(secreto).digest();
}

function cifrarPassword(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", claveCifrado(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    cifrado.toString("base64"),
  ].join(":");
}

function descifrarPassword(cifrado: string): string | null {
  try {
    const [version, ivB64, tagB64, datoB64] = cifrado.split(":");
    if (version !== "v1" || !ivB64 || !tagB64 || !datoB64) return null;
    const decipher = createDecipheriv("aes-256-gcm", claveCifrado(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(datoB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

// ============================================================
// Lectura y escritura de la configuración
// ============================================================

function aConfig(f: FilaEmailSettings): ConfigEmail {
  return {
    smtpHost: f.smtp_host ?? "",
    smtpPort: f.smtp_port ?? 587,
    smtpUser: f.smtp_user ?? "",
    fromName: f.from_name ?? "PsicoCMS",
    fromEmail: f.from_email ?? "",
    notificationsEnabled: f.notifications_enabled ?? false,
    notifyOnBooking: f.notify_on_booking ?? true,
    hasPassword: Boolean(f.smtp_password_encrypted),
  };
}

export async function obtenerConfigEmail(): Promise<ConfigEmail> {
  const admin = createAdminClient();
  const { data } = await admin.from("email_settings").select(SELECT).eq("id", true).maybeSingle();
  if (!data) return CONFIG_POR_DEFECTO;
  return aConfig(data as unknown as FilaEmailSettings);
}

function validar(input: InputConfigEmail): string | null {
  if (!input.smtpHost?.trim() || input.smtpHost.trim().length > 200) {
    return "El servidor SMTP es obligatorio.";
  }
  const puerto = Number(input.smtpPort);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    return "El puerto debe ser un número entre 1 y 65535.";
  }
  if (!input.smtpUser?.trim() || input.smtpUser.trim().length > 200) {
    return "El usuario SMTP es obligatorio.";
  }
  if (!input.fromName?.trim() || input.fromName.trim().length > 100) {
    return "El nombre del remitente es obligatorio.";
  }
  if (!esEmail(input.fromEmail) || input.fromEmail.trim().length > 200) {
    return "El email del remitente no tiene un formato válido.";
  }
  if (input.smtpPassword && input.smtpPassword.length > 200) {
    return "La contraseña de aplicación es demasiado larga.";
  }
  return null;
}

function esEmail(valor: string | undefined): boolean {
  return Boolean(valor && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim()));
}

export async function guardarConfigEmail(
  input: InputConfigEmail
): Promise<ResultadoEmail & { config?: ConfigEmail }> {
  const errorValidacion = validar(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const admin = createAdminClient();
  const { data: previa } = await admin
    .from("email_settings")
    .select("smtp_password_encrypted")
    .eq("id", true)
    .maybeSingle();

  const passwordActual = (previa as { smtp_password_encrypted: string | null } | null)
    ?.smtp_password_encrypted;

  const contraseña = input.smtpPassword?.trim();
  let passwordCifrado: string | null = passwordActual ?? null;
  if (contraseña) {
    passwordCifrado = cifrarPassword(contraseña);
  }

  const { data, error } = await admin
    .from("email_settings")
    .upsert(
      {
        id: true,
        smtp_host: input.smtpHost.trim(),
        smtp_port: Number(input.smtpPort),
        smtp_user: input.smtpUser.trim(),
        smtp_password_encrypted: passwordCifrado,
        from_name: input.fromName.trim(),
        from_email: input.fromEmail.trim(),
        notifications_enabled: input.notificationsEnabled,
        notify_on_booking: input.notifyOnBooking,
      },
      { onConflict: "id" }
    )
    .select(SELECT)
    .single();

  if (error || !data) {
    return { ok: false, error: "No se pudo guardar la configuración de email." };
  }
  return { ok: true, config: aConfig(data as unknown as FilaEmailSettings) };
}

// ============================================================
// Envío de emails
// ============================================================

export async function enviarEmail(
  destino: string,
  asunto: string,
  html: string,
  texto: string
): Promise<ResultadoEmail> {
  if (!esEmail(destino)) {
    return { ok: false, error: "El email de destino no es válido." };
  }

  const config = await obtenerConfigEmail();
  if (!config.notificationsEnabled) {
    return { ok: false, error: "Las notificaciones por email están desactivadas." };
  }
  if (!config.hasPassword) {
    return { ok: false, error: "Falta la contraseña de aplicación de Gmail." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("email_settings")
    .select("smtp_password_encrypted")
    .eq("id", true)
    .maybeSingle();

  const password = descifrarPassword(
    (data as { smtp_password_encrypted: string | null } | null)?.smtp_password_encrypted ?? ""
  );
  if (!password) {
    return { ok: false, error: "No se pudo leer la contraseña de aplicación. Vuelve a guardarla." };
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: { user: config.smtpUser, pass: password },
    });

    await transport.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: destino,
      subject: asunto,
      text: texto,
      html,
    });
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "No se pudo enviar el email. Revisa el usuario, la contraseña de aplicación y el servidor.",
    };
  }
}

export async function enviarEmailPrueba(): Promise<ResultadoEmail> {
  const config = await obtenerConfigEmail();
  if (!esEmail(config.fromEmail)) {
    return { ok: false, error: "Guarda primero la configuración con un email válido." };
  }
  return enviarEmail(
    config.fromEmail,
    "Prueba de notificaciones desde PsicoCMS",
    `<p>Hola,</p><p>Este es un email de prueba de <strong>PsicoCMS</strong>. Si lo estás leyendo, las notificaciones de nuevas reservas están configuradas correctamente.</p>`,
    "Este es un email de prueba de PsicoCMS. Si lo estás leyendo, las notificaciones están configuradas correctamente."
  );
}
