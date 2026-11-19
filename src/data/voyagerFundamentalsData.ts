export interface FundamentalsQuestion {
  id: string;
  questionEn: string;
  questionEs: string;
  optionsEn: string[];
  optionsEs: string[];
  correctIndex: number;
  explanationEn: string;
  explanationEs: string;
}

export interface FundamentalsLesson {
  id: string;
  number: number;
  titleEn: string;
  titleEs: string;
  subtitleEn: string;
  subtitleEs: string;
  durationMinutes: number;
  platformFeatureEn: string;
  platformFeatureEs: string;
  objectiveEn: string;
  objectiveEs: string;
  videoPresenter: string;
  videoPlaceholderTextEn: string;
  videoPlaceholderTextEs: string;
  videoScriptEn: string;
  videoScriptEs: string;
  practicalTaskEn: string;
  practicalTaskEs: string;
  actionType: 'switch_lang' | 'edit_profile' | 'voice_test' | 'teacher_mail' | 'save_lesson' | 'inspect_metrics';
  comprehensionQuestions: FundamentalsQuestion[];
}

export const VOYAGER_FUNDAMENTALS_LESSONS: FundamentalsLesson[] = [
  {
    id: 'fund-1',
    number: 1,
    titleEn: 'Welcome to Voyager',
    titleEs: 'Bienvenido a USA Voyager',
    subtitleEn: 'Understand the two-column interface and discover your learning tools.',
    subtitleEs: 'Comprende la interfaz de dos columnas y descubre tus herramientas de estudio.',
    durationMinutes: 6,
    platformFeatureEn: 'Left Passport (Voice & Connection) vs. Right Cover (Study Tools & Messages).',
    platformFeatureEs: 'Pasaporte izquierdo (Voz y Conexión) vs. Portada derecha (Herramientas y Mensajes).',
    objectiveEn: 'Navigate between the static Passport area and the dynamic Cover page with confidence.',
    objectiveEs: 'Navegar entre el área fija del Pasaporte y la Portada dinámica con total seguridad.',
    videoPresenter: 'Voyager Mascot & Lead Instructor',
    videoPlaceholderTextEn: 'Introductory Video: Navigating the Voyager Dual-Panel Interface',
    videoPlaceholderTextEs: 'Video Introductorio: Navegando la Interfaz de Doble Panel de Voyager',
    videoScriptEn:
      'Hello and welcome to USA Voyager! I am Voyager, your personal American English tutor. Notice how our screen is split into two areas: on your left is your Passport, where you connect live, see my voice orb, and start speaking. On your right is your Cover, where you find your profile, lessons, calendar, and teacher messages. Let us take this journey together!',
    videoScriptEs:
      '¡Hola y bienvenido a USA Voyager! Soy Voyager, tu tutor personal de inglés americano. Nota cómo nuestra pantalla está dividida en dos áreas: a tu izquierda está tu Pasaporte, donde te conectas en vivo, ves mi orbe de voz y comienzas a hablar. A tu derecha está tu Portada, donde encuentras tu perfil, lecciones, calendario y mensajes de profesores. ¡Empecemos este viaje juntos!',
    practicalTaskEn: 'Explore the interface by switching language to English and checking Voyager live connection.',
    practicalTaskEs: 'Explora la interfaz cambiando el idioma a inglés y revisando la conexión en vivo de Voyager.',
    actionType: 'switch_lang',
    comprehensionQuestions: [
      {
        id: 'q1-1',
        questionEn: 'Where is Voyager\'s reactive voice orb and connect button located?',
        questionEs: '¿Dónde se encuentra el orbe de voz reactivo y el botón de conectar de Voyager?',
        optionsEn: [
          'On the Left Passport column',
          'At the bottom of the right Cover',
          'Inside the system settings only',
          'In an external browser tab'
        ],
        optionsEs: [
          'En la columna izquierda del Pasaporte',
          'Al pie de la Portada derecha',
          'Solo dentro de ajustes del sistema',
          'En una pestaña externa del navegador'
        ],
        correctIndex: 0,
        explanationEn: 'The left Passport column permanently houses Voyager identity, voice orb, and live connection.',
        explanationEs: 'La columna izquierda del Pasaporte alberga permanentemente la identidad de Voyager, el orbe de voz y la conexión en vivo.'
      },
      {
        id: 'q1-2',
        questionEn: 'What is the purpose of the right Cover page?',
        questionEs: '¿Cuál es el propósito de la Portada derecha?',
        optionsEn: [
          'Only showing static legal text',
          'Dynamic study tools, student profile, lessons, calendar, and messages',
          'A simple video player only',
          'Changing the app server configuration'
        ],
        optionsEs: [
          'Mostrar únicamente texto legal estático',
          'Herramientas de estudio, perfil del estudiante, lecciones, calendario y mensajes',
          'Solo un reproductor de video simple',
          'Modificar la configuración del servidor'
        ],
        correctIndex: 1,
        explanationEn: 'The Cover is the dynamic learning workspace where all your interactive tools live.',
        explanationEs: 'La Portada es el espacio dinámico de aprendizaje donde residen todas tus herramientas interactivas.'
      }
    ]
  },
  {
    id: 'fund-2',
    number: 2,
    titleEn: 'Your Student Profile',
    titleEs: 'Tu Perfil de Estudiante',
    subtitleEn: 'Personalize your study goals, weekly hours, and favorite topics.',
    subtitleEs: 'Personaliza tus metas de estudio, horas semanales y temas de interés.',
    durationMinutes: 7,
    platformFeatureEn: 'Student Profile Card, Edit Information Mode, and Favorite Topic Tags.',
    platformFeatureEs: 'Tarjeta de Perfil de Estudiante, Modo Edición y Etiquetas de Intereses.',
    objectiveEn: 'Understand how setting your weekly study target and topics shapes your lesson recommendations.',
    objectiveEs: 'Comprender cómo definir tu meta semanal y tus intereses adapta las recomendaciones de lecciones.',
    videoPresenter: 'Student Academic Advisor',
    videoPlaceholderTextEn: 'Profile Video: Tailoring Voyager to Your Real-World Goals',
    videoPlaceholderTextEs: 'Video de Perfil: Adaptando Voyager a tus Metas Reales',
    videoScriptEn:
      'Your student profile is the engine of your personalized learning. When you set your weekly study goal (for example, 5 hours per week) and choose interests like travel, technology, or business, Voyager tailors every conversation topic and lesson catalog recommendation to match your real-life needs.',
    videoScriptEs:
      'Tu perfil de estudiante es el motor de tu aprendizaje personalizado. Al definir tu meta de estudio semanal (por ejemplo, 5 horas por semana) y seleccionar intereses como viajes, tecnología o negocios, Voyager adapta cada conversación y recomendación del catálogo a tus necesidades reales.',
    practicalTaskEn: 'Review your student profile card and verify your interests and weekly study goal.',
    practicalTaskEs: 'Revisa tu tarjeta de perfil de estudiante y verifica tus intereses y meta semanal de estudio.',
    actionType: 'edit_profile',
    comprehensionQuestions: [
      {
        id: 'q2-1',
        questionEn: 'Why is it important to define your favorite topics and interests?',
        questionEs: '¿Por qué es importante definir tus temas favoritos e intereses?',
        optionsEn: [
          'It deletes previous chat history',
          'It personalizes your lesson catalog and practice prompts to topics you enjoy',
          'It locks the app to a single vocabulary list',
          'It is only used for billing records'
        ],
        optionsEs: [
          'Borra el historial de chat anterior',
          'Personaliza tu catálogo de lecciones y sugerencias hacia temas que disfrutas',
          'Bloquea la aplicación a una sola lista de vocabulario',
          'Solo se utiliza para registros de facturación'
        ],
        correctIndex: 1,
        explanationEn: 'Voyager filters and recommends lessons based directly on your chosen profile interests.',
        explanationEs: 'Voyager filtra y recomienda lecciones basándose directamente en tus intereses de perfil.'
      },
      {
        id: 'q2-2',
        questionEn: 'How can you update your phone number, age, or education level in Voyager?',
        questionEs: '¿Cómo puedes actualizar tu teléfono, edad o nivel de educación en Voyager?',
        optionsEn: [
          'Click the Pencil edit button beneath your student photo',
          'Call technical support by telephone',
          'Wait 30 days for an automatic reset',
          'It cannot be edited after registration'
        ],
        optionsEs: [
          'Haz clic en el botón de lápiz (Editar) debajo de tu foto de estudiante',
          'Llamar al soporte técnico por teléfono',
          'Esperar 30 días para un reinicio automático',
          'No se puede editar después del registro'
        ],
        correctIndex: 0,
        explanationEn: 'Clicking the Pencil icon opens the clean in-place profile editor.',
        explanationEs: 'Hacer clic en el icono de lápiz abre el editor de perfil en el mismo lugar.'
      }
    ]
  },
  {
    id: 'fund-3',
    number: 3,
    titleEn: 'Talk to Voyager',
    titleEs: 'Habla con Voyager',
    subtitleEn: 'Master live voice speech, text chat, pronunciation feedback, and pacing.',
    subtitleEs: 'Domina la voz en vivo, chat de texto, corrección de pronunciación y ritmo.',
    durationMinutes: 8,
    platformFeatureEn: 'Live Gemini Voice Audio, Mode Selector (Adaptive/Slow/Study), and Text Fallback.',
    platformFeatureEs: 'Audio en Vivo Gemini, Selector de Modos (Adaptivo/Lento/Estudio) y Chat de Texto.',
    objectiveEn: 'Initiate spoken English dialogue, request slower speech, and ask for vocabulary explanations.',
    objectiveEs: 'Iniciar diálogo hablado en inglés, solicitar habla más pausada y pedir aclaraciones de vocabulario.',
    videoPresenter: 'USA Voyager Voice Coach',
    videoPlaceholderTextEn: 'Voice Masterclass: Speaking Confidently Without Fear of Mistakes',
    videoPlaceholderTextEs: 'Masterclass de Voz: Hablar con Confianza sin Miedo a Equivocarse',
    videoScriptEn:
      'Speaking English is about communication, not perfection. Voyager listens patiently and never judges your accent. When you connect, speak in natural phrases. If you need me to speak more slowly, select Slow mode or simply say: "Voyager, please speak more slowly." You can also type anytime using the input box.',
    videoScriptEs:
      'Hablar inglés se trata de comunicación, no de perfección. Voyager te escucha con paciencia y nunca juzga tu acento. Al conectarte, habla con frases naturales. Si necesitas que hable más despacio, selecciona el modo Lento o simplemente di: "Voyager, please speak more slowly". También puedes escribir en cualquier momento mediante la caja de texto.',
    practicalTaskEn: 'Practice triggering a voice question to Voyager about American conversational greetings.',
    practicalTaskEs: 'Practica enviando una consulta de voz a Voyager sobre saludos conversacionales en EE.UU.',
    actionType: 'voice_test',
    comprehensionQuestions: [
      {
        id: 'q3-1',
        questionEn: 'What should you do if Voyager speaks too fast for your current English level?',
        questionEs: '¿Qué debes hacer si Voyager habla demasiado rápido para tu nivel actual de inglés?',
        optionsEn: [
          'Disconnect and never practice speaking again',
          'Switch to Slow speech mode or say "Voyager, please speak slower"',
          'Lower the computer screen brightness',
          'Type in all capital letters'
        ],
        optionsEs: [
          'Desconectarte y no volver a practicar conversación',
          'Cambiar al modo Lento o decir "Voyager, please speak slower"',
          'Bajar el brillo de la pantalla',
          'Escribir todo en letras mayúsculas'
        ],
        correctIndex: 1,
        explanationEn: 'Voyager supports Adaptive, Slow, and Study modes to match your comfortable listening speed.',
        explanationEs: 'Voyager soporta modos Adaptivo, Lento y Estudio para ajustarse a tu velocidad cómoda de escucha.'
      },
      {
        id: 'q3-2',
        questionEn: 'Can you use both voice and text chat during a Voyager practice session?',
        questionEs: '¿Puedes usar tanto voz como chat de texto durante una sesión de práctica con Voyager?',
        optionsEn: [
          'No, text is permanently disabled in Voyager',
          'Yes, voice and text chat complement each other seamlessly',
          'Only on weekends',
          'Only if you have an advanced C2 level'
        ],
        optionsEs: [
          'No, el texto está deshabilitado permanentemente',
          'Sí, la voz y el chat de texto se complementan a la perfección',
          'Solo los fines de semana',
          'Solo si tienes nivel avanzado C2'
        ],
        correctIndex: 1,
        explanationEn: 'Voyager provides complete flexibility: speak through the microphone or type in the input bar.',
        explanationEs: 'Voyager ofrece total flexibilidad: habla por micrófono o escribe en la barra de texto.'
      }
    ]
  },
  {
    id: 'fund-4',
    number: 4,
    titleEn: 'Connect With Your Teacher',
    titleEs: 'Conéctate con tu Profesor',
    subtitleEn: 'Learn how to use internal messaging, review teacher notes, and ask for guidance.',
    subtitleEs: 'Aprende a usar la mensajería interna, revisar notas de profesores y solicitar apoyo.',
    durationMinutes: 7,
    platformFeatureEn: 'Internal Communication Mail Modal (envelope icon), Teacher Feedback, and Notes.',
    platformFeatureEs: 'Modal de Mensajería Interna (icono de sobre), Retroalimentación y Notas de Profesores.',
    objectiveEn: 'Send a message or practice question to your teacher and check unread feedback notifications.',
    objectiveEs: 'Enviar un mensaje o duda a tu profesor y verificar notificaciones de mensajes no leídos.',
    videoPresenter: 'Head of Faculty & Teacher Liaison',
    videoPlaceholderTextEn: 'Teacher Communication: Getting Personalized Human & AI Feedback',
    videoPlaceholderTextEs: 'Comunicación con Profesores: Recibiendo Apoyo y Correcciones Personalizadas',
    videoScriptEn:
      'While Voyager is your 24/7 AI tutor, our human faculty of English teachers monitors your journey. Click the envelope icon below your profile picture to open internal messaging. Here you can write questions to your teacher, receive corrected essays, and review personalized study advice.',
    videoScriptEs:
      'Aunque Voyager es tu tutor de IA disponible 24/7, nuestro equipo de profesores de inglés supervisa tu progreso. Haz clic en el icono de sobre debajo de tu foto de perfil para abrir la mensajería interna. Aquí puedes escribir consultas a tu profesor, recibir correcciones de redacción y consejos personalizados.',
    practicalTaskEn: 'Open the internal messaging modal to see your conversation inbox with your assigned teacher.',
    practicalTaskEs: 'Abre el modal de mensajería interna para ver tu bandeja de conversación con tu profesor asignado.',
    actionType: 'teacher_mail',
    comprehensionQuestions: [
      {
        id: 'q4-1',
        questionEn: 'Where do you access internal messaging with your teachers in Voyager?',
        questionEs: '¿Dónde accedes a la mensajería interna con tus profesores en Voyager?',
        optionsEn: [
          'Via the Mail envelope icon below your student picture or in the bottom section',
          'By sending an email from your personal Gmail account',
          'Through a third-party social media app',
          'By postal mail'
        ],
        optionsEs: [
          'A través del icono de sobre (Mail) debajo de tu foto de estudiante o en la sección inferior',
          'Enviando un correo desde tu cuenta personal de Gmail',
          'Mediante una aplicación externa de redes sociales',
          'Por correo postal'
        ],
        correctIndex: 0,
        explanationEn: 'Internal messaging is integrated directly into Voyager via the dedicated envelope button and panel.',
        explanationEs: 'La mensajería interna está integrada directamente en Voyager mediante el botón de sobre y su panel dedicado.'
      },
      {
        id: 'q4-2',
        questionEn: 'What does a red dot on the Mail icon indicate?',
        questionEs: '¿Qué indica un punto rojo en el icono de Correo/Sobre?',
        optionsEn: [
          'System error',
          'Unread message or feedback from your teacher',
          'Internet connection lost',
          'Your subscription has expired'
        ],
        optionsEs: [
          'Error del sistema',
          'Mensaje o retroalimentación sin leer de tu profesor',
          'Conexión a internet perdida',
          'Tu suscripción ha vencido'
        ],
        correctIndex: 1,
        explanationEn: 'The red badge alerts you whenever there is new unread feedback waiting in your inbox.',
        explanationEs: 'El distintivo rojo te alerta cada vez que tienes nueva retroalimentación sin leer en tu bandeja.'
      }
    ]
  },
  {
    id: 'fund-5',
    number: 5,
    titleEn: 'Classes and Activities',
    titleEs: 'Clases y Actividades',
    subtitleEn: 'Find curated lessons, export to Google NotebookLM, and track active scenarios.',
    subtitleEs: 'Encuentra lecciones del catálogo, exporta a Google NotebookLM y gestiona escenarios.',
    durationMinutes: 8,
    platformFeatureEn: 'Consolidated Lesson Catalog, Scenario Practice Modal, and Google NotebookLM export.',
    platformFeatureEs: 'Catálogo de Lecciones Consolidado, Modal de Práctica y exportación a NotebookLM.',
    objectiveEn: 'Select a practice scenario from the catalog, explore objectives, and save it to My Lessons.',
    objectiveEs: 'Seleccionar un escenario de práctica, revisar sus objetivos y guardarlo en Mis Lecciones.',
    videoPresenter: 'Curriculum Director',
    videoPlaceholderTextEn: 'Activities Video: Real American Life Scenarios & NotebookLM Integration',
    videoPlaceholderTextEs: 'Video de Actividades: Escenarios Reales de EE.UU. e Integración con NotebookLM',
    videoScriptEn:
      'Voyager offers curated scenarios covering daily life, travel, citizenship, and career advancement. When you choose a lesson, you can hear a voice summary, customize the situation, and even export the lesson plan to Google NotebookLM to generate audio study overviews and flashcards!',
    videoScriptEs:
      'Voyager ofrece escenarios cuidadosamente diseñados sobre vida diaria, viajes, ciudadanía y trabajo. Al seleccionar una lección, puedes escuchar un resumen de voz, personalizar la situación e incluso exportar el plan a Google NotebookLM para generar resúmenes de audio y tarjetas de estudio.',
    practicalTaskEn: 'Explore the consolidated catalog and save a real-world scenario to your active collection.',
    practicalTaskEs: 'Explora el catálogo consolidado y guarda un escenario de la vida real en tu colección activa.',
    actionType: 'save_lesson',
    comprehensionQuestions: [
      {
        id: 'q5-1',
        questionEn: 'How does Google NotebookLM integration benefit your English learning in Voyager?',
        questionEs: '¿Cómo beneficia la integración con Google NotebookLM tu aprendizaje de inglés en Voyager?',
        optionsEn: [
          'It replaces your teacher completely',
          'It allows you to export lesson sources to generate audio summaries, study guides, and flashcards',
          'It charges an additional credit card fee',
          'It deletes all completed days'
        ],
        optionsEs: [
          'Reemplaza completamente a tu profesor',
          'Te permite exportar la fuente de la lección para generar resúmenes de audio, guías y tarjetas',
          'Cobra una tarifa adicional en tarjeta de crédito',
          'Elimina todos tus días completados'
        ],
        correctIndex: 1,
        explanationEn: 'NotebookLM turns your Voyager lesson plans into interactive audio podcasts and study notes.',
        explanationEs: 'NotebookLM convierte los planes de lección de Voyager en podcasts de audio interactivos y notas de estudio.'
      },
      {
        id: 'q5-2',
        questionEn: 'Where can you find lessons you have saved or started practicing?',
        questionEs: '¿Dónde puedes encontrar las lecciones que has guardado o comenzado a practicar?',
        optionsEn: [
          'Under the "Guardadas" (Saved) and "En Curso" (In Progress) filter pills in the catalog',
          'Only in an external spreadsheet',
          'They disappear after 5 minutes',
          'In your computer\'s trash folder'
        ],
        optionsEs: [
          'Bajo los filtros "Guardadas" y "En Curso" en el catálogo de lecciones',
          'Únicamente en una hoja de cálculo externa',
          'Desaparecen después de 5 minutos',
          'En la papelera de reciclaje de tu computadora'
        ],
        correctIndex: 0,
        explanationEn: 'The catalog filter bar lets you switch immediately to "Saved" or "In Progress" lessons.',
        explanationEs: 'La barra de filtros del catálogo te permite cambiar de inmediato a lecciones "Guardadas" o "En Curso".'
      }
    ]
  },
  {
    id: 'fund-6',
    number: 6,
    titleEn: 'Your Progress and Achievements',
    titleEs: 'Tu Progreso y Logros',
    subtitleEn: 'Understand CEFR proficiency levels, oral evaluation reports, and the 8 metric rings.',
    subtitleEs: 'Comprende niveles MCER, informes orales de evaluación y los 8 anillos de métricas.',
    durationMinutes: 8,
    platformFeatureEn: '8 Circular Metric Rings, Photo Oral Report Trigger, and Civics 128 Mastery.',
    platformFeatureEs: '8 Anillos Circulares de Métricas, Informe Oral con la Foto y Dominio Cívica 128.',
    objectiveEn: 'Interpret your pronunciation, fluency, vocabulary, and confidence scores, and request oral analysis.',
    objectiveEs: 'Interpretar tus puntuaciones de pronunciación, fluidez, vocabulario y confianza con análisis oral.',
    videoPresenter: 'Head of Language Assessment',
    videoPlaceholderTextEn: 'Assessment Video: How Voyager Measures & Celebrates Your Growth',
    videoPlaceholderTextEs: 'Video de Evaluación: Cómo Voyager Mide y Celebra tu Crecimiento',
    videoScriptEn:
      'Look at the eight circular metric rings on your Cover page. The top row measures your conversation skills: pronunciation, fluency, vocabulary, and confidence. The second row tracks your CEFR level, citizenship mastery, daily life modules, and weekly study hours. Tap any ring or click your student photo to hear me explain your progress orally!',
    videoScriptEs:
      'Observa los ocho anillos circulares de métricas en tu Portada. La primera fila mide tus habilidades conversacionales: pronunciación, fluidez, vocabulario y confianza. La segunda fila registra tu nivel MCER, dominio de ciudadanía, módulos de vida diaria y horas de estudio semanal. ¡Toca cualquier anillo o haz clic en tu foto para escuchar mi análisis oral!',
    practicalTaskEn: 'Tap any metric circle or your student photo to request an oral diagnostic breakdown from Voyager.',
    practicalTaskEs: 'Toca cualquier círculo de métrica o tu foto de estudiante para solicitar un desglose oral de Voyager.',
    actionType: 'inspect_metrics',
    comprehensionQuestions: [
      {
        id: 'q6-1',
        questionEn: 'What happens when you click on any of the 8 circular metric rings or your photo?',
        questionEs: '¿Qué sucede cuando haces clic en cualquiera de los 8 círculos de métricas o en tu foto?',
        optionsEn: [
          'It permanently deletes your score',
          'Voyager analyzes what the metric means and explains actionable steps to improve it',
          'It signs you out of the application',
          'It changes your screen language to French'
        ],
        optionsEs: [
          'Elimina permanentemente tu puntuación',
          'Voyager analiza qué significa la métrica y te explica pasos prácticos para mejorarla',
          'Cierra tu sesión en la aplicación',
          'Cambia el idioma de tu pantalla a francés'
        ],
        correctIndex: 1,
        explanationEn: 'Every metric ring is fully interactive: clicking it prompts Voyager to deliver an oral analysis.',
        explanationEs: 'Cada anillo de métrica es interactivo: al tocarlo, Voyager ofrece un análisis oral detallado.'
      },
      {
        id: 'q6-2',
        questionEn: 'What does the "Meta Semanal de Estudio" ring track?',
        questionEs: '¿Qué registra el anillo de "Meta Semanal de Estudio"?',
        optionsEn: [
          'How many emails you received this year',
          'Your progress toward your target study hours per week (e.g. 5 hrs/week)',
          'The battery percentage of your microphone',
          'The number of days in the month'
        ],
        optionsEs: [
          'Cuántos correos recibiste este año',
          'Tu avance hacia tus horas objetivo de estudio por semana (ej. 5 hrs./semana)',
          'El porcentaje de batería de tu micrófono',
          'La cantidad de días en el mes'
        ],
        correctIndex: 1,
        explanationEn: 'The weekly goal ring calculates your real practice time against your defined weekly target.',
        explanationEs: 'El anillo de meta semanal calcula tu tiempo real de práctica frente a tu objetivo semanal.'
      }
    ]
  }
];

// Helper functions for storage and tracking
const FUNDAMENTALS_STORAGE_KEY = 'voyager_fundamentals_progress';

export function getCompletedFundamentals(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FUNDAMENTALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markFundamentalsLessonCompleted(lessonId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getCompletedFundamentals();
    if (!current.includes(lessonId)) {
      const updated = [...current, lessonId];
      localStorage.setItem(FUNDAMENTALS_STORAGE_KEY, JSON.stringify(updated));
      
      // Also register completion in user account completedDays
      try {
        const userRaw = localStorage.getItem('voyager_user_account');
        if (userRaw) {
          const userObj = JSON.parse(userRaw);
          const today = new Date().getDate();
          const days: number[] = Array.isArray(userObj.completedDays) ? userObj.completedDays : [1];
          if (!days.includes(today)) {
            userObj.completedDays = [...days, today];
            localStorage.setItem('voyager_user_account', JSON.stringify(userObj));
          }
        }
      } catch {}

      window.dispatchEvent(new Event('voyager_fundamentals_updated'));
      window.dispatchEvent(new Event('voyager_profile_updated'));
      return updated;
    }
    return current;
  } catch {
    return [];
  }
}

export function isFundamentalsCompleted(lessonId: string): boolean {
  return getCompletedFundamentals().includes(lessonId);
}

export function getFundamentalsCompletionPercent(): number {
  const completed = getCompletedFundamentals();
  return Math.round((completed.length / VOYAGER_FUNDAMENTALS_LESSONS.length) * 100);
}
