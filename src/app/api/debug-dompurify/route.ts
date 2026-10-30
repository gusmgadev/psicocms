import { NextResponse } from "next/server";

// Temporal: diagnóstico del 500 de Vercel. Se elimina tras el diagnóstico.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || token !== process.env.INSTALL_TOKEN) {
    return new NextResponse(null, { status: 404 });
  }

  const datos: Record<string, unknown> = {
    node: process.version,
    plataforma: process.platform,
    execArgv: process.execArgv,
    nodeOptions: process.env.NODE_OPTIONS ?? "(sin NODE_OPTIONS)",
  };

  try {
    const modulo = await import("isomorphic-dompurify");
    const html = (modulo.default ?? modulo).sanitize("<b>hola</b><script>x()</script>");
    datos.sanitize = html;
  } catch (e) {
    datos.sanitizeError = String(e).slice(0, 300);
  }

  return NextResponse.json(datos);
}
