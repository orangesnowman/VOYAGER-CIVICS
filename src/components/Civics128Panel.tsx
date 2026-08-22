import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  ALL_CIVICS_128_QUESTIONS, 
  CivicsQuestion, 
  CivicsCategory, 
  searchQuestions, 
  generate20QuestionExam 
} from '../data/civics128Data';
import { 
  BookOpen, 
  Compass,
  Award, 
  RotateCw, 
  Search, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Bookmark, 
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Layers,
  GraduationCap,
  Check,
  X,
  Mic,
  MicOff,
  Bot,
  Play,
  Square,
  Languages
} from 'lucide-react';

interface Civics128PanelProps {
  selectedLang: 'EN' | 'ES';
  onSendToChat?: (text: string) => void;
  onSpeakWithVoyager?: (text: string) => void;
  onEnsureConnected?: () => void;
  userVoiceTranscription?: string;
  onClose?: () => void;
}

type ViewMode = 'study' | 'flashcards' | 'english' | 'exam';

// Reusable Rolodex T-Slot Notch cutout matching authentic cardstock shape
const RolodexSlots = () => (
  <>
    <svg width="28" height="38" viewBox="0 0 28 38" fill="none" className="absolute -bottom-0.5 left-[36%] -translate-x-1/2 pointer-events-none z-10">
      <path 
        d="M 0 38 C 3.5 33 7 29 7 24 C 7 21.5 5.5 19 5.5 15.5 V 8.5 C 5.5 3.8 9.3 0 14 0 C 18.7 0 22.5 3.8 22.5 8.5 V 15.5 C 22.5 19 21 21.5 21 24 C 21 29 24.5 33 28 38 Z" 
        fill="white" 
      />
    </svg>
    <svg width="28" height="38" viewBox="0 0 28 38" fill="none" className="absolute -bottom-0.5 left-[64%] -translate-x-1/2 pointer-events-none z-10">
      <path 
        d="M 0 38 C 3.5 33 7 29 7 24 C 7 21.5 5.5 19 5.5 15.5 V 8.5 C 5.5 3.8 9.3 0 14 0 C 18.7 0 22.5 3.8 22.5 8.5 V 15.5 C 22.5 19 21 21.5 21 24 C 21 29 24.5 33 28 38 Z" 
        fill="white" 
      />
    </svg>
  </>
);

const getCategoryShortName = (q: CivicsQuestion, lang: 'EN' | 'ES') => {
  switch (q.category) {
    case 'AMERICAN_GOVERNMENT':
      return lang === 'EN' ? 'GOVERNMENT' : 'GOBIERNO';
    case 'AMERICAN_HISTORY':
      return lang === 'EN' ? 'HISTORY' : 'HISTORIA';
    case 'INTEGRATED_CIVICS':
      return lang === 'EN' ? 'INTEGRATED CIVICS' : 'CÍVICA INTEGRADA';
    default:
      return lang === 'EN' ? q.categoryEn : q.categoryEs;
  }
};

export const Civics128Panel: React.FC<Civics128PanelProps> = ({
  selectedLang,
  onSendToChat,
  onSpeakWithVoyager,
  onEnsureConnected,
  userVoiceTranscription
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('study');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CivicsCategory | 'ALL'>('AMERICAN_GOVERNMENT');
  const [only65_20, setOnly65_20] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<CivicsQuestion | null>(null);

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<number[]>([]);
  const [wrongIds, setWrongIds] = useState<number[]>([]);
  const [autoReadCards, setAutoReadCards] = useState(false);
  const [cardAnswerInput, setCardAnswerInput] = useState('');
  const [cardEval, setCardEval] = useState<{ isCorrect: boolean; matchedAnswer?: string } | null>(null);
  const [cardIsListening, setCardIsListening] = useState(false);
  const cardSpeechRecRef = useRef<any>(null);
  const lastProcessedSpeechRef = useRef<string>('');

  // Re-imagined Live Oral Exam state with Voyager Officer
  const [examFormat, setExamFormat] = useState<'10_standard' | '20_extended' | '65_20_special'>('10_standard');
  const [examQuestions, setExamQuestions] = useState<CivicsQuestion[]>([]);
  const [examStarted, setExamStarted] = useState(false);
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const [userOralResponses, setUserOralResponses] = useState<Record<number, { userText: string; isCorrect: boolean; matchedAnswer?: string; isEvaluated: boolean }>>({});
  const [examCompleted, setExamCompleted] = useState(false);
  const [spokenInputText, setSpokenInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentEval, setCurrentEval] = useState<{ isCorrect: boolean; matchedAnswer?: string } | null>(null);
  const [showQuestionSpanish, setShowQuestionSpanish] = useState(false);

  // Calculator state for ESTUDIAR guide
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
    if (calcAge === '55_64' && calcYearsGC === '20plus') {
      return {
        type: '55_15',
        titleEn: '55/15 Native Language Exception',
        titleEs: 'Excepción de Idioma Natal 55/15',
        descEn: 'You qualify for the Native Language Exception! Since you are over 55 and have held a Green Card for at least 15 years (or 20+ years), you can take the Civics exam in your native language with a qualified interpreter.',
        descEs: '¡Calificas para la Excepción de Idioma Natal! Al tener más de 55 años y al menos 15 años de Residencia (o 20+), puedes presentar la prueba de cívica en tu idioma natal con un intérprete.',
        badgeEn: 'Standard Civics + Native Language Interpreter',
        badgeEs: 'Cívica Estándar + Intérprete en tu Idioma'
      };
    }
    if (calcAge === '65plus' && calcYearsGC === '15_19') {
      return {
        type: '55_15',
        titleEn: '55/15 Native Language Exception',
        titleEs: 'Excepción de Idioma Natal 55/15',
        descEn: 'You qualify for the Native Language Exception! Since you are over 55 and have held a Green Card for at least 15 years, you can take the Civics exam in your native language with an interpreter.',
        descEs: '¡Calificas para la Excepción de Idioma Natal! Al tener más de 55 años y al menos 15 años de Residencia, puedes tomar el examen de cívica en tu idioma con intérprete.',
        badgeEn: 'Standard Civics + Native Language Interpreter',
        badgeEs: 'Cívica Estándar + Intérprete en tu Idioma'
      };
    }
    if (calcAge === '50_54' && calcYearsGC === '20plus') {
      return {
        type: '50_20',
        titleEn: '50/20 Native Language Exception',
        titleEs: 'Excepción de Idioma Natal 50/20',
        descEn: 'You qualify for the Native Language Exception! Since you are 50+ with 20+ years as a Green Card holder, you are exempt from the English language test and can take the Civics exam in your native language with an interpreter.',
        descEs: '¡Calificas para la Excepción de Idioma Natal! Al tener 50+ años y 20+ años de residencia permanente, estás exento de la prueba en inglés y puedes rendir el examen de Cívica en tu idioma natal con intérprete.',
        badgeEn: 'Standard Civics + Native Language Interpreter',
        badgeEs: 'Cívica Estándar + Intérprete en tu Idioma'
      };
    }
    return {
      type: 'standard',
      titleEn: 'Standard Naturalization Civics Exam',
      titleEs: 'Examen Estándar de Cívica',
      descEn: 'You take the standard Naturalization Civics test in English (100 questions version or 128 questions version according to your N-400 filing receipt). You will be asked up to 10 or 20 questions during your officer interview.',
      descEs: 'Presentas el examen estándar de Cívica en Inglés (versión de 100 o 128 preguntas según tu recibo de radicación N-400). Te realizarán hasta 10 o 20 preguntas durante tu entrevista.',
      badgeEn: 'Standard Civics Exam (English)',
      badgeEs: 'Examen de Cívica Estándar (Inglés)'
    };
  }, [calcAge, calcYearsGC]);

  // Filter questions for study & flashcards
  const filteredQuestions = useMemo(() => {
    let list = searchQuestions(searchQuery, selectedLang);
    if (selectedCategory !== 'ALL') {
      list = list.filter(q => q.category === selectedCategory);
    }
    if (only65_20) {
      list = list.filter(q => q.isExemption65_20);
    }
    return list;
  }, [searchQuery, selectedCategory, only65_20, selectedLang]);

  // Audio speech synthesis helper using Voyager's male voice
  const speakText = (text: string, _langCode: 'en-US' | 'es-US' = 'en-US') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
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

    const voicesList = window.speechSynthesis.getVoices();
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
      utterance.lang = 'en-US';
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  // Helper to have Voyager speak both the question and its accepted answers / explanations
  const handleSpeakQuestionAndExplanation = (q: CivicsQuestion) => {
    const isEs = selectedLang === 'ES';
    
    if (onSpeakWithVoyager) {
      if (!isFlipped) {
        // Front of card (Question side): Ask candidate the question
        const promptText = `[ROLEPLAY INSTRUCTION: You are Officer Voyager conducting the official USCIS Civics Oral Interview. Ask the candidate this civics question out loud in clear English, and pause to wait for their spoken answer without revealing the answer yet: "${q.questionEn}"]`;
        onSpeakWithVoyager(promptText);
      } else {
        // Back of card (Answer side): State official accepted answers
        const promptText = `[ROLEPLAY INSTRUCTION: You are Officer Voyager. State the official accepted USCIS answers for civics question #${q.id}: "${q.answersEn.join(', ')}". Then ask if the candidate wants to practice the next question.]`;
        onSpeakWithVoyager(promptText);
      }
    } else {
      // Offline fallback TTS
      if (!isFlipped) {
        const textToSpeak = isEs
          ? `Pregunta ${q.id}: ${q.questionEs || q.questionEn}. ¿Cuál es tu respuesta?`
          : `Question ${q.id}: ${q.questionEn}. What is your answer?`;
        speakText(textToSpeak, isEs ? 'es-US' : 'en-US');
      } else {
        const answersList = isEs
          ? (q.answersEs.length > 0 ? q.answersEs : q.answersEn)
          : q.answersEn;
        const textToSpeak = isEs
          ? `Respuestas aceptadas para la pregunta ${q.id}: ${answersList.join(', ')}.`
          : `Accepted answers for Question ${q.id}: ${answersList.join(', ')}.`;
        speakText(textToSpeak, isEs ? 'es-US' : 'en-US');
      }
    }
  };

  // Officer Voyager speaks current question out loud
  const speakOfficerQuestion = (q: CivicsQuestion, index: number) => {
    if (onSpeakWithVoyager) {
      onSpeakWithVoyager(`[ROLEPLAY INSTRUCTION: You are Officer Voyager conducting the official USCIS Civics Oral Interview. Ask the candidate question number ${index + 1} out loud in clear English and pause to listen to their spoken response: "${q.questionEn}"]`);
    } else {
      const textToSpeak = `Question ${index + 1}: ${q.questionEn}`;
      speakText(textToSpeak, 'en-US');
    }
  };

  // Start a new Live Oral Exam with selected legal format
  const handleStartExam = (fmt: '10_standard' | '20_extended' | '65_20_special' = examFormat) => {
    setExamFormat(fmt);
    let pool: CivicsQuestion[] = [];
    if (fmt === '65_20_special') {
      pool = ALL_CIVICS_128_QUESTIONS.filter(q => q.isExemption65_20);
    } else {
      pool = [...ALL_CIVICS_128_QUESTIONS];
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const count = fmt === '20_extended' ? 20 : 10;
    const selectedQ = shuffled.slice(0, count);

    setExamQuestions(selectedQ);
    setExamStarted(true);
    setCurrentExamIndex(0);
    setUserOralResponses({});
    setExamCompleted(false);
    setSpokenInputText('');
    setCurrentEval(null);
    setShowQuestionSpanish(false);

    if (selectedQ[0]) {
      setTimeout(() => {
        speakOfficerQuestion(selectedQ[0], 0);
      }, 300);
    }
  };

  // Start Speech Recognition (Microphone)
  const handleToggleSpeechRecognition = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert(selectedLang === 'EN' ? 'Speech Recognition is not supported on this browser. Please type your response.' : 'El reconocimiento de voz no está disponible en este navegador. Por favor escribe tu respuesta.');
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.continuous = false;

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);

      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setSpokenInputText(transcript);
      };

      rec.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Evaluate user's oral or typed response
  const handleEvaluateOralResponse = () => {
    const currentQ = examQuestions[currentExamIndex];
    if (!currentQ) return;

    const userInput = spokenInputText.toLowerCase().replace(/[^\w\s]/gi, '').trim();
    let isCorrect = false;
    let matchedAns: string | undefined = undefined;

    if (userInput.length > 0) {
      for (const ans of currentQ.answersEn) {
        const normAns = ans.toLowerCase().replace(/[^\w\s]/gi, '').trim();
        if (userInput.includes(normAns) || normAns.includes(userInput)) {
          isCorrect = true;
          matchedAns = ans;
          break;
        }
        // Check core key words
        const ansWords = normAns.split(' ').filter(w => w.length > 3);
        if (ansWords.length > 0 && ansWords.every(w => userInput.includes(w))) {
          isCorrect = true;
          matchedAns = ans;
          break;
        }
      }
    }

    const evalResult = { isCorrect, matchedAnswer: matchedAns };
    setCurrentEval(evalResult);

    setUserOralResponses(prev => ({
      ...prev,
      [currentQ.id]: {
        userText: spokenInputText || (selectedLang === 'EN' ? '[No oral response provided]' : '[Sin respuesta oral]'),
        isCorrect,
        matchedAnswer: matchedAns,
        isEvaluated: true
      }
    }));
  };

  // Manual Override (Officer Override)
  const handleManualOverride = (overrideCorrect: boolean) => {
    const currentQ = examQuestions[currentExamIndex];
    if (!currentQ) return;

    const matchedAns = overrideCorrect ? currentQ.answersEn[0] : undefined;
    setCurrentEval({ isCorrect: overrideCorrect, matchedAnswer: matchedAns });

    setUserOralResponses(prev => ({
      ...prev,
      [currentQ.id]: {
        userText: spokenInputText || (selectedLang === 'EN' ? '[Oral Response Accepted by Officer]' : '[Respuesta oral aceptada por el Oficial]'),
        isCorrect: overrideCorrect,
        matchedAnswer: matchedAns,
        isEvaluated: true
      }
    }));
  };

  // Move to next oral question or complete exam
  const handleNextOralQuestion = () => {
    const totalAsked = currentExamIndex + 1;
    const responses = Object.values(userOralResponses);
    const correctCount = responses.filter((r: any) => r.isCorrect).length;
    const requiredPass = examFormat === '20_extended' ? 12 : 6;

    // Check if auto-passed or reached end of question pool
    if (correctCount >= requiredPass || totalAsked >= examQuestions.length) {
      setExamCompleted(true);
      return;
    }

    const nextIdx = currentExamIndex + 1;
    setCurrentExamIndex(nextIdx);
    setSpokenInputText('');
    setCurrentEval(null);
    setShowQuestionSpanish(false);

    if (examQuestions[nextIdx]) {
      setTimeout(() => {
        speakOfficerQuestion(examQuestions[nextIdx], nextIdx);
      }, 300);
    }
  };

  // Evaluate candidate's spoken or typed answer on flashcards
  const handleEvaluateCardAnswer = useCallback((q: CivicsQuestion, textToEvaluate?: string) => {
    const userText = textToEvaluate !== undefined ? textToEvaluate : cardAnswerInput;
    if (!userText || !userText.trim()) return;

    const cleanInput = userText
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanInput) return;

    let isCorrect = false;
    let matchedAns: string | undefined = undefined;

    const normalizeNumbers = (str: string) => {
      return str
        .replace(/\b100\b/g, 'one hundred')
        .replace(/\b435\b/g, 'four hundred thirty five')
        .replace(/\b50\b/g, 'fifty')
        .replace(/\b27\b/g, 'twenty seven')
        .replace(/\b9\b/g, 'nine')
        .replace(/\b2\b/g, 'two')
        .replace(/\b4\b/g, 'four')
        .replace(/\b6\b/g, 'six');
    };

    const normInput = normalizeNumbers(cleanInput);

    for (const ans of q.answersEn) {
      const cleanAns = ans.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
      const normAns = normalizeNumbers(cleanAns);

      if (normInput.includes(normAns) || normAns.includes(normInput)) {
        isCorrect = true;
        matchedAns = ans;
        break;
      }

      const keyWords = normAns
        .split(' ')
        .filter(w => w.length > 3 && !['that', 'this', 'with', 'from', 'have', 'were', 'been', 'which'].includes(w));

      if (keyWords.length > 0 && keyWords.every(w => normInput.includes(w))) {
        isCorrect = true;
        matchedAns = ans;
        break;
      }
    }

    const evalRes = { isCorrect, matchedAnswer: matchedAns };
    setCardEval(evalRes);
    setIsFlipped(true); // reveal card back with answers

    if (isCorrect) {
      setKnownIds(prev => (prev.includes(q.id) ? prev : [...prev, q.id]));
      setWrongIds(prev => prev.filter(i => i !== q.id));
    } else {
      setWrongIds(prev => (prev.includes(q.id) ? prev : [...prev, q.id]));
      setKnownIds(prev => prev.filter(i => i !== q.id));
    }

    const feedbackPrompt = isCorrect
      ? `[ROLEPLAY INSTRUCTION: You are Officer Voyager. The candidate answered civics question #${q.id} ("${q.questionEn}") correctly with "${userText}". Say "That is correct!" out loud in clear English and confirm the official accepted answer: "${matchedAns || q.answersEn[0]}".]`
      : `[ROLEPLAY INSTRUCTION: You are Officer Voyager. The candidate answered civics question #${q.id} ("${q.questionEn}") with "${userText}". Say "Not quite." out loud in clear English and state the official accepted USCIS answers: "${q.answersEn.join(', ')}". Encouragingly ask them to try again.]`;

    if (onSpeakWithVoyager) {
      onSpeakWithVoyager(feedbackPrompt);
    } else {
      const textToSpeak = isCorrect
        ? `That is correct! ${matchedAns || q.answersEn[0]}.`
        : `Not quite. The official answers are: ${q.answersEn.join(', ')}.`;
      speakText(textToSpeak, 'en-US');
    }
  }, [cardAnswerInput, onSpeakWithVoyager]);

  // Start browser speech recognition explicitly for flashcards
  const startCardSpeechRecognition = useCallback((q: CivicsQuestion) => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;
    try {
      if (cardSpeechRecRef.current) {
        try { cardSpeechRecRef.current.stop(); } catch (e) {}
      }
      const rec = new SpeechRec();
      cardSpeechRecRef.current = rec;
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.continuous = false;

      rec.onstart = () => setCardIsListening(true);
      rec.onend = () => setCardIsListening(false);
      rec.onerror = () => setCardIsListening(false);

      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setCardAnswerInput(transcript);
        if (e.results[0] && e.results[0].isFinal) {
          handleEvaluateCardAnswer(q, transcript);
        }
      };

      rec.start();
    } catch (e) {
      setCardIsListening(false);
    }
  }, [handleEvaluateCardAnswer]);

  // Have Officer Voyager ask current flashcard question out loud and wait for response
  const handleAskFlashcardQuestion = (q: CivicsQuestion) => {
    setIsFlipped(false);
    setCardEval(null);
    setCardAnswerInput('');

    if (onEnsureConnected) {
      onEnsureConnected();
    }

    const promptText = `[ROLEPLAY INSTRUCTION: You are Officer Voyager conducting the official USCIS Civics Oral Interview. Read question #${q.id} out loud clearly in English: "${q.questionEn}". Ask the candidate for their answer and pause to wait for their response without revealing the answer.]`;
    
    if (onSpeakWithVoyager) {
      onSpeakWithVoyager(promptText);
    } else {
      const textToSpeak = `Question ${q.id}: ${q.questionEn}. What is your answer?`;
      speakText(textToSpeak, 'en-US');
    }

    // Auto-start listening after asking
    setTimeout(() => {
      startCardSpeechRecognition(q);
    }, 1800);
  };

  // Microphone toggle for card practice
  const handleToggleCardSpeech = () => {
    if (cardIsListening) {
      if (cardSpeechRecRef.current) {
        try { cardSpeechRecRef.current.stop(); } catch (e) {}
      }
      setCardIsListening(false);
      return;
    }
    const currentQ = filteredQuestions[flashcardIndex] || filteredQuestions[0] || ALL_CIVICS_128_QUESTIONS[0];
    if (currentQ) {
      startCardSpeechRecognition(currentQ);
    }
  };

  // React to incoming live user voice transcriptions from WebSocket
  useEffect(() => {
    if (userVoiceTranscription && userVoiceTranscription.trim() !== '' && userVoiceTranscription !== lastProcessedSpeechRef.current) {
      lastProcessedSpeechRef.current = userVoiceTranscription;
      if (viewMode === 'flashcards' || viewMode === 'english') {
        const currentQ = filteredQuestions[flashcardIndex] || filteredQuestions[0] || ALL_CIVICS_128_QUESTIONS[0];
        if (currentQ) {
          setCardAnswerInput(userVoiceTranscription);
          handleEvaluateCardAnswer(currentQ, userVoiceTranscription);
        }
      }
    }
  }, [userVoiceTranscription, flashcardIndex, viewMode, filteredQuestions, handleEvaluateCardAnswer]);

  const handleNextFlashcard = () => {
    setIsFlipped(false);
    setCardEval(null);
    setCardAnswerInput('');
    const nextIdx = (flashcardIndex + 1) % (filteredQuestions.length || 1);
    setFlashcardIndex(nextIdx);
    const nextQ = filteredQuestions[nextIdx];
    if (autoReadCards && nextQ) {
      setTimeout(() => {
        handleAskFlashcardQuestion(nextQ);
      }, 300);
    }
  };

  const handlePrevFlashcard = () => {
    setIsFlipped(false);
    setCardEval(null);
    setCardAnswerInput('');
    const prevIdx = (flashcardIndex - 1 + (filteredQuestions.length || 1)) % (filteredQuestions.length || 1);
    setFlashcardIndex(prevIdx);
    const prevQ = filteredQuestions[prevIdx];
    if (autoReadCards && prevQ) {
      setTimeout(() => {
        handleAskFlashcardQuestion(prevQ);
      }, 300);
    }
  };

  // Current flashcard
  const currentFlashcard = filteredQuestions[flashcardIndex] || filteredQuestions[0] || ALL_CIVICS_128_QUESTIONS[0];

  return (
    <div className="w-full h-full flex flex-col bg-white text-slate-800 overflow-hidden font-sans">
      {/* Top Banner Header / Submenu */}
      <div className="pt-3 sm:pt-4 pb-3 px-3 sm:px-4 shrink-0 flex flex-col items-center gap-3">
        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setViewMode('study')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm sm:text-base uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'study'
                  ? 'text-red-600 font-bold'
                  : 'text-slate-600 hover:text-red-500 font-semibold'
              }`}
            >
              <Compass className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>{selectedLang === 'EN' ? 'Guide' : 'Guía'}</span>
            </button>
            <button
              onClick={() => setViewMode('flashcards')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm sm:text-base uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'flashcards'
                  ? 'text-red-600 font-bold'
                  : 'text-slate-600 hover:text-red-500 font-semibold'
              }`}
            >
              <Layers className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>{selectedLang === 'EN' ? 'Bilingual' : 'Bilingüe'}</span>
            </button>
            <button
              onClick={() => setViewMode('english')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm sm:text-base uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'english'
                  ? 'text-red-600 font-bold'
                  : 'text-slate-600 hover:text-red-500 font-semibold'
              }`}
            >
              <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>{selectedLang === 'EN' ? 'English' : 'Inglés'}</span>
            </button>
            <button
              onClick={() => {
                setViewMode('exam');
                if (!examStarted) handleStartExam();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm sm:text-base uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'exam'
                  ? 'text-red-600 font-bold'
                  : 'text-slate-600 hover:text-red-500 font-semibold'
              }`}
            >
              <GraduationCap className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>{selectedLang === 'EN' ? 'Simulated Exam' : 'Simulacro'}</span>
            </button>
          </div>

        {/* Category Pills - Integrated into Submenu */}
        {(viewMode === 'flashcards' || viewMode === 'english') && (
          <div className="w-full max-w-2xl flex flex-col items-center gap-2.5">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {[
                { id: 'AMERICAN_GOVERNMENT', labelEn: 'Government 1-59', labelEs: 'Gobierno 1-59' },
                { id: 'AMERICAN_HISTORY', labelEn: 'History 60-113', labelEs: 'Historia 60-113' },
                { id: 'INTEGRATED_CIVICS', labelEn: 'Civics 114-128', labelEs: 'Cívica 114-128' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id as any);
                    setFlashcardIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-3 py-1.5 text-sm sm:text-base font-semibold transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'text-red-600 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {selectedLang === 'EN' ? cat.labelEn : cat.labelEs}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 space-y-4 bg-white">
        {/* VIEW MODE: STUDY GUIDE (EXAM TYPES & FINDER) */}
        {viewMode === 'study' && (
          <div className="space-y-6 max-w-4xl mx-auto py-2 px-1 animate-fade-in">
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-[#0D224A] via-[#1E3A8A] to-[#0D224A] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                <GraduationCap className="w-64 h-64 text-white" />
              </div>
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{selectedLang === 'EN' ? 'USCIS Civics Guide & Exam Preparation' : 'Guía de Exámenes Cívicos de USCIS'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {selectedLang === 'EN' ? 'Which Exam Do You Need to Prepare For?' : '¿Cuál Examen Te Corresponde Presentar?'}
                </h2>
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl">
                  {selectedLang === 'EN'
                    ? 'The USCIS Naturalization Civics test has different versions and exemptions based on your age, length of permanent residency, and N-400 filing date. Use this guide to find your exact exam type and learn American civics for life.'
                    : 'El examen de Cívica para la Naturalización de USCIS tiene diferentes versiones y excepciones según tu edad, años con residencia permanente y fecha de solicitud. Usa esta guía para identificar tu examen exacto y aprender cívica estadounidense para la vida.'}
                </p>
              </div>
            </div>

            {/* Interactive Qualification Finder */}
            <div className="bg-[#FEDC89]/40 border-2 border-[#FEDC89] rounded-3xl p-5 sm:p-7 space-y-5 shadow-xs relative">
              <RolodexSlots />
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
                    const textToSpeak = selectedLang === 'ES'
                      ? `Resultado de tu consulta: ${calcResult.titleEs}. ${calcResult.descEs}`
                      : `Your result: ${calcResult.titleEn}. ${calcResult.descEn}`;
                    speakText(textToSpeak, selectedLang === 'ES' ? 'es-US' : 'en-US');
                  }}
                  title={selectedLang === 'EN' ? 'Listen to Result' : 'Escuchar Resultado'}
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
                      { id: 'under50', labelEn: 'Under 50', labelEs: '< 50 años' },
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

                {/* Step 2: Years as Green Card Holder */}
                <div className="bg-white/90 p-4 rounded-2xl border border-amber-900/10 space-y-2">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    {selectedLang === 'EN' ? '2. Years with Green Card (LPR)' : '2. Años con Residencia Permanente'}
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
                        className={`px-2 py-2 text-xs font-bold rounded-xl transition cursor-pointer border text-center ${
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

              {/* Calculator Result Box */}
              <div className="bg-[#0D224A] text-white p-4 sm:p-5 rounded-2xl space-y-2 shadow-sm border border-amber-400/30">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-amber-400 text-stone-950 font-extrabold text-xs uppercase tracking-wide">
                    {selectedLang === 'EN' ? calcResult.badgeEn : calcResult.badgeEs}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {selectedLang === 'EN' ? calcResult.titleEn : calcResult.titleEs}
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {selectedLang === 'EN' ? calcResult.descEn : calcResult.descEs}
                </p>
              </div>
            </div>

            {/* Section: Types of Civics Exams */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Layers className="w-5 h-5 text-[#0D224A]" />
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedLang === 'EN' ? 'Types of Naturalization Civics Exams' : 'Tipos de Exámenes de Cívica de USCIS'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Exam 1: 100 Questions (2008 Version) */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2 hover:border-slate-300 transition shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                      {selectedLang === 'EN' ? 'Standard Exam' : 'Examen Frecuente'}
                    </span>
                    <span className="text-xs font-extrabold text-slate-500">2008 Test</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {selectedLang === 'EN' ? '100 Civics Questions Test (2008 Version)' : 'Examen de 100 Preguntas (Versión 2008)'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {selectedLang === 'EN'
                      ? 'During your officer interview, you will be asked up to 10 questions from the standard 100 Civics questions list. You must answer at least 6 correctly (60%) to pass.'
                      : 'En tu entrevista personal con el oficial de USCIS, te realizarán hasta 10 preguntas de la lista de 100 cívicas. Debes contestar al menos 6 correctamente (60%) para aprobar.'}
                  </p>
                </div>

                {/* Exam 2: 128 Questions (2020 Version) */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2 hover:border-slate-300 transition shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      {selectedLang === 'EN' ? '128 Questions' : '128 Preguntas'}
                    </span>
                    <span className="text-xs font-extrabold text-slate-500">2020 Test</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {selectedLang === 'EN' ? '128 Civics Questions Test (2020 Version)' : 'Examen de 128 Preguntas (Versión 2020)'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {selectedLang === 'EN'
                      ? 'Divided into 3 sections: Government (1-59), History (60-113), and Integrated Civics (114-128). You are asked 20 questions and need 12 correct answers to pass.'
                      : 'Dividido en 3 secciones: Gobierno (1-59), Historia (60-113) y Cívica Integrada (114-128). Te hacen 20 preguntas y requieres 12 aciertos para aprobar.'}
                  </p>
                </div>

                {/* Exam 3: 65/20 Special Consideration Exemption */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2 hover:border-slate-300 transition shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      {selectedLang === 'EN' ? 'Simplified Test' : 'Examen Simplificado'}
                    </span>
                    <span className="text-xs font-extrabold text-slate-500">Regla 65/20</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {selectedLang === 'EN' ? '65/20 Exemption (20 Questions)' : 'Exención Especial 65/20 (20 Preguntas)'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {selectedLang === 'EN'
                      ? 'For applicants 65+ years old with 20+ years as a permanent resident. You only study 20 designated asterisk (*) questions, answer 10 questions with 6 required to pass, and can use an interpreter.'
                      : 'Para solicitantes de 65+ años con 20+ años de residencia. Solo estudias 20 preguntas seleccionadas con asterisco (*), te hacen 10 y necesitas 6 correctas. ¡Puedes usar intérprete!'}
                  </p>
                </div>

                {/* Exam 4: Native Language Exceptions (50/20 & 55/15) */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2 hover:border-slate-300 transition shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0D224A] text-white text-xs font-bold">
                      {selectedLang === 'EN' ? 'Language Exception' : 'Excepción de Idioma'}
                    </span>
                    <span className="text-xs font-extrabold text-slate-500">50/20 & 55/15</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {selectedLang === 'EN' ? 'Native Language Exceptions' : 'Excepciones para Idioma Natal'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {selectedLang === 'EN'
                      ? 'If you are 50+ with 20 years of Green Card OR 55+ with 15 years, you are exempt from the English language requirement and take the Civics exam in your native language with an interpreter.'
                      : 'Si tienes 50+ años con 20 años de residencia O 55+ con 15 años, estás exento del examen de inglés y puedes rendir la prueba de Cívica en tu propio idioma con intérprete.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section: How to Verify Which One You Need */}
            <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0D224A]" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {selectedLang === 'EN' ? 'How to Find Out Which Exam You Need' : '¿Cómo Confirmar Qué Examen Te Corresponde?'}
                </h3>
              </div>
              <ol className="space-y-2 text-xs sm:text-sm text-slate-700 pl-4 list-decimal font-medium">
                <li>
                  <strong className="text-slate-900">{selectedLang === 'EN' ? 'Check your N-400 filing receipt notice (Form I-797C):' : 'Revisa tu aviso de recibo N-400 (Formulario I-797C):'}</strong>{' '}
                  {selectedLang === 'EN' ? 'Your official filing date determines the civics question set assigned by USCIS.' : 'La fecha de radicación oficial determina la versión de preguntas asignada por USCIS.'}
                </li>
                <li>
                  <strong className="text-slate-900">{selectedLang === 'EN' ? 'Calculate your age on the filing date:' : 'Calcula tu edad a la fecha de radicación:'}</strong>{' '}
                  {selectedLang === 'EN' ? 'Exemptions are based on your age on the day you formally submitted Form N-400 to USCIS.' : 'Las excepciones de edad e idioma se evalúan exactamente el día que enviaste el Formulario N-400.'}
                </li>
                <li>
                  <strong className="text-slate-900">{selectedLang === 'EN' ? 'Review your Interview Notice:' : 'Verifica tu Notificación de Cita de Entrevista:'}</strong>{' '}
                  {selectedLang === 'EN' ? 'Your interview invitation confirms if you are permitted to bring an interpreter for your native language.' : 'Tu carta de cita confirma si estás autorizado a llevar un intérprete para presentar en tu idioma.'}
                </li>
              </ol>
            </div>

            {/* Section: Civics for Life & American Culture */}
            <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-2xl p-5 border border-amber-300 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-900">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h3 className="text-base sm:text-lg font-bold">
                  {selectedLang === 'EN' ? 'Civics for Life: Understanding American Civics' : 'Cívica para la Vida: Entender la Cívica Estadounidense'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
                {selectedLang === 'EN'
                  ? 'Studying American Civics is not just for passing a test — it is your gateway to understanding how U.S. democracy works, how laws are created, the historic achievements of the nation, and your rights and responsibilities as a community member.'
                  : 'Estudiar Cívica no es solo para aprobar un examen — es tu llave para comprender cómo funciona la democracia en EE.UU., cómo se crean las leyes, las gestas históricas de la nación y tus derechos y deberes constitucionales como miembro activo de la sociedad.'}
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  onClick={() => setViewMode('flashcards')}
                  className="px-4 py-2 bg-[#0D224A] hover:bg-[#1E3A8A] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <span>{selectedLang === 'EN' ? 'Practice Bilingual Cards (BILINGUAL)' : 'Practicar en Modo Bilingüe'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('english')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <span>{selectedLang === 'EN' ? 'Practice English Cards (ENGLISH)' : 'Practicar Solo en Inglés'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('exam')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <span>{selectedLang === 'EN' ? 'Take Simulated Exam (SIMULACRO)' : 'Realizar Simulacro de Examen'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ask Voyager Button */}
            {onSendToChat && (
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    const prompt = selectedLang === 'ES'
                      ? 'Hola Voyager, ¿puedes explicarme detalladamente qué tipo de examen de cívica me corresponde presentar según mi edad y años de residencia en los Estados Unidos?'
                      : 'Hi Voyager, can you explain in detail which USCIS civics exam format applies to me based on my age and years as a green card holder?';
                    onSendToChat(prompt);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold rounded-2xl transition cursor-pointer inline-flex items-center gap-2 shadow-2xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{selectedLang === 'EN' ? 'Ask Voyager AI about your specific case' : 'Consultar a Voz Voyager sobre tu caso específico'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE: FLASHCARDS (BILINGÜE) OR ENGLISH (SOLO INGLÉS) */}
        {(viewMode === 'flashcards' || viewMode === 'english') && (
          <div className="max-w-2xl mx-auto space-y-4 py-3">
            {/* Top Card Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
              {/* Voyager Action Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAskFlashcardQuestion(currentFlashcard)}
                  className="px-3.5 py-2 rounded-xl bg-[#0D224A] hover:bg-[#15346e] text-white text-xs font-extrabold flex items-center gap-2 shadow-2xs transition cursor-pointer"
                  title={selectedLang === 'EN' ? 'Have Officer Voyager read question aloud and wait for your answer' : 'El Oficial Voyager lee la pregunta en voz alta y espera tu respuesta'}
                >
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span>
                    {selectedLang === 'EN'
                      ? 'Officer Voyager: Read Question & Expect Answer'
                      : 'Oficial Voyager: Leer Pregunta y Esperar Mi Respuesta'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !autoReadCards;
                    setAutoReadCards(nextVal);
                    if (nextVal) {
                      handleAskFlashcardQuestion(currentFlashcard);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    autoReadCards
                      ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={selectedLang === 'EN' ? 'Toggle auto-reading cards' : 'Alternar lectura automática'}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{selectedLang === 'EN' ? 'Auto-Read' : 'Auto-Lectura'}</span>
                </button>
              </div>

              {/* Card Action Icons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSpeakQuestionAndExplanation(currentFlashcard)}
                  title={selectedLang === 'EN' ? 'Listen in Voyager Voice' : 'Escuchar en Voz Voyager'}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Volume2 className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  title={selectedLang === 'EN' ? 'Click to flip' : 'Clic para voltear'}
                  className={`w-9 h-9 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                    isFlipped
                      ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                  }`}
                >
                  <RotateCw className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = currentFlashcard.id;
                    if (knownIds.includes(id)) {
                      setKnownIds(knownIds.filter(i => i !== id));
                    } else {
                      setKnownIds([...knownIds, id]);
                      setWrongIds(wrongIds.filter(i => i !== id));
                    }
                  }}
                  title={selectedLang === 'EN' ? 'Mark Correct' : 'Marcar Correcto'}
                  className={`w-9 h-9 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                    knownIds.includes(currentFlashcard.id)
                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = currentFlashcard.id;
                    if (wrongIds.includes(id)) {
                      setWrongIds(wrongIds.filter(i => i !== id));
                    } else {
                      setWrongIds([...wrongIds, id]);
                      setKnownIds(knownIds.filter(i => i !== id));
                    }
                  }}
                  title={selectedLang === 'EN' ? 'Mark Incorrect' : 'Marcar Incorrecto'}
                  className={`w-9 h-9 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                    wrongIds.includes(currentFlashcard.id)
                      ? 'bg-rose-500 border-rose-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                  }`}
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Interactive Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[300px] bg-[#FEDC89] rounded-3xl p-6 sm:p-8 pb-12 sm:pb-14 flex flex-col justify-between cursor-pointer transition-colors duration-300 select-none relative group overflow-hidden"
            >
              <RolodexSlots />

              {/* Card Question # Badge */}
              <div className="flex items-center justify-between gap-2 relative z-1">
                <span className="px-2.5 py-1 rounded-full bg-amber-900/10 text-stone-900 text-xs font-black tracking-wider uppercase">
                  Question #{currentFlashcard.id}
                </span>
                <span className="text-xs font-extrabold text-stone-700">
                  {flashcardIndex + 1} / {filteredQuestions.length}
                </span>
              </div>

              {/* Front Side: Question */}
              {!isFlipped ? (
                <div className="my-auto text-center space-y-3 py-4 relative z-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-950 leading-relaxed max-w-xl mx-auto">
                    {currentFlashcard.questionEn}
                  </h3>
                  {viewMode === 'flashcards' && (
                    <p className="text-sm sm:text-base text-stone-700 italic font-medium">
                      {currentFlashcard.questionEs}
                    </p>
                  )}
                </div>
              ) : (
                /* Back Side: Accepted Answers */
                <div className="my-auto space-y-2 py-2 animate-fade-in relative z-1 flex flex-col items-center">
                  <ul className="w-full space-y-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
                    {currentFlashcard.answersEn.map((ansEn, idx) => (
                      <li key={idx} className="py-2 px-1 text-center text-stone-900">
                        <span className="font-bold text-base sm:text-lg text-stone-950 block">{ansEn}</span>
                        {viewMode === 'flashcards' && currentFlashcard.answersEs[idx] && (
                          <div className="text-xs sm:text-sm text-stone-700 italic mt-0.5">
                            {currentFlashcard.answersEs[idx]}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {currentFlashcard.answersEn.length > 1 && (
                    <div
                      className="flex items-center justify-center pt-1 text-stone-800 animate-bounce pointer-events-none opacity-80"
                      title={selectedLang === 'EN' ? 'Scroll for more' : 'Desplaza para ver más'}
                    >
                      <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Answer & Evaluation Section for Flashcard */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#0D224A]" />
                  <span className="text-xs font-extrabold text-slate-800">
                    {selectedLang === 'EN'
                      ? `Respond to Officer Voyager (Question #${currentFlashcard.id}):`
                      : `Responder al Oficial Voyager (Pregunta #${currentFlashcard.id}):`}
                  </span>
                </div>
                {cardEval && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1 ${
                      cardEval.isCorrect
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {cardEval.isCorrect ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {cardEval.isCorrect
                      ? selectedLang === 'EN'
                        ? 'CORRECT!'
                        : '¡CORRECTO!'
                      : selectedLang === 'EN'
                      ? 'TRY AGAIN'
                      : 'INTENTA DE NUEVO'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleCardSpeech}
                  className={`p-2.5 rounded-xl border transition cursor-pointer shrink-0 ${
                    cardIsListening
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                  title={selectedLang === 'EN' ? 'Speak Answer' : 'Hablar Respuesta'}
                >
                  {cardIsListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4 text-[#0D224A]" />
                  )}
                </button>

                <input
                  type="text"
                  value={cardAnswerInput}
                  onChange={(e) => setCardAnswerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEvaluateCardAnswer(currentFlashcard);
                  }}
                  placeholder={
                    selectedLang === 'EN'
                      ? 'Type or speak your answer in English...'
                      : 'Escribe o habla tu respuesta en inglés...'
                  }
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D224A] text-slate-900"
                />

                <button
                  type="button"
                  onClick={() => handleEvaluateCardAnswer(currentFlashcard)}
                  disabled={!cardAnswerInput.trim()}
                  className="px-4 py-2 bg-[#0D224A] hover:bg-[#15346e] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                >
                  {selectedLang === 'EN' ? 'Check Answer' : 'Evaluar'}
                </button>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-slate-500 font-semibold">
                {selectedLang === 'EN' ? 'Use arrow buttons or click card to flip' : 'Usa los botones o haz clic para voltear la tarjeta'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevFlashcard}
                  title={selectedLang === 'EN' ? 'Previous Question' : 'Pregunta Anterior'}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer flex items-center justify-center shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                <button
                  onClick={handleNextFlashcard}
                  title={selectedLang === 'EN' ? 'Next Question' : 'Siguiente Pregunta'}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer flex items-center justify-center shrink-0"
                >
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE: SIMULATED ORAL EXAM WITH OFFICER VOYAGER */}
        {viewMode === 'exam' && (() => {
          const oralResponsesList = Object.values(userOralResponses);
          const correctCount = oralResponsesList.filter((r: any) => r?.isCorrect).length;
          const requiredPassCount = examFormat === '20_extended' ? 12 : 6;
          const maxQuestionsCount = examFormat === '20_extended' ? 20 : 10;
          const isOralPassed = correctCount >= requiredPassCount;
          const currentOralQ = examQuestions[currentExamIndex];

          return (
            <div className="max-w-3xl mx-auto space-y-4 py-2">
              {!examStarted ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      {selectedLang === 'EN' ? 'Official Oral Interview Simulation' : 'Simulacro de Entrevista Oral con Oficial'}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {selectedLang === 'EN' ? 'USCIS Civics Oral Exam with Officer Voyager' : 'Examen Cívico Oral en Vivo con Oficial Voyager'}
                    </h3>
                    <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                      {selectedLang === 'EN'
                        ? 'In the real USCIS interview, an officer asks questions out loud in English, and you must respond verbally. Officer Voyager will read your questions live, evaluate your spoken answers, and track if you pass under federal guidelines!'
                        : 'En la entrevista real de USCIS, un oficial le realiza las preguntas en voz alta en inglés y usted responde verbalmente. ¡El Oficial Voyager leerá sus preguntas en vivo, evaluará sus respuestas habladas y determinará si aprueba según la ley!'}
                    </p>
                  </div>

                  {/* Exam Format Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                    <button
                      type="button"
                      onClick={() => setExamFormat('10_standard')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                        examFormat === '10_standard'
                          ? 'border-[#0D224A] bg-slate-50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                          {selectedLang === 'EN' ? 'Standard Format' : 'Formato Estándar'}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {selectedLang === 'EN' ? '10 Questions (6 Correct)' : '10 Preguntas (6 Correctas)'}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedLang === 'EN' ? 'Most common format. Needs 60% to pass.' : 'Formato más común. Requiere 60% para aprobar.'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExamFormat('20_extended')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                        examFormat === '20_extended'
                          ? 'border-[#0D224A] bg-slate-50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                          {selectedLang === 'EN' ? '2020 Version' : 'Versión 2020'}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {selectedLang === 'EN' ? '20 Questions (12 Correct)' : '20 Preguntas (12 Correctas)'}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedLang === 'EN' ? 'Full 128-question bank coverage.' : 'Cobertura completa del banco de 128 preguntas.'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExamFormat('65_20_special')}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                        examFormat === '65_20_special'
                          ? 'border-[#0D224A] bg-slate-50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                          {selectedLang === 'EN' ? '65/20 Exemption' : 'Exención 65/20'}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {selectedLang === 'EN' ? '20 Special List (6 Correct)' : 'Lista de 20 (*) (6 Correctas)'}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedLang === 'EN' ? 'For applicants 65+ with 20+ yrs GC.' : 'Para mayores de 65 años con 20+ años GC.'}
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => handleStartExam(examFormat)}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0D224A] hover:bg-[#15346e] text-white font-extrabold text-base transition cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>{selectedLang === 'EN' ? 'Start Live Oral Interview' : 'Comenzar Entrevista Oral con Oficial Voyager'}</span>
                  </button>
                </div>
              ) : examCompleted ? (
                /* Oral Exam Final Results Screen */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs animate-scale-up">
                  <div className="text-center space-y-3">
                    <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center border-4 shadow-sm ${
                      isOralPassed
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                        : 'bg-rose-50 border-rose-500 text-rose-600'
                    }`}>
                      {isOralPassed ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {isOralPassed
                        ? (selectedLang === 'EN' ? 'CIVICS TEST PASSED!' : '¡EXAMEN CÍVICO APROBADO!')
                        : (selectedLang === 'EN' ? 'NEED MORE ORAL PRACTICE' : 'REQUIERE MÁS PRÁCTICA ORAL')}
                    </h3>

                    <p className="text-base text-slate-700 font-semibold max-w-md mx-auto">
                      {selectedLang === 'EN'
                        ? `Officer Voyager recorded ${correctCount} correct oral responses out of ${oralResponsesList.length} questions asked. Needed: ${requiredPassCount} correct.`
                        : `El Oficial Voyager registró ${correctCount} respuestas orales correctas de ${oralResponsesList.length} preguntas realizadas. Requeridas: ${requiredPassCount} correctas.`}
                    </p>
                  </div>

                  {/* Question Breakdown with User Transcripts & USCIS Citations */}
                  <div className="space-y-3 pt-4 border-t border-slate-200 max-h-[360px] overflow-y-auto pr-1">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {selectedLang === 'EN' ? 'Official Interview Question & Response Record:' : 'Registro Oficial de Preguntas y Respuestas Habituales:'}
                    </h4>
                    {examQuestions.slice(0, oralResponsesList.length).map((q, idx) => {
                      const res = userOralResponses[q.id];
                      const isCorrect = res?.isCorrect;
                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-2xl border text-xs space-y-2 ${
                            isCorrect
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-rose-50/60 border-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900">
                              #{idx + 1}. Q#{q.id}: {q.questionEn}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                              isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isCorrect ? (selectedLang === 'EN' ? 'Accepted' : 'Aceptado') : (selectedLang === 'EN' ? 'Incorrect' : 'Incorrecto')}
                            </span>
                          </div>

                          <div className="text-slate-800 bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                            <div className="text-[11px] font-bold text-slate-500">
                              {selectedLang === 'EN' ? 'Your Oral Response:' : 'Tu Respuesta Oral:'}
                            </div>
                            <div className="font-semibold italic text-slate-900 mt-0.5">
                              "{res?.userText || (selectedLang === 'EN' ? 'No response' : 'Sin respuesta')}"
                            </div>
                          </div>

                          <div className="text-slate-700">
                            <span className="text-slate-500">{selectedLang === 'EN' ? 'Official Accepted Answers:' : 'Respuestas Oficiales Aceptadas:'} </span>
                            <span className="font-bold text-slate-900">{q.answersEn.join(' • ')}</span>
                          </div>

                          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                            {q.uscisCitation}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleStartExam(examFormat)}
                      className="flex-1 py-4 rounded-xl bg-[#0D224A] hover:bg-[#15346e] text-white font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>{selectedLang === 'EN' ? 'Retake Live Oral Interview' : 'Realizar Nuevo Simulacro Oral'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Live Oral Interview Screen */
                <div className="relative bg-[#FEDC89] rounded-3xl p-5 sm:p-7 pb-10 sm:pb-12 space-y-5 overflow-hidden shadow-sm">
                  <RolodexSlots />

                  {/* Progress Header */}
                  <div className="space-y-2 relative z-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-stone-900">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-amber-950/10 rounded-lg text-amber-950 font-black border border-amber-900/20">
                          {selectedLang === 'EN' ? `Oral Question ${currentExamIndex + 1} of ${maxQuestionsCount}` : `Pregunta Oral ${currentExamIndex + 1} de ${maxQuestionsCount}`}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-[#0D224A] text-white rounded-full font-bold">
                        {selectedLang === 'EN' ? `Passing Target: ${requiredPassCount} • Score: ${correctCount}` : `Meta Aprobación: ${requiredPassCount} • Aciertos: ${correctCount}`}
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden border border-stone-300">
                      <div
                        className="h-full bg-[#0D224A] transition-all duration-300"
                        style={{ width: `${((currentExamIndex + 1) / maxQuestionsCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Officer Voyager Visual & Question Banner */}
                  <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-5 border border-amber-900/10 space-y-4 relative z-1 shadow-xs">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0D224A] text-amber-400 flex items-center justify-center shadow-xs">
                          <Bot className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-extrabold text-stone-900 text-sm leading-tight">
                            Officer Voyager
                          </div>
                          <div className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">
                            USCIS Naturalization Examiner
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => speakOfficerQuestion(currentOralQ, currentExamIndex)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title={selectedLang === 'EN' ? 'Listen to Officer' : 'Escuchar al Oficial'}
                        >
                          <Volume2 className="w-4 h-4" />
                          <span className="hidden sm:inline">{selectedLang === 'EN' ? 'Listen Officer' : 'Escuchar Oficial'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQuestionSpanish(!showQuestionSpanish)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs border border-stone-300"
                        >
                          <Languages className="w-4 h-4 text-slate-600" />
                          <span>{showQuestionSpanish ? 'Hide ES' : 'Translate ES'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Officer Question Text */}
                    <div className="space-y-2 py-1">
                      <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                        USCIS Q#{currentOralQ?.id} • {selectedLang === 'EN' ? currentOralQ?.subcategoryEn : currentOralQ?.subcategoryEs}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-stone-950 leading-snug">
                        "{currentOralQ?.questionEn}"
                      </h3>
                      {showQuestionSpanish && (
                        <p className="text-sm text-stone-700 italic font-medium pt-1 border-t border-stone-200">
                          {currentOralQ?.questionEs}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Speech Input & Microphone Area */}
                  <div className="bg-white/95 rounded-2xl p-5 border border-amber-900/10 space-y-3 relative z-1 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                        <Mic className="w-4 h-4 text-amber-600" />
                        <span>{selectedLang === 'EN' ? 'Your Oral Response to Officer:' : 'Tu Respuesta Oral al Oficial:'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleToggleSpeechRecognition}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isListening
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-stone-800 hover:bg-stone-900 text-white'
                        }`}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        <span>{isListening ? (selectedLang === 'EN' ? 'Listening...' : 'Escuchando...') : (selectedLang === 'EN' ? 'Speak Mic' : 'Hablar Micrófono')}</span>
                      </button>
                    </div>

                    <textarea
                      value={spokenInputText}
                      onChange={(e) => setSpokenInputText(e.target.value)}
                      placeholder={selectedLang === 'EN' ? 'Click "Speak Mic" to speak, or type your answer in English here...' : 'Haz clic en "Hablar Micrófono" para responder en voz alta, o escribe tu respuesta en inglés aquí...'}
                      rows={2}
                      className="w-full p-3 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0D224A] resize-none"
                    />

                    {!currentEval ? (
                      <button
                        type="button"
                        onClick={handleEvaluateOralResponse}
                        className="w-full py-3 rounded-xl bg-[#0D224A] hover:bg-[#15346e] text-white font-bold text-sm transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>{selectedLang === 'EN' ? 'Submit Oral Response to Officer' : 'Enviar Respuesta Oral al Oficial'}</span>
                      </button>
                    ) : (
                      /* Evaluation Result & Manual Officer Override */
                      <div className="space-y-3 pt-2 animate-fade-in">
                        <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          currentEval.isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950'
                        }`}>
                          <div className="font-extrabold text-sm flex items-center gap-1.5">
                            {currentEval.isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>{selectedLang === 'EN' ? 'Answer Accepted by Officer!' : '¡Respuesta Aceptada por el Oficial!'}</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-amber-600" />
                                <span>{selectedLang === 'EN' ? 'Response Needs Verification' : 'Respuesta Requiere Verificación'}</span>
                              </>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-stone-800">{selectedLang === 'EN' ? 'Accepted Official Answers:' : 'Respuestas Oficiales Aceptadas:'} </span>
                            <span className="font-extrabold text-stone-950">{currentOralQ?.answersEn.join(' • ')}</span>
                          </div>
                        </div>

                        {/* Officer Override Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleManualOverride(true)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              title={selectedLang === 'EN' ? 'Officer Accepts Answer' : 'Oficial Acepta Respuesta'}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{selectedLang === 'EN' ? 'Officer Accepted' : 'Oficial Acepta'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleManualOverride(false)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              title={selectedLang === 'EN' ? 'Officer Rejects Answer' : 'Oficial Rechaza Respuesta'}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{selectedLang === 'EN' ? 'Officer Rejected' : 'Oficial Rechaza'}</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleNextOralQuestion}
                            className="px-5 py-2.5 rounded-xl bg-[#0D224A] hover:bg-[#15346e] text-white font-extrabold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <span>{selectedLang === 'EN' ? 'Next Oral Question' : 'Siguiente Pregunta Oral'}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
