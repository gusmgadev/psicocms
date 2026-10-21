import { exigirSesion } from "@/lib/auth-guard";
import { agruparFrases, listarFrases } from "@/services/frases";
import FrasesPanel from "./FrasesPanel";

export default async function PaginaFrases() {
  await exigirSesion();
  const frases = await listarFrases();
  const grupos = agruparFrases(frases);
  return <FrasesPanel grupos={grupos} />;
}
