import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Users, Megaphone, Paperclip, X, Star, ChevronsRight, Trash2, ArrowLeft, Mail, Clock, Download, Reply, Send, MessageSquare, CheckCircle2, GraduationCap, User } from 'lucide-react';

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
const YellowPaperPlane: React.FC = () => (
  <svg 
    viewBox="0 0 24 24" 
    className="w-5.5 h-5.5 sm:w-6 sm:h-6 shrink-0 transition-transform active:scale-90 hover:scale-105" 
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

export const VoyagerMessagingModal: React.FC<VoyagerMessagingModalProps> = ({
  isOpen,
  selectedLang = 'ES',
  user,
  onUnreadCountChange,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<ChannelId>('profe');
  const [selectedEmail, setSelectedEmail] = useState<ChannelMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyNotice, setReplyNotice] = useState<string | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const currentMessages = messages.filter((m) => m.channel === activeTab);

  // Tabs matching the design guide
  const tabs: { id: ChannelId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { 
      id: 'profe', 
      label: selectedLang === 'EN' ? 'Profesor García' : 'Profesor García', 
      icon: BookOpen 
    },
    { 
      id: 'grupo', 
      label: selectedLang === 'EN' ? 'Grupo Chat' : 'Grupo Chat', 
      icon: Users 
    },
    { 
      id: 'anuncios', 
      label: selectedLang === 'EN' ? 'Anuncios' : 'Anuncios', 
      icon: Megaphone 
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

  const handleSendEmailReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail || isSendingReply) return;

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
    const content = replyText.trim();

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
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

    const updated = [newMsg, ...messages];
    saveMessages(updated);
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
        saveMessages([teacherReply, ...updated]);
      }, 1500);
    }
  };

  return (
    <div className={`w-full flex flex-col font-sans select-none ${className || ''}`}>
      {/* Title directly above folder: MENSAJERÍA VOYAGER */}
      <div className="mb-3 px-1 text-left w-full">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#1F1A14] uppercase">
          {selectedLang === 'EN' ? 'MENSAJERÍA VOYAGER' : 'MENSAJERÍA VOYAGER'}
        </h3>
      </div>

      {/* Download toast notification */}
      {downloadNotice && (
        <div className="mb-2 px-4 py-2 bg-[#2E7D32] text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-md animate-fade-in">
          <span>{downloadNotice}</span>
          <button type="button" onClick={() => setDownloadNotice(null)}>
            <X className="w-3.5 h-3.5 text-white/80 hover:text-white" />
          </button>
        </div>
      )}

      {/* Main Folder Container - NO heavy left/right borders */}
      <div className="w-full flex flex-col rounded-[26px] sm:rounded-[30px] overflow-hidden bg-[#FAF5EB] shadow-xs">
        
        {/* Top Folder Header Bar */}
        <div className="w-full flex items-stretch relative bg-[#DEC7A3]">
          {/* Active Tab: Profesor García (occupies left ~36% with seamless curved folder shoulder) */}
          <button
            type="button"
            onClick={() => setActiveTab('profe')}
            className={`relative py-3 sm:py-3.5 px-4 sm:px-6 cursor-pointer flex flex-col items-center justify-center transition-all ${
              activeTab === 'profe'
                ? 'bg-[#FAF5EB] text-[#1F1A14] z-20 rounded-tl-[26px] sm:rounded-tl-[30px]'
                : 'bg-[#DEC7A3] hover:bg-[#D5BF9A] text-[#332A1E]'
            }`}
            style={{ width: '36%' }}
          >
            {/* Outlined Book Icon with Red Notification Pill */}
            <div className="relative mb-1 flex items-center justify-center">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8] text-[#1F1A14]" />
              {messages.filter((m) => m.channel === 'profe' && m.isUnread).length > 0 && (
                <span className="absolute -top-1.5 -right-3 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#D32F2F] text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center leading-none shadow-xs border border-white/40">
                  {messages.filter((m) => m.channel === 'profe' && m.isUnread).length}
                </span>
              )}
            </div>
            <span className={`text-xs sm:text-[13.5px] font-bold leading-tight ${activeTab === 'profe' ? 'text-[#1F1A14]' : 'text-[#362C1E]'}`}>
              {tabs[0].label}
            </span>

            {/* Organic Folder Tab S-Curve on the right shoulder when active */}
            {activeTab === 'profe' && (
              <svg 
                className="absolute -right-5 top-0 bottom-0 h-full w-5 pointer-events-none z-20" 
                viewBox="0 0 20 64" 
                preserveAspectRatio="none" 
                fill="#FAF5EB"
              >
                <path d="M 0,0 Q 8,0 12,28 Q 16,56 20,64 L 0,64 Z" />
              </svg>
            )}
          </button>

          {/* Inactive Combined Header Area: Grupo Chat & Anuncios (NO vertical dividing line between them, NO bottom line) */}
          <div className="flex-1 flex items-stretch justify-around pl-4 pr-3 sm:pr-6 relative z-10">
            {/* Tab: Grupo Chat */}
            <button
              type="button"
              onClick={() => setActiveTab('grupo')}
              className={`flex-1 py-3 sm:py-3.5 px-3 cursor-pointer flex flex-col items-center justify-center transition-colors ${
                activeTab === 'grupo'
                  ? 'bg-[#FAF5EB] text-[#1F1A14] rounded-t-xl z-20'
                  : 'text-[#332A1E] hover:text-[#1F1A14]'
              }`}
            >
              <div className="relative mb-1 flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8] text-[#1F1A14]" />
                {messages.filter((m) => m.channel === 'grupo' && m.isUnread).length > 0 && (
                  <span className="absolute -top-1.5 -right-3 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#D32F2F] text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center leading-none shadow-xs border border-white/40">
                    {messages.filter((m) => m.channel === 'grupo' && m.isUnread).length}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-[13.5px] font-bold leading-tight">
                {tabs[1].label}
              </span>
            </button>

            {/* Tab: Anuncios - Seamlessly next to Grupo Chat with ZERO dividing line */}
            <button
              type="button"
              onClick={() => setActiveTab('anuncios')}
              className={`flex-1 py-3 sm:py-3.5 px-3 cursor-pointer flex flex-col items-center justify-center transition-colors ${
                activeTab === 'anuncios'
                  ? 'bg-[#FAF5EB] text-[#1F1A14] rounded-t-xl z-20'
                  : 'text-[#332A1E] hover:text-[#1F1A14]'
              }`}
            >
              <div className="relative mb-1 flex items-center justify-center">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8] text-[#1F1A14]" />
                {messages.filter((m) => m.channel === 'anuncios' && m.isUnread).length > 0 && (
                  <span className="absolute -top-1.5 -right-3 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#D32F2F] text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center leading-none shadow-xs border border-white/40">
                    {messages.filter((m) => m.channel === 'anuncios' && m.isUnread).length}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-[13.5px] font-bold leading-tight">
                {tabs[2].label}
              </span>
            </button>
          </div>
        </div>

        {/* Folder Content Card Body - Seamlessly open to active tab, NO left/right borders */}
        <div className="bg-[#FAF5EB] p-4 sm:p-7 flex flex-col w-full relative z-0 min-h-[420px]">
          
          {selectedEmail ? (
            /* ===============================================================
               FULL EMAIL READER VIEW (Opened by clicking >> or message)
               =============================================================== */
            <div className="w-full flex flex-col animate-fade-in text-left">
              {/* Navigation & Actions Top Bar */}
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E3D4BC]/80">
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#1F1A14] hover:text-[#0D224A] bg-transparent p-0 transition-colors cursor-pointer active:scale-95"
                  title={selectedLang === 'EN' ? 'Back to messages' : 'Volver a la lista'}
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.4]" />
                  <span>{selectedLang === 'EN' ? 'Back to messages' : 'Volver a mensajes'}</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Star */}
                  <button
                    type="button"
                    onClick={() => handleToggleStar(selectedEmail.id)}
                    title={selectedEmail.isStarred ? (selectedLang === 'EN' ? 'Starred' : 'Destacado') : (selectedLang === 'EN' ? 'Star message' : 'Destacar')}
                    className="p-1.5 rounded-lg text-[#554C3E] hover:text-amber-500 hover:bg-[#EFE3CF]/60 transition-colors cursor-pointer"
                  >
                    <Star className={`w-4.5 h-4.5 ${selectedEmail.isStarred ? 'fill-amber-400 text-amber-500 stroke-[1.8]' : 'stroke-[1.8]'}`} />
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
                  <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 text-[#1F1A14]">
                    <GraduationCap className="w-6 h-6 stroke-[1.8] text-[#1F1A14]" />
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

              {/* Full Email Formatted Body */}
              <div className="p-4 sm:p-6 bg-white rounded-2xl border border-[#E3D4BC]/60 shadow-xs text-xs sm:text-[13.5px] text-[#2A241C] leading-relaxed whitespace-pre-line mb-4 font-normal">
                {selectedEmail.body}
              </div>

              {/* Attached Files Section if present */}
              {selectedEmail.attachment && (
                <div className="mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7062] mb-1.5 block">
                    {selectedLang === 'EN' ? 'Attachment (1 file)' : 'Archivo adjunto (1 archivo)'}
                  </span>
                  <div 
                    onClick={(e) => handleDownloadAttachment(e, selectedEmail.attachment!)}
                    className="bg-white rounded-xl border border-[#E3D4BC]/70 shadow-xs p-3 inline-flex items-center gap-3 transition-all hover:border-[#1F1A14] hover:shadow-md cursor-pointer group max-w-full sm:max-w-md"
                  >
                    <div className="bg-[#E53935] text-white text-[10px] font-extrabold px-2 py-1.5 rounded-md tracking-wider flex items-center justify-center font-mono shrink-0 shadow-xs">
                      {selectedEmail.attachment.type.toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-xs sm:text-[13px] text-[#1F1A14] truncate group-hover:text-[#0D224A]">
                        {selectedEmail.attachment.name}
                      </span>
                      <span className="text-[11px] text-[#7A7062]">
                        {selectedEmail.attachment.size || (selectedLang === 'EN' ? 'Click to open' : 'Clic para abrir')}
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-[#7A7062] group-hover:text-[#1F1A14] transition-colors" />
                  </div>
                </div>
              )}

              {/* Thread Replies Section */}
              {selectedEmail.replies && selectedEmail.replies.length > 0 && (
                <div className="mb-5 space-y-3">
                  {selectedEmail.replies.map((reply) => {
                    const isUserStudent = reply.isStudent;
                    return (
                      <div
                        key={reply.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs text-left transition-all animate-fade-in ${
                          isUserStudent
                            ? 'bg-[#F2E8D8] border-[#DEC7A3] ml-3 sm:ml-8'
                            : 'bg-white border-[#E3D4BC]/80 mr-3 sm:mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#E3D4BC]/50">
                          <div className="flex items-center gap-2">
                            {isUserStudent ? (
                              <User className="w-4 h-4 text-[#1F1A14] stroke-[2] shrink-0" />
                            ) : (
                              <GraduationCap className="w-4.5 h-4.5 text-[#1F1A14] stroke-[2] shrink-0" />
                            )}
                            <span className="text-xs sm:text-[13px] font-bold text-[#1F1A14]">
                              {reply.sender}
                            </span>
                          </div>
                          <span className="text-[10px] sm:text-[11px] text-[#7A7062] font-mono shrink-0">
                            {formatSimpleDate(reply.fullDate, reply.date)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-[#2A241C] leading-relaxed whitespace-pre-line pl-1 font-normal">
                          {reply.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Toast Notification when reply is sent or teacher responds */}
              {replyNotice && (
                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center justify-between gap-2 animate-fade-in shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{replyNotice}</span>
                  </div>
                  <button type="button" onClick={() => setReplyNotice(null)} className="cursor-pointer text-emerald-700 hover:text-emerald-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Inline Interactive Reply Composer */}
              <div id="email-reply-composer" className="bg-white rounded-2xl border border-[#DEC7A3] shadow-xs p-4 sm:p-5 text-left mb-4">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E3D4BC]/60">
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-[#1F1A14]">
                    <Reply className="w-4 h-4 text-[#DEC7A3]" strokeWidth={2.4} />
                    <span>
                      {selectedLang === 'EN' ? `Reply to ${selectedEmail.sender}` : `Responder a ${selectedEmail.sender}`}
                    </span>
                    <span className="text-[#7A7062] font-normal text-[11px] hidden sm:inline truncate max-w-[240px]">
                      — Re: {selectedEmail.subject || selectedEmail.preview}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7A7062] font-mono">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Federico Sandoval'}
                  </span>
                </div>

                <form onSubmit={handleSendEmailReply} className="flex flex-col gap-2.5">
                  <textarea
                    ref={replyTextareaRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      selectedLang === 'EN'
                        ? `Write your response to ${selectedEmail.sender}...`
                        : `Escribe tu respuesta a ${selectedEmail.sender}...`
                    }
                    rows={3}
                    className="w-full p-3 text-xs sm:text-[13.5px] text-[#1F1A14] bg-[#FAF5EB]/60 focus:bg-white rounded-xl border border-[#E3D4BC] focus:border-[#1F1A14] outline-none resize-none font-sans leading-relaxed transition-all placeholder-[#8A8072]"
                  />

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                    <span className="text-[11px] text-[#7A7062]">
                      {selectedLang === 'EN' ? 'Press Send Reply to post to this thread' : 'Presiona Enviar Respuesta para publicar en este hilo'}
                    </span>

                    <div className="flex items-center gap-2">
                      {replyText.trim() && (
                        <button
                          type="button"
                          onClick={() => setReplyText('')}
                          className="px-3 py-1.5 text-xs text-[#7A7062] hover:text-[#1F1A14] transition-colors cursor-pointer"
                        >
                          {selectedLang === 'EN' ? 'Discard' : 'Descartar'}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={!replyText.trim() || isSendingReply}
                        className="px-4 py-2 bg-[#DEC7A3] hover:bg-[#D5BF9A] disabled:opacity-40 text-[#1F1A14] font-bold text-xs sm:text-[13px] rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>
                          {isSendingReply
                            ? (selectedLang === 'EN' ? 'Sending...' : 'Enviando...')
                            : (selectedLang === 'EN' ? 'Send Reply' : 'Enviar Respuesta')}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 bg-white hover:bg-neutral-50 text-[#1F1A14] font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer border border-[#DEC7A3] shadow-2xs inline-flex items-center gap-2 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{selectedLang === 'EN' ? 'Back to all messages' : 'Volver a todos los mensajes'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ===============================================================
               MESSAGE LIST VIEW
               =============================================================== */
            <>
              {/* Message List - Dividers eliminated as requested */}
              <div className="flex flex-col w-full space-y-3 sm:space-y-4 min-h-[360px]">
                {currentMessages.length === 0 ? (
                  <div className="py-16 text-center text-sm text-[#7A7062]">
                    {selectedLang === 'EN' ? 'No messages in this channel.' : 'No hay mensajes en este canal.'}
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    return (
                      <div
                        key={msg.id}
                        onClick={() => {
                          handleMessageClick(msg);
                          setSelectedEmail(msg);
                        }}
                        className="py-1 transition-colors cursor-pointer text-left w-full rounded-lg hover:bg-[#FAF0DE]/50 px-1"
                      >
                        {/* Top Row: Options (Star, >>, Reply, Trash) + Unread Dot + Headline + Date */}
                        <div className="flex items-start justify-between gap-2.5 sm:gap-3 w-full group/row">
                          <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                            {/* Beginning of message options: Star, Double Arrow, Reply, Garbage Can */}
                            <div 
                              className="flex items-center gap-1.5 sm:gap-2 shrink-0 pt-0.5" 
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* 1. Star */}
                              <button
                                type="button"
                                onClick={() => handleToggleStar(msg.id)}
                                title={msg.isStarred ? (selectedLang === 'EN' ? 'Starred' : 'Destacado') : (selectedLang === 'EN' ? 'Star message' : 'Destacar mensaje')}
                                className="transition-colors p-0.5 rounded cursor-pointer"
                              >
                                <Star className={`w-4 h-4 transition-transform hover:scale-110 active:scale-90 ${msg.isStarred ? 'fill-amber-400 text-amber-500 stroke-[1.8]' : 'text-[#554C3E] hover:text-amber-500 stroke-[1.8]'}`} />
                              </button>

                              {/* 2. Double Arrow (ChevronsRight >>) - View full email */}
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

                              {/* 3. Reply Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMessageClick(msg);
                                  setSelectedEmail(msg);
                                  setTimeout(() => {
                                    replyTextareaRef.current?.focus();
                                    replyTextareaRef.current?.scrollIntoView({ behavior: 'smooth' });
                                  }, 150);
                                }}
                                title={selectedLang === 'EN' ? 'Reply to this message' : 'Responder a este mensaje'}
                                aria-label={selectedLang === 'EN' ? 'Reply to this message' : 'Responder a este mensaje'}
                                className="transition-colors p-0.5 rounded cursor-pointer hover:bg-[#EFE3CF]/80 text-[#554C3E] hover:text-[#0D224A]"
                              >
                                <Reply className="w-4 h-4 transition-transform hover:scale-125 active:scale-90 text-[#4A4237] hover:text-[#0D224A] stroke-[2]" />
                              </button>

                              {/* 4. Garbage Can (Trash2) */}
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                title={selectedLang === 'EN' ? 'Delete message' : 'Eliminar mensaje'}
                                className="text-[#554C3E] hover:text-[#D32F2F] transition-colors p-0.5 rounded cursor-pointer hover:scale-110 active:scale-90"
                              >
                                <Trash2 className="w-4 h-4 stroke-[1.8]" />
                              </button>
                            </div>

                            {/* Red Dot Unread Indicator */}
                            {msg.isUnread ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F] shrink-0 mt-1.5 inline-block shadow-xs" title={selectedLang === 'EN' ? 'Unread' : 'No leído'} />
                            ) : null}

                            <div className="flex flex-col min-w-0 flex-1">
                              {/* Main headline text */}
                              <span className={`text-[14px] sm:text-[15.5px] leading-snug ${msg.isUnread ? 'font-bold text-[#1F1A14]' : 'font-normal text-[#2A241C]'}`}>
                                {msg.preview}
                              </span>

                              {/* Subtitle text if present */}
                              {msg.subtitle && (
                                <span className="text-[12.5px] sm:text-[13px] text-[#4A4237] mt-0.5 leading-snug">
                                  {msg.subtitle}
                                </span>
                              )}

                              {/* Thread reply counter badge */}
                              {msg.replies && msg.replies.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C5042] bg-[#EFE3CF] px-2 py-0.5 rounded-full shadow-2xs">
                                    <MessageSquare className="w-3 h-3 text-[#554C3E]" />
                                    <span>
                                      {msg.replies.length}{' '}
                                      {msg.replies.length === 1
                                        ? (selectedLang === 'EN' ? 'reply' : 'respuesta')
                                        : (selectedLang === 'EN' ? 'replies' : 'respuestas')}
                                    </span>
                                  </span>
                                </div>
                              )}

                              {/* Small inline attachment preview */}
                              {msg.attachment && !msg.attachment.size && (
                                <div 
                                  onClick={(e) => handleDownloadAttachment(e, msg.attachment!)}
                                  className="flex items-center gap-1.5 text-xs text-[#2A241C] hover:text-[#0D224A] hover:underline mt-1 font-medium transition-colors"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-[#554C3E] stroke-[2] shrink-0" />
                                  <span>{msg.attachment.name}</span>
                                </div>
                              )}

                              {/* Rich PDF Card */}
                              {msg.attachment && msg.attachment.size && (
                                <div 
                                  onClick={(e) => handleDownloadAttachment(e, msg.attachment!)}
                                  className="bg-white rounded-xl shadow-xs p-2.5 sm:p-3 inline-flex items-center gap-3 mt-2 max-w-full sm:max-w-md transition-transform hover:scale-[1.01] cursor-pointer"
                                >
                                  {/* Red PDF Badge */}
                                  <div className="bg-[#E53935] text-white text-[10px] font-extrabold px-1.5 py-1 rounded-md tracking-wider flex items-center justify-center font-mono shrink-0 shadow-xs">
                                    PDF
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-bold text-xs sm:text-[13px] text-[#1F1A14] truncate">
                                      {msg.attachment.name}
                                    </span>
                                    <span className="text-[11px] text-[#7A7062]">
                                      {msg.attachment.size}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Date in DD/MM/YY format */}
                          <span className="text-xs sm:text-[13.5px] font-medium text-[#2A241C] shrink-0 mt-0.5 ml-2">
                            {msg.date}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Floating White Pill Input Bar - Outline border removed as requested */}
              {activeTab !== 'anuncios' ? (
                <form onSubmit={handleSendMessage} className="mt-5 w-full">
                  <div className="bg-white rounded-full px-5 py-3 sm:py-3.5 border-0 shadow-sm flex items-center gap-3 w-full">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={selectedLang === 'EN' ? 'Write your message...' : 'Escribe tu mensaje...'}
                      className="flex-1 bg-transparent text-[14px] sm:text-[15px] text-[#1F1A14] placeholder-[#8A8072] outline-none font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="cursor-pointer transition-opacity disabled:opacity-40 p-1 flex items-center justify-center active:scale-95"
                      title={selectedLang === 'EN' ? 'Send message' : 'Enviar mensaje'}
                      aria-label={selectedLang === 'EN' ? 'Send message' : 'Enviar mensaje'}
                    >
                      <YellowPaperPlane />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-5 px-4 py-3 bg-[#EFE7D8]/80 rounded-full text-center border-0 shadow-xs">
                  <span className="text-xs text-[#6B5F4E] font-medium">
                    {selectedLang === 'EN'
                      ? 'Official announcements are read-only'
                      : 'Canal oficial de avisos solo lectura'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
