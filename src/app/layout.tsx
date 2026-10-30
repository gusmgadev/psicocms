import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const lexend = localFont({
  src: [
    { path: "../../public/fonts/lexend/Lexend-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/lexend/Lexend-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/lexend/Lexend-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-panel",
  display: "swap",
});

const castoro = localFont({
  src: [{ path: "../../public/fonts/castoro/Castoro-Regular.ttf", weight: "400", style: "normal" }],
  variable: "--font-marca",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PsicoCMS",
  description: "CMS para psicólogos/as: web administrable, blog, reservas de citas y panel de gestión",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  openGraph: {
    title: "PsicoCMS",
    description: "CMS para psicólogos/as: web administrable, blog, reservas de citas y panel de gestión",
    type: "website",
    locale: "es_ES",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="/fonts/fontawesome/css/all.min.css" />
      </head>
      <body className={`${lexend.variable} ${castoro.variable}`}>{children}</body>
    </html>
  );
}
