import { ChatMessage } from './LiveAgentTypes';

export const translations = {
  EN: {
    standby: "EN ESPERA",
    connecting: "Conectando...",
    connect: "ENTER",
    active: "ACTIVO",
    disconnected: "Desconectado",
    session: "Sesión",
    disconnectBtn: "FINALIZAR",
    connectionError: "Error de Conexión",
    howToFix: "How to fix this error:",
    step1: "Open the Settings panel (gear icon) in AI Studio.",
    step2: "Input a valid GEMINI_API_KEY.",
    step3: "Save and retry connecting.",
    interactiveConsole: "Consola Interactiva",
    liveConversation: "Conversación en Vivo",
    leadsBtn: "Lugares Guardados",
    collectLeadBtn: "Añadir Notas de Práctica",
    databaseCapturedLeads: "Historial y Notas de Práctica en EE.UU.",
    backToChat: "Volver al Chat",
    noLeads: "No practice notes saved yet.",
    fillFormTest: "Fill out the notes to save your favorite US daily scenarios and vocabulary learnings.",
    viewSavedTranscript: "Ver Transcripción Guardada",
    askPlaceholder: "Type your query or scenario here...",
    blueprintRegistered: "Practice Plan Saved!",
    proposalSuccessMsg: "Your American immersion practice plan and chat history have been successfully saved to the server database.",
    backToConsole: "Volver al Panel de Voyager",
    secureAgentBlueprint: "Guardar Plan de Práctica",
    requestProposal: "Guardar Registro de Práctica",
    formInstructions: "Enter your details to save your customized American life practice log, scenarios list, and transcript.",
    fullName: "Your Name *",
    fullNamePlaceholder: "e.g. Jane Doe",
    emailAddress: "Email Address *",
    emailPlaceholder: "e.g. jane@example.com",
    company: "Primary Interest",
    companyPlaceholder: "e.g. Shopping, Diner, Language",
    phone: "Mobile Number",
    phonePlaceholder: "e.g. +1 555-0199",
    customReqs: "Practice Notes & Scenario Favorites",
    textareaPlaceholder: "What everyday American scenarios or vocabulary topics do you want to keep in your log?",
    submitBtn: "Guardar Diario de Práctica",
    submittingBtn: "Guardando Diario...",
    nameEmailRequired: "Name and Email are required fields.",
    systemOnline: "Voyager American English Tutor system online.",
    welcomeMsg: "Welcome to USA Voyager! I have set the default mode to Spanish. You can click on the other modes to hear Voyager explain what each one does before starting your practice.",
    endConversation: "FINALIZAR",
    reviewChat: "Califica tu Sesión con Voyager",
    submitReview: "Enviar Calificación",
    reviewPlaceholder: "Tell us how your conversation went...",
    thankYouReview: "Thank you for practicing with Voyager!"
  },
  ES: {
    standby: "EN ESPERA",
    connecting: "Conectando...",
    connect: "ENTRADA",
    active: "ACTIVO",
    disconnected: "Desconectado",
    session: "Sesión",
    disconnectBtn: "FINALIZAR",
    connectionError: "Error de Conexión",
    howToFix: "Cómo solucionar este error:",
    step1: "Abre el panel de Configuración (icono de engranaje) en AI Studio.",
    step2: "Introduce una clave GEMINI_API_KEY válida.",
    step3: "Guarda los cambios y vuelve a intentar la conexión.",
    interactiveConsole: "Consola Interactiva",
    liveConversation: "Conversación en Vivo",
    leadsBtn: "Lugares Guardados",
    collectLeadBtn: "Añadir Notas de Práctica",
    databaseCapturedLeads: "Historial y Notas de Práctica en EE.UU.",
    backToChat: "Volver a la Charla",
    noLeads: "Aún no hay notas de práctica guardadas.",
    fillFormTest: "Completa tus notas para guardar tus escenarios favoritos de EE.UU. y las palabras aprendidas.",
    viewSavedTranscript: "Ver Transcripción Guardada",
    askPlaceholder: "Escribe tu consulta o escenario aquí...",
    blueprintRegistered: "¡Plan de Práctica Registrado!",
    proposalSuccessMsg: "Tu plan de práctica personalizado y tu historial de conversación se han guardado con éxito.",
    backToConsole: "Volver al Panel de Voyager",
    secureAgentBlueprint: "Guardar Plan de Práctica",
    requestProposal: "Guardar Registro de Práctica",
    formInstructions: "Completa tus datos para guardar tu diario de práctica por EE.UU., tu lista de escenarios y tu transcripción de práctica.",
    fullName: "Tu Nombre *",
    fullNamePlaceholder: "ej. Jane Doe",
    emailAddress: "Correo Electrónico *",
    emailPlaceholder: "ej. jane@ejemplo.com",
    company: "Interés Principal",
    companyPlaceholder: "ej. Compras, Diner, Idioma",
    phone: "Número de Teléfono",
    phonePlaceholder: "ej. +1 555-0199",
    customReqs: "Notas de Práctica y Escenarios Favoritos",
    textareaPlaceholder: "¿Qué escenarios o temas de vocabulario deseas mantener en tu diario de práctica?",
    submitBtn: "Guardar Diario de Práctica",
    submittingBtn: "Guardando Diario...",
    nameEmailRequired: "El nombre y el correo electrónico son campos obligatorios.",
    systemOnline: "Sistema Voyager en línea. Tu Tutor de Inglés Americano está listo.",
    welcomeMsg: "¡Bienvenido a USA Voyager! He configurado el modo Español como predeterminado. Puedes hacer clic en los otros modos para que Voyager te explique de qué trata cada uno antes de comenzar tu práctica.",
    endConversation: "FINALIZAR",
    reviewChat: "Califica tu Sesión con Voyager",
    submitReview: "Enviar Calificación",
    reviewPlaceholder: "Cuéntanos sobre tu experiencia de práctica...",
    thankYouReview: "¡Gracias por practicar con Voyager!"
  }
};

export function cleanIncompleteStreamTags(text: string): string {
  const lastOpenBracket = text.lastIndexOf('[');
  const lastCloseBracket = text.lastIndexOf(']');
  
  if (lastOpenBracket !== -1 && lastOpenBracket > lastCloseBracket) {
    return text.substring(0, lastOpenBracket).trim();
  }
  return text;
}

export const getTranslatedMessageText = (msg: ChatMessage, lang: 'EN' | 'ES') => {
  if (msg.id === 'system_1') {
    return translations[lang].systemOnline;
  }
  if (msg.id === 'welcome_1') {
    return translations[lang].welcomeMsg;
  }
  return cleanIncompleteStreamTags(msg.text);
};
