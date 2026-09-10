import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ShieldCheck, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Zap, 
  Cpu, 
  HelpCircle, 
  Trash2, 
  MessageSquare,
  Award,
  Globe2,
  Lock,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { AdminRoleSwitcherBar } from './AdminRoleSwitcherBar';
import { useAdminRoleSim } from '../services/adminRoleSimProvider';

interface AdminChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  category?: 'finance' | 'students' | 'teachers' | 'ai_system' | 'strategy' | 'general';
  dataCard?: {
    title: string;
    metrics: { label: string; value: string; trend?: string }[];
  };
}

interface AdminChatPanelProps {
  selectedLang: 'EN' | 'ES';
  onNavigateTab?: (tab: string) => void;
  onAskVoyager?: (text: string) => void;
  isConnected?: boolean;
}

const INITIAL_ADMIN_KNOWLEDGE_MESSAGES: Record<'EN' | 'ES', AdminChatMessage[]> = {
  ES: [
    {
      id: 'admin_welcome_es',
      sender: 'assistant',
      text: '¡Hola, Federico! Bienvenido al Canal de Consulta Ejecutiva sobre Administración de USA Voyager. Estoy listo para ayudarte con análisis de ingresos, retención de estudiantes, métricas de docentes, estado del motor Gemini Live y decisiones estratégicas de la plataforma.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
      dataCard: {
        title: '📊 ESTADO GENERAL DE LA PLATAFORMA',
        metrics: [
          { label: 'Ingresos Totales', value: '$18,440 USD', trend: '+18% este mes' },
          { label: 'Estudiantes Activos', value: '1,248 Alumnos', trend: '73.4% Dominio Cívica' },
          { label: 'Citas La Profe ($29)', value: '38% Conversión', trend: '2 Pendientes' },
          { label: 'Gemini Live (Puck)', value: '99.8% Uptime', trend: '~320ms Latencia' }
        ]
      }
    }
  ],
  EN: [
    {
      id: 'admin_welcome_en',
      sender: 'assistant',
      text: 'Hello, Federico! Welcome to the USA Voyager Executive Admin Intelligence Chat. I am ready to assist you with revenue breakdowns, student retention, teacher analytics, Gemini Live API system status, and platform business strategy.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
      dataCard: {
        title: '📊 PLATFORM EXECUTIVE METRICS SUMMARY',
        metrics: [
          { label: 'Total Revenue', value: '$18,440 USD', trend: '+18% MoM' },
          { label: 'Active Students', value: '1,248 Learners', trend: '73.4% Civics Mastery' },
          { label: 'La Profe Diagnostics ($29)', value: '38% Conversion', trend: '2 Pending Slots' },
          { label: 'Gemini Live (Puck)', value: '99.8% Uptime', trend: '~320ms Latency' }
        ]
      }
    }
  ]
};

export const AdminChatPanel: React.FC<AdminChatPanelProps> = ({
  selectedLang,
  onNavigateTab,
  onAskVoyager,
  isConnected = false
}) => {
  const isEn = selectedLang === 'EN';
  const [simulatedRole] = useAdminRoleSim();
  const [messages, setMessages] = useState<AdminChatMessage[]>(() => INITIAL_ADMIN_KNOWLEDGE_MESSAGES[selectedLang]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Executive knowledge prompt presets
  const ADMIN_TOPIC_CHIPS = [
    {
      id: 'revenue',
      labelEn: '💰 Revenue & ARPU Breakdown',
      labelEs: '💰 Desglose de Ingresos y ARPU',
      queryEn: 'Can you give me a full breakdown of revenue by country, active subscription plans, and average revenue per user (ARPU)?',
      queryEs: '¿Puedes darme un desglose completo de ingresos por país, planes de suscripción activos y el ingreso promedio por usuario (ARPU)?'
    },
    {
      id: 'students',
      labelEn: '🎓 Student Civics 128 Retention',
      labelEs: '🎓 Retención y Cívica 128',
      queryEn: 'What are the current student retention metrics, streak averages, and mastery levels for the Civics 128 naturalization questions?',
      queryEs: '¿Cuáles son las métricas actuales de retención de estudiantes, promedio de racha y niveles de dominio en las 128 preguntas de Cívica?'
    },
    {
      id: 'teachers',
      labelEn: '👩‍🏫 La Profe Diagnostics & ROI',
      labelEs: '👩‍🏫 Citas La Profe $29 y Conversión',
      queryEn: 'How are the $29 USD 1-on-1 diagnostic sessions performing, and what is the conversion rate to the $199/mo Teacher VIP package?',
      queryEs: '¿Cómo están rindiendo las citas diagnósticas de $29 USD 1-a-1 con La Profe y cuál es la tasa de conversión al paquete VIP de $199/mes?'
    },
    {
      id: 'ai_engine',
      labelEn: '⚡ Gemini Live API & Voice Engine',
      labelEs: '⚡ Motor IA Gemini Live y Latencia',
      queryEn: 'Explain the technical architecture of the AI voice engine, including Gemini Live Puck voice parameters, latency, and Firestore sync.',
      queryEs: 'Explica la arquitectura técnica del motor de voz IA, incluyendo los parámetros de la voz Puck de Gemini Live, latencia y sincronización con Firestore.'
    },
    {
      id: 'latam_strategy',
      labelEn: '🌎 LATAM Scaling Strategy',
      labelEs: '🌎 Estrategia de Expansión LATAM',
      queryEn: 'What are the recommended top 3 executive strategies to double our student base in Mexico, Colombia, and Costa Rica?',
      queryEs: '¿Cuáles son las 3 principales estrategias ejecutivas recomendadas para duplicar la base de alumnos en México, Colombia y Costa Rica?'
    },
    {
      id: 'security_rules',
      labelEn: '🛡️ Security Rules & Role RBAC',
      labelEs: '🛡️ Reglas de Seguridad y Permisos',
      queryEn: 'How are user roles (Admin, Student, Teacher) and Firestore security rules enforced across the platform?',
      queryEs: '¿Cómo están estructurados los roles de usuario (Admin, Estudiante, Profesor) y las reglas de seguridad de Firestore en la plataforma?'
    }
  ];

  const handleSendMessage = (textToSend?: string) => {
    const rawText = textToSend || inputText;
    if (!rawText.trim()) return;

    const userMsg: AdminChatMessage = {
      id: `admin_msg_${Date.now()}`,
      sender: 'user',
      text: rawText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // If live voice is active, also trigger Voyager voice response
    if (onAskVoyager && isConnected) {
      onAskVoyager(`[ADMIN CONSULTANT QUERY: ${rawText.trim()}]`);
    }

    setTimeout(() => {
      const response = generateAdminKnowledgeResponse(rawText, selectedLang, simulatedRole);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 800);
  };

  const handleClearChat = () => {
    setMessages([INITIAL_ADMIN_KNOWLEDGE_MESSAGES[selectedLang][0]]);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white h-full overflow-hidden animate-fade-in relative">
      {/* TOP HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                {isEn ? 'ADMIN KNOWLEDGE AI CONSULTANT' : 'CONSULTOR DE CONOCIMIENTO Y ADMINISTRACIÓN'}
              </h2>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-bold uppercase tracking-widest hidden sm:inline-block">
                {isEn ? 'EXECUTIVE ACCESS' : 'ACCESO EJECUTIVO'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {isEn 
                ? 'Dedicated exclusively to USA Voyager business intelligence, revenue, student metrics & system specs.' 
                : 'Canal dedicado exclusivamente a inteligencia de negocios, ingresos, métricas de alumnos y arquitectura de USA Voyager.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearChat}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title={isEn ? 'Reset Chat' : 'Reiniciar Chat'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEn ? 'Clear Session' : 'Limpiar Chat'}</span>
          </button>
        </div>
      </div>

      {/* MODULAR ROLE SWITCHER BAR */}
      <div className="px-4 pt-3 bg-slate-950 shrink-0">
        <AdminRoleSwitcherBar selectedLang={selectedLang} onNavigateTab={onNavigateTab} />
      </div>

      {/* MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 min-h-0">
        {/* EXCLUSIVE ADMIN SCOPE NOTICE */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wide text-amber-300">
              {isEn ? 'EXCLUSIVE ADMIN DOMAIN SCOPE: ' : 'ALCANCE EXCLUSIVO DEL CANAL DE ADMINISTRACIÓN: '}
            </span>
            <span>
              {isEn 
                ? 'This chat answers questions regarding USA Voyager business economics, student retention, teacher diagnostic ROI, Firestore schemas, and Gemini Live AI voice parameters.' 
                : 'Este chat responde preguntas sobre economía de negocio, retención de alumnos, retorno de citas diagnósticas, esquemas Firestore y parámetros de voz de Gemini Live.'}
            </span>
          </div>
        </div>

        {/* CHAT MESSAGES LIST */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                  isUser
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-gradient-to-br from-[#0D224A] to-blue-900 text-amber-300 border border-amber-400/40'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-amber-400 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1.5 text-[10px] opacity-75 font-mono">
                  <span className="font-bold uppercase tracking-wider">
                    {isUser ? (isEn ? 'Administrator' : 'Administrador') : (isEn ? 'Executive AI Advisor' : 'Asesor IA Ejecutivo')}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <p className="whitespace-pre-line">{msg.text}</p>

                {/* DATA METRICS CARD IF INCLUDED */}
                {msg.dataCard && (
                  <div className="mt-3.5 bg-slate-950/80 border border-amber-400/30 rounded-xl p-3 text-white space-y-2">
                    <div className="text-[11px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{msg.dataCard.title}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {msg.dataCard.metrics.map((m, idx) => (
                        <div key={idx} className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase truncate">{m.label}</span>
                          <span className="text-xs font-black text-amber-300 block">{m.value}</span>
                          {m.trend && <span className="text-[9.5px] font-bold text-emerald-400 block">{m.trend}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold pl-11 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isEn ? 'Consulting Voyager Executive Data Engine...' : 'Consultando Motor de Datos Ejecutivos Voyager...'}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* TOPIC CHIPS SUGGESTIONS */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 shrink-0">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{isEn ? 'ADMIN KNOWLEDGE TOPIC SHORTCUTS:' : 'TEMAS RELEVANTES DE ADMINISTRACIÓN:'}</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ADMIN_TOPIC_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleSendMessage(isEn ? chip.queryEn : chip.queryEs)}
              className="bg-slate-800 hover:bg-slate-700 hover:border-amber-400/50 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 transition-all font-semibold whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>{isEn ? chip.labelEn : chip.labelEs}</span>
              <ChevronRight className="w-3 h-3 text-amber-400 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* INPUT FORM */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isEn
              ? 'Ask anything about revenue, students, teachers, or platform specs...'
              : 'Pregunta sobre ingresos, alumnos, docentes o especificaciones del sistema...'
          }
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-400 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none transition-all placeholder:text-slate-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <span>{isEn ? 'Send' : 'Enviar'}</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

// Knowledge base logic generator
function generateAdminKnowledgeResponse(query: string, lang: 'EN' | 'ES', roleSim: string): AdminChatMessage {
  const q = query.toLowerCase();
  const isEn = lang === 'EN';
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Irrelevant or generic subject check
  const isGeneralLanguageQuery = q.includes('how do you say') || q.includes('como se dice') || q.includes('translate') || q.includes('grammar') || q.includes('english lesson');
  if (isGeneralLanguageQuery) {
    return {
      id: `admin_ans_${Date.now()}`,
      sender: 'assistant',
      text: isEn 
        ? '⚠️ Notice: As the USA Voyager Executive Admin Consultant, this chat channel is reserved exclusively for platform administration, business metrics, student diagnostics, and AI architecture. For general English language practice, please switch to the main CHARLA or Student Roadmap section.'
        : '⚠️ Nota: Como Consultor Ejecutivo de Administración de USA Voyager, este canal está reservado exclusivamente para métricas de negocio, administración de la plataforma, diagnósticos de alumnos y arquitectura de IA. Para práctica general de inglés, te sugiero pasar a la sección CHARLA o Ruta de Aprendizaje.',
      timestamp: nowStr,
      category: 'general'
    };
  }

  // Revenue / Finanzas Query
  if (q.includes('ingreso') || q.includes('revenue') || q.includes('arpu') || q.includes('venta') || q.includes('precio') || q.includes('finan')) {
    return {
      id: `admin_ans_${Date.now()}`,
      sender: 'assistant',
      text: isEn
        ? `📈 **REVENUE & FINANCIAL ECONOMICS REPORT:**\n\nTotal Monthly Revenue currently stands at **$18,440 USD** across 1,248 active subscribers. The dominant regional contributor is the **USA Hispanic Community (42% / $7,749 USD)**, followed by **Mexico (24% / $4,428 USD)** and **Colombia (18% / $3,321 USD)**.\n\n• Average Revenue Per User (ARPU): **$14.77 USD/mo**\n• Conversion Rate from Free Visitor to Paid Tier: **22.4%**\n• Recommended Next Step: Expand local marketing campaigns targeting USCIS applicants in Florida, Texas, and California.`
        : `📈 **INFORME DE INGRESOS Y ECONOMÍA FINANCIERA:**\n\nEl ingreso mensual total asciende actualmente a **$18,440 USD** distribuidos entre 1,248 suscriptores activos. El mercado dominante es la **Comunidad Hispana en EEUU (42% / $7,749 USD)**, seguida por **México (24% / $4,428 USD)** y **Colombia (18% / $3,321 USD)**.\n\n• Ingreso Promedio por Usuario (ARPU): **$14.77 USD/mes**\n• Tasa de Conversión de Visitante Gratuito a Plan de Pago: **22.4%**\n• Recomendación Estratégica: Intensificar campañas digitales dirigidas a aspirantes a la ciudadanía de USCIS en Florida, Texas y California.`,
      timestamp: nowStr,
      category: 'finance',
      dataCard: {
        title: isEn ? 'GEOGRAPHIC REVENUE BREAKDOWN' : 'DESGLOSE DE INGRESOS REGIONALES',
        metrics: [
          { label: 'EEUU (42%)', value: '$7,749 USD', trend: 'Dominante' },
          { label: 'México (24%)', value: '$4,428 USD', trend: '+14% MoM' },
          { label: 'Colombia (18%)', value: '$3,321 USD', trend: '+22% MoM' },
          { label: 'Costa Rica (9%)', value: '$1,660 USD', trend: 'Estable' }
        ]
      }
    };
  }

  // Students / Civics 128 Query
  if (q.includes('estudiante') || q.includes('student') || q.includes('cívica') || q.includes('civics') || q.includes('retención') || q.includes('racha')) {
    return {
      id: `admin_ans_${Date.now()}`,
      sender: 'assistant',
      text: isEn
        ? `🎓 **STUDENT ACADEMIC & CIVICS 128 DIAGNOSTIC:**\n\nOut of **1,248 active learners**, student mastery across the 128 USCIS Civics Questions averages **73.4% (94 questions mastered)**. The average active learning streak is **14 days**.\n\n• Top Performing Category: *System of Government* (84% correct)\n• Category Requiring Review: *American History 1800s & Recent History* (58% correct)\n• Active Study Mode Preference: 64% Audio Practice with Voyager Voice (Puck), 36% Text Cards.`
        : `🎓 **DIAGNÓSTICO ACADÉMICO Y CÍVICA 128 DE ESTUDIANTES:**\n\nDe un total de **1,248 alumnos activos**, el dominio promedio en las 128 Preguntas Cívicas de USCIS es del **73.4% (94 preguntas dominadas)**. La racha promedio de estudio activo es de **14 días consecutivos**.\n\n• Categoría con Mayor Puntaje: *Sistema de Gobierno* (84% de aciertos)\n• Categoría que Requiere Refuerzo: *Historia Americana Siglo XIX y Reciente* (58% de aciertos)\n• Modalidad de Estudio Preferida: 64% Práctica por Voz con Voyager (Puck), 36% Tarjetas de Texto.`,
      timestamp: nowStr,
      category: 'students',
      dataCard: {
        title: isEn ? 'STUDENT RETENTION & CIVICS MASTERY' : 'RETENCIÓN Y DOMINIO DE CÍVICA 128',
        metrics: [
          { label: 'Alumnos Activos', value: '1,248', trend: 'Base Completa' },
          { label: 'Dominio Cívica', value: '73.4%', trend: '94/128 Preguntas' },
          { label: 'Racha Promedio', value: '14 Días', trend: 'Estudiantes Fieles' },
          { label: 'Voz vs Texto', value: '64% / 36%', trend: 'Preferencia Voz' }
        ]
      }
    };
  }

  // Teacher / La Profe Query
  if (q.includes('docente') || q.includes('profes') || q.includes('teacher') || q.includes('cita') || q.includes('$29') || q.includes('la profe')) {
    return {
      id: `admin_ans_${Date.now()}`,
      sender: 'assistant',
      text: isEn
        ? `👩‍🏫 **TEACHER MODULE & $29 DIAGNOSTIC PERFORMANCE:**\n\nThe **1-on-1 Diagnostic Booking ($29 USD)** acts as our primary high-touch conversion funnel. Current diagnostics show a **38% conversion rate** from the initial $29 diagnostic session into the **$199/mo Teacher VIP Subscription**.\n\n• Active Diagnostic Requests: 2 pending slots scheduled\n• Primary Phonetic Challenge Identifiers: /v/ vs /b/ articulation and vowel duration in USCIS interview phrases\n• Voice Persona Assignment: Puck (Gemini Live API) configured with clear American English pronunciation.`
        : `👩‍🏫 **RENDIMIENTO DEL MÓDULO DOCENTE Y CITAS $29:**\n\nLa **Cita Diagnóstica 1-a-1 de $29 USD** funciona como nuestro embudo principal de alta conversión. Las métricas actuales muestran una **tasa de conversión del 38%** desde la cita inicial de $29 hacia la **Suscripción VIP de Profesor de $199/mes**.\n\n• Solicitudes Diagnósticas Activas: 2 citas agendadas pendientes\n• Desafíos Fonéticos Principales: Articulación /v/ vs /b/ y longitud vocálica en frases clave de la entrevista de USCIS\n• Asignación de Voz: Puck (Gemini Live API) configurado con dicción y cadencia nativa americana.`,
      timestamp: nowStr,
      category: 'teachers',
      dataCard: {
        title: isEn ? 'LA PROFE DIAGNOSTICS & VIP CONVERSION' : 'DIAGNÓSTICOS LA PROFE Y CONVERSIÓN VIP',
        metrics: [
          { label: 'Precio Cita', value: '$29 USD', trend: 'Sesión 1-a-1' },
          { label: 'Conversión VIP', value: '38%', trend: 'A Plan $199/mes' },
          { label: 'Citas Pendientes', value: '2 Slots', trend: 'Pago Confirmado' },
          { label: 'Voz Docente', value: 'Puck Live', trend: 'Acento Nativo' }
        ]
      }
    };
  }

  // AI / System Query
  if (q.includes('gemini') || q.includes('live api') || q.includes('puck') || q.includes('latencia') || q.includes('sistema') || q.includes('firestore') || q.includes('ai')) {
    return {
      id: `admin_ans_${Date.now()}`,
      sender: 'assistant',
      text: isEn
        ? `⚡ **AI SYSTEM ARCHITECTURE & GEMINI LIVE PARAMETERS:**\n\nUSA Voyager operates a full-stack real-time architecture utilizing the **@google/genai TypeScript SDK** with full server-side API proxy protection.\n\n• Primary Voice Persona: **Puck** (Male Gemini Live Audio Model)\n• WebSockets / Live API Latency: **~320ms average response time**\n• Database Persistence: Google Cloud Firestore (\`ai-studio-voyagervoiceagen-69901a8c-3a3c-4b6a-9ddc-8e4c40cca951\`)\n• Security Rules: Role-Based Access Control (RBAC) enforcing document isolation per user UID.`
        : `⚡ **ARQUITECTURA DEL SISTEMA IA Y PARÁMETROS GEMINI LIVE:**\n\nUSA Voyager opera una arquitectura de pila completa en tiempo real utilizando el **SDK @google/genai en TypeScript** con protección de proxy en el servidor.\n\n• Persona de Voz Principal: **Puck** (Modelo Gemini Live de Audio Masculino)\n• Latencia de WebSockets / Live API: **~320ms promedio**\n• Base de Datos Persistente: Google Cloud Firestore (\`ai-studio-voyagervoiceagen-69901a8c-3a3c-4b6a-9ddc-8e4c40cca951\`)\n• Reglas de Seguridad: Control de Acceso Basado en Roles (RBAC) con aislamiento de documentos por UID de usuario.`,
      timestamp: nowStr,
      category: 'ai_system',
      dataCard: {
        title: isEn ? 'VOICE ENGINE & FIRESTORE STATUS' : 'ESTADO DEL MOTOR DE VOZ Y FIRESTORE',
        metrics: [
          { label: 'Modelo de Voz', value: 'Puck (Gemini)', trend: 'Masculino Nativo' },
          { label: 'Latencia Promedio', value: '~320ms', trend: 'Excelente Tiempo Real' },
          { label: 'Base de Datos', value: 'Firestore DB', trend: 'Sincronizado' },
          { label: 'Seguridad', value: 'RBAC Strict', trend: 'Doc Isolation' }
        ]
      }
    };
  }

  // Fallback Admin Subject Response
  return {
    id: `admin_ans_${Date.now()}`,
    sender: 'assistant',
    text: isEn
      ? `🏛️ **EXECUTIVE CONSULTANT ANALYSIS FOR "${query}":**\n\nAs your USA Voyager Business Intelligence AI, I have processed your administrative query. \n\n• Current System Context: Operating in ${roleSim === 'admin' ? 'Full Super Admin Mode' : `Simulated ${roleSim.toUpperCase()} View`}\n• Key Insight: All student progress, diagnostic appointments, and financial transactions are synchronized in real-time with Firestore.\n• Actionable Recommendation: Maintain current focus on Civics 128 question completion rates while leveraging the $29 La Profe diagnostic funnel to drive high-margin VIP tier growth.`
      : `🏛️ **ANÁLISIS DEL CONSULTOR EJECUTIVO PARA "${query}":**\n\nComo tu IA de Inteligencia de Negocios de USA Voyager, he procesado tu consulta administrativa.\n\n• Contexto del Sistema: Operando en ${roleSim === 'admin' ? 'Modo Super Administrador Completo' : `Vista Simulada de ${roleSim.toUpperCase()}`}\n• Hallazgo Clave: Todo el progreso de los alumnos, citas diagnósticas y transacciones financieras se sincronizan en tiempo real con Firestore.\n• Recomendación Ejecutiva: Mantener el enfoque en la tasa de finalización de Cívica 128 mientras se aprovecha el embudo diagnósticos de $29 con La Profe para impulsar suscripciones VIP de mayor margen.`,
    timestamp: nowStr,
    category: 'general'
  };
}
