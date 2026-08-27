import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SUGGESTIONS, IMMERSION_CURRICULUM } from '../constants';
import NycMap, { MapMarker, RouteInfo } from './NycMap';
import { NycSubwayMap } from './NycSubwayMap';
import { getAccessToken } from '../services/firebaseAuth';
import { parseAndRenderEmojis } from './VoyagerEmoji';

import { ProgressDashboard } from './ProgressDashboard';
import { RoadmapPanel } from './RoadmapPanel';
import { TeacherInsightsPanel } from './TeacherInsightsPanel';
import { SettingsPanel } from './SettingsPanel';
import { ShoppingPanel } from './ShoppingPanel';
import { Civics128Panel } from './Civics128Panel';
import { EnglishAssessment, AssessmentScores } from './EnglishAssessment';
import { ChatInputBox } from './ChatInputBox';
import { AuthModal } from './AuthModal';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';
import chatAvatarIcon from '../assets/images/voyager_pixel_avatar_1784465509169.jpg';
import { Mic, MicOff, Plus, Compass, MapPin, Languages, Sparkles, ArrowLeft, ArrowRight, Headphones, AudioLines, MessageSquare, User, Settings, Sliders, ShoppingBag, Globe, Apple, Home, Pause, Play, Square, Info, Shield, FileText, Bot, Eye, EyeOff, ShoppingCart, Briefcase, BookOpen, Luggage, Rocket, Check, UserCheck, Presentation, MessageSquareText, Plane, Sprout, Flower, TreeDeciduous, GraduationCap, Award, Mail, Menu, X, Power, Clock, Timer, AlarmClock, Trophy, Target, Volume2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2, HelpCircle, Send, RotateCw, ThumbsUp, ThumbsDown, Moon, Sun, Copy, VolumeX, MessageSquarePlus, SendHorizontal, Bookmark, BookmarkCheck, Trash2, Maximize, Minimize, Zap } from 'lucide-react';

import { ChatMessage, Lead, TravelDestination, PronunciationFeedbackEvent, ConversationEvent } from './LiveAgentTypes';
import { TRAVEL_PRESETS } from './TravelPresets';
import { translations, getTranslatedMessageText } from './Translations';
import { CONVERSATION_MODES, ConversationMode } from './ConversationModes';
import { useConversationEngine } from './useConversationEngine';
import { ConversationModePolicy } from '../domain/ConversationModePolicy';
import { CivicsExamTracker } from '../domain/CivicsExamTracker';
import { CivicsProgressTracker, QuestionMasteryStatus } from '../domain/CivicsProgressTracker';
import { ALL_CIVICS_128_QUESTIONS } from '../data/civics128Data';

const modeDetails = [
 {
 id: 'SPANISH',
 nameEs: 'Español',
 nameEn: 'Spanish',
 statusEs: 'MODO ESPAÑOL',
 statusEn: 'SPANISH MODE',
 descEs: 'Conversación puramente en español.',
 descEn: 'Conversation purely in Spanish.',
 icon: 'MessageSquare',
 tagEs: 'Español',
 tagEn: 'Spanish',
 bg: 'hover:bg-black/5'
 },
 {
 id: 'ADAPTIVE',
 nameEs: 'Adaptivo',
 nameEn: 'Adaptive',
 statusEs: 'MODO ADAPTIVO',
 statusEn: 'ADAPTIVE MODE',
 descEs: 'Ajusta dinámicamente el idioma, velocidad y apoyo según tus respuestas.',
 descEn: 'Dynamically adapts language, speed, and scaffolding based on your responses.',
 icon: 'Zap',
 tagEs: 'Flexibilidad Total',
 tagEn: 'Flexible Support',
 bg: 'hover:bg-black/5'
 },
 {
 id: 'BILINGUAL',
 nameEs: 'Bilingüe',
 nameEn: 'Bilingual',
 statusEs: 'MODO BILINGÜE',
 statusEn: 'BILINGUAL MODE',
 descEs: 'Responde primero en español y luego repite en inglés.',
 descEn: 'Responds first in Spanish, then repeats in English.',
 icon: 'Sparkles',
 tagEs: 'Recomendado',
 tagEn: 'Recommended',
 bg: 'hover:bg-black/5'
 },
 {
 id: 'AMERICAN_ENGLISH',
 nameEs: 'Inglés',
 nameEn: 'English',
 statusEs: 'MODO INGLÉS',
 statusEn: 'ENGLISH MODE',
 descEs: 'Responde y conversa estrictamente en inglés.',
 descEn: 'Responds and converses strictly in English.',
 icon: 'Compass',
 tagEs: 'Práctica Avanzada',
 tagEn: 'Advanced Practice',
 bg: 'hover:bg-black/5'
 },
 {
 id: 'LIVE_TRANSLATOR',
 nameEs: 'Traductor',
 nameEn: 'Translator',
 statusEs: 'MODO TRADUCTOR',
 statusEn: 'TRANSLATOR MODE',
 descEs: 'Traduce instantáneamente entre inglés y español.',
 descEn: 'Translates instantly between English and Spanish.',
 icon: 'Languages',
 tagEs: 'Traducción en vivo',
 tagEn: 'Live translation',
 bg: 'hover:bg-black/5'
 }
];

const getModeExplanationText = (mode: ConversationMode, lang: 'EN' | 'ES'): string => {
 if (lang === 'EN') {
 switch (mode) {
 case 'SPANISH':
 return "Spanish Mode. We will converse strictly in Spanish.";
 case 'ADAPTIVE':
 return "Adaptive Mode. I will dynamically adjust my language, speed, and support based on your responses.";
 case 'BILINGUAL':
 return "Bilingual Mode. I will respond to you in Spanish and repeat my answer in English to help you learn.";
 case 'AMERICAN_ENGLISH':
 return "English Immersion Mode. We will speak strictly in English. This is perfect for advanced practice!";
 case 'LIVE_TRANSLATOR':
 return "Translator Mode. Speak in either English or Spanish, and I will translate it instantly for you.";
 case 'LISTEN_ONLY':
 return "Listen Only Mode. I will listen to you and provide helpful tips and corrections in the text chat without speaking.";
 default:
 return "";
 }
 } else {
 switch (mode) {
 case 'SPANISH':
 return "Modo Español. Conversaremos estrictamente en español.";
 case 'ADAPTIVE':
 return "Modo Adaptativo. Ajustaré dinámicamente mi idioma, velocidad y apoyo según la fluidez de tus respuestas.";
 case 'BILINGUAL':
 return "Modo Bilingüe. Te responderé primero en español y luego repetiré la respuesta en inglés para ayudarte a aprender.";
 case 'AMERICAN_ENGLISH':
 return "Modo de Inmersión en Inglés. Hablaremos strictly en inglés. ¡Es perfecto para una práctica avanzada!";
 case 'LIVE_TRANSLATOR':
 return "Modo Traductor. Habla en inglés o español, y yo lo traducirá instantáneamente para ti.";
 case 'LISTEN_ONLY':
 return "Modo Escucha. Te escucharé y te daré consejos y correcciones por chat de texto sin interrumpirte hablando.";
 default:
 return "";
 }
 }
};

const sphereParticles = [
 { top: '15%', left: '32%', size: '1.5px', delay: '0s', duration: '1.2s' },
 { top: '18%', left: '68%', size: '2px', delay: '0.3s', duration: '1.5s' },
 { top: '28%', left: '22%', size: '1px', delay: '0.7s', duration: '1s' },
 { top: '22%', left: '48%', size: '2.5px', delay: '0.1s', duration: '1.8s' },
 { top: '32%', left: '78%', size: '1.5px', delay: '0.5s', duration: '1.3s' },
 { top: '42%', left: '18%', size: '2px', delay: '0.9s', duration: '1.6s' },
 { top: '38%', left: '46%', size: '1px', delay: '0.2s', duration: '1.1s' },
 { top: '48%', left: '62%', size: '2px', delay: '0.4s', duration: '1.4s' },
 { top: '52%', left: '28%', size: '1.5px', delay: '0.6s', duration: '1.2s' },
 { top: '58%', left: '82%', size: '1px', delay: '0.8s', duration: '1.7s' },
 { top: '68%', left: '22%', size: '2.5px', delay: '0.3s', duration: '1.9s' },
 { top: '62%', left: '52%', size: '1.5px', delay: '0s', duration: '1.3s' },
 { top: '72%', left: '72%', size: '2px', delay: '0.5s', duration: '1.5s' },
 { top: '78%', left: '38%', size: '1px', delay: '0.7s', duration: '1s' },
 { top: '72%', left: '18%', size: '1.5px', delay: '0.2s', duration: '1.2s' },
 { top: '82%', left: '58%', size: '2px', delay: '0.4s', duration: '1.4s' },
 
 // Extra dense particles for connected active state
 { top: '50%', left: '50%', size: '3px', delay: '0.1s', duration: '0.8s', connectedOnly: true },
 { top: '46%', left: '36%', size: '2px', delay: '0.5s', duration: '1.1s', connectedOnly: true },
 { top: '54%', left: '64%', size: '2.5px', delay: '0.2s', duration: '0.9s', connectedOnly: true },
 { top: '36%', left: '54%', size: '1.5px', delay: '0.7s', duration: '1.2s', connectedOnly: true },
 { top: '64%', left: '46%', size: '2px', delay: '0.3s', duration: '1s', connectedOnly: true },
 { top: '30%', left: '42%', size: '1px', delay: '0s', duration: '1.4s', connectedOnly: true },
 { top: '70%', left: '58%', size: '1.5px', delay: '0.6s', duration: '1.3s', connectedOnly: true },
 { top: '40%', left: '30%', size: '2px', delay: '0.8s', duration: '1.1s', connectedOnly: true },
 { top: '60%', left: '70%', size: '2.5px', delay: '0.4s', duration: '0.9s', connectedOnly: true },
 { top: '24%', left: '34%', size: '1px', delay: '0.5s', duration: '1.6s', connectedOnly: true },
 { top: '76%', left: '66%', size: '1.5px', delay: '0.1s', duration: '1.2s', connectedOnly: true },
];

const renderModeIcon = (iconName: string) => {
 switch (iconName) {
 case 'Zap':
 return <Zap className="w-5 h-5 text-amber-500" />;
 case 'Sparkles':
 return <Sparkles className="w-5 h-5 text-yellow-600" />;
 case 'Compass':
 case 'Languages':
 return <Languages className="w-5 h-5 text-emerald-600" />;
 case 'Headphones':
 return <Headphones className="w-5 h-5 text-purple-600" />;
 default:
 return <MessageSquare className="w-5 h-5 text-zinc-600" />;
 }
};

const countries = [
 { id: 'USA', nameEn: 'United States', nameEs: 'Estados Unidos' },
 { id: 'AR', nameEn: 'Argentina', nameEs: 'Argentina' },
 { id: 'BO', nameEn: 'Bolivia', nameEs: 'Bolivia' },
 { id: 'CL', nameEn: 'Chile', nameEs: 'Chile' },
 { id: 'CO', nameEn: 'Colombia', nameEs: 'Colombia' },
 { id: 'CR', nameEn: 'Costa Rica', nameEs: 'Costa Rica' },
 { id: 'CU', nameEn: 'Cuba', nameEs: 'Cuba' },
 { id: 'DO', nameEn: 'Dominican Republic', nameEs: 'República Dominicana' },
 { id: 'EC', nameEn: 'Ecuador', nameEs: 'Ecuador' },
 { id: 'SV', nameEn: 'El Salvador', nameEs: 'El Salvador' },
 { id: 'ES', nameEn: 'Spain', nameEs: 'España' },
 { id: 'GT', nameEn: 'Guatemala', nameEs: 'Guatemala' },
 { id: 'HN', nameEn: 'Honduras', nameEs: 'Honduras' },
 { id: 'MX', nameEn: 'Mexico', nameEs: 'México' },
 { id: 'NI', nameEn: 'Nicaragua', nameEs: 'Nicaragua' },
 { id: 'PA', nameEn: 'Panama', nameEs: 'Panamá' },
 { id: 'PY', nameEn: 'Paraguay', nameEs: 'Paraguay' },
 { id: 'PE', nameEn: 'Peru', nameEs: 'Perú' },
 { id: 'PR', nameEn: 'Puerto Rico', nameEs: 'Puerto Rico' },
 { id: 'UY', nameEn: 'Uruguay', nameEs: 'Uruguay' },
 { id: 'VE', nameEn: 'Venezuela', nameEs: 'Venezuela' }
];


interface CitizenshipCoachProps {
  selectedLang: 'EN' | 'ES';
  userVoiceTranscription?: string;
  chatMessages?: ChatMessage[];
  onAskVoyager: (prompt: string) => void;
  onOpenSimulator: () => void;
}
const CitizenshipCoach: React.FC<CitizenshipCoachProps> = ({ 
  selectedLang, 
  userVoiceTranscription, 
  chatMessages = [], 
  onAskVoyager, 
  onOpenSimulator 
}) => {
  const [mode, setMode] = useState<'guide' | 'bilingual' | 'english' | 'exam'>('guide');
  const [category, setCategory] = useState<'ALL' | 'AMERICAN_GOVERNMENT' | 'AMERICAN_HISTORY' | 'INTEGRATED_CIVICS'>('ALL');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [resultsByQuestion, setResultsByQuestion] = useState<Record<number, 'correct' | 'unsure' | 'review'>>({});
  const questionStartTimeRef = useRef<number>(Date.now());
  const questions = useMemo(() => category === 'ALL' ? ALL_CIVICS_128_QUESTIONS : ALL_CIVICS_128_QUESTIONS.filter(q => q.category === category), [category]);
  const question = questions[index % Math.max(questions.length, 1)];

  // Exam state for "TOMA EXAMEN"
  const [examFormat, setExamFormat] = useState<'10_standard' | '20_extended' | '65_20' | 'Day 1' | 'Day 2' | 'Day 3' | 'Day 4' | 'Day 5' | 'Day 6' | 'personalized_review'>('10_standard');
  const [examStarted, setExamStarted] = useState(false);
  const [examQuestions, setExamQuestions] = useState<typeof ALL_CIVICS_128_QUESTIONS>([]);
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const [examResponses, setExamResponses] = useState<Record<number, { isCorrect: boolean; userAnswer: string; question: (typeof ALL_CIVICS_128_QUESTIONS)[0] }>>({});
  const [examInputText, setExamInputText] = useState('');
  const [examIsListening, setExamIsListening] = useState(false);
  const [showExamAcceptedAnswers, setShowExamAcceptedAnswers] = useState(false);

  const isExamFinished = examStarted && examQuestions.length > 0 && Object.keys(examResponses).length >= examQuestions.length;
  const recordedExamRef = useRef<boolean>(false);

  useEffect(() => {
    if (isExamFinished && !recordedExamRef.current) {
      recordedExamRef.current = true;
      const responsesList = Object.values(examResponses) as Array<{ isCorrect: boolean; question: typeof ALL_CIVICS_128_QUESTIONS[0] }>;
      const correctCount = responsesList.filter(r => r?.isCorrect).length;
      const incorrectCount = responsesList.filter(r => r && !r.isCorrect).length;

      // Update CivicsProgressTracker question status dictionary
      const updates: Record<number, QuestionMasteryStatus> = {};
      responsesList.forEach(r => {
        if (r?.question) {
          updates[r.question.id] = r.isCorrect ? 'known' : 'review';
        }
      });

      const activeDay = (examFormat.startsWith('Day ') ? examFormat : 'Day 1') as any;
      CivicsProgressTracker.recordDaySession(
        activeDay,
        correctCount,
        0,
        incorrectCount,
        examQuestions.length,
        updates
      );
      CivicsExamTracker.recordExam(examFormat as any, correctCount, examQuestions.length);
    } else if (!isExamFinished) {
      recordedExamRef.current = false;
    }
  }, [isExamFinished, examResponses, examFormat, examQuestions]);

  const handleSubTabChange = (newMode: 'guide' | 'bilingual' | 'english' | 'exam', customExamFormat?: typeof examFormat) => {
    setMode(newMode);
    setResult(null);
    if (newMode === 'exam') {
      const targetFormat = customExamFormat || examFormat;
      startExamSimulation(targetFormat);
    }
    const updatedPrompt = ConversationModePolicy.getCivicsSystemInstructions(selectedLang, newMode);
    onAskVoyager(updatedPrompt);
  };
  const startExamSimulation = (format: typeof examFormat = examFormat) => {
    let pool = [...ALL_CIVICS_128_QUESTIONS];
    if (format === '65_20') {
      pool = ALL_CIVICS_128_QUESTIONS.filter(q => q.isExemption65_20);
      if (pool.length === 0) pool = ALL_CIVICS_128_QUESTIONS.slice(0, 20);
    } else if (format.startsWith('Day ')) {
      pool = ALL_CIVICS_128_QUESTIONS.filter(q => q.daySection === format);
    } else if (format === 'personalized_review') {
      pool = CivicsProgressTracker.getQuestionsForPersonalizedReview();
      if (pool.length === 0) pool = ALL_CIVICS_128_QUESTIONS;
    }

    const count = (format.startsWith('Day ') || format === 'personalized_review') ? pool.length : (format === '20_extended' ? 20 : 10);
    const selectedList = (format.startsWith('Day ') || format === 'personalized_review') ? pool : [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    setExamQuestions(selectedList);
    setCurrentExamIndex(0);
    setExamResponses({});
    setExamInputText('');
    setExamStarted(true);
    setShowExamAcceptedAnswers(false);

    if (selectedList[0]) {
      const q = selectedList[0];
      const startPrompt = selectedLang === 'ES'
        ? `[INSTRUCCIÓN DE SISTEMA: Como Officer Voyager, inicia el simulacro de entrevista cívica de USCIS (${format}). Saluda formalmente en 1 frase corta y haz la primera pregunta en inglés claro: "${q.questionEn}".]`
        : `[SYSTEM INSTRUCTION: As Officer Voyager, begin the official USCIS Civics oral simulation (${format}). Give a 1-sentence formal greeting as a USCIS officer and ask question #1 clearly in English: "${q.questionEn}".]`;
      onAskVoyager(startPrompt);
    }
  };

  const handleEvaluateExamAnswer = (userAns: string) => {
    const currentQ = examQuestions[currentExamIndex];
    if (!currentQ) return;
    const clean = userAns.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');
    if (!clean) return;

    const isMatch = currentQ.answersEn.some(a => {
      const target = a.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');
      return clean === target || target.includes(clean) || clean.includes(target);
    });

    const isClose = isMatch || currentQ.answersEn.some(a => {
      const words = clean.split(/\s+/).filter(w => w.length > 2);
      const aWords = a.toLowerCase().split(/\s+/);
      return words.filter(w => aWords.includes(w)).length >= Math.min(2, words.length);
    });

    const isCorrect = isMatch || isClose;

    // Update Live Progress Tracker
    CivicsProgressTracker.setQuestionStatus(currentQ.id, isCorrect ? 'known' : 'review');

    setExamResponses(prev => ({
      ...prev,
      [currentExamIndex]: {
        isCorrect,
        userAnswer: userAns.trim(),
        question: currentQ
      }
    }));

    const feedbackPrompt = isCorrect
      ? (selectedLang === 'ES'
          ? `[INSTRUCCIÓN DE SISTEMA: El usuario respondió: "${userAns}". Es correcto para la pregunta: "${currentQ.questionEn}". Como Officer Voyager, di en voz alta en inglés: "That is correct!" o "Correct!" y una breve confirmación.]`
          : `[SYSTEM INSTRUCTION: The candidate answered: "${userAns}". This is correct for: "${currentQ.questionEn}". As Officer Voyager, say aloud: "That is correct!" or "Correct!" with brief positive feedback.]`)
      : (selectedLang === 'ES'
          ? `[INSTRUCCIÓN DE SISTEMA: El usuario respondió: "${userAns}". La respuesta esperada para "${currentQ.questionEn}" es: "${currentQ.answersEn[0]}". Como Officer Voyager, di en voz alta en inglés: "Not quite. The correct answer is: ${currentQ.answersEn[0]}." de forma amable y profesional.]`
          : `[SYSTEM INSTRUCTION: The candidate answered: "${userAns}". The acceptable answer for "${currentQ.questionEn}" is: "${currentQ.answersEn[0]}". As Officer Voyager, say aloud: "Not quite. The correct answer is: ${currentQ.answersEn[0]}." professionally.]`);
    onAskVoyager(feedbackPrompt);
  };

  const handleNextExamQuestion = () => {
    if (currentExamIndex + 1 < examQuestions.length) {
      const nextIdx = currentExamIndex + 1;
      setCurrentExamIndex(nextIdx);
      setExamInputText('');
      setShowExamAcceptedAnswers(false);
      const nextQ = examQuestions[nextIdx];
      if (nextQ) {
        const prompt = `[SYSTEM INSTRUCTION: As Officer Voyager in the oral exam simulation, ask question #${nextIdx + 1} clearly in English: "${nextQ.questionEn}".]`;
        onAskVoyager(prompt);
      }
    }
  };

  // Calculator state for Guide
  const [calcAge, setCalcAge] = useState<'under50' | '50_54' | '55_64' | '65plus'>('under50');
  const [calcYearsGC, setCalcYearsGC] = useState<'under15' | '15_19' | '20plus'>('under15');

  const calcResult = useMemo(() => {
    if (calcAge === '65plus' && calcYearsGC === '20plus') {
      return {
        type: '65_20',
        titleEn: '65/20 Special Consideration Exemption',
        titleEs: 'Exención Especial de Consideración 65/20',
        descEn: 'You qualify for the 65/20 Special Consideration! You only study 20 specially designated questions (marked with *). During the interview, you are asked 10 questions and must answer 6 correctly. You may also take the exam in your native language using an interpreter.',
        descEs: '¡Calificas para la Consideración Especial 65/20! Solo debes estudiar 20 preguntas seleccionadas (marcadas con *). En la entrevista te realizarán 10 preguntas y necesitarás 6 correctas. Además, puedes presentar la prueba en tu idioma natal con un intérprete.',
        badgeEn: 'Special 20-Question Exam + Native Language Option',
        badgeEs: 'Examen de 20 Preguntas + Opción de Idioma Natal'
      };
    }
    if (calcAge === '55_64' && calcYearsGC === '15_19') {
      return {
        type: '55_15',
        titleEn: '55/15 Native Language Exception',
        titleEs: 'Excepción de Idioma Natal 55/15',
        descEn: 'You are exempt from the English language requirement! You take the standard Civics test in your native language with an interpreter. You study the standard question set.',
        descEs: '¡Estás exento del requisito de idioma inglés! Presentas el examen estándar de Cívica en tu idioma natal con intérprete.',
        badgeEn: 'Native Language Civics Test (With Interpreter)',
        badgeEs: 'Examen de Cívica en tu Idioma Natal (Con Intérprete)'
      };
    }
    if (calcAge === '50_54' && calcYearsGC === '20plus') {
      return {
        type: '50_20',
        titleEn: '50/20 Native Language Exception',
        titleEs: 'Excepción de Idioma Natal 50/20',
        descEn: 'You are exempt from the English language requirement! You take the standard Civics test in your native language with an interpreter.',
        descEs: '¡Estás exento del requisito de idioma inglés! Presentas el examen estándar de Cívica en tu idioma natal con intérprete.',
        badgeEn: 'Native Language Civics Test (With Interpreter)',
        badgeEs: 'Examen de Cívica en tu Idioma Natal (Con Intérprete)'
      };
    }
    if (calcAge === '65plus' && calcYearsGC === '15_19') {
      return {
        type: '55_15',
        titleEn: '55/15 Native Language Exception',
        titleEs: 'Excepción de Idioma Natal 55/15',
        descEn: 'You are exempt from the English language requirement! You take the standard Civics test in your native language with an interpreter.',
        descEs: '¡Estás exento del requisito de idioma inglés! Presentas el examen estándar de Cívica en tu idioma natal con intérprete.',
        badgeEn: 'Native Language Civics Test (With Interpreter)',
        badgeEs: 'Examen de Cívica en tu Idioma Natal (Con Intérprete)'
      };
    }
    return {
      type: 'standard',
      titleEn: 'Standard Naturalization Civics Test',
      titleEs: 'Examen Estándar de Cívica y Requisito de Inglés',
      descEn: 'You take the standard Naturalization Civics test and English test (Speaking, Reading, Writing). You study the full question bank.',
      descEs: 'Debes presentar el examen estándar de Cívica junto a la prueba de inglés (Hablar, Leer, Escribir). Debes estudiar el banco de preguntas completo.',
      badgeEn: 'Standard Exam (English + Civics)',
      badgeEs: 'Examen Estándar (Inglés + Cívica)'
    };
  }, [calcAge, calcYearsGC]);

  const result = question ? (resultsByQuestion[question.id] || null) : null;
  const setResult = (res: 'correct' | 'unsure' | 'review' | null) => {
    if (!question) return;
    setResultsByQuestion(prev => {
      if (!res) {
        const next = { ...prev };
        delete next[question.id];
        return next;
      }
      return { ...prev, [question.id]: res };
    });
  };

  const bilingual = mode === 'bilingual';
  const lastQuestionPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode === 'guide' || !question) return;
    questionStartTimeRef.current = Date.now();
    const promptKey = question.id + ':' + bilingual + ':' + selectedLang; 
    if (lastQuestionPromptRef.current === promptKey) return; 
    lastQuestionPromptRef.current = promptKey; 
    const acceptedAnswersStr = question.answersEn.join(' | ');
    const instruction = '[SYSTEM INSTRUCTION: You are Voyager in the Citizenship section. The learner is practicing question ' + question.id + ': "' + question.questionEn + '". ' + 
      'Accepted correct answers: ' + acceptedAnswersStr + '. ' +
      (bilingual 
        ? 'Read this exact question first in English, then immediately say its natural meaning in Spanish. Then wait for the learner to answer. When the learner speaks or provides their answer, evaluate if it is correct. If the answer is correct or acceptable, clearly begin your response by saying "¡Correcto!" or "That is correct!" with encouraging feedback. If incorrect, give gentle guidance.'
        : 'Speak only in English. Ask the question and wait for the learner response. When the learner answers, if the answer is correct or acceptable, clearly say "Correct!" or "That is correct!" with encouraging feedback.');
    onAskVoyager(instruction);
  }, [question?.id, bilingual, selectedLang, mode]);

  // Listen to Voyager's responses in chat to detect if Voyager evaluated the answer as correct
  useEffect(() => {
    if (!question || !chatMessages || chatMessages.length === 0) return;
    const latest = chatMessages[chatMessages.length - 1];
    if (latest && latest.sender === 'splash' && latest.timeMs >= questionStartTimeRef.current - 1000) {
      const text = latest.text.toLowerCase();
      const isNegative = /\b(not correct|no es correcto|incorrecto|incorrect|wrong|no acertaste|falso)\b/i.test(text);
      const isPositive = /\b(correct|correcto|that['’]s correct|that is correct|that's right|that is right|exacto|muy bien|excellent|excelente|perfecto|well done|good job|great job|you got it|así es|acertaste|es correcto)\b/i.test(text);
      if (isPositive && !isNegative) {
        setResultsByQuestion(prev => ({ ...prev, [question.id]: 'correct' }));
      }
    }
  }, [chatMessages, question?.id]);

  // Also evaluate user voice transcription directly if user spoke the answer
  useEffect(() => {
    if (!question || !userVoiceTranscription) return;
    const clean = userVoiceTranscription.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');
    if (clean.length < 2) return;
    const isMatch = question.answersEn.some(a => {
      const target = a.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');
      return clean.includes(target) || target.includes(clean);
    }) || (question.answersEs && question.answersEs.some(a => {
      const target = a.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '');
      return clean.includes(target) || target.includes(clean);
    }));
    if (isMatch) {
      setResultsByQuestion(prev => ({ ...prev, [question.id]: 'correct' }));
    }
  }, [userVoiceTranscription, question]);

  const chooseCategory = (value: typeof category) => { setCategory(value); setIndex(0); setShowAnswers(false); };
  const prev = () => { setIndex(current => (current - 1 + questions.length) % Math.max(questions.length, 1)); setAnswer(''); setShowAnswers(false); };
  const next = () => { setIndex(current => (current + 1) % Math.max(questions.length, 1)); setAnswer(''); setShowAnswers(false); };

  const cycleResult = () => {
    setResult(
      !result ? 'correct' :
      result === 'correct' ? 'unsure' :
      result === 'unsure' ? 'review' :
      null
    );
  };

  const handleReadAnswer = () => {
    if (!question) return;
    const prompt = '[SYSTEM INSTRUCTION: You are Voyager in the Citizenship section. Read the correct answer(s) to question ' + question.id + ': "' + question.questionEn + '". The acceptable answer(s) are: ' + question.answersEn.join(', ') + '. ' + (bilingual && question.answersEs ? 'Say the correct answer in clear American English first, then briefly say the Spanish translation: "' + question.answersEs.join(', ') + '".' : 'Say the correct answer clearly in American English.') + ']';
    onAskVoyager(prompt);
  };

  const bulletColorClass = 
    result === 'correct' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
    result === 'unsure' ? 'bg-amber-400' :
    result === 'review' ? 'bg-rose-500' :
    'bg-black/50';

  return (
    <div className="flex-grow min-h-0 overflow-y-auto bg-white px-4 py-3 sm:px-8 flex flex-col">
      <div className="mx-auto max-w-3xl w-full space-y-4 py-2 my-auto">
        {/* Submenu Tabs: GUÍA as the first option -> COMPRENDE -> PRACTICA -> TOMA EXAMEN */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 text-slate-400 flex-wrap">
          <button 
            onClick={() => handleSubTabChange('guide')} 
            className={`px-2 py-1 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${mode === 'guide' ? 'text-red-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {selectedLang === 'EN' ? 'GUIDE' : 'GUÍA'}
          </button>
          <ArrowRight className="w-4 h-4 text-black stroke-[3] shrink-0" />
          <button 
            onClick={() => handleSubTabChange('bilingual')} 
            className={`px-2 py-1 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${mode === 'bilingual' ? 'text-red-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            COMPRENDE
          </button>
          <ArrowRight className="w-4 h-4 text-black stroke-[3] shrink-0" />
          <button 
            onClick={() => handleSubTabChange('english')} 
            className={`px-2 py-1 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${mode === 'english' ? 'text-red-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            PRACTICA
          </button>
          <ArrowRight className="w-4 h-4 text-black stroke-[3] shrink-0" />
          <button 
            onClick={() => handleSubTabChange('exam')} 
            className={`px-2 py-1 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${mode === 'exam' ? 'text-red-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {selectedLang === 'EN' ? 'TAKE EXAM' : 'TOMA EXAMEN'}
          </button>
        </div>

        {/* MODE: GUIDE / GUÍA */}
        {mode === 'guide' && (
          <div className="w-full space-y-5 py-2 animate-fadeIn">
            {/* Header Hero Banner */}
            <div className="bg-gradient-to-r from-[#0D224A] via-[#15346e] to-[#0D224A] rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{selectedLang === 'EN' ? 'USCIS Civics Guide & Exam Preparation' : 'Guía de Exámenes Cívicos de USCIS'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {selectedLang === 'EN' ? 'Which Exam Do You Need to Prepare For?' : '¿Cuál Examen Te Corresponde Presentar?'}
                </h2>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-2xl">
                  {selectedLang === 'EN'
                    ? 'The USCIS Naturalization Civics test has different versions and exemptions based on your age, length of permanent residency, and N-400 filing date. Use this guide to identify your exact exam and learn American civics for life.'
                    : 'El examen de Cívica para la Naturalización de USCIS tiene diferentes versiones y excepciones según tu edad, años con residencia permanente y fecha de solicitud. Usa esta guía para identificar tu examen exacto y aprender cívica estadounidense para la vida.'}
                </p>
              </div>
            </div>

            {/* Interactive Qualification Finder */}
            <div className="bg-[#FEDC89]/40 border-2 border-[#FEDC89] rounded-3xl p-5 sm:p-7 space-y-5 shadow-xs relative">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-[#0D224A] text-white rounded-2xl shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      {selectedLang === 'EN' ? 'Interactive Exam Finder' : 'Calculadora Interactiva de Examen'}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-700">
                      {selectedLang === 'EN' ? 'Select your current age and years with Green Card to check your qualification:' : 'Selecciona tu edad actual y años de residencia para consultar tu modalidad:'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const prompt = selectedLang === 'ES'
                      ? `[INSTRUCCIÓN DE SISTEMA: Como Officer Voyager, explica verbalmente el resultado de calificación de cívica en voz alta de manera clara y motivadora: "${calcResult.titleEs}. ${calcResult.descEs}"]`
                      : `[SYSTEM INSTRUCTION: As Officer Voyager, speak the civics qualification result out loud in clear, encouraging English: "${calcResult.titleEn}. ${calcResult.descEn}"]`;
                    onAskVoyager(prompt);
                  }}
                  title={selectedLang === 'EN' ? 'Listen to Result with Voyager' : 'Escuchar Resultado con Voyager'}
                  className="p-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-2xl transition cursor-pointer shrink-0 shadow-xs flex items-center justify-center"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Step 1: Age */}
                <div className="bg-white/90 p-4 rounded-2xl border border-amber-900/10 space-y-2">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    {selectedLang === 'EN' ? '1. Your Current Age' : '1. Tu Edad Actual'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'under50', labelEn: '< 50 yrs', labelEs: '< 50 años' },
                      { id: '50_54', labelEn: '50 - 54 yrs', labelEs: '50 - 54 años' },
                      { id: '55_64', labelEn: '55 - 64 yrs', labelEs: '55 - 64 años' },
                      { id: '65plus', labelEn: '65+ yrs', labelEs: '65+ años' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCalcAge(item.id as any)}
                        className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                          calcAge === item.id
                            ? 'bg-[#0D224A] text-white border-[#0D224A] shadow-2xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {selectedLang === 'EN' ? item.labelEn : item.labelEs}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Years as Permanent Resident */}
                <div className="bg-white/90 p-4 rounded-2xl border border-amber-900/10 space-y-2">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    {selectedLang === 'EN' ? '2. Years as Permanent Resident' : '2. Años con Residencia Permanente'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'under15', labelEn: '< 15 yrs', labelEs: '< 15 años' },
                      { id: '15_19', labelEn: '15 - 19 yrs', labelEs: '15 - 19 años' },
                      { id: '20plus', labelEn: '20+ yrs', labelEs: '20+ años' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCalcYearsGC(item.id as any)}
                        className={`px-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                          calcYearsGC === item.id
                            ? 'bg-[#0D224A] text-white border-[#0D224A] shadow-2xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {selectedLang === 'EN' ? item.labelEn : item.labelEs}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Result Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-900/15 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-300">
                    {selectedLang === 'EN' ? calcResult.badgeEn : calcResult.badgeEs}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedLang === 'EN' ? calcResult.titleEn : calcResult.titleEs}
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {selectedLang === 'EN' ? calcResult.descEn : calcResult.descEs}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSubTabChange('bilingual')}
                    className="px-4 py-2 bg-[#0D224A] hover:bg-[#15346e] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>{selectedLang === 'EN' ? 'Start Bilingual Practice (COMPRENDE)' : 'Iniciar Práctica Bilingüe (COMPRENDE)'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSubTabChange('english')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>{selectedLang === 'EN' ? 'Practice in English (PRACTICA)' : 'Practicar en Inglés (PRACTICA)'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSubTabChange('exam', calcResult.type === '65_20' ? '65_20' : '10_standard')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>{selectedLang === 'EN' ? 'Take Simulated Exam (TOMA EXAMEN)' : 'Simular Examen (TOMA EXAMEN)'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* USCIS Exemption Categories Overview */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedLang === 'EN' ? 'USCIS Civics Test Versions and Exceptions' : 'Versiones del Examen y Excepciones de USCIS'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 128 Questions Bank */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0D224A] text-white text-[11px] font-bold">128 Preguntas</span>
                    <span className="text-[11px] font-extrabold text-slate-500">M-1778</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {selectedLang === 'EN' ? '128 Civics Questions Bank (Expanded)' : 'Banco de 128 Preguntas Cívicas'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedLang === 'EN'
                      ? 'The expanded bank covering American Government, American History, and Integrated Civics in full depth.'
                      : 'El banco integral ampliado que abarca Gobierno Estadounidense, Historia de EE.UU. y Cívica Integrada a profundidad.'}
                  </p>
                </div>

                {/* 65/20 Exemption */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold">65 / 20</span>
                    <span className="text-[11px] font-extrabold text-slate-500">20 Preguntas</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {selectedLang === 'EN' ? '65/20 Special Consideration (20 Questions)' : 'Exención Especial 65/20 (20 Preguntas)'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedLang === 'EN'
                      ? 'For applicants 65+ years old with 20+ years of Green Card. You only study 20 designated questions with interpreter option.'
                      : 'Para solicitantes de 65+ años con 20+ años de residencia. Solo estudias 20 preguntas seleccionadas y puedes usar intérprete.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ask Voyager Button */}
            <div className="text-center pt-1 pb-3">
              <button
                onClick={() => {
                  const prompt = selectedLang === 'ES'
                    ? '[INSTRUCCIÓN DE SISTEMA: Como Officer Voyager, saluda al usuario amablemente y explícale con total claridad qué tipo de examen de cívica le corresponde según su edad y años con Green Card.]'
                    : '[SYSTEM INSTRUCTION: As Officer Voyager, warmly explain in detail which USCIS civics exam applies to the user based on their age and permanent residency.]';
                  onAskVoyager(prompt);
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold rounded-2xl transition cursor-pointer inline-flex items-center gap-2 shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{selectedLang === 'EN' ? 'Ask Voyager AI about your specific case' : 'Consultar a Voz Voyager sobre tu caso específico'}</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE: BILINGUAL (COMPRENDE) OR ENGLISH (PRACTICA) */}
        {(mode === 'bilingual' || mode === 'english') && question && (
          <div className="rounded-3xl bg-[#F7F4EE] border border-[#E5DFD3] p-5 shadow-xs space-y-4 relative animate-fadeIn">
            <div className="relative flex flex-col items-center justify-center min-h-[28px] text-xs font-bold text-slate-500">
              <button
                onClick={() => onAskVoyager('[SYSTEM INSTRUCTION: You are Voyager in the Citizenship coaching section. Teach question ' + question.id + ': ' + question.questionEn + '. ' + (bilingual ? 'Explain the meaning briefly in Spanish, then ask the learner to answer in English. Accept equivalent correct answers, not only one exact phrasing, and briefly explain why they are correct.' : 'Speak only English, ask the question, and wait for the learner response. Accept equivalent correct answers, not only one exact phrasing, and briefly explain why they are correct.'))}
                className="flex flex-col items-center justify-center gap-1 group cursor-pointer active:scale-95 transition-all"
                title="Escuchar y practicar con Voyager"
                aria-label="Escuchar pregunta"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 group-hover:bg-red-600 text-white transition-colors flex items-center justify-center shadow-xs">
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-700 group-hover:text-red-600 transition-colors">
                  PREGUNTA
                </span>
              </button>
              <span className="absolute top-0.5 right-0">{index + 1} / {questions.length}</span>
            </div>

            <div className="py-1 text-center space-y-1.5">
              <div className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                <button
                  type="button"
                  onClick={cycleResult}
                  className={`inline-block w-3.5 h-3.5 rounded-full mr-2.5 -mt-0.5 align-middle transition-all cursor-pointer hover:scale-110 active:scale-95 ${bulletColorClass}`}
                  title={
                    result === 'correct' ? (selectedLang === 'EN' ? 'Correct (Click to change)' : 'Correcta (Clic para cambiar)') :
                    result === 'unsure' ? (selectedLang === 'EN' ? 'Unsure / Partial (Click to change)' : 'Dudosa (Clic para cambiar)') :
                    result === 'review' ? (selectedLang === 'EN' ? 'Incorrect (Click to change)' : 'Incorrecta (Clic para cambiar)') :
                    (selectedLang === 'EN' ? 'Default / Unanswered (Click to change)' : 'Por responder (Clic para cambiar)')
                  }
                  aria-label="Estado de respuesta"
                />
                <span>{question.questionEn}</span>
              </div>
              {bilingual && <div className="text-sm sm:text-base text-slate-600 font-normal">{question.questionEs}</div>}
            </div>

            <div className="pt-2 border-t border-[#EAE4D8] relative">
              <div className="mb-2 flex flex-col items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={handleReadAnswer}
                  className="w-7 h-7 rounded-full bg-blue-600 hover:bg-red-600 text-white transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
                  title="Escuchar respuesta con Voyager"
                  aria-label="Escuchar respuesta"
                >
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnswers(prev => !prev)}
                  className="flex flex-col items-center justify-center gap-0.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-700 hover:text-red-600 transition-colors cursor-pointer group select-none"
                  title="Haz clic para ver respuestas aceptables"
                >
                  <span className="group-hover:text-red-600 transition-colors">RESPUESTA</span>
                  {showAnswers ? (
                    <ChevronUp className="w-4 h-4 text-black group-hover:text-red-600 stroke-[3] transition-colors group-hover:-translate-y-0.5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-black group-hover:text-red-600 stroke-[3] transition-colors group-hover:translate-y-0.5" />
                  )}
                </button>
              </div>

              {showAnswers && (
                <div className="mb-3 rounded-2xl bg-[#EFEAE0]/75 border border-[#DDD5C5] p-3.5 space-y-2 text-xs sm:text-sm animate-fadeIn text-center">
                  {question.answersEn.map((ansEn, idx) => {
                    const ansEs = question.answersEs && question.answersEs[idx];
                    return (
                      <div key={idx} className="leading-snug py-0.5">
                        <span className="font-bold text-slate-900">{ansEn}</span>
                        {bilingual && ansEs ? (
                          <>
                            <span className="mx-2 text-slate-400 font-normal">/</span>
                            <span className="text-slate-600 font-medium">{ansEs}</span>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation arrows inside card */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={prev}
                  className="p-1 -ml-1 text-black hover:text-red-600 active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                  title="Pregunta anterior"
                  aria-label="Pregunta anterior"
                >
                  <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="p-1 -mr-1 text-black hover:text-red-600 active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                  title="Siguiente pregunta"
                  aria-label="Siguiente pregunta"
                >
                  <ChevronRight className="w-7 h-7 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE: EXAM / TOMA EXAMEN */}
        {mode === 'exam' && (() => {
          const responsesList = Object.values(examResponses) as Array<{ isCorrect: boolean; userAnswer: string; question: (typeof ALL_CIVICS_128_QUESTIONS)[0] }>;
          const correctCount = responsesList.filter(r => r?.isCorrect).length;
          const maxQuestions = examQuestions.length > 0 ? examQuestions.length : (examFormat === '20_extended' ? 20 : 10);
          const passThreshold = Math.ceil(maxQuestions * 0.6);
          const currentOralQ = examQuestions[currentExamIndex];
          const currentResponse = examResponses[currentExamIndex];
          const isExamFinished = examStarted && examQuestions.length > 0 && Object.keys(examResponses).length >= examQuestions.length;

          if (!examStarted) {
            return (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-[#0D224A] text-white flex items-center justify-center mx-auto shadow-md">
                  <Award className="w-7 h-7 text-amber-400" />
                </div>
                <div className="space-y-2 max-w-xl mx-auto">
                  <span className="text-xs font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    {selectedLang === 'EN' ? 'Official USCIS Oral Simulation' : 'Simulacro Oficial de Entrevista Oral'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {selectedLang === 'EN' ? 'USCIS Civics Oral Exam with Officer Voyager' : 'Examen Cívico Oral con Oficial Voyager'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {selectedLang === 'EN'
                      ? 'Simulate the exact interview experience: Officer Voyager reads questions out loud in English, and you respond verbally or type your answer. 6 out of 10 correct answers are required to pass.'
                      : 'Simula la experiencia real de la entrevista: El Oficial Voyager lee las preguntas en voz alta en inglés y tú respondes verbalmente o escribiendo. Se requieren 6 de 10 respuestas correctas para aprobar.'}
                  </p>
                </div>

                {/* Returning Student Progress Summary Card */}
                {(() => {
                  const summary = CivicsExamTracker.getExerciseProgressSummary(selectedLang);
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 max-w-xl mx-auto shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#0D224A] uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-500" />
                          {selectedLang === 'EN' ? 'Student Progress & Remaining Tests' : 'Resumen de Tu Avance'}
                        </span>
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${summary.exerciseCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                          {summary.exerciseCompleted
                            ? (selectedLang === 'EN' ? '6-Test Exercise Complete!' : '¡Ejercicio de 6 Exámenes Completado!')
                            : (selectedLang === 'EN' ? `${summary.testsRemaining} Test(s) Left to Finish` : `Quedan ${summary.testsRemaining} Examen(es)`)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="text-lg font-black text-slate-900">{summary.testsTaken}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">{selectedLang === 'EN' ? 'Exams Taken' : 'Tomados'}</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                          <div className="text-lg font-black text-emerald-600">{summary.testsPassed}</div>
                          <div className="text-[10px] font-bold text-emerald-700 uppercase">{selectedLang === 'EN' ? 'Succeeded' : 'Aprobados'}</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-rose-200 shadow-2xs">
                          <div className="text-lg font-black text-rose-600">{summary.testsFailed}</div>
                          <div className="text-[10px] font-bold text-rose-700 uppercase">{selectedLang === 'EN' ? 'Failed' : 'Reprobados'}</div>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                          <div className="text-lg font-black text-amber-600">{summary.testsRemaining}</div>
                          <div className="text-[10px] font-bold text-amber-700 uppercase">{selectedLang === 'EN' ? 'Remaining' : 'Restantes'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 6-Day Study Plan & Mode Format Selector */}
                <div className="space-y-3 text-left">
                  <div className="text-xs font-extrabold text-[#0D224A] uppercase tracking-wider">
                    {selectedLang === 'EN' ? 'Voyager 6-Day Study Plan Sessions (~21 Qs Each):' : 'Sesiones del Plan de 6 Días Voyager (~21 Preguntas):'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'Day 1', labelEn: 'Day 1 (Q1-21)', labelEs: 'Día 1 (P1-21)' },
                      { id: 'Day 2', labelEn: 'Day 2 (Q22-42)', labelEs: 'Día 2 (P22-42)' },
                      { id: 'Day 3', labelEn: 'Day 3 (Q43-63)', labelEs: 'Día 3 (P43-63)' },
                      { id: 'Day 4', labelEn: 'Day 4 (Q64-84)', labelEs: 'Día 4 (P64-84)' },
                      { id: 'Day 5', labelEn: 'Day 5 (Q85-105)', labelEs: 'Día 5 (P85-105)' },
                      { id: 'Day 6', labelEn: 'Day 6 (Q106-128)', labelEs: 'Día 6 (P106-128)' }
                    ].map(dayItem => (
                      <button
                        key={dayItem.id}
                        type="button"
                        onClick={() => setExamFormat(dayItem.id as any)}
                        className={`p-2.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between text-xs ${
                          examFormat === dayItem.id
                            ? 'border-indigo-900 bg-indigo-50/80 font-bold shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className="font-extrabold text-slate-900">
                          {selectedLang === 'EN' ? dayItem.labelEn : dayItem.labelEs}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">60% Voyager Goal</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setExamFormat('personalized_review')}
                      className={`flex-1 p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between text-xs ${
                        examFormat === 'personalized_review'
                          ? 'border-purple-600 bg-purple-50 font-bold shadow-2xs text-purple-950'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <span className="font-extrabold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        {selectedLang === 'EN' ? '🔍 Personalized Review (🟡 Unsure + 🔴 Review)' : '🔍 Repaso Personalizado (🟡 Dudosas + 🔴 Repaso)'}
                      </span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">Filtered</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExamFormat('10_standard')}
                      className={`p-3 rounded-xl border-2 transition cursor-pointer text-xs font-bold ${
                        examFormat === '10_standard'
                          ? 'border-[#0D224A] bg-slate-50 text-[#0D224A]'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {selectedLang === 'EN' ? 'Standard 10 Qs' : 'Estándar 10 Preguntas'}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => startExamSimulation(examFormat)}
                    className="px-8 py-3.5 bg-[#0D224A] hover:bg-[#15346e] text-white font-extrabold text-sm sm:text-base rounded-2xl transition cursor-pointer shadow-md inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>{selectedLang === 'EN' ? 'Start Oral Exam Simulation' : 'Iniciar Simulacro de Examen'}</span>
                  </button>
                </div>
              </div>
            );
          }

          if (isExamFinished) {
            const hasPassed = correctCount >= passThreshold;
            return (
              <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs text-center animate-fadeIn">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${hasPassed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {hasPassed ? <Check className="w-8 h-8 stroke-[3]" /> : <X className="w-8 h-8 stroke-[3]" />}
                </div>

                <div className="space-y-2">
                  <span className={`text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${hasPassed ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'}`}>
                    {hasPassed ? (selectedLang === 'EN' ? 'PASSED USCIS CIVICS EXAM' : '¡APROBASTE EL EXAMEN DE CÍVICA!') : (selectedLang === 'EN' ? 'NEEDS PRACTICE' : 'REQUIERE MÁS PRÁCTICA')}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {correctCount} / {examQuestions.length} {selectedLang === 'EN' ? 'Correct Answers' : 'Respuestas Correctas'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    {hasPassed
                      ? (selectedLang === 'EN' ? `Congratulations! You achieved the ${passThreshold} required correct answers under federal USCIS standards.` : `¡Felicitaciones! Cumpliste con las ${passThreshold} respuestas correctas requeridas según los estándares de USCIS.`)
                      : (selectedLang === 'EN' ? `You need ${passThreshold} correct answers to pass. Review with the COMPRENDE and PRACTICA modes and try again!` : `Necesitas ${passThreshold} respuestas correctas para aprobar. Repasa con los modos COMPRENDE y PRACTICA e inténtalo de nuevo.`)}
                  </p>
                </div>

                {/* Question Breakdown List */}
                <div className="text-left space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {examQuestions.map((q, idx) => {
                    const resp = examResponses[idx];
                    return (
                      <div key={idx} className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${resp?.isCorrect ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white ${resp?.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                          {resp?.isCorrect ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="font-bold text-slate-900">{idx + 1}. {q.questionEn}</div>
                          <div className="text-slate-600 text-xs">
                            <span className="font-semibold">{selectedLang === 'EN' ? 'Your Answer: ' : 'Tu Respuesta: '}</span>
                            <span>{resp?.userAnswer || (selectedLang === 'EN' ? 'No answer' : 'Sin respuesta')}</span>
                          </div>
                          {!resp?.isCorrect && (
                            <div className="text-slate-700 text-xs">
                              <span className="font-semibold text-emerald-800">{selectedLang === 'EN' ? 'Accepted: ' : 'Aceptable: '}</span>
                              <span>{q.answersEn[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => startExamSimulation(examFormat)}
                    className="px-6 py-2.5 bg-[#0D224A] hover:bg-[#15346e] text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs"
                  >
                    {selectedLang === 'EN' ? 'Take Another Exam' : 'Tomar Otro Examen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubTabChange('bilingual')}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer border border-slate-300"
                  >
                    {selectedLang === 'EN' ? 'Back to COMPRENDE' : 'Volver a COMPRENDE'}
                  </button>
                </div>
              </div>
            );
          }

          if (!currentOralQ) return null;

          return (
            <div className="rounded-3xl bg-[#F7F4EE] border border-[#E5DFD3] p-5 sm:p-7 shadow-xs space-y-4 relative animate-fadeIn">
              {/* Header Status Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-[#EAE4D8] pb-3 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0D224A] text-white text-[11px]">
                    {selectedLang === 'EN' ? `Question ${currentExamIndex + 1} of ${examQuestions.length}` : `Pregunta ${currentExamIndex + 1} de ${examQuestions.length}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px]">
                    {selectedLang === 'EN' ? `Score: ${correctCount} (${passThreshold} to pass)` : `Aciertos: ${correctCount} (${passThreshold} para aprobar)`}
                  </span>
                </div>
              </div>

              {/* Central Question Display */}
              <div className="py-2 text-center space-y-2">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const prompt = `[SYSTEM INSTRUCTION: As Officer Voyager, read question #${currentExamIndex + 1} clearly in English: "${currentOralQ.questionEn}".]`;
                      onAskVoyager(prompt);
                    }}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-red-600 text-white transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
                    title={selectedLang === 'EN' ? 'Listen to Officer Voyager' : 'Escuchar a Oficial Voyager'}
                  >
                    <Volume2 className="w-5 h-5 text-white" />
                  </button>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug max-w-xl mx-auto">
                  {currentOralQ.questionEn}
                </h3>
                {selectedLang === 'ES' && (
                  <p className="text-xs sm:text-sm text-slate-500 italic">
                    {currentOralQ.questionEs}
                  </p>
                )}
              </div>

              {/* Input / Voice Response Area */}
              <div className="bg-white rounded-2xl p-4 border border-[#DDD5C5] space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={examInputText}
                    onChange={(e) => setExamInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && examInputText.trim()) {
                        handleEvaluateExamAnswer(examInputText);
                      }
                    }}
                    placeholder={
                      selectedLang === 'EN'
                        ? 'Type or speak your answer in English...'
                        : 'Escribe o di tu respuesta en inglés...'
                    }
                    className="flex-1 px-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D224A] text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleEvaluateExamAnswer(examInputText)}
                    disabled={!examInputText.trim()}
                    className="px-4 py-2.5 bg-[#0D224A] hover:bg-[#15346e] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0 shadow-xs"
                  >
                    {selectedLang === 'EN' ? 'Check Answer' : 'Evaluar'}
                  </button>
                </div>

                {/* Evaluation Status Banner */}
                {currentResponse && (
                  <div className={`p-3 rounded-xl border text-xs sm:text-sm space-y-1.5 animate-fadeIn ${currentResponse.isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'}`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {currentResponse.isCorrect ? <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> : <X className="w-4 h-4 text-rose-600 stroke-[3]" />}
                        {currentResponse.isCorrect ? (selectedLang === 'EN' ? 'Correct!' : '¡Correcto!') : (selectedLang === 'EN' ? 'Incorrect / Not Quite' : 'Incorrecto')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowExamAcceptedAnswers(!showExamAcceptedAnswers)}
                        className="text-xs text-slate-600 underline cursor-pointer hover:text-slate-900"
                      >
                        {showExamAcceptedAnswers ? (selectedLang === 'EN' ? 'Hide Answers' : 'Ocultar Respuestas') : (selectedLang === 'EN' ? 'View Accepted Answers' : 'Ver Respuestas Aceptadas')}
                      </button>
                    </div>

                    {showExamAcceptedAnswers && (
                      <div className="pt-1 text-xs text-slate-700 border-t border-slate-200/60 space-y-1">
                        <div className="font-semibold">{selectedLang === 'EN' ? 'Acceptable USCIS answers:' : 'Respuestas aceptables por USCIS:'}</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {currentOralQ.answersEn.map((ans, idx) => (
                            <li key={idx}>{ans}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (currentExamIndex > 0) {
                      setCurrentExamIndex(currentExamIndex - 1);
                      setExamInputText('');
                      setShowExamAcceptedAnswers(false);
                    }
                  }}
                  disabled={currentExamIndex === 0}
                  className="p-1 -ml-1 text-black hover:text-red-600 disabled:opacity-30 disabled:hover:text-black transition-all cursor-pointer flex items-center justify-center"
                  title={selectedLang === 'EN' ? 'Previous Question' : 'Pregunta anterior'}
                >
                  <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
                </button>

                <button
                  type="button"
                  onClick={handleNextExamQuestion}
                  className="px-5 py-2 bg-[#0D224A] hover:bg-[#15346e] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>{currentExamIndex + 1 === examQuestions.length ? (selectedLang === 'EN' ? 'Finish Exam' : 'Finalizar Examen') : (selectedLang === 'EN' ? 'Next Question' : 'Siguiente Pregunta')}</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

interface LiveAgentProps {
 isWidgetMode?: boolean;
 onClose?: () => void;
}

const playPinSound = () => {
 try {
 const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
 if (!AudioCtx) return;
 const ctx = new AudioCtx();
 
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 
 osc.connect(gain);
 gain.connect(ctx.destination);
 
 osc.type = 'sine';
 osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
 osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
 
 gain.gain.setValueAtTime(0.15, ctx.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
 
 osc.start();
 osc.stop(ctx.currentTime + 0.4);
 } catch (e) {
 console.error("Failed to play pin sound:", e);
 }
};

const UsaFlagIcon = ({ className = "w-6 h-4" }: { className?: string }) => (
  <svg className={`${className} rounded-xs shadow-2xs overflow-hidden shrink-0 inline-block`} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="24" rx="2" fill="#B22234"/>
    <path d="M0 3.69H36V7.38H0V3.69ZM0 11.07H36V14.76H0V11.07ZM0 18.45H36V22.14H0V18.45Z" fill="white"/>
    <rect width="14.4" height="12.92" fill="#3C3B6E"/>
    <circle cx="2.4" cy="2.2" r="0.6" fill="white"/>
    <circle cx="7.2" cy="2.2" r="0.6" fill="white"/>
    <circle cx="12" cy="2.2" r="0.6" fill="white"/>
    <circle cx="4.8" cy="4.3" r="0.6" fill="white"/>
    <circle cx="9.6" cy="4.3" r="0.6" fill="white"/>
    <circle cx="2.4" cy="6.4" r="0.6" fill="white"/>
    <circle cx="7.2" cy="6.4" r="0.6" fill="white"/>
    <circle cx="12" cy="6.4" r="0.6" fill="white"/>
    <circle cx="4.8" cy="8.5" r="0.6" fill="white"/>
    <circle cx="9.6" cy="8.5" r="0.6" fill="white"/>
    <circle cx="2.4" cy="10.6" r="0.6" fill="white"/>
    <circle cx="7.2" cy="10.6" r="0.6" fill="white"/>
    <circle cx="12" cy="10.6" r="0.6" fill="white"/>
  </svg>
);

interface PracticeScenario {
  id: string;
  category: 'GENERAL' | 'CITIZENSHIP' | 'DAILY_LIFE';
  nameEn: string;
  nameEs: string;
  descEn: string;
  descEs: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRACTICE_SCENARIOS: PracticeScenario[] = [
  {
    id: 'open',
    category: 'GENERAL',
    nameEn: 'OPEN',
    nameEs: 'OPEN',
    descEn: 'Free open conversation with Voyager on any topic following core guardrails.',
    descEs: 'Conversación libre con Voyager sobre cualquier tema respetando las reglas.',
    icon: MessageSquare,
  },
  {
    id: 'assessment',
    category: 'GENERAL',
    nameEn: 'English Level Assessment',
    nameEs: 'Evaluación de Nivel de Inglés',
    descEn: 'Live voice-first diagnostic assessment (A1-C2) evaluating listening, fluency, vocabulary, grammar, and pronunciation.',
    descEs: 'Evaluación diagnóstica por voz (A1-C2) evaluando escucha, fluidez, vocabulario, gramática y pronunciación.',
    icon: Target,
  },
  {
    id: 'citizenship',
    category: 'CITIZENSHIP',
    nameEn: 'Civics Exam',
    nameEs: 'Examen Cívico',
    descEn: 'Oral practice of the 128 naturalization civics questions.',
    descEs: 'Examen oral de 128 preguntas de cívica USCIS.',
    icon: GraduationCap,
  },
  {
    id: 'vida_diaria',
    category: 'DAILY_LIFE',
    nameEn: 'Vida Diaria',
    nameEs: 'Vida Diaria',
    descEn: 'Interactive practice guide for Cafeterias, Diners, Hotel Receptions, Gas Stations, Supermarkets & everyday life.',
    descEs: 'Guía práctica interactiva para Cafeterías, Diners, Recepción, Gasolineras, Supermercados y vida cotidiana.',
    icon: Clock,
  },
];

const LiveAgent: React.FC<LiveAgentProps> = ({ isWidgetMode = false, onClose }) => {
 const [rightPanelTab, setRightPanelTab] = useState<'home' | 'chat' | 'citizenship' | 'civics' | 'roadmap' | 'teachers' | 'progress' | 'settings' | 'shopping'>('home');
 const [isDarkMode, setIsDarkMode] = useState(false);
 const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
 const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
 const [isPassportModeMenuOpen, setIsPassportModeMenuOpen] = useState(false);
 const [isConversationalMenuOpen, setIsConversationalMenuOpen] = useState(false);
 const [isInputActionsMenuOpen, setIsInputActionsMenuOpen] = useState(false);
 const [activeScenarioId, setActiveScenarioId] = useState<string | null>('open');
 const [lastUserVoiceTranscription, setLastUserVoiceTranscription] = useState<string>('');
 const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
 const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
 const [openFeedbackMsgId, setOpenFeedbackMsgId] = useState<string | null>(null);
 const [msgFeedbackInput, setMsgFeedbackInput] = useState<Record<string, string>>({});
 const [msgFeedbackLists, setMsgFeedbackLists] = useState<Record<string, { id: string; text: string; timestamp: Date }[]>>({});
  const [msgFeedbackSent, setMsgFeedbackSent] = useState<Record<string, boolean>>({});

  // Goal Settings & Communication Milestones State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [targetGoalMinutes, setTargetGoalMinutes] = useState<number | null>(10);
  const [hasAchievedMilestone, setHasAchievedMilestone] = useState(false);
  const [showMilestoneToast, setShowMilestoneToast] = useState(false);

 const {
 activeMode,
 switchMode,
 isConnected,
 statusText,
 isPaused,
 secondsElapsed,
 volume,
 error,
 setError,
 selectedLang,
 setSelectedLang,
 isListenOnly,
 setIsListenOnly,
 isTranslateMode,
 setIsTranslateMode,
 isBilingualMode,
 setIsBilingualMode,
 isSpanishOnlyMode,
 setIsSpanishOnlyMode,
 isEnglishOnlyMode,
 setIsEnglishOnlyMode,
 scores,
 setScores,
 learnedWords,
 setLearnedWords,
 accentPatterns,
 setAccentPatterns,
 pronunciationEvents,
 chatMessages,
 setChatMessages,
 addSystemMessage,
 addUserMessage,
 connect,
 disconnect,
 sendText,
 pause,
 resume,
 hasInteracted,
 setHasInteracted,
 wsRef,
 } = useConversationEngine(rightPanelTab, (text) => {
    setLastUserVoiceTranscription(text);
    if (isDictationActive) {
      setInputText(prev => {
        const separator = prev && !prev.endsWith(' ') && !text.startsWith(' ') ? ' ' : '';
        return prev + separator + text;
      });
    }
  });
  const formatChronometer = useCallback((totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  // Check when user reaches target communication goal
  useEffect(() => {
    if (targetGoalMinutes && secondsElapsed > 0 && secondsElapsed >= targetGoalMinutes * 60 && !hasAchievedMilestone) {
      setHasAchievedMilestone(true);
      setShowMilestoneToast(true);
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        // ignore audio context restrictions
      }
    }
  }, [secondsElapsed, targetGoalMinutes, hasAchievedMilestone]);

  const startOfficialCitizenshipOralExam = useCallback(() => {
    setHasClickedConnect(true);
    setHasInteracted(true);
    setRightPanelTab('chat');
    if (window.location.hash === '#/civics' || window.location.hash === '#civics') {
      window.location.hash = '';
    }

    // Set mode to ADAPTIVE for conversational flexibility during the exam
    setSelectedLang('EN');
    switchMode('ADAPTIVE', 'EN');
    setChosenStartMode('ADAPTIVE');

    const oralExamInstruction = ConversationModePolicy.buildOfficialCitizenshipTestInstruction();

    if (isPaused) {
      resume(true);
    }

    if (isConnected) {
      sendText(oralExamInstruction);
    } else {
      connect(oralExamInstruction, true, 'EN');
    }

    addSystemMessage(
      '🏛️ USCIS Naturalization Civics Test started right here in Live Chat (20 Questions - Strictly English Only). Officer Voyager will ask questions one by one in English.',
      `msg_sys_civics_${Date.now()}`
    );
  }, [isConnected, isPaused, connect, sendText, switchMode, setSelectedLang, resume, setHasInteracted, addSystemMessage]);

  const handleSelectScenario = useCallback((scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    setIsConversationalMenuOpen(false);
    setIsPassportModeMenuOpen(false);
    setIsInputActionsMenuOpen(false);

    // Automatically switch communication mode to ADAPTIVE for any conversational menu selection
    switchMode('ADAPTIVE', selectedLang);
    setChosenStartMode('ADAPTIVE');

    if (isPaused) {
      resume(true);
    }
    setHasClickedConnect(true);
    setHasInteracted(true);
    setRightPanelTab('chat');

    if (scenarioId === 'open') {
      const openPrompt = `[INSTRUCCIÓN DE SISTEMA: Modo "OPEN" (Conversación Abierta - Modo Adaptativo) activado. Conversa libremente con el usuario sobre cualquier tema general que proponga en Modo Adaptativo, manteniendo tu rol como guía y tutor VOYAGER y adaptando el idioma, velocidad y apoyo según la fluidez del usuario.]`;
      if (isConnected) {
        sendText(openPrompt);
      } else {
        connect(openPrompt, true, selectedLang);
      }
      return;
    }

    if (scenarioId === 'assessment') {
      const assessmentInstructions = ConversationModePolicy.getEnglishAssessmentSystemInstructions(selectedLang);
      if (isConnected) {
        sendText(assessmentInstructions);
      } else {
        connect(assessmentInstructions, true, selectedLang);
      }
      addSystemMessage(
        selectedLang === 'EN'
          ? '🎯 English Level Assessment Started (Adaptive Mode)! Voyager will now conduct a live voice-first diagnostic conversation to evaluate your proficiency on the international A1-C2 scale.'
          : '🎯 ¡Evaluación de Nivel de Inglés Iniciada (Modo Adaptativo)! Voyager realizará una conversación diagnóstica por voz en vivo para determinar tu nivel en la escala A1-C2.',
        `msg_sys_assessment_${Date.now()}`
      );
      return;
    }

    if (scenarioId === 'citizenship') {
      startOfficialCitizenshipOralExam();
      return;
    }

    let scenarioPrompt = '';
    switch (scenarioId) {
      case 'vida_diaria':
      case 'daily_life':
      case 'cafe':
      case 'diner':
      case 'hotel':
      case 'gas_station':
      case 'supermarket':
      case 'subway':
        scenarioPrompt = `[INSTRUCCIÓN DE SISTEMA: Misión de práctica conversacional "VIDA DIARIA" iniciada en Modo Adaptativo. Actúa como la guía interactiva VOYAGER para situaciones cotidianas en EE. UU.: cafeterías, diners, recepción de hotel, gasolineras, supermercados y compras. Adapta dinámicamente tu idioma, velocidad y apoyo según la fluidez del usuario. Saluda al usuario de manera cercana y pregúntale en cuál tema desea comenzar.]`;
        break;
      default:
        scenarioPrompt = `[INSTRUCCIÓN DE SISTEMA: Escenario de conversación iniciado en Modo Adaptativo.]`;
        break;
    }

    if (isConnected) {
      sendText(scenarioPrompt);
    } else {
      connect(scenarioPrompt, true, selectedLang);
    }
  }, [isPaused, resume, isConnected, sendText, connect, selectedLang, switchMode, startOfficialCitizenshipOralExam, setHasInteracted, addSystemMessage]);

  const goToCiudadaniaDirectly = useCallback(() => {
    setHasClickedConnect(true);
    setHasInteracted(true);
    setOnboardingStep(4);
    setRightPanelTab('civics');
    window.location.hash = '#/civics';
    if (!isConnected) {
      connect(undefined, true);
    }
  }, [isConnected, connect, setHasInteracted]);

  useEffect(() => {
    if (window.location.hash === '#/citizenship' || window.location.hash === '#citizenship') {
      setHasClickedConnect(true);
      setHasInteracted(true);
      setRightPanelTab('citizenship');
      return;
    }
    if (window.location.hash === '#/civics' || window.location.hash === '#civics') {
      setHasClickedConnect(true);
      setHasInteracted(true);
      setOnboardingStep(4);
      setRightPanelTab('civics');
    }
  }, [setHasInteracted]);

 const [hasClickedConnect, setHasClickedConnect] = useState<boolean>(false);
 const [chosenStartMode, setChosenStartMode] = useState<ConversationMode | null>('SPANISH');

 const currentModeObj = useMemo(() => {
   const targetId = activeMode || chosenStartMode || 'SPANISH';
   return modeDetails.find(m => m.id === targetId) || modeDetails[0];
 }, [activeMode, chosenStartMode]);

 const EspIcon = useCallback(({ className }: { className?: string }) => (
   <span className={`font-black text-[10px] tracking-tighter leading-none flex items-center justify-center select-none ${className || ''}`}>
     ESP
   </span>
 ), []);

 const CurrentModeIcon = useMemo(() => {
   switch (currentModeObj.id) {
     case 'ADAPTIVE':
       return Zap;
     case 'BILINGUAL':
       return Sparkles;
     case 'AMERICAN_ENGLISH':
       return Compass;
     case 'LIVE_TRANSLATOR':
       return Languages;
     case 'LISTEN_ONLY':
       return Headphones;
     case 'SPANISH':
     default:
       return EspIcon;
   }
 }, [currentModeObj, EspIcon]);

 const [onboardingStep, setOnboardingStep] = useState<number>(0);
 const [selectedGoal, setSelectedGoal] = useState<'PROFESSIONAL' | 'ESTUDIO' | 'VIAJANTE' | 'DOCENTES' | null>(null);
 const [selectedLevel, setSelectedLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'NOT_SURE' | null>(null);
 const [selectedProfSubGoal, setSelectedProfSubGoal] = useState<'CONSEGUIR_EMPLEO' | 'COMUNICARME_TRABAJO' | 'CRECER_PROFESIONAL' | null>(null);
 const [selectedProfInterest, setSelectedProfInterest] = useState<'EMPRENDEDOR' | 'GERENCIA' | 'MERCADEO' | 'VENTAS' | null>(null);
 const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<'ELEMENTARY_SCHOOL' | 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL' | 'COLLEGE_UNIVERSITY' | 'GRADUATE_SCHOOL' | null>(null);
 const [selectedAcademicGoal, setSelectedAcademicGoal] = useState<'PASS_EXAM' | 'ACADEMIC_SUCCESS' | 'STUDY_ABROAD' | 'IMPROVE_CONVERSATION' | 'GENERAL_KNOWLEDGE' | null>(null);
 const [selectedViajanteSubGoal, setSelectedViajanteSubGoal] = useState<'EXPLORAR' | 'AMISTAD' | 'CULTURA' | null>(null);
 const [selectedDocenteProfile, setSelectedDocenteProfile] = useState<'INDEPENDIENTE' | 'ACADEMIA' | 'ESCUELA' | 'EMPRESA' | null>(null);
 const [selectedDocenteGoal, setSelectedDocenteGoal] = useState<'PERSONALMENTE' | 'EN_LINEA' | 'HIBRIDO' | null>(null);
 const [userName, setUserName] = useState<string>(() => {
 try {
 const saved = localStorage.getItem('voyager_user_account');
 if (saved) {
 const parsed = JSON.parse(saved);
 if (parsed.name && parsed.name !== 'Estudiante' && parsed.name !== 'Learner') {
          if (parsed.name === 'Invitado Voyager') return 'Invitado';
          if (parsed.name === 'Guest Voyager') return 'Guest';
          return parsed.name;
        }
 }
 } catch (e) {}
 return '';
 });
 const [userAge, setUserAge] = useState<string>(() => {
 try {
 const saved = localStorage.getItem('voyager_user_account');
 if (saved) {
 const parsed = JSON.parse(saved);
 if (parsed.age) return String(parsed.age);
 }
 } catch (e) {}
 return '';
 });
 const [userEmail, setUserEmail] = useState<string>(() => {
 try {
 const saved = localStorage.getItem('voyager_user_account');
 if (saved) {
 const parsed = JSON.parse(saved);
 if (parsed.email && parsed.email !== 'learner@usavoyager.com') return parsed.email;
 }
 } catch (e) {}
 return '';
 });
 const [userCountry, setUserCountry] = useState<string>(() => {
 try {
 const saved = localStorage.getItem('voyager_user_account');
 if (saved) {
 const parsed = JSON.parse(saved);
 if (parsed.country && parsed.country !== 'Desconocido' && parsed.country !== 'Unknown') return parsed.country;
 }
 } catch (e) {}
 return '';
 });
  const [userLastName, setUserLastName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('voyager_user_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastName) return parsed.lastName;
      }
    } catch (e) {}
    return '';
  });
  const [userPassword, setUserPassword] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('voyager_user_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.password) return parsed.password;
      }
    } catch (e) {}
    return '';
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState<boolean>(false);
  const [showInlineEmailFields, setShowInlineEmailFields] = useState<boolean>(false);
 const [contactMessage, setContactMessage] = useState<string>('');
 const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);
 const [explanationCountdown, setExplanationCountdown] = useState<number | null>(null);
 const [showReviewScreen, setShowReviewScreen] = useState<boolean>(false);
 const [inputText, setInputText] = useState<string>('');
 const [isDictationActive, setIsDictationActive] = useState<boolean>(false);
 const recognitionRef = useRef<any>(null);
 const initialDictationTextRef = useRef<string>('');
 const wasPausedForDictationRef = useRef<boolean>(false);

 useEffect(() => {
   if (!isDictationActive) {
     if (recognitionRef.current) {
       try { recognitionRef.current.stop(); } catch (e) {}
       recognitionRef.current = null;
     }
     return;
   }

   if (typeof window !== 'undefined' && window.speechSynthesis) {
     window.speechSynthesis.cancel();
   }
   if (isConnected && !isPaused) {
     pause();
     wasPausedForDictationRef.current = true;
   }

   initialDictationTextRef.current = inputText;

   const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
   if (!SpeechRec) return;

   try {
     const recognition = new SpeechRec();
     recognition.continuous = true;
     recognition.interimResults = true;
     recognition.lang = selectedLang === 'EN' ? 'en-US' : 'es-US';

     recognition.onresult = (event: any) => {
       let accumulatedFinal = '';
       let interim = '';
       for (let i = 0; i < event.results.length; i++) {
         const trans = event.results[i][0]?.transcript || '';
         if (event.results[i].isFinal) {
           accumulatedFinal += trans;
         } else {
           interim += trans;
         }
       }
       const fullSpeech = (accumulatedFinal + interim).trim();
       const base = initialDictationTextRef.current;
       const separator = base && !base.endsWith(' ') && fullSpeech && !fullSpeech.startsWith(' ') ? ' ' : '';
       setInputText(base + (fullSpeech ? separator + fullSpeech : ''));
     };

     recognition.onerror = () => {
       setIsDictationActive(false);
     };

     recognition.onend = () => {
       setIsDictationActive(false);
     };

     recognition.start();
     recognitionRef.current = recognition;
   } catch (e) {
     console.warn('SpeechRecognition error:', e);
     setIsDictationActive(false);
   }

   return () => {
     if (recognitionRef.current) {
       try { recognitionRef.current.stop(); } catch (e) {}
     }
   };
 }, [isDictationActive, selectedLang, isConnected, isPaused, pause]);
 const [isFadingMascot, setIsFadingMascot] = useState<boolean>(false);
 const [activePolicyModal, setActivePolicyModal] = useState<'privacy' | 'terms' | 'copyright' | 'contact' | null>(null);
 const [authModalMode, setAuthModalMode] = useState<'email' | 'google' | null>(null);
 const [authEmail, setAuthEmail] = useState<string>('');
 const [authPassword, setAuthPassword] = useState<string>('');
 const [authName, setAuthName] = useState<string>('');
 const [authIsRegister, setAuthIsRegister] = useState<boolean>(true);
 const [authNotification, setAuthNotification] = useState<string | null>(null);

  const handleGuestLogin = () => {
    const guestName = selectedLang === 'EN' ? 'Guest' : 'Invitado';
    setUserName(guestName);
    setUserEmail('');
    try {
      localStorage.setItem('voyager_user_account', JSON.stringify({
        name: guestName,
        email: '',
        provider: 'guest',
        loginTime: new Date().toISOString()
      }));
    } catch (e) {}
    setAuthModalMode(null);
    setAuthNotification(selectedLang === 'EN' ? 'Entered as Guest!' : '¡Entrando como invitado!');
    setTimeout(() => {
      setAuthNotification(null);
    }, 4000);
    if (onboardingStep === 4) {
      handleContinuaClick();
    } else if (typeof executeConnectFlow === 'function') {
      executeConnectFlow();
    }
  };

  const handleGoogleLogin = () => {
    const gName = userName || 'Google User';
    const gEmail = userEmail || 'user@gmail.com';
    setUserName(gName);
    setUserEmail(gEmail);
    try {
      localStorage.setItem('voyager_user_account', JSON.stringify({
        name: gName,
        email: gEmail,
        provider: 'google',
        loginTime: new Date().toISOString()
      }));
    } catch (e) {}
    setAuthNotification(selectedLang === 'EN' ? 'Logged in with Google!' : '¡Sesión iniciada con Google!');
    setTimeout(() => {
      setAuthNotification(null);
    }, 4000);
    if (onboardingStep === 4) {
      handleContinuaClick();
    } else if (typeof executeConnectFlow === 'function') {
      executeConnectFlow();
    }
  };
 const handleEmailAuthSubmit = (e: React.FormEvent) => {
   e.preventDefault();
   if (!authEmail) return;
   const finalName = authName.trim() || userName || (selectedLang === 'EN' ? 'Guest' : 'Invitado');
   setUserName(finalName);
   setUserEmail(authEmail);
   try {
     localStorage.setItem('voyager_user_account', JSON.stringify({
       name: finalName,
       email: authEmail,
       password: authPassword,
       provider: 'email',
       loginTime: new Date().toISOString()
     }));
   } catch (e) {}
   setAuthModalMode(null);
   setAuthNotification(selectedLang === 'EN' ? `Welcome, ${finalName}!` : `¡Bienvenido, ${finalName}!`);
   setTimeout(() => {
     setAuthNotification(null);
   }, 4000);
   if (typeof executeConnectFlow === 'function') {
     executeConnectFlow();
   }
 };
 const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
 const [cartCount, setCartCount] = useState<number>(0);

 const visitorFullName = useMemo(() => {
 if (userName && userName.trim()) {
 const name = userName.trim();
 if (name && name !== 'Estudiante' && name !== 'Learner') return name;
 }
 try {
 const saved = localStorage.getItem('voyager_user_account');
 if (saved) {
 const parsed = JSON.parse(saved);
 if (parsed.name && parsed.name !== 'Estudiante' && parsed.name !== 'Learner') {
 const name = parsed.name.trim();
 if (name) return name;
 }
 }
 } catch (e) {}
 return '';
 }, [userName]);

  const isProfileCompleted = useMemo(() => {
    const nameVal = (visitorFullName || userName || '').trim();
    const emailVal = (userEmail || '').trim();
    
    const isNameValid = Boolean(nameVal && !['Guest', 'Invitado', 'Invitado Voyager', 'Guest Voyager', 'Learner', 'Estudiante'].includes(nameVal));
    const isEmailValid = Boolean(emailVal && emailVal.includes('@') && !emailVal.includes('learner@usavoyager.com'));

    if (isNameValid || isEmailValid) return true;

    try {
      const saved = localStorage.getItem('voyager_user_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        const pName = (parsed.name || '').trim();
        const pEmail = (parsed.email || '').trim();
        if (pName && !['Guest', 'Invitado', 'Invitado Voyager', 'Guest Voyager', 'Learner', 'Estudiante'].includes(pName)) return true;
        if (pEmail && pEmail.includes('@') && !pEmail.includes('learner@usavoyager.com')) return true;
      }
    } catch (e) {}
    return false;
  }, [visitorFullName, userName, userEmail]);

  const [savedChats, setSavedChats] = useState<{ id: string; date: string; title: string; durationSeconds: number; messageCount: number; snippet: string; messages: { sender: string; text: string; timestamp?: Date | string }[] }[]>(() => {
    try {
      const saved = localStorage.getItem('voyager_saved_chats');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [currentBookmarkedChatId, setCurrentBookmarkedChatId] = useState<string | null>(null);
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);
  const [showRequireProfileModal, setShowRequireProfileModal] = useState(false);

  const handleBookmarkChat = () => {
    if (!isProfileCompleted) {
      setShowRequireProfileModal(true);
      return;
    }

    if (currentBookmarkedChatId) {
      const updated = savedChats.filter(c => c.id !== currentBookmarkedChatId);
      setSavedChats(updated);
      try {
        localStorage.setItem('voyager_saved_chats', JSON.stringify(updated));
      } catch (e) {}
      setCurrentBookmarkedChatId(null);
      return;
    }

    const newId = `chat_${Date.now()}`;
    const now = new Date();
    const sessionTitle = selectedLang === 'EN'
      ? `USA Voyager Session - ${now.toLocaleDateString()}`
      : `Sesión USA Voyager - ${now.toLocaleDateString()}`;

    const lastMsgSnippet = chatMessages.length > 0 
      ? (chatMessages[chatMessages.length - 1].text || '').slice(0, 120) 
      : (selectedLang === 'EN' ? 'Practice conversation with VOYAGER' : 'Práctica de conversación con VOYAGER');

    const newEntry = {
      id: newId,
      date: now.toISOString(),
      title: sessionTitle,
      durationSeconds: secondsElapsed,
      messageCount: chatMessages.length,
      snippet: lastMsgSnippet,
      messages: chatMessages.map(m => ({ sender: m.sender, text: m.text, timestamp: m.timestamp }))
    };

    const updated = [newEntry, ...savedChats];
    setSavedChats(updated);
    try {
      localStorage.setItem('voyager_saved_chats', JSON.stringify(updated));
    } catch (e) {}

    setCurrentBookmarkedChatId(newId);
    setShowBookmarkToast(true);
    setTimeout(() => setShowBookmarkToast(false), 3500);
  };

 // Auto-sync user profile & contact info to localStorage and PERFIL dynamically
 useEffect(() => {
 if (!userName.trim() && !userEmail.trim() && !userCountry && !userAge) return;

 const mapLevelEstimate = (lvl: typeof selectedLevel) => {
 if (lvl === 'BEGINNER') return 'Beginner';
 if (lvl === 'INTERMEDIATE') return 'Intermediate';
 if (lvl === 'ADVANCED') return 'Advanced';
 if (lvl === 'NOT_SURE') return 'Not Sure';
 return 'Intermediate';
 };
 
 const getGoalText = () => {
 if (selectedGoal === 'PROFESSIONAL') {
 const subGoalText = selectedProfSubGoal ? ` (${selectedProfSubGoal})` : '';
 const interestText = selectedProfInterest ? ` - ${selectedProfInterest}` : '';
 return `Professional${subGoalText}${interestText}`;
 }
 if (selectedGoal === 'ESTUDIO') {
 const schoolText = selectedSchoolLevel ? ` (${selectedSchoolLevel})` : '';
 const academicText = selectedAcademicGoal ? ` - ${selectedAcademicGoal}` : '';
 return `Academic / Study${schoolText}${academicText}`;
 }
 if (selectedGoal === 'VIAJANTE') {
 const subGoalText = selectedViajanteSubGoal ? ` (${selectedViajanteSubGoal})` : '';
 return `Traveler${subGoalText}`;
 }
 if (selectedGoal === 'DOCENTES') {
 const profileText = selectedDocenteProfile ? ` (${selectedDocenteProfile})` : '';
 const goalText = selectedDocenteGoal ? ` - ${selectedDocenteGoal}` : '';
 return `Teachers${profileText}${goalText}`;
 }
 return 'Travel & Daily Conversation';
 };

 const saved = localStorage.getItem('voyager_user_account');
 let u = {
 name: userName.trim() || (selectedLang === 'EN' ? 'Learner' : 'Estudiante'),
 lastName: userLastName.trim() || undefined,
 email: userEmail.trim() || 'learner@usavoyager.com',
 password: userPassword.trim() || undefined,
 age: userAge.trim() ? parseInt(userAge.trim()) : undefined,
 country: userCountry.trim() || (selectedLang === 'EN' ? 'Not specified' : 'Desconocido'),
 provider: 'Guest' as const,
 goal: getGoalText(),
 levelEstimate: mapLevelEstimate(selectedLevel),
 completedDays: [1],
 plan: 'FREE' as const
 };
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 u = {
 ...parsed,
 name: userName.trim() || parsed.name,
 email: userEmail.trim() || parsed.email,
 age: userAge.trim() ? parseInt(userAge.trim()) : parsed.age,
 country: userCountry.trim() || parsed.country,
 goal: getGoalText(),
 levelEstimate: mapLevelEstimate(selectedLevel),
 };
 } catch (e) {}
 }
 localStorage.setItem('voyager_user_account', JSON.stringify(u));
 }, [userName, userAge, userCountry, userEmail, selectedGoal, selectedLevel, selectedProfSubGoal, selectedProfInterest, selectedSchoolLevel, selectedAcademicGoal, selectedViajanteSubGoal, selectedDocenteProfile, selectedDocenteGoal, selectedLang]);

 useEffect(() => {
 const handleCartCount = () => {
 const win = window as any;
 if (win.Ecwid && win.Ecwid.Cart && typeof win.Ecwid.Cart.calculateTotalQuantity === 'function') {
 try {
 win.Ecwid.Cart.calculateTotalQuantity((qty: number) => {
 setCartCount(qty);
 });
 } catch (err) {
 console.warn('Ecwid calculateTotalQuantity error:', err);
 }
 }
 };

 const win = window as any;
 if (win.Ecwid && win.Ecwid.OnCartChanged) {
 win.Ecwid.OnCartChanged.add((cart: any) => {
 if (cart && typeof cart.productsQuantity === 'number') {
 setCartCount(cart.productsQuantity);
 } else {
 handleCartCount();
 }
 });
 handleCartCount();
 } else {
 const interval = setInterval(() => {
 if (win.Ecwid && win.Ecwid.OnCartChanged) {
 clearInterval(interval);
 win.Ecwid.OnCartChanged.add((cart: any) => {
 if (cart && typeof cart.productsQuantity === 'number') {
 setCartCount(cart.productsQuantity);
 } else {
 handleCartCount();
 }
 });
 handleCartCount();
 }
 }, 1000);
 return () => clearInterval(interval);
 }
 }, []);

 useEffect(() => {
 if (typeof window === 'undefined' || !window.speechSynthesis) return;
 const updateVoices = () => {
 setVoices(window.speechSynthesis.getVoices());
 };
 updateVoices();
 window.speechSynthesis.onvoiceschanged = updateVoices;
 return () => {
 if (window.speechSynthesis) {
 window.speechSynthesis.onvoiceschanged = null;
 }
 };
 }, []);

 // Leads inline form states
 const [inlineFormStep, setInlineFormStep] = useState<'details' | 'services'>('details');
 const [inlineLeadForm, setInlineLeadForm] = useState({
 name: '',
 email: '',
 company: '',
 phone: '',
 meetingTime: '',
 consent: false
 });
 const [showCalendar, setShowCalendar] = useState<boolean>(false);
 const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
 const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
 const [selectedCalendarTime, setSelectedCalendarTime] = useState<string>('09:00');
 const [selectedServices, setSelectedServices] = useState<string[]>([]);
 const [isSubmittingInlineLead, setIsSubmittingInlineLead] = useState<boolean>(false);
 const [inlineLeadError, setInlineLeadError] = useState<string | null>(null);
 const [inlineLeadSuccess, setInlineLeadSuccess] = useState<boolean>(false);

 const chatEndRef = useRef<HTMLDivElement>(null);

  // Particle visualizer canvas refs & loop
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const coverParticleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullScreenParticleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLiveFullScreen, setIsLiveFullScreen] = useState<boolean>(false);
  const [isLiveVoiceActive, setIsLiveVoiceActive] = useState<boolean>(true);
  const [fullScreenInput, setFullScreenInput] = useState<string>('');

  const handleSendFullScreenText = () => {
    if (!fullScreenInput.trim()) return;
    const textToSend = fullScreenInput.trim();
    setFullScreenInput('');
    if (isConnected) {
      sendText(textToSend);
    } else {
      connectToGemini(textToSend, false);
    }
  };

  // Keyboard shortcut listener for Escape key to exit full screen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLiveFullScreen) {
        setIsLiveFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLiveFullScreen]);

  // Sync Live Voice Active mode with WebSocket pause/resume
  useEffect(() => {
    if (isConnected) {
      if (isLiveVoiceActive && isPaused) {
        resume();
      } else if (!isLiveVoiceActive && !isPaused) {
        pause();
      }
    }
  }, [isLiveVoiceActive, isConnected]);
 const volumeRef = useRef(0);
 volumeRef.current = volume;
 const reminderTimerRef = useRef<NodeJS.Timeout | null>(null);
 const lastVisitedTabRef = useRef<string>('');
 const lastSpokenStepRef = useRef<number | null>(null);

 useEffect(() => {
 let animationFrameId: number;
 let time = 0;

 // Initialize 1400 ring particles concentrated in a band (yellow cab)
 const numParticles = 1400;
 const particles: { angle: number; r: number; speed: number; pulsePhase: number; size: number }[] = [];

 for (let i = 0; i < numParticles; i++) {
 particles.push({
 angle: Math.random() * 2 * Math.PI,
 // Bell-curve concentration around radius 64 (100 * 1.15)
 r: 86 + Math.random() * 34 + (Math.random() - 0.5) * 14,
 speed: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
 pulsePhase: Math.random() * 2 * Math.PI,
 size: (0.6 + Math.random() * 1.4) * 1.25
 });
 }

 // Initialize orbiting circles (moons) rotating around the oval
 const numOrbiters = 8;
 const orbiters: { angle: number; speed: number; rx: number; ry: number; size: number; alpha: number }[] = [];
 for (let i = 0; i < numOrbiters; i++) {
 let rxFactor = 1.1 + (i % 3) * 0.08;
 let ryFactor = 1.1 + (i % 3) * 0.08;
 orbiters.push({
 angle: (i * 2 * Math.PI) / numOrbiters + Math.random() * 0.5,
 speed: (0.007 + (i % 3) * 0.005) * (i % 2 === 0 ? 1 : -1),
 rx: 103 * rxFactor,
 ry: 103 * ryFactor,
 size: (1.8 + (i % 4) * 0.6) * 1.25,
 alpha: 0.55 + (i % 3) * 0.12
 });
 }

 const renderLoop = () => {
  const activeCanvases = [particleCanvasRef.current, coverParticleCanvasRef.current, fullScreenParticleCanvasRef.current].filter(Boolean) as HTMLCanvasElement[];
 if (activeCanvases.length === 0) {
 animationFrameId = requestAnimationFrame(renderLoop);
 return;
 }

 time += 1;
 const currentVolume = volumeRef.current;

 for (const canvas of activeCanvases) {
 const ctx = canvas.getContext('2d');
 if (!ctx) continue;

 const width = canvas.width;
 const height = canvas.height;
 const centerX = width / 2;
 const centerY = height / 2;
 const scale = width / 360;

 ctx.clearRect(0, 0, width, height);

 // Reset shadow blur to avoid applying it to background elements
 ctx.shadowBlur = 0;
 ctx.shadowColor = 'transparent';

 // Radial background glow (gold) with smooth gradual falloff fading completely to transparent well before canvas edge
 const maxRadius = (138 + Math.min(currentVolume, 80) * 0.5) * scale;
 let grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
 grad.addColorStop(0, 'rgba(255, 223, 0, 0.40)');
 grad.addColorStop(0.45, 'rgba(255, 215, 0, 0.15)');
 grad.addColorStop(0.8, 'rgba(255, 215, 0, 0.04)');
 grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
 ctx.fillStyle = grad;
 ctx.beginPath();
 ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
 ctx.fill();

 // Shimmering dust particles
 for (let i = 0; i < numParticles; i++) {
 let p = particles[i];
 let speedMultiplier = 1.0 + (currentVolume * 0.08);
 p.angle += p.speed * speedMultiplier;

 let radialJitter = Math.sin(p.pulsePhase + time * 0.05) * (1.2 + currentVolume * 0.08);
 let volumeJitter = (Math.random() - 0.5) * (currentVolume * 0.5);
 let finalRadius = (p.r + radialJitter + volumeJitter) * scale;

 p.pulsePhase += 0.02;

 let px = centerX + Math.cos(p.angle) * finalRadius * 1.1;
 let py = centerY + Math.sin(p.angle) * finalRadius * 1.1;
 let opacity = 0.35 + Math.sin(p.pulsePhase + i) * 0.25 + (Math.random() * 0.25);
 
 ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
 ctx.fillRect(px, py, p.size * scale, p.size * scale);
 }

 // Orbiting circles
 for (let i = 0; i < numOrbiters; i++) {
 let orb = orbiters[i];
 let speedMultiplier = 1.0 + (currentVolume * 0.08);
 orb.angle += orb.speed * speedMultiplier;

 let radialJitter = (Math.random() - 0.5) * (currentVolume * 0.35);
 let finalRx = (orb.rx + radialJitter) * scale;
 let finalRy = (orb.ry + radialJitter) * scale;

 let ox = centerX + Math.cos(orb.angle) * finalRx;
 let oy = centerY + Math.sin(orb.angle) * finalRy;

 ctx.beginPath();
 ctx.arc(ox, oy, orb.size * scale, 0, 2 * Math.PI);
 ctx.fillStyle = `rgba(255, 215, 0, ${orb.alpha})`;
 ctx.shadowBlur = (6 + (currentVolume / 100) * 8) * scale;
 ctx.shadowColor = '#ffd700';
 ctx.fill();
 }
 }

 animationFrameId = requestAnimationFrame(renderLoop);
 };

 renderLoop();
 return () => cancelAnimationFrame(animationFrameId);
 }, []);

 // Auto-scroll chat
 useEffect(() => {
   const scrollToBottom = () => {
     if (chatEndRef.current) {
       try {
         chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
       } catch {
         // fallback
       }
       if (chatEndRef.current.parentElement) {
         chatEndRef.current.parentElement.scrollTo({
           top: chatEndRef.current.parentElement.scrollHeight,
           behavior: 'smooth'
         });
       }
     }
   };

   scrollToBottom();
   const timer1 = setTimeout(scrollToBottom, 80);
   const timer2 = setTimeout(scrollToBottom, 250);
   return () => {
     clearTimeout(timer1);
     clearTimeout(timer2);
   };
 }, [chatMessages, isLiveVoiceActive, rightPanelTab]);

 // Voice TTS Helper
 const speakText = (text: string) => {
 if (!window.speechSynthesis) return;
 window.speechSynthesis.cancel();
 const cleanSpokenText = text.replace(/\bEE\.?UU\.?\b/gi, 'Estados Unidos');
 const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
 
 // Explicitly filter out any female voices to keep Voyager male
 const isFemaleVoice = (name: string) => {
 const lower = name.toLowerCase();
 return lower.includes('female') || 
 lower.includes('samantha') || 
 lower.includes('victoria') || 
 lower.includes('karen') || 
 lower.includes('tessa') || 
 lower.includes('veena') || 
 lower.includes('moira') || 
 lower.includes('fiona') || 
 lower.includes('susan') || 
 lower.includes('serena') || 
 lower.includes('hazel') || 
 lower.includes('zira') ||
 lower.includes('siri') ||
 lower.includes('kyoko');
 };

 // Attempt to find a male English/US voice for VOYAGER's American-accented Spanish
 const voicesList = voices.length > 0 ? voices : (window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
 const voyagerVoice = voicesList.find(v => 
 v.name.toLowerCase() === 'alex' && !isFemaleVoice(v.name)
 ) || voicesList.find(v => 
 v.lang.toLowerCase().startsWith('en') && 
 !isFemaleVoice(v.name) &&
 (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('google us english') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('premium'))
 ) || voicesList.find(v => 
 v.lang.toLowerCase().startsWith('en') && 
 !isFemaleVoice(v.name) &&
 (v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('fred') || v.name.toLowerCase().includes('rishi') || v.name.toLowerCase().includes('google'))
 ) || voicesList.find(v => 
 v.lang.toLowerCase().startsWith('en-us') && !isFemaleVoice(v.name)
 ) || voicesList.find(v => 
 v.lang.toLowerCase().startsWith('en') && !isFemaleVoice(v.name)
 );
 
 if (voyagerVoice) {
 utterance.voice = voyagerVoice;
 utterance.lang = voyagerVoice.lang;
 } else {
 utterance.lang = 'es-ES';
 }
 
 utterance.rate = 1.05;
 utterance.pitch = 1.05;
 
 window.speechSynthesis.speak(utterance);
 };

 const resetReminderTimer = () => {
 if (reminderTimerRef.current) {
 clearTimeout(reminderTimerRef.current);
 }
 
 if (!isConnected) return; // Don't run reminder if disconnected to avoid mechanical browser TTS
 
 reminderTimerRef.current = setTimeout(() => {
 if (!hasClickedConnect) {
 const reminderText = selectedLang === 'EN'
 ? "Remember to click the CONNECT button to start."
 : "Recuerda hacer clic en el botón CONECTA para comenzar.";
 
 sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following reminder message in your natural voice. Do not write any scores, tags, or explanations, just say this exact message clearly: "${reminderText}"]`);
 }
 }, 4000);
 };

 useEffect(() => {
 if (!hasClickedConnect) {
 resetReminderTimer();
 } else {
 if (reminderTimerRef.current) {
 clearTimeout(reminderTimerRef.current);
 reminderTimerRef.current = null;
 }
 }
 return () => {
 if (reminderTimerRef.current) {
 clearTimeout(reminderTimerRef.current);
 }
 };
 }, [hasClickedConnect, isConnected, selectedLang]);

 // Speak explanation when arriving at the Teacher, Profile, or Settings section
 useEffect(() => {
 // 1. Play pin sound and pause conversation whenever we switch page sections (from any tab to any other tab except chat)
 if (lastVisitedTabRef.current && lastVisitedTabRef.current !== rightPanelTab) {
 playPinSound();
 if (isConnected && rightPanelTab !== 'chat') {
 pause();
 }
 }

 // 2. Speak welcome explanation for the new tab section (resuming audio for the new context)
 if (rightPanelTab === 'civics' && lastVisitedTabRef.current !== 'civics') {
 resume();
 const speech = selectedLang === 'EN'
 ? "Welcome to the USCIS Civics 128 citizenship prep module! I am Officer Voyager, your USCIS civics tutor. Are you ready to practice official questions or take a simulated oral interview?"
 : "Bienvenido al módulo de Ciudadanía 128 de USCIS. Soy Officer Voyager, tu oficial tutor de cívica. ¿Estás listo para repasar las preguntas oficiales o realizar un simulacro de entrevista oral?";

 setChatMessages(prev => {
 if (prev.some(m => m.id === 'welcome_civics')) return prev;
 return [
 ...prev,
 {
 id: 'welcome_civics',
 sender: 'splash',
 text: speech,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 timeMs: Date.now(),
 tab: 'civics'
 }
 ];
 });

 if (isConnected) {
 const civicsSystemInstructions = ConversationModePolicy.getCivicsSystemInstructions();
 sendText(civicsSystemInstructions);

 setTimeout(() => {
 sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following welcome message in your natural voice as Officer Voyager. Do not write any text in the transcript or chat, just speak this message: "${speech}".]`);
 }, 1000);
 }
 } else if (rightPanelTab === 'teachers' && lastVisitedTabRef.current !== 'teachers') {
 resume();
 const speech = selectedLang === 'EN'
 ? "Welcome to the Teacher section! You have the option to hire Alejandra Francois, La Profe. She is our native bilingual Master English Immersion Coach and NYC Accent Specialist who can help you learn Spanish and English through personalized live 1-on-1 private lessons, accent correction, and direct chat support."
 : "Bienvenido a la sección de La Profe. Tienes la opción de contratar a Alejandra Francois, La Profe. Ella es nuestra Coach Maestra de Inmersión y Especialista en Acento de Nueva York, bilingüe nativa. Te ayudará a aprender español e inglés a través de clases particulares en vivo 1-a-1, corrección de pronunciación y soporte por chat.";

 if (isConnected) {
 sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following welcome message in your natural voice. Do not write any text in the transcript or chat, just speak this message: "${speech}"]`);
 }
 } else if (rightPanelTab === 'roadmap' && lastVisitedTabRef.current !== 'roadmap') {
 resume();
 const speech = selectedLang === 'EN'
 ? "Welcome to your Profile space! Here you can edit your fluency goals, view your Google account authentication details, monitor your grammar and pronunciation scores, track your daily learning curriculum roadmap, and check your master instructor session logs."
 : "Bienvenido a tu sección de Perfil. Aquí puedes configurar tus metas de fluidez, revisar tu cuenta de Google, monitorear tus puntajes de gramática y pronunciación, seguir tu currículo diario de aprendizaje y ver el registro de tus clases particulares.";

 if (isConnected) {
 sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following welcome message in your natural voice. Do not write any text in the transcript or chat, just speak this message: "${speech}"]`);
 }
 } else if (rightPanelTab === 'settings' && lastVisitedTabRef.current !== 'settings') {
 resume();
 const speech = selectedLang === 'EN'
 ? "Welcome to the Settings panel! Here you can configure the interface language, select translation and subtitle modes, toggle text-only listen-only mode, adjust voice speech rates, set your daily practice goals, and customize pedagogical feedback levels."
 : "Bienvenido al panel de Configuración. Aquí puedes configurar el idioma de la interfaz, elegir los modos de traducción y subtítulos, activar el modo de solo escucha sin audio, ajustar la velocidad de reproducción de voz de Voyager, establecer tus metas de práctica diarias y personalizar el nivel de feedback pedagógico.";

 if (isConnected) {
 sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following welcome message in your natural voice. Do not write any text in the transcript or chat, just speak this message: "${speech}"]`);
 }
 } else if (rightPanelTab === 'chat' && lastVisitedTabRef.current !== 'chat') {
 resume();
 const speech = selectedLang === 'EN'
 ? "Welcome back to our conversation! Let's continue practicing English."
 : "Bienvenido de vuelta a nuestra conversación. Sigamos practicando inglés.";

 if (isConnected) {
 // Restore active conversation mode prompt
 const activeMode = isEnglishOnlyMode ? 'AMERICAN_ENGLISH' : isSpanishOnlyMode ? 'SPANISH' : isBilingualMode ? 'BILINGUAL' : isTranslateMode ? 'LIVE_TRANSLATOR' : isListenOnly ? 'LISTEN_ONLY' : 'BILINGUAL';
 const restorePrompt = ConversationModePolicy.getDynamicModeSwitchPrompt(activeMode);
 if (restorePrompt) {
 sendText(restorePrompt);
 }
 
 // Speak transition welcome
 setTimeout(() => {
 sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following message in your natural voice. Do not write any text in the transcript or chat, just speak this message: "${speech}"]`);
 }, 1000);
 }
 } else if (rightPanelTab === 'shopping' && lastVisitedTabRef.current !== 'shopping') {
 resume();
 
 const questionSpeech = selectedLang === 'EN'
 ? "How can I help you today?"
 : "¿En qué te puedo ayudar hoy?";

 // Add Voyager welcome bubble to chat transcript so the user sees it in the chat
 setChatMessages(prev => {
 // Only add if not already present to avoid duplicate welcome bubbles
 if (prev.some(m => m.id === 'welcome_store')) return prev;
 return [
 ...prev,
 {
 id: 'welcome_store',
 sender: 'splash',
 text: questionSpeech,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 timeMs: Date.now(),
 tab: 'shopping'
 }
 ];
 });

 if (isConnected) {
 // Override system instructions for the VOYAGER TIENDA mission
 const storeSystemInstructions = `[INSTRUCCIÓN DE SISTEMA URGENTE Y MANDATORIA: Desde este momento, entra en vigor la Misión de VOYAGER TIENDA.
Eres VOYAGER TIENDA, el asesor conversacional de la tienda integrada de USA Voyager.
Eres un vendedor consultivo, cálido, paciente, entusiasta y experto. Tu objetivo es ayudar al usuario a descubrir, entender y elegir productos, materiales de estudio, libros de trabajo, mercancía oficial, membresías y paquetes de coaching con La Profe. No es una clase de inglés ni un chat general.

Reglas esenciales:
- Pronuncia “U.S.A.” en inglés americano: “you ess ay”.
- Habla solo en español o inglés. El español es el idioma predeterminado. Si aparece una palabra en inglés, pronúnciala con acento americano.
- Mantén la conversación exclusivamente relacionada con la tienda: productos, beneficios, diferencias entre opciones, materiales de estudio, paquetes, La Profe, coaching, precios, carrito, cuenta y compra.
- Haz una pregunta a la vez para entender qué necesita la persona: su meta, nivel, presupuesto, tiempo disponible, interés o situación de aprendizaje.
- Explica valor práctico antes de recomendar: para quién sirve el producto, qué problema resuelve, cómo se usa y qué resultado puede aportar.
- Recomienda con honestidad y sin presión. Si varias opciones encajan, compáralas brevemente y explica cuál parece la mejor según las necesidades del usuario.
- Nunca inventes productos, precios, disponibilidad, descuentos, políticas, resultados o información de pedidos. Si no tienes la información, dilo con claridad y ofrece revisar la tienda o el carrito.
- Si el usuario pregunta algo ajeno a TIENDA, responde brevemente que ese tema corresponde a CHARLA, LA PROFE o PERFIL, e invítalo a cambiar a la sección adecuada.
- No continúes conversaciones de CHARLA dentro de TIENDA. La conversación de TIENDA debe tener su propio historial y contexto.
- Responde con energía amable y clara. Usa frases breves, naturales y útiles. Evita sonar corporativo, robótico, insistente o excesivamente vendedor.
- NO des clases de inglés, NO corrijas gramática de inglés, NO enseñes inglés. Actúa estrictamente como asesor de ventas.]`;

 sendText(storeSystemInstructions);

 // Speak the question
 setTimeout(() => {
 sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following welcome message in your natural voice. Do not write any text in the transcript or chat, just speak this message: "${questionSpeech}".]`);
 }, 1000);
 }
 }
 lastVisitedTabRef.current = rightPanelTab;
 }, [rightPanelTab, selectedLang, isConnected, isEnglishOnlyMode, isSpanishOnlyMode, isBilingualMode, isTranslateMode, isListenOnly]);

 const getOnboardingStepTitle = (step: number, lang: 'EN' | 'ES') => {
 switch (step) {
 case 1:
 return lang === 'EN' ? 'What do you do?' : '¿A qué te dedicas?';
 case 11:
 return lang === 'EN' ? 'What is your professional goal?' : '¿Cuál es tu meta profesional?';
 case 112:
 return lang === 'EN' ? 'What is your area of interest?' : '¿Cuál es tu área de interés?';
 case 12:
 return lang === 'EN' ? 'What is your school level?' : '¿Cuál es tu nivel escolar?';
 case 122:
 return lang === 'EN' ? 'Why do you want to study English?' : '¿Por qué quieres estudiar inglés?';
 case 13:
 return lang === 'EN' ? 'Reason you want to learn?' : '¿Razón por la que quieres aprender?';
 case 14:
 return lang === 'EN' ? 'What type of organization do you belong to?' : '¿A qué tipo de organización perteneces?';
 case 142:
 return lang === 'EN' ? 'How and where do you teach your classes?' : '¿Cómo y de dónde das tus clases?';
 case 2:
 return lang === 'EN' ? 'What is your estimated English level?' : '¿Cuál es tu nivel estimado de inglés?';
 case 4:
 return lang === 'EN' ? 'Sign In' : 'Iniciar Sesión';
 case 3:
 return lang === 'EN' ? 'Select your starting conversation mode:' : 'Selecciona tu modo de conversación para iniciar:';
 default:
 return '';
 }
 };

 useEffect(() => {
 if (onboardingStep > 1 && onboardingStep !== lastSpokenStepRef.current) {
 const title = getOnboardingStepTitle(onboardingStep, selectedLang);
 if (title && isConnected) {
 const onboardingStepPrompt = `[INSTRUCCIÓN DE SISTEMA MANDATORIA: Estás guiando al usuario en el cuestionario de perfil. 
Habla en tu voz natural de Voyager y lee en voz alta ÚNICAMENTE la siguiente pregunta en español: "${title}".
REGLA CRÍTICA: NO digas nada más, NO saludes con "Hola", NO preguntes "¿Qué te trae por aquí hoy?" ni intentes iniciar una charla casual. Solo di la pregunta claramente y guarda silencio absoluto esperando la respuesta del usuario en la interfaz. 
NO respondas a ruidos, habla o ruidos de fondo.]`;
 sendText(onboardingStepPrompt);
 lastSpokenStepRef.current = onboardingStep;
 }
 }
 }, [onboardingStep, isConnected, selectedLang]);

 // Connect Flow Execution
 const executeConnectFlow = () => {
   setIsFadingMascot(true);
   setTimeout(() => {
     setHasClickedConnect(true);
     setOnboardingStep(1);
     setRightPanelTab('home');
     setChosenStartMode(null);
     setExplanationCountdown(null);
     setIsFadingMascot(false);
     connect(undefined, true); // Voice Connection started immediately to speak mode explanations
     resetReminderTimer();
   }, 400);
 };

 // Connect Click handler
 const handleConnectClick = () => {
   executeConnectFlow();
 };

 // Mode click handler
 const handleModeSelection = (modeId: ConversationMode) => {
 setChosenStartMode(modeId);
 resetReminderTimer(); // Reset reminder timer so they get a fresh 15 seconds after selecting a mode
 
 // Speak explanation of the selected mode
 let explanation = '';
 if (selectedLang === 'EN') {
 switch (modeId) {
 case 'SPANISH':
 explanation = "In Spanish mode, we will chat mostly in Spanish to answer your questions and explain idioms.";
 break;
 case 'BILINGUAL':
 explanation = "In Bilingual mode, I will respond first in Spanish and then repeat in English to help you build connections.";
 break;
 case 'AMERICAN_ENGLISH':
 explanation = "In English mode, we will converse and practice strictly and only in American English.";
 break;
 case 'LIVE_TRANSLATOR':
 explanation = "In Translator mode, I will instantly translate whatever you say between English and Spanish.";
 break;
 case 'LISTEN_ONLY':
 explanation = "In Listen mode, I will listen to your pronunciation and provide silent text corrections without speaking.";
 break;
 }
 } else {
 switch (modeId) {
 case 'SPANISH':
 explanation = "En el modo español, conversaremos principalmente en español para responder tus preguntas y explicarte modismos.";
 break;
 case 'BILINGUAL':
 explanation = "En el modo bilingüe, te responderé primero en español y luego repetiré la idea en inglés para ayudarte a asociar ambos idiomas.";
 break;
 case 'AMERICAN_ENGLISH':
 explanation = "En el modo de inglés, conversaremos y practicaremos de forma estricta y únicamente en inglés americano.";
 break;
 case 'LIVE_TRANSLATOR':
 explanation = "En el modo traductor, traduciré de forma instantánea todo lo que digas entre inglés y español.";
 break;
 case 'LISTEN_ONLY':
 explanation = "En el modo de escucha, escucharé tu pronunciación y te ofreceré correcciones por texto de manera silenciosa.";
 break;
 }
 }
 
 if (explanation) {
 if (isConnected) {
 sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following text in your natural voice. Do not write any scores, tags, or explanations, just say this phrase clearly: "${explanation}"]`);
 }
 }
 };

  // Helper to apply mode to Hook state
  const applyChosenMode = (mode: ConversationMode) => {
    switchMode(mode, selectedLang);
    setChosenStartMode(mode);
  };

 const handleCompleteOnboarding = () => {
 const saved = localStorage.getItem('voyager_user_account');
 const getGoalText = () => {
 if (selectedGoal === 'PROFESSIONAL') {
 const interestText = selectedProfInterest ? ` (${selectedProfInterest})` : '';
 if (selectedProfSubGoal === 'CONSEGUIR_EMPLEO') return `Professional: Conseguir Empleo${interestText}`;
 if (selectedProfSubGoal === 'COMUNICARME_TRABAJO') return `Professional: Mejorar Comunicación${interestText}`;
 return `Professional: Mejorar Salario${interestText}`;
 }
 if (selectedGoal === 'ESTUDIO') {
 const schoolText = selectedSchoolLevel ? ` (${selectedSchoolLevel})` : '';
 if (selectedAcademicGoal === 'PASS_EXAM') return `Academic: Pasar un Examen${schoolText}`;
 if (selectedAcademicGoal === 'ACADEMIC_SUCCESS') return `Academic: Éxito Académico${schoolText}`;
 if (selectedAcademicGoal === 'STUDY_ABROAD') return `Academic: Estudiar en el Extranjero${schoolText}`;
 if (selectedAcademicGoal === 'IMPROVE_CONVERSATION') return `Academic: Mejorar Conversación${schoolText}`;
 if (selectedAcademicGoal === 'GENERAL_KNOWLEDGE') return `Academic: Cultura General${schoolText}`;
    return `Academic: Cultura General${schoolText}`;
 }
 if (selectedGoal === 'VIAJANTE') {
 if (selectedViajanteSubGoal === 'EXPLORAR') return 'Travel: Explorar';
 if (selectedViajanteSubGoal === 'AMISTAD') return 'Travel: Amistad';
 return 'Travel: Cultura';
 }
 if (selectedGoal === 'DOCENTES') {
 const goalText = selectedDocenteGoal ? ` (${selectedDocenteGoal})` : '';
 if (selectedDocenteProfile === 'PROFESOR_INGLES') return `Teachers: Profesor de Inglés${goalText}`;
 if (selectedDocenteProfile === 'TUTOR_PRIVADO') return `Teachers: Tutor Privado${goalText}`;
 if (selectedDocenteProfile === 'ACADEMIA') return `Teachers: Academia de Idiomas${goalText}`;
 if (selectedDocenteProfile === 'PROFESOR_UNIVERSITARIO') return `Teachers: Profesor Universitario${goalText}`;
 if (selectedDocenteProfile === 'INSTRUCTOR_CORPORATIVO') return `Teachers: Instructor Corporativo${goalText}`;
 if (selectedDocenteProfile === 'ORGANIZACION') return `Teachers: Organización Educativa${goalText}`;
 if (selectedDocenteProfile === 'CREADOR_CONTENIDO') return `Teachers: Creador de Contenido${goalText}`;
 return `Docente${goalText}`;
 }
 return 'Travel & Daily Conversation';
 };
 const mapLevelEstimate = (lvl: typeof selectedLevel) => {
 if (lvl === 'BEGINNER') return 'Beginner';
 if (lvl === 'INTERMEDIATE') return 'Intermediate';
 if (lvl === 'ADVANCED') return 'Advanced';
 if (lvl === 'NOT_SURE') return 'Not Sure';
 return 'Intermediate';
 };
 let u = {
 name: userName.trim() || (selectedLang === 'EN' ? 'Learner' : 'Estudiante'),
 lastName: userLastName.trim() || undefined,
 email: userEmail.trim() || 'learner@usavoyager.com',
 password: userPassword.trim() || undefined,
 age: userAge.trim() ? parseInt(userAge.trim()) : undefined,
 country: userCountry.trim() || (selectedLang === 'EN' ? 'Unknown' : 'Desconocido'),
 provider: 'Guest' as const,
 goal: getGoalText(),
 levelEstimate: mapLevelEstimate(selectedLevel),
 completedDays: [1],
 plan: 'FREE' as const
 };
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 u = {
 ...parsed,
 name: userName.trim() || parsed.name,
 email: userEmail.trim() || parsed.email,
 age: userAge.trim() ? parseInt(userAge.trim()) : parsed.age,
 country: userCountry.trim() || parsed.country,
 goal: getGoalText(),
 levelEstimate: mapLevelEstimate(selectedLevel),
 };
 } catch (e) {}
 }
 localStorage.setItem('voyager_user_account', JSON.stringify(u));
 handleContinuaClick();
 };

 // Continua Click handler
 const handleContinuaClick = () => {
 const modeToUse = chosenStartMode || 'SPANISH';
 window.speechSynthesis.cancel();
 setRightPanelTab('chat');
 setHasInteracted(true);
 applyChosenMode(modeToUse);
 setExplanationCountdown(null);
 setChatMessages([]); // Clear system option explanations from chat history
 resume();

 const saved = localStorage.getItem('voyager_user_account');
 let userGoal = undefined;
 let userLevel = undefined;
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 userGoal = parsed.goal;
 userLevel = parsed.levelEstimate;
 } catch (e) {}
 }

 const greetingPrompt = ConversationModePolicy.getSystemInstructionsForMode(modeToUse, {
 selectedLang,
 userName,
 userAge,
 userCountry,
 userGoal,
 userLevel
 });
 const onboardingWelcomePrompt = `[SYSTEM INSTRUCTION: Crucial Onboarding First Greeting. Speak aloud and write in the chat a warm welcome message in Spanish:
1. Start strictly with: "¡Bienvenidos!" or "¡Bienvenidos a Voyager!".
2. NEVER say "Bienvenidos, Estudiante!" or "Bienvenidos, Learner!" or "Bienvenido" or "Bienvenida".
3. Remind them that you have placed them in Spanish mode ("Modo Español").
4. Explain that you did this so you can explain to them clearly how the app works.
5. Keep the greeting fully in Spanish.
This message is very important to set up the user for their journey. Do not use English yet.]
${greetingPrompt}`;
 
 if (isConnected) {
 sendText(onboardingWelcomePrompt);
 } else {
 connect(onboardingWelcomePrompt, true);
 }
 };

 // Start Conversation trigger
 const handleStartConversation = () => {
 const modeToUse = chosenStartMode || 'SPANISH';
 setExplanationCountdown(null);
 setHasInteracted(true);
 window.speechSynthesis.cancel();
 setChatMessages([]); // Clear system option explanations from chat history
 resume();

 const saved = localStorage.getItem('voyager_user_account');
 let userGoal = undefined;
 let userLevel = undefined;
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 userGoal = parsed.goal;
 userLevel = parsed.levelEstimate;
 } catch (e) {}
 }

 const greetingPrompt = ConversationModePolicy.getSystemInstructionsForMode(modeToUse, {
 selectedLang,
 userName,
 userAge,
 userCountry,
 userGoal,
 userLevel
 });
 const onboardingWelcomePrompt = `[SYSTEM INSTRUCTION: Crucial Onboarding First Greeting. Speak aloud and write in the chat a warm welcome message in Spanish:
1. Start strictly with: "¡Bienvenidos!" or "¡Bienvenidos a Voyager!".
2. NEVER say "Bienvenidos, Estudiante!" or "Bienvenidos, Learner!" or "Bienvenido" or "Bienvenida".
3. Remind them that you have placed them in Spanish mode ("Modo Español").
4. Explain that you did this so you can explain to them clearly how the app works.
5. Keep the greeting fully in Spanish.
This message is very important to set up the user for their journey. Do not use English yet.]
${greetingPrompt}`;
 
 if (isConnected) {
 applyChosenMode(modeToUse);
 sendText(onboardingWelcomePrompt);
 } else {
 connect(onboardingWelcomePrompt, true);
 }
 };

 // Countdown timer effect
 useEffect(() => {
 if (explanationCountdown === null) return;
 if (explanationCountdown <= 0) {
 handleStartConversation();
 return;
 }
 const timer = setTimeout(() => {
 setExplanationCountdown(prev => (prev !== null ? prev - 1 : null));
 }, 1000);
 return () => clearTimeout(timer);
 }, [explanationCountdown]);

 // Disconnect handler
 const handleDisconnectClick = () => {
 disconnect();
 window.speechSynthesis.cancel();
 setHasClickedConnect(false);
 setHasInteracted(false);
 setChosenStartMode(null);
 setRightPanelTab('home');
 setExplanationCountdown(null);
 setShowReviewScreen(false);
 };

 // End Session handler
 const handleEndSessionClick = () => {
 disconnect();
 window.speechSynthesis.cancel();
 setHasClickedConnect(false);
 setHasInteracted(false);
 setChosenStartMode(null);
 setRightPanelTab('home');
 setExplanationCountdown(null);
 setShowReviewScreen(false);
 };

  const handlePlayButtonClick = () => {
    setHasClickedConnect(true);
    setHasInteracted(true);
    const isWsReady = isConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN;
    
    if (!isWsReady) {
      if (isPaused) {
        resume();
      }
      handleStartConversation();
    } else if (isPaused) {
      resume();
      if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      if (rightPanelTab === 'home') {
        setRightPanelTab("chat");
      }
      
      let resumePrompt = "";
      if (rightPanelTab === 'civics' || rightPanelTab === 'citizenship') {
        resumePrompt = selectedLang === "EN"
          ? "[SYSTEM INSTRUCTION: The user clicked Play in the CIUDADANÍA section. As Officer Voyager, speak aloud a short, encouraging greeting in 1 brief sentence inviting them to continue their USCIS Civics practice.]"
          : "[SYSTEM INSTRUCTION: El usuario presionó reproducir en la sección de CIUDADANÍA. Como Officer Voyager, salúdalo en 1 frase e invítalo a continuar su práctica de cívica de USCIS.]";
      } else if (rightPanelTab === 'shopping') {
        resumePrompt = selectedLang === "EN"
          ? "[SYSTEM INSTRUCTION: The user clicked Play in the TIENDA section. Speak aloud a short sentence asking how you can help them with USA Voyager store products.]"
          : "[SYSTEM INSTRUCTION: El usuario presionó reproducir en la sección de TIENDA. Salúdalo en 1 frase y pregúntale cómo puedes ayudarlo con los productos de la tienda.]";
      } else {
        resumePrompt = selectedLang === "EN"
          ? "[SYSTEM INSTRUCTION: The user clicked Play to resume practice. Speak aloud a warm greeting in 1 short sentence and invite them to continue.]"
          : "[SYSTEM INSTRUCTION: El usuario presionó reproducir para reanudar la práctica. Salúdalo cálidamente en voz alta con 1 frase corta e invítalo a continuar.]";
      }
      sendText(resumePrompt);
    } else {
      if (rightPanelTab === 'home') {
        setRightPanelTab("chat");
      }
    }
  };

  const handlePauseButtonClick = () => {
    pause();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setChatMessages(prev => [
      ...prev,
      {
        id: `msg_sys_pause_${Date.now()}`,
        sender: 'system',
        text: selectedLang === 'EN' ? '⏸️ Conversation paused.' : '⏸️ Conversación en pausa.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMs: Date.now()
      }
    ]);
  };
 const sendMessageWithDictationCheck = (msgText: string) => {
   const trimmed = msgText.trim();
   if (!trimmed) return;
   setIsDictationActive(false);
   setInputText('');
   addUserMessage(trimmed);
   sendText(trimmed);
   if (wasPausedForDictationRef.current || isPaused) {
     resume();
     wasPausedForDictationRef.current = false;
   }
 };

 // Text message send
 const handleSendMessage = (e: React.FormEvent) => {
 e.preventDefault();
 if (!inputText.trim()) return;
 sendMessageWithDictationCheck(inputText);
 };

 // Suggestion pill click
 const handleSuggestionClick = (text: string) => {
 setHasInteracted(true);
 addUserMessage(text);
 sendText(text);
 };

 // Lead submit
 const handleInlineLeadSubmit = async () => {
 setIsSubmittingInlineLead(true);
 setInlineLeadError(null);
 try {
 await new Promise(resolve => setTimeout(resolve, 1000));
 setInlineLeadSuccess(true);
 } catch (err: any) {
 setInlineLeadError(err.message || "Error saving practice log.");
 } finally {
 setIsSubmittingInlineLead(false);
 }
 };

 // Connect to Gemini proxy
 const connectToGemini = (prompt?: string, isVoice: boolean = false) => {
 connect(prompt, isVoice);
 };

 // Days in month helper for calendar
 const getDaysInMonth = (date: Date) => {
 const year = date.getFullYear();
 const month = date.getMonth();
 const firstDay = new Date(year, month, 1).getDay();
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
 
 const days: (number | null)[] = [];
 for (let i = 0; i < adjustedFirstDay; i++) {
 days.push(null);
 }
 for (let i = 1; i <= daysInMonth; i++) {
 days.push(i);
 }
 return days;
 };

 const isViajante = selectedGoal === 'VIAJANTE';
 const totalOnboardingSteps = isViajante ? 4 : 5;

 let currentStepIdx = 1;
 if (onboardingStep === 1) {
 currentStepIdx = 1;
 } else if (onboardingStep === 11 || onboardingStep === 12 || onboardingStep === 13 || onboardingStep === 14) {
 currentStepIdx = 2;
 } else if (onboardingStep === 112 || onboardingStep === 122 || onboardingStep === 142) {
 currentStepIdx = 3;
 } else if (onboardingStep === 2) {
 currentStepIdx = isViajante ? 3 : 4;
 } else if (onboardingStep === 4) {
 currentStepIdx = isViajante ? 4 : 5;
 }

 const stepsLeft = totalOnboardingSteps - currentStepIdx;

 const handleOnboardingBack = () => {
 if (onboardingStep === 1) {
 setHasClickedConnect(false);
 setOnboardingStep(0);
 } else if (onboardingStep === 11 || onboardingStep === 13 || onboardingStep === 14) {
 setOnboardingStep(1);
 } else if (onboardingStep === 12) {
 setOnboardingStep(1);
 } else if (onboardingStep === 112) {
 setOnboardingStep(11);
 } else if (onboardingStep === 122) {
 setOnboardingStep(12);
 } else if (onboardingStep === 142) {
 setOnboardingStep(14);
 } else if (onboardingStep === 2) {
 if (selectedGoal === 'PROFESSIONAL') {
 setOnboardingStep(112);
 } else if (selectedGoal === 'ESTUDIO') {
 setOnboardingStep(122);
 } else if (selectedGoal === 'VIAJANTE') {
 setOnboardingStep(13);
 } else if (selectedGoal === 'DOCENTES') {
 setOnboardingStep(142);
 }
 } else if (onboardingStep === 4) {
 setOnboardingStep(2);
 }
 };

 const handleOnboardingNext = () => {
 if (onboardingStep === 1) {
 if (!selectedGoal) return;
 if (selectedGoal === 'PROFESSIONAL') {
 setOnboardingStep(11);
 } else if (selectedGoal === 'VIAJANTE') {
 setOnboardingStep(13);
 } else if (selectedGoal === 'ESTUDIO') {
 setOnboardingStep(12);
 } else if (selectedGoal === 'DOCENTES') {
 setOnboardingStep(14);
 }
 } else if (onboardingStep === 12) {
 if (!selectedSchoolLevel) return;
 setOnboardingStep(122);
 } else if (onboardingStep === 11) {
 if (!selectedProfSubGoal) return;
 setOnboardingStep(112);
 } else if (onboardingStep === 14) {
 if (!selectedDocenteProfile) return;
 setOnboardingStep(142);
 } else if (onboardingStep === 112 || onboardingStep === 122 || onboardingStep === 13 || onboardingStep === 142) {
 if (onboardingStep === 112 && !selectedProfInterest) return;
 if (onboardingStep === 122 && !selectedAcademicGoal) return;
 if (onboardingStep === 13 && !selectedViajanteSubGoal) return;
 if (onboardingStep === 142 && !selectedDocenteGoal) return;
 setOnboardingStep(2);
 } else if (onboardingStep === 2) {
 if (!selectedLevel) return;
 setOnboardingStep(4);
 } else if (onboardingStep === 4) {
 if (userName.trim() === '' || userEmail.trim() === '' || userPassword.trim() === '') return;
 handleCompleteOnboarding();
 }
 };

 const handleJumpToStep = (stepNum: number) => {
 if (stepNum === 1) {
 setOnboardingStep(1);
 return;
 }
 if (!selectedGoal) return;
 
 if (isViajante) {
 // 4-step flow: 1 (Goal), 2 (Subgoal - 13), 3 (Level - 2), 4 (Form - 4)
 if (stepNum === 2) {
 setOnboardingStep(13);
 } else if (stepNum === 3) {
 if (!selectedViajanteSubGoal) return;
 setOnboardingStep(2);
 } else if (stepNum === 4) {
 if (!selectedViajanteSubGoal || !selectedLevel) return;
 setOnboardingStep(4);
 }
 } else {
 // 5-step flow: Professional & Estudio & Docentes
 if (stepNum === 2) {
 if (selectedGoal === 'PROFESSIONAL') setOnboardingStep(11);
 else if (selectedGoal === 'ESTUDIO') setOnboardingStep(12);
 else if (selectedGoal === 'DOCENTES') setOnboardingStep(14);
 } else if (stepNum === 3) {
 if (selectedGoal === 'PROFESSIONAL') {
 if (!selectedProfSubGoal) return;
 setOnboardingStep(112);
 } else if (selectedGoal === 'ESTUDIO') {
 if (!selectedSchoolLevel) return;
 setOnboardingStep(122);
 } else if (selectedGoal === 'DOCENTES') {
 if (!selectedDocenteProfile) return;
 setOnboardingStep(142);
 }
 } else if (stepNum === 4) {
 if (selectedGoal === 'PROFESSIONAL') {
 if (!selectedProfSubGoal || !selectedProfInterest) return;
 } else if (selectedGoal === 'ESTUDIO') {
 if (!selectedSchoolLevel || !selectedAcademicGoal) return;
 } else if (selectedGoal === 'DOCENTES') {
 if (!selectedDocenteProfile || !selectedDocenteGoal) return;
 }
 setOnboardingStep(2);
 } else if (stepNum === 5) {
 if (selectedGoal === 'PROFESSIONAL') {
 if (!selectedProfSubGoal || !selectedProfInterest || !selectedLevel) return;
 } else if (selectedGoal === 'ESTUDIO') {
 if (!selectedSchoolLevel || !selectedAcademicGoal || !selectedLevel) return;
 } else if (selectedGoal === 'DOCENTES') {
 if (!selectedDocenteProfile || !selectedDocenteGoal || !selectedLevel) return;
 }
 setOnboardingStep(4);
 }
 }
 };

 const isFinalStep = onboardingStep === 4 || onboardingStep === 3;
 const nextTitle = isFinalStep 
 ? (selectedLang === 'EN' ? 'Connect' : 'Conecta') 
 : (selectedLang === 'EN' ? 'Next' : 'Siguiente');
 const nextBtnClasses = isFinalStep
 ? "w-9 h-9 rounded-full border-[1.5pt] border-red-600 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 bg-transparent"
 : "w-9 h-9 rounded-full border-[1.5pt] border-black/40 text-black/40 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 bg-transparent";

  const renderConversationalMenuContent = () => (
    <div className="w-72 bg-[#08152E]/90 backdrop-blur-md border border-[#EAB308]/80 rounded-2xl p-2.5 shadow-2xl animate-fade-in flex flex-col text-white text-left">
      {/* Header Title */}
      <div className="px-2 py-1 mb-1.5 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-white">
          {selectedLang === 'EN' ? 'Conversational Menu' : 'Menú Conversacional'}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsConversationalMenuOpen(false);
            setIsPassportModeMenuOpen(false);
            setIsInputActionsMenuOpen(false);
          }}
          className="text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-0.5 custom-scrollbar">
        {PRACTICE_SCENARIOS.map((scenario) => {
          const IconComp = scenario.icon;
          const name = selectedLang === 'EN' ? scenario.nameEn : scenario.nameEs;
          const isSelected = activeScenarioId === scenario.id;

          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => {
                handleSelectScenario(scenario.id);
                setIsConversationalMenuOpen(false);
                setIsPassportModeMenuOpen(false);
                setIsInputActionsMenuOpen(false);
              }}
              className={`w-full flex items-center px-2 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer group bg-transparent ${
                isSelected
                  ? 'text-[#EAB308] font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 w-full">
                <IconComp className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? 'text-[#EAB308]' : 'text-gray-400 group-hover:text-white'}`} />
                <span className="text-xs font-semibold leading-snug truncate">
                  {name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

 const placeholderText = selectedLang === 'EN' 
 ? 'Write or dictate...' 
 : 'Escribe o dicta...';

 return (
 <div 
 className="relative min-h-[100dvh] h-[100dvh] md:h-screen w-full bg-[#0D224A] flex items-center justify-center p-0 md:px-2 md:py-0.5 overflow-hidden select-none"
 style={{
 backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)',
 backgroundSize: '24px 24px'
 }}
 >
 {/* Layout Grid with 125% Passport, Adjusted Cover and Perfect Tight Gutter */}
 <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-0 w-full max-w-7xl max-h-[100dvh] md:max-h-[min(100dvh,860px)] md:h-[min(96dvh,840px)] items-stretch justify-center mx-auto">
 
 {/* Left Side (Column 1): The Passport (Deep Navy Voyager Blue Console) */}
 {/* It remains CONSTANT throughout the entire session */}
  <div className="hidden md:flex md:col-span-1 bg-gradient-to-b from-[#153166] to-[#0a1833] border border-[#2563eb]/20 rounded-[16px] sm:rounded-[24px] md:rounded-[32px] px-1.5 py-2 sm:p-3 md:p-5 flex-col justify-between items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.65)] relative overflow-hidden w-full h-full min-h-[380px] sm:min-h-[420px] md:min-h-0">
  {/* Ambient Background Glow */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
  {/* Top Logo */}
  <div className="pt-2 sm:pt-3 flex flex-col items-center justify-center text-center select-none z-20">
    <span style={{ fontFamily: '"Allerta Stencil", sans-serif', letterSpacing: '0.25em' }} className="text-[10px] sm:text-xs font-bold text-white/90 uppercase tracking-widest block leading-none">
      YO SOY USA
    </span>
    <h1 style={{ fontFamily: '"Allerta Stencil", sans-serif', textShadow: '0 2px 12px rgba(0,0,0,0.7)', letterSpacing: '0.12em' }} className="text-2xl sm:text-3xl md:text-[38px] lg:text-[44px] font-black text-white mt-1 uppercase block leading-none">
      VOYAGER<span className="text-[0.3em] font-light text-white/90 align-baseline ml-1 inline-block select-none" style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 300, letterSpacing: "normal" }}>®</span>
    </h1>
    <span style={{ fontFamily: "'Raleway', 'Allerta', sans-serif", letterSpacing: '0.18em' }} className="text-[8px] sm:text-[9.5px] md:text-[10.5px] font-normal text-[#FFD700] uppercase tracking-widest mt-1.5 sm:mt-2 block leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
      TU PASAPORTE AL INGLÉS AMERICANO
    </span>
  </div>

 {/* Glowing Golden Energy Sphere */}
 <div className="relative flex-grow flex-shrink min-h-0 w-full flex items-center justify-center pt-1 pb-4 md:pt-2 md:pb-6">
 <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-amber-500/10 blur-2xl animate-pulse pointer-events-none" />
 
 <div className="relative aspect-square max-h-full max-w-full flex items-center justify-center">
 <canvas 
  ref={particleCanvasRef} 
  width={800} 
  height={800} 
  className="z-20 transition-transform duration-75 animate-float-zero-g max-h-full max-w-full object-contain"
  style={{
    width: '100%',
    height: '100%',
    WebkitMaskImage: 'radial-gradient(circle at center, black 80%, transparent 99%)',
    maskImage: 'radial-gradient(circle at center, black 80%, transparent 99%)'
  }}
  />
  </div>
  </div>

  {/* Bottom Button Panel */}
  <div className="pb-3 md:pb-6 w-full z-10 flex flex-col items-center justify-center gap-3">
    {!hasClickedConnect ? (
      <button
        onClick={handleConnectClick}
        className="px-6 py-2 sm:px-8 sm:py-2.5 rounded-full bg-[#0D224A]/80 border-[1.5pt] border-white/40 hover:border-white/70 backdrop-blur-md text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-all duration-300 select-none cursor-pointer active:scale-95 hover:bg-[#15346e] flex items-center justify-center font-bold tracking-widest text-xs sm:text-sm md:text-base uppercase font-mono"
        title={selectedLang === 'EN' ? 'Enter' : 'Entrada'}
      >
        <span>ENTRADA</span>
      </button>
    ) : null}

    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={() => {
          setHasClickedConnect(true);
          setRightPanelTab('chat');
          setIsLiveVoiceActive(true);
          if (isPaused) {
            resume(true);
          }
          if (!isConnected) {
            connect();
          }
        }}
        title={selectedLang === 'EN' ? 'Go to Live Section' : 'Ir a la Sección Live'}
        aria-label="Live Chat"
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/70 text-amber-300 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center hover:scale-110"
      >
        <AudioLines className="w-5 h-5 stroke-[2.2]" />
      </button>
    </div>
  </div>
  </div>

 {/* Column 2 (Right Panel): The Cover Page (White layout) */}
 <div className={`md:col-span-1 ${isDarkMode && rightPanelTab === 'chat' ? 'bg-[#0F172A]' : hasClickedConnect ? 'bg-[#0D224A]' : 'bg-white'} rounded-none md:rounded-[32px] flex flex-col justify-between items-center text-center shadow-none md:shadow-[0_15px_35px_rgba(0,0,0,0.15)] relative overflow-hidden w-full h-[100dvh] md:h-full min-h-0 transition-colors duration-300`}>
 {!hasClickedConnect ? (
 /* Disconnected Landing Screen inside the Cover */
 <>
 <div className="flex-1 flex flex-col items-center justify-center pt-2 pb-2 w-full relative z-10">
 <img 
 src="https://lh3.googleusercontent.com/d/1uCm4fqE6Qfxg1lm1FsCbo35fVQcI_E5k" 
 alt="Voyager USA Mascot" 
 referrerPolicy="no-referrer"
 onClick={handleConnectClick}
 title={selectedLang === 'EN' ? 'Click to Connect' : 'Haz clic para conectar'}
 className="w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[340px] md:h-[340px] max-w-[95%] max-h-[40vh] object-contain animate-float-zero-g cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 mix-blend-multiply" 
 />
 <button
   onClick={handleConnectClick}
   className="mt-4 md:hidden px-8 py-2.5 rounded-full bg-[#0D224A] text-white font-mono font-bold text-xs uppercase tracking-widest border border-amber-400/60 shadow-xl active:scale-95 hover:bg-[#15346e] transition-all cursor-pointer"
   title={selectedLang === 'EN' ? 'Enter' : 'Entrada'}
 >
   ENTRADA
 </button>
 </div>



 {/* Footer Text */}
 <div className="pb-4 z-10 px-2 flex flex-col items-center flex-shrink-0 w-full">
 {/* Footer Buttons Row */}
 <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-mono select-none max-w-full">
 {/* Copyright Button */}
 <button 
 onClick={() => setActivePolicyModal('copyright')}
 className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer whitespace-nowrap"
 >
 <span style={{ fontSize: '1.4em', lineHeight: '1' }} className="font-normal">©</span>
  <span>{selectedLang === 'EN' ? 'Copyright' : 'Derechos'}</span>
 </button>

 {/* Privacy Button */}
 <button 
 onClick={() => setActivePolicyModal('privacy')}
 className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer whitespace-nowrap"
 >
 <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{selectedLang === 'EN' ? 'Privacy' : 'Privacidad'}</span>
 </button>

 {/* Terms Button */}
 <button 
 onClick={() => setActivePolicyModal('terms')}
 className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer whitespace-nowrap"
 >
 <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{selectedLang === 'EN' ? 'Terms' : 'Términos'}</span>
 </button>

 {/* Contact Button */}
 <button 
 onClick={() => setActivePolicyModal('contact')}
 className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer whitespace-nowrap"
 >
 <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{selectedLang === 'EN' ? 'Contact' : 'Contacto'}</span>
 </button>
 </div>
 </div>
 </>
 ) : (
 /* Connected Workspace Area inside the Cover */
 <div className="w-full h-full flex flex-col overflow-hidden bg-transparent">
 {/* Header / Tabs */}
 {/* Top Header with Hamburger Button */}
 <div className={`w-full ${isDarkMode && rightPanelTab === 'chat' ? 'bg-[#0F172A] text-white' : 'bg-white text-black'} pt-[24px] ${rightPanelTab === 'civics' ? 'pb-3 sm:pb-4' : 'pb-1 sm:pb-1.5'} pl-4 sm:pl-6 pr-4 sm:pr-6 flex items-center justify-between sticky top-0 z-50 flex-shrink-0 relative transition-colors duration-300`}>
 {/* Left: Hamburger Toggle Button, Section Indicator, ON/OFF & Timer */}
 <div className="flex items-center gap-2 sm:gap-2.5 z-10">
 <button
 onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
 title={selectedLang === 'EN' ? 'Menu' : 'Menú'}
 aria-label={selectedLang === 'EN' ? 'Menu' : 'Menú'}
 className="relative p-1 text-slate-900 hover:text-black bg-transparent border-none rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 outline-none"
 >
  {isNavMenuOpen ? <X className={`w-6 h-6 ${isDarkMode && rightPanelTab === 'chat' ? 'text-white' : 'text-slate-900'}`} strokeWidth={3} /> : <Menu className={`w-6 h-6 ${isDarkMode && rightPanelTab === 'chat' ? 'text-white' : 'text-slate-900'}`} strokeWidth={3} />}
 {cartCount > 0 && !isNavMenuOpen && (
 <span 
 style={{ fontFamily: "'Allerta', 'Allerta Sans', sans-serif" }}
 className="absolute -top-1.5 -right-3.5 bg-black text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border border-white/30 shadow-md"
 >
 {cartCount}
 </span>
 )}
 </button>

 </div>

 {/* Center: USA VOYAGER Logo Copy (Hidden in questionnaire section) */}
 {!(!hasInteracted && hasClickedConnect) && (
 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none select-none pt-8 sm:pt-10 md:pt-12">

 <span style={{ fontFamily: '"Allerta Stencil", sans-serif', letterSpacing: '0.12em' }} className={`${(rightPanelTab === 'civics' || rightPanelTab === 'citizenship') ? 'text-base sm:text-xl md:text-2xl mb-1 sm:mb-2' : 'text-2xl sm:text-3xl md:text-[34px]'} font-black ${isDarkMode && rightPanelTab === 'chat' ? 'text-white' : 'text-[#0D224A]'} uppercase block leading-none mt-0.5 transition-colors duration-300`}>
  {rightPanelTab === 'civics' ? (
   selectedLang === 'EN' ? 'USCIS CIVICS' : 'USCIS CÍVICA'
  ) : rightPanelTab === 'citizenship' ? (
   'CIUDADANÍA'
  ) : (
   'CHARLA'
  )}
 </span>

 {rightPanelTab === 'chat' && hasInteracted && (
  <div className="pointer-events-auto mt-2 flex flex-col items-center justify-center animate-fade-in relative">
    <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 select-none">
      {/* Mode Selector Dropdown Button & Popover in CHARLA Header (First Position) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsModeMenuOpen(prev => !prev)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer outline-none select-none group ${
            isDarkMode && rightPanelTab === 'chat'
              ? 'text-[#EAB308] hover:bg-white/10'
              : 'text-[#0D224A] hover:bg-slate-100'
          }`}
          title={selectedLang === 'EN' ? 'Mode of Interaction' : 'Modo de Interactuar'}
        >
          <span className="font-bold tracking-tight text-[#EAB308]">
            {isPaused
              ? (selectedLang === 'EN' ? 'Pause' : 'Pausa')
              : (selectedLang === 'EN' ? currentModeObj.nameEn : currentModeObj.nameEs)}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#EAB308] group-hover:scale-110 transition-transform" />
        </button>

        {/* Quick Submenu Popover shared with Live Mode */}
        {isModeMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setIsModeMenuOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-[#08152E]/95 backdrop-blur-md border border-[#EAB308]/80 rounded-2xl p-2.5 shadow-2xl animate-fade-in flex flex-col text-white text-left">
              <div className="px-2 py-1 mb-1.5 flex items-center justify-between border-b border-white/10">
                <span className="text-sm font-semibold text-white">
                  {selectedLang === 'EN' ? 'Mode of Interaction' : 'Modo de Interactuar'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsModeMenuOpen(false)}
                  className="text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-0.5 custom-scrollbar">
                {modeDetails.map((mode) => {
                  const name = mode.nameEs;
                  const desc = mode.descEs;
                  const effectiveMode = isPaused ? null : currentModeObj.id;
                  const isSelected = effectiveMode === mode.id;

                  const renderModeIcon = () => {
                    const colorClass = isSelected ? 'text-[#EAB308]' : 'text-gray-400 group-hover:text-white transition-colors';
                    if (mode.id === 'SPANISH') {
                      return (
                        <span className={`w-5 h-5 flex items-center justify-center font-bold text-xs leading-none tracking-tight ${colorClass}`}>
                          ES
                        </span>
                      );
                    }
                    if (mode.id === 'BILINGUAL') {
                      return <RotateCw className={`w-4 h-4 shrink-0 ${colorClass}`} />;
                    }
                    if (mode.id === 'ADAPTIVE') {
                      return <Zap className={`w-4 h-4 shrink-0 ${colorClass}`} />;
                    }
                    if (mode.id === 'AMERICAN_ENGLISH') {
                      return (
                        <span className={`w-5 h-5 flex items-center justify-center font-bold text-xs leading-none tracking-tight ${colorClass}`}>
                          EN
                        </span>
                      );
                    }
                    if (mode.id === 'LIVE_TRANSLATOR') {
                      return <Languages className={`w-4 h-4 shrink-0 ${colorClass}`} />;
                    }
                    return <Headphones className={`w-4 h-4 shrink-0 ${colorClass}`} />;
                  };

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        if (isPaused) {
                          resume(true);
                        }
                        handleModeSelection(mode.id as ConversationMode);
                        applyChosenMode(mode.id as ConversationMode);
                        if (isConnected) {
                          sendText(`[INSTRUCCIÓN DE SISTEMA: El usuario ha seleccionado el modo de conversación: "${name}". Cambia tu estilo e idioma inmediatamente a este modo: "${desc}"]`);
                        }
                        setIsModeMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-2 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer group bg-transparent ${
                        isSelected
                          ? 'text-[#EAB308] font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          {renderModeIcon()}
                        </div>
                        <span className={`text-sm leading-tight whitespace-nowrap tracking-normal transition-colors ${
                          isSelected ? 'font-bold text-[#EAB308]' : 'font-normal text-gray-400 group-hover:text-white'
                        }`}>
                          {name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div className={`w-[1px] h-4 mx-1 ${isDarkMode && rightPanelTab === 'chat' ? 'bg-white/20' : 'bg-slate-300'}`} />

      {/* Alarm Clock Icon Button */}
      <button
        type="button"
        onClick={() => setIsGoalModalOpen(prev => !prev)}
        className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center ${
          isDarkMode && rightPanelTab === 'chat' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
        } ${
          targetGoalMinutes 
            ? "text-amber-500" 
            : isDarkMode && rightPanelTab === 'chat' ? "text-slate-300" : "text-slate-600"
        }`}
        title={
          selectedLang === "EN"
            ? targetGoalMinutes ? `Goal: ${targetGoalMinutes} min (Click to set goal)` : "Set Communication Goal / Alarm"
            : targetGoalMinutes ? `Meta: ${targetGoalMinutes} min (Haz clic para configurar)` : "Configurar Meta de Comunicación / Alarma"
        }
      >
        <AlarmClock className={`w-4 h-4 ${targetGoalMinutes ? 'animate-pulse text-amber-500' : ''}`} />
      </button>

      {/* Chronometer area */}
      <div 
        className={`flex items-center gap-1 font-mono text-sm sm:text-base font-semibold tracking-wider cursor-pointer transition-colors ${
          isDarkMode && rightPanelTab === 'chat' ? 'text-white' : 'text-[#0D224A]'
        }`}
        title={selectedLang === "EN" ? "Session duration & goal" : "Duración de la sesión y meta"}
        onClick={() => setIsGoalModalOpen(prev => !prev)}
      >
        <span>{formatChronometer(hasClickedConnect && isConnected ? secondsElapsed : 0)}</span>
        {targetGoalMinutes && (
          <span className="text-xs text-amber-500 font-sans font-bold">
            /{targetGoalMinutes}m
          </span>
        )}
      </div>

      <div className={`w-[1px] h-4 mx-1 ${isDarkMode && rightPanelTab === 'chat' ? 'bg-white/20' : 'bg-slate-300'}`} />

      {/* 2. Play / Pause action icon */}
      <button
        type="button"
        onClick={() => {
          if (!hasClickedConnect || !isConnected || isPaused) {
            handlePlayButtonClick();
          } else {
            handlePauseButtonClick();
          }
        }}
        className={`p-1.5 transition-all duration-200 rounded-full cursor-pointer active:scale-95 ${
          isDarkMode && rightPanelTab === 'chat' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
        } flex items-center justify-center ${
          (!hasClickedConnect || !isConnected || isPaused)
            ? "text-amber-500 hover:text-amber-600"
            : isDarkMode && rightPanelTab === 'chat' ? "text-white" : "text-[#0D224A] hover:text-amber-600"
        }`}
        title={
          !hasClickedConnect || !isConnected
            ? (selectedLang === "EN" ? "Turn on Voyager & Start Session" : "Encender Voyager e Iniciar Sesión")
            : isPaused
            ? (selectedLang === "EN" ? "Resume session" : "Reanudar sesión")
            : (selectedLang === "EN" ? "Pause session" : "Pausar sesión")
        }
      >
        {(!hasClickedConnect || !isConnected || isPaused) ? (
          <Play className="w-4 h-4 fill-current text-amber-500" />
        ) : (
          <Pause className="w-4 h-4 fill-current" />
        )}
      </button>

      {/* 3. Bookmark / Save Chat button */}
      <button
        type="button"
        onClick={handleBookmarkChat}
        className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center ${
          isDarkMode && rightPanelTab === 'chat' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
        }`}
        title={
          !isProfileCompleted
            ? (selectedLang === "EN" ? "Complete profile to activate chat saving" : "Completa tu perfil para activar guardado de chat")
            : currentBookmarkedChatId
            ? (selectedLang === "EN" ? "Chat saved in profile! Click to remove" : "¡Conversación guardada en perfil! Clic para quitar")
            : (selectedLang === "EN" ? "Bookmark & Save Chat to Profile" : "Guardar Conversación en el Perfil")
        }
      >
        <Bookmark className={`w-4 h-4 transition-colors ${
          currentBookmarkedChatId
            ? "fill-amber-500 text-amber-500"
            : isDarkMode && rightPanelTab === 'chat' ? "text-slate-300 hover:text-white" : "text-slate-400 hover:text-[#0D224A]"
        }`} />
      </button>

      {/* 4. Stop / Close action icon */}
      <button
        type="button"
        onClick={handleEndSessionClick}
        className={`p-1.5 transition-all duration-200 rounded-full cursor-pointer active:scale-95 ${
          isDarkMode && rightPanelTab === 'chat' ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        } flex items-center justify-center`}
        title={selectedLang === "EN" ? "Finish / Close Session" : "Finalizar / Cerrar Sesión"}
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>

    {/* Goal & Communication Milestones Popover Dropdown */}
    {isGoalModalOpen && (
      <div className="absolute top-full mt-2.5 z-50 w-72 sm:w-80 p-4 rounded-2xl bg-[#0D224A] border border-white/20 text-white shadow-2xl backdrop-blur-xl animate-fade-in text-left">
        <div className="flex items-center justify-between border-b border-white/15 pb-2.5 mb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlarmClock className="w-4.5 h-4.5" />
            <span>{selectedLang === 'EN' ? 'Communication Milestones' : 'Metas de Comunicación'}</span>
          </div>
          <button
            onClick={() => setIsGoalModalOpen(false)}
            className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Goal Progress Bar */}
        {targetGoalMinutes ? (
          <div className="bg-white/10 rounded-xl p-3 mb-3 border border-white/10">
            <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
              <span className="text-white/80">
                {selectedLang === 'EN' ? 'Target Progress' : 'Progreso de Meta'}
              </span>
              <span className="text-amber-300 font-bold font-mono">
                {formatChronometer(secondsElapsed)} / {targetGoalMinutes}:00
              </span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (secondsElapsed / (targetGoalMinutes * 60)) * 100)}%` }}
              />
            </div>
            {secondsElapsed >= targetGoalMinutes * 60 && (
              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{selectedLang === 'EN' ? 'Goal Milestone Reached! 🎉' : '¡Hito de Meta Alcanzado! 🎉'}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-white/70 mb-3 leading-relaxed">
            {selectedLang === 'EN' 
              ? 'Set a target practice duration to track goals and earn communication milestones!' 
              : '¡Configura una duración objetivo para alcanzar hitos de comunicación!'}
          </p>
        )}

        {/* Target Duration Selector Options */}
        <div className="space-y-1.5 mb-3">
          <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-1">
            {selectedLang === 'EN' ? 'Set Target Duration' : 'Configurar Duración Objetivo'}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[5, 10, 15, 20, 30].map(mins => (
              <button
                key={mins}
                onClick={() => {
                  setTargetGoalMinutes(mins);
                  if (secondsElapsed < mins * 60) setHasAchievedMilestone(false);
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                  targetGoalMinutes === mins
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-bold'
                    : 'bg-white/5 hover:bg-white/15 text-white border-white/10'
                }`}
              >
                <span>{mins} m</span>
              </button>
            ))}
            <button
              onClick={() => {
                setTargetGoalMinutes(null);
                setHasAchievedMilestone(false);
              }}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center ${
                targetGoalMinutes === null
                  ? 'bg-rose-500/80 text-white border-rose-400'
                  : 'bg-white/5 hover:bg-white/15 text-white/60 border-white/10'
              }`}
            >
              {selectedLang === 'EN' ? 'Off' : 'Desactivar'}
            </button>
          </div>
        </div>

        {/* Communication Milestones */}
        <div className="border-t border-white/10 pt-2.5">
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-2">
            {selectedLang === 'EN' ? 'Student Milestones' : 'Hitos del Estudiante'}
          </span>
          <div className="space-y-1.5 text-xs">
            <div className={`flex items-center justify-between p-1.5 rounded-lg ${secondsElapsed >= 300 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-white/50 bg-white/5'}`}>
              <span className="flex items-center gap-1.5 font-medium">
                <Target className="w-3.5 h-3.5 text-amber-400" /> 5m: {selectedLang === 'EN' ? 'Warm-up Sprint' : 'Calentamiento Inicial'}
              </span>
              {secondsElapsed >= 300 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className={`flex items-center justify-between p-1.5 rounded-lg ${secondsElapsed >= 600 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-white/50 bg-white/5'}`}>
              <span className="flex items-center gap-1.5 font-medium">
                <Target className="w-3.5 h-3.5 text-amber-400" /> 10m: {selectedLang === 'EN' ? 'Fluency Builder' : 'Constructor de Fluidez'}
              </span>
              {secondsElapsed >= 600 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className={`flex items-center justify-between p-1.5 rounded-lg ${secondsElapsed >= 900 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-white/50 bg-white/5'}`}>
              <span className="flex items-center gap-1.5 font-medium">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> 15m: {selectedLang === 'EN' ? 'Mastery Milestone' : 'Hito de Maestría'}
              </span>
              {secondsElapsed >= 900 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
 )}

 {rightPanelTab === 'civics' && (
  <span className="text-[14px] sm:text-[17px] text-black font-normal tracking-tight mt-0.5 pb-2 block truncate max-w-[360px] sm:max-w-xl">
    {selectedLang === 'EN' 
      ? 'Complete study bank with verified USCIS citations (M-1778)' 
      : 'Banco completo con citas oficiales verificadas de USCIS (M-1778)'}
  </span>
 )}
 {rightPanelTab === 'citizenship' && (
  <span className="text-[13px] sm:text-[16px] text-slate-700 font-normal tracking-tight mt-0.5 pb-2 block truncate max-w-[360px] sm:max-w-xl">
    {selectedLang === 'EN'
      ? 'First understand, then practice, and finally take the exam.'
      : 'Primero comprende, luego practica y finalmente toma el examen.'}
  </span>
 )}
 </div>
 )}

 {/* Right: Dark Mode Toggle Button opposite to hamburger menu */}
 <div className="z-10 flex items-center gap-2">
   {rightPanelTab === 'chat' && (
     <button
       type="button"
       onClick={() => setIsDarkMode(prev => !prev)}
       title={isDarkMode ? (selectedLang === 'EN' ? 'Light Mode' : 'Modo Claro') : (selectedLang === 'EN' ? 'Dark Mode' : 'Modo Oscuro')}
       aria-label={isDarkMode ? (selectedLang === 'EN' ? 'Light Mode' : 'Modo Claro') : (selectedLang === 'EN' ? 'Dark Mode' : 'Modo Oscuro')}
       className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center active:scale-95 bg-transparent border-none shadow-none ${
         isDarkMode
           ? 'text-amber-400 hover:text-amber-300'
           : 'text-slate-700 hover:text-black'
       }`}
     >
       {isDarkMode ? (
         <Sun className="w-5 h-5 fill-amber-400/20" strokeWidth={2.2} />
       ) : (
         <Moon className="w-5 h-5" strokeWidth={2.2} />
       )}
     </button>
   )}
 </div>

 {/* Vertical Column Bar Dropdown Menu */}
 {isNavMenuOpen && (
 <>
 {/* Backdrop Overlay */}
 <div 
 className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity" 
 onClick={() => setIsNavMenuOpen(false)} 
 />

 {/* Column Menu Drawer */}
 <div className="absolute top-full left-2 mt-2 w-52 z-50 bg-[#0B1B3D]/95 border border-[#FFD700]/40 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl animate-fade-in flex flex-col text-white">
 {[
 { id: 'home', icon: Home, label: selectedLang === 'EN' ? 'HOME' : 'INICIO', hash: '' },
 { id: 'citizenship', icon: BookOpen, label: selectedLang === 'EN' ? 'CITIZENSHIP' : 'CIUDADANÍA', hash: '#/citizenship' },
 { id: 'chat', icon: Bot, label: selectedLang === 'EN' ? 'CHAT' : 'CHARLA', hash: '' },
 { id: 'teachers', icon: Apple, label: selectedLang === 'EN' ? 'TEACHER' : 'LA PROFE', hash: '' },
 { id: 'roadmap', icon: User, label: visitorFullName ? visitorFullName.toUpperCase() : (selectedLang === 'EN' ? 'GUEST' : 'INVITADO'), hash: '' },
 { id: 'shopping', icon: ShoppingCart, label: selectedLang === 'EN' ? 'STORE' : 'LA TIENDA', badge: cartCount > 0 ? cartCount : undefined, hash: '#/shop' },
 { id: 'settings', icon: Settings, label: selectedLang === 'EN' ? 'SETTINGS' : 'CONFIGURA', hash: '' },
 ].map((item) => {
 const IconComponent = item.icon;
 const isCitizenshipActive = item.id === 'citizenship' && (rightPanelTab === 'citizenship' || rightPanelTab === 'civics');
 const isHomeActive = item.id === 'home' && rightPanelTab === 'home';
 const isActive = isCitizenshipActive || isHomeActive || (rightPanelTab === item.id);
 return (
 <button
 key={item.id}
 onClick={() => {
 if (item.id === 'citizenship' || item.id === 'civics') {
   setRightPanelTab('citizenship');
   window.location.hash = '#/citizenship';
   setHasInteracted(true);
 } else if (item.id === 'home') {
   setRightPanelTab('home');
   window.location.hash = '';
 } else {
   setRightPanelTab(item.id as any);
   window.location.hash = item.hash;
   setHasInteracted(true);
 }
 if (!isConnected) {
   connect(undefined, true);
 } else if (isPaused) {
   resume();
 }
 setIsNavMenuOpen(false);
 }}
 className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
 isActive 
 ? 'bg-[#FFD700]/15 text-[#FFD700] font-bold' 
 : 'text-white/80 hover:text-white hover:bg-white/10 font-semibold'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-4 h-4 flex items-center justify-center shrink-0">
 <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FFD700]' : 'text-white/70'}`} />
 </div>
 <span className="text-xs uppercase tracking-wider leading-tight whitespace-nowrap">
 {item.label}
 </span>
 </div>
 {item.badge && (
 <span 
 style={{ fontFamily: "'Allerta', 'Allerta Sans', sans-serif" }}
 className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0 border border-white/20">
 {item.badge}
 </span>
 )}
 </button>
 );
 })}
 </div>
 </>
 )}
 </div>


 {showReviewScreen ? (
 <div className="flex-1 flex flex-col justify-between p-6 animate-fade-in bg-zinc-950 tab-content-area">
 <div className="text-center mb-4">
 <span className="text-xs tracking-widest uppercase text-yellow-500 font-mono">PROGRESO</span>
 <h3 className="text-lg text-white font-bold uppercase tracking-wider mt-1">Estadísticas de tu Interacción</h3>
 </div>
 
 <div className="flex-1 flex justify-center items-center overflow-hidden">
 <div className="w-full max-w-[95%] md:max-w-[75%] transform scale-95 md:scale-75 origin-center my-auto">
 <ProgressDashboard 
 selectedLang={selectedLang}
 scores={scores}
 learnedWords={learnedWords}
 accentPatterns={accentPatterns}
 onAskVoyager={(text) => {
 setShowReviewScreen(false);
 setChatMessages([
 {
 id: 'welcome_1',
 sender: 'splash',
 text: translations[selectedLang].welcomeMsg,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 timeMs: Date.now()
 }
 ]);
 connectToGemini(text, false);
 }}
 />
 </div>
 </div>

 </div>
 ) : (
 <div className={`flex-grow flex flex-col overflow-hidden ${
   rightPanelTab === 'chat' ? 'pt-1 px-2.5 sm:px-4 md:px-5 pb-1' : 'pt-5 px-5 pb-1.5 md:pt-8 md:px-8 md:pb-2'
 } min-h-0 ${isDarkMode && rightPanelTab === 'chat' ? 'bg-[#0F172A]' : 'bg-white'} transition-colors duration-300`}>
 {/* Old sub-header bar has been removed */}
          {(!hasInteracted && hasClickedConnect && rightPanelTab === 'home') ? (
 <div className="flex-grow flex flex-col justify-center items-center overflow-y-auto p-4 md:p-6 tab-content-area h-full select-none">
 <div className="w-full max-w-2xl mx-auto flex flex-col justify-start p-2 sm:p-4 animate-fade-in">
 {authNotification && (
            <div className="w-full max-w-xl mx-auto px-2 sm:px-4 mb-4 z-10">
              <div className="py-1.5 px-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg animate-fade-in flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {authNotification}
              </div>
            </div>
          )}

          {/* Main grid: Mascot on Left, Steps on Rig220ht */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10 items-center w-full">
 {/* Left: Mascot */}
 <div className={`${onboardingStep === 4 ? 'hidden sm:flex' : 'flex'} items-center justify-center w-full`}>
 <img 
 src="https://lh3.googleusercontent.com/d/1uCm4fqE6Qfxg1lm1FsCbo35fVQcI_E5k" 
 alt="Voyager USA Mascot" 
 referrerPolicy="no-referrer"
 className="w-full max-w-[220px] md:max-w-[260px] object-contain animate-float-zero-g mix-blend-multiply" 
 />
 </div>

 {/* Right: Steps */}
 <div className="flex flex-col w-full text-left">
 {/* Header */}
 <div className="w-full mb-3 flex flex-col gap-1">
 <div className="flex items-center justify-between gap-4">
 <h2 style={{ fontFamily: "'Raleway', sans-serif" }} className={onboardingStep === 4 ? "text-3xl sm:text-4xl font-extrabold text-[#1A365D] tracking-tight leading-tight mb-1" : "text-xl md:text-2xl font-bold text-[#1A365D] leading-tight flex-1"}>
 {getOnboardingStepTitle(onboardingStep, selectedLang)}
 </h2>
 </div>
 {onboardingStep === 4 && (
 <p className="text-sm sm:text-base text-neutral-800 font-medium leading-snug mb-6">
 {selectedLang === 'EN'
 ? 'Use your Google account, your email or enter as a guest.'
 : 'Utiliza tu cuenta de Google, tu correo electronico o entra como invitado.'}
 </p>
 )}
 </div>

 {onboardingStep === 1 && (
 <div className="space-y-0.5 w-full">
 {[
 { id: 'PROFESSIONAL', label: selectedLang === 'EN' ? 'Professional' : 'Profesional', icon: Briefcase },
 { id: 'ESTUDIO', label: selectedLang === 'EN' ? 'Student' : 'Estudiante', icon: BookOpen },
 { id: 'VIAJANTE', label: selectedLang === 'EN' ? 'Traveler' : 'Viajante', icon: Plane },
 { id: 'DOCENTES', label: selectedLang === 'EN' ? 'Teacher' : 'Docente', icon: Presentation }
 ].map((opt) => {
 const isSel = selectedGoal === opt.id;
 const IconComp = opt.icon;
 return (
 <div 
 key={opt.id}
 onClick={() => {
 if (isSel) {
 handleOnboardingNext();
 } else {
 setSelectedGoal(opt.id as any);
 }
 }}
 className={`group flex items-center gap-1.5 px-0 py-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
 isSel 
 ? 'bg-transparent' 
 : 'bg-transparent hover:translate-x-1'
 }`}
 >
 <div className="flex items-center gap-1.5">
 <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
 isSel ? 'bg-red-600 text-white shadow-xs scale-105' : 'bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white'
 }`}>
 <IconComp className="w-[17px] h-[17px] flex-shrink-0" />
 </div>
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[15px] tracking-wide transition-colors ${
 isSel ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-semibold group-hover:text-[#1A365D]'
 }`}>
 {opt.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {onboardingStep === 11 && (
 <div className="space-y-0.5 w-full">
 {[
 { id: 'CONSEGUIR_EMPLEO', label: selectedLang === 'EN' ? 'Get a Job' : 'Conseguir Empleo', icon: UserCheck },
 { id: 'COMUNICARME_TRABAJO', label: selectedLang === 'EN' ? 'Improve Communication' : 'Mejorar Comunicación', icon: MessageSquareText },
 { id: 'CRECER_PROFESIONAL', label: selectedLang === 'EN' ? 'Increase Salary' : 'Mejorar Salario', icon: Presentation }
 ].map((opt) => {
 const isSel = selectedProfSubGoal === opt.id;
 const IconComp = opt.icon;
 return (
 <div 
 key={opt.id}
 onClick={() => {
 if (isSel) {
 handleOnboardingNext();
 } else {
 setSelectedProfSubGoal(opt.id as any);
 }
 }}
 className={`group flex items-center gap-1.5 px-0 py-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
 isSel 
 ? 'bg-transparent' 
 : 'bg-transparent hover:translate-x-1'
 }`}
 >
 <div className="flex items-center gap-1.5">
 <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
 isSel ? 'bg-red-600 text-white shadow-xs scale-105' : 'bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white'
 }`}>
 <IconComp className="w-[17px] h-[17px] flex-shrink-0" />
 </div>
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[15px] tracking-wide transition-colors ${
 isSel ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-semibold group-hover:text-[#1A365D]'
 }`}>
 {opt.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {onboardingStep === 112 && (
 <div className="space-y-0.5 w-full">
 {[
 { id: 'EMPRENDEDOR', label: selectedLang === 'EN' ? 'Entrepreneur' : 'Emprendedor', icon: Rocket },
 { id: 'GERENCIA', label: selectedLang === 'EN' ? 'Management' : 'Gerencia', icon: Briefcase },
 { id: 'MERCADEO', label: selectedLang === 'EN' ? 'Marketing' : 'Mercadeo', icon: Presentation },
 { id: 'VENTAS', label: selectedLang === 'EN' ? 'Sales' : 'Ventas', icon: ShoppingCart }
 ].map((opt) => {
 const isSel = selectedProfInterest === opt.id;
 const IconComp = opt.icon;
 return (
 <div 
 key={opt.id}
 onClick={() => {
 if (isSel) {
 handleOnboardingNext();
 } else {
 setSelectedProfInterest(opt.id as any);
 }
 }}
 className={`group flex items-center gap-1.5 px-0 py-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
 isSel 
 ? 'bg-transparent' 
 : 'bg-transparent hover:translate-x-1'
 }`}
 >
 <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
 isSel ? 'bg-red-600 text-white shadow-xs scale-105' : 'bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white'
 }`}>
 <IconComp className="w-[17px] h-[17px] flex-shrink-0" />
 </div>
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[15px] tracking-wide transition-colors ${
 isSel ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-semibold group-hover:text-[#1A365D]'
 }`}>
 {opt.label}
 </span>
 </div>
 );
 })}
 </div>
 )}

 {onboardingStep === 13 && (
 <div className="space-y-0.5 w-full">
 {[
 { id: 'EXPLORAR', label: selectedLang === 'EN' ? 'Explore' : 'Explorar', icon: Plane },
 { id: 'AMISTAD', label: selectedLang === 'EN' ? 'Friendship' : 'Amistad', icon: User },
 { id: 'CULTURA', label: selectedLang === 'EN' ? 'Culture' : 'Cultura', icon: Languages }
 ].map((opt) => {
 const isSel = selectedViajanteSubGoal === opt.id;
 const IconComp = opt.icon;
 return (
 <div 
 key={opt.id}
 onClick={() => {
 if (isSel) {
 handleOnboardingNext();
 } else {
 setSelectedViajanteSubGoal(opt.id as any);
 }
 }}
 className={`group flex items-center gap-1.5 px-0 py-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
 isSel 
 ? 'bg-transparent' 
 : 'bg-transparent hover:translate-x-1'
 }`}
 >
 <div className="flex items-center gap-1.5">
 <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
 isSel ? 'bg-red-600 text-white shadow-xs scale-105' : 'bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white'
 }`}>
 <IconComp className="w-[17px] h-[17px] flex-shrink-0" />
 </div>
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[15px] tracking-wide transition-colors ${
 isSel ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-semibold group-hover:text-[#1A365D]'
 }`}>
 {opt.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {onboardingStep === 14 && (
 <div className="space-y-0.5 w-full">
 {[
 { id: 'INDEPENDIENTE', label: selectedLang === 'EN' ? 'Independent' : 'Independiente', icon: User },
 { id: 'ACADEMIA', label: selectedLang === 'EN' ? 'Language Academy' : 'Academia de Idiomas', icon: Compass },
 { id: 'ESCUELA', label: selectedLang === 'EN' ? 'School, college, university' : 'Escuela, colegio, universidad', icon: Shield },
 { id: 'EMPRESA', label: selectedLang === 'EN' ? 'Company' : 'Empresa', icon: Briefcase }
 ].map((opt) => {
 const isSel = selectedDocenteProfile === opt.id;
 const IconComp = opt.icon;
 return (
 <div 
 key={opt.id}
 onClick={() => {
 if (isSel) {
 handleOnboardingNext();
 } else {
 setSelectedDocenteProfile(opt.id as any);
 }
 }}
 className={`group flex items-center px-0 py-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
 isSel 
 ? 'bg-transparent' 
 : 'bg-transparent hover:translate-x-1'
 }`}
 >
 <div className="flex items-center gap-1.5 min-w-0 flex-1">
 <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
 isSel ? 'bg-red-600 text-white shadow-xs scale-105' : 'bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white'
 }`}>
 <IconComp className="w-[17px] h-[17px] flex-shrink-0" />
 </div>
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[13px] sm:text-[14px] tracking-tight leading-tight transition-colors ${
 isSel ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-semibold group-hover:text-[#1A365D]'
 }`}>
 {opt.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

  {onboardingStep === 142 && (
    <div className="space-y-0.5 w-full">
      {[
        { id: 'PERSONALMENTE', label: selectedLang === 'EN' ? 'In Person' : 'Personalmente', icon: User },
        { id: 'EN_LINEA', label: selectedLang === 'EN' ? 'Online' : 'En línea', icon: Globe },
        { id: 'HIBRIDO', label: selectedLang === 'EN' ? 'Hybrid System' : 'Sistema híbrido', icon: Sliders }
      ].map((opt) => {
 const isSel = selectedDocenteGoal === opt.id;
 const IconComp = opt.icon;
 return (
 <div 
 key={opt.id}
 onClick={() => {
 if (isSel) {
 handleOnboardingNext();
 } else {
 setSelectedDocenteGoal(opt.id as any);
 }
 }}
 className={`group flex items-center px-0 py-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
 isSel 
 ? 'bg-transparent' 
 : 'bg-transparent hover:translate-x-1'
 }`}
 >
 <div className="flex items-center gap-1.5">
 <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
 isSel ? 'bg-red-600 text-white shadow-xs scale-105' : 'bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white'
 }`}>
 <IconComp className="w-[17px] h-[17px] flex-shrink-0" />
 </div>
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[15px] tracking-wide transition-colors ${
 isSel ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-semibold group-hover:text-[#1A365D]'
 }`}>
 {opt.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {onboardingStep === 12 && (
 <div className="space-y-0.5 w-full">
 {[
 { id: 'ELEMENTARY_SCHOOL', label: selectedLang === 'EN' ? 'Elementary School' : 'Escuela Primaria', icon: Sprout },
 { id: 'HIGH_SCHOOL', label: selectedLang === 'EN' ? 'High School' : 'Escuela Secundaria', icon: GraduationCap },
 { id: 'COLLEGE_UNIVERSITY', label: selectedLang === 'EN' ? 'College / University' : 'Universidad', icon: Award }
 ].map((opt) => {
 const isSel = selectedSchoolLevel === opt.id;
 const IconComp = opt.icon;
 return (
 <div 
 key={opt.id}
 onClick={() => {
 if (isSel) {
 handleOnboardingNext();
 } else {
 setSelectedSchoolLevel(opt.id as any);
 }
 }}
 className={`group flex items-center px-0 py-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
 isSel 
 ? 'bg-transparent' 
 : 'bg-transparent hover:translate-x-1'
 }`}
 >
 <div className="flex items-center gap-1.5">
 <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
 isSel ? 'bg-red-600 text-white shadow-xs scale-105' : 'bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white'
 }`}>
 <IconComp className="w-[17px] h-[17px] flex-shrink-0" />
 </div>
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[15px] tracking-wide transition-colors ${
 isSel ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-semibold group-hover:text-[#1A365D]'
 }`}>
 {opt.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {onboardingStep === 122 && (
 <div className="space-y-0.5 w-full">
 {[
 { id: 'ACADEMIC_SUCCESS', label: selectedLang === 'EN' ? 'Academic Success' : 'Éxito Académico', icon: Check },
 { id: 'STUDY_ABROAD', label: selectedLang === 'EN' ? 'Study Abroad' : 'Estudiar en el Extranjero', icon: Plane },
 { id: 'IMPROVE_CONVERSATION', label: selectedLang === 'EN' ? 'Improve Conversation' : 'Mejorar Conversación', icon: MessageSquare },
          { id: 'GENERAL_KNOWLEDGE', label: selectedLang === 'EN' ? 'General Culture' : 'Cultura general', icon: Globe }
 ].map((opt) => {
 const isSel = selectedAcademicGoal === opt.id;
 const IconComp = opt.icon;
 return (
 <div 
 key={opt.id}
 onClick={() => {
 if (isSel) {
 handleOnboardingNext();
 } else {
 setSelectedAcademicGoal(opt.id as any);
 }
 }}
 className={`group flex items-center px-0 py-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
 isSel 
 ? 'bg-transparent' 
 : 'bg-transparent hover:translate-x-1'
 }`}
 >
 <div className="flex items-center gap-1.5">
 <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
 isSel ? 'bg-red-600 text-white shadow-xs scale-105' : 'bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white'
 }`}>
 <IconComp className="w-[17px] h-[17px] flex-shrink-0" />
 </div>
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[15px] tracking-wide transition-colors ${
 isSel ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-semibold group-hover:text-[#1A365D]'
 }`}>
 {opt.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

      {onboardingStep === 2 && (
        <div className="space-y-0.5 w-full">
          {[
            { id: "BEGINNER", label: selectedLang === "EN" ? "Beginner" : "Principiante", letter: "A" },
            { id: "INTERMEDIATE", label: selectedLang === "EN" ? "Intermediate" : "Intermedio", letter: "B" },
            { id: "ADVANCED", label: selectedLang === "EN" ? "Advanced" : "Avanzado", letter: "C" },
            { id: "NOT_SURE", label: selectedLang === "EN" ? "I'm Not Sure" : "No Estoy Seguro", letter: "?" }
          ].map((opt) => {
            const isSel = selectedLevel === opt.id;
            return (
              <div 
                key={opt.id}
                onClick={() => {
                  if (isSel) {
                    handleOnboardingNext();
                  } else {
                    setSelectedLevel(opt.id as any);
                  }
                }}
                className={`group flex items-center px-0 py-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
                  isSel 
                    ? "bg-transparent" 
                    : "bg-transparent hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isSel ? "bg-red-600 text-white shadow-xs scale-105" : "bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white"
                  }`}>
                    <span className="text-[14px] font-bold leading-none">{opt.letter}</span>
                  </div>
                  <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[15px] tracking-wide transition-colors ${
                    isSel ? "text-neutral-900 font-extrabold" : "text-neutral-700 font-semibold group-hover:text-[#1A365D]"
                  }`}>
                    {opt.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

  {onboardingStep === 4 && (
    <div className="flex flex-col items-start text-left w-full max-w-sm pt-0" style={{ fontFamily: "'Raleway', sans-serif" }}>

      {/* 3 Circular Action Buttons */}
      <div className="flex items-center gap-4 mb-4">
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          title={selectedLang === 'EN' ? 'Continue with Google' : 'Continuar con Google'}
          className="w-12 h-12 rounded-full border-[2.5px] border-black bg-white hover:bg-neutral-50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-xs shrink-0"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        </button>

        {/* Email */}
        <button
          type="button"
          onClick={() => setShowInlineEmailFields(!showInlineEmailFields)}
          title={selectedLang === 'EN' ? 'Sign in with Email' : 'Entrar con correo'}
          className={`w-12 h-12 rounded-full border-[2.5px] ${showInlineEmailFields ? 'border-[#1A365D] bg-neutral-100 ring-2 ring-[#1A365D]/20' : 'border-black bg-white'} hover:bg-neutral-50 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs shrink-0`}
        >
          <svg className="w-6 h-6 text-[#1A365D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </button>

        {/* Guest */}
        <button
          type="button"
          onClick={handleGuestLogin}
          title={selectedLang === 'EN' ? 'Enter as Guest' : 'Continuar como Invitado'}
          className="w-12 h-12 rounded-full border-[2.5px] border-black bg-white hover:bg-neutral-50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shadow-xs shrink-0"
        >
          <svg className="w-6 h-6 text-[#1A365D]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
          </svg>
        </button>
      </div>

      {/* Expandable Email Fields */}
      {showInlineEmailFields && (
        <div className="w-full space-y-3.5 pt-2 animate-fade-in border-t border-neutral-200">
          {/* Field 1 & 2: PRIMER NOMBRE & APELLIDO */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="text-left">
              <label className="block text-[11px] font-extrabold text-neutral-600 uppercase tracking-wider mb-1">
                {selectedLang === 'EN' ? 'FIRST NAME' : 'PRIMER NOMBRE'}
              </label>
              <input 
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={selectedLang === 'EN' ? 'e.g. Maria' : 'ej. María'}
                className="w-full px-4 py-2.5 rounded-full border-2 border-[#0D224A] bg-white text-neutral-800 font-bold text-sm focus:outline-none transition-all placeholder:text-neutral-400 placeholder:font-normal shadow-2xs"
              />
            </div>
            <div className="text-left">
              <label className="block text-[11px] font-extrabold text-neutral-600 uppercase tracking-wider mb-1">
                {selectedLang === 'EN' ? 'LAST NAME' : 'APELLIDO'}
              </label>
              <input 
                type="text"
                value={userLastName}
                onChange={(e) => setUserLastName(e.target.value)}
                placeholder={selectedLang === 'EN' ? 'e.g. Gonzalez' : 'ej. González'}
                className="w-full px-4 py-2.5 rounded-full border-2 border-[#0D224A] bg-white text-neutral-800 font-bold text-sm focus:outline-none transition-all placeholder:text-neutral-400 placeholder:font-normal shadow-2xs"
              />
            </div>
          </div>

          {/* Field 3: CORREO ELECTRÓNICO */}
          <div className="text-left">
            <label className="block text-[11px] font-extrabold text-neutral-600 uppercase tracking-wider mb-1">
              {selectedLang === 'EN' ? 'EMAIL ADDRESS' : 'CORREO ELECTRÓNICO'}
            </label>
            <input 
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-2.5 rounded-full border-2 border-[#0D224A] bg-white text-neutral-800 font-bold text-sm focus:outline-none transition-all placeholder:text-neutral-400 placeholder:font-normal shadow-2xs"
            />
          </div>

          {/* Field 4: CONTRASEÑA */}
          <div className="text-left">
            <label className="block text-[11px] font-extrabold text-neutral-600 uppercase tracking-wider mb-1">
              {selectedLang === 'EN' ? 'PASSWORD' : 'CONTRASEÑA'}
            </label>
            <div className="relative flex items-center">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="● ● ● ● ● ● ● ●"
                className={`w-full px-4 py-2.5 rounded-full border-2 border-[#0D224A] bg-white text-neutral-800 font-bold focus:outline-none transition-all placeholder:text-neutral-400 placeholder:font-normal shadow-2xs ${
                  !showPassword ? 'text-lg tracking-widest' : 'text-sm'
                }`}
              />
            </div>

            {/* Info Icon & Toggle */}
            <div className="mt-1.5 px-1">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPasswordInfo(!showPasswordInfo)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-[#0D224A] transition-colors cursor-pointer select-none"
                >
                  <Info className="w-4 h-4 text-neutral-500" />
                  <span className="text-[11px]">{selectedLang === 'EN' ? 'Password requirements' : 'Requisitos de la clave'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors select-none cursor-pointer"
                >
                  {showPassword ? (selectedLang === 'EN' ? 'Hide' : 'Ocultar') : (selectedLang === 'EN' ? 'Show' : 'Ver')}
                </button>
              </div>

              {showPasswordInfo && (
                <div className="mt-2 p-3 bg-neutral-50 border border-neutral-200/90 rounded-xl animate-fade-in text-left shadow-2xs">
                  <p className="text-[12px] font-bold text-neutral-800 mb-1.5">
                    {selectedLang === 'EN' ? 'Password requirements:' : 'Requisitos de la clave:'}
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-neutral-600 font-medium">
                    <li className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        userPassword.length >= 8 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200'
                      }`}>
                        {userPassword.length >= 8 ? (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        )}
                      </span>
                      <span>{selectedLang === 'EN' ? 'At least 8 characters' : 'Mínimo 8 caracteres'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        /\d/.test(userPassword) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200'
                      }`}>
                        {/\d/.test(userPassword) ? (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        )}
                      </span>
                      <span>{selectedLang === 'EN' ? 'At least one number' : 'Al menos un número'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        /[A-Z]/.test(userPassword) ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200'
                      }`}>
                        {/[A-Z]/.test(userPassword) ? (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        )}
                      </span>
                      <span>{selectedLang === 'EN' ? 'At least one uppercase letter' : 'Al menos una letra mayúscula'}</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Button: Continuar con E-mail */}
          <div className="pt-1">
            {(() => {
              const isFormFilled = userName.trim() !== '' && userLastName.trim() !== '' && userEmail.trim() !== '' && userPassword.trim() !== '';
              return (
                <button
                  type="button"
                  onClick={handleOnboardingNext}
                  disabled={!isFormFilled}
                  className={`w-full py-2.5 px-4 rounded-full border-2 border-[#0D224A] bg-white text-neutral-800 font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-2xs ${
                    isFormFilled
                      ? 'hover:bg-neutral-50 active:scale-[0.98] cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5 shrink-0 rounded-full shadow-2xs overflow-hidden" viewBox="0 0 36 36">
                    <path fill="#ED1C24" d="M36 27a9 9 0 0 1-9 9H9a9 9 0 0 1-9-9v-4h36v4z"/>
                    <path fill="#FFF" d="M0 23h36v-3H0v3zm0-6h36v-3H0v3zm0-6h36V8H0v3z"/>
                    <path fill="#ED1C24" d="M0 20h36v-3H0v3zm0-6h36v-3H0v3z"/>
                    <path fill="#00205B" d="M0 9a9 9 0 0 1 9-9h9v18H0V9z"/>
                    <path fill="#FFF" d="M13.5 14.25l.882 2.715h2.855l-2.31 1.678.882 2.715-2.309-1.678-2.309 1.678.882-2.715-2.31-1.678h2.855zM4.5 14.25l.882 2.715h2.855l-2.31 1.678.882 2.715-2.309-1.678-2.309 1.678.882-2.715-2.31-1.678h2.855zM13.5 5.25l.882 2.715h2.855l-2.31 1.678.882 2.715-2.309-1.678-2.309 1.678.882-2.715-2.31-1.678h2.855zM4.5 5.25l.882 2.715h2.855l-2.31 1.678.882 2.715-2.309-1.678-2.309 1.678.882-2.715-2.31-1.678h2.855zM9 9.75l.882 2.715h2.855l-2.31 1.678.882 2.715-2.309-1.678-2.309 1.678.882-2.715-2.31-1.678h2.855z"/>
                  </svg>
                  <span>{selectedLang === 'EN' ? 'Continue with Email' : 'Continuar con Correo'}</span>
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  )}

 {onboardingStep === 3 && (
 <div className="space-y-1 w-full">
 {modeDetails.map((mode) => {
 const name = selectedLang === 'EN' ? mode.nameEn : mode.nameEs;
 const desc = selectedLang === 'EN' ? mode.descEn : mode.descEs;
 const effectiveMode = currentModeObj.id;
 const isSel = effectiveMode === mode.id;

 return (
 <div 
 key={mode.id}
 onClick={() => handleModeSelection(mode.id as ConversationMode)}
 className={`group flex items-center px-0 py-1.5 rounded-xl transition-all duration-200 cursor-pointer select-none w-full ${
 isSel 
 ? 'bg-transparent' 
 : 'bg-transparent hover:translate-x-1'
 }`}
 >
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 mt-0.5 ${
 isSel ? 'bg-red-600 text-white shadow-xs scale-105' : 'bg-transparent text-neutral-500 group-hover:bg-[#1A365D] group-hover:text-white'
 }`}>
 {(() => {
   const ModeItemIcon = mode.id === 'BILINGUAL' ? Sparkles :
                        mode.id === 'ADAPTIVE' ? Zap :
                        mode.id === 'AMERICAN_ENGLISH' ? Compass :
                        mode.id === 'LIVE_TRANSLATOR' ? Languages :
                        mode.id === 'LISTEN_ONLY' ? Headphones : EspIcon;
   return <ModeItemIcon className="w-[17px] h-[17px] flex-shrink-0" />;
 })()}
 </div>
 <div className="flex-1 min-w-0">
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-xs tracking-wide block leading-tight ${
 isSel ? 'text-neutral-900 font-extrabold' : 'text-neutral-700 font-semibold group-hover:text-[#1A365D]'
 }`}>
 {name}
 </span>
 <p className={`text-[10px] mt-0.5 leading-snug font-normal ${
 isSel ? 'text-neutral-600 font-medium' : 'text-neutral-500'
 }`}>
 {desc}
 </p>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

  {onboardingStep > 0 && onboardingStep !== 4 && (
 <div className="w-full mt-6 select-none animate-fade-in flex items-center gap-4">
 {/* Left Arrow (Back) */}
 <button
 onClick={handleOnboardingBack}
 title={selectedLang === 'EN' ? 'Back' : 'Volver'}
 className="text-black/40 hover:text-black hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer bg-transparent flex-shrink-0 flex items-center justify-center p-1.5"
 >
 <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
 </button>

 {/* Progress bar and clickable circles */}
 <div className="relative flex-1 py-4">
 <div className="absolute top-1/2 left-[11px] right-[11px] h-[3px] -translate-y-1/2">
 <div className="w-full h-full bg-[#1A365D]/15 rounded-full" />
 <div 
 className="absolute top-0 left-0 h-full bg-[#1A365D] rounded-full transition-all duration-300" 
 style={{ 
 width: `${((currentStepIdx - 1) / (totalOnboardingSteps - 1)) * 100}%` 
 }} 
 />
 </div>
 <div className="relative flex justify-between items-center w-full z-10">
 {Array.from({ length: totalOnboardingSteps }).map((_, i) => {
 const stepNum = i + 1;
 const isSelected = stepNum === currentStepIdx;
 return (
 <div 
 key={i} 
 onClick={() => handleJumpToStep(stepNum)}
 className={`w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 ${
 isSelected ? 'bg-[#1A365D] scale-105 shadow-md' : 'bg-[#EAEAEA] text-black/50'
 }`}
 >
 <span style={{ fontFamily: "'Raleway', sans-serif" }} className={`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-black/60'}`}>
 {stepNum}
 </span>
 </div>
 );
 })}
 </div>
 </div>

 {/* Right Arrow (Next) */}
 {(() => {
 const getIsNextActive = () => {
 switch (onboardingStep) {
 case 1:
 return selectedGoal !== null;
 case 11:
 return selectedProfSubGoal !== null;
 case 112:
 return selectedProfInterest !== null;
 case 12:
 return selectedSchoolLevel !== null;
 case 122:
 return selectedAcademicGoal !== null;
 case 13:
 return selectedViajanteSubGoal !== null;
 case 14:
 return selectedDocenteProfile !== null;
 case 142:
 return selectedDocenteGoal !== null;
 case 2:
 return selectedLevel !== null;
 case 4:
 return userName.trim() !== '' && userLastName.trim() !== '' && userEmail.trim() !== '' && userPassword.trim() !== '';
 default:
 return true;
 }
 };
 const isNextActive = getIsNextActive();
 return (
 <button
 onClick={handleOnboardingNext}
 disabled={!isNextActive}
 title={nextTitle}
 className={`${isNextActive ? 'text-red-600 hover:text-red-700 hover:scale-110 animate-bounce-horizontal' : 'text-black/20 cursor-not-allowed'} active:scale-95 transition-all duration-300 bg-transparent flex-shrink-0 flex items-center justify-center p-1.5`}
 >
 <ArrowRight className="w-6 h-6 stroke-[2.5]" />
 </button>
 );
 })()}
 </div>
 )}

  {/* Questionnaire options: Saltar cuestionario */}
  {onboardingStep !== 4 && (
    <div className="w-full text-left px-3 mt-3">
      <button
        type="button"
        onClick={() => {
          setOnboardingStep(4);
        }}
        style={{ fontFamily: "'Raleway', sans-serif" }}
        className="text-[14px] font-semibold text-neutral-700 hover:text-[#0D224A] cursor-pointer transition-colors tracking-wide select-none inline-block py-0.5 text-left"
      >
        {selectedLang === 'EN' ? 'Skip questionnaire' : 'Saltar cuestionario'}
      </button>
    </div>
  )}
 </div>
 </div>
 </div>
 </div>
          ) : rightPanelTab === 'home' ? (
 <div className="flex-grow flex flex-col justify-between items-center text-center p-4 sm:p-6 h-full animate-fade-in tab-content-area">
 {authNotification && (
              <div className="w-full max-w-xl px-2 sm:px-4 pt-1 sm:pt-2 z-10">
                <div className="py-1.5 px-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg animate-fade-in flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {authNotification}
                </div>
              </div>
            )}
            
            {/* MIDDLE: Voyager Mascot */}
 <div className="flex-1 flex items-center justify-center py-2 sm:py-4 w-full relative z-10">
 <img 
 src="https://lh3.googleusercontent.com/d/1uCm4fqE6Qfxg1lm1FsCbo35fVQcI_E5k" 
 alt="Voyager USA Mascot" 
 referrerPolicy="no-referrer"
 className="w-[260px] h-[260px] md:w-[320px] md:h-[320px] max-w-[90%] max-h-[50vh] object-contain animate-float-zero-g mix-blend-multiply" 
 />
 </div>

 {/* BOTTOM: Footer Buttons Row */}
 <div className="pb-4 sm:pb-6 z-10 px-2 sm:px-4 flex flex-col items-center flex-shrink-0 w-full">
 <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-mono select-none max-w-full">
 {/* Copyright Button */}
 <button 
 onClick={() => setActivePolicyModal('copyright')}
 className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer whitespace-nowrap"
 >
 <span style={{ fontSize: '1.4em', lineHeight: '1' }} className="font-normal">©</span>
  <span>{selectedLang === 'EN' ? 'Copyright' : 'Derechos'}</span>
 </button>

 {/* Privacy Button */}
 <button 
 onClick={() => setActivePolicyModal('privacy')}
 className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer whitespace-nowrap"
 >
 <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{selectedLang === 'EN' ? 'Privacy' : 'Privacidad'}</span>
 </button>

 {/* Terms Button */}
 <button 
 onClick={() => setActivePolicyModal('terms')}
 className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer whitespace-nowrap"
 >
 <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{selectedLang === 'EN' ? 'Terms' : 'Términos'}</span>
 </button>

 {/* Contact Button */}
 <button 
 onClick={() => setActivePolicyModal('contact')}
 className="flex items-center gap-1 sm:gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer whitespace-nowrap"
 >
 <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{selectedLang === 'EN' ? 'Contact' : 'Contacto'}</span>
 </button>
 </div>
 </div>
 </div>
          
   ) : rightPanelTab === 'chat' ? (
 <div className={`flex-grow flex flex-col overflow-hidden h-full ${isDarkMode ? 'bg-[#0F172A]' : 'bg-transparent'} transition-colors duration-300`}>

 <div 
   className={`flex-1 px-1 sm:px-2 pt-1 pb-2 tab-content-area overflow-y-auto min-h-0 ${isDarkMode ? 'bg-[#0F172A]' : ''}`}
   style={!isLiveVoiceActive ? {
     WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, transparent 30px, black 160px, black calc(100% - 16px), transparent 100%)',
     maskImage: 'linear-gradient(to bottom, transparent 0px, transparent 30px, black 160px, black calc(100% - 16px), transparent 100%)'
   } : undefined}
 >
  {isLiveVoiceActive ? (
    <div className="fixed inset-0 z-50 w-screen h-[100dvh] bg-gradient-to-b from-[#0A1838] via-[#08152e] to-[#040b17] rounded-none border-none shadow-none pt-1 sm:pt-1.5 md:pt-3 lg:pt-4 px-3 sm:px-4 md:px-8 lg:px-10 pb-1 sm:pb-1.5 md:pb-6 lg:pb-8 flex flex-col items-center justify-between text-center overflow-hidden animate-fade-in">
     {/* Top Left Golden + Conversational Menu Button in Live Mode */}
     <div className="absolute top-2 left-3 sm:top-2.5 sm:left-4 z-30">
       <button
         type="button"
         onClick={() => setIsConversationalMenuOpen(prev => !prev)}
         className={`p-1 text-[#FFD700] hover:text-white bg-transparent border-none transition-all duration-200 cursor-pointer flex items-center justify-center active:scale-95 group ${
           isConversationalMenuOpen ? 'rotate-45' : ''
         }`}
         title={selectedLang === 'EN' ? 'Conversational Menu' : 'Menú Conversacional'}
         aria-label={selectedLang === 'EN' ? 'Conversational Menu' : 'Menú Conversacional'}
       >
         <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFD700] group-hover:text-white transition-colors stroke-[2.5]" />
       </button>

       {isConversationalMenuOpen && (
         <>
           <div
             className="fixed inset-0 z-40 bg-transparent"
             onClick={() => setIsConversationalMenuOpen(false)}
           />
           <div className="absolute top-full left-0 mt-2 z-50">
             {renderConversationalMenuContent()}
           </div>
         </>
       )}
     </div>


     {/* Top Center Logo */}
     <div className="pt-0 flex flex-col items-center justify-center text-center select-none z-20">
       <span style={{ fontFamily: '"Allerta Stencil", sans-serif', letterSpacing: '0.25em' }} className="text-[11px] sm:text-xs font-bold text-white/80 uppercase tracking-widest block leading-none">
         YO SOY USA
       </span>
       <h1 style={{ fontFamily: '"Allerta Stencil", sans-serif', textShadow: '0 2px 12px rgba(0,0,0,0.7)', letterSpacing: '0.12em' }} className="text-2xl sm:text-3xl md:text-[36px] font-black text-white mt-1.5 uppercase block leading-none">
         VOYAGER<span className="text-[0.35em] font-light text-white/90 align-baseline ml-1 inline-block select-none" style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 300, letterSpacing: "normal" }}>®</span>
       </h1>
     </div>

     {/* Center Sound Bubble Canvas */}
     <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center my-1 sm:my-2 w-full">
       <div className="absolute w-[74vw] h-[74vw] xs:w-[324px] xs:h-[324px] sm:w-[432px] sm:h-[432px] md:w-[528px] md:h-[528px] rounded-full bg-amber-500/14 blur-3xl animate-pulse pointer-events-none" />
       <canvas
         ref={coverParticleCanvasRef}
         width={800}
         height={800}
         className="z-10 w-[74vw] h-[74vw] xs:w-[324px] xs:h-[324px] sm:w-[432px] sm:h-[432px] md:w-[528px] md:h-[528px] max-h-[53vh] max-w-full object-contain animate-float-zero-g"
         style={{
           WebkitMaskImage: 'radial-gradient(circle at center, black 80%, transparent 99%)',
           maskImage: 'radial-gradient(circle at center, black 80%, transparent 99%)'
         }}
       />
     </div>

      {/* Middle Controls below Sphere: Audio Waveform Button & Mode Selector Dropdown */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3 mb-1 sm:mb-2 md:mb-6 lg:mb-8 pb-0 md:pb-2 z-20 relative">
        {/* Mode Icon Toggle Button for Pause / Play Live Mode */}
        <button
          onClick={() => {
            if (!isConnected) {
              connect();
            } else if (isPaused) {
              resume();
            } else {
              pause();
            }
          }}
          title={isPaused ? (selectedLang === 'EN' ? 'Resume Voice' : 'Activar Voz') : (selectedLang === 'EN' ? 'Pause Voice' : 'Pausar Voz')}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black text-[#EAB308] hover:text-white border border-[#EAB308]/80 hover:border-white shadow-xl transition-all cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 group"
        >
          {(() => {
            const iconColor = isPaused
              ? 'text-[#EAB308]/60 group-hover:text-white/80'
              : 'text-[#EAB308] group-hover:text-white';
            if (isPaused) {
              return <Pause fill="currentColor" className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 transition-colors ${iconColor}`} />;
            }
            if (currentModeObj.id === 'SPANISH') {
              return (
                <span className={`font-bold text-base sm:text-lg leading-none tracking-tight transition-colors ${iconColor} select-none`}>
                  ES
                </span>
              );
            }
            if (currentModeObj.id === 'BILINGUAL') {
              return <RotateCw className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 transition-colors ${iconColor}`} />;
            }
            if (currentModeObj.id === 'AMERICAN_ENGLISH') {
              return (
                <span className={`font-bold text-base sm:text-lg leading-none tracking-tight transition-colors ${iconColor} select-none`}>
                  EN
                </span>
              );
            }
            if (currentModeObj.id === 'LIVE_TRANSLATOR') {
              return <Languages className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 transition-colors ${iconColor}`} />;
            }
            return <Headphones className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 transition-colors ${iconColor}`} />;
          })()}
        </button>

        {/* Mode Selector Dropdown Button & Popover */}
        <div className="relative">
          <button
            onClick={() => setIsModeMenuOpen(prev => !prev)}
            className="flex items-center gap-1.5 text-[#EAB308] hover:text-white text-xs sm:text-sm font-normal tracking-normal transition-colors cursor-pointer outline-none select-none group"
          >
            <span className="transition-colors group-hover:text-white font-normal">
              {isPaused
                ? (selectedLang === 'EN' ? 'Pause' : 'Pausa')
                : (selectedLang === 'EN' ? currentModeObj.nameEn : currentModeObj.nameEs)}
            </span>
            <ChevronDown className="w-4 h-4 text-[#EAB308] group-hover:text-white transition-colors" />
          </button>

          {/* Quick Submenu Popover for Live Voice Mode */}
          {isModeMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsModeMenuOpen(false)}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 bg-[#08152E]/90 backdrop-blur-md border border-[#EAB308]/80 rounded-2xl p-2.5 shadow-2xl animate-fade-in flex flex-col text-white text-left">
                {/* Header Title */}
                <div className="px-2 py-1 mb-1.5 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-white">
                    {selectedLang === 'EN' ? 'Mode of Interaction' : 'Modo de Interactuar'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsModeMenuOpen(false)}
                    className="text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-0.5 custom-scrollbar">
                  {modeDetails.map((mode) => {
                    const name = mode.nameEs;
                    const desc = mode.descEs;
                    const effectiveMode = isPaused ? null : currentModeObj.id;
                    const isSelected = effectiveMode === mode.id;

                    const renderModeIcon = () => {
                      const colorClass = isSelected ? 'text-[#EAB308]' : 'text-gray-400 group-hover:text-white transition-colors';
                      if (mode.id === 'SPANISH') {
                        return (
                          <span className={`w-5 h-5 flex items-center justify-center font-bold text-xs leading-none tracking-tight ${colorClass}`}>
                            ES
                          </span>
                        );
                      }
                      if (mode.id === 'BILINGUAL') {
                        return <RotateCw className={`w-4 h-4 shrink-0 ${colorClass}`} />;
                      }
                      if (mode.id === 'ADAPTIVE') {
                        return <Zap className={`w-4 h-4 shrink-0 ${colorClass}`} />;
                      }
                      if (mode.id === 'AMERICAN_ENGLISH') {
                        return (
                          <span className={`w-5 h-5 flex items-center justify-center font-bold text-xs leading-none tracking-tight ${colorClass}`}>
                            EN
                          </span>
                        );
                      }
                      if (mode.id === 'LIVE_TRANSLATOR') {
                        return <Languages className={`w-4 h-4 shrink-0 ${colorClass}`} />;
                      }
                      return <Headphones className={`w-4 h-4 shrink-0 ${colorClass}`} />;
                    };

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          if (isPaused) {
                            resume(true);
                          }
                          handleModeSelection(mode.id as ConversationMode);
                          applyChosenMode(mode.id as ConversationMode);
                          if (isConnected) {
                            sendText(`[INSTRUCCIÓN DE SISTEMA: El usuario ha seleccionado el modo de conversación: "${name}". Cambia tu estilo e idioma inmediatamente a este modo: "${desc}"]`);
                          }
                          setIsModeMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-2 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer group bg-transparent ${
                          isSelected
                            ? 'text-[#EAB308] font-bold'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            {renderModeIcon()}
                          </div>
                          <span className={`text-[15px] leading-tight whitespace-nowrap tracking-normal transition-colors ${
                            isSelected ? 'font-bold text-[#EAB308]' : 'font-normal text-gray-400 group-hover:text-white'
                          }`}>
                            {name}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* PAUSA Option */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPaused) {
                        handlePauseButtonClick();
                      } else {
                        resume(true);
                      }
                      setIsModeMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-2 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer group bg-transparent ${
                      isPaused
                        ? 'text-[#EAB308] font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <Pause fill="currentColor" className={`w-4 h-4 shrink-0 transition-colors ${isPaused ? 'text-[#EAB308]' : 'text-gray-400 group-hover:text-white'}`} />
                      </div>
                      <span className={`text-[15px] leading-tight whitespace-nowrap tracking-normal transition-colors ${
                        isPaused ? 'font-bold text-[#EAB308]' : 'font-normal text-gray-400 group-hover:text-white'
                      }`}>
                        {selectedLang === 'EN' ? 'Pause' : 'Pausa'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Bar: Pill Input, Mic button, Close button */}
      <div className="z-30 w-full max-w-2xl px-2 sm:px-4 md:px-6 pb-0.5 sm:pb-1 md:pb-1.5 lg:pb-2.5 flex items-center justify-center gap-1.5 sm:gap-3">
        {/* Pill Text Input */}
        <div className="w-[40%] flex items-center rounded-full border border-[#EAB308]/80 bg-transparent shadow-2xl px-2.5 py-1.5 sm:px-4 sm:py-2.5 transition-all focus-within:border-white focus-within:bg-transparent gap-1.5 sm:gap-2.5">
          {/* Tilted Arrow (Send) button at the beginning of the input box */}
          <button
            onClick={() => {
              if (inputText.trim()) {
                sendMessageWithDictationCheck(inputText);
              }
            }}
            aria-label="Send message"
            className={`shrink-0 hover:text-white p-0.5 sm:p-1 transition-colors cursor-pointer ${
              inputText.trim() ? 'text-[#EAB308]' : 'text-neutral-400'
            }`}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputText.trim()) {
                sendMessageWithDictationCheck(inputText);
              }
            }}
            placeholder={selectedLang === 'EN' ? 'Type a message...' : 'Escribe un mensaje...'}
            className="flex-1 bg-transparent text-white placeholder:text-white/45 outline-none text-xs sm:text-base font-normal min-w-0"
          />
        </div>

        {/* Microphone / Dictation Button */}
        <button
          onClick={() => {
            setIsDictationActive(prev => !prev);
          }}
          title={isDictationActive ? (selectedLang === 'EN' ? 'Stop Dictation' : 'Detener Dictado') : (selectedLang === 'EN' ? 'Start Voice Dictation' : 'Iniciar Dictado por Voz')}
          aria-label="Voice dictation"
          className={`w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-full bg-transparent shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer ${
            isDictationActive
              ? 'text-red-500 border-2 border-red-500 bg-red-500/20 animate-pulse'
              : 'text-[#EAB308] border border-[#EAB308]/80 hover:text-white hover:border-white'
          }`}
        >
          <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Exit Live Button */}
        <button
          onClick={() => {
            setIsDictationActive(false);
            setIsLiveVoiceActive(false);
          }}
          aria-label="Exit Live"
          className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-full bg-transparent text-[#EAB308] hover:text-white border border-[#EAB308]/80 hover:border-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
     </div>
 ) : (
 <div className="min-h-full flex flex-col justify-start space-y-4 pt-12 sm:pt-14 md:pt-16">
  {(activeScenarioId === 'assessment' || currentModeObj.id === 'ENGLISH_ASSESSMENT') && (
    <EnglishAssessment
      selectedLang={selectedLang}
      isConnected={isConnected}
      isPaused={isPaused}
      onAskVoyager={(text) => {
        if (isConnected) {
          sendText(text);
        } else {
          connect(text, true, selectedLang);
        }
      }}
      onApplyLevelToProfile={(level, assessmentScores) => {
        setSelectedLevel(level as any);
        setScores(prev => ({
          ...prev,
          grammar: assessmentScores.grammar,
          pronunciation: assessmentScores.pronunciation,
          confidence: assessmentScores.interaction,
          naturalness: assessmentScores.fluency
        }));
      }}
      onClose={() => {
        setActiveScenarioId('open');
      }}
    />
  )}
 {(() => {
   const visibleMsgs = chatMessages.filter(msg => {
     if (msg.tab && msg.tab !== 'chat') return false;
     if (msg.sender === 'system') return false;
     if (msg.sender === 'user' && msg.text.startsWith('[')) return false;
     return true;
   });

   return visibleMsgs.map((msg, index) => {
     const isUser = msg.sender === 'user';
     const isLatest = index === visibleMsgs.length - 1;

     return (
 <div key={msg.id} className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} gap-2.5 animate-fade-in`}>
 <div className={`w-full max-w-[98%] sm:max-w-[88%] flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
 <div className={
   isUser
     ? `bubble-user-gradient-wrapper rounded-[26px] ${isLatest ? 'is-latest' : ''}`
     : `bubble-ai-gradient-wrapper rounded-[26px] ${isLatest ? 'is-latest' : ''}`
 }>
 <div className={`
 px-3.5 sm:px-4 py-2.5 rounded-[22px] text-sm leading-snug transition-all shadow-md
 ${isDarkMode ? (isUser ? 'bg-[#1A2E4B] text-blue-50 border border-blue-500/40' : 'bg-[#1E293B] text-slate-100 border border-slate-700/70') : 'bg-white text-black'}
 ${isUser ? 'font-normal' : ''}
 `}>
 {isUser && (
 <div className="flex items-center justify-end gap-1 mb-1.5 select-none">
 <User strokeWidth={2.5} className="w-4 h-4 text-[#5382eb]" />
 </div>
 )}
 {!isUser && (
 <div className="flex items-center gap-1 mb-1.5 select-none">
 <Bot strokeWidth={2.5} className={`w-[18px] h-[18px] flex-shrink-0 ${isDarkMode ? "text-amber-400" : "text-red-600"}`} />
 </div>
 )}
 <div className={`chat-message-text whitespace-pre-line tracking-wider leading-snug ${isUser ? 'text-right' : 'text-left'}`}>
 {(() => {
 const rawText = getTranslatedMessageText(msg, selectedLang);
 if (!isUser && rawText.includes(" / ")) {
 const parts = rawText.split(" / ");
 if (parts.length >= 2) {
 return (
 <>
 <div style={{ fontFamily: '"Raleway", sans-serif', fontWeight: 600 }} className={`${isDarkMode ? 'text-slate-100' : 'text-black'} font-semibold leading-snug`}>{parseAndRenderEmojis(parts[0])}</div>
 <div style={{ fontFamily: '"Raleway", sans-serif', fontWeight: 600 }} className={`chat-message-english ${isDarkMode ? 'text-slate-300' : 'text-black'} font-semibold leading-snug mt-2`}>
 {parseAndRenderEmojis(parts.slice(1).join(" / "))}
 </div>
 </>
 );
 }
 }
 return <div style={{ fontFamily: '"Raleway", sans-serif', fontWeight: 600 }} className={`${isDarkMode ? 'text-slate-100' : 'text-black'} font-semibold leading-snug`}>{parseAndRenderEmojis(rawText)}</div>;
 })()}
 </div>
 
 {!isUser && msg.showForm && (
 <div className="border-t border-white/10 pt-3 mt-3 space-y-2.5">
 {inlineLeadSuccess ? (
 <div className="text-center py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
 <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
 {selectedLang === 'EN' ? "✓ Info Captured Successfully!" : "✓ ¡Datos Guardados Exitosamente!"}
 </span>
 </div>
 ) : inlineFormStep === 'details' ? (
 <>
 <div className="grid grid-cols-2 gap-2.5">
 <div>
 <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
 {selectedLang === 'EN' ? "Full Name *" : "Nombre Completo *"}
 </label>
 <input
 type="text"
 value={inlineLeadForm.name}
 onChange={(e) => setInlineLeadForm({...inlineLeadForm, name: e.target.value})}
 placeholder="e.g. Jane Doe"
 className="w-full px-3 py-1.5 bg-[#0D224A]/70 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:bg-[#0D224A]/90 transition-all min-h-[36px]"
 />
 </div>

 <div>
 <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
 {selectedLang === 'EN' ? "Email Address *" : "Correo Electrónico *"}
 </label>
 <input
 type="email"
 value={inlineLeadForm.email}
 onChange={(e) => setInlineLeadForm({...inlineLeadForm, email: e.target.value})}
 placeholder="e.g. jane@company.com"
 className="w-full px-3 py-1.5 bg-[#0D224A]/70 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:bg-[#0D224A]/90 transition-all min-h-[36px]"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2.5">
 <div>
 <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
 {selectedLang === 'EN' ? "Company" : "Empresa"}
 </label>
 <input
 type="text"
 value={inlineLeadForm.company}
 onChange={(e) => setInlineLeadForm({...inlineLeadForm, company: e.target.value})}
 placeholder="e.g. Acme Corp"
 className="w-full px-3 py-1.5 bg-[#0D224A]/70 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:bg-[#0D224A]/90 transition-all min-h-[36px]"
 />
 </div>
 <div>
 <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
 {selectedLang === 'EN' ? "Phone Number *" : "Número Telefónico *"}
 </label>
 <input
 type="tel"
 value={inlineLeadForm.phone}
 onChange={(e) => setInlineLeadForm({...inlineLeadForm, phone: e.target.value})}
 placeholder="e.g. +1 555-0199"
 className="w-full px-3 py-1.5 bg-[#0D224A]/70 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:bg-[#0D224A]/90 transition-all min-h-[36px]"
 />
 </div>
 </div>

 <div>
 <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
 Agendar Reunión
 </label>
 <div className="grid grid-cols-2 gap-2.5">
 <div className="relative">
 <div
 onClick={() => setShowCalendar(!showCalendar)}
 className="w-full px-3 py-1.5 bg-[#0D224A]/70 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-neutral-200 cursor-pointer focus:outline-none focus:border-yellow-500 focus:bg-[#0D224A]/90 transition-all min-h-[36px] flex items-center gap-2"
 >
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-500 flex-shrink-0">
 <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
 </svg>
 <span className="truncate text-yellow-400 font-mono font-semibold">
 {inlineLeadForm.meetingTime 
 ? new Date(inlineLeadForm.meetingTime).toLocaleDateString([], { dateStyle: 'medium' }) 
 : "Seleccione Fecha"}
 </span>
 </div>

 {showCalendar && (
 <div className="absolute left-0 mt-1.5 p-3 w-[240px] bg-neutral-950 border border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.95)] backdrop-blur-md z-50 text-white select-none">
 <div className="flex items-center justify-between mb-2">
 <button
 type="button"
 onClick={() => {
 const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
 setCalendarMonth(prev);
 }}
 className="p-1 rounded-lg text-yellow-400 cursor-pointer transition-all"
 >
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
 </svg>
 </button>
 <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-300">
 {calendarMonth.toLocaleString([], { month: 'long', year: 'numeric' })}
 </span>
 <button
 type="button"
 onClick={() => {
 const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
 setCalendarMonth(next);
 }}
 className="p-1 rounded-lg text-yellow-400 cursor-pointer transition-all"
 >
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
 <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
 </svg>
 </button>
 </div>

 <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[8px] font-bold text-yellow-400">
 <span>{selectedLang === 'EN' ? "MO" : "LU"}</span>
 <span>{selectedLang === 'EN' ? "TU" : "MA"}</span>
 <span>{selectedLang === 'EN' ? "WE" : "MI"}</span>
 <span>{selectedLang === 'EN' ? "TH" : "JU"}</span>
 <span>{selectedLang === 'EN' ? "FR" : "VI"}</span>
 <span>{selectedLang === 'EN' ? "SA" : "SÁ"}</span>
 <span>{selectedLang === 'EN' ? "SU" : "DO"}</span>
 </div>

 <div className="grid grid-cols-7 gap-1 text-center">
 {getDaysInMonth(calendarMonth).map((day, idx) => {
 if (day === null) {
 return <div key={`empty-${idx}`} />;
 }
 const isSelected = selectedCalendarDay === day;
 return (
 <button
 key={`day-${day}`}
 type="button"
 onClick={() => setSelectedCalendarDay(day)}
 className={`w-6 h-6 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center cursor-pointer transition-all ${
 isSelected 
 ? 'bg-yellow-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.6)]' 
 : ' text-neutral-300'
 }`}
 >
 {day}
 </button>
 );
 })}
 </div>

 <button
 type="button"
 disabled={selectedCalendarDay === null}
 onClick={() => {
 if (selectedCalendarDay !== null) {
 const yr = calendarMonth.getFullYear();
 const mo = String(calendarMonth.getMonth() + 1).padStart(2, '0');
 const dy = String(selectedCalendarDay).padStart(2, '0');
 const formatted = `${yr}-${mo}-${dy}T${selectedCalendarTime}:00Z`;
 setInlineLeadForm({ ...inlineLeadForm, meetingTime: formatted });
 setShowCalendar(false);
 }
 }}
 className="w-full mt-3 py-1 bg-black border border-yellow-500/40 text-yellow-400 text-[9px] font-mono font-bold tracking-widest rounded-full cursor-pointer hover:bg-yellow-500 hover:text-black transition-all uppercase text-center disabled:opacity-30 disabled:pointer-events-none"
 >
 CONFIRMAR
 </button>
 </div>
 )}
 </div>

 <div className="relative">
 <select
 value={selectedCalendarTime}
 onChange={(e) => {
 setSelectedCalendarTime(e.target.value);
 if (selectedCalendarDay !== null) {
 const yr = calendarMonth.getFullYear();
 const mo = String(calendarMonth.getMonth() + 1).padStart(2, '0');
 const dy = String(selectedCalendarDay).padStart(2, '0');
 const formatted = `${yr}-${mo}-${dy}T${e.target.value}:00Z`;
 setInlineLeadForm(prev => ({ ...prev, meetingTime: formatted }));
 }
 }}
 className="w-full pl-9 pr-3 py-1.5 bg-[#0D224A]/70 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-yellow-400 font-mono focus:outline-none focus:border-yellow-500 focus:bg-[#0D224A]/90 transition-all min-h-[36px] cursor-pointer appearance-none"
 >
 <option value="09:00">09:00 AM</option>
 <option value="10:00">10:00 AM</option>
 <option value="11:00">11:00 AM</option>
 <option value="12:00">12:00 PM</option>
 <option value="13:00">01:00 PM</option>
 <option value="14:00">02:00 PM</option>
 <option value="15:00">03:00 PM</option>
 <option value="16:00">04:00 PM</option>
 <option value="17:00">05:00 PM</option>
 </select>
 <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-500">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
 </svg>
 </div>
 </div>
 </div>
 </div>

 {inlineLeadError && (
 <span className="text-[10px] text-red-500 font-bold block mt-2.5 pl-1">{inlineLeadError}</span>
 )}

 <div className="flex items-center gap-4 mt-2.5 pl-1">
 <button
 type="button"
 onClick={() => {
 if (!inlineLeadForm.name.trim() || !inlineLeadForm.email.trim() || !inlineLeadForm.phone.trim()) {
 setInlineLeadError(selectedLang === 'EN' ? "Name, email, and phone number are required." : "Se requiere nombre, correo y número telefónico.");
 return;
 }
 setInlineLeadError(null);
 setInlineFormStep('services');
 }}
 className="flex-shrink-0 w-auto px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 border-none text-[10px] font-mono font-bold tracking-widest rounded-full transition-all duration-300 cursor-pointer shadow-md active:scale-95 min-h-[26px] uppercase text-center inline-flex items-center justify-center text-black"
 >
 SIGUIENTE
 </button>
 <div className="flex items-center gap-2 select-none cursor-pointer">
 <input
 type="checkbox"
 id="marketingConsent"
 checked={inlineLeadForm.consent}
 onChange={(e) => setInlineLeadForm({...inlineLeadForm, consent: e.target.checked})}
 className="w-4 h-4 rounded border-white/20 text-yellow-500 focus:ring-yellow-500 focus:ring-opacity-25 bg-[#0D224A]/60 cursor-pointer"
 />
 <label htmlFor="marketingConsent" className="text-[9px] font-bold tracking-wider text-neutral-300 cursor-pointer leading-tight">
 Enviarme la info
 </label>
 </div>
 </div>
 </>
 ) : (
 <>
 <div className="space-y-2">
 <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
 Seleccione los Servicios de Interés
 </label>
 <div className="grid grid-cols-2 gap-2">
 {[
 { id: "AI Voice Agent", labelEn: "AI Voice Agent & Call Automation", labelEs: "Agente de Voz IA" },
 { id: "CRM Integration", labelEn: "Custom CRM Integration", labelEs: "Integración CRM" },
 { id: "Marketing Roadmap", labelEn: "Local Marketing Roadmap", labelEs: "Plan de Marketing Local" },
 { id: "Marketing Automations", labelEn: "SMS & Email Automations", labelEs: "Automatizaciones SMS/Email" }
 ].map(srv => {
 const isChecked = selectedServices.includes(srv.id);
 return (
 <label key={srv.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#0D224A]/50 border border-white/10 hover:border-yellow-500/50 rounded-xl cursor-pointer transition-all select-none min-h-[36px] hover:bg-[#0D224A]/80">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => {
 if (e.target.checked) {
 setSelectedServices([...selectedServices, srv.id]);
 } else {
 setSelectedServices(selectedServices.filter(s => s !== srv.id));
 }
 }}
 className="w-4 h-4 rounded border-white/20 text-yellow-500 focus:ring-yellow-500 focus:ring-opacity-25 bg-[#0D224A]/60 cursor-pointer"
 />
 <span className="text-[10px] text-neutral-200 font-medium leading-tight">
 {selectedLang === 'EN' ? srv.labelEn : srv.labelEs}
 </span>
 </label>
 );
 })}
 </div>
 </div>

 {inlineLeadError && (
 <span className="text-[10px] text-red-500 font-bold block mt-1">{inlineLeadError}</span>
 )}

 <div className="grid grid-cols-2 gap-2.5 mt-3 pt-2 border-t border-white/10">
 <div>
 <button
 type="button"
 onClick={() => setInlineFormStep('details')}
 className="w-full py-1 bg-transparent border-none text-neutral-300 text-[10px] font-mono font-bold tracking-widest rounded-full transition-all hover:bg-white/5 min-h-[26px] uppercase text-center inline-flex items-center justify-center cursor-pointer"
 >
 ATRÁS
 </button>
 </div>
 <div>
 <button
 type="button"
 onClick={handleInlineLeadSubmit}
 disabled={isSubmittingInlineLead}
 className="w-full px-3.5 py-1 bg-yellow-500 text-black border-none text-[10px] font-mono font-bold tracking-widest rounded-full transition-all duration-300 cursor-pointer shadow-md hover:bg-yellow-600 active:scale-95 disabled:opacity-50 min-h-[26px] uppercase text-center inline-flex items-center justify-center font-bold"
 >
 {isSubmittingInlineLead ? "ENVIANDO..." : "ENVIAR"}
 </button>
 </div>
  </div>
  </>
  )}
  </div>
  )}
  </div>
  </div>
   {!isUser && (
   <div className="flex flex-col w-full">
     <div className="flex items-center gap-2 mt-1 px-1.5 select-none flex-wrap">
       <button
         type="button"
         onClick={() => {
           setChatMessages(prev =>
             prev.map(m => m.id === msg.id ? { ...m, feedback: m.feedback === 'up' ? undefined : 'up' } : m)
           );
         }}
         title={selectedLang === 'EN' ? "Helpful" : "Útil"}
         aria-label="Thumbs up"
         className={`p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer ${
           msg.feedback === 'up'
             ? isDarkMode ? 'text-[#FFD700] scale-110' : 'text-amber-500 scale-110'
             : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
         }`}
       >
         <ThumbsUp
           className="w-4 h-4 transition-transform active:scale-125"
           strokeWidth={msg.feedback === 'up' ? 2.25 : 1.75}
           fill="none"
         />
       </button>
       <button
         type="button"
         onClick={() => {
           setChatMessages(prev =>
             prev.map(m => m.id === msg.id ? { ...m, feedback: m.feedback === 'down' ? undefined : 'down' } : m)
           );
         }}
         title={selectedLang === 'EN' ? "Not helpful" : "No útil"}
         aria-label="Thumbs down"
         className={`p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer ${
           msg.feedback === 'down'
             ? isDarkMode ? 'text-rose-400 scale-110' : 'text-rose-500 scale-110'
             : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
         }`}
       >
         <ThumbsDown
           className="w-4 h-4 transition-transform active:scale-125"
           strokeWidth={msg.feedback === 'down' ? 2.25 : 1.75}
           fill="none"
         />
       </button>

       {/* Copy Icon - copies text of the bubble */}
       <button
         type="button"
         onClick={() => {
           const cleanText = msg.text.replace(/\[.*?\]/g, '').trim();
           if (navigator.clipboard) {
             navigator.clipboard.writeText(cleanText);
           }
           setCopiedMsgId(msg.id);
           setTimeout(() => setCopiedMsgId(null), 2000);
         }}
         title={copiedMsgId === msg.id ? (selectedLang === 'EN' ? 'Copied!' : '¡Copiado!') : (selectedLang === 'EN' ? 'Copy text' : 'Copiar texto')}
         aria-label="Copy text"
         className={`p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer ${
           copiedMsgId === msg.id
             ? 'text-emerald-500 scale-110'
             : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
         }`}
       >
         {copiedMsgId === msg.id ? (
           <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.25} />
         ) : (
           <Copy className="w-4 h-4 transition-transform active:scale-125" strokeWidth={1.75} />
         )}
       </button>

       {/* Voice Icon - reads the chat bubble when pressed */}
       <button
         type="button"
         onClick={() => {
           if ('speechSynthesis' in window) {
             window.speechSynthesis.cancel();
             if (speakingMsgId === msg.id) {
               setSpeakingMsgId(null);
               return;
             }
             const textToSpeak = msg.text.replace(/\[.*?\]/g, '').trim();
             if (!textToSpeak) return;
             const utterance = new SpeechSynthesisUtterance(textToSpeak);
             utterance.lang = msg.switchLang === 'EN' || selectedLang === 'EN' ? 'en-US' : 'es-ES';
             utterance.rate = 0.95;
             utterance.onstart = () => setSpeakingMsgId(msg.id);
             utterance.onend = () => setSpeakingMsgId(null);
             utterance.onerror = () => setSpeakingMsgId(null);
             window.speechSynthesis.speak(utterance);
           } else if (speakText) {
             speakText(msg.text.replace(/\[.*?\]/g, '').trim());
           }
         }}
         title={speakingMsgId === msg.id ? (selectedLang === 'EN' ? 'Stop Speaking' : 'Detener lectura') : (selectedLang === 'EN' ? 'Read Aloud' : 'Escuchar respuesta')}
         aria-label="Read text aloud"
         className={`p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer ${
           speakingMsgId === msg.id
             ? 'text-amber-500 scale-110 animate-pulse'
             : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
         }`}
       >
         {speakingMsgId === msg.id ? (
           <VolumeX className="w-4 h-4 text-amber-500" strokeWidth={2.25} />
         ) : (
           <Volume2 className="w-4 h-4 transition-transform active:scale-125" strokeWidth={1.75} />
         )}
       </button>

       <button
         type="button"
         onClick={() => setOpenFeedbackMsgId(prev => prev === msg.id ? null : msg.id)}
         title={selectedLang === 'EN' ? "Voyager Feedback" : "Comentarios Voyager"}
         aria-label="Voyager Feedback"
         className={`p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer ${
           openFeedbackMsgId === msg.id
             ? 'text-amber-500 scale-110'
             : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
         }`}
       >
         <MessageSquarePlus className="w-4 h-4 transition-transform active:scale-125" strokeWidth={1.75} />
       </button>
     </div>

     {/* Voyager Feedback Sub-Chat Box */}
     {openFeedbackMsgId === msg.id && (
       <div className={`w-full mt-2 p-3 rounded-2xl ${isDarkMode ? 'bg-slate-800/80 border-slate-700/80 text-white' : 'bg-slate-900 border-slate-800 text-white'} border backdrop-blur-md text-left animate-fade-in shadow-xl space-y-2`}>
         <div className="flex items-center justify-between text-xs font-semibold text-amber-400/90 pb-1 border-b border-white/10">
           <span className="flex items-center gap-1.5">
             <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
             {selectedLang === 'EN' ? 'Voyager Feedback Chat' : 'Chat de Comentarios Voyager'}
           </span>
           <button 
             type="button"
             onClick={() => setOpenFeedbackMsgId(null)}
             className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
           >
             <X className="w-3 h-3" />
           </button>
         </div>

         {/* Previous Feedback Messages */}
         {msgFeedbackLists[msg.id] && msgFeedbackLists[msg.id].length > 0 && (
           <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
             {msgFeedbackLists[msg.id].map((fb) => (
               <div key={fb.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 flex justify-between items-start gap-2">
                 <span>{fb.text}</span>
                 <span className="text-[10px] text-amber-400/80 font-mono whitespace-nowrap">
                   {selectedLang === 'EN' ? 'Received ✓' : 'Enviado ✓'}
                 </span>
               </div>
             ))}
           </div>
         )}

         {/* Send Feedback Form */}
         <form
           onSubmit={(e) => {
             e.preventDefault();
             const currentText = (msgFeedbackInput[msg.id] || '').trim();
             if (!currentText) return;
             const newFb = { id: Date.now().toString(), text: currentText, timestamp: new Date() };
             setMsgFeedbackLists(prev => ({
               ...prev,
               [msg.id]: [...(prev[msg.id] || []), newFb]
             }));
             setMsgFeedbackInput(prev => ({ ...prev, [msg.id]: '' }));
             setMsgFeedbackSent(prev => ({ ...prev, [msg.id]: true }));
             setTimeout(() => {
               setMsgFeedbackSent(prev => ({ ...prev, [msg.id]: false }));
             }, 2500);
           }}
           className="flex items-center gap-2 pt-1"
         >
           <input
             type="text"
             value={msgFeedbackInput[msg.id] || ''}
             onChange={(e) => setMsgFeedbackInput(prev => ({ ...prev, [msg.id]: e.target.value }))}
             placeholder={selectedLang === 'EN' ? 'Send feedback about Voyager...' : 'Envía tus comentarios para Voyager...'}
             className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-950/90 border border-slate-700/70 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60 transition-colors"
           />
           <button
             type="submit"
             disabled={!(msgFeedbackInput[msg.id] || '').trim()}
             className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95"
             title={selectedLang === 'EN' ? 'Send Feedback' : 'Enviar Comentarios'}
           >
             <SendHorizontal className="w-3.5 h-3.5" />
           </button>
         </form>

         {msgFeedbackSent[msg.id] && (
           <p className="text-[11px] text-emerald-400 font-medium animate-fade-in pl-0.5">
             {selectedLang === 'EN' ? 'Thank you! Your feedback has been logged.' : '¡Gracias! Tus comentarios han sido registrados.'}
           </p>
         )}
       </div>
     )}
   </div>
   )}
    {isUser && (
    <div className="flex flex-col w-full items-end">
      <div className="flex items-center gap-2 mt-1 px-1.5 select-none flex-wrap justify-end">
        <button
          type="button"
          onClick={() => {
            const cleanText = msg.text.replace(/\[.*?\]/g, '').trim();
            if (navigator.clipboard) {
              navigator.clipboard.writeText(cleanText);
            }
            setCopiedMsgId(msg.id);
            setTimeout(() => setCopiedMsgId(null), 2000);
          }}
          title={copiedMsgId === msg.id ? (selectedLang === 'EN' ? 'Copied!' : '¡Copiado!') : (selectedLang === 'EN' ? 'Copy text' : 'Copiar texto')}
          aria-label="Copy text"
          className={copiedMsgId === msg.id ? 'p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer text-emerald-500 scale-110' : (isDarkMode ? 'p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-200' : 'p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer text-slate-500 hover:text-slate-800')}
        >
          {copiedMsgId === msg.id ? (
            <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.25} />
          ) : (
            <Copy className="w-4 h-4 transition-transform active:scale-125" strokeWidth={1.75} />
          )}
        </button>

        <button
          type="button"
          onClick={() => setOpenFeedbackMsgId(prev => prev === msg.id ? null : msg.id)}
          title={selectedLang === 'EN' ? "Voyager Feedback" : "Comentarios Voyager"}
          aria-label="Voyager Feedback"
          className={openFeedbackMsgId === msg.id ? 'p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer text-amber-500 scale-110' : (isDarkMode ? 'p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-200' : 'p-1 bg-transparent border-none outline-none transition-all duration-150 flex items-center justify-center cursor-pointer text-slate-500 hover:text-slate-800')}
        >
          <MessageSquarePlus className="w-4 h-4 transition-transform active:scale-125" strokeWidth={1.75} />
        </button>
      </div>

      {openFeedbackMsgId === msg.id && (
        <div className={`w-full max-w-sm mt-2 p-3 rounded-2xl ${isDarkMode ? 'bg-slate-800/80 border-slate-700/80 text-white' : 'bg-slate-900 border-slate-800 text-white'} border backdrop-blur-md text-left animate-fade-in shadow-xl space-y-2`}>
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400/90 pb-1 border-b border-white/10">
            <span className="flex items-center gap-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
              {selectedLang === 'EN' ? 'Voyager Feedback Chat' : 'Chat de Comentarios Voyager'}
            </span>
            <button 
              type="button"
              onClick={() => setOpenFeedbackMsgId(null)}
              className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {msgFeedbackLists[msg.id] && msgFeedbackLists[msg.id].length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {msgFeedbackLists[msg.id].map((fb) => (
                <div key={fb.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 flex justify-between items-start gap-2">
                  <span>{fb.text}</span>
                  <span className="text-[10px] text-amber-400/80 font-mono whitespace-nowrap">
                    {selectedLang === 'EN' ? 'Received ✓' : 'Enviado ✓'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const currentText = (msgFeedbackInput[msg.id] || '').trim();
              if (!currentText) return;
              const newFb = { id: Date.now().toString(), text: currentText, timestamp: new Date() };
              setMsgFeedbackLists(prev => ({
                ...prev,
                [msg.id]: [...(prev[msg.id] || []), newFb]
              }));
              setMsgFeedbackInput(prev => ({ ...prev, [msg.id]: '' }));
              setMsgFeedbackSent(prev => ({ ...prev, [msg.id]: true }));
              setTimeout(() => {
                setMsgFeedbackSent(prev => ({ ...prev, [msg.id]: false }));
              }, 2500);
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              value={msgFeedbackInput[msg.id] || ''}
              onChange={(e) => setMsgFeedbackInput(prev => ({ ...prev, [msg.id]: e.target.value }))}
              placeholder={selectedLang === 'EN' ? 'Send feedback about Voyager...' : 'Envía tus comentarios para Voyager...'}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-950/90 border border-slate-700/70 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!(msgFeedbackInput[msg.id] || '').trim()}
              className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95"
              title={selectedLang === 'EN' ? 'Send Feedback' : 'Enviar Comentarios'}
            >
              <SendHorizontal className="w-3.5 h-3.5" />
            </button>
          </form>

          {msgFeedbackSent[msg.id] && (
            <p className="text-[11px] text-emerald-400 font-medium animate-fade-in pl-0.5">
              {selectedLang === 'EN' ? 'Thank you! Your feedback has been logged.' : '¡Gracias! Tus comentarios han sido registrados.'}
            </p>
          )}
        </div>
      )}
    </div>
    )}
  </div>
  </div>
  );
  });
})()}
          <ChatInputBox
            isDarkMode={isDarkMode}
            selectedLang={selectedLang}
            isConnected={isConnected}
            isPaused={isPaused}
            pause={pause}
            resume={resume}
            onSubmitText={(text) => {
              const trimmed = text ? text.trim() : '';
              if (!trimmed) return;
              addUserMessage(trimmed);
              sendText(trimmed);
            }}
            value={inputText}
            onChangeValue={setInputText}
            onOpenProfile={() => setRightPanelTab('roadmap')}
            isSpanishOnlyMode={isSpanishOnlyMode}
            setIsSpanishOnlyMode={setIsSpanishOnlyMode}
            isBilingualMode={isBilingualMode}
            setIsBilingualMode={setIsBilingualMode}
            isEnglishOnlyMode={isEnglishOnlyMode}
            setIsEnglishOnlyMode={setIsEnglishOnlyMode}
            isTranslateMode={isTranslateMode}
            setIsTranslateMode={setIsTranslateMode}
            isListenOnly={isListenOnly}
            setIsListenOnly={setIsListenOnly}
            isLiveVoiceActive={isLiveVoiceActive}
            onToggleLiveVoice={() => {
              setIsLiveVoiceActive(prev => !prev);
              if (isConnected && isPaused) {
                resume();
              }
            }}
          />
          <div ref={chatEndRef} />
        </div>
      )}
    </div>
  </div>
  ) : rightPanelTab === 'roadmap' ? (
  <RoadmapPanel
 selectedLang={selectedLang}
 learnedWordsCount={learnedWords.length}
 grammarScore={scores.grammar}
 pronunciationScore={scores.pronunciation}
 scores={scores}
 learnedWords={learnedWords}
 accentPatterns={accentPatterns}
 chatMessages={chatMessages}
 isPaused={isPaused}
 isConnected={isConnected}
 pause={pause}
 resume={resume}
 onAskVoyager={(text) => {
 setHasInteracted(true);
 addUserMessage(text);
 const profilePrompt = `[INSTRUCCIÓN DE SISTEMA CRÍTICA Y MANDATORIA: Estás respondiendo a una pregunta dentro de la pestaña de ${visitorFullName ? (visitorFullName.length > 8 ? visitorFullName.slice(0, 10) : visitorFullName).toUpperCase() : 'PERFIL'} del usuario.
1. Deja atrás cualquier otro tipo de conversación o tema general. Está ESTRICTAMENTE PROHIBIDO hablar de cualquier cosa que no sea el perfil específico, las metas, los reportes de progreso y los proyectos/lecciones asignados de este usuario.
2. Tu único trabajo es explicar e informar en español qué significan sus datos específicos (ej. sus puntuaciones de Fluidez, Gramática, Fonética, Confianza, palabras aprendidas) y el avance de sus metas personales.
3. Responde ÚNICAMENTE en español de forma clara, directa y muy precisa para que el usuario de habla hispana comprenda perfectamente su reporte.
4. REGLA INQUEBRANTABLE: NO intentes enseñar inglés, NO invites al usuario a practicar inglés, NO inicies juegos de conversación en inglés y NO ofrezcas lecciones.
Pregunta del usuario: "${text}"]`;
 sendText(profilePrompt);
 }}
 onNavigateTab={(tab) => setRightPanelTab(tab)}
 />

 ) : rightPanelTab === 'teachers' ? (
 <TeacherInsightsPanel
 selectedLang={selectedLang}
 chatMessages={chatMessages}
 isPaused={isPaused}
 isConnected={isConnected}
 pause={pause}
 resume={resume}
 scores={scores}
 learnedWords={learnedWords}
 accentPatterns={accentPatterns}
 onAskVoyager={(text) => {
 setHasInteracted(true);
 if (!text.startsWith('[AUTO_SYSTEM:')) {
 addUserMessage(text);
 }
 const teachersPrompt = text.startsWith('[AUTO_SYSTEM:')
 ? text
 : `[INSTRUCCIÓN DE SISTEMA CRÍTICA Y MANDATORIA: El usuario está conversando en la sección de La Profe.
1. Está ESTRICTAMENTE PROHIBIDO continuar, retomar o hacer referencia a cualquier conversación previa de la sección de CHARLA general o práctica general de inglés.
2. Las ÚNICAS conversaciones permitidas aquí son exclusivamente sobre temas de La Profe: clases particulares 1-a-1 en vivo con Alejandra Francois, programas de fonética y acento de Nueva York, contratación de paquetes y coaching, y soporte académico.
3. Responde ÚNICAMENTE en español de forma clara, profesional, directa y amable con la voz y personalidad de VOYAGER. No enseñes inglés ni hables en inglés aquí.
Pregunta del usuario: "${text}"]`;
 sendText(teachersPrompt);
 }}
 />
 ) : rightPanelTab === 'progress' ? (
 <div className="flex-1 flex flex-col bg-white overflow-hidden">
 <div className="flex-1 p-4 overflow-y-auto tab-content-area">
 <ProgressDashboard 
 selectedLang={selectedLang}
 scores={scores}
 learnedWords={learnedWords}
 accentPatterns={accentPatterns}
 onAskVoyager={(text) => {
 setRightPanelTab('chat');
 handleSuggestionClick(text);
 }}
 />
 </div>
 <ChatInputBox
 selectedLang={selectedLang}
 isConnected={isConnected}
 isPaused={isPaused}
 pause={pause}
 resume={resume}
 onSubmitText={(text) => {
   const trimmed = text ? text.trim() : '';
   if (!trimmed) return;
   setHasInteracted(true);
   addUserMessage(trimmed);
   sendText(trimmed);
 }}
 value={inputText}
 onChangeValue={setInputText}
 
 isSpanishOnlyMode={isSpanishOnlyMode}
 setIsSpanishOnlyMode={setIsSpanishOnlyMode}
 isBilingualMode={isBilingualMode}
 setIsBilingualMode={setIsBilingualMode}
 isEnglishOnlyMode={isEnglishOnlyMode}
 setIsEnglishOnlyMode={setIsEnglishOnlyMode}
 isTranslateMode={isTranslateMode}
 setIsTranslateMode={setIsTranslateMode}
 isListenOnly={isListenOnly}
 setIsListenOnly={setIsListenOnly}
 isLiveVoiceActive={isLiveVoiceActive}
 onToggleLiveVoice={() => {
   setIsLiveVoiceActive(prev => !prev);
   if (isConnected && isPaused) {
     resume();
   }
 }}
 />
 </div>
 ) : rightPanelTab === 'citizenship' ? (
 <CitizenshipCoach 
 selectedLang={'ES'} 
 userVoiceTranscription={lastUserVoiceTranscription}
 chatMessages={chatMessages}
 onAskVoyager={(prompt) => { if (!isConnected) connect(prompt, true); else { if (isPaused) resume(); sendText(prompt); } }} 
 onOpenSimulator={() => { setRightPanelTab('civics'); window.location.hash = '#/civics'; }} 
 />
 ) : rightPanelTab === 'civics' ? (
 <div className="flex-grow flex flex-col overflow-hidden h-full min-h-0">
  <Civics128Panel
  selectedLang={selectedLang}
  userVoiceTranscription={lastUserVoiceTranscription}
  onEnsureConnected={() => {
    if (!isConnected) {
      connect(undefined, true);
    } else if (isPaused) {
      resume();
    }
  }}
  onSendToChat={(text) => {
  setRightPanelTab('chat');
  addUserMessage(text);
  const civicsPrompt = `[INSTRUCCIÓN DE SISTEMA: El usuario hace la siguiente consulta sobre Cívica / Ciudadanía de USCIS: "${text}". Como Officer Voyager, responde en personaje en 1 a 3 oraciones cortas.]`;
  sendText(civicsPrompt);
  }}
  onSpeakWithVoyager={(text) => {
  if (!isConnected) {
    connect(undefined, true);
  } else if (isPaused) {
    resume();
  }
  sendText(text);
  if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.cancel();
  let cleanText = text.replace(/\[ROLEPLAY INSTRUCTION:[^\]]+\]/gi, '').replace(/\[EXAMINER INSTRUCTION:[^\]]+\]/gi, '').replace(/\[INSTRUCCIÓN DE SISTEMA:[^\]]+\]/gi, '').trim();
  if (!cleanText && text.includes('"')) {
    const match = text.match(/"([^"]+)"/);
    if (match) cleanText = match[1];
  }
  const spokenText = (cleanText || text).replace(/\bEE\.?UU\.?\b/gi, 'Estados Unidos');
  const utterance = new SpeechSynthesisUtterance(spokenText);
  const isFemale = (name: string) => {
  const lower = name.toLowerCase();
  return lower.includes('female') || lower.includes('samantha') || lower.includes('victoria') || lower.includes('zira') || lower.includes('siri') || lower.includes('karen');
  };
  const voices = window.speechSynthesis.getVoices();
  const voyagerVoice = voices.find(v => v.name.toLowerCase() === 'alex' && !isFemale(v.name)) ||
  voices.find(v => v.lang.toLowerCase().startsWith('en') && !isFemale(v.name) && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('google us english') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('fred'))) ||
  voices.find(v => v.lang.toLowerCase().startsWith('en') && !isFemale(v.name));
  if (voyagerVoice) {
  utterance.voice = voyagerVoice;
  utterance.lang = voyagerVoice.lang;
  }
  utterance.rate = 1.0;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
  }
  }}
  />
 </div>
 ) : rightPanelTab === 'settings' ? (
 <SettingsPanel
 selectedLang={selectedLang}
 setSelectedLang={setSelectedLang}
 isListenOnly={isListenOnly}
 setIsListenOnly={setIsListenOnly}
 isTranslateMode={isTranslateMode}
 setIsTranslateMode={setIsTranslateMode}
 isBilingualMode={isBilingualMode}
 setIsBilingualMode={setIsBilingualMode}
 isSpanishOnlyMode={isSpanishOnlyMode}
 setIsSpanishOnlyMode={setIsSpanishOnlyMode}
 isEnglishOnlyMode={isEnglishOnlyMode}
 setIsEnglishOnlyMode={setIsEnglishOnlyMode}
 />
 ) : null}
 {/* Always mount ShoppingPanel to prevent script reloading & duplicate minicart widgets */}
 <div className={rightPanelTab === 'shopping' ? 'flex-grow flex flex-col overflow-hidden h-full min-h-0' : 'hidden'}>
 <ShoppingPanel
 cartCount={cartCount}
 selectedLang={selectedLang}
 userPlan={(() => {
 const saved = localStorage.getItem('voyager_user_account');
 if (saved) {
 try {
 const u = JSON.parse(saved);
 return u.plan || 'FREE';
 } catch (e) {}
 }
 return 'FREE';
 })()}
 onUpgradeSuccess={() => {
 const saved = localStorage.getItem('voyager_user_account');
 let u = {
 name: selectedLang === 'EN' ? 'Learner' : 'Estudiante',
 email: 'learner@usavoyager.com',
 provider: 'Guest' as const,
 goal: 'Business English & Networking',
 levelEstimate: 'Intermediate',
 completedDays: [1],
 plan: 'PRO' as const
 };
 if (saved) {
 try {
 u = { ...JSON.parse(saved), plan: 'PRO' };
 } catch (e) {}
 }
 localStorage.setItem('voyager_user_account', JSON.stringify(u));
 setRightPanelTab('roadmap');
 }}
 chatMessages={chatMessages}
 isPaused={isPaused}
 isConnected={isConnected}
 pause={pause}
 resume={resume}
 sendText={sendText}
 onAskVoyager={(text) => {
 setHasInteracted(true);
 addUserMessage(text);
 const storePrompt = `[INSTRUCCIÓN DE SISTEMA: Misión de VOYAGER TIENDA.
Eres VOYAGER TIENDA, el asesor conversacional de la tienda integrada de USA Voyager.
Eres un vendedor consultivo, cálido, paciente, entusiasta y experto. Tu objetivo es ayudar al usuario a descubrir, entender y elegir productos, materiales de estudio, libros de trabajo, mercancía oficial, membresías y paquetes de coaching con La Profe. No es una clase de inglés ni un chat general.

Reglas esenciales:
- Pronuncia “U.S.A.” en inglés americano: “you ess ay”.
- Habla solo en español o inglés. El español es el idioma predeterminado. Si aparece una palabra en inglés, pronúnciala con acento americano.
- Mantén la conversación exclusivamente relacionada con la tienda: productos, beneficios, diferencias entre opciones, materiales de estudio, paquetes, La Profe, coaching, precios, carrito, cuenta y compra.
- Haz una pregunta a la vez para entender qué necesita la persona: su meta, nivel, presupuesto, tiempo disponible, interés o situación de aprendizaje.
- Explica valor práctico antes de recomendar: para quién sirve el producto, qué problema resuelve, cómo se usa y qué resultado puede aportar.
- Recomienda con honestidad y sin presión. Si varias opciones encajan, compáralas brevemente y explica cuál parece la mejor según las necesidades del usuario.
- Nunca inventes productos, precios, disponibilidad, descuentos, políticas, resultados o información de pedidos. Si no tienes la información, dilo con claridad y ofrece revisar la tienda o el carrito.
- Si el usuario pregunta algo ajeno a TIENDA, responde brevemente que ese tema corresponde a CHARLA, LA PROFE o PERFIL, e invítalo a cambiar a la sección adecuada.
- No continúes conversaciones de CHARLA dentro de TIENDA. La conversación de TIENDA debe tener su propio historial y contexto.
- Responde con energía amable y clara. Usa frases breves, naturales y útiles. Evita sonar corporativo, robótico, insistente o excesivamente vendedor.
- NO des clases de inglés, NO corrijas gramática de inglés, NO enseñes inglés. Actúa estrictamente como asesor de ventas.]

Nuestros planes y precios reales oficiales:
- Plan USA Voyager PRO: $9.99/mes. Desbloquea todas las lecciones del Día 2 en adelante de la ruta de aprendizaje, escenarios avanzados de conversación y feedback avanzado de acento/pronunciación.
- Sesión Diagnóstica: $29.00 pago único. Videollamada de 30 minutos 1-a-1 en vivo con Alejandra Francois (La Profe) para evaluar nivel, acento y fluidez + reporte personalizado + soporte de chat directo por 7 días.
- Coaching de Inmersión: $199.00/mes. 4 clases al mes 1-a-1 en vivo con La Profe + acompañamiento de audios por chat privado diario + plan PRO gratis incluido.
- Coaching Intensivo: $349.00/mes. 8 clases al mes 1-a-1 en vivo con La Profe (2 clases semanales) + revisiones diarias prioritarias de audios + soporte directo 24/7 + plan PRO gratis incluido.

Pregunta del usuario: "${text}"]`;
 sendText(storePrompt);
 }}
 />
  </div>
  </div>
  )}
  </div>
  )}
  </div>
  {activePolicyModal && (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200">
  <div className="flex items-center justify-between border-b border-neutral-300 pb-4 mb-4 gap-2">
  <h3 style={{ fontFamily: '"Raleway", sans-serif' }} className="text-base sm:text-lg md:text-xl font-black text-black uppercase tracking-wider">
  {activePolicyModal === 'copyright' ? (selectedLang === 'EN' ? 'Copyright Information' : 'Derechos de Autor') : activePolicyModal === 'privacy' ? (selectedLang === 'EN' ? 'Privacy Policy' : 'Política de Privacidad') : activePolicyModal === 'contact' ? (selectedLang === 'EN' ? 'Contact Us' : 'Contacto') : (selectedLang === 'EN' ? 'Terms of Service' : 'Términos de Servicio')}
  </h3>
  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
  {/* Language Toggle EN / ES */}
  <div className="flex items-center bg-neutral-200/90 p-1 rounded-xl border border-black/10 shadow-inner">
  <button
  type="button"
  onClick={() => setSelectedLang('EN')}
  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedLang === 'EN' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-600 hover:text-black'}`}
  >
  EN
  </button>
  <button
  type="button"
  onClick={() => setSelectedLang('ES')}
  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedLang === 'ES' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-600 hover:text-black'}`}
  >
  ES
  </button>
  </div>
  <button 
  type="button"
  onClick={() => setActivePolicyModal(null)}
  className="text-neutral-500 hover:text-black transition-colors p-1.5 rounded-full hover:bg-neutral-200 cursor-pointer"
  title={selectedLang === 'EN' ? 'Close' : 'Cerrar'}
  >
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
  </button>
  </div>
  </div>
 
 {/* Modal Content */}
 <div className="overflow-y-auto pr-2 space-y-4 text-xs md:text-sm text-neutral-800 leading-relaxed font-sans select-text">
 {activePolicyModal === 'copyright' ? (
 <div className="flex flex-col items-center justify-center py-6 text-center">
 <span style={{ fontSize: '3em' }} className="font-bold text-amber-600 mb-4 block leading-none">©</span>
 <p className="font-semibold text-[#231d17] text-xs sm:text-sm md:text-base max-w-lg px-2 leading-relaxed">
  {selectedLang === 'EN' 
    ? 'YO SOY VOYAGER USA is a product and brand owned by ©2026 FLORIDA SUNMAN LLC. Any reproduction, distribution, modification, or reverse engineering of this software, in whole or in part, without prior written authorization is strictly prohibited.' 
    : 'YO SOY VOYAGER USA es un producto y una marca propiedad de ©2026 FLORIDA SUNMAN LLC. Se prohíbe la reproducción, distribución, modificación o ingeniería inversa de este software, total o parcialmente, sin autorización previa por escrito.'}
 </p>
 </div>
) : activePolicyModal === 'contact' ? (
  <div className="flex flex-col space-y-4 py-1">
  {contactSubmitted ? (
  <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-center space-y-2">
  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-lg font-bold">✓</div>
  <p className="font-bold text-sm">
  {selectedLang === 'EN' ? 'Message Sent!' : '¡Mensaje Enviado!'}
  </p>
  <p className="text-xs">
  {selectedLang === 'EN' 
  ? 'Thank you for contacting USA Voyager. Our team has received your message and will get back to you shortly.' 
  : 'Gracias por contactar a USA Voyager. Nuestro equipo ha recibido tu mensaje y te responderá a la brevedad.'}
  </p>
  <button
  onClick={() => {
  setContactSubmitted(false);
  setActivePolicyModal(null);
  }}
  className="mt-2 px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
  >
  {selectedLang === 'EN' ? 'Close' : 'Cerrar'}
  </button>
  </div>
  ) : (
  <form 
  onSubmit={(e) => {
  e.preventDefault();
  setContactSubmitted(true);
  }}
  className="space-y-4"
  >
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
  {selectedLang === 'EN' ? 'Name' : 'Nombre'}
  </label>
  <input 
  type="text"
  required
  value={userName}
  onChange={(e) => setUserName(e.target.value)}
  placeholder={selectedLang === 'EN' ? 'Your full name' : 'Tu nombre completo'}
  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold focus:border-red-600 focus:outline-none bg-white text-black"
  />
  </div>
  <div>
  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
  {selectedLang === 'EN' ? 'Email' : 'Correo'}
  </label>
  <input 
  type="email"
  required
  value={userEmail}
  onChange={(e) => setUserEmail(e.target.value)}
  placeholder={selectedLang === 'EN' ? 'Your email address' : 'Tu correo electrónico'}
  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold focus:border-red-600 focus:outline-none bg-white text-black"
  />
  </div>
  </div>
  <div>
  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
  {selectedLang === 'EN' ? 'Country' : 'País'}
  </label>
  <select
  value={userCountry}
  onChange={(e) => setUserCountry(e.target.value)}
  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold focus:border-red-600 focus:outline-none bg-white text-black cursor-pointer"
  >
  <option value="" disabled hidden>
  {selectedLang === 'EN' ? 'Select Country' : 'Selecciona País'}
  </option>
  {countries.map((c) => (
  <option key={c.id} value={selectedLang === 'EN' ? c.nameEn : c.nameEs}>
  {selectedLang === 'EN' ? c.nameEn : c.nameEs}
  </option>
  ))}
  </select>
  </div>
  <div>
  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
  {selectedLang === 'EN' ? 'Message' : 'Mensaje'}
  </label>
  <textarea
  rows={4}
  value={contactMessage}
  onChange={(e) => setContactMessage(e.target.value)}
  placeholder={selectedLang === 'EN' ? 'How can we help you on your Voyager journey?' : '¿Cómo podemos ayudarte en tu camino con Voyager?'}
  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-xs font-medium focus:border-red-600 focus:outline-none bg-white text-black resize-none"
  />
  </div>
  <div className="flex justify-end pt-2">
  <button
  type="submit"
  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
  >
  {selectedLang === 'EN' ? 'Send' : 'Enviar'}
  </button>
  </div>
  </form>
  )}
  </div>
) : activePolicyModal === 'privacy' ? (
  <>
  <p className="font-semibold text-neutral-900 leading-relaxed">
  {selectedLang === 'EN'
    ? 'This policy applies exclusively to data collected through the YO SOY VOYAGER USA application and does not govern any other data practices of FLORIDA SUNMAN LLC or its affiliated businesses.'
    : 'Esta política se aplica exclusivamente a los datos recopilados a través de la aplicación YO SOY VOYAGER USA y no rige ninguna otra práctica de datos de FLORIDA SUNMAN LLC o sus empresas afiliadas.'}
  </p>
  <p className="leading-relaxed">
  {selectedLang === 'EN'
    ? 'We collect your name, email address, profile preferences, and learning progress data solely to personalize your AI English tutoring experience with VOYAGER, manage learning roadmaps, track vocabulary growth, and log practice interactions for internal educational improvement. Your data is never sold or shared with third parties, is accessible only to authorized FLORIDA SUNMAN LLC team members, and is retained only as long as needed to support learning improvement and service accountability. You have the right to access, correct, or request deletion of your personal data at any time by contacting your designated FLORIDA SUNMAN LLC representative.'
    : 'Recopilamos su nombre, correo electrónico, preferencias de perfil de usuario y datos de progreso de aprendizaje únicamente para personalizar su experiencia de tutoría de inglés con IA con VOYAGER, gestionar mapas de ruta de aprendizaje, realizar un seguimiento del vocabulario y registrar interacciones de práctica para la mejora educativa interna. Sus datos nunca se venden ni se comparten con terceros, solo son accesibles para el personal autorizado de FLORIDA SUNMAN LLC y se conservan únicamente el tiempo necesario para respaldar la mejora del aprendizaje y la responsabilidad del servicio. Tiene derecho a acceder, corregir o solicitar la eliminación de sus datos personales en cualquier momento poniéndose en contacto con su representante designado de FLORIDA SUNMAN LLC.'}
  </p>
  </>
  ) : (
  <>
  <p className="font-semibold text-neutral-900 leading-relaxed">
  {selectedLang === 'EN'
    ? 'This policy applies exclusively to data and interactions through the YO SOY VOYAGER USA application and does not govern any other practices of FLORIDA SUNMAN LLC or its affiliated businesses.'
    : 'Esta política se aplica exclusivamente a los datos e interacciones a través de la aplicación YO SOY VOYAGER USA y no rige ninguna otra práctica de FLORIDA SUNMAN LLC o sus empresas afiliadas.'}
  </p>
  <p className="leading-relaxed">
  {selectedLang === 'EN'
    ? 'By accessing the YO SOY VOYAGER USA application, you agree to use the service solely for its intended purpose of learning and practicing American English — including optional AI-assisted audio/text tutoring and practice modules — and to provide accurate, truthful information at all times. FLORIDA SUNMAN LLC makes no guarantees, express or implied, regarding language fluency outcomes, exam scores, or third-party platform proficiency, and is not responsible for how individual practice performance is evaluated. FLORIDA SUNMAN LLC reserves the right to modify, suspend, or discontinue the application at any time without notice and, to the fullest extent permitted by law, shall not be liable for any indirect, incidental, or consequential damages arising from your use of or inability to use the service.'
    : 'Al acceder a la aplicación YO SOY VOYAGER USA, acepta utilizar el servicio únicamente para el propósito previsto de aprender y practicar inglés americano (incluidas las tutorías de audio/texto asistidas por IA opcionales y módulos de práctica) y proporcionar información precisa y verídica en todo momento. FLORIDA SUNMAN LLC no ofrece garantías, expresas o implícitas, con respecto a los resultados de fluidez del idioma, puntajes de exámenes o competencia en plataformas de terceros, y no es responsable de cómo se evalúa el rendimiento individual de la práctica. FLORIDA SUNMAN LLC se reserva el derecho de modificar, suspender o interrumpir la aplicación en cualquier momento sin previo aviso y, en la máxima medida permitida por la ley, no será responsable de ningún daño indirecto, incidental o consecuente que surja de su uso o incapacidad de usar el servicio.'}
  </p>
  </>
 )}
 </div>
 
 {/* Modal Footer */}
  {activePolicyModal !== 'contact' && (
  <div className="mt-6 flex justify-end border-t border-neutral-300 pt-4 flex-shrink-0">
 <button 
 onClick={() => setActivePolicyModal(null)}
 style={{ fontFamily: "'Raleway', sans-serif" }}
 className="px-5 py-2 bg-neutral-800 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-full transition-all cursor-pointer select-none"
 >
  {selectedLang === 'EN' ? 'Close' : 'Cerrar'}
 </button>
  </div>
  )}
 </div>
 </div>
 )}

  {/* Milestone Goal Reached Celebration Modal */}
  {showMilestoneToast && targetGoalMinutes && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0D224A] border-2 border-amber-400 text-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
        <div className="w-16 h-16 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-400/40">
          <Trophy className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-extrabold text-amber-300 mb-2">
          {selectedLang === 'EN' ? 'Milestone Achieved! 🎉' : '¡Hito Alcanzado! 🎉'}
        </h3>
        <p className="text-sm text-slate-200 mb-5 leading-relaxed">
          {selectedLang === 'EN'
            ? `Awesome job! You reached your ${targetGoalMinutes}-minute communication goal with USA Voyager!`
            : `¡Excelente trabajo! ¡Alcanzaste tu meta de ${targetGoalMinutes} minutos de conversación con USA Voyager!`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowMilestoneToast(false);
              setTargetGoalMinutes(targetGoalMinutes + 5);
              setHasAchievedMilestone(false);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-lg cursor-pointer"
          >
            {selectedLang === 'EN' ? '+5 Min Goal' : '+5 Min Meta'}
          </button>
          <button
            onClick={() => setShowMilestoneToast(false)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-colors border border-white/20 cursor-pointer"
          >
            {selectedLang === 'EN' ? 'Keep Going' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Require Profile Modal for Unregistered Users */}
  {showRequireProfileModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0D224A] border-2 border-amber-400 text-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
        <button
          onClick={() => setShowRequireProfileModal(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-400/40">
          <Bookmark className="w-7 h-7 text-amber-400" />
        </div>
        <h3 className="text-lg font-bold text-amber-300 mb-2">
          {selectedLang === 'EN' ? 'Profile Completion Required' : 'Perfil Completo Requerido'}
        </h3>
        <p className="text-xs text-slate-200 mb-5 leading-relaxed">
          {selectedLang === 'EN'
            ? 'Saving chats and conversation bookmarks to your Profile is exclusively available to registered learners with a completed profile.'
            : 'Guardar conversaciones y marcadores en tu Perfil es una función exclusiva para estudiantes registrados con perfil completo.'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowRequireProfileModal(false);
              setRightPanelTab('settings');
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>{selectedLang === 'EN' ? 'Complete Profile' : 'Completar Perfil'}</span>
          </button>
          <button
            onClick={() => setShowRequireProfileModal(false)}
            className="py-2.5 px-3 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-colors border border-white/20 cursor-pointer"
          >
            {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Bookmark Saved Success Toast */}
  {showBookmarkToast && (
    <div className="fixed top-16 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0D224A] border-2 border-amber-400 text-white shadow-2xl animate-fade-in">
      <BookmarkCheck className="w-5 h-5 text-amber-400 animate-bounce" />
      <div className="text-xs">
        <span className="font-bold text-amber-300 block">
          {selectedLang === 'EN' ? 'Chat Saved to Profile! 🔖' : '¡Conversación Guardada en Perfil! 🔖'}
        </span>
        <span className="text-slate-300 text-[11px]">
          {selectedLang === 'EN' ? 'View saved chats in your PERFIL tab.' : 'Consulta tus chats en la pestaña PERFIL.'}
        </span>
      </div>
    </div>
  )}

 {/* Email / Google / Guest Auth Modal */}
  <AuthModal 
    isOpen={!!authModalMode}
    onClose={() => setAuthModalMode(null)}
    selectedLang={selectedLang}
    onEmailAuthSubmit={(_e, isRegister, nameVal, emailVal, passVal) => {
      if (!emailVal) return;
      const finalName = nameVal.trim() || userName || (selectedLang === 'EN' ? 'Guest' : 'Invitado');
      setUserName(finalName);
      setUserEmail(emailVal);
      try {
        localStorage.setItem('voyager_user_account', JSON.stringify({
          name: finalName,
          email: emailVal,
          password: passVal,
          provider: 'email',
          isRegister,
          loginTime: new Date().toISOString()
        }));
      } catch (e) {}
      setAuthModalMode(null);
      const msg = isRegister
        ? (selectedLang === 'EN' ? `Account created! Welcome, ${finalName}!` : `¡Cuenta creada! Bienvenido, ${finalName}!`)
        : (selectedLang === 'EN' ? `Welcome back, ${finalName}!` : `¡Bienvenido de nuevo, ${finalName}!`);
      setAuthNotification(msg);
      setTimeout(() => {
        setAuthNotification(null);
      }, 4000);
      if (typeof executeConnectFlow === 'function') {
        executeConnectFlow();
      }
    }}
    onGoogleLogin={handleGoogleLogin}
    onGuestLogin={handleGuestLogin}
  />

  {/* Full Screen Live Section Overlay (CHARLA section) */}
  {isLiveFullScreen && (
    <div className="fixed inset-0 z-[100] bg-[#07132B] flex flex-col justify-between items-center text-center p-4 sm:p-6 select-none overflow-hidden animate-fade-in text-white">
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between z-20 pt-1 px-2">
        {/* Top-Left Plus (+) Icon Button */}
        <button
          type="button"
          onClick={() => {
            setIsNavMenuOpen(prev => !prev);
          }}
          className="p-2 text-[#EAB308] hover:text-white transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
          title={selectedLang === 'EN' ? 'Options' : 'Opciones'}
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-[#EAB308]" />
        </button>

        {/* Top-Center Title */}
        <div className="flex flex-col items-center justify-center text-center select-none">
          <span style={{ fontFamily: '"Allerta Stencil", sans-serif', letterSpacing: '0.2em' }} className="text-[10px] sm:text-xs font-bold text-white/80 uppercase">
            YO SOY USA
          </span>
          <h1 style={{ fontFamily: '"Allerta Stencil", sans-serif' }} className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider leading-none mt-0.5">
            VOYAGER<span className="text-[0.4em] font-light align-baseline ml-0.5">®</span>
          </h1>
        </div>

        {/* Right spacing balance */}
        <div className="w-8 sm:w-10" />
      </div>

      {/* Center Area: Golden Particle Sphere & Mode Badge */}
      <div className="relative flex-1 w-full max-w-2xl flex flex-col items-center justify-center my-auto z-20">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-[360px] md:h-[360px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#EAB308]/15 blur-3xl pointer-events-none" />
          <canvas
            ref={fullScreenParticleCanvasRef}
            width={800}
            height={800}
            className="z-20 transition-transform duration-75 animate-float-zero-g w-full h-full object-contain"
            style={{
              WebkitMaskImage: 'radial-gradient(circle at center, black 80%, transparent 99%)',
              maskImage: 'radial-gradient(circle at center, black 80%, transparent 99%)'
            }}
          />
        </div>

        {/* Mode Selector Badge below Sphere */}
        <div className="relative flex flex-col items-center mt-2 z-30">
          <button
            type="button"
            onClick={() => setIsModeMenuOpen(prev => !prev)}
            className="flex flex-col items-center group cursor-pointer outline-none select-none"
            title={selectedLang === 'EN' ? 'Mode of Interaction' : 'Modo de Interactuar'}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black border-2 border-[#EAB308] flex items-center justify-center shadow-[0_4px_15px_rgba(234,179,8,0.35)] group-hover:scale-105 transition-transform">
              {currentModeObj.id === 'SPANISH' && <span className="font-bold text-sm sm:text-base text-[#EAB308]">ES</span>}
              {currentModeObj.id === 'BILINGUAL' && <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAB308]" />}
              {currentModeObj.id === 'ADAPTIVE' && <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAB308]" />}
              {currentModeObj.id === 'AMERICAN_ENGLISH' && <span className="font-bold text-sm sm:text-base text-[#EAB308]">EN</span>}
              {currentModeObj.id === 'LIVE_TRANSLATOR' && <Languages className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAB308]" />}
              {currentModeObj.id !== 'SPANISH' && currentModeObj.id !== 'BILINGUAL' && currentModeObj.id !== 'ADAPTIVE' && currentModeObj.id !== 'AMERICAN_ENGLISH' && currentModeObj.id !== 'LIVE_TRANSLATOR' && <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-[#EAB308]" />}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[#EAB308] group-hover:text-white transition-colors">
              <span className="text-xs sm:text-sm font-semibold tracking-tight">
                {selectedLang === 'EN' ? currentModeObj.nameEn : currentModeObj.nameEs}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#EAB308]" />
            </div>
          </button>

          {/* Mode Selector Dropdown Popup */}
          {isModeMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setIsModeMenuOpen(false)}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-64 bg-[#08152E]/95 backdrop-blur-md border border-[#EAB308]/80 rounded-2xl p-2.5 shadow-2xl flex flex-col text-white text-left animate-fade-in">
                <div className="px-2 py-1 mb-1.5 flex items-center justify-between border-b border-white/10">
                  <span className="text-sm font-semibold text-white">
                    {selectedLang === 'EN' ? 'Mode of Interaction' : 'Modo de Interactuar'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsModeMenuOpen(false)}
                    className="text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-0.5 custom-scrollbar">
                  {modeDetails.map((mode) => {
                    const name = mode.nameEs;
                    const desc = mode.descEs;
                    const isSelected = currentModeObj.id === mode.id;

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          if (isPaused) {
                            resume(true);
                          }
                          handleModeSelection(mode.id as ConversationMode);
                          applyChosenMode(mode.id as ConversationMode);
                          if (isConnected) {
                            sendText(`[INSTRUCCIÓN DE SISTEMA: El usuario ha seleccionado el modo de conversación: "${name}". Cambia tu estilo e idioma inmediatamente a este modo: "${desc}"]`);
                          }
                          setIsModeMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-2 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer group bg-transparent ${
                          isSelected ? 'text-[#EAB308] font-bold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className={`text-sm leading-tight whitespace-nowrap ${isSelected ? 'font-bold text-[#EAB308]' : 'font-normal text-gray-400 group-hover:text-white'}`}>
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="w-full max-w-lg flex items-center justify-center gap-3 z-20 pb-4 px-4">
        {/* Input pill */}
        <div className="flex-1 border border-[#EAB308]/80 bg-black/60 rounded-full px-4 py-2 sm:py-2.5 flex items-center gap-2.5 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleSendFullScreenText}
            className="text-[#EAB308] hover:text-white transition-colors cursor-pointer shrink-0"
            title={selectedLang === 'EN' ? 'Send' : 'Enviar'}
          >
            <SendHorizontal className="w-4 h-4 text-[#EAB308]" />
          </button>
          <input
            type="text"
            value={fullScreenInput}
            onChange={(e) => setFullScreenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendFullScreenText();
            }}
            placeholder={selectedLang === 'EN' ? 'Type a message...' : 'Escribe un mensaje...'}
            className="bg-transparent text-white text-xs sm:text-sm outline-none w-full placeholder-white/50"
          />
        </div>

        {/* Mic Button */}
        <button
          type="button"
          onClick={() => {
            setIsLiveVoiceActive(!isLiveVoiceActive);
          }}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95 shrink-0 ${
            isLiveVoiceActive
              ? 'border-[#EAB308] bg-black/70 text-[#EAB308] hover:bg-[#EAB308]/20'
              : 'border-red-500 bg-red-950/80 text-red-400 hover:bg-red-900/80'
          }`}
          title={isLiveVoiceActive ? 'Micrófono Activo' : 'Micrófono Silenciado'}
        >
          {isLiveVoiceActive ? <Mic className="w-5 h-5 text-[#EAB308]" /> : <MicOff className="w-5 h-5 text-red-400" />}
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsLiveFullScreen(false)}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#EAB308] bg-black/70 flex items-center justify-center text-[#EAB308] hover:bg-[#EAB308]/20 transition-all cursor-pointer shadow-xl active:scale-95 shrink-0"
          title={selectedLang === 'EN' ? 'Close Live Section' : 'Cerrar Sección Live'}
        >
          <X className="w-5 h-5 text-[#EAB308]" />
        </button>
      </div>
    </div>
  )}
  </div>
  </div>
  );
};

export default LiveAgent;
