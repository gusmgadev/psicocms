// src/lib/redes.ts
// Redes sociales disponibles (compartido entre cliente y servidor).

export interface RedSocial {
  id: string;
  platform: string;
  url: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
}

export interface OpcionRed {
  platform: string;
  nombre: string;
  icon: string;
}

export interface InputRed {
  platform: string;
  url: string;
  isActive?: boolean;
}

export const REDES_DISPONIBLES: OpcionRed[] = [
  { platform: "instagram", nombre: "Instagram", icon: "fa-brands fa-instagram" },
  { platform: "facebook", nombre: "Facebook", icon: "fa-brands fa-facebook-f" },
  { platform: "x", nombre: "X (Twitter)", icon: "fa-brands fa-x-twitter" },
  { platform: "linkedin", nombre: "LinkedIn", icon: "fa-brands fa-linkedin-in" },
  { platform: "youtube", nombre: "YouTube", icon: "fa-brands fa-youtube" },
  { platform: "tiktok", nombre: "TikTok", icon: "fa-brands fa-tiktok" },
  { platform: "whatsapp", nombre: "WhatsApp", icon: "fa-brands fa-whatsapp" },
  { platform: "pinterest", nombre: "Pinterest", icon: "fa-brands fa-pinterest-p" },
];

export function opcionRed(platform: string): OpcionRed | undefined {
  return REDES_DISPONIBLES.find((r) => r.platform === platform);
}
