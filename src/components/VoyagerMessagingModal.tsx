import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import TipTapUnderline from '@tiptap/extension-underline';
import { 
  BookOpen, Users, Megaphone, Paperclip, X, Star, ChevronsRight, Trash2, ArrowLeft, ArrowRight,
  Mail, Clock, Download, Reply, Send, MessageSquare, CheckCircle2, 
  User, Square, CheckSquare, Heart, ClipboardList, Smile, 
  Link as LinkIcon, Image as ImageIcon, ExternalLink, Bold, Italic, Underline, 
  List, ListOrdered, Volume2, Check, Plus, Play, ChevronLeft, ChevronRight, ChevronDown 
} from 'lucide-react';
import { UnifiedAssignment, fetchUnifiedStudentAssignments, updateUnifiedAssignmentStatus } from '../services/teacherStudentService';

export type ChannelId = 'profe' | 'grupo' | 'anuncios' | 'voyager';

export interface Attachment {
  name: string;
  size?: string;
  type: 'pdf' | 'pptx' | 'doc';
  url?: string;
}

export interface MessageReply {
  id: string;
  sender: string;
  senderEmail?: string;
  date: string;
  fullDate?: string;
  body: string;
  isStudent?: boolean;
}

export interface ChannelMessage {
  id: string;
  sender: string;
  date: string; // DD/MM/YY
  fullDate?: string;
  subject?: string;
  senderEmail?: string;
  preview: string;
  subtitle?: string;
  body: string;
  isUnread: boolean;
  channel: ChannelId;
  category?: 'system' | 'account' | 'promo' | 'education';
  attachment?: Attachment;
  isSelected?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  replies?: MessageReply[];
}

// Teacher Icon — represents an educator at a chalkboard with pointer, replacing student graduation cap
export const TeacherIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Chalkboard with chalk line */}
    <rect x="2" y="3" width="11" height="8" rx="1" />
    <line x1="4.5" y1="6" x2="8.5" y2="6" />
    {/* Stand */}
    <line x1="7.5" y1="11" x2="7.5" y2="20" />
    <line x1="4" y1="20" x2="11" y2="20" />
    {/* Teacher educator */}
    <circle cx="18" cy="6" r="2.5" />
    <path d="M14 20v-2.5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v2.5" />
    {/* Pointer directed to chalkboard */}
    <line x1="14" y1="13" x2="8.5" y2="8" />
  </svg>
);

interface VoyagerMessagingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  selectedLang?: 'EN' | 'ES';
  user?: {
    firstName?: string;
    lastName?: string;
    studentId?: string;
  };
  onUnreadCountChange?: (count: number) => void;
  className?: string;
  onAskVoyager?: (prompt: string) => void;
}

// Utility to simplify dates into compact DD/MM/YY format (e.g. 13/10/26, 02:15 PM)
export const formatSimpleDate = (dateStr?: string, fallback?: string): string => {
  if (!dateStr) return fallback || '';
  
  // Clean timezone suffixes like EST, EDT, PST, PDT
  const cleaned = dateStr.replace(/\s*(?:EST|EDT|PST|PDT)\b/gi, '').trim();

  // If already in DD/MM/YY format e.g. "13/10/26, 02:15 PM" or "13/10/26"
  const dateMatch = cleaned.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
  const timeMatch = cleaned.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?/);
  if (dateMatch) {
    return timeMatch ? `${dateMatch[0]}, ${timeMatch[0]}` : dateMatch[0];
  }

  // Convert Spanish / English month names e.g. "13 de Octubre de 2026, 02:15 PM" -> "13/10/26, 02:15 PM"
  const spanishMonthMap: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    ene: '01', feb: '02', mar: '03', abr: '04', jun: '06',
    jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12',
  };

  const regexLong = /(\d{1,2})\s+de\s+([a-zA-Z]+)(?:\s+de\s+(\d{2,4}))?(?:[,\s—-]+([\d:APMapm\s]+))?/i;
  const match = cleaned.match(regexLong);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthKey = match[2].toLowerCase();
    const month = spanishMonthMap[monthKey] || '10';
    const year = (match[3] || '26').slice(-2);
    const timePart = match[4] ? match[4].trim() : '';
    return timePart ? `${day}/${month}/${year}, ${timePart}` : `${day}/${month}/${year}`;
  }

  return cleaned;
};

// Initial seed matching the exact Mensajería Voyager design guide with rich full email bodies
const INITIAL_MESSAGES: ChannelMessage[] = [
  // --- Profesor García Channel ---
  {
    id: 'lp-1',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '13/10/26',
    fullDate: '13 de Octubre de 2026, 10:45 AM EST',
    subject: 'Tarea y Material de Lectura — Capítulo 4: Práctica Fonética',
    preview: 'Recuerda que la tarea es sobre el capítulo 4.',
    subtitle: 'Aquí tienes el material de lectura.',
    body: `Estimado Federico,

Espero que te encuentres muy bien y avanzando a buen ritmo con tus lecciones en USA Voyager.

Te escribo para recordarte que la tarea de esta semana está centrada en el Capítulo 4: Práctica de Fonética y Enlaces de Palabras en Inglés Americano (Linking Sounds & Stress Patterns).

Instrucciones para la entrega:
1. Revisa detenidamente las páginas 42 a 48 del material adjunto antes de nuestra próxima sesión.
2. Graba una nota de voz de 1 minuto en la app respondiendo a las preguntas de comprensión situacional.
3. Presta especial atención a la pronunciación de las vocales cortas (/æ/ vs /ʌ/) y a las consonantes finales.

Fecha límite de entrega: Viernes a las 6:00 PM EST.

Adjunto a este correo tienes el documento completo en PDF con los ejercicios prácticos y la guía de referencia. Si te surge cualquier duda o necesitas apoyo antes del viernes, puedes escribirme por este canal.

¡Mucho éxito con tu preparación y nos vemos en clase!

Atentamente,
Profesor García
Docente Titular de Fonética y Conversación — USA Voyager`,
    isUnread: true,
    channel: 'profe',
    attachment: {
      name: 'Capítulo 4 - Material de lectura.pdf',
      size: '1.2 MB',
      type: 'pdf',
    },
    replies: [
      {
        id: 'rep-lp-1-1',
        sender: 'Federico Sandoval',
        senderEmail: 'theorangesnowman@gmail.com',
        date: '13/10/26',
        fullDate: '13/10/26, 02:15 PM',
        body: 'Profesor García, ya revisé las páginas 42 a 48 y estoy practicando la fonética. ¿La grabación de 1 minuto debe enviarse en formato de audio específico o puedo subirla directamente desde la app?',
        isStudent: true,
      },
      {
        id: 'rep-lp-1-2',
        sender: 'Profesor García',
        senderEmail: 'profesor.garcia@usavoyager.edu',
        date: '13/10/26',
        fullDate: '13/10/26, 03:00 PM',
        body: 'Hola Federico, puedes grabarla directamente desde la app usando el micrófono en esta misma sección. Lo más importante es la claridad y el ritmo en las vocales cortas. ¡Quedo atento a tu entrega!',
        isStudent: false,
      },
    ],
  },
  {
    id: 'lp-2',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '08/10/26',
    fullDate: '08 de Octubre de 2026, 04:15 PM EST',
    subject: 'Horarios de Asesoría y Dudas de Fonética',
    preview: 'Cualquier duda me escribes.',
    body: `Hola Federico,

Quería hacer un breve seguimiento sobre tus últimos ejercicios de pronunciación en la plataforma. Noté una gran mejoría en la entonación de oraciones complejas y preguntas abiertas.

Recuerda que si tienes dudas sobre los patrones de acentuación o los términos de la entrevista de ciudadanía, puedes escribirme directamente por este chat o agendar 15 minutos de asesoría personalizada.

Horarios de atención de esta semana:
• Martes y Jueves: 4:00 PM - 6:30 PM EST
• Miércoles: 11:00 AM - 1:00 PM EST

¡Sigue con ese excelente entusiasmo!

Un cordial saludo,
Profesor García`,
    isUnread: false,
    channel: 'profe',
  },
  {
    id: 'lp-3',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '05/10/26',
    fullDate: '05 de Octubre de 2026, 09:30 AM EST',
    subject: 'Confirmación de Sesión Interactiva en Vivo: Viernes 10:00 AM',
    preview: 'La próxima clase será el viernes.',
    body: `Estimado Federico,

Te confirmo que nuestra próxima clase interactiva de conversación en vivo está programada para este viernes a las 10:00 AM EST (Hora de Nueva York).

En esta sesión cubriremos:
1. Simulación de entrevista cívica (sección de historia colonial y principios democráticos de EE. UU.).
2. Ejercicios de respuesta rápida y escucha activa con el asistente Voyager.
3. Corrección de acento y fluidez en tiempo real.

Por favor asegúrate de tener tus audífonos con micrófono listos y repasar el vocabulario de la Constitución Americana.

¡Nos vemos el viernes en la sala virtual!

Profesor García`,
    isUnread: false,
    channel: 'profe',
  },
  {
    id: 'lp-4',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '02/10/26',
    fullDate: '02 de Octubre de 2026, 02:20 PM EST',
    subject: 'Rúbrica de Evaluación — Proyecto Oral de Conversación',
    preview: 'Revisa la rúbrica del proyecto.',
    body: `Hola Federico,

Comparto contigo la rúbrica oficial de evaluación para el proyecto oral del módulo actual de inglés americano.

Criterios de calificación:
• Fluidez y ritmo natural al hablar (25%)
• Claridad de pronunciación y reducción de acento nativo (30%)
• Uso apropiado de estructuras gramaticales y conectores (25%)
• Vocabulario cívico y seguridad al responder preguntas imprevistas (20%)

Revisa el documento PDF adjunto para conocer en detalle la escala de puntos y los ejemplos recomendados para obtener la máxima calificación.

Saludos cordiales,
Profesor García`,
    isUnread: false,
    channel: 'profe',
    attachment: {
      name: 'Rúbrica_Proyecto.pdf',
      size: '640 KB',
      type: 'pdf',
    },
  },
  {
    id: 'lp-5',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '29/09/26',
    fullDate: '29 de Septiembre de 2026, 11:50 AM EST',
    subject: 'Felicitaciones por tu desempeño en la presentación oral',
    preview: '¡Buen trabajo en la presentación!',
    body: `¡Excelente trabajo hoy, Federico!

Quiero felicitarte formalmente por tu presentación sobre "Rights and Responsibilities of U.S. Citizens". Demostraste un dominio sólido del vocabulario, excelente proyección de voz y muy buena seguridad al responder las preguntas imprevistas.

Como siguiente paso, te sugiero practicar los verbos irregulares en tiempo pasado para pulir aún más tus respuestas espontáneas.

¡Sigue con esa misma dedicación y constancia!

Profesor García`,
    isUnread: false,
    channel: 'profe',
  },
  {
    id: 'lp-6',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '26/09/26',
    fullDate: '26 de Septiembre de 2026, 08:30 AM EST',
    subject: 'Lectura Obligatoria previa al Taller de Fonética',
    preview: 'No olvides leer el capítulo 4.',
    body: `Estimado Federico,

Un breve recordatorio para nuestra próxima sesión: asegúrate de completar la lectura del Capítulo 4 antes de ingresar al aula virtual.

Estaremos realizando ejercicios prácticos en parejas y es fundamental que todos tengan claros los conceptos de "voiced vs. voiceless consonants" y las terminaciones en "-ed".

Que tengas una productiva semana de estudio,
Profesor García`,
    isUnread: false,
    channel: 'profe',
  },
  {
    id: 'lp-7',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '23/09/26',
    fullDate: '23 de Septiembre de 2026, 05:40 PM EST',
    subject: 'Material Complementario: Diapositivas de la Clase 8',
    preview: 'Adjunto las diapositivas de la clase.',
    body: `Estimado Federico,

Tal como acordamos en la clase de ayer, te adjunto las diapositivas correspondientes al tema "American Idioms & Professional Expressions".

Contenido de la presentación:
• Las 25 expresiones idiomáticas más usadas en entornos laborales en EE. UU.
• Ejemplos prácticos de oraciones y transcripción fonética IPA.
• Ejercicios interactivos para practicar con el tutor de voz Voyager.

Puedes descargar el archivo PPTX directamente desde el enlace adjunto.

Que tengas una excelente semana de estudio,
Profesor García`,
    isUnread: false,
    channel: 'profe',
    attachment: {
      name: 'Diapositivas_Clase.pptx',
      size: '3.4 MB',
      type: 'pptx',
    },
  },
  {
    id: 'lp-8',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '20/09/26',
    fullDate: '20 de Septiembre de 2026, 01:15 PM EST',
    subject: 'Horarios de Consulta y Preparación de Examen',
    preview: 'Horarios de consulta esta semana.',
    body: `Hola Federico,

Para quienes están preparándose para el examen cívico de USCIS este mes, abriré horarios especiales de consulta individual de 20 minutos.

Podemos revisar tus preguntas difíciles, pronunciación de nombres históricos o dudas sobre el formulario N-400.

Si deseas reservar tu espacio, responde a este correo con tu horario de preferencia entre las 2:00 PM y las 5:00 PM de este jueves.

Saludos cordiales,
Profesor García`,
    isUnread: false,
    channel: 'profe',
  },
  {
    id: 'lp-9',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '17/09/26',
    fullDate: '17 de Septiembre de 2026, 10:00 AM EST',
    subject: 'Resultados de la Evaluación Diagnóstica Inicial',
    preview: 'Resultados de la actividad.',
    body: `Estimado Federico,

Ya están disponibles los resultados de tu evaluación diagnóstica de nivel de inglés y conocimientos cívicos.

Resumen de resultados:
• Comprensión auditiva (Listening): 92% (Nivel Avanzado)
• Fluidez conversacional (Speaking): 85% (Nivel Intermedio Alto)
• Precisión gramatical (Grammar): 88%
• Conocimientos cívicos (Civics 128): 18/20 correctas en la primera ronda

¡Has tenido un desempeño extraordinario! Con las prácticas guiadas de Voyager lograremos perfeccionar la velocidad de respuesta.

¡Felicitaciones!
Profesor García`,
    isUnread: false,
    channel: 'profe',
  },
  {
    id: 'lp-10',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '14/09/26',
    fullDate: '14 de Septiembre de 2026, 09:15 AM EST',
    subject: 'Bienvenida al Módulo de Fonética y Conversación Activa',
    preview: 'Bienvenido al curso de fonética y conversación.',
    body: `Estimado Federico,

Te doy la más cordial bienvenida al programa de Fonética y Conversación Activa de USA Voyager.

En este módulo trabajaremos de forma intensiva en el desarrollo de la confianza vocal, entonación natural y preparación directa para la entrevista cívica.

Te recomiendo explorar las herramientas de audio de Voyager y programar tus sesiones de práctica diaria.

¡Mucho éxito en este viaje formativo!

Profesor García`,
    isUnread: false,
    channel: 'profe',
  },
  {
    id: 'lp-11',
    sender: 'Profesor García',
    senderEmail: 'profesor.garcia@usavoyager.edu',
    date: '10/09/26',
    fullDate: '10 de Septiembre de 2026, 08:00 AM EST',
    subject: 'Guía de Inicio y Recursos de Audio Recomendados',
    preview: 'Guía de inicio para estudiantes de USA Voyager.',
    body: `Hola Federico,

Comparto contigo la guía inicial con enlaces a recursos recomendados para el entrenamiento auditivo en inglés americano:

1. Prácticas de dictado y ritmo en tiempo real.
2. Ejercicios de discriminación auditiva de vocales cortas.
3. Glosario fonético de términos constitucionales.

Puedes consultar estos materiales a tu propio ritmo antes de iniciar los talleres interactivos.

Saludos cordiales,
Profesor García`,
    isUnread: false,
    channel: 'profe',
    attachment: {
      name: 'Guia_Inicio_Audio.pdf',
      size: '520 KB',
      type: 'pdf',
    },
  },

  // --- Grupo Chat Channel ---
  {
    id: 'gc-1',
    sender: 'Sofía R.',
    senderEmail: 'sofia.rodriguez@learner.usavoyager.com',
    date: '13/10/26',
    fullDate: '13 de Octubre de 2026, 03:20 PM EST',
    subject: 'Grupo de Estudio: Preguntas Cívicas de Historia Americana',
    preview: '¿Quién quiere repasar las preguntas cívicas hoy?',
    body: `¡Hola a todos los compañeros!

¿Alguien disponible hoy a las 7:00 PM para una sesión grupal de 45 minutos?

La idea es hacernos preguntas cruzadas de las 128 preguntas oficiales de USCIS, específicamente las del período colonial y la Guerra Civil, que son las que más suelen confundir.

Podemos practicar usando las flashcards interactivas de Voyager. ¡Dejen su confirmación aquí para coordinar!

Sofía`,
    isUnread: true,
    channel: 'grupo',
    replies: [
      {
        id: 'rep-gc-1-1',
        sender: 'Carlos M.',
        senderEmail: 'carlos.mendoza@learner.usavoyager.com',
        date: '13/10/26',
        fullDate: '13/10/26, 03:45 PM',
        body: '¡Cuenta conmigo, Sofía! Me conecto a las 7:00 PM con las flashcards listas para repasar el período colonial.',
        isStudent: false,
      },
      {
        id: 'rep-gc-1-2',
        sender: 'Federico Sandoval',
        senderEmail: 'theorangesnowman@gmail.com',
        date: '13/10/26',
        fullDate: '13/10/26, 04:10 PM',
        body: 'Yo también me uno a las 7:00 PM. Tengo dudas en las preguntas sobre la Convención Constitucional y el Congreso.',
        isStudent: true,
      },
    ],
  },
  {
    id: 'gc-2',
    sender: 'Carlos M.',
    senderEmail: 'carlos.mendoza@learner.usavoyager.com',
    date: '11/10/26',
    fullDate: '11 de Octubre de 2026, 06:10 PM EST',
    subject: 'Apuntes y Consejos del Simulacro de Entrevista Oficial',
    preview: 'Comparto mis notas del simulacro.',
    body: `Hola grupo,

Ayer completé el simulacro de entrevista de ciudadanía con el Profe García y preparé un documento con las preguntas que más me costaron y cómo estructurar respuestas claras y concisas.

Incluye consejos para cuando el oficial te pide repetir una pregunta o si te pregunta el significado de términos legales como "hereditary title" o "bear arms".

Espero les sirva mucho para su preparación. ¡Mucho ánimo a todos!

Carlos M.`,
    isUnread: true,
    channel: 'grupo',
    attachment: {
      name: 'Resumen_Entrevista_Civica.pdf',
      size: '850 KB',
      type: 'pdf',
    },
  },
  {
    id: 'gc-3',
    sender: 'Elena T.',
    senderEmail: 'elena.torres@learner.usavoyager.com',
    date: '08/10/26',
    fullDate: '08 de Octubre de 2026, 12:45 PM EST',
    subject: 'Recomendación: Módulo de Pronunciación en Tiempo Real',
    preview: '¡El módulo de pronunciación con Voyager es genial!',
    body: `Hola a todos,

Quería recomendarles que dediquen al menos 10 minutos al día al modo de conversación con Voyager en la pestaña de chat. El análisis acústico te dice exactamente en qué sílaba tuviste error y cómo corregirlo de inmediato.

A mí me ayudó un montón a perder el miedo a hablar en voz alta.

¡Nos vemos en la clase del viernes!
Elena`,
    isUnread: false,
    channel: 'grupo',
  },

  // --- Voyager Official Communications Channel ---
  {
    id: 'voy-1',
    sender: 'Sistema Voyager',
    senderEmail: 'system@usavoyager.edu',
    date: '15/10/26',
    fullDate: '15 de Octubre de 2026, 10:30 AM EST',
    subject: 'Actualización del Sistema: Motor de Voz Voyager Puck 4.2',
    preview: 'Mejoras de latencia acústica y calibración fonética nativa.',
    subtitle: 'Notificación oficial de infraestructura y tecnología.',
    category: 'system',
    body: `Estimado estudiante,

Te informamos que la plataforma USA Voyager ha sido actualizada a la versión 4.2 de nuestro motor conversacional Gemini Live 'Puck'.

Principales optimizaciones:
• Reducción de latencia en la síntesis de voz interactiva a menos de 400ms.
• Mayor precisión en la detección fonética de consonantes continuas y diptongos americanos.
• Integración automática con tu Índice de Charlas y registro de progreso en tiempo real.

No se requiere ninguna acción de tu parte; los cambios ya están activos en tu cuenta.

Equipo de Ingeniería
USA Voyager`,
    isUnread: true,
    channel: 'voyager',
  },
  {
    id: 'voy-2',
    sender: 'Soporte y Cuenta Voyager',
    senderEmail: 'accounts@usavoyager.edu',
    date: '14/10/26',
    fullDate: '14 de Octubre de 2026, 02:15 PM EST',
    subject: 'Estado de tu Perfil de Estudiante y Certificación CEFR B2',
    preview: 'Tu progreso actual supera el 90% hacia tu meta.',
    subtitle: 'Comunicaciones de cuenta y validación de credenciales.',
    category: 'account',
    body: `Hola Federico,

Hemos verificado tu avance pedagógico en el módulo actual. Tu índice de preparación lingüística se sitúa en un 90% hacia tu objetivo de certificación B2 → C1.

Recuerda que puedes visualizar y descargar tu certificado oficial en la sección de Perfil de Estudiante en cualquier momento.

Si requieres actualizar tus datos personales o solicitar un desglose de horas para tu expediente, puedes hacerlo directamente desde tu panel.

Atentamente,
Departamento de Registros y Matrículas
USA Voyager`,
    isUnread: true,
    channel: 'voyager',
  },
  {
    id: 'voy-3',
    sender: 'Promociones y Novedades',
    senderEmail: 'promotions@usavoyager.edu',
    date: '13/10/26',
    fullDate: '13 de Octubre de 2026, 04:00 PM EST',
    subject: 'Beneficio Especial: Acceso Extendido a Simulacros USCIS 2026',
    preview: 'Acceso ilimitado a las 128 preguntas oficiales con retroalimentación.',
    subtitle: 'Oportunidad exclusiva para estudiantes activos.',
    category: 'promo',
    body: `¡Felicidades por tu constancia en tus prácticas diarias!

Como reconocimiento a tu compromiso, hemos habilitado en tu cuenta acceso preferencial a todos los simuladores de examen de ciudadanía 2026 sin límite de intentos durante este mes.

Aprovecha este beneficio para practicar las preguntas de historia y gobierno de EE. UU. con evaluación inmediata de Voyager.

Equipo de Promociones
USA Voyager`,
    isUnread: false,
    channel: 'voyager',
  },
  {
    id: 'an-1',
    sender: 'Coordinación Académica',
    senderEmail: 'academics@usavoyager.edu',
    date: '12/10/26',
    fullDate: '12 de Octubre de 2026, 09:00 AM EST',
    subject: 'Convocatoria Oficial: Simulacro General de Examen de Ciudadanía 2026',
    preview: 'Simulacro General de Examen de Ciudadanía 2026',
    subtitle: 'Convocatoria abierta para estudiantes activos.',
    category: 'education',
    body: `Estimados estudiantes de USA Voyager,

La Coordinación Académica les invita cordialmente a participar en el próximo Simulacro General de Examen de Ciudadanía Americana 2026.

Detalles de la sesión:
• Fecha: Sábado 24 de Octubre de 2026
• Horario: 9:00 AM - 12:00 PM EST
• Modalidad: 100% en línea a través de la plataforma Voyager
• Formato: 20 preguntas cívicas aleatorias de la lista oficial USCIS 128, prueba de lectura y dictado en inglés, y evaluación de antecedentes del formulario N-400.

Al finalizar el simulacro, cada participante recibirá un reporte detallado con su puntaje estimado, desglose por categorías temáticas y recomendaciones específicas para su entrevista oficial.

Inscripciones abiertas hasta el miércoles 21 de octubre. Descarga la guía oficial adjunta para conocer todos los detalles.

Atentamente,
Coordinación Académica
USA Voyager Institute`,
    isUnread: true,
    channel: 'voyager',
    attachment: {
      name: 'Guia_Simulacro_Oficial_2026.pdf',
      size: '2.1 MB',
      type: 'pdf',
    },
  },
];

// Yellow paper airplane matching the design guide image
export const YellowPaperPlane: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className || "w-5.5 h-5.5 sm:w-6 sm:h-6 shrink-0 transition-transform active:scale-90 hover:scale-105"} 
    fill="none"
  >
    <path 
      d="M3 11.5L21.5 3L14.5 21.5L11.5 13.5L3 11.5Z" 
      fill="#F5B041" 
      stroke="#1F1A14" 
      strokeWidth="1.6" 
      strokeLinejoin="round" 
    />
    <path 
      d="M21.5 3L11.5 13.5" 
      stroke="#1F1A14" 
      strokeWidth="1.6" 
      strokeLinecap="round" 
    />
  </svg>
);


const renderTextWithLinks = (textChunk: string) => {
  // Regex to match markdown links [label](url) and bare URLs https?://...
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(textChunk)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(textChunk.substring(lastIndex, match.index));
    }
    if (match[1] && match[2]) {
      const label = match[1];
      const url = match[2];
      nodes.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1a73e8] underline font-medium hover:text-[#1557b0] break-all inline cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </a>
      );
    } else if (match[3]) {
      const url = match[3];
      nodes.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1a73e8] underline font-medium hover:text-[#1557b0] break-all inline cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      );
    }
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < textChunk.length) {
    nodes.push(textChunk.substring(lastIndex));
  }

  return nodes.length > 0 ? nodes : textChunk;
};

// Renders text with emojis ("favicons") scaled 175% bigger for enhanced clarity and expression, and clickable links
const renderContentWithLargeEmojis = (text: string) => {
  if (!text) return null;
  const isEmojiOnly = /^[\p{Extended_Pictographic}\s\p{Emoji_Component}\p{Punctuation}]+$/u.test(text.trim());
  if (isEmojiOnly) {
    return <span className="text-[24px] sm:text-[26px] leading-relaxed block tracking-wide">{text}</span>;
  }
  const parts = text.split(/([\p{Extended_Pictographic}]+)/u);
  return (
    <>
      {parts.map((part, index) => {
        if (/^[\p{Extended_Pictographic}]+$/u.test(part)) {
          return (
            <span key={index} className="text-[1.75em] inline-block align-middle mx-0.5 leading-none">
              {part}
            </span>
          );
        }
        return <React.Fragment key={index}>{renderTextWithLinks(part)}</React.Fragment>;
      })}
    </>
  );
};

// Formats body text to establish the USA Voyager writing style:
// When using a numbered list, the title directly preceding the list is rendered in demi-bold,
// and the numbers (e.g. "1.", "2.", "3.") are also rendered in demi-bold.
const renderBodyWithNumberedLists = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');

  // Identify line indices that serve as titles directly preceding a numbered list
  const listTitleIndices = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const isNumbered = /^\s*\d+[.)]\s+/.test(lines[i]);
    if (isNumbered) {
      // Find the non-empty line directly preceding the first item of this list
      let prevIdx = i - 1;
      while (prevIdx >= 0 && lines[prevIdx].trim() === '') {
        prevIdx--;
      }
      if (prevIdx >= 0 && !/^\s*\d+[.)]\s+/.test(lines[prevIdx]) && !/^\s*[-•*]\s+/.test(lines[prevIdx])) {
        listTitleIndices.add(prevIdx);
      }
    }
  }

  return (
    <>
      {lines.map((line, idx) => {
        const numMatch = line.match(/^(\s*)(\d+[.)])(\s+)(.*)$/);
        const isTitle = listTitleIndices.has(idx);

        let lineContent: React.ReactNode;
        if (numMatch) {
          lineContent = (
            <>
              {numMatch[1]}
              <span className="font-semibold text-[#1F1A14]">{numMatch[2]}</span>
              {numMatch[3]}
              {renderContentWithLargeEmojis(numMatch[4])}
            </>
          );
        } else if (isTitle) {
          lineContent = (
            <span className="font-semibold text-[#1F1A14]">
              {renderContentWithLargeEmojis(line)}
            </span>
          );
        } else {
          lineContent = renderContentWithLargeEmojis(line);
        }

        return (
          <React.Fragment key={idx}>
            {lineContent}
            {idx < lines.length - 1 && "\n"}
          </React.Fragment>
        );
      })}
    </>
  );
};

// Safe AST converter transforming validated HTML strings from the visual editor into clean React nodes without dangerouslySetInnerHTML
const parseSafeHtmlToReact = (html: string): React.ReactNode => {
  if (!html) return null;
  if (typeof window === 'undefined') return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const convertNode = (node: Node, key: string | number): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        const children = Array.from(node.childNodes).map((child, idx) =>
          convertNode(child, `${key}-${idx}`)
        );

        switch (tagName) {
          case 'p':
            return (
              <p key={key} className="mb-2 last:mb-0 leading-relaxed font-normal text-[#2A241C]">
                {children}
              </p>
            );
          case 'strong':
          case 'b':
            return (
              <strong key={key} className="font-semibold text-[#1F1A14]">
                {children}
              </strong>
            );
          case 'em':
          case 'i':
            return (
              <em key={key} className="italic">
                {children}
              </em>
            );
          case 'u':
            return (
              <u key={key} className="underline">
                {children}
              </u>
            );
          case 'a': {
            let href = el.getAttribute('href') || '';
            if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
              href = `https://${href}`;
            }
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a73e8] underline font-medium hover:text-[#1557b0] break-all inline cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </a>
            );
          }
          case 'ol':
            return (
              <ol key={key} className="list-decimal pl-5 my-2 space-y-1 font-normal text-[#2A241C]">
                {children}
              </ol>
            );
          case 'ul':
            return (
              <ul key={key} className="list-disc pl-5 my-2 space-y-1 font-normal text-[#2A241C]">
                {children}
              </ul>
            );
          case 'li':
            return (
              <li key={key} className="leading-relaxed">
                {children}
              </li>
            );
          case 'br':
            return <br key={key} />;
          default:
            return <React.Fragment key={key}>{children}</React.Fragment>;
        }
      }
      return null;
    };

    return Array.from(doc.body.childNodes).map((node, i) => convertNode(node, i));
  } catch (err) {
    return html;
  }
};

// Renders text with initial greetings and closing signatures styled in demi-bold (typical for Mensajería Voyager), scaled emojis, and clickable links
const renderContentWithGreetingAndEmojis = (text: string) => {
  if (!text) return null;

  // If text starts with or contains HTML tags from the visual rich-text composer
  if (/<(p|strong|b|em|i|u|a|ol|ul|li|br)[\s>]/i.test(text)) {
    return parseSafeHtmlToReact(text);
  }

  // Regex to match initial greeting / salutation typical of Mensajería Voyager:
  const greetingRegex = /^(\s*(?:¡?Estimad[oa]s?[^,\n]*|¡?Hola[^,\n]*|¡?Querid[oa]s?[^,\n]*|¡?Buenos días[^,\n]*|¡?Buenas tardes[^,\n]*|¡Excelente trabajo[^!,\n]*|Dear[^,\n]*|Hello[^,\n]*|Hi[^,\n]*|Profesor\s+García)[,!])/i;

  let greeting: string | null = null;
  let bodyAndSig = text;

  const match = text.match(greetingRegex);
  if (match) {
    greeting = match[1];
    bodyAndSig = text.substring(match[0].length);
  }

  // Regex to match closing signature section typical of Mensajería Voyager:
  const signatureRegex = /(?:\n\n)((?:(?:¡(?:Mucho éxito|Nos vemos|Sigue con|A seguir|Felicitaciones|Feliz|Aprovecha)[^\n]*\n\n)?(?:Atentamente|Un cordial saludo|Saludos cordiales|Cordialmente|Saludos|Que tengas [^\n]+,|Best regards|Sincerely|Warm regards|Regards|Cheers|Profesor García|Coordinación Académica|Equipo Docente|Dirección General|Dirección USA Voyager|USA Voyager Platform|USA Voyager Institute|Sofía|Carlos M\.|Elena)[\s\S]*))$/i;

  let mainBody = bodyAndSig;
  let signature: string | null = null;

  const sigMatch = bodyAndSig.match(signatureRegex);
  if (sigMatch && sigMatch.index != null) {
    mainBody = bodyAndSig.substring(0, sigMatch.index);
    signature = sigMatch[1];
  } else if (bodyAndSig.includes('\n\n')) {
    const lastDoubleNewline = bodyAndSig.lastIndexOf('\n\n');
    const potentialSig = bodyAndSig.substring(lastDoubleNewline + 2).trim();
    if (potentialSig && potentialSig.length <= 140 && potentialSig.split('\n').length <= 4) {
      mainBody = bodyAndSig.substring(0, lastDoubleNewline);
      signature = potentialSig;
    }
  }

  return (
    <>
      {greeting && (
        <span className="font-semibold text-[#1F1A14] tracking-tight">
          {renderContentWithLargeEmojis(greeting)}
        </span>
      )}
      {mainBody && renderBodyWithNumberedLists(mainBody)}
      {signature && (
        <>
          {"\n\n"}
          <span className="font-semibold text-[#1F1A14] tracking-tight">
            {renderContentWithLargeEmojis(signature)}
          </span>
        </>
      )}
    </>
  );
};

export const VoyagerMessagingModal: React.FC<VoyagerMessagingModalProps> = ({
  isOpen,
  selectedLang = 'ES',
  user,
  onUnreadCountChange,
  className,
  onAskVoyager,
}) => {
  const [activeTab, setActiveTab] = useState<ChannelId>('profe');
  const [selectedEmail, setSelectedEmail] = useState<ChannelMessage | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gmail-style reply states
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(true);
  const [attachedReplyFile, setAttachedReplyFile] = useState<{ name: string; size: string } | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyNotice, setReplyNotice] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const linkUrlInputRef = useRef<HTMLInputElement>(null);


  // Teacher Assignments (Synchronized with Catalog and Activity Calendar)
  const [teacherAssignments, setTeacherAssignments] = useState<UnifiedAssignment[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  const loadTeacherAssignments = useCallback(async () => {
    setIsAssignmentsLoading(true);
    try {
      const studentId = user?.studentId || (user as any)?.id || 'STU-001';
      const studentEmail = (user as any)?.email || 'theorangesnowman@gmail.com';
      const result = await fetchUnifiedStudentAssignments(studentId, studentEmail);
      setTeacherAssignments(result.assignments || []);
    } catch (e) {
      console.error('Failed to load teacher assignments in messaging:', e);
    } finally {
      setIsAssignmentsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTeacherAssignments();
    const handleUpdate = () => {
      loadTeacherAssignments();
    };
    window.addEventListener('voyager_assignments_updated', handleUpdate);
    return () => {
      window.removeEventListener('voyager_assignments_updated', handleUpdate);
    };
  }, [loadTeacherAssignments]);

  // Voyager Explainer Audio State
  const [isExplaining, setIsExplaining] = useState(false);

  // Helper to toggle Voyager voice explanation of the Messaging center using official Voyager voice
  const speakVoyagerExplanation = () => {
    // Cancel any browser speech synthesis completely so the robotic browser voice NEVER speaks
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {}
    }

    if (isExplaining) {
      setIsExplaining(false);
      return;
    }

    setIsExplaining(true);

    // Reset pulse animation after Voyager finishes explanation
    setTimeout(() => {
      setIsExplaining(false);
    }, 7000);

    if (typeof onAskVoyager === 'function') {
      const prompt = selectedLang === 'EN'
        ? `[AUTO_SYSTEM: MANDATORY VOYAGER VOICE INSTRUCTION]
As USA Voyager, speak directly to the student in your warm, encouraging voice.
Explain this Voyager Messaging and Communication center in 2-3 engaging, clear sentences:
Tell the student that here they can review official notices from their teachers, coordinate with their study group, and keep up with their English and Civics assignments.
MANDATORY: Speak aloud in your official Voyager voice only.`
        : `[AUTO_SYSTEM: INSTRUCCIÓN MANDATORIA DE VOZ DE VOYAGER]
Como USA Voyager, habla directamente al estudiante con tu voz oficial cálida y motivadora en español.
Explica esta sección de Mensajería Voyager en 2 o 3 oraciones claras y atractivas:
Dile al estudiante que aquí puede revisar los comunicados oficiales de sus profesores, interactuar y coordinar con su grupo de estudio, y consultar sus tareas de inglés y civismo.
MANDATORIO: Habla en voz alta con tu voz oficial de Voyager únicamente.`;
      onAskVoyager(prompt);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsExplaining(false);
    }
  }, [activeTab, selectedEmail]);

  // TipTap visual rich-text editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        strike: false,
        code: false,
        horizontalRule: false,
      }),
      TipTapUnderline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#1a73e8] underline font-medium hover:text-[#1557b0] cursor-pointer',
        },
      }),
    ],
    content: replyText,
    editorProps: {
      attributes: {
        class: 'tiptap-composer w-full bg-transparent border-0 outline-none font-sans text-[#1F1F1F] text-[17px] sm:text-[17.5px] font-normal leading-relaxed min-h-[90px] focus:outline-none',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': selectedLang === 'EN' ? 'Message reply composer' : 'Editor de respuesta de mensaje',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setReplyText(currentEditor.getHTML());
    },
  });

  const handleOpenLinkPopover = () => {
    if (showLinkPopover) {
      setShowLinkPopover(false);
      return;
    }
    if (editor) {
      const { from, to } = editor.state.selection;
      const selectedSub = from !== to ? editor.state.doc.textBetween(from, to, ' ') : '';
      const previousUrl = editor.getAttributes('link').href || '';
      setLinkText(selectedSub);
      setLinkUrl(previousUrl);
    } else {
      setLinkText('');
      setLinkUrl('');
    }
    setShowEmojiPicker(false);
    setShowLinkPopover(true);
    setTimeout(() => {
      linkUrlInputRef.current?.focus();
    }, 50);
  };

  const handleApplyLink = () => {
    let cleanUrl = linkUrl.trim();
    if (!cleanUrl) return;
    if (!/^https?:\/\//i.test(cleanUrl) && !/^mailto:/i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    if (editor) {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      const displayText = linkText.trim() || cleanUrl;

      if (!hasSelection && displayText) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: displayText,
            marks: [{ type: 'link', attrs: { href: cleanUrl } }],
          })
          .run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: cleanUrl }).run();
      }
    }

    setShowLinkPopover(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleRemoveLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkPopover(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;
      setAttachedReplyFile({ name: file.name, size: sizeStr });
    }
  };

  const insertEmoji = (emoji: string) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji).run();
    } else {
      setReplyText((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const [messages, setMessages] = useState<ChannelMessage[]>(() => {
    try {
      const saved = localStorage.getItem('voyager_messaging_clean_v6') || localStorage.getItem('voyager_messaging_clean_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: ChannelMessage) => {
            const initMatch = INITIAL_MESSAGES.find((im) => im.id === m.id);
            if (initMatch) {
              return {
                ...initMatch,
                ...m,
                replies: (m.replies && m.replies.length > 0) ? m.replies : initMatch.replies,
                body: (m.body && m.body.length >= 80) ? m.body : initMatch.body,
                subject: initMatch.subject || m.subject,
                fullDate: initMatch.fullDate || m.fullDate,
                senderEmail: initMatch.senderEmail || m.senderEmail,
              };
            }
            return m;
          });
        }
      }
    } catch (e) {}
    return INITIAL_MESSAGES;
  });

  const [inputMessage, setInputMessage] = useState('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [starredFilter, setStarredFilter] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const messageListContainerRef = useRef<HTMLDivElement>(null);
  const MESSAGES_PER_PAGE = 10;

  const handleToggleSelect = (id: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sync total unread count to parent
  useEffect(() => {
    const totalUnread = messages.filter((m) => m.isUnread).length;
    if (onUnreadCountChange) {
      onUnreadCountChange(totalUnread);
    }
  }, [messages, onUnreadCountChange]);

  // Persist messages
  const saveMessages = (newMessages: ChannelMessage[]) => {
    setMessages(newMessages);
    try {
      localStorage.setItem('voyager_messaging_clean_v6', JSON.stringify(newMessages));
    } catch (e) {}
  };

  // Google Tasks-Style Simplified State & Handlers (for Tasks tab)
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetails, setNewTaskDetails] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [tasksPage, setTasksPage] = useState(1);
  const TASKS_PER_PAGE = 4;

  // Spanish Task Translation & Display Normalizer
  const getTaskDisplayInfo = useCallback((assign: UnifiedAssignment) => {
    const t = (assign.title || '').toLowerCase();
    if (t.includes('star method') || t.includes('interview')) {
      return {
        title: 'Simulación de entrevista método STAR',
        description: 'Estructurar respuestas profesionales usando Situación, Tarea, Acción y Resultado.',
        instructions: assign.instructions || 'Practica respondiendo preguntas situacionales de entrevista usando el marco STAR con Voyager.'
      };
    }
    if (t.includes('civic') || t.includes('uscis') || t.includes('judicial') || t.includes('constitution')) {
      return {
        title: 'USCIS Civismo 128: Poder Judicial y Derechos',
        description: 'Preguntas oficiales de naturalización sobre derechos y controles judiciales.',
        instructions: assign.instructions || 'Repasa las preguntas oficiales de civismo y practica respuestas orales fluidas con Voyager.'
      };
    }
    if (t.includes('health') || t.includes('prescription') || t.includes('doctor') || t.includes('médic')) {
      return {
        title: 'Consulta médica y recetas de salud',
        description: 'Vocabulario para citas médicas, síntomas y medicamentos en farmacia.',
        instructions: assign.instructions || 'Simula una consulta médica en inglés describiendo síntomas y solicitando recetas.'
      };
    }
    if (t.includes('culture') || t.includes('cultura')) {
      return {
        title: 'Conversación sobre la cultura',
        description: 'Diálogo interactivo sobre costumbres y cultura cotidiana.',
        instructions: assign.instructions || 'Conversa en tiempo real con Voyager sobre aspectos culturales de Estados Unidos.'
      };
    }
    if (t.includes('pronunciation') || t.includes('pronunciación')) {
      return {
        title: 'Práctica de pronunciación',
        description: 'Refuerzo de fonemas clave y entonación en conversación fluida.',
        instructions: assign.instructions || 'Practica fonemas en inglés y recibe retroalimentación oral inmediata de Voyager.'
      };
    }
    if (t.includes('introduction') || t.includes('introducción')) {
      return {
        title: 'Introducción personal',
        description: 'Presentación clara y confiada para contextos cotidianos y de trabajo.',
        instructions: assign.instructions || 'Presenta tu perfil, intereses y metas personales en inglés con Voyager.'
      };
    }
    return {
      title: assign.title,
      description: assign.objective || assign.instructions || '',
      instructions: assign.instructions || assign.objective || ''
    };
  }, []);

  // Toggle completion of task (Green = completed, Yellow = pending)
  const handleToggleTaskStatus = useCallback(async (assign: UnifiedAssignment) => {
    const isDone = assign.status === 'COMPLETED';
    const nextStatus = isDone ? 'PENDING' : 'COMPLETED';
    const nextProgress = isDone ? 0 : 100;

    setTeacherAssignments((prev) =>
      prev.map((a) => (a.id === assign.id ? { ...a, status: nextStatus, progressPercentage: nextProgress } : a))
    );

    try {
      await updateUnifiedAssignmentStatus(assign, nextStatus, nextProgress);
    } catch (e) {
      console.error('Failed to update assignment status:', e);
    }
  }, []);

  const handleCreateTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear());
    const dateFormatted = `${d}/${m}/${y}`;
    const fullDateFormatted = `${dateFormatted}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newAssignment: UnifiedAssignment = {
      id: `task-personal-${Date.now()}`,
      lessonId: `task-personal-${Date.now()}`,
      studentId: user?.studentId || 'STU-001',
      teacherName: 'Personal',
      title: title,
      instructions: newTaskDetails.trim() || title,
      objective: newTaskDetails.trim() || title,
      category: 'General',
      level: 'B1',
      estimatedMinutes: 15,
      assignedDate: dateFormatted,
      dueDate: dateFormatted,
      status: 'PENDING',
      progressPercentage: 0,
      isDemo: true
    };

    const updatedAssignments = [newAssignment, ...teacherAssignments];
    setTeacherAssignments(updatedAssignments);

    try {
      const studentId = user?.studentId || 'STU-001';
      localStorage.setItem(`voyager_assignments_${studentId}`, JSON.stringify(updatedAssignments));
    } catch (err) {}

    const newTaskMessage: ChannelMessage = {
      id: newAssignment.id,
      sender: (user as any)?.name || 'Mis Tareas',
      senderEmail: (user as any)?.email || 'learner@usavoyager.com',
      date: dateFormatted,
      fullDate: fullDateFormatted,
      subject: title,
      preview: title,
      subtitle: newTaskDetails.trim() || undefined,
      body: newTaskDetails.trim() ? `${title}\n\n${newTaskDetails.trim()}` : title,
      isUnread: false,
      channel: 'anuncios',
    };

    saveMessages([newTaskMessage, ...messages]);
    setNewTaskTitle('');
    setNewTaskDetails('');
    setIsAddingTask(false);
    setTasksPage(1);
  };

  if (isOpen === false) return null;

  const currentMessages = messages.filter((m) => {
    const inTab = activeTab === 'voyager' ? (m.channel === 'voyager' || m.channel === 'anuncios') : m.channel === activeTab;
    return inTab && (!starredFilter || m.isStarred);
  });
  const likedMessagesCount = messages.filter((m) => {
    const inTab = activeTab === 'voyager' ? (m.channel === 'voyager' || m.channel === 'anuncios') : m.channel === activeTab;
    return inTab && m.isStarred;
  }).length;

  const totalPages = Math.max(1, Math.ceil(currentMessages.length / MESSAGES_PER_PAGE));
  const startIndex = (currentPage - 1) * MESSAGES_PER_PAGE;
  const paginatedMessages = currentMessages.slice(startIndex, startIndex + MESSAGES_PER_PAGE);

  // Clamp current page if messages list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Reset scroll position to top when changing page, tab, or filter
  useEffect(() => {
    if (messageListContainerRef.current) {
      messageListContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, activeTab, starredFilter]);

  // Tabs matching the design guide: Profesor García, Mi Grupo, Voyager
  const tabs: { id: ChannelId; label: string }[] = [
    { 
      id: 'profe', 
      label: 'Profesor García', 
    },
    { 
      id: 'grupo', 
      label: selectedLang === 'EN' ? 'My Group' : 'Mi Grupo', 
    },
    { 
      id: 'voyager', 
      label: 'Voyager', 
    },
  ];

  const handleMessageClick = (msg: ChannelMessage) => {
    if (msg.isUnread) {
      const updated = messages.map((m) =>
        m.id === msg.id ? { ...m, isUnread: false } : m
      );
      saveMessages(updated);
    }
  };

  const handleDeleteMessage = (id: string) => {
    const updated = messages.filter((m) => m.id !== id);
    saveMessages(updated);
  };

  const handleToggleStar = (id: string) => {
    const updated = messages.map((m) =>
      m.id === id ? { ...m, isStarred: !m.isStarred } : m
    );
    saveMessages(updated);
  };

  const handleToggleImportant = (id: string) => {
    const updated = messages.map((m) =>
      m.id === id ? { ...m, isImportant: !m.isImportant } : m
    );
    saveMessages(updated);
  };

  const handleDownloadAttachment = (e: React.MouseEvent, attachment: Attachment) => {
    e.stopPropagation();
    setDownloadNotice(
      selectedLang === 'EN' 
        ? `Opening: ${attachment.name}` 
        : `Abriendo: ${attachment.name}`
    );
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleSendEmailReply = (e?: React.FormEvent | React.MouseEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    const isEditorEmpty = !editor || editor.isEmpty;
    if ((isEditorEmpty && !attachedReplyFile) || !selectedEmail || isSendingReply) return;

    const studentName = user?.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : 'Federico Sandoval';
    const studentEmail = 'theorangesnowman@gmail.com';

    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    const dateFormatted = `${d}/${m}/${y}`;
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullDateFormatted = `${dateFormatted}, ${timeFormatted}`;
    
    let content = editor ? editor.getHTML() : replyText.trim();
    if (attachedReplyFile) {
      content = content 
        ? `${content}<p>📎 ${attachedReplyFile.name} (${attachedReplyFile.size})</p>` 
        : `<p>📎 ${attachedReplyFile.name} (${attachedReplyFile.size})</p>`;
    }

    const newReply: MessageReply = {
      id: `rep-${Date.now()}`,
      sender: studentName,
      senderEmail: studentEmail,
      date: dateFormatted,
      fullDate: fullDateFormatted,
      body: content,
      isStudent: true,
    };

    const updatedReplies = [...(selectedEmail.replies || []), newReply];
    const plainSnippet = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const updatedEmail: ChannelMessage = {
      ...selectedEmail,
      replies: updatedReplies,
      subtitle: `${selectedLang === 'EN' ? 'You replied' : 'Respondiste'}: "${plainSnippet.slice(0, 45)}..."`,
    };

    setSelectedEmail(updatedEmail);
    const updatedMessages = messages.map((m) =>
      m.id === selectedEmail.id ? updatedEmail : m
    );
    saveMessages(updatedMessages);
    if (editor) {
      editor.commands.setContent('');
    }
    setReplyText('');
    setAttachedReplyFile(null);
    setShowEmojiPicker(false);

    setReplyNotice(
      selectedLang === 'EN'
        ? `Reply sent to ${selectedEmail.sender}`
        : `Respuesta enviada a ${selectedEmail.sender}`
    );
    setTimeout(() => setReplyNotice(null), 3500);

    // If replying in 'profe' channel, simulate intelligent reply from Professor García
    if (selectedEmail.channel === 'profe') {
      setIsSendingReply(true);
      setTimeout(() => {
        setIsSendingReply(false);
        const professorReplies = selectedLang === 'EN'
          ? [
              `Hello ${user?.firstName || 'Federico'}, excellent question! I have taken note of your point and will address it thoroughly during our live conversation practice. Keep up the great dedication!`,
              `Thank you for your reply, ${user?.firstName || 'Federico'}. I reviewed your notes and your progress is right on target. See you in our next class!`,
              `Received, ${user?.firstName || 'Federico'}. Practice that short vowel pronunciation for another 5 minutes today and you will be completely ready for the simulated exam.`
            ]
          : [
              `¡Hola ${user?.firstName || 'Federico'}! Excelente consulta. He anotado tu mensaje y lo revisaremos en detalle en nuestra próxima sesión de conversación. ¡Continúa con esa gran dedicación!`,
              `Muchas gracias por responder, ${user?.firstName || 'Federico'}. He revisado tus notas y tu avance va justo en el cronograma esperado. ¡Nos vemos en clase!`,
              `Recibido, ${user?.firstName || 'Federico'}. Practica la pronunciación de las vocales cortas otros 5 minutos hoy y estarás listo para el simulacro de entrevista.`
            ];
        const randomReplyText = professorReplies[Math.floor(Math.random() * professorReplies.length)];

        const teacherReply: MessageReply = {
          id: `rep-teacher-${Date.now()}`,
          sender: 'Profesor García',
          senderEmail: 'profesor.garcia@usavoyager.edu',
          date: dateFormatted,
          fullDate: `${dateFormatted}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          body: randomReplyText,
          isStudent: false,
        };

        setMessages((prev) => {
          const next = prev.map((m) => {
            if (m.id === selectedEmail.id) {
              return {
                ...m,
                replies: [...(m.replies || []), teacherReply],
                subtitle: `Profesor García: "${randomReplyText.slice(0, 45)}..."`,
              };
            }
            return m;
          });
          try {
            localStorage.setItem('voyager_messaging_clean_v6', JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        setSelectedEmail((prev) => {
          if (prev && prev.id === selectedEmail.id) {
            return {
              ...prev,
              replies: [...(prev.replies || []), teacherReply],
              subtitle: `Profesor García: "${randomReplyText.slice(0, 45)}..."`,
            };
          }
          return prev;
        });

        setReplyNotice(
          selectedLang === 'EN'
            ? `New reply received from Profesor García`
            : `Nueva respuesta recibida del Profesor García`
        );
        setTimeout(() => setReplyNotice(null), 4000);
      }, 1600);
    }
  };

  const sendMessageText = (rawText: string) => {
    const text = rawText.trim();
    if (!text || activeTab === 'anuncios') return;

    const studentName = user?.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : 'Federico Sandoval';

    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    const dateFormatted = `${d}/${m}/${y}`;
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChannelMessage = {
      id: `${activeTab}-${Date.now()}`,
      sender: studentName,
      senderEmail: 'theorangesnowman@gmail.com',
      date: dateFormatted,
      fullDate: `${d}/${m}/${now.getFullYear()} — ${timeFormatted}`,
      preview: text,
      body: text,
      isUnread: false,
      channel: activeTab,
    };

    setMessages((prev) => {
      const updated = [newMsg, ...prev];
      try {
        localStorage.setItem('voyager_messaging_clean_v6', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setInputMessage('');

    // Simulate teacher automated response in 'profe' channel
    if (activeTab === 'profe') {
      setTimeout(() => {
        const teacherReply: ChannelMessage = {
          id: `lp-reply-${Date.now()}`,
          sender: 'Profesor García',
          senderEmail: 'profesor.garcia@usavoyager.edu',
          date: dateFormatted,
          fullDate: `${d}/${m}/${now.getFullYear()} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          preview: selectedLang === 'EN' ? 'Message received! Reviewing...' : '¡Recibido! Reviso tu mensaje...',
          body: selectedLang === 'EN'
            ? `Hello ${user?.firstName || 'Federico'}! I have received your message: "${text}". I will review this with you in our next session.`
            : `¡Hola ${user?.firstName || 'Federico'}! He recibido tu consulta: "${text}". Lo revisaremos en detalle en nuestra próxima sesión.`,
          isUnread: true,
          channel: 'profe',
        };
        setMessages((prev) => {
          const updated = [teacherReply, ...prev];
          try {
            localStorage.setItem('voyager_messaging_clean_v6', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }, 1500);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageText(inputMessage);
  };

  // Listen for messages dispatched from input box A on the passport
  useEffect(() => {
    const handleExternalMessage = (e: any) => {
      if (e.detail?.text) {
        sendMessageText(e.detail.text);
      }
    };
    window.addEventListener('voyager-send-message', handleExternalMessage);
    return () => window.removeEventListener('voyager-send-message', handleExternalMessage);
  }, [activeTab, selectedLang, user]);

  return (
    <div className={`w-full flex flex-col font-sans select-none ${className || ''}`}>

      {/* Download toast notification */}
      {downloadNotice && (
        <div className="mb-2 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-md animate-fade-in">
          <span>{downloadNotice}</span>
          <button type="button" onClick={() => setDownloadNotice(null)}>
            <X className="w-3.5 h-3.5 text-white/80 hover:text-white" />
          </button>
        </div>
      )}


      {/* Reply sent notification */}
      {replyNotice && (
        <div className="mb-2 px-4 py-2 bg-[#0B57D0] text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{replyNotice}</span>
          </div>
          <button type="button" onClick={() => setReplyNotice(null)} className="cursor-pointer">
            <X className="w-3.5 h-3.5 text-white/80 hover:text-white" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full flex flex-col space-y-1">

        {/* Header Bar — Clean Title & Brief Description */}
        <div className="w-full flex flex-col items-start text-left">
          <button
            type="button"
            onClick={speakVoyagerExplanation}
            title={
              selectedLang === 'EN'
                ? 'Click to hear Voyager explain this section'
                : 'Haz clic para escuchar la explicación de Voyager'
            }
            aria-label={
              selectedLang === 'EN'
                ? 'Click to hear Voyager explain this section'
                : 'Haz clic para escuchar la explicación de Voyager'
            }
            className={`text-sm sm:text-[15.5px] font-bold tracking-wider uppercase font-sans shrink-0 text-left cursor-pointer transition-colors hover:text-[#0D224A] hover:underline underline-offset-4 decoration-[#1F1A14]/40 focus:outline-hidden ${
              isExplaining ? 'text-[#0D224A] underline' : 'text-neutral-900'
            }`}
          >
            {selectedLang === 'EN' ? 'Messaging' : 'Mensajería'}
          </button>
          <p className="mt-1 text-[10pt] font-normal not-italic text-neutral-700 font-sans leading-relaxed text-left">
            {selectedLang === 'EN'
              ? 'Read messages, feedback, and study materials from your teacher, your group, and Voyager, or send a direct reply.'
              : 'Revisa mensajes, comentarios y materiales de tu profesor, tu grupo y Voyager, o envía una respuesta directa.'}
          </p>
        </div>

        {/* Top Tab Bar - Standardized to match ActivityCalendar tabs: text-only, flush-left, non-stretched */}
        <div className="w-full flex items-end relative pt-[calc(1.5em+0.5rem)] px-[14px] sm:px-[15px] z-10 overflow-visible">
          <div className="flex items-end gap-2 sm:gap-2.5 relative">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const unreadCount = messages.filter((m) => {
                const inTab = tab.id === 'voyager' ? (m.channel === 'voyager' || m.channel === 'anuncios') : m.channel === tab.id;
                return inTab && m.isUnread;
              }).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedEmail(null);
                    setSelectedMessageIds([]);
                    setStarredFilter(false);
                    setCurrentPage(1);
                  }}
                  className={`group relative h-[52px] sm:h-[58px] px-4 sm:px-6 md:px-7 min-w-[100px] sm:min-w-[130px] flex items-center justify-center p-0 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#F8ECC0] text-[#F8ECC0] z-30 rounded-t-[14px] sm:rounded-t-[18px] -mb-[2px] after:content-[\'\'] after:absolute after:-bottom-[3px] after:left-0 after:right-0 after:h-[5px] after:bg-[#F8ECC0] after:z-30'
                      : 'bg-[#EADBB3] hover:bg-[#E0CF9E] text-[#EADBB3] hover:text-[#E0CF9E] rounded-t-[14px] sm:rounded-t-[18px] z-10'
                  }`}
                >
                  {/* Left Concave Flare / Inverted Fillet (Vintage filing index-card tab) */}
                  {idx > 0 && (
                    <svg
                      className="absolute -left-[14px] sm:-left-[15px] bottom-0 w-[14px] sm:w-[15px] h-[14px] sm:h-[15px] pointer-events-none overflow-visible transition-colors"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M 16 0 L 16 16.5 L 0 16.5 Q 16 16.5 16 0 Z" />
                    </svg>
                  )}

                  {/* Right Concave Flare / Inverted Fillet */}
                  <svg
                    className="absolute -right-[14px] sm:-right-[15px] bottom-0 w-[14px] sm:w-[15px] h-[14px] sm:h-[15px] pointer-events-none overflow-visible transition-colors"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M 0 0 L 0 16.5 L 16 16.5 Q 0 16.5 0 0 Z" />
                  </svg>

                  {/* Unread badge positioned in top-right corner without displacing text */}
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 sm:top-2 sm:right-2.5 min-w-3.5 h-3.5 sm:min-w-4 sm:h-4 px-1 rounded-full bg-[#D32F2F] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center leading-none shadow-xs border border-white/60 pointer-events-none">
                      {unreadCount}
                    </span>
                  )}

                  {/* Tab Label: Centered horizontally and vertically, matching Calendar tab typography */}
                  <div className="inline-flex items-center justify-center max-w-full px-0.5 leading-tight">
                    <span className={`text-[15px] sm:text-[16.5px] font-bold leading-none text-center truncate ${
                      isActive ? 'text-[#1F1A14]' : 'text-[#221D17] group-hover:text-black'
                    }`}>
                      {tab.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Folder Content Card Body - Pure, solid, warm yellow-beige (#F8ECC0) with smooth corner radius matching Calendar */}
        <div className="bg-[#F8ECC0] rounded-b-[24px] sm:rounded-b-[28px] rounded-t-[14px] sm:rounded-t-[18px] p-4 sm:p-6 md:p-8 flex flex-col w-full relative z-0 min-h-[420px] shadow-xs">
          
          {/* Card Top Action & Navigation Bar (Inside index-card container per requirement #2) */}
          <div className="w-full flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {selectedEmail ? (
                <>
                  {/* Back to messages button */}
                  <button
                    type="button"
                    onClick={() => setSelectedEmail(null)}
                    title={selectedLang === 'EN' ? 'Back to messages' : 'Volver a mensajes'}
                    aria-label={selectedLang === 'EN' ? 'Back to messages' : 'Volver a mensajes'}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-[#0D224A] hover:bg-black/5 transition-colors cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>

                  {/* Reply button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplying(true);
                      setTimeout(() => editor?.commands.focus(), 100);
                    }}
                    title={selectedLang === 'EN' ? 'Reply' : 'Responder'}
                    aria-label={selectedLang === 'EN' ? 'Reply' : 'Responder'}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-[#0D224A] hover:bg-black/5 transition-colors cursor-pointer active:scale-95"
                  >
                    <Reply className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>

                  {/* Heart / Favorite */}
                  <button
                    type="button"
                    onClick={() => handleToggleStar(selectedEmail.id)}
                    title={selectedEmail.isStarred ? (selectedLang === 'EN' ? 'Favorited' : 'Favorito') : (selectedLang === 'EN' ? 'Favorite message' : 'Marcar favorito')}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-rose-500 hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <Heart className={`w-4.5 h-4.5 ${selectedEmail.isStarred ? 'fill-rose-500 text-rose-500 stroke-[1.8]' : 'stroke-[1.8]'}`} />
                  </button>

                  {/* Priority / Important */}
                  <button
                    type="button"
                    onClick={() => handleToggleImportant(selectedEmail.id)}
                    title={selectedEmail.isImportant ? (selectedLang === 'EN' ? 'Important' : 'Importante') : (selectedLang === 'EN' ? 'Mark important' : 'Marcar importante')}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-amber-600 hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <ChevronsRight className={`w-4.5 h-4.5 ${selectedEmail.isImportant ? 'text-amber-600 stroke-[2.4]' : 'stroke-[2]'}`} />
                  </button>

                  {/* Delete Email */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteMessage(selectedEmail.id);
                      setSelectedEmail(null);
                    }}
                    title={selectedLang === 'EN' ? 'Delete email' : 'Eliminar correo'}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-[#D32F2F] hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5 stroke-[1.8]" />
                  </button>
                </>
              ) : (
                <>
                  {/* Heart Filter with Liked Messages Count Badge */}
                  <button
                    type="button"
                    onClick={() => {
                      setStarredFilter(!starredFilter);
                      setCurrentPage(1);
                    }}
                    title={
                      starredFilter
                        ? (selectedLang === 'EN' ? 'Show all' : 'Ver todos')
                        : (selectedLang === 'EN' 
                            ? (likedMessagesCount > 0 ? `Favorites (${likedMessagesCount})` : 'Favorites') 
                            : (likedMessagesCount > 0 ? `Favoritos (${likedMessagesCount})` : 'Favoritos'))
                    }
                    className="p-1.5 rounded-lg text-[#1F1A14] hover:text-rose-500 hover:bg-black/5 transition-colors cursor-pointer relative"
                  >
                    <Heart className={`w-4.5 h-4.5 ${starredFilter ? 'fill-rose-500 text-rose-500 stroke-[2.4]' : 'stroke-[2.4]'}`} />
                    {likedMessagesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#D32F2F] text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs border border-white/40 pointer-events-none">
                        {likedMessagesCount}
                      </span>
                    )}
                  </button>

                  {/* Priority / ChevronsRight >> */}
                  <button
                    type="button"
                    onClick={() => {
                      if (currentMessages.length > 0) {
                        setSelectedEmail(currentMessages[0]);
                      }
                    }}
                    title={selectedLang === 'EN' ? 'Open latest email' : 'Abrir correo'}
                    className="p-1.5 rounded-lg text-[#1F1A14] hover:text-amber-600 hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <ChevronsRight className="w-4.5 h-4.5 text-[#1F1A14] hover:text-amber-600 stroke-[2.8]" />
                  </button>

                  {/* Delete Email / Selected Messages */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMessageIds.length > 0) {
                        const updated = messages.filter((m) => !selectedMessageIds.includes(m.id));
                        saveMessages(updated);
                        setSelectedMessageIds([]);
                      } else {
                        const updated = messages.filter((m) => m.channel !== activeTab);
                        saveMessages(updated);
                      }
                    }}
                    title={
                      selectedMessageIds.length > 0
                        ? (selectedLang === 'EN' ? `Delete ${selectedMessageIds.length} selected` : `Eliminar ${selectedMessageIds.length} seleccionados`)
                        : (selectedLang === 'EN' ? 'Clear channel messages' : 'Eliminar mensajes del canal')
                    }
                    className="p-1.5 rounded-lg text-[#1F1A14] hover:text-[#D32F2F] hover:bg-black/5 transition-colors cursor-pointer relative"
                  >
                    <Trash2 className="w-4.5 h-4.5 stroke-[2.4]" />
                    {selectedMessageIds.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#D32F2F] text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs border border-white/40 pointer-events-none">
                        {selectedMessageIds.length}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Subtle horizontal divider separating action navigation from message content */}
          <div className="w-full border-b border-black/15 mb-3.5" />
          
          {selectedEmail ? (
            /* ===============================================================
               FULL EMAIL READER VIEW (Opened by clicking >> or message)
               =============================================================== */
            <div className="w-full flex flex-col animate-fade-in text-left">
              {/* Subject Headline - Reduced 75%, demibold */}
              <div className="mb-3">
                <h4 className="text-[17.5px] sm:text-[19px] font-semibold text-[#1F1A14] leading-snug">
                  {selectedEmail.subject || selectedEmail.preview}
                </h4>
              </div>

              {/* Sender & Recipient Details - No pill, no background, no stroke */}
              <div className="flex items-start justify-between gap-3 bg-transparent border-0 p-0 mb-4 shadow-none">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedEmail.channel === 'profe'
                      ? 'bg-amber-400 text-[#1F1A14]'
                      : selectedEmail.channel === 'grupo'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-neutral-800 text-white'
                  }`}>
                    {selectedEmail.channel === 'grupo' ? (
                      <Users className="w-3 h-3 stroke-[2] text-white" />
                    ) : selectedEmail.channel === 'anuncios' ? (
                      <Check className="w-3 h-3 stroke-[2.2] text-white" />
                    ) : (
                      <TeacherIcon className="w-3 h-3 stroke-[2.2] text-[#1F1A14]" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[15px] sm:text-[16.5px] text-[#1F1A14]">
                        {selectedEmail.sender}
                      </span>
                      <span className="text-[13.75px] text-[#7A7062] font-mono">
                        &lt;{selectedEmail.senderEmail || `${selectedEmail.sender.toLowerCase().replace(/[^a-z0-9]/g, '')}@usavoyager.edu`}&gt;
                      </span>
                    </div>
                    <span className="text-[13.75px] sm:text-[15px] text-[#554C3E] mt-0.5">
                      {selectedLang === 'EN' ? 'To: ' : 'Para: '}
                      <strong className="text-[#1F1A14]">{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Federico Sandoval'}</strong> &lt;theorangesnowman@gmail.com&gt;
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10pt] font-light font-[system-ui,sans-serif] text-[#7A7062] block">
                    {formatSimpleDate(selectedEmail.fullDate, selectedEmail.date)}
                  </span>
                </div>
              </div>

              {/* Full Email Formatted Body - Pill, background, and border eliminated */}
              <div className="py-2 text-[15px] sm:text-[17px] text-[#2A241C] leading-relaxed whitespace-pre-line mb-5 font-normal">
                {renderContentWithGreetingAndEmojis(selectedEmail.body)}
              </div>

              {/* Attached Files Section if present - No pill, no background, no border */}
              {selectedEmail.attachment && (
                <div className="mb-4">
                  <div 
                    onClick={(e) => handleDownloadAttachment(e, selectedEmail.attachment!)}
                    className="inline-flex items-center gap-2.5 p-0 bg-transparent border-0 shadow-none cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="bg-neutral-700 text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-[3px] tracking-wider flex items-center justify-center font-mono shrink-0 leading-none h-[16px]">
                      {selectedEmail.attachment.type.toUpperCase()}
                    </div>
                    <span className="font-semibold text-[15.5px] sm:text-[16.5px] text-[#1F1A14]">
                      {selectedEmail.attachment.name}
                    </span>
                    <span className="text-[13.75px] text-[#7A7062]">
                      {selectedEmail.attachment.size}
                    </span>
                    <Download className="w-4 h-4 text-neutral-700 hover:text-black transition-colors ml-0.5" />
                  </div>
                </div>
              )}

              {/* Thread Replies Section with dotted divider lines after each response */}
              {selectedEmail.replies && selectedEmail.replies.length > 0 && (
                <div className="mb-4">
                  {/* Dotted divider line before responses */}
                  <div className="w-full border-t border-dotted border-black my-3.5" />

                  {selectedEmail.replies.map((reply) => {
                    const isUserStudent = reply.isStudent;
                    return (
                      <React.Fragment key={reply.id}>
                        <div
                          className={`py-2 text-left transition-all animate-fade-in ${
                            isUserStudent
                              ? 'ml-3 sm:ml-6'
                              : 'mr-3 sm:mr-6'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              {isUserStudent ? (
                                <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center shrink-0">
                                  <User className="w-3 h-3 text-white stroke-[2.2]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                                  <TeacherIcon className="w-3 h-3 text-[#1F1A14] stroke-[2.2]" />
                                </div>
                              )}
                              <span className="text-[15px] sm:text-[16.5px] font-bold text-[#1F1A14]">
                                {reply.sender}
                              </span>
                            </div>
                            <span className="text-[10pt] text-[#7A7062] font-light font-[system-ui,sans-serif] shrink-0">
                              {formatSimpleDate(reply.fullDate, reply.date)}
                            </span>
                          </div>
                          <div className="text-[15px] sm:text-[16.5px] text-[#2A241C] leading-relaxed whitespace-pre-line font-normal">
                            {renderContentWithGreetingAndEmojis(reply.body)}
                          </div>
                        </div>

                        {/* Dotted divider line after each response */}
                        <div className="w-full border-t border-dotted border-black my-3.5" />
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {/* Gmail-Style Reply Interface - Outer border eliminated */}
              {isReplying ? (
                <div className="w-full bg-white rounded-2xl shadow-xs text-left my-4 overflow-hidden transition-all animate-fade-in">
                  {/* Main Writing Canvas */}
                  <div 
                    className="px-4 pt-3.5 pb-2 min-h-[110px] cursor-text"
                    onClick={() => editor?.commands.focus()}
                  >
                    <style>{`
                      .tiptap-composer {
                        outline: none !important;
                        font-family: inherit;
                        font-size: 13.5px;
                        font-weight: 400;
                        line-height: 1.625;
                        color: #1F1F1F;
                        min-height: 90px;
                      }
                      @media (min-width: 640px) {
                        .tiptap-composer {
                          font-size: 14px;
                        }
                      }
                      .tiptap-composer p {
                        margin: 0 0 0.5rem 0;
                      }
                      .tiptap-composer p:last-child {
                        margin-bottom: 0;
                      }
                      .tiptap-composer strong, .tiptap-composer b {
                        font-weight: 600;
                        color: #1F1A14;
                      }
                      .tiptap-composer em, .tiptap-composer i {
                        font-style: italic;
                      }
                      .tiptap-composer u {
                        text-decoration: underline;
                      }
                      .tiptap-composer a {
                        color: #1a73e8;
                        text-decoration: underline;
                        cursor: pointer;
                        font-weight: 500;
                      }
                      .tiptap-composer a:hover {
                        color: #1557b0;
                      }
                      .tiptap-composer ol {
                        list-style-type: decimal;
                        padding-left: 1.5rem;
                        margin: 0.5rem 0;
                      }
                      .tiptap-composer ul {
                        list-style-type: disc;
                        padding-left: 1.5rem;
                        margin: 0.5rem 0;
                      }
                      .tiptap-composer li {
                        margin: 0.2rem 0;
                        line-height: 1.6;
                      }
                    `}</style>
                    <EditorContent editor={editor} />

                    {/* Attached file chip if present */}
                    {attachedReplyFile && (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F2F4F7] border border-[#D0D5DD] text-xs text-[#1F1F1F] mb-1 font-mono">
                        <Paperclip className="w-3.5 h-3.5 text-[#475467]" />
                        <span className="font-semibold">{attachedReplyFile.name}</span>
                        <span className="text-[#475467] text-[10px]">({attachedReplyFile.size})</span>
                        <button
                          type="button"
                          onClick={() => setAttachedReplyFile(null)}
                          className="hover:text-red-600 ml-1 text-[#98A2B3] cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dotted division line separating writing canvas and toolbar */}
                  <div className="w-full border-t border-dotted border-black" />

                  {/* Formatting & Actions Toolbar (Pill wrapper eliminated, flat clean layout, icons 133% bigger) */}
                  <div className="w-full px-3.5 py-2 flex items-center gap-1 sm:gap-1.5 text-xs text-[#444746] select-none">
                    <button 
                      type="button" 
                      onClick={() => editor?.chain().focus().toggleBold().run()} 
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        editor?.isActive('bold')
                          ? 'bg-[#D3E3FD] text-[#041E49]'
                          : 'hover:bg-[#E2E5E9] text-[#444746]'
                      }`} 
                      title="Bold"
                    >
                      <Bold className="w-[18.6px] h-[18.6px] stroke-[2.2]" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => editor?.chain().focus().toggleItalic().run()} 
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        editor?.isActive('italic')
                          ? 'bg-[#D3E3FD] text-[#041E49]'
                          : 'hover:bg-[#E2E5E9] text-[#444746]'
                      }`} 
                      title="Italic"
                    >
                      <Italic className="w-[18.6px] h-[18.6px] stroke-[2.2]" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => editor?.chain().focus().toggleUnderline().run()} 
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        editor?.isActive('underline')
                          ? 'bg-[#D3E3FD] text-[#041E49]'
                          : 'hover:bg-[#E2E5E9] text-[#444746]'
                      }`} 
                      title="Underline"
                    >
                      <Underline className="w-[18.6px] h-[18.6px] stroke-[2.2]" />
                    </button>
                    <div className="w-[1px] h-[18.6px] bg-[#C7C7C7] my-auto mx-1" />
                    <button 
                      type="button" 
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        editor?.isActive('orderedList')
                          ? 'bg-[#D3E3FD] text-[#041E49]'
                          : 'hover:bg-[#E2E5E9] text-[#444746]'
                      }`} 
                      title="Numbered list"
                    >
                      <ListOrdered className="w-[18.6px] h-[18.6px]" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => editor?.chain().focus().toggleBulletList().run()} 
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        editor?.isActive('bulletList')
                          ? 'bg-[#D3E3FD] text-[#041E49]'
                          : 'hover:bg-[#E2E5E9] text-[#444746]'
                      }`} 
                      title="Bulleted list"
                    >
                      <List className="w-[18.6px] h-[18.6px]" />
                    </button>

                    <div className="w-[1px] h-[18.6px] bg-[#C7C7C7] my-auto mx-1" />

                    {/* Paperclip / Attach Files */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title={selectedLang === 'EN' ? 'Attach files' : 'Adjuntar archivos'}
                      className="p-1.5 hover:bg-[#E2E5E9] rounded transition-colors cursor-pointer text-[#444746] hover:text-[#1F1F1F]"
                    >
                      <Paperclip className="w-[18.6px] h-[18.6px] stroke-[2]" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAttachFile} 
                      className="hidden" 
                    />

                    {/* Link icon */}
                    <button
                      type="button"
                      onClick={handleOpenLinkPopover}
                      title={selectedLang === 'EN' ? 'Insert link' : 'Insertar enlace'}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        showLinkPopover || editor?.isActive('link')
                          ? 'bg-[#D3E3FD] text-[#041E49]'
                          : 'text-[#444746] hover:text-[#1F1F1F] hover:bg-[#E2E5E9]'
                      }`}
                    >
                      <LinkIcon className="w-[18.6px] h-[18.6px] stroke-[2]" />
                    </button>

                    {/* Smile / Emoji Picker */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowLinkPopover(false);
                      }}
                      title={selectedLang === 'EN' ? 'Insert emoji' : 'Insertar emoji'}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        showEmojiPicker
                          ? 'bg-[#D3E3FD] text-[#041E49]'
                          : 'text-[#444746] hover:text-[#1F1F1F] hover:bg-[#E2E5E9]'
                      }`}
                    >
                      <Smile className="w-[18.6px] h-[18.6px] stroke-[2]" />
                    </button>

                    {/* Image icon */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title={selectedLang === 'EN' ? 'Insert photo' : 'Insertar foto'}
                      className="p-1.5 hover:bg-[#E2E5E9] rounded transition-colors cursor-pointer text-[#444746] hover:text-[#1F1F1F]"
                    >
                      <ImageIcon className="w-[18.6px] h-[18.6px] stroke-[2]" />
                    </button>

                    {/* Flute divider (filete separador) */}
                    <div className="w-[1px] h-[18.6px] bg-[#C7C7C7] my-auto mx-1" />

                    {/* Discard Draft (Trash icon) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (editor) {
                          editor.commands.setContent('');
                        }
                        setReplyText('');
                        setAttachedReplyFile(null);
                        setShowEmojiPicker(false);
                        setShowLinkPopover(false);
                        setIsReplying(false);
                      }}
                      title={selectedLang === 'EN' ? 'Discard draft' : 'Descartar borrador'}
                      className="p-1.5 hover:bg-[#E2E5E9] rounded transition-colors cursor-pointer text-[#444746] hover:text-red-600"
                    >
                      <Trash2 className="w-[18.6px] h-[18.6px] stroke-[1.8]" />
                    </button>

                    {/* Large Paper Plane Send Option with black lines & yellow trapped inside */}
                    <button
                      type="button"
                      onClick={() => handleSendEmailReply()}
                      disabled={isSendingReply || (!attachedReplyFile && (!editor || editor.isEmpty))}
                      title={selectedLang === 'EN' ? 'Send' : 'Enviar'}
                      className="ml-auto p-1 rounded-lg hover:bg-[#E2E5E9] active:scale-95 disabled:opacity-35 disabled:hover:bg-transparent transition-all cursor-pointer flex items-center justify-center"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 transition-transform hover:scale-105"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Trapped inside space filled with yellow, crisp black lines */}
                        <path
                          d="M22 2L15 22L11 13L2 9L22 2Z"
                          fill="#FACC15"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        {/* Center fold line in black */}
                        <path
                          d="M22 2L11 13"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Inline Link Inserter popover */}
                  {showLinkPopover && (
                    <div className="mx-3.5 mb-2.5 p-3 bg-[#F8F9FA] rounded-xl border border-neutral-200 shadow-sm animate-fade-in text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                          <LinkIcon className="w-3.5 h-3.5 text-[#1a73e8]" />
                          {selectedLang === 'EN' ? 'Insert link' : 'Insertar enlace'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowLinkPopover(false)}
                          className="text-neutral-400 hover:text-neutral-600 p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder={selectedLang === 'EN' ? 'Text to display (optional)' : 'Texto a mostrar (opcional)'}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#D0D5DD] rounded-lg text-xs outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                        />
                        <input
                          ref={linkUrlInputRef}
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyLink();
                            }
                          }}
                          placeholder="https://example.com"
                          className="flex-1 px-3 py-1.5 bg-white border border-[#D0D5DD] rounded-lg text-xs outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                        />
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          {editor?.isActive('link') && (
                            <button
                              type="button"
                              onClick={handleRemoveLink}
                              className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              {selectedLang === 'EN' ? 'Remove' : 'Quitar'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowLinkPopover(false)}
                            className="px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-200 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyLink}
                            disabled={!linkUrl.trim()}
                            className="px-3.5 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium rounded-lg text-xs disabled:opacity-40 cursor-pointer transition-colors shadow-xs"
                          >
                            {selectedLang === 'EN' ? 'Apply' : 'Aplicar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Emoji Picker section moved below the toolbar as shown */}
                  {showEmojiPicker && (
                    <div className="mx-3.5 mb-2.5 p-2 bg-[#F8F9FA] rounded-xl border border-neutral-200 shadow-sm flex items-center gap-2 animate-fade-in flex-wrap">
                      {['👍', '😊', '🙏', '📚', '✍️', '🎯', '⭐', '🤝', '💯', '🚀'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="text-[28px] p-1.5 hover:scale-125 transition-transform cursor-pointer leading-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Collapsed Gmail-style Reply Action Button */
                <div className="my-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplying(true);
                      setTimeout(() => editor?.commands.focus(), 100);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-[13.5px] font-medium shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Reply className="w-4 h-4 text-neutral-600 stroke-[2.2]" />
                    <span>{selectedLang === 'EN' ? 'Reply' : 'Responder'}</span>
                  </button>
                </div>
              )}

              {/* Bottom Navigation: Directional navigation arrows replacing "Volver" */}
              {(() => {
                const currentMsgIndex = selectedEmail ? currentMessages.findIndex((m) => m.id === selectedEmail.id) : -1;
                const hasNextMsg = currentMsgIndex !== -1 && currentMsgIndex < currentMessages.length - 1;
                const hasPrevMsg = currentMsgIndex > 0;

                const handleNavigateNext = () => {
                  if (hasNextMsg) {
                    const nextMsg = currentMessages[currentMsgIndex + 1];
                    handleMessageClick(nextMsg);
                    setSelectedEmail(nextMsg);
                    setReplyText('');
                    setAttachedReplyFile(null);
                    setShowEmojiPicker(false);
                    setShowLinkPopover(false);
                  }
                };

                const handleNavigatePrev = () => {
                  if (hasPrevMsg) {
                    const prevMsg = currentMessages[currentMsgIndex - 1];
                    handleMessageClick(prevMsg);
                    setSelectedEmail(prevMsg);
                    setReplyText('');
                    setAttachedReplyFile(null);
                    setShowEmojiPicker(false);
                    setShowLinkPopover(false);
                  } else {
                    setSelectedEmail(null);
                  }
                };

                return (
                  <div className="flex items-center gap-1 pt-2">
                    <button
                      type="button"
                      onClick={handleNavigatePrev}
                      title={hasPrevMsg ? (selectedLang === 'EN' ? 'Previous notification' : 'Notificación anterior') : (selectedLang === 'EN' ? 'Back to messages' : 'Volver a mensajes')}
                      aria-label={hasPrevMsg ? (selectedLang === 'EN' ? 'Previous notification' : 'Notificación anterior') : (selectedLang === 'EN' ? 'Back to messages' : 'Volver a mensajes')}
                      className="group p-1.5 rounded-lg text-[#1F1A14] hover:text-black hover:bg-gray-300/70 transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center justify-center"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[3] transition-transform duration-200 ease-out group-hover:-translate-x-1 group-hover:scale-110" />
                    </button>

                    {/* Flute divider (filete separador) - 1pt black */}
                    <div className="w-[1px] h-[18px] bg-black my-auto mx-0.5" />

                    {hasNextMsg ? (
                      <button
                        type="button"
                        onClick={handleNavigateNext}
                        title={selectedLang === 'EN' ? 'Next notification' : 'Siguiente notificación'}
                        aria-label={selectedLang === 'EN' ? 'Next notification' : 'Siguiente notificación'}
                        className="group p-1.5 rounded-lg text-[#1F1A14] hover:text-black hover:bg-gray-300/70 transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center justify-center"
                      >
                        <ArrowRight className="w-5 h-5 stroke-[3] transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:scale-110" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title={selectedLang === 'EN' ? 'No next notification' : 'No hay siguiente notificación'}
                        aria-label={selectedLang === 'EN' ? 'No next notification' : 'No hay siguiente notificación'}
                        className="p-1.5 rounded-lg text-[#1F1A14] opacity-25 cursor-not-allowed inline-flex items-center justify-center"
                      >
                        <ArrowRight className="w-5 h-5 stroke-[3]" />
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : false ? (
            /* ===============================================================
               GOOGLE TASKS-INSPIRED TASKS LIST (Spanish only)
               =============================================================== */
            <div className="flex flex-col w-full flex-1 text-left animate-fade-in select-none">
              {/* 1. Add Task Button / Compact Inline Form */}
              <div className="flex flex-col w-full mb-2 shrink-0">
                {!isAddingTask ? (
                  <div className="flex items-center justify-start pb-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(true)}
                      title="Agregar tarea"
                      aria-label="Agregar tarea"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#1F1A14] flex items-center justify-center hover:bg-black/10 text-[#1F1A14] transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4 stroke-[2.6]" />
                    </button>
                  </div>
                ) : (
                  <div className="mb-2.5 p-3 sm:p-3.5 bg-white/95 backdrop-blur-xs rounded-xl border border-black/15 shadow-xs animate-fade-in flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-[#1F1A14] font-mono">
                        Nueva Tarea
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingTask(false);
                          setNewTaskTitle('');
                          setNewTaskDetails('');
                        }}
                        className="p-1 rounded text-[#554C3E] hover:text-black hover:bg-black/5 cursor-pointer"
                        title="Cancelar"
                        aria-label="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      autoFocus
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateTask();
                        } else if (e.key === 'Escape') {
                          setIsAddingTask(false);
                        }
                      }}
                      placeholder="Título de la tarea (ej. Práctica de pronunciación)..."
                      className="w-full px-3 py-1.5 bg-white border border-[#D0D5DD] rounded-lg text-xs sm:text-sm text-[#1F1A14] placeholder:text-[#7A7062] focus:outline-none focus:border-[#1F1A14] font-semibold"
                    />
                    <input
                      type="text"
                      value={newTaskDetails}
                      onChange={(e) => setNewTaskDetails(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateTask();
                        } else if (e.key === 'Escape') {
                          setIsAddingTask(false);
                        }
                      }}
                      placeholder="Descripción (opcional)..."
                      className="w-full px-3 py-1 bg-white border border-[#D0D5DD] rounded-lg text-xs sm:text-sm text-[#1F1A14] placeholder:text-[#7A7062] focus:outline-none focus:border-[#1F1A14]"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingTask(false);
                          setNewTaskTitle('');
                          setNewTaskDetails('');
                        }}
                        className="px-2.5 py-1 rounded text-xs font-semibold text-[#554C3E] hover:bg-black/5 cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateTask}
                        disabled={!newTaskTitle.trim()}
                        className="px-3.5 py-1 rounded-lg text-xs font-bold bg-[#1F1A14] text-white hover:bg-black disabled:opacity-40 cursor-pointer shadow-xs transition-all"
                      >
                        Guardar Tarea
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Compact Vertical Google Tasks-Style List */}
              <div className="flex flex-col w-full flex-1 divide-y divide-black/10">
                {isAssignmentsLoading ? (
                  <div className="py-12 text-center text-xs text-[#7A7062]">
                    Cargando tareas...
                  </div>
                ) : teacherAssignments.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#7A7062]">
                    No hay tareas pendientes en este momento.
                  </div>
                ) : (
                  teacherAssignments
                    .slice((tasksPage - 1) * TASKS_PER_PAGE, tasksPage * TASKS_PER_PAGE)
                    .map((assign) => {
                      const isDone = assign.status === 'COMPLETED';
                      const info = getTaskDisplayInfo(assign);
                      const isExpanded = expandedTaskId === assign.id;

                      return (
                        <div key={assign.id} className="w-full transition-colors">
                          {/* Compact Task Row */}
                          <div
                            onClick={() => setExpandedTaskId(isExpanded ? null : assign.id)}
                            className="flex items-center justify-between py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg hover:bg-black/[0.04] cursor-pointer group transition-colors gap-2.5 sm:gap-3"
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                              {/* Status Circle: Solid Green if completed, Solid Yellow if pending */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTaskStatus(assign);
                                }}
                                title={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
                                aria-label={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
                                className="p-0.5 rounded-full hover:scale-110 active:scale-95 transition-transform cursor-pointer shrink-0"
                              >
                                <span
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full inline-block shadow-2xs ${
                                    isDone ? 'bg-[#00E676]' : 'bg-[#FBBF24]'
                                  }`}
                                />
                              </button>

                              {/* Task Title & Short Description in Spanish */}
                              <div className="flex flex-col min-w-0 text-left">
                                <span
                                  className={`text-[13px] sm:text-[13.5px] font-semibold text-[#1F1A14] leading-snug truncate ${
                                    isDone ? 'line-through opacity-75' : ''
                                  }`}
                                >
                                  {info.title}
                                </span>
                                {info.description && (
                                  <span className="text-[11px] sm:text-[11.5px] text-[#554C3E] truncate font-normal leading-tight mt-0.5">
                                    {info.description}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Small Right-facing Chevron to open task details */}
                            <div className="shrink-0 text-[#7A7062] group-hover:text-black transition-colors pl-1">
                              <ChevronRight
                                className={`w-4 h-4 stroke-[2.2] transition-transform duration-200 ${
                                  isExpanded ? 'rotate-90 text-black' : ''
                                }`}
                              />
                            </div>
                          </div>

                          {/* Expanded Task Details (Accordion) */}
                          {isExpanded && (
                            <div className="px-3 sm:px-4 pt-1.5 pb-3 text-left animate-fade-in space-y-2 bg-black/[0.02] rounded-b-lg border-t border-black/5 mt-0.5">
                              {info.instructions && (
                                <p className="text-[12px] sm:text-[12.5px] text-[#2C261F] leading-relaxed font-normal">
                                  <strong className="font-semibold text-[#1F1A14]">Instrucciones: </strong>
                                  {info.instructions}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-[11px] text-[#6A6052] font-normal flex-wrap">
                                {assign.teacherName && (
                                  <span>
                                    Profesor: <strong className="font-semibold text-[#1F1A14]">{assign.teacherName}</strong>
                                  </span>
                                )}
                                {assign.dueDate && (
                                  <span>
                                    Entrega: <strong className="font-semibold text-[#1F1A14]">{assign.dueDate}</strong>
                                  </span>
                                )}
                                {assign.estimatedMinutes && (
                                  <span>
                                    Duración: <strong className="font-semibold text-[#1F1A14]">{assign.estimatedMinutes} min</strong>
                                  </span>
                                )}
                              </div>

                              {/* Available Actions in Spanish */}
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                {onAskVoyager && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const prompt = `[INSTRUCCIÓN DE VOZ VOYAGER: Habla en tu voz oficial y cálida de USA Voyager para practicar la tarea "${info.title}". Repasa las instrucciones: "${info.instructions || info.description}" y comienza la práctica con el estudiante en español e inglés.]`;
                                      onAskVoyager(prompt);
                                      if (!isDone) {
                                        updateUnifiedAssignmentStatus(assign, 'IN_PROGRESS', 35);
                                        loadTeacherAssignments();
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1F1A14] text-white hover:bg-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                  >
                                    <Play className="w-3 h-3 fill-white" />
                                    <span>Practicar con Voyager</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTaskStatus(assign);
                                  }}
                                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#1F1A14] border border-[#D5C7A5] hover:bg-[#F3E5B5] transition-all cursor-pointer active:scale-95"
                                >
                                  {isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>

              {/* 3. Bottom-Left Circular Navigation Arrows (Replaces '1 of 2' text indicator) */}
              <div className="flex items-center gap-2 sm:gap-2.5 pt-4 mt-auto justify-start select-none">
                <button
                  type="button"
                  onClick={() => setTasksPage((prev) => Math.max(1, prev - 1))}
                  disabled={tasksPage === 1}
                  aria-label="Página anterior"
                  title="Página anterior"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-black shadow-xs hover:bg-[#FBBF24] disabled:opacity-40 disabled:hover:bg-white active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4] text-black" />
                </button>
                <button
                  type="button"
                  onClick={() => setTasksPage((prev) => Math.min(Math.max(1, Math.ceil(teacherAssignments.length / TASKS_PER_PAGE)), prev + 1))}
                  disabled={tasksPage >= Math.max(1, Math.ceil(teacherAssignments.length / TASKS_PER_PAGE))}
                  aria-label="Página siguiente"
                  title="Página siguiente"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-black shadow-xs hover:bg-[#FBBF24] disabled:opacity-40 disabled:hover:bg-white active:scale-95 transition-colors duration-200 cursor-pointer border border-[#EAE2D7]/60"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4] text-black" />
                </button>
              </div>
            </div>
          ) : (
            /* ===============================================================
               MESSAGE LIST VIEW (Profesor García, Mi Grupo)
               =============================================================== */
            <>
              {/* Message List - Internal Scrollable Container */}
              <div 
                ref={messageListContainerRef}
                className="flex flex-col w-full overflow-y-auto max-h-[460px] sm:max-h-[500px] space-y-3 sm:space-y-4 [scrollbar-width:thin] [scrollbar-color:#c7c7c7_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400 [&::-webkit-scrollbar-track]:bg-transparent"
              >
                {paginatedMessages.length === 0 ? (
                  <div className="py-16 text-center text-sm text-[#7A7062]">
                    {selectedLang === 'EN' ? 'No messages in this channel.' : 'No hay mensajes en este canal.'}
                  </div>
                ) : (
                  paginatedMessages.map((msg, index) => {
                    return (
                      <React.Fragment key={msg.id}>
                        <div
                          onClick={() => {
                            handleMessageClick(msg);
                            setSelectedEmail(msg);
                          }}
                          className="py-1 transition-colors cursor-pointer text-left w-full rounded-lg px-1 group/msg"
                        >
                          {/* Top Row: Options (Select, Star, Reply, >>) on left + Date on right */}
                          <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full group/row">
                            {/* Beginning of message options: Select Icon (First spot), Heart, Reply, Double Arrow */}
                            <div 
                              className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-0.5" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* 1. Select Icon (Square / CheckSquare) - moved to first spot */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelect(msg.id);
                                }}
                                title={
                                  selectedMessageIds.includes(msg.id)
                                    ? (selectedLang === 'EN' ? 'Deselect message' : 'Deseleccionar mensaje')
                                    : (selectedLang === 'EN' ? 'Select message' : 'Seleccionar mensaje')
                                }
                                aria-label={
                                  selectedMessageIds.includes(msg.id)
                                    ? (selectedLang === 'EN' ? 'Deselect message' : 'Deseleccionar mensaje')
                                    : (selectedLang === 'EN' ? 'Select message' : 'Seleccionar mensaje')
                                }
                                className="transition-colors p-0.5 rounded cursor-pointer hover:bg-black/10 text-[#1F1A14] hover:text-black"
                              >
                                {selectedMessageIds.includes(msg.id) ? (
                                  <CheckSquare className="w-4 h-4 text-[#1F1A14] stroke-[2.8]" />
                                ) : (
                                  <Square className="w-4 h-4 text-[#1F1A14] hover:text-black stroke-[2.6]" />
                                )}
                              </button>

                              {/* 2. Heart */}
                              <button
                                type="button"
                                onClick={() => handleToggleStar(msg.id)}
                                title={msg.isStarred ? (selectedLang === 'EN' ? 'Favorited' : 'Favorito') : (selectedLang === 'EN' ? 'Favorite message' : 'Marcar favorito')}
                                className="transition-colors p-0.5 rounded cursor-pointer hover:bg-black/10 text-[#1F1A14]"
                              >
                                <Heart className={`w-4 h-4 transition-transform hover:scale-110 active:scale-90 ${msg.isStarred ? 'fill-rose-500 text-rose-500 stroke-[2.6]' : 'text-[#1F1A14] hover:text-rose-500 stroke-[2.6]'}`} />
                              </button>

                              {/* 3. Reply Icon (↩) - Quick reply to this message */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMessageClick(msg);
                                  setSelectedEmail(msg);
                                  setIsReplying(true);
                                  setTimeout(() => editor?.commands.focus(), 150);
                                }}
                                title={selectedLang === 'EN' ? 'Reply to message' : 'Responder al mensaje'}
                                aria-label={selectedLang === 'EN' ? 'Reply to message' : 'Responder al mensaje'}
                                className="transition-colors p-0.5 rounded cursor-pointer hover:bg-black/10 text-[#1F1A14] hover:text-[#0D224A]"
                              >
                                <Reply className="w-4 h-4 transition-transform hover:scale-125 active:scale-90 text-[#1F1A14] hover:text-[#0D224A] stroke-[2.8]" />
                              </button>

                              {/* 4. Double Arrow (ChevronsRight >>) - View full email */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMessageClick(msg);
                                  setSelectedEmail(msg);
                                  }}
                                title={selectedLang === 'EN' ? 'Click to see full email' : 'Clic para ver correo completo'}
                                aria-label={selectedLang === 'EN' ? 'Click to see full email' : 'Clic para ver correo completo'}
                                className="transition-colors p-0.5 rounded cursor-pointer hover:bg-black/10 text-[#1F1A14] hover:text-[#0D224A]"
                              >
                                <ChevronsRight className="w-4 h-4 transition-transform hover:scale-125 active:scale-90 text-[#1F1A14] hover:text-[#0D224A] stroke-[2.8]" />
                              </button>
                            </div>

                            {/* Right Date in DD/MM/YY format - Sans serif with light weight reduced to 10 pt */}
                            <span className="text-[10pt] font-light font-[system-ui,sans-serif] text-[#2A241C] shrink-0 ml-2">
                              {msg.date}
                            </span>
                          </div>

                          {/* Message Content Block brought under the icons */}
                          <div className="mt-1 flex flex-col min-w-0">
                            {/* Main headline text with unread indicator dot and category badge */}
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              {msg.isUnread ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F] shrink-0 inline-block shadow-xs" title={selectedLang === 'EN' ? 'Unread' : 'No leído'} />
                              ) : null}
                              {msg.category && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                  msg.category === 'system' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  msg.category === 'account' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  msg.category === 'promo' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                                  'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}>
                                  {msg.category === 'system' ? (selectedLang === 'EN' ? 'System' : 'Sistema') :
                                   msg.category === 'account' ? (selectedLang === 'EN' ? 'Account' : 'Cuenta') :
                                   msg.category === 'promo' ? (selectedLang === 'EN' ? 'Promotion' : 'Promoción') :
                                   (selectedLang === 'EN' ? 'Announcement' : 'Anuncio')}
                                </span>
                              )}
                              <span className={`text-[15.5px] sm:text-[16.5px] leading-snug flex-1 min-w-0 font-semibold transition-colors duration-150 group-hover/msg:font-bold group-hover/msg:text-blue-600 ${msg.isUnread ? 'text-[#1F1A14]' : 'text-[#2A241C]'}`}>
                                {msg.preview}
                              </span>
                            </div>

                            {/* Subtitle text if present */}
                            {msg.subtitle ? (
                              <span className="text-[15.5px] sm:text-[16.5px] text-[#4A4237] leading-snug mt-0.5">
                                {msg.subtitle}
                              </span>
                            ) : null}

                            {/* Small inline attachment preview */}
                            {msg.attachment && !msg.attachment.size && (
                              <div 
                                onClick={(e) => handleDownloadAttachment(e, msg.attachment!)}
                                className="flex items-center gap-1.5 text-[15.5px] sm:text-[16.5px] text-[#2A241C] hover:text-[#0D224A] hover:underline mt-1 font-semibold transition-colors"
                              >
                                <Paperclip className="w-4 h-4 text-neutral-700 stroke-[2] shrink-0" />
                                <span>{msg.attachment.name}</span>
                              </div>
                            )}

                            {/* PDF Attachment - No pill, no white background, no stroke */}
                            {msg.attachment && msg.attachment.size && (
                              <div 
                                onClick={(e) => handleDownloadAttachment(e, msg.attachment!)}
                                className="inline-flex items-center gap-2 mt-1.5 p-0 bg-transparent border-0 shadow-none cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                {/* Dark Grey Attachment Badge with White Type */}
                                <div className="bg-neutral-700 text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-[3px] tracking-wider flex items-center justify-center font-mono shrink-0 leading-none h-[16px]">
                                  {(msg.attachment.type || 'pdf').toUpperCase()}
                                </div>
                                <span className="font-semibold text-[15.5px] sm:text-[16.5px] text-[#1F1A14]">
                                  {msg.attachment.name}
                                </span>
                                <span className="text-[13.75px] text-[#7A7062]">
                                  {msg.attachment.size}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dashed divider between messages */}
                        {index < paginatedMessages.length - 1 && (
                          <div className="w-full border-t border-dashed border-black" />
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Pagination Controls - Sans serif bold range, solid arrows, only available options shown */}
              {currentMessages.length > 0 && (() => {
                const hasPrev = currentPage > 1;
                const hasNext = currentPage < totalPages;

                return (
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/15 select-none">
                    <span className="text-[14.5px] sm:text-[15px] font-bold font-[system-ui,sans-serif] text-[#1F1A14]">
                      {`${startIndex + 1}–${Math.min(startIndex + MESSAGES_PER_PAGE, currentMessages.length)}`}
                    </span>

                    <div className="flex items-center gap-1">
                      {hasPrev && (
                        <button
                          type="button"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          title={selectedLang === 'EN' ? 'Previous page' : 'Página anterior'}
                          aria-label={selectedLang === 'EN' ? 'Previous page' : 'Página anterior'}
                          className="group p-1.5 rounded-lg text-[#1F1A14] hover:text-black hover:bg-black/10 transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5 fill-current transition-transform duration-200 group-hover:-translate-x-0.5" viewBox="0 0 16 16">
                            <polygon points="11,2.5 4,8 11,13.5" />
                          </svg>
                        </button>
                      )}

                      {hasPrev && hasNext && (
                        /* Flute divider (filete separador) */
                        <div className="w-[1px] h-3.5 bg-black/40 my-auto mx-0.5" />
                      )}

                      {hasNext && (
                        <button
                          type="button"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          title={selectedLang === 'EN' ? 'Next page' : 'Página siguiente'}
                          aria-label={selectedLang === 'EN' ? 'Next page' : 'Página siguiente'}
                          className="group p-1.5 rounded-lg text-[#1F1A14] hover:text-black hover:bg-black/10 transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5 fill-current transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 16 16">
                            <polygon points="5,2.5 12,8 5,13.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
