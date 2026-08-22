import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { ConversationMode } from './ConversationModes';

interface CharlaOpeningSectionProps {
  selectedLang: 'EN' | 'ES';
  activeMode?: ConversationMode;
  onSelectMode?: (mode: ConversationMode) => void;
  onAskVoyager?: (text: string) => void;
  onSpeakExplanation?: (text: string) => void;
}

export const getExplanationText = (mode: ConversationMode): string => {
  switch (mode) {
    case 'BILINGUAL':
      return "En el modo Bilingüe, respondo a tus mensajes en español y luego repito la idea en inglés. La razón de este método es crear un andamiaje cognitivo natural: te permite comprender el significado exacto en tu idioma nativo sin frustración, mientras asocias inmediatamente el vocabulario, la estructura y la pronunciación en inglés para acelerar tu aprendizaje de forma intuitiva.";

    case 'AMERICAN_ENGLISH':
      return "En el modo Inglés, entramos en inmersión total en inglés americano. La fundamentación pedagógica es entrenar a tu cerebro para pensar directamente en inglés, desarrollando fluidez, agilidad auditiva y eliminando la traducción mental.";

    case 'LIVE_TRANSLATOR':
      return "En el modo Traductor, realizo traducción e interpretación simultánea e inmediata de todo lo que escribas o hables. Su objetivo es servir como un puente inmediato cuando necesites saber exactamente cómo expresar una idea en tiempo real.";

    case 'LISTEN_ONLY':
      return "En el modo Escucha, me mantengo en silencio sin intervención hablada mientras escucho tu voz. La razón de este modo es ofrecerte un espacio sin presión para practicar tu fluidez oral, recibiendo correcciones por escrito.";

    case 'SPANISH':
    default:
      return "¡Hola! Soy USA Voyager, tu compañero y tutor de inglés americano. En el modo Español, que es nuestra modalidad predeterminada, nos encontramos en este espacio para conocernos mejor y comenzaremos con algunas preguntas para definir tu perfil de usuario. A partir de ahí, podremos guiarte a lecciones de inglés que se ajusten a tu nivel y a tus intereses.";
  }
};

export const CharlaOpeningSection: React.FC<CharlaOpeningSectionProps> = ({
  selectedLang,
  activeMode: propActiveMode,
  onSelectMode,
  onSpeakExplanation,
}) => {
  const [internalMode, setInternalMode] = useState<ConversationMode>('SPANISH');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeMode = propActiveMode || internalMode;

  const handleModeClick = (mode: ConversationMode) => {
    setInternalMode(mode);
    if (onSelectMode) {
      onSelectMode(mode);
    }
  };

  const modeTabs: { id: ConversationMode; labelEs: string; labelEn: string }[] = [
    { id: 'SPANISH', labelEs: 'ESPAÑOL', labelEn: 'SPANISH' },
    { id: 'BILINGUAL', labelEs: 'BILINGÜE', labelEn: 'BILINGUAL' },
    { id: 'AMERICAN_ENGLISH', labelEs: 'INGLÉS', labelEn: 'ENGLISH' },
    { id: 'LIVE_TRANSLATOR', labelEs: 'TRADUCTOR', labelEn: 'TRANSLATOR' },
    { id: 'LISTEN_ONLY', labelEs: 'ESCUCHA', labelEn: 'LISTEN' },
  ];

  return (
    <div className="bg-transparent text-left mb-4 p-2 md:p-3 transition-all duration-300 animate-fade-in select-none">
      {/* Title + Collapse Toggle */}
      <div className="flex items-center justify-between">
        <h1 
          style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} 
          className="text-3xl sm:text-4xl font-normal tracking-tight text-[#1f2421] flex items-center gap-2.5 sm:gap-3"
        >
          <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 shrink-0" />
          <span>{selectedLang === 'EN' ? 'Charla' : 'La Charla'}</span>
        </h1>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-neutral-500 hover:text-black hover:bg-black/5 rounded-full transition-colors cursor-pointer"
          title={isCollapsed ? (selectedLang === 'EN' ? 'Expand header' : 'Mostrar encabezado') : (selectedLang === 'EN' ? 'Collapse header' : 'Ocultar encabezado')}
        >
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Sub-navigation Mode Tabs */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 my-4 pb-1">
            {modeTabs.map((tab) => {
              const isActive = activeMode === tab.id;
              const label = selectedLang === 'EN' ? tab.labelEn : tab.labelEs;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleModeClick(tab.id)}
                  className="flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none transition-all"
                >
                  {isActive && (
                    <MessageSquare className="w-4 h-4 text-red-600 fill-red-600/10 shrink-0" />
                  )}
                  <span 
                    className={`text-xs md:text-sm tracking-wider uppercase font-sans ${
                      isActive 
                        ? 'text-black font-extrabold' 
                        : 'text-neutral-500 font-bold hover:text-black transition-colors'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};


