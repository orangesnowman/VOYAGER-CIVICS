import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Users, Megaphone, Paperclip, X, Star, ChevronsRight, Trash2, ArrowLeft, ArrowRight,
  Mail, Clock, Download, Reply, Send, MessageSquare, CheckCircle2, GraduationCap, 
  User, Square, CheckSquare, Heart, ClipboardList, Smile, 
  Link as LinkIcon, Image as ImageIcon, ExternalLink, Bold, Italic, Underline, 
  List, ListOrdered 
} from 'lucide-react';

export type ChannelId = 'profe' | 'grupo' | 'anuncios';

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
  attachment?: Attachment;
  isSelected?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  replies?: MessageReply[];
}

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

  // --- Anuncios Channel ---
  {
    id: 'an-1',
    sender: 'Coordinación Académica',
    senderEmail: 'academics@usavoyager.edu',
    date: '12/10/26',
    fullDate: '12 de Octubre de 2026, 09:00 AM EST',
    subject: 'Convocatoria Oficial: Simulacro General de Examen de Ciudadanía 2026',
    preview: 'Simulacro General de Examen de Ciudadanía 2026',
    subtitle: 'Convocatoria abierta para estudiantes activos.',
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
    channel: 'anuncios',
    attachment: {
      name: 'Guia_Simulacro_Oficial_2026.pdf',
      size: '2.1 MB',
      type: 'pdf',
    },
  },
  {
    id: 'an-2',
    sender: 'Dirección USA Voyager',
    senderEmail: 'director@usavoyager.edu',
    date: '01/10/26',
    fullDate: '01 de Octubre de 2026, 08:00 AM EST',
    subject: 'Nuevos Recursos Multimedia, Flashcards y Actualizaciones 2026',
    preview: 'Nuevos recursos multimedia y flashcards disponibles',
    body: `Estimada comunidad de USA Voyager,

Nos complace anunciar el lanzamiento del nuevo paquete de recursos de aprendizaje interactivo:

1. Flashcards Inteligentes con audio fonético nativo para las 128 preguntas cívicas.
2. Modo Examen Cronometrado con retroalimentación instantánea de acierto o fallo.
3. Actualización de transcripciones fonéticas IPA para todos los términos clave de la historia de EE. UU.

Todos estos recursos ya se encuentran disponibles en tu portal sin costo adicional.

¡Aprovecha al máximo estas herramientas y continúa tu camino hacia la ciudadanía americana!

Dirección General
USA Voyager Platform`,
    isUnread: true,
    channel: 'anuncios',
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

// Custom Calendar Plus Icon matching image_e18fd2ae.png and scaled to match the Lucide family
const CalendarPlusIcon: React.FC<{ className?: string }> = ({ className = "w-4.5 h-4.5 stroke-[1.8]" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Top Binder Pins / Rings */}
    <path d="M8 2v3.5" />
    <path d="M16 2v3.5" />
    {/* Rounded Calendar Body */}
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    {/* Header Line */}
    <path d="M3 9.5h18" />
    {/* Centered Plus Sign */}
    <path d="M12 12.5v5" />
    <path d="M9.5 15h5" />
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

// Renders text with initial greetings and closing signatures styled in demi-bold (typical for Mensajería Voyager), scaled emojis, and clickable links
const renderContentWithGreetingAndEmojis = (text: string) => {
  if (!text) return null;

  // Regex to match initial greeting / salutation typical of Mensajería Voyager:
  // e.g. "Estimado Federico,", "Hola Federico,", "¡Hola a todos los compañeros!", "Estimados estudiantes de USA Voyager,"
  const greetingRegex = /^(\s*(?:¡?Estimad[oa]s?[^,\n]*|¡?Hola[^,\n]*|¡?Querid[oa]s?[^,\n]*|¡?Buenos días[^,\n]*|¡?Buenas tardes[^,\n]*|¡Excelente trabajo[^!,\n]*|Dear[^,\n]*|Hello[^,\n]*|Hi[^,\n]*|Profesor\s+García)[,!])/i;

  let greeting: string | null = null;
  let bodyAndSig = text;

  const match = text.match(greetingRegex);
  if (match) {
    greeting = match[1];
    bodyAndSig = text.substring(match[0].length);
  }

  // Regex to match closing signature section typical of Mensajería Voyager:
  // e.g. "¡Mucho éxito con tu preparación y nos vemos en clase!\n\nAtentamente,\nProfesor García\nDocente Titular..."
  const signatureRegex = /(?:\n\n)((?:(?:¡(?:Mucho éxito|Nos vemos|Sigue con|A seguir|Felicitaciones|Feliz)[^\n]*\n\n)?(?:Atentamente|Un cordial saludo|Saludos cordiales|Cordialmente|Saludos|Que tengas [^\n]+,|Best regards|Sincerely|Warm regards|Regards|Profesor García|Coordinación Académica|Equipo Docente)[\s\S]*))$/i;

  let mainBody = bodyAndSig;
  let signature: string | null = null;

  const sigMatch = bodyAndSig.match(signatureRegex);
  if (sigMatch && sigMatch.index != null) {
    mainBody = bodyAndSig.substring(0, sigMatch.index);
    signature = sigMatch[1];
  }

  return (
    <>
      {greeting && (
        <span className="font-semibold text-[#1F1A14] tracking-tight">
          {renderContentWithLargeEmojis(greeting)}
        </span>
      )}
      {mainBody && renderContentWithLargeEmojis(mainBody)}
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
}) => {
  const [activeTab, setActiveTab] = useState<ChannelId>('profe');
  const [selectedEmail, setSelectedEmail] = useState<ChannelMessage | null>(null);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
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

  const handleOpenLinkPopover = () => {
    if (showLinkPopover) {
      setShowLinkPopover(false);
      return;
    }
    const textarea = replyTextareaRef.current;
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      const selectedSub = replyText.substring(textarea.selectionStart, textarea.selectionEnd);
      setLinkText(selectedSub);
    } else {
      setLinkText('');
    }
    setLinkUrl('');
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
    const displayText = linkText.trim() || cleanUrl;
    const markdownLink = `[${displayText}](${cleanUrl})`;

    const textarea = replyTextareaRef.current;
    if (textarea && textarea.selectionStart != null && textarea.selectionEnd != null) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextText = replyText.substring(0, start) + markdownLink + replyText.substring(end);
      setReplyText(nextText);
      setShowLinkPopover(false);
      setLinkUrl('');
      setLinkText('');
      setTimeout(() => {
        textarea.focus();
        const cursorAfter = start + markdownLink.length;
        textarea.setSelectionRange(cursorAfter, cursorAfter);
      }, 50);
    } else {
      setReplyText((prev) => (prev ? `${prev} ${markdownLink}` : markdownLink));
      setShowLinkPopover(false);
      setLinkUrl('');
      setLinkText('');
      setTimeout(() => {
        textarea?.focus();
      }, 50);
    }
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
    setReplyText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    replyTextareaRef.current?.focus();
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

  if (isOpen === false) return null;

  const currentMessages = messages.filter((m) => m.channel === activeTab && (!starredFilter || m.isStarred));
  const likedMessagesCount = messages.filter((m) => m.channel === activeTab && m.isStarred).length;

  // Tabs matching the design guide
  const tabs: { id: ChannelId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { 
      id: 'profe', 
      label: selectedLang === 'EN' ? 'Profesor García' : 'Profesor García', 
      icon: GraduationCap 
    },
    { 
      id: 'grupo', 
      label: selectedLang === 'EN' ? 'My Group' : 'Mi Grupo', 
      icon: Users 
    },
    { 
      id: 'anuncios', 
      label: selectedLang === 'EN' ? 'Tasks' : 'Tareas', 
      icon: ClipboardList 
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
    if ((!replyText.trim() && !attachedReplyFile) || !selectedEmail || isSendingReply) return;

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
    
    let content = replyText.trim();
    if (attachedReplyFile) {
      content = content 
        ? `${content}\n\n📎 ${attachedReplyFile.name} (${attachedReplyFile.size})` 
        : `📎 ${attachedReplyFile.name} (${attachedReplyFile.size})`;
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
    const updatedEmail: ChannelMessage = {
      ...selectedEmail,
      replies: updatedReplies,
      subtitle: `${selectedLang === 'EN' ? 'You replied' : 'Respondiste'}: "${content.slice(0, 45)}..."`,
    };

    setSelectedEmail(updatedEmail);
    const updatedMessages = messages.map((m) =>
      m.id === selectedEmail.id ? updatedEmail : m
    );
    saveMessages(updatedMessages);
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

      {/* Schedule advisory session notification */}
      {scheduleNotice && (
        <div className="mb-2 px-4 py-2 bg-[#1B365D] text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CalendarPlusIcon className="w-4 h-4 text-amber-300 stroke-[2] shrink-0" />
            <span>{scheduleNotice}</span>
          </div>
          <button type="button" onClick={() => setScheduleNotice(null)} className="cursor-pointer">
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
      <div className="w-full flex flex-col">
        
        {/* Top Tab Bar - All tabs have the exact same Chrome tab shape */}
        <div className="w-full flex items-end relative pt-2 px-4 sm:px-6 z-10">
          <div className="flex items-end w-full gap-5 sm:gap-7 relative">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const unreadCount = messages.filter((m) => m.channel === tab.id && m.isUnread).length;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedEmail(null);
                    setSelectedMessageIds([]);
                    setStarredFilter(false);
                  }}
                  className={`group relative flex-1 py-3 sm:py-3.5 px-2.5 sm:px-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#eedfc2] text-[#eedfc2] z-20 rounded-t-[14px] sm:rounded-t-[18px]'
                      : 'bg-[#ede9dc] hover:bg-[#e4dfd0] text-[#ede9dc] hover:text-[#e4dfd0] rounded-t-[14px] sm:rounded-t-[18px] z-10'
                  }`}
                >
                  {/* Left Concave Flare / Inverted Fillet (Every tab has the Chrome shape) */}
                  <svg
                    className="absolute -left-[14px] sm:-left-[15px] bottom-0 w-[14px] sm:w-[15px] h-[14px] sm:h-[15px] pointer-events-none overflow-visible transition-colors"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M 16 0 L 16 16.5 L 0 16.5 Q 16 16.5 16 0 Z" />
                  </svg>

                  {/* Right Concave Flare / Inverted Fillet (Every tab has the Chrome shape) */}
                  <svg
                    className="absolute -right-[14px] sm:-right-[15px] bottom-0 w-[14px] sm:w-[15px] h-[14px] sm:h-[15px] pointer-events-none overflow-visible transition-colors"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M 0 0 L 0 16.5 L 16 16.5 Q 0 16.5 0 0 Z" />
                  </svg>

                  {/* Tab Icon with unread badge */}
                  <div className="relative mb-1 flex items-center justify-center">
                    <Icon className={`w-4 h-4 sm:w-[17px] sm:h-[17px] stroke-[1.8] ${isActive ? 'text-[#1F1A14]' : 'text-[#554C3E]'}`} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-3 sm:-top-2 sm:-right-3.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#D32F2F] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center leading-none shadow-xs border border-white/60 pointer-events-none">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Tab Label - nowrap prevents awkward truncation */}
                  <span className={`text-xs sm:text-[13px] font-bold leading-tight whitespace-nowrap ${isActive ? 'text-[#1F1A14]' : 'text-[#554C3E]'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Folder Content Card Body - Lighter golden parchment background (#eedfc2), seamlessly open to active tab */}
        <div className="bg-[#eedfc2] rounded-b-[26px] sm:rounded-b-[30px] rounded-t-[14px] sm:rounded-t-[18px] p-4 sm:p-7 flex flex-col w-full relative z-0 min-h-[420px] shadow-xs">
          
          {selectedEmail ? (
            /* ===============================================================
               FULL EMAIL READER VIEW (Opened by clicking >> or message)
               =============================================================== */
            <div className="w-full flex flex-col animate-fade-in text-left">
              {/* Navigation & Actions Top Bar - Title on left, Right-aligned actions (Back Arrow, Heart, >>, Trash) */}
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-black">
                <h3 className="text-sm sm:text-[14.5px] font-semibold tracking-wide text-[#1F1A14] uppercase">
                  {selectedLang === 'EN' ? 'MENSAJERÍA VOYAGER' : 'MENSAJERÍA VOYAGER'}
                </h3>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Back to messages button (repositioned icon without text) */}
                  <button
                    type="button"
                    onClick={() => setSelectedEmail(null)}
                    title={selectedLang === 'EN' ? 'Back to messages' : 'Volver a mensajes'}
                    aria-label={selectedLang === 'EN' ? 'Back to messages' : 'Volver a mensajes'}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-[#0D224A] hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>

                  {/* Reply button in top bar */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplying(true);
                      setTimeout(() => replyTextareaRef.current?.focus(), 100);
                    }}
                    title={selectedLang === 'EN' ? 'Reply' : 'Responder'}
                    aria-label={selectedLang === 'EN' ? 'Reply' : 'Responder'}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-[#0D224A] hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer active:scale-95"
                  >
                    <Reply className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>

                  {/* Heart / Favorite */}
                  <button
                    type="button"
                    onClick={() => handleToggleStar(selectedEmail.id)}
                    title={selectedEmail.isStarred ? (selectedLang === 'EN' ? 'Favorited' : 'Favorito') : (selectedLang === 'EN' ? 'Favorite message' : 'Marcar favorito')}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-rose-500 hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer"
                  >
                    <Heart className={`w-4.5 h-4.5 ${selectedEmail.isStarred ? 'fill-rose-500 text-rose-500 stroke-[1.8]' : 'stroke-[1.8]'}`} />
                  </button>

                  {/* Priority / Important */}
                  <button
                    type="button"
                    onClick={() => handleToggleImportant(selectedEmail.id)}
                    title={selectedEmail.isImportant ? (selectedLang === 'EN' ? 'Important' : 'Importante') : (selectedLang === 'EN' ? 'Mark important' : 'Marcar importante')}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-amber-600 hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer"
                  >
                    <ChevronsRight className={`w-4.5 h-4.5 ${selectedEmail.isImportant ? 'text-amber-600 stroke-[2.4]' : 'stroke-[2]'}`} />
                  </button>

                  {/* Calendar Plus - Schedule Advisory Session (Matches image_e18fd2ae.png) */}
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleNotice(
                        selectedLang === 'EN'
                          ? 'Advisory session scheduled with Profesor García! Added to your Voyager calendar.'
                          : '¡Sesión de asesoría agendada con el Profesor García! Añadida a tu calendario Voyager.'
                      );
                      setTimeout(() => setScheduleNotice(null), 5000);
                    }}
                    title={selectedLang === 'EN' ? 'Schedule advisory session (Add to Calendar)' : 'Agendar sesión de asesoría (Añadir al calendario)'}
                    aria-label={selectedLang === 'EN' ? 'Schedule advisory session' : 'Agendar sesión de asesoría'}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-[#0D224A] hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer"
                  >
                    <CalendarPlusIcon className="w-4.5 h-4.5 stroke-[1.8]" />
                  </button>

                  {/* Delete Email */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteMessage(selectedEmail.id);
                      setSelectedEmail(null);
                    }}
                    title={selectedLang === 'EN' ? 'Delete email' : 'Eliminar correo'}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-[#D32F2F] hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5 stroke-[1.8]" />
                  </button>
                </div>
              </div>

              {/* Subject Headline - Reduced 75%, demibold */}
              <div className="mb-3">
                <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#1F1A14] leading-snug">
                  {selectedEmail.subject || selectedEmail.preview}
                </h4>
              </div>

              {/* Sender & Recipient Details - No pill, no background, no stroke */}
              <div className="flex items-start justify-between gap-3 bg-transparent border-0 p-0 mb-4 shadow-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-black flex items-center justify-center shrink-0 text-[#1F1A14]">
                    {selectedEmail.channel === 'grupo' ? (
                      <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.8] text-[#1F1A14]" />
                    ) : selectedEmail.channel === 'anuncios' ? (
                      <ClipboardList className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.8] text-[#1F1A14]" />
                    ) : (
                      <GraduationCap className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.8] text-[#1F1A14]" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-[13px] text-[#1F1A14]">
                        {selectedEmail.sender}
                      </span>
                      <span className="text-[11px] text-[#7A7062] font-mono">
                        &lt;{selectedEmail.senderEmail || `${selectedEmail.sender.toLowerCase().replace(/[^a-z0-9]/g, '')}@usavoyager.edu`}&gt;
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-xs text-[#554C3E] mt-0.5">
                      {selectedLang === 'EN' ? 'To: ' : 'Para: '}
                      <strong className="text-[#1F1A14]">{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Federico Sandoval'}</strong> &lt;theorangesnowman@gmail.com&gt;
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-[#7A7062] block">
                    {formatSimpleDate(selectedEmail.fullDate, selectedEmail.date)}
                  </span>
                </div>
              </div>

              {/* Full Email Formatted Body - Pill, background, and border eliminated */}
              <div className="py-2 text-xs sm:text-[13.5px] text-[#2A241C] leading-relaxed whitespace-pre-line mb-5 font-normal">
                {renderContentWithGreetingAndEmojis(selectedEmail.body)}
              </div>

              {/* Attached Files Section if present - No pill, no background, no border */}
              {selectedEmail.attachment && (
                <div className="mb-4">
                  <div 
                    onClick={(e) => handleDownloadAttachment(e, selectedEmail.attachment!)}
                    className="inline-flex items-center gap-2.5 p-0 bg-transparent border-0 shadow-none cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="bg-black text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded-[3px] tracking-wider flex items-center justify-center font-mono shrink-0 leading-none h-[14px]">
                      {selectedEmail.attachment.type.toUpperCase()}
                    </div>
                    <span className="font-semibold text-[12.5px] sm:text-[13px] text-[#1F1A14]">
                      {selectedEmail.attachment.name}
                    </span>
                    <span className="text-[11px] text-[#7A7062]">
                      {selectedEmail.attachment.size}
                    </span>
                    <Download className="w-3.5 h-3.5 text-[#554C3E] hover:text-[#1F1A14] transition-colors ml-0.5" />
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
                              <div className="w-5 h-5 rounded-full border border-black flex items-center justify-center shrink-0">
                                {isUserStudent ? (
                                  <User className="w-3 h-3 text-[#1F1A14] stroke-[2]" />
                                ) : (
                                  <GraduationCap className="w-3 h-3 text-[#1F1A14] stroke-[2]" />
                                )}
                              </div>
                              <span className="text-xs sm:text-[13px] font-bold text-[#1F1A14]">
                                {reply.sender}
                              </span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] text-[#7A7062] font-mono shrink-0">
                              {formatSimpleDate(reply.fullDate, reply.date)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-[13px] text-[#2A241C] leading-relaxed whitespace-pre-line font-normal">
                            {renderContentWithGreetingAndEmojis(reply.body)}
                          </p>
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
                  <div className="px-4 pt-3.5 pb-2">
                    <textarea
                      ref={replyTextareaRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={replyText.trim() && /^[\p{Extended_Pictographic}\s\p{Emoji_Component}\p{Punctuation}]+$/u.test(replyText.trim()) ? 3 : 4}
                      className={`w-full bg-transparent border-0 outline-none resize-none font-sans text-[#1F1F1F] leading-relaxed placeholder-transparent focus:ring-0 ${
                        replyText.trim() && /^[\p{Extended_Pictographic}\s\p{Emoji_Component}\p{Punctuation}]+$/u.test(replyText.trim())
                          ? 'text-[24px] sm:text-[26px] tracking-wider'
                          : replyText.trim() && /[\p{Extended_Pictographic}]/u.test(replyText)
                          ? 'text-[20px] sm:text-[22px]'
                          : 'text-[15px] sm:text-[16px]'
                      }`}
                    />

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
                      onClick={() => {
                        setReplyText(prev => prev + ' **bold text** ');
                        replyTextareaRef.current?.focus();
                      }} 
                      className="p-1.5 hover:bg-[#E2E5E9] rounded transition-colors cursor-pointer" 
                      title="Bold"
                    >
                      <Bold className="w-[18.6px] h-[18.6px] stroke-[2.2]" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setReplyText(prev => prev + ' _italic text_ ');
                        replyTextareaRef.current?.focus();
                      }} 
                      className="p-1.5 hover:bg-[#E2E5E9] rounded transition-colors cursor-pointer" 
                      title="Italic"
                    >
                      <Italic className="w-[18.6px] h-[18.6px] stroke-[2.2]" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setReplyText(prev => prev + ' <u>underlined</u> ');
                        replyTextareaRef.current?.focus();
                      }} 
                      className="p-1.5 hover:bg-[#E2E5E9] rounded transition-colors cursor-pointer" 
                      title="Underline"
                    >
                      <Underline className="w-[18.6px] h-[18.6px] stroke-[2.2]" />
                    </button>
                    <div className="w-[1px] h-[18.6px] bg-[#C7C7C7] my-auto mx-1" />
                    <button 
                      type="button" 
                      onClick={() => {
                        setReplyText(prev => prev + '\n1. ');
                        replyTextareaRef.current?.focus();
                      }} 
                      className="p-1.5 hover:bg-[#E2E5E9] rounded transition-colors cursor-pointer" 
                      title="Numbered list"
                    >
                      <ListOrdered className="w-[18.6px] h-[18.6px]" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setReplyText(prev => prev + '\n• ');
                        replyTextareaRef.current?.focus();
                      }} 
                      className="p-1.5 hover:bg-[#E2E5E9] rounded transition-colors cursor-pointer" 
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
                        showLinkPopover
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
                      disabled={isSendingReply || (!replyText.trim() && !attachedReplyFile)}
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
                      setTimeout(() => replyTextareaRef.current?.focus(), 100);
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
                      className="group p-1.5 rounded-lg text-[#1F1A14] hover:text-black hover:bg-[#EFE3CF]/80 transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center justify-center"
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
                        className="group p-1.5 rounded-lg text-[#1F1A14] hover:text-black hover:bg-[#EFE3CF]/80 transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center justify-center"
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
          ) : (
            /* ===============================================================
               MESSAGE LIST VIEW
               =============================================================== */
            <>
              {/* Actions Top Bar - Title on left, Right-aligned actions (Heart, >>, Trash) */}
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-black">
                <h3 className="text-sm sm:text-[14.5px] font-semibold tracking-wide text-[#1F1A14] uppercase">
                  {selectedLang === 'EN' ? 'MENSAJERÍA VOYAGER' : 'MENSAJERÍA VOYAGER'}
                </h3>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Heart Filter with Liked Messages Count Badge */}
                  <button
                    type="button"
                    onClick={() => setStarredFilter(!starredFilter)}
                    title={
                      starredFilter
                        ? (selectedLang === 'EN' ? 'Show all' : 'Ver todos')
                        : (selectedLang === 'EN' 
                            ? (likedMessagesCount > 0 ? `Favorites (${likedMessagesCount})` : 'Favorites') 
                            : (likedMessagesCount > 0 ? `Favoritos (${likedMessagesCount})` : 'Favoritos'))
                    }
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-rose-500 hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer relative"
                  >
                    <Heart className={`w-4.5 h-4.5 ${starredFilter ? 'fill-rose-500 text-rose-500 stroke-[1.8]' : 'stroke-[1.8]'}`} />
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
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-amber-600 hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer"
                  >
                    <ChevronsRight className="w-4.5 h-4.5 text-[#554C3E] hover:text-amber-600 stroke-[2.4]" />
                  </button>

                  {/* Calendar Plus - Schedule / Add to Calendar (Matches image_e18fd2ae.png) */}
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleNotice(
                        selectedLang === 'EN'
                          ? 'Practice / Advisory session scheduled on your Voyager calendar!'
                          : '¡Sesión de práctica/asesoría agendada en tu calendario Voyager!'
                      );
                      setTimeout(() => setScheduleNotice(null), 5000);
                    }}
                    title={selectedLang === 'EN' ? 'Schedule session (Add to Calendar)' : 'Agendar sesión (Añadir al calendario)'}
                    aria-label={selectedLang === 'EN' ? 'Schedule session' : 'Agendar sesión'}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-[#0D224A] hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer"
                  >
                    <CalendarPlusIcon className="w-4.5 h-4.5 stroke-[1.8]" />
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
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-[#D32F2F] hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer relative"
                  >
                    <Trash2 className="w-4.5 h-4.5 stroke-[1.8]" />
                    {selectedMessageIds.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#D32F2F] text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-xs border border-white/40 pointer-events-none">
                        {selectedMessageIds.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Message List - Dividers eliminated as requested */}
              <div className="flex flex-col w-full space-y-3 sm:space-y-4 min-h-[360px]">
                {currentMessages.length === 0 ? (
                  <div className="py-16 text-center text-sm text-[#7A7062]">
                    {selectedLang === 'EN' ? 'No messages in this channel.' : 'No hay mensajes en este canal.'}
                  </div>
                ) : (
                  currentMessages.map((msg, index) => {
                    return (
                      <React.Fragment key={msg.id}>
                        <div
                          onClick={() => {
                            handleMessageClick(msg);
                            setSelectedEmail(msg);
                          }}
                          className="py-1 transition-colors cursor-pointer text-left w-full rounded-lg hover:bg-amber-300/40 px-1"
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
                                className="transition-colors p-0.5 rounded cursor-pointer hover:bg-[#EFE3CF]/80 text-[#554C3E] hover:text-[#1F1F1F]"
                              >
                                {selectedMessageIds.includes(msg.id) ? (
                                  <CheckSquare className="w-4 h-4 text-[#1F1A14] stroke-[2.2]" />
                                ) : (
                                  <Square className="w-4 h-4 text-[#6A6052] hover:text-[#1F1A14] stroke-[1.8]" />
                                )}
                              </button>

                              {/* 2. Heart */}
                              <button
                                type="button"
                                onClick={() => handleToggleStar(msg.id)}
                                title={msg.isStarred ? (selectedLang === 'EN' ? 'Favorited' : 'Favorito') : (selectedLang === 'EN' ? 'Favorite message' : 'Marcar favorito')}
                                className="transition-colors p-0.5 rounded cursor-pointer"
                              >
                                <Heart className={`w-4 h-4 transition-transform hover:scale-110 active:scale-90 ${msg.isStarred ? 'fill-rose-500 text-rose-500 stroke-[1.8]' : 'text-[#554C3E] hover:text-rose-500 stroke-[1.8]'}`} />
                              </button>

                              {/* 3. Reply Icon (↩) - Quick reply to this message */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMessageClick(msg);
                                  setSelectedEmail(msg);
                                  setIsReplying(true);
                                  setTimeout(() => replyTextareaRef.current?.focus(), 150);
                                }}
                                title={selectedLang === 'EN' ? 'Reply to message' : 'Responder al mensaje'}
                                aria-label={selectedLang === 'EN' ? 'Reply to message' : 'Responder al mensaje'}
                                className="transition-colors p-0.5 rounded cursor-pointer hover:bg-[#EFE3CF]/80 text-[#554C3E] hover:text-[#0D224A]"
                              >
                                <Reply className="w-4 h-4 transition-transform hover:scale-125 active:scale-90 text-[#4A4237] hover:text-[#0D224A] stroke-[2.2]" />
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
                                className="transition-colors p-0.5 rounded cursor-pointer hover:bg-[#EFE3CF]/80 text-[#554C3E] hover:text-[#0D224A]"
                              >
                                <ChevronsRight className="w-4 h-4 transition-transform hover:scale-125 active:scale-90 text-[#4A4237] hover:text-[#0D224A] stroke-[2.2]" />
                              </button>
                            </div>

                            {/* Right Date in DD/MM/YY format */}
                            <span className="text-xs sm:text-[13.5px] font-medium text-[#2A241C] shrink-0 ml-2">
                              {msg.date}
                            </span>
                          </div>

                          {/* Message Content Block brought under the icons */}
                          <div className="mt-1 flex flex-col min-w-0">
                            {/* Main headline text with unread indicator dot */}
                            <div className="flex items-center gap-2 min-w-0">
                              {msg.isUnread ? (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F] shrink-0 inline-block shadow-xs" title={selectedLang === 'EN' ? 'Unread' : 'No leído'} />
                              ) : null}
                              <span className={`text-[12.5px] sm:text-[13px] leading-snug flex-1 min-w-0 ${msg.isUnread ? 'font-bold text-[#1F1A14]' : 'font-normal text-[#2A241C]'}`}>
                                {msg.preview}
                              </span>
                            </div>

                            {/* Subtitle text if present */}
                            {msg.subtitle ? (
                              <span className="text-[12.5px] sm:text-[13px] text-[#4A4237] leading-snug mt-0.5">
                                {msg.subtitle}
                              </span>
                            ) : null}

                            {/* Small inline attachment preview */}
                            {msg.attachment && !msg.attachment.size && (
                              <div 
                                onClick={(e) => handleDownloadAttachment(e, msg.attachment!)}
                                className="flex items-center gap-1.5 text-[12.5px] sm:text-[13px] text-[#2A241C] hover:text-[#0D224A] hover:underline mt-1 font-semibold transition-colors"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-[#554C3E] stroke-[2] shrink-0" />
                                <span>{msg.attachment.name}</span>
                              </div>
                            )}

                            {/* PDF Attachment - No pill, no white background, no stroke */}
                            {msg.attachment && msg.attachment.size && (
                              <div 
                                onClick={(e) => handleDownloadAttachment(e, msg.attachment!)}
                                className="inline-flex items-center gap-2 mt-1.5 p-0 bg-transparent border-0 shadow-none cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                {/* Black Attachment Badge with White Type - Reduced 75% */}
                                <div className="bg-black text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded-[3px] tracking-wider flex items-center justify-center font-mono shrink-0 leading-none h-[14px]">
                                  {(msg.attachment.type || 'pdf').toUpperCase()}
                                </div>
                                <span className="font-semibold text-[12.5px] sm:text-[13px] text-[#1F1A14]">
                                  {msg.attachment.name}
                                </span>
                                <span className="text-[11px] text-[#7A7062]">
                                  {msg.attachment.size}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dashed divider between messages */}
                        {index < currentMessages.length - 1 && (
                          <div className="w-full border-t border-dashed border-black" />
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
