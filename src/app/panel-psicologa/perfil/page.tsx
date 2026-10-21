import { exigirSesion } from "@/lib/auth-guard";
import { obtenerEstadoMfa, obtenerPerfilPrivado } from "@/services/perfil-privado";
import PerfilPanel from "./PerfilPanel";

export default async function PaginaPerfil() {
  const { user } = await exigirSesion();

  const [perfil, mfaActivo] = await Promise.all([obtenerPerfilPrivado(), obtenerEstadoMfa()]);

  return <PerfilPanel perfil={perfil} email={user.email ?? ""} mfaActivo={mfaActivo} />;
}
