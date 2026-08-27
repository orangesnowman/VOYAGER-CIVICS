export type ConversationMode = 'AMERICAN_ENGLISH' | 'SPANISH' | 'BILINGUAL' | 'LIVE_TRANSLATOR' | 'LISTEN_ONLY' | 'ENGLISH_ASSESSMENT' | 'ADAPTIVE';

export interface ModeDefinition {
  id: ConversationMode;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  systemMessage: string;
  systemMessageEnd: string;
  chatInfoMessageEn: string;
  chatInfoMessageEs: string;
}

export const CONVERSATION_MODES: Record<ConversationMode, ModeDefinition> = {
  AMERICAN_ENGLISH: {
    id: 'AMERICAN_ENGLISH',
    nameEn: 'IMMERSION',
    nameEs: 'INGLÉS',
    descriptionEn: 'Pure immersion practice. Speaks only in English.',
    descriptionEs: 'Práctica de inmersión pura. Habla únicamente en inglés.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. Do NOT give an intro or explanation of how this mode works. Announce the mode change briefly aloud by saying strictly 'Modo inglés' (or 'English mode'). Speak strictly in English. Do NOT say 'Understood' or 'Entendido'.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Announce the mode change briefly aloud by saying strictly 'Modo inglés' (or 'English mode'). Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ English Only Mode active: Speaks strictly in English for advanced practice.',
    chatInfoMessageEs: 'ℹ️ Modo Solo Inglés activo: Habla strictly en inglés para práctica avanzada.'
  },
  SPANISH: {
    id: 'SPANISH',
    nameEn: 'SPANISH',
    nameEs: 'ESPAÑOL',
    descriptionEn: 'Conversation purely in Spanish.',
    descriptionEs: 'Conversación puramente en español.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. Do NOT give an intro or explanation of how this mode works. Announce the mode change briefly aloud by saying strictly 'Modo español'. Speak strictly in Spanish. Do NOT say 'Understood' or 'Entendido'.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Announce the mode change briefly aloud by saying strictly 'Modo español'. Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ Spanish Only Mode active: Converses with you strictly in Spanish.',
    chatInfoMessageEs: 'ℹ️ Modo Solo Español activo: Conversa contigo estrictamente en español.'
  },
  BILINGUAL: {
    id: 'BILINGUAL',
    nameEn: 'BILINGUAL',
    nameEs: 'BILINGÜE',
    descriptionEn: 'Responds first in Spanish, then repeats in English.',
    descriptionEs: 'Responde primero en español y repite en inglés.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. Do NOT give an intro or explanation of how this mode works. Announce the mode change briefly aloud by saying strictly 'Modo bilingüe' (or 'Bilingual mode'). Respond in Spanish first, then repeat in English. Do NOT say 'Understood' or 'Entendido'.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Announce the mode change briefly aloud by saying strictly 'Modo bilingüe' (or 'Bilingual mode'). Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ Bilingual Mode active: Responds in Spanish and repeats in English.',
    chatInfoMessageEs: 'ℹ️ Modo Bilingüe activo: Responderá en español y lo repetirá en inglés.'
  },
  LIVE_TRANSLATOR: {
    id: 'LIVE_TRANSLATOR',
    nameEn: 'TRANSLATE',
    nameEs: 'TRADUCE',
    descriptionEn: 'Instant 1-to-1 speech translation between English and Spanish.',
    descriptionEs: 'Traducción de voz 1-a-1 instantánea entre inglés y español.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. Do NOT give an intro or explanation of how this mode works. Announce the mode change briefly aloud by saying strictly 'Modo traductor' (or 'Translator mode'). Perform 1-to-1 speech translation only (Spanish to English once, English to Spanish once). Do NOT say 'Understood' or 'Entendido'.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Announce the mode change briefly aloud by saying strictly 'Modo traductor' (or 'Translator mode'). Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ Instant Translation Mode active: Translates what you say immediately.',
    chatInfoMessageEs: 'ℹ️ Modo de Traducción Instantánea activo: Traducirá lo que digas de inmediato.'
  },
  LISTEN_ONLY: {
    id: 'LISTEN_ONLY',
    nameEn: 'LISTEN ONLY',
    nameEs: 'ESCUCHA',
    descriptionEn: 'Monitors and offers text tips without speaking.',
    descriptionEs: 'Escucha y ofrece consejos por texto sin hablar.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. Do NOT give an intro or explanation of how this mode works. Announce the mode change briefly aloud by saying strictly 'Modo escucha' (or 'Listen mode'). After this brief 2-word announcement, remain completely silent and respond only via text unless asked '¿Puedo hablar?'. Do NOT say 'Understood' or 'Entendido'.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Announce the mode change briefly aloud by saying strictly 'Modo escucha' (or 'Listen mode'). Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ Monitor mode active: Listening only and will not speak. Feedback will be provided via text.',
    chatInfoMessageEs: 'ℹ️ Modo Escucha activo: Solo escuchará y no hablará. Los comentarios se proporcionarán por texto.'
  },
  ENGLISH_ASSESSMENT: {
    id: 'ENGLISH_ASSESSMENT',
    nameEn: 'ASSESSMENT',
    nameEs: 'EVALUACIÓN',
    descriptionEn: 'Live voice-first diagnostic assessment (A1-C2). Evaluates listening, fluency, vocabulary, grammar, and pronunciation.',
    descriptionEs: 'Evaluación diagnóstica conversacional en vivo (A1-C2). Evalúa escucha, fluidez, vocabulario, gramática y pronunciación.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. English Level Assessment mode active. Conduct a voice-first diagnostic conversation evaluating English ability across stages A1 to C2.]",
    systemMessageEnd: "[SYSTEM MESSAGE: English Level Assessment mode active.]",
    chatInfoMessageEn: '🎯 English Level Assessment Active: Speaking naturally with Voyager to evaluate your proficiency on the A1-C2 scale.',
    chatInfoMessageEs: '🎯 Evaluación de Nivel de Inglés Activa: Habla naturalmente con Voyager para determinar tu nivel en la escala A1-C2.'
  },
  ADAPTIVE: {
    id: 'ADAPTIVE',
    nameEn: 'ADAPTIVE',
    nameEs: 'ADAPTIVO',
    descriptionEn: 'Flexible interaction. Automatically adapts language, speed, and support based on your conversation.',
    descriptionEs: 'Modo de interacción flexible. Adapta automáticamente el idioma, la velocidad y el apoyo según tus necesidades.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. Adaptive Mode active. Dynamically adapt your language, speed, complexity, and scaffolding based on the learner's responses and confidence. Start in English, provide minimal Spanish support only when needed, and adjust naturally.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Adaptive Mode active.]",
    chatInfoMessageEn: '⚡ Adaptive Mode active: Voyager dynamically adjusts language scaffolding, speed, and complexity based on your responses.',
    chatInfoMessageEs: '⚡ Modo Adaptativo activo: Voyager ajusta dinámicamente el idioma, la velocidad y la complejidad según tus respuestas.'
  }
};
