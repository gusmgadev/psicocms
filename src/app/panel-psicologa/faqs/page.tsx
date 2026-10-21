import { exigirSesion } from "@/lib/auth-guard";
import { listarFaqs } from "@/services/faqs";
import FaqsPanel from "./FaqsPanel";

export default async function PaginaFaqs() {
  await exigirSesion();
  const faqs = await listarFaqs();
  return <FaqsPanel inicial={faqs} />;
}
