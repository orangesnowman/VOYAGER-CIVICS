import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, ArrowRight, X, Volume2, BookOpen, CheckCircle2, Clock, Trash2, Share2, ExternalLink, Copy, Check, FileText, Loader2 } from 'lucide-react';
import { createGoogleDoc } from '../services/googleDocsService';

export interface UserProfile {
  name?: string;
  firstName?: string;
  lastName?: string;
  englishLevel?: string;
  learningGoal?: string;
  interests?: string;
  completedDays?: number[];
  [key: string]: any;
}

export interface ActiveLesson {
  id: string;
  lessonId: string;
  title: string;
  subtitle: string;
  category: string;
  imageUrl: string;
  level: string;
  estimatedMinutes: number;
  objective: string;
  scenario: string;
  status: 'in_progress' | 'completed';
  startedAt: string;
  completedAt?: string;
}

interface RecommendedProLessonsCarouselProps {
  user: UserProfile;
  scores?: {
    pronunciation?: number;
    fluency?: number;
    vocabulary?: number;
    confidence?: number;
  };
  pronunciationScore?: number;
  civicsScore?: number;
  selectedLang: string;
  onAskVoyager?: (text: string) => void;
}

export interface ProLesson {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  imageUrl: string; // Square scenario image
  skillImproved: string;
  objective: string; // Pedagogical objective
  whatItIs: string;
  perfectMatchReason: string;
  keyOutcomes: string[];
  level: string;
  estimatedMinutes: number;
}

export const RecommendedProLessonsCarousel: React.FC<RecommendedProLessonsCarouselProps> = ({
  user,
  scores,
  pronunciationScore,
  civicsScore,
  selectedLang,
  onAskVoyager,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<ProLesson | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Custom scenario selection state
  const [selectedScenarioOption, setSelectedScenarioOption] = useState<string>('default');
  const [customScenarioText, setCustomScenarioText] = useState<string>('');

  // Active / Saved Lessons State ("Mis Lecciones")
  const [myLessons, setMyLessons] = useState<ActiveLesson[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('voyager_active_lessons');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const saveMyLessonsToStorage = (updatedList: ActiveLesson[]) => {
    setMyLessons(updatedList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('voyager_active_lessons', JSON.stringify(updatedList));
        window.dispatchEvent(new Event('voyager_active_lessons_updated'));
      } catch (e) {}
    }
  };

  useEffect(() => {
    const syncActiveLessons = () => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('voyager_active_lessons');
          if (saved) setMyLessons(JSON.parse(saved));
        } catch (e) {}
      }
    };
    window.addEventListener('voyager_active_lessons_updated', syncActiveLessons);
    window.addEventListener('storage', syncActiveLessons);
    return () => {
      window.removeEventListener('voyager_active_lessons_updated', syncActiveLessons);
      window.removeEventListener('storage', syncActiveLessons);
    };
  }, []);

  const [copiedNotebookSource, setCopiedNotebookSource] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);

  const generateNotebookLMText = (lesson: ProLesson, scenarioText: string) => {
    const studentName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Estudiante Voyager');
    const level = lesson.level || user?.englishLevel || 'Intermedio';
    return `# 📓 USA Voyager Lesson Plan: ${lesson.title}

## 👤 Learner Profile
- **Student**: ${studentName}
- **English Level**: ${level}
- **Category**: ${lesson.category}
- **Scenario Context**: ${scenarioText}
- **Target Skill**: ${lesson.skillImproved}
- **Estimated Duration**: ${lesson.estimatedMinutes} minutes

## 🎯 Pedagogical Objective
${lesson.objective}

## 💡 Why Recommended by Voyager AI
${lesson.perfectMatchReason}

## 🗣️ Audio & Speech Practice Guidelines
1. **Scenario Setup**: Practice real-world spoken interactions in the "${scenarioText}" context.
2. **Focus**: Eliminate hesitation gaps, master natural transition connectors, and improve vocal confidence.
3. **Voice Tutor**: USA Voyager AI Voice Coach.

## 📝 Google NotebookLM Study Instructions
- Import this source into your Google NotebookLM notebook (https://notebooklm.google.com).
- Use NotebookLM to create Audio Overviews, generate practice quizzes, summarize key vocabulary, and create flashcards tailored to this lesson plan!
`;
  };

  const handleCopyNotebookLM = (lesson: ProLesson, scenarioText: string) => {
    const content = generateNotebookLMText(lesson, scenarioText);
    navigator.clipboard.writeText(content);
    setCopiedNotebookSource(true);
    setToastMessage(selectedLang === 'EN' ? 'Copied Lesson Plan for Google NotebookLM!' : '¡Plan de Lección copiado para Google NotebookLM!');
    setTimeout(() => setCopiedNotebookSource(false), 3000);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [isExportingGoogleDoc, setIsExportingGoogleDoc] = useState(false);

  const handleExportGoogleDoc = async (lesson: ProLesson, scenarioText: string) => {
    try {
      setIsExportingGoogleDoc(true);
      const content = generateNotebookLMText(lesson, scenarioText);
      const docTitle = `USA Voyager - ${lesson.title}`;
      const result = await createGoogleDoc(docTitle, content);
      setToastMessage(selectedLang === 'EN' ? 'Google Doc created in your Drive!' : '¡Documento de Google creado en tu Google Drive!');
      window.open(result.documentUrl, '_blank');
    } catch (err: any) {
      console.error('Google Doc creation error:', err);
      setToastMessage(err?.message || 'Failed to create Google Doc');
    } finally {
      setIsExportingGoogleDoc(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Clean speech synthesis cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Helper to extract clean percentages
  const getPct = (val?: number, fallback: number = 80) => {
    if (val === undefined || val === null || val <= 0) return fallback;
    if (val <= 5) return Math.min(100, Math.round(val * 20));
    return Math.min(100, Math.round(val));
  };

  const pronunciation = getPct(scores?.pronunciation || pronunciationScore, 82);
  const fluency = getPct(scores?.fluency, 74);
  const vocabulary = getPct(scores?.vocabulary, 88);
  const confidence = getPct(scores?.confidence, 68);
  const civics = getPct(civicsScore, 11);
  const level = user?.englishLevel || 'B2';
  const goal = user?.learningGoal || (selectedLang === 'EN' ? 'Travel & Daily Conversation' : 'Viajes y Conversación Diaria');
  const interests = user?.interests || (selectedLang === 'EN' ? 'Travel, technology, music' : 'Viajes, tecnología, música');

  // Build personalized lessons with square scenario images, flat colors, NO gradients
  const lessons: ProLesson[] = [
    {
      id: 'pro-fluency-1',
      title: selectedLang === 'EN' 
        ? 'Native Connector Mastery & Speech Rhythm' 
        : 'Dominio de Conectores Nativos y Ritmo de Habla',
      subtitle: selectedLang === 'EN'
        ? 'Learn to link sentences effortlessly and eliminate hesitation gaps.'
        : 'Aprende a enlazar oraciones naturalmente y eliminar muletillas al hablar.',
      category: selectedLang === 'EN' ? 'Speech Flow' : 'Fluidez Verbal',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80',
      skillImproved: selectedLang === 'EN' ? 'Fluency (+12%)' : 'Fluidez (+12%)',
      objective: selectedLang === 'EN'
        ? 'Master native transition connectors to bridge ideas seamlessly without pauses.'
        : 'Dominar conectores de transición para enlazar ideas con fluidez y sin pausas.',
      whatItIs: selectedLang === 'EN'
        ? 'An intensive AI speech-flow workshop.'
        : 'Un taller intensivo de habla para conectar ideas.',
      perfectMatchReason: selectedLang === 'EN'
        ? `Your current Fluency is ${fluency}%. Voyager detected brief hesitation pauses during multi-clause sentences.`
        : `Tu fluidez actual es del ${fluency}%. Voyager detectó pausas breves al formar oraciones compuestas.`,
      keyOutcomes: [],
      level: level,
      estimatedMinutes: 15,
    },
    {
      id: 'pro-confidence-2',
      title: selectedLang === 'EN'
        ? 'Spontaneous Impromptu & Assertiveness Workshop'
        : 'Técnicas de Improvisación y Conversación Espontánea',
      subtitle: selectedLang === 'EN'
        ? 'Overcome fear of mistakes and speak assertively with native speakers.'
        : 'Supera el temor al error y habla con seguridad ante hablantes nativos.',
      category: selectedLang === 'EN' ? 'Confidence' : 'Confianza',
      imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
      skillImproved: selectedLang === 'EN' ? 'Confidence (+15%)' : 'Confianza (+15%)',
      objective: selectedLang === 'EN'
        ? 'Develop rapid response drills and vocal projection to speak assertively.'
        : 'Desarrollar reflejos de respuesta rápida y proyección vocal para hablar con seguridad.',
      whatItIs: selectedLang === 'EN'
        ? 'Spontaneous response drills for confidence.'
        : 'Ejercicios de respuesta rápida para ganar seguridad.',
      perfectMatchReason: selectedLang === 'EN'
        ? `Your Confidence score is at ${confidence}%, making it your highest growth area.`
        : `Tu nivel de Confianza está en ${confidence}%, siendo tu mayor oportunidad de avance.`,
      keyOutcomes: [],
      level: level,
      estimatedMinutes: 20,
    },
    {
      id: 'pro-pronunciation-3',
      title: selectedLang === 'EN'
        ? 'Difficult Phonemes: /th/, /v/ & Short Vowels'
        : 'Taller de Sonidos /th/, /v/ y Vocales Cortas',
      subtitle: selectedLang === 'EN'
        ? 'Fine-tune mouth muscle placement for clear, accent-free speech.'
        : 'Ajusta la colocación muscular de la boca para lograr un acento claro.',
      category: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80',
      skillImproved: selectedLang === 'EN' ? 'Pronunciation (+8%)' : 'Pronunciación (+8%)',
      objective: selectedLang === 'EN'
        ? 'Train physical tongue positioning for /th/ phonemes and schwa vowel reduction.'
        : 'Entrenar la colocación de la lengua en el sonido /th/ y la reducción vocálica schwa.',
      whatItIs: selectedLang === 'EN'
        ? 'Phonetics masterclass for tricky sounds.'
        : 'Clase de fonética para sonidos difíciles.',
      perfectMatchReason: selectedLang === 'EN'
        ? `With ${pronunciation}% Pronunciation, audio analysis identified micro-slips on 'th' sounds.`
        : `Con ${pronunciation}% en Pronunciación, se detectaron deslices en el sonido 'th'.`,
      keyOutcomes: [],
      level: level,
      estimatedMinutes: 12,
    },
    {
      id: 'pro-civics-4',
      title: selectedLang === 'EN'
        ? 'US Citizenship N-400 Oral Interview Simulator'
        : 'Simulador Oral N-400: Rama Ejecutiva y Gobierno',
      subtitle: selectedLang === 'EN'
        ? 'Simulate real oral questions and official answers for naturalization.'
        : 'Ensayos reales de preguntas y respuestas oficiales para el examen de naturalización.',
      category: selectedLang === 'EN' ? 'Civics' : 'Educación Cívica',
      imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
      skillImproved: selectedLang === 'EN' ? 'Civics (+20%)' : 'Educación Cívica (+20%)',
      objective: selectedLang === 'EN'
        ? 'Practice official USCIS civics questions and N-400 application vocabulary.'
        : 'Practicar preguntas oficiales de USCIS y vocabulario de la solicitud N-400.',
      whatItIs: selectedLang === 'EN'
        ? 'Realistic oral citizenship interview.'
        : 'Simulacro oral de la entrevista de ciudadanía.',
      perfectMatchReason: selectedLang === 'EN'
        ? `You have mastered ${civics}% of civics questions so far.`
        : `Has dominado el ${civics}% de las preguntas cívicas.`,
      keyOutcomes: [],
      level: level,
      estimatedMinutes: 25,
    },
    {
      id: 'pro-travel-5',
      title: selectedLang === 'EN'
        ? 'Advanced Airport, Customs & Rebooking Crisis'
        : 'Negociación en Aeropuertos, Aduanas y Vuelos',
      subtitle: selectedLang === 'EN'
        ? 'Handle unexpected travel incidents with precise English phrases.'
        : 'Afronta imprevistos en viajes internacionales con vocabulario preciso.',
      category: selectedLang === 'EN' ? 'Travel' : 'Viajes',
      imageUrl: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=600&q=80',
      skillImproved: selectedLang === 'EN' ? 'Travel (+10%)' : 'Viajes (+10%)',
      objective: selectedLang === 'EN'
        ? 'Apply polite negotiation techniques to resolve airport and travel incidents.'
        : 'Aplicar técnicas de negociación educada para resolver imprevistos de viaje.',
      whatItIs: selectedLang === 'EN'
        ? 'Travel scenarios and flight incident handling.'
        : 'Escenarios de viajes e imprevistos de vuelos.',
      perfectMatchReason: selectedLang === 'EN'
        ? `Your primary goal explicitly includes '${goal}'.`
        : `Tu meta principal incluye '${goal}'.`,
      keyOutcomes: [],
      level: level,
      estimatedMinutes: 18,
    },
    {
      id: 'pro-tech-6',
      title: selectedLang === 'EN'
        ? 'AI & Tech Debate: Silicon Valley Phrasal Verbs'
        : 'Debates Tecnológicos, IA y Jerga de Silicio',
      subtitle: selectedLang === 'EN'
        ? 'Express sophisticated opinions on innovation and tech topics.'
        : 'Expresa opiniones sofisticadas sobre tecnología, ciencia e innovación.',
      category: selectedLang === 'EN' ? 'Technology' : 'Tecnología',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      skillImproved: selectedLang === 'EN' ? 'Tech (+12%)' : 'Tecnología (+12%)',
      objective: selectedLang === 'EN'
        ? 'Incorporate technical phrasal verbs to structure arguments in tech discussions.'
        : 'Incorporar verbos compuestos técnicos para estructurar argumentos en debates.',
      whatItIs: selectedLang === 'EN'
        ? 'Debate module on technology and AI.'
        : 'Debates sobre tecnología e innovación.',
      perfectMatchReason: selectedLang === 'EN'
        ? `Tailored to your interest in '${interests}'.`
        : `Diseñado para tu interés en '${interests}'.`,
      keyOutcomes: [],
      level: level,
      estimatedMinutes: 20,
    },
    {
      id: 'pro-music-7',
      title: selectedLang === 'EN'
        ? 'Pop Culture Idioms & Everyday Metaphors'
        : 'Modismos Americanos en la Cultura Pop y Música',
      subtitle: selectedLang === 'EN'
        ? 'Decode double meanings, slang, and cultural references in media.'
        : 'Comprende metáforas, doble sentido e indirectas de la cultura estadounidense.',
      category: selectedLang === 'EN' ? 'Culture' : 'Cultura y Música',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      skillImproved: selectedLang === 'EN' ? 'Culture (+10%)' : 'Cultura (+10%)',
      objective: selectedLang === 'EN'
        ? 'Understand widespread American idioms and humor nuances.'
        : 'Comprender modismos americanos frecuentes y sutilezas de humor.',
      whatItIs: selectedLang === 'EN'
        ? 'Immersion into media idioms and metaphors.'
        : 'Inmersión en modismos de medios y metáforas.',
      perfectMatchReason: selectedLang === 'EN'
        ? `Matches your interest in '${interests}' with ${vocabulary}% vocabulary.`
        : `Coincide con tu interés en '${interests}' y tu ${vocabulary}% de vocabulario.`,
      keyOutcomes: [],
      level: level,
      estimatedMinutes: 15,
    },
    {
      id: 'pro-daily-8',
      title: selectedLang === 'EN'
        ? 'Complex Medical, Pharmacy & Banking Encounter'
        : 'Consultas Médicas, Farmacia y Trámites Bancarios',
      subtitle: selectedLang === 'EN'
        ? 'Communicate symptoms and financial inquiries with pinpoint accuracy.'
        : 'Comunica síntomas de salud y gestiona cuentas con total precisión.',
      category: selectedLang === 'EN' ? 'Daily Life' : 'Vida Diaria',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
      skillImproved: selectedLang === 'EN' ? 'Daily Life (+14%)' : 'Vida Diaria (+14%)',
      objective: selectedLang === 'EN'
        ? 'Describe symptoms accurately to doctors and handle banking/pharmacy transactions.'
        : 'Describir síntomas con precisión al médico y realizar gestiones bancarias.',
      whatItIs: selectedLang === 'EN'
        ? 'Practical safety module for healthcare and banking.'
        : 'Módulo práctico para consultas médicas y trámites.',
      perfectMatchReason: selectedLang === 'EN'
        ? `Advanced ${level} module for daily life accuracy.`
        : `Módulo avanzado nivel ${level} para precisión cotidiana.`,
      keyOutcomes: [],
      level: level,
      estimatedMinutes: 22,
    },
  ];

  // Dynamic suggested scenario list
  const scenarioOptions = [
    { id: 'default', label: selectedLang === 'EN' ? 'Default Recommended Scenario' : 'Escenario Predeterminado' },
    { id: 'airport', label: selectedLang === 'EN' ? '✈️ Airport & Immigration' : '✈️ Aeropuerto y Aduanas' },
    { id: 'job_interview', label: selectedLang === 'EN' ? '💼 Job Interview' : '💼 Entrevista de Trabajo' },
    { id: 'medical', label: selectedLang === 'EN' ? '🩺 Medical Consultation' : '🩺 Consulta Médica' },
    { id: 'restaurant', label: selectedLang === 'EN' ? '🍽️ Restaurant & Dining' : '🍽️ Restaurante' },
    { id: 'tech', label: selectedLang === 'EN' ? '🤖 Tech AI Debate' : '🤖 Debate de Tecnología e IA' },
    { id: 'civics_n400', label: selectedLang === 'EN' ? '🏛️ Citizenship N-400' : '🏛️ Examen N-400 Ciudadanía' },
    { id: 'banking', label: selectedLang === 'EN' ? '🏦 Banking Transactions' : '🏦 Trámites Bancarios' },
    { id: 'custom_free', label: selectedLang === 'EN' ? '✍️ Other... (Custom Situation)' : '✍️ Otro... (Escribir situación libre)' },
  ];

  const getActiveScenarioText = (lesson: ProLesson) => {
    if (selectedScenarioOption === 'default') return lesson.category;
    if (selectedScenarioOption === 'custom_free') return customScenarioText.trim() || (selectedLang === 'EN' ? 'Custom Situation' : 'Situación Libre');
    const found = scenarioOptions.find(o => o.id === selectedScenarioOption);
    return found ? found.label : lesson.category;
  };

  // Voyager Single Voice Presentation - Uses the primary Voyager conversation stream
  const speakLessonPresentation = (lesson: ProLesson, scenarioText: string) => {
    setIsSpeaking(true);
    setIsPaused(false);

    if (typeof onAskVoyager === 'function') {
      const prompt = selectedLang === 'EN'
        ? `[VOYAGER VOICE INSTRUCTION: Speak aloud in your voice to the student. Present this lesson: "${lesson.title}". Objective: "${lesson.objective}". Why recommended for this student: "${lesson.perfectMatchReason}". Current scenario: "${scenarioText}". Remind the student they can change the scenario in the selector, and end with "When you're ready, let's begin!"]`
        : `[INSTRUCCIÓN DE VOZ VOYAGER: Habla en tu voz al estudiante. Presenta la lección: "${lesson.title}". Objetivo pedagógico: "${lesson.objective}". Por qué se recomienda según los datos reales del estudiante: "${lesson.perfectMatchReason}". Escenario actual: "${scenarioText}". Recuerda al estudiante que puede cambiar el escenario en el selector, y finaliza diciendo "Cuando estés listo, comenzamos."]`;
      onAskVoyager(prompt);
    }
  };

  const handleSelectLesson = (lesson: ProLesson) => {
    setSelectedLesson(lesson);
    setSelectedScenarioOption('default');
    setCustomScenarioText('');
    speakLessonPresentation(lesson, lesson.category);
  };

  const handleScenarioChange = (newOption: string) => {
    setSelectedScenarioOption(newOption);
    if (!selectedLesson) return;

    let scenarioText = selectedLesson.category;
    if (newOption === 'custom_free') {
      scenarioText = customScenarioText.trim() || (selectedLang === 'EN' ? 'Custom Situation' : 'Situación Libre');
    } else if (newOption !== 'default') {
      const found = scenarioOptions.find(o => o.id === newOption);
      if (found) scenarioText = found.label;
    }

    if (typeof onAskVoyager === 'function') {
      const adjustmentScript = selectedLang === 'EN'
        ? `[VOYAGER VOICE INSTRUCTION: Speak aloud in your voice. The student updated the scenario to "${scenarioText}" for lesson "${selectedLesson.title}". Acknowledge this scenario change while keeping the pedagogical objective: "${selectedLesson.objective}". Say "When you're ready, let's begin!"]`
        : `[INSTRUCCIÓN DE VOZ VOYAGER: Habla en tu voz al estudiante. El estudiante adaptó el escenario a "${scenarioText}" para la lección "${selectedLesson.title}". Confirma el cambio manteniendo el objetivo pedagógico: "${selectedLesson.objective}". Dile "Cuando estés listo, comenzamos."]`;
      onAskVoyager(adjustmentScript);
    }
  };

  const handleCustomTextChange = (text: string) => {
    setCustomScenarioText(text);
  };

  const handleCloseModal = () => {
    setIsSpeaking(false);
    setIsPaused(false);
    setSelectedLesson(null);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleStartLesson = () => {
    if (!selectedLesson) return;

    const scenarioLabel = getActiveScenarioText(selectedLesson);
    const now = new Date();
    const nowIso = now.toISOString();

    const newActiveLesson: ActiveLesson = {
      id: `active-${selectedLesson.id}-${Date.now()}`,
      lessonId: selectedLesson.id,
      title: selectedLesson.title,
      subtitle: selectedLesson.subtitle,
      category: selectedLesson.category,
      imageUrl: selectedLesson.imageUrl,
      level: selectedLesson.level,
      estimatedMinutes: selectedLesson.estimatedMinutes,
      objective: selectedLesson.objective,
      scenario: scenarioLabel,
      status: 'in_progress',
      startedAt: nowIso,
    };

    // Prepend new active lesson
    const filtered = myLessons.filter(l => l.lessonId !== selectedLesson.id);
    const updatedList = [newActiveLesson, ...filtered];
    saveMyLessonsToStorage(updatedList);

    // Speak via single Voyager voice conversation
    if (typeof onAskVoyager === 'function') {
      const startPrompt = selectedLang === 'EN'
        ? `[VOYAGER VOICE INSTRUCTION: Speak aloud in your voice to launch lesson "${selectedLesson.title}" in scenario "${scenarioLabel}". Welcome the student warmly and begin the first interactive oral exercise.]`
        : `[INSTRUCCIÓN DE VOZ VOYAGER: Habla en tu voz al estudiante para iniciar la lección "${selectedLesson.title}" en el escenario "${scenarioLabel}". Dales la bienvenida e inicia el primer ejercicio oral interactivo.]`;
      onAskVoyager(startPrompt);
    }

    // Save chat session for today's calendar activity log
    if (typeof window !== 'undefined') {
      try {
        const savedChatsRaw = localStorage.getItem('voyager_saved_chats');
        const chats = savedChatsRaw ? JSON.parse(savedChatsRaw) : [];
        const newChatSession = {
          id: `lesson-chat-${selectedLesson.id}-${Date.now()}`,
          title: `[Lección] ${selectedLesson.title}`,
          date: nowIso,
          durationSeconds: selectedLesson.estimatedMinutes * 60,
          messageCount: 1,
          snippet: `Escenario: ${scenarioLabel} • Objetivo: ${selectedLesson.objective}`,
          messages: [
            { sender: 'Voyager', text: `¡Bienvenido a la lección '${selectedLesson.title}' en el escenario '${scenarioLabel}'!`, timestamp: nowIso }
          ]
        };
        chats.unshift(newChatSession);
        localStorage.setItem('voyager_saved_chats', JSON.stringify(chats));
        window.dispatchEvent(new Event('voyager_chat_saved'));
      } catch (e) {}

      // Register activity in completedDays
      try {
        const savedAcc = localStorage.getItem('voyager_user_account');
        if (savedAcc) {
          const parsed = JSON.parse(savedAcc);
          const todayDayNum = now.getDate();
          const currentDays: number[] = Array.isArray(parsed.completedDays) ? parsed.completedDays : [1];
          if (!currentDays.includes(todayDayNum)) {
            parsed.completedDays = [...currentDays, todayDayNum];
            localStorage.setItem('voyager_user_account', JSON.stringify(parsed));
            window.dispatchEvent(new Event('voyager_profile_updated'));
          }
        }
      } catch (e) {}
    }

    const msg = selectedLang === 'EN'
      ? `Lesson '${selectedLesson.title}' is now ACTIVE and saved in My Lessons and today's calendar!`
      : `¡Lección '${selectedLesson.title}' activada en Mis lecciones y guardada en el calendario de hoy!`;

    setToastMessage(msg);
    setSelectedLesson(null);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleCompleteLesson = (lessonIdToComplete: string) => {
    const now = new Date();
    const updated = myLessons.map(item => {
      if (item.id === lessonIdToComplete || item.lessonId === lessonIdToComplete) {
        return {
          ...item,
          status: 'completed' as const,
          completedAt: now.toISOString(),
        };
      }
      return item;
    });
    saveMyLessonsToStorage(updated);

    // Update profile completedDays
    if (typeof window !== 'undefined') {
      try {
        const savedAcc = localStorage.getItem('voyager_user_account');
        if (savedAcc) {
          const parsed = JSON.parse(savedAcc);
          const todayDayNum = now.getDate();
          const currentDays: number[] = Array.isArray(parsed.completedDays) ? parsed.completedDays : [1];
          if (!currentDays.includes(todayDayNum)) {
            parsed.completedDays = [...currentDays, todayDayNum];
            localStorage.setItem('voyager_user_account', JSON.stringify(parsed));
            window.dispatchEvent(new Event('voyager_profile_updated'));
          }
        }
      } catch (e) {}
    }

    const msg = selectedLang === 'EN'
      ? 'Lesson marked as COMPLETED! Great job!'
      : '¡Lección marcada como COMPLETADA! ¡Excelente trabajo!';

    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRemoveLesson = (lessonIdToRemove: string) => {
    const updated = myLessons.filter(item => item.id !== lessonIdToRemove && item.lessonId !== lessonIdToRemove);
    saveMyLessonsToStorage(updated);
  };

  return (
    <div className="w-full my-4 animate-fade-in text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-neutral-900 text-amber-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-amber-400">
          <span className="text-xs sm:text-sm font-medium font-mono">{toastMessage}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-auto text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ────── Mis Lecciones (Active & Saved Lessons Section) ────── */}
      {myLessons.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50/90 border-2 border-amber-400 rounded-2xl shadow-xs text-left animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400 text-neutral-950 font-bold shadow-xs">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-neutral-900 font-mono tracking-tight flex items-center gap-2">
                  <span>{selectedLang === 'EN' ? 'My Lessons' : 'Mis Lecciones'}</span>
                  <span className="text-[10px] font-mono font-bold bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-full">
                    {myLessons.filter(l => l.status === 'in_progress').length} {selectedLang === 'EN' ? 'active' : 'en curso'}
                  </span>
                </h4>
                <p className="text-[11px] text-neutral-600 font-mono mt-0.5">
                  {selectedLang === 'EN' ? 'Your active and completed personalized lessons' : 'Tus lecciones personalizadas activas y completadas'}
                </p>
              </div>
            </div>
          </div>

          {/* List of Active / Completed Lessons */}
          <div className="space-y-2.5">
            {myLessons.map((item) => (
              <div 
                key={item.id}
                className={`p-3 sm:p-3.5 rounded-xl border-2 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  item.status === 'in_progress' 
                    ? 'border-amber-400 shadow-xs' 
                    : 'border-emerald-300 bg-emerald-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Square thumbnail */}
                  <div className="w-14 h-14 aspect-square shrink-0 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badge */}
                      {item.status === 'in_progress' ? (
                        <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{selectedLang === 'EN' ? 'IN PROGRESS' : 'EN CURSO'}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-500 text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{selectedLang === 'EN' ? 'COMPLETED' : 'COMPLETADA'}</span>
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-neutral-800 font-bold bg-neutral-100 px-2 py-0.5 rounded-md">
                        {item.scenario}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {item.level} • {item.estimatedMinutes} min
                      </span>
                    </div>

                    <h5 className="text-xs sm:text-sm font-black text-neutral-900 leading-snug">
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-neutral-600 line-clamp-1 font-sans">
                      {item.objective}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleCopyNotebookLM({
                      id: item.lessonId || item.id,
                      title: item.title,
                      subtitle: item.subtitle,
                      category: item.category,
                      imageUrl: item.imageUrl,
                      skillImproved: 'Lesson Plan',
                      objective: item.objective,
                      whatItIs: item.subtitle,
                      perfectMatchReason: 'Personalized lesson plan active in your journey.',
                      keyOutcomes: [],
                      level: item.level,
                      estimatedMinutes: item.estimatedMinutes
                    }, item.scenario)}
                    className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold"
                    title={selectedLang === 'EN' ? 'Copy for Google NotebookLM' : 'Copiar para Google NotebookLM'}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">NotebookLM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportGoogleDoc({
                      id: item.lessonId || item.id,
                      title: item.title,
                      subtitle: item.subtitle,
                      category: item.category,
                      imageUrl: item.imageUrl,
                      skillImproved: 'Lesson Plan',
                      objective: item.objective,
                      whatItIs: item.subtitle,
                      perfectMatchReason: 'Personalized lesson plan active in your journey.',
                      keyOutcomes: [],
                      level: item.level,
                      estimatedMinutes: item.estimatedMinutes
                    }, item.scenario)}
                    className="p-1.5 rounded-lg bg-blue-100 border border-blue-300 text-blue-900 hover:bg-blue-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold"
                    title={selectedLang === 'EN' ? 'Save as Google Doc' : 'Guardar como Google Doc'}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    <span className="hidden sm:inline">Doc</span>
                  </button>

                  {item.status === 'in_progress' ? (
                    <button
                      type="button"
                      onClick={() => handleCompleteLesson(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedLang === 'EN' ? 'Mark Completed' : 'Completar'}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedLang === 'EN' ? 'Completed' : 'Completada'}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveLesson(item.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                    title={selectedLang === 'EN' ? 'Remove' : 'Quitar'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-400 text-neutral-950 font-bold shadow-xs">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-[15.5px] font-black tracking-wider text-neutral-900 font-mono">
              {selectedLang === 'EN' ? 'Recommended Lessons' : 'Lecciones Recomendadas'}
            </h4>
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
              {selectedLang === 'EN' ? '2 visible per view • Voyager voice guided' : '2 por vista • Guiadas por voz de Voyager'}
            </p>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={scrollLeft}
            className="p-1.5 rounded-lg border border-neutral-300 hover:border-amber-400 bg-white hover:bg-neutral-50 text-neutral-800 transition-colors shadow-xs cursor-pointer"
            title={selectedLang === 'EN' ? 'Scroll left' : 'Desplazar a la izquierda'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            className="p-1.5 rounded-lg border border-neutral-300 hover:border-amber-400 bg-white hover:bg-neutral-50 text-neutral-800 transition-colors shadow-xs cursor-pointer"
            title={selectedLang === 'EN' ? 'Scroll right' : 'Desplazar a la derecha'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel (EXACTLY TWO CARDS VISIBLE PER VIEW) */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 px-1 scrollbar-thin scrollbar-thumb-neutral-300 hover:scrollbar-thumb-neutral-400"
      >
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            onClick={() => handleSelectLesson(lesson)}
            className="snap-start shrink-0 w-[calc(50%-8px)] min-w-[260px] bg-white border-2 border-neutral-200 hover:border-amber-400 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
          >
            {/* Top Category Badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 font-mono">
                {lesson.category}
              </span>
              <span className="text-[10px] font-mono font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                {lesson.level} • {lesson.estimatedMinutes} min
              </span>
            </div>

            {/* Square Thumbnail Image (Strictly Square Aspect Ratio, Flat Border, NO Gradients) */}
            <div className="w-full aspect-square rounded-xl overflow-hidden border border-neutral-200 mb-3 relative bg-neutral-100 group-hover:border-amber-400 transition-colors">
              <img
                src={lesson.imageUrl}
                alt={lesson.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h5 className="text-xs sm:text-sm font-black text-neutral-900 leading-tight group-hover:text-amber-600 transition-colors line-clamp-2">
                  {lesson.title}
                </h5>
                <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed mt-1 font-sans">
                  {lesson.subtitle}
                </p>
              </div>

              {/* Target Skill Badge (Flat Amber Accent, NO Gradients) */}
              <div className="pt-2">
                <span className="inline-block text-[11px] font-bold font-mono text-neutral-950 bg-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg w-full text-center">
                  🎯 {lesson.skillImproved}
                </span>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] font-bold font-mono text-neutral-800 group-hover:text-amber-600 transition-colors">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{selectedLang === 'EN' ? 'Listen to Voyager' : 'Escuchar a Voyager'}</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Voice-First Minimal Lesson Modal */}
      {selectedLesson && (
        <div 
          className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-pointer"
          onClick={handleCloseModal} // Click outside closes modal
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border-2 border-neutral-200 text-left relative animate-scale-up cursor-default"
            onClick={(e) => e.stopPropagation()} // Prevent inside clicks from closing
          >
            {/* Top Right Close Button ONLY */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
              title={selectedLang === 'EN' ? 'Close' : 'Cerrar'}
            >
              <X className="w-5 h-5" />
            </button>

            {/* 1. Essential Header: Square Thumbnail + Title + Level + Duration */}
            <div className="flex items-start gap-3.5 mb-3 pr-6">
              <div className="w-16 h-16 aspect-square shrink-0 rounded-xl overflow-hidden border border-amber-400 bg-neutral-100 shadow-xs">
                <img
                  src={selectedLesson.imageUrl}
                  alt={selectedLesson.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 font-mono">
                    {selectedLesson.category}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500 font-bold">
                    {selectedLesson.level} • {selectedLesson.estimatedMinutes} min
                  </span>
                </div>
                <h3 className="text-base font-black text-neutral-900 leading-tight">
                  {selectedLesson.title}
                </h3>
              </div>
            </div>

            {/* Voice Status Indicator (Subtle, no dark box) */}
            <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-amber-50 border border-amber-200 mb-3 text-xs font-mono font-bold text-amber-900">
              <Volume2 className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
              <span>
                {isSpeaking && !isPaused
                  ? (selectedLang === 'EN' ? 'Voyager is explaining by voice...' : 'Voyager explicando por voz...')
                  : (selectedLang === 'EN' ? 'Voyager Voice Guide' : 'Guía de Voz Voyager')}
              </span>
            </div>

            {/* 2. One short sentence with the pedagogical objective */}
            <p className="text-xs text-neutral-700 leading-relaxed font-sans mb-4">
              <strong className="font-mono text-neutral-900">{selectedLang === 'EN' ? 'Objective:' : 'Objetivo:'}</strong> {selectedLesson.objective}
            </p>

            {/* 3. Selector "Cambiar escenario" */}
            <div className="space-y-2 mb-5">
              <label className="text-[11px] font-bold text-neutral-700 font-mono block">
                {selectedLang === 'EN' ? 'Change Scenario:' : 'Cambiar escenario:'}
              </label>
              <select
                value={selectedScenarioOption}
                onChange={(e) => handleScenarioChange(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-medium text-neutral-800 font-mono outline-none cursor-pointer"
              >
                {scenarioOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {selectedScenarioOption === 'custom_free' && (
                <input
                  type="text"
                  value={customScenarioText}
                  onChange={(e) => handleCustomTextChange(e.target.value)}
                  placeholder={selectedLang === 'EN' ? 'Describe your custom situation...' : 'Describe tu situación o escenario libre...'}
                  className="w-full bg-white border border-amber-400 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none font-sans mt-2"
                />
              )}
            </div>

            {/* 4. Google NotebookLM Integration Section */}
            <div className="mb-4 p-3 rounded-xl bg-blue-50/80 border border-blue-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-blue-900 font-mono font-bold text-xs">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>{selectedLang === 'EN' ? 'Google NotebookLM Link' : 'Vincular a Google Notebook'}</span>
                </div>
                <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-semibold">
                  Google Workspace
                </span>
              </div>
              <p className="text-[11px] text-blue-900/80 leading-tight mb-2.5 font-sans">
                {selectedLang === 'EN'
                  ? 'Export this lesson plan source directly to Google NotebookLM to generate audio overviews, summaries, and flashcards.'
                  : 'Exporta el origen de esta lección a Google NotebookLM para generar resúmenes, audio resúmenes y flashcards.'}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyNotebookLM(selectedLesson, getActiveScenarioText(selectedLesson))}
                  className="px-2 py-1.5 rounded-lg bg-white hover:bg-blue-100/50 border border-blue-300 text-blue-950 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedNotebookSource ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{copiedNotebookSource ? (selectedLang === 'EN' ? 'Copied!' : '¡Copiado!') : (selectedLang === 'EN' ? 'Copy Source' : 'Copiar Origen')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportGoogleDoc(selectedLesson, getActiveScenarioText(selectedLesson))}
                  disabled={isExportingGoogleDoc}
                  className="px-2 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-900 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isExportingGoogleDoc ? <Loader2 className="w-3.5 h-3.5 text-blue-700 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-blue-700" />}
                  <span>{isExportingGoogleDoc ? (selectedLang === 'EN' ? 'Saving...' : 'Guardando...') : (selectedLang === 'EN' ? 'Google Doc' : 'Google Doc')}</span>
                </button>

                <a
                  href="https://notebooklm.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{selectedLang === 'EN' ? 'NotebookLM' : 'NotebookLM'}</span>
                </a>
              </div>
            </div>

            {/* 5. Single Call To Action Button */}
            <button
              type="button"
              onClick={handleStartLesson}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>{selectedLang === 'EN' ? 'Start Lesson' : 'Comenzar lección'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
