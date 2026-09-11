import React, { useState, useRef, useEffect } from 'react';
import { Pause, Play, Send, ChevronDown, Mic, MicOff, Zap, RotateCw, Languages, X } from 'lucide-react';

interface ChatInputBoxProps {
  selectedLang: 'EN' | 'ES';
  isConnected: boolean;
  isPaused?: boolean;
  pause?: () => void;
  resume?: () => void;
  onSubmitText: (text: string) => void;
  value?: string;
  onChangeValue?: (text: string) => void;
  placeholderText?: string;
  onOpenProfile?: () => void;
  isSpanishOnlyMode?: boolean;
  setIsSpanishOnlyMode?: (v: boolean) => void;
  isBilingualMode?: boolean;
  setIsBilingualMode?: (v: boolean) => void;
  isEnglishOnlyMode?: boolean;
  setIsEnglishOnlyMode?: (v: boolean) => void;
  isTranslateMode?: boolean;
  setIsTranslateMode?: (v: boolean) => void;
  isListenOnly?: boolean;
  setIsListenOnly?: (v: boolean) => void;
  isLiveVoiceActive?: boolean;
  onToggleLiveVoice?: () => void;
  isDarkMode?: boolean;
  currentMode?: string;
  onSelectMode?: (modeId: string) => void;
}

export const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  selectedLang,
  isConnected,
  isPaused = false,
  pause,
  resume,
  onSubmitText,
  value,
  onChangeValue,
  placeholderText,
  isSpanishOnlyMode,
  setIsSpanishOnlyMode,
  isBilingualMode,
  setIsBilingualMode,
  isEnglishOnlyMode,
  setIsEnglishOnlyMode,
  isTranslateMode,
  setIsTranslateMode,
  isLiveVoiceActive = false,
  onToggleLiveVoice,
  isDarkMode = true,
  currentMode,
  onSelectMode,
}) => {
  const [internalText, setInternalText] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const initialTextRef = useRef<string>('');

  const currentText = value !== undefined ? value : internalText;

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const updateText = (newText: string) => {
    if (onChangeValue) {
      onChangeValue(newText);
    } else {
      setInternalText(newText);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateText(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = currentText.trim();
    if (!trimmed) return;
    onSubmitText(trimmed);
    updateText('');
    if (isDictating && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsDictating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      if (typeof resume === 'function') resume();
    } else {
      if (typeof pause === 'function') pause();
    }
  };

  const handleSelectModeOption = (modeId: string) => {
    if (onSelectMode) {
      onSelectMode(modeId);
    } else {
      if (modeId === 'SPANISH') {
        setIsSpanishOnlyMode?.(true);
        setIsBilingualMode?.(false);
        setIsEnglishOnlyMode?.(false);
        setIsTranslateMode?.(false);
      } else if (modeId === 'BILINGUAL') {
        setIsSpanishOnlyMode?.(false);
        setIsBilingualMode?.(true);
        setIsEnglishOnlyMode?.(false);
        setIsTranslateMode?.(false);
      } else if (modeId === 'AMERICAN_ENGLISH') {
        setIsSpanishOnlyMode?.(false);
        setIsBilingualMode?.(false);
        setIsEnglishOnlyMode?.(true);
        setIsTranslateMode?.(false);
      } else if (modeId === 'LIVE_TRANSLATOR') {
        setIsSpanishOnlyMode?.(false);
        setIsBilingualMode?.(false);
        setIsEnglishOnlyMode?.(false);
        setIsTranslateMode?.(true);
      }
    }
  };

  const handleDictationToggle = () => {
    if (onToggleLiveVoice) {
      onToggleLiveVoice();
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      setIsDictating(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert(selectedLang === 'EN' ? 'Speech recognition is not supported in this browser.' : 'El reconocimiento de voz no está soportado en este navegador.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang === 'EN' ? 'en-US' : 'es-US';
      initialTextRef.current = currentText;

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
        const base = initialTextRef.current;
        const separator = base && !base.endsWith(' ') && fullSpeech && !fullSpeech.startsWith(' ') ? ' ' : '';
        const transcribed = base + (fullSpeech ? separator + fullSpeech : '');
        updateText(transcribed);
      };

      recognition.onerror = (err: any) => {
        console.warn('Dictation speech recognition error:', err);
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsDictating(true);
    } catch (e) {
      console.warn('Dictation start error:', e);
      setIsDictating(false);
    }
  };

  const placeholder = placeholderText || (selectedLang === 'EN' ? 'Type a message...' : 'Escribe un mensaje...');
  const isListening = isDictating || isLiveVoiceActive;

  // Active mode display text
  const getDisplayBadgeText = () => {
    if (isPaused) return selectedLang === 'EN' ? 'Pausa' : 'Pausa';
    if (currentMode === 'SPANISH' || isSpanishOnlyMode) return 'ES';
    if (currentMode === 'ADAPTIVE') return 'AD';
    if (currentMode === 'BILINGUAL' || isBilingualMode) return 'BI';
    if (currentMode === 'AMERICAN_ENGLISH' || isEnglishOnlyMode) return 'EN';
    if (currentMode === 'LIVE_TRANSLATOR' || isTranslateMode) return 'TR';
    return selectedLang === 'EN' ? 'EN' : 'ES';
  };

  const modesList = [
    {
      id: 'SPANISH',
      nameEs: 'Español',
      nameEn: 'Spanish',
      icon: <span className="font-bold text-xs tracking-tight">ES</span>,
    },
    {
      id: 'ADAPTIVE',
      nameEs: 'Adaptivo',
      nameEn: 'Adaptive',
      icon: <Zap className="w-4 h-4 text-current" />,
    },
    {
      id: 'BILINGUAL',
      nameEs: 'Bilingüe',
      nameEn: 'Bilingual',
      icon: <RotateCw className="w-4 h-4 text-current" />,
    },
    {
      id: 'AMERICAN_ENGLISH',
      nameEs: 'Inglés',
      nameEn: 'English',
      icon: <span className="font-bold text-xs tracking-tight">EN</span>,
    },
    {
      id: 'LIVE_TRANSLATOR',
      nameEs: 'Traductor',
      nameEn: 'Translator',
      icon: <Languages className="w-4 h-4 text-current" />,
    },
  ];

  return (
    <div className={`w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center justify-center gap-1.5 px-2 pt-2 sm:pt-3 pb-1 select-none relative ${isModeMenuOpen ? 'z-50' : 'z-30'}`}>
      {/* Top Mode Indicator & Chevron Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsModeMenuOpen(prev => !prev)}
          className="flex flex-col items-center justify-center text-slate-200 hover:text-[#FFD700] transition-all cursor-pointer active:scale-95 group"
          title={selectedLang === 'EN' ? 'Mode of Interaction' : 'Modo de Interactuar'}
        >
          <span className="text-xs sm:text-sm font-normal tracking-wide text-slate-200 group-hover:text-[#FFD700]">
            {getDisplayBadgeText()}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[#FFD700] transition-transform -mt-0.5 ${isModeMenuOpen ? 'rotate-180 text-[#FFD700]' : 'group-hover:translate-y-0.5'}`} />
        </button>

        {/* Modo de Interactuar Modal Popover */}
        {isModeMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
              onClick={() => setIsModeMenuOpen(false)}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-64 sm:w-72 bg-[#0B172E] border border-slate-700/80 rounded-2xl p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] animate-fade-in flex flex-col text-white text-left ring-1 ring-slate-800">
              {/* Header Title */}
              <div className="px-1 pb-2 mb-1.5 flex items-center justify-between border-b border-slate-800">
                <span className="text-sm font-bold text-white tracking-wide">
                  {selectedLang === 'EN' ? 'Mode of Interaction' : 'Modo de Interactuar'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsModeMenuOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Interaction Modes Options */}
              <div className="flex flex-col gap-1">
                {modesList.map((mode) => {
                  const isSelected = !isPaused && (
                    currentMode ? currentMode === mode.id :
                    (mode.id === 'SPANISH' && isSpanishOnlyMode) ||
                    (mode.id === 'BILINGUAL' && isBilingualMode) ||
                    (mode.id === 'AMERICAN_ENGLISH' && isEnglishOnlyMode) ||
                    (mode.id === 'LIVE_TRANSLATOR' && isTranslateMode)
                  );

                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        if (isPaused && typeof resume === 'function') {
                          resume();
                        }
                        handleSelectModeOption(mode.id);
                        setIsModeMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer font-medium ${
                        isSelected
                          ? 'text-[#FFD700] font-bold bg-amber-400/10 border border-amber-400/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 flex items-center justify-center shrink-0 ${isSelected ? 'text-[#FFD700]' : 'text-slate-300'}`}>
                        {mode.icon}
                      </div>
                      <span className="truncate">{selectedLang === 'EN' ? mode.nameEn : mode.nameEs}</span>
                    </button>
                  );
                })}

                {/* Pausa / Resume Option */}
                <button
                  type="button"
                  onClick={() => {
                    handlePauseToggle();
                    setIsModeMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer font-medium ${
                    isPaused
                      ? 'text-[#FFD700] font-bold bg-amber-400/10 border border-amber-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 text-slate-300">
                    {isPaused ? <Play className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" /> : <Pause className="w-4 h-4 text-slate-300" />}
                  </div>
                  <span className="truncate">
                    {isPaused
                      ? (selectedLang === 'EN' ? 'Resume' : 'Reanudar')
                      : (selectedLang === 'EN' ? 'Pause' : 'Pausa')}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Control Row (Input Pill + Circular Mic Button) */}
      <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 sm:gap-2.5">
        {/* Input Pill */}
        <div className="flex-1 border border-slate-500/50 hover:border-slate-400/80 focus-within:border-slate-300 bg-[#081530]/80 rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2.5 shadow-xl backdrop-blur-md transition-all">
          <button
            type="submit"
            className="text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 -rotate-45 flex items-center justify-center"
            title={selectedLang === 'EN' ? 'Send' : 'Enviar'}
          >
            <Send className="w-4 h-4 text-slate-300 hover:text-white" />
          </button>

          <input
            type="text"
            value={currentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="bg-transparent text-white text-xs sm:text-sm outline-none w-full placeholder-slate-400/90 font-normal"
          />
        </div>

        {/* Circular Microphone Button */}
        <button
          type="button"
          onClick={handleDictationToggle}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-500/50 hover:border-slate-300 bg-[#081530]/80 flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95 shrink-0 group ${
            isListening ? 'border-red-500/80 bg-red-950/80 text-red-400 animate-pulse' : 'text-gray-400 hover:text-white'
          }`}
          title={
            isListening
              ? (selectedLang === 'EN' ? 'Mic Listening (Click to stop)' : 'Micrófono Escuchando (Clic para detener)')
              : (selectedLang === 'EN' ? 'Microphone Dictation' : 'Dictado por Micrófono')
          }
        >
          {isListening ? (
            <MicOff className="w-4 h-4 text-red-400" />
          ) : (
            <Mic className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInputBox;
