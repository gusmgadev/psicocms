import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
let hostname = "*.supabase.co";
let supabaseHost = "*.supabase.co";
try {
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    hostname = url.hostname;
    supabaseHost = url.hostname;
  }
} catch {
  hostname = "*.supabase.co";
  supabaseHost = "*.supabase.co";
}

const esProduccion = process.env.NODE_ENV === "production";

const cabecerasComunes = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const cabecerasProduccion = esProduccion
  ? [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ]
  : [];

// CSP adaptada: Supabase (REST + Realtime), mapa de Google, fuentes e iconos locales.
// script-src usa 'unsafe-inline' por los payloads RSC/Next de App Router.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://" + supabaseHost,
  "connect-src 'self' https://" + supabaseHost + " wss://" + supabaseHost,
  "frame-src https://www.google.com https://maps.google.com https://google.com",
  "worker-src 'self' blob:",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...cabecerasComunes,
          ...cabecerasProduccion,
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
