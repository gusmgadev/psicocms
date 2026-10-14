import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PsicoCMS",
  description: "CMS para psicólogas: web administrable, blog, reservas de citas y panel de gestión",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "PsicoCMS",
    description: "CMS para psicólogas: web administrable, blog, reservas de citas y panel de gestión",
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}