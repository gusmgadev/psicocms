import styles from "./ayuda.module.css";

interface SeccionProps {
  icono: string;
  titulo: string;
  texto: string;
  pasos: string[];
}

function Seccion({ icono, titulo, texto, pasos }: SeccionProps) {
  return (
    <section className="tarjeta">
      <h2 className={styles.seccionTitulo}>
        <span className={styles.seccionIcono} aria-hidden="true">
          <i className={`fa ${icono}`}></i>
        </span>
        {titulo}
      </h2>
      <p className={styles.seccionTexto}>{texto}</p>
      <ol className={styles.lista}>
        {pasos.map((paso) => (
          <li key={paso}>{paso}</li>
        ))}
      </ol>
    </section>
  );
}

export default function PaginaAyuda() {
  return (
    <div className={styles.pagina}>
      <div>
        <h1 className={styles.titulo}>Ayuda: cómo funciona PsicoCMS</h1>
        <p className={styles.subtitulo}>
          Guía general del panel, pensada para que encuentres cada cosa en poco tiempo. Si algo no
          está claro, lo que veas aquí es el orden recomendado para empezar a trabajar con la web y
          la agenda.
        </p>
      </div>

      <div className={styles.rejilla}>
        <Seccion
          icono="fa-rocket"
          titulo="Primeros pasos"
          texto="Lo básico para tener la web lista y con tu imagen."
          pasos={[
            "En «Gestión web › Temas visuales» elige el diseño de tu web y si quieres una sola página larga (landing) o varias páginas.",
            "En «Configuración › Información pública» revisa tu nombre, frase de bienvenida, dirección, teléfono de contacto y el resto de datos que verán las visitas.",
            "En «Gestión web › Imágenes» sube tus fotos para que aparezcan en la web en lugar de las de ejemplo.",
            "Usa el botón «Ver web pública» del menú lateral para ver siempre el resultado final en otra pestaña.",
          ]}
        />

        <Seccion
          icono="fa-calendar-check"
          titulo="Citas y calendario"
          texto="El día a día de tu agenda: crear, mover y actualizar citas."
          pasos={[
            "En «Citas» tienes el listado con filtros por estado, modalidad y fechas, y botones para añadir, editar o eliminar citas.",
            "En «Calendario» ves las citas como en un calendario y también puedes añadir citas manualmente.",
            "Estados de la cita: pendiente, realizada, cancelada y no asistió. Una cita cancelada o no asistida libera el hueco.",
            "Al crear una cita, busca a la paciente por nombre, teléfono o número de ficha. Si aún no existe, se crea al guardar la cita.",
            "El panel impide que dos citas se solapen: la base de datos no deja guardarse encima.",
          ]}
        />

        <Seccion
          icono="fa-calendar-week"
          titulo="Disponibilidad"
          texto="Tus horarios reales para que las pacientes puedan reservar."
          pasos={[
            "En «Disponibilidad» configura por separado tus citas online y las presenciales: duración de cada sesión y descanso entre sesiones.",
            "Marca con clic las horas disponibles de cada día de la semana y guarda.",
            "El descanso se suma al hueco: si duras 50 minutos con 10 de descanso, los huecos son cada 60 minutos.",
            "Activa el «Modo vacaciones» para parar todas las reservas de golpe, y añade «Periodos de vacaciones» para bloquear fechas concretas.",
            "Si cambias duraciones o descansos, vuelve a marcar y guardar tus huecos semanales.",
          ]}
        />

        <Seccion
          icono="fa-users"
          titulo="Pacientes"
          texto="Tu fichero de pacientes, siempre localizable."
          pasos={[
            "En «Pacientes» tienes el listado con buscador; cada ficha tiene un número correlativo (ej. P-0042) y el teléfono.",
            "Si dos fichas comparten teléfono, puedes marcarlas para revisarlas: nunca se bloquea por eso.",
            "En la ficha puedes editar sus datos, exportarlos o anonimizarlos (con confirmación), y añadir una cita manual.",
            "Las pacientes que reservan desde la web entran solas en este listado.",
          ]}
        />

        <Seccion
          icono="fa-notes-medical"
          titulo="Historias clínicas"
          texto="Tus notas privadas de cada sesión."
          pasos={[
            "En «Historias clínicas» elige a la paciente y escribe una «nota de sesión» con la fecha del día.",
            "Puedes enlazar la nota con una cita o dejarla sin cita; una cita puede tener varias notas.",
            "Desde una cita marcada como realizada hay un botón «Escribir nota de sesión» que abre la historia ya enlazada.",
            "En la nota puedes subir fotos o PDFs: se guardan en una zona privada y solo tú puedes verlos.",
            "Las notas son privadas: no salen en búsquedas públicas, en emails ni en la web.",
          ]}
        />

        <Seccion
          icono="fa-globe"
          titulo="Contenido de la web"
          texto="Todo lo que aparece en tu página pública."
          pasos={[
            "«Servicios», «Especialidades» y «Planes y precios» se editan como catálogos: añadir, editar, reordenar y activar o desactivar.",
            "«Blog» tiene sus artículos y sus categorías; los textos largos se editan con el editor con botones (negrita, títulos, listas…).",
            "«Preguntas frecuentes» y «Frases públicas» controlan lo que se muestra en esas zonas de la web.",
            "«Redes sociales» añade los enlaces del footer; «Secciones de la web» activa o desactiva bloques completos como el blog o las reservas.",
            "Cada cambio se refleja en la web pública casi al instante.",
          ]}
        />

        <Seccion
          icono="fa-envelope"
          titulo="Reservas y avisos"
          texto="Las pacientes reservan y tú recibes el aviso."
          pasos={[
            "Las reservas entran desde tu web pública en «Pide cita», respetando tu disponibilidad y tus vacaciones.",
            "En «Configuración › Email y notificaciones» conecta tu Gmail para recibir un aviso con cada reserva nueva.",
            "El aviso solo incluye nombre, fecha, hora y modalidad: nunca el motivo de la consulta.",
            "Ahí mismo puedes enviar un email de prueba para comprobar que funciona.",
          ]}
        />

        <Seccion
          icono="fa-shield-halved"
          titulo="Tu cuenta y seguridad"
          texto="Acceso privado y apariencia del panel."
          pasos={[
            "Entra en el panel por /acceso-psicologa con tu email y tu contraseña.",
            "En «Perfil privado» cambias tu nombre, tu teléfono, tu foto, tu email y tu contraseña.",
            "Activa la «Verificación en dos pasos» para que además de la contraseña te pidan un código de una app de autenticación.",
            "Con el botón de tu nombre, arriba a la derecha, eliges tema claro u oscuro y el color principal del panel: se queda guardado.",
            "Si olvidas la contraseña, usa el enlace «He olvidado mi contraseña» del acceso.",
          ]}
        />

        <Seccion
          icono="fa-magnifying-glass"
          titulo="Buscar y ayuda"
          texto="Cómo encontrar algo concreto."
          pasos={[
            "El buscador de la cabecera encuentra pacientes, citas, notas de sesión, artículos y preguntas frecuentes: escribe un nombre, un teléfono o una palabra.",
            "Los resultados se agrupan por tipo y al pulsar uno vas directamente a ese sitio.",
            "El botón de interrogante de la cabecera te trae aquí; el botón de tu nombre lleva a tu perfil privado y al cierre de sesión.",
          ]}
        />

        <Seccion
          icono="fa-lightbulb"
          titulo="Consejos buenos"
          texto="Pequeños hábitos que evitan líos."
          pasos={[
            "Revisa de vez en cuando el listado de pacientes marcados como «posibles duplicados».",
            "Después de cada sesión, escribe la nota el mismo día: la memoria es frágil.",
            "Usa siempre los estados de la cita: así el calendario refleja la realidad.",
            "Los textos legales (privacidad y consentimientos) revísalos tú: el sistema solo los muestra.",
          ]}
        />
      </div>

      <p className={styles.nota}>
        Recuerda: en el panel mandas tú. Todo lo que ves se edita desde aquí, sin tocar código, y si
        algo no existe todavía en una sección aparecerá un aviso claro en lugar de datos falsos.
      </p>
    </div>
  );
}
