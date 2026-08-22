export type ConversationMode = 'AMERICAN_ENGLISH' | 'SPANISH' | 'BILINGUAL' | 'LIVE_TRANSLATOR' | 'LISTEN_ONLY';

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
    systemMessage: "[SYSTEM MESSAGE: Mode changed. You are now in ENGLISH ONLY MODE. You must speak and write strictly and purely in English. Do NOT provide any Spanish translations, hints, corrections, or bilingual tips. Speak naturally as an American English speaker. This is a pure immersion practice mode for advanced students. Speak only in English. Do NOT say 'Understood' or 'Entendido'.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user that you are now back in normal English tutor mode, teaching American English and offering cultural advice. Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ English Only Mode active: Speaks strictly in English for advanced practice.',
    chatInfoMessageEs: 'ℹ️ Modo Solo Inglés activo: Habla estrictamente en inglés para práctica avanzada.'
  },
  SPANISH: {
    id: 'SPANISH',
    nameEn: 'SPANISH',
    nameEs: 'ESPAÑOL',
    descriptionEn: 'Conversation purely in Spanish.',
    descriptionEs: 'Conversación puramente en español.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. You are now in SPANISH ONLY MODE. You must speak and write strictly and purely in Spanish from now on. Discuss American English culture and language in Spanish. Do NOT teach English, evaluate grammar, or translate any text. Speak only in Spanish. Do NOT say 'Understood' or 'Entendido'.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user that you are now back in normal English tutor mode, teaching American English and offering cultural advice. Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ Spanish Only Mode active: Converses with you strictly in Spanish.',
    chatInfoMessageEs: 'ℹ️ Modo Solo Español activo: Conversa contigo estrictamente en español.'
  },
  BILINGUAL: {
    id: 'BILINGUAL',
    nameEn: 'BILINGUAL',
    nameEs: 'BILINGÜE',
    descriptionEn: 'Responds first in Spanish, then repeats in English.',
    descriptionEs: 'Responde primero en español y repite en inglés.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. You are now in BILINGUAL TRANSLATION MODE. You must immediately speak and write a brief explanation in Spanish (only one warm sentence) explaining what this mode does (that you will say all your responses first in Spanish, and then repeat them in English). Do NOT say 'Understood' or 'Entendido'.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user that you are now back in normal English tutor mode, teaching American English and offering cultural advice. Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ Bilingual Mode active: Responds in Spanish and repeats in English.',
    chatInfoMessageEs: 'ℹ️ Modo Bilingüe activo: Responderá en español y lo repetirá en inglés.'
  },
  LIVE_TRANSLATOR: {
    id: 'LIVE_TRANSLATOR',
    nameEn: 'TRANSLATE',
    nameEs: 'TRADUCE',
    descriptionEn: 'Instant speech translation between English and Spanish.',
    descriptionEs: 'Traducción de voz instantánea entre inglés y español.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. You are now in INSTANT TRANSLATION MODE. From now on, whatever you hear in English, you must translate to Spanish. If the user speaks in Spanish, you must translate to English. Output ONLY the translated words and absolutely nothing else, both in your voice and in your text transcription. Do NOT say 'Understood' or 'Entendido'. In this very first response, translate this message to Spanish: 'Instant Translation Mode is now active. I am ready to translate.']",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user that you are now back in normal English tutor mode, teaching American English and offering cultural advice. Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ Instant Translation Mode active: Translates what you say immediately.',
    chatInfoMessageEs: 'ℹ️ Modo de Traducción Instantánea activo: Traducirá lo que digas de inmediato.'
  },
  LISTEN_ONLY: {
    id: 'LISTEN_ONLY',
    nameEn: 'LISTEN ONLY',
    nameEs: 'ESCUCHA',
    descriptionEn: 'Monitors and offers text tips without speaking.',
    descriptionEs: 'Escucha y ofrece consejos por texto sin hablar.',
    systemMessage: "[SYSTEM MESSAGE: Mode changed. You are now in Monitor/Listen-only mode. However, BEFORE you go fully silent, you MUST immediately speak and write a brief explanation in Spanish (only one warm sentence) explaining what this mode does (that you will listen only and offer tips in the text chat, and won't speak unless given permission). End your sentence by saying that you will now be quiet and listen. Do NOT say 'Understood' or 'Entendido'. after saying this explanation, you must remain silent for subsequent turns and only respond via text unless asked '¿Puedo hablar?'.]",
    systemMessageEnd: "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user you are now back in normal voice mode and will speak and respond normally. Do NOT say 'Understood' or 'Entendido'.]",
    chatInfoMessageEn: 'ℹ️ Monitor mode active: Listening only and will not speak. Feedback will be provided via text.',
    chatInfoMessageEs: 'ℹ️ Modo Escucha activo: Solo escuchará y no hablará. Los comentarios se proporcionarán por texto.'
  }
};
