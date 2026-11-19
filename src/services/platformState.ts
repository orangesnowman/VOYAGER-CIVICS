/**
 * VOYAGER PLATFORM STATE & SECTION REGISTRY
 *
 * Single source of truth for platform sections, left-right panel synchronization,
 * and assistant lifecycle state.
 */

export type AssistantState = 'active' | 'speaking' | 'listening' | 'paused' | 'idle';

export interface SectionMetadata {
  id: string;
  title: { EN: string; ES: string };
  passportTitle: { EN: string; ES: string };
  passportName: { EN: string; ES: string };
  description: { EN: string; ES: string };
  welcomeMessage: { EN: string; ES: string };
  isContextualAssistantOnly: boolean;
}

export const SECTION_REGISTRY: Record<string, SectionMetadata> = {
  lessons: {
    id: 'lessons',
    title: {
      EN: 'Lesson Index',
      ES: 'Índice de lecciones'
    },
    passportTitle: {
      EN: 'LESSON INDEX',
      ES: 'ÍNDICE DE LECCIONES'
    },
    passportName: {
      EN: 'VOYAGER USA',
      ES: 'VOYAGER USA'
    },
    description: {
      EN: 'Unified workspace for lessons, custom folders, and study library.',
      ES: 'Área unificada para lecciones, carpetas personalizadas y biblioteca de estudio.'
    },
    welcomeMessage: {
      EN: 'Welcome to your Lesson Index. Here you can explore your lessons and learning materials. If you need any help, just ask me.',
      ES: 'Te doy la bienvenida a tu Índice de lecciones. Aquí puedes explorar tus clases y materiales. Si necesitas algo, solo pregúntame.'
    },
    isContextualAssistantOnly: true
  },
  roadmap: {
    id: 'roadmap',
    title: {
      EN: 'My Journey',
      ES: 'Mi Trayectoria'
    },
    passportTitle: {
      EN: 'MY JOURNEY',
      ES: 'MI TRAYECTORIA'
    },
    passportName: {
      EN: 'MY PROFILE',
      ES: 'MI PERFIL'
    },
    description: {
      EN: 'Academic progress, CEFR level assessment, practice hours, and skills.',
      ES: 'Progreso académico, nivel MCER, horas de práctica y habilidades.'
    },
    welcomeMessage: {
      EN: 'Welcome to your profile. Here you can track your progress and stats. If you need any guidance, let me know.',
      ES: 'Bienvenido a tu perfil. En este espacio encuentras el resumen de tu progreso y estadísticas. Si necesitas orientación, avísame.'
    },
    isContextualAssistantOnly: true
  },
  teachers: {
    id: 'teachers',
    title: {
      EN: 'Teachers',
      ES: 'Docentes'
    },
    passportTitle: {
      EN: 'TEACHERS',
      ES: 'DOCENTES'
    },
    passportName: {
      EN: 'MASTERS',
      ES: 'DOCENTES'
    },
    description: {
      EN: 'Instructor assignments, group communications, and academic coaching.',
      ES: 'Tareas asignadas por profesores, comunicación grupal y acompañamiento docente.'
    },
    welcomeMessage: {
      EN: 'Welcome to the Teachers section. Here you can check teacher assignments and updates.',
      ES: 'Bienvenido a la sección de Docentes. Aquí puedes consultar las tareas y novedades de tus profesores.'
    },
    isContextualAssistantOnly: true
  },
  citizenship: {
    id: 'citizenship',
    title: {
      EN: 'Citizenship 128',
      ES: 'Ciudadanía 128'
    },
    passportTitle: {
      EN: 'CITIZENSHIP',
      ES: 'CIUDADANÍA'
    },
    passportName: {
      EN: 'USCIS EXAM',
      ES: 'EXAMEN DE'
    },
    description: {
      EN: 'USCIS Civics 128 study guide, historical context, and interview simulation.',
      ES: 'Guía de estudio USCIS Cívica 128, contexto histórico y simulacro de entrevista.'
    },
    welcomeMessage: {
      EN: 'Welcome to USCIS Civics 128 preparation. When you are ready to study questions or simulate an interview, let me know.',
      ES: 'Bienvenido al módulo de Ciudadanía 128 de USCIS. Cuando desees repasar preguntas o simular una entrevista, avísame.'
    },
    isContextualAssistantOnly: false
  },
  civics: {
    id: 'civics',
    title: {
      EN: 'Citizenship 128',
      ES: 'Ciudadanía 128'
    },
    passportTitle: {
      EN: 'CITIZENSHIP',
      ES: 'CIUDADANÍA'
    },
    passportName: {
      EN: 'USCIS EXAM',
      ES: 'EXAMEN DE'
    },
    description: {
      EN: 'USCIS Civics 128 study guide, historical context, and interview simulation.',
      ES: 'Guía de estudio USCIS Cívica 128, contexto histórico y simulacro de entrevista.'
    },
    welcomeMessage: {
      EN: 'Welcome to USCIS Civics 128 preparation. When you are ready to study questions or simulate an interview, let me know.',
      ES: 'Bienvenido al módulo de Ciudadanía 128 de USCIS. Cuando desees repasar preguntas o simular una entrevista, avísame.'
    },
    isContextualAssistantOnly: false
  },
  settings: {
    id: 'settings',
    title: {
      EN: 'Settings',
      ES: 'Configuración'
    },
    passportTitle: {
      EN: 'SETTINGS',
      ES: 'CONFIGURACIÓN'
    },
    passportName: {
      EN: 'SYSTEM',
      ES: 'SISTEMA'
    },
    description: {
      EN: 'Interface language, audio speed, speech rate, and learning preferences.',
      ES: 'Idioma de la interfaz, velocidad de voz, ritmo de habla y preferencias de aprendizaje.'
    },
    welcomeMessage: {
      EN: 'Welcome to Settings. Here you can configure language, audio speed, and practice preferences.',
      ES: 'Bienvenido a Configuración. Aquí puedes configurar el idioma, velocidad de voz y preferencias de práctica.'
    },
    isContextualAssistantOnly: true
  },
  shopping: {
    id: 'shopping',
    title: {
      EN: 'Store',
      ES: 'La Tienda'
    },
    passportTitle: {
      EN: 'LA TIENDA',
      ES: 'LA TIENDA'
    },
    passportName: {
      EN: 'VOYAGER STORE',
      ES: 'LA TIENDA'
    },
    description: {
      EN: 'Study books, workbooks, coaching packages, and memberships.',
      ES: 'Libros de trabajo, materiales de estudio, paquetes de coaching y membresías.'
    },
    welcomeMessage: {
      EN: 'Welcome to the Store. How can I help you today?',
      ES: 'Bienvenido a La Tienda. ¿En qué te puedo ayudar hoy?'
    },
    isContextualAssistantOnly: true
  },
  chat: {
    id: 'chat',
    title: {
      EN: 'Conversation',
      ES: 'Conversación'
    },
    passportTitle: {
      EN: 'CONVERSATION',
      ES: 'CONVERSACIÓN'
    },
    passportName: {
      EN: 'VOYAGER USA',
      ES: 'VOYAGER USA'
    },
    description: {
      EN: 'Spoken American English conversation and guided lessons with Voyager.',
      ES: 'Conversación en inglés americano y lecciones guiadas con Voyager.'
    },
    welcomeMessage: {
      EN: "Welcome back! Let's continue practicing English.",
      ES: '¡Bienvenido de vuelta! Sigamos practicando inglés.'
    },
    isContextualAssistantOnly: false
  },
  home: {
    id: 'home',
    title: {
      EN: 'Home',
      ES: 'Inicio'
    },
    passportTitle: {
      EN: 'VOYAGER USA',
      ES: 'VOYAGER USA'
    },
    passportName: {
      EN: 'PASSPORT',
      ES: 'PASAPORTE'
    },
    description: {
      EN: 'Main dashboard and voice tutor portal.',
      ES: 'Portal principal y tutor de voz.'
    },
    welcomeMessage: {
      EN: 'Welcome to USA Voyager. Your American English tutor.',
      ES: 'Bienvenido a USA Voyager. Tu tutor de inglés americano.'
    },
    isContextualAssistantOnly: false
  },
  admin: {
    id: 'admin',
    title: {
      EN: 'Admin Panel',
      ES: 'Panel de Administración'
    },
    passportTitle: {
      EN: 'ADMINISTRADOR',
      ES: 'ADMINISTRADOR'
    },
    passportName: {
      EN: 'FEDERICO SANDOVAL',
      ES: 'FEDERICO SANDOVAL'
    },
    description: {
      EN: 'System administration and user controls.',
      ES: 'Administración del sistema y controles de usuario.'
    },
    welcomeMessage: {
      EN: 'Welcome to the Administrator panel.',
      ES: 'Bienvenido al panel de administración.'
    },
    isContextualAssistantOnly: true
  }
};

export function getSectionMetadata(tabId: string): SectionMetadata {
  return SECTION_REGISTRY[tabId] || {
    id: tabId,
    title: { EN: tabId.toUpperCase(), ES: tabId.toUpperCase() },
    passportTitle: { EN: tabId.toUpperCase(), ES: tabId.toUpperCase() },
    passportName: { EN: 'VOYAGER USA', ES: 'VOYAGER USA' },
    description: { EN: '', ES: '' },
    welcomeMessage: { EN: `Welcome to ${tabId}.`, ES: `Bienvenido a ${tabId}.` },
    isContextualAssistantOnly: true
  };
}
