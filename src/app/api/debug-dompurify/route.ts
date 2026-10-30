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

  const { createRequire } = await import("node:module");
  const req = createRequire(import.meta.url);

  try {
    const pkg = req("@csstools/css-calc/package.json");
    datos.cssCalcVersion = pkg.version;
    datos.cssCalcType = pkg.type;
    datos.cssCalcExports = pkg.exports;
    datos.cssCalcMain = pkg.main;
  } catch (e) {
    datos.cssCalcPkgError = String(e);
  }

  try {
    const pkg = req("@asamuzakjp/css-color/package.json");
    datos.cssColorVersion = pkg.version;
    datos.cssColorMain = pkg.main;
  } catch (e) {
    datos.cssColorPkgError = String(e);
  }

  try {
    req("@csstools/css-calc");
    datos.requireCssCalc = "ok";
  } catch (e) {
    datos.requireCssCalcError = String(e).slice(0, 300);
  }

  try {
    await import("@csstools/css-calc");
    datos.importCssCalc = "ok";
  } catch (e) {
    datos.importCssCalcError = String(e).slice(0, 300);
  }

  try {
    const jsdom = await import("jsdom");
    datos.importJsdom = "ok";
    try {
      const { JSDOM } = jsdom;
      const dom = new JSDOM("<p>hola</p>");
      datos.jsdomParse = dom.window.document.querySelector("p")?.textContent ?? "";
    } catch (e) {
      datos.jsdomParseError = String(e).slice(0, 300);
    }
  } catch (e) {
    datos.importJsdomError = String(e).slice(0, 300);
  }

  try {
    const modulo = await import("isomorphic-dompurify");
    const html = (modulo.default ?? modulo).sanitize("<b>hola</b><script>x()</script>");
    datos.sanitize = html;
  } catch (e) {
    datos.sanitizeError = String(e).slice(0, 300);
  }

  return NextResponse.json(datos);
}
