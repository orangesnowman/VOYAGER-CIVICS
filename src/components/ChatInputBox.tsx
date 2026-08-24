import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pause, Play, Mic, MicOff, User, ArrowRight, ArrowUp, Square, Type, Headphones, AudioLines, Keyboard, ChevronDown, Delete, CornerDownLeft, RotateCw, Languages } from 'lucide-react';

interface ChatInputBoxProps {
  selectedLang: 'EN' | 'ES';
  isConnected: boolean;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
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
}

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
  selectedLang: 'EN' | 'ES';
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress, onClose, selectedLang }) => {
  const [isShift, setIsShift] = useState(false);
  const [isSymbols, setIsSymbols] = useState(false);

  const numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  const letterRows = isSymbols ? [
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    ['-', '_', '=', '+', '[', ']', '{', '}', '\\', '|'],
    [';', ':', '"', "'", '<', '>', '?', '/', '`', '~']
  ] : [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  return (
    <div className="w-full bg-[#EAEFF2] border-t border-slate-300 p-1 sm:p-1.5 pb-2 select-none shadow-none rounded-none animate-in slide-in-from-bottom duration-200 mt-0">
      {/* Top Bar with Hide Button */}
      <div className="flex justify-between items-center px-2 py-0.5 mb-1 text-slate-500 text-xs">
        <span className="font-semibold tracking-wider text-[10px] uppercase text-slate-600 flex items-center gap-1"></span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
          title={selectedLang === 'EN' ? 'Hide keyboard' : 'Ocultar teclado'}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Number Row */}
      <div className="flex justify-center gap-1 mb-1">
        {numberRow.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onKeyPress(num)}
            className="flex-1 max-w-[36px] h-8 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-300 rounded-md text-slate-800 font-semibold text-sm shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Row 1 Letters/Symbols */}
      <div className="flex justify-center gap-1 mb-1">
        {letterRows[0].map((char) => {
          const display = isShift ? char.toUpperCase() : char;
          return (
            <button
              key={char}
              type="button"
              onClick={() => {
                onKeyPress(display);
                if (isShift) setIsShift(false);
              }}
              className="flex-1 max-w-[36px] h-8 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-300 rounded-md text-slate-800 font-medium text-base shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              {display}
            </button>
          );
        })}
      </div>

      {/* Row 2 Letters/Symbols */}
      <div className="flex justify-center gap-1 mb-1 px-1">
        {letterRows[1].map((char) => {
          const display = isShift ? char.toUpperCase() : char;
          return (
            <button
              key={char}
              type="button"
              onClick={() => {
                onKeyPress(display);
                if (isShift) setIsShift(false);
              }}
              className="flex-1 max-w-[36px] h-8 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-300 rounded-md text-slate-800 font-medium text-base shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              {display}
            </button>
          );
        })}
      </div>

      {/* Row 3 Letters with Shift and Backspace */}
      <div className="flex justify-center gap-1 mb-1">
        {!isSymbols && (
          <button
            type="button"
            onClick={() => setIsShift(!isShift)}
            className={`px-2 sm:px-2.5 h-8 sm:h-9 rounded-md font-bold text-xs shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
              isShift ? 'bg-[#1A365D] text-white' : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
            }`}
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {letterRows[2].map((char) => {
          const display = isShift ? char.toUpperCase() : char;
          return (
            <button
              key={char}
              type="button"
              onClick={() => {
                onKeyPress(display);
                if (isShift) setIsShift(false);
              }}
              className="flex-1 max-w-[36px] h-8 sm:h-9 bg-white hover:bg-slate-100 active:bg-slate-300 rounded-md text-slate-800 font-medium text-base shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              {display}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onKeyPress('BACKSPACE')}
          className="px-2 sm:px-2.5 h-8 sm:h-9 bg-slate-300 hover:bg-slate-400 active:bg-slate-500 text-slate-700 rounded-md font-bold text-xs shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-center gap-1 sm:gap-1.5 items-center">
        <button
          type="button"
          onClick={() => setIsSymbols(!isSymbols)}
          className="px-2.5 sm:px-3 h-8 sm:h-9 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold text-xs rounded-md shadow-none flex items-center justify-center cursor-pointer"
        >
          {isSymbols ? 'ABC' : '?123'}
        </button>

        <button
          type="button"
          onClick={() => onKeyPress(',')}
          className="w-8 sm:w-9 h-8 sm:h-9 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-base rounded-md shadow-none flex items-center justify-center cursor-pointer"
        >
          ,
        </button>

        <button
          type="button"
          onClick={() => onKeyPress(' ')}
          className="flex-1 h-8 sm:h-9 bg-white hover:bg-slate-100 text-slate-500 font-medium text-xs rounded-md shadow-none flex items-center justify-center cursor-pointer tracking-wider"
        >
          {selectedLang === 'EN' ? 'space' : 'espacio'}
        </button>

        <button
          type="button"
          onClick={() => onKeyPress('.')}
          className="w-8 sm:w-9 h-8 sm:h-9 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-base rounded-md shadow-none flex items-center justify-center cursor-pointer"
        >
          .
        </button>

        <button
          type="button"
          onClick={() => onKeyPress('ENTER')}
          className="px-3 sm:px-3.5 h-8 sm:h-9 bg-[#10B981] hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
        >
          <CornerDownLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

export const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  selectedLang,
  isConnected,
  isPaused,
  pause,
  resume,
  onSubmitText,
  value,
  onChangeValue,
  placeholderText,
  onOpenProfile,
  isSpanishOnlyMode,
  setIsSpanishOnlyMode,
  isBilingualMode,
  setIsBilingualMode,
  isEnglishOnlyMode,
  setIsEnglishOnlyMode,
  isTranslateMode,
  setIsTranslateMode,
  isListenOnly,
  setIsListenOnly,
  isLiveVoiceActive,
  onToggleLiveVoice
}) => {
  const [internalText, setInternalText] = useState('');
  const [activeMode, setActiveMode] = useState<'ESCUCHA' | 'DICTA' | 'ESCRIBE'>('ESCUCHA');
  const [isListening, setIsListening] = useState(false);
  const [isEscribeActive, setIsEscribeActive] = useState(false);
  const [showVoiceModeMenu, setShowVoiceModeMenu] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setShowVirtualKeyboard(window.innerWidth < 768);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animated sound graph waveform state
  const [waveformHeights, setWaveformHeights] = useState<number[]>(
    Array.from({ length: 16 }, () => 20)
  );

  const currentText = value !== undefined ? value : internalText;

  // Vibrating sound graph effect during dictation
  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setWaveformHeights(
          Array.from({ length: 16 }, (_, i) => {
            const centerDist = Math.abs(i - 8) / 8;
            const baseFactor = Math.max(0.25, 1 - centerDist * 0.55);
            const randomHeight = Math.floor(Math.random() * 80) + 20;
            return Math.round(randomHeight * baseFactor);
          })
        );
      }, 75);
    } else {
      setWaveformHeights(Array.from({ length: 16 }, () => 20));
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const updateText = (newVal: string) => {
    if (onChangeValue) {
      onChangeValue(newVal);
    } else {
      setInternalText(newVal);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    updateText(val);
    if (isListening) {
      baseTextRef.current = val;
    }
  };

  // Auto-resize textarea height as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 110)}px`;
    }
  }, [currentText]);

  // Setup Web Speech Recognition for continuous dictation
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang === 'EN' ? 'en-US' : 'es-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const prefix = baseTextRef.current;
        const separator = prefix && !prefix.endsWith(' ') && !transcript.startsWith(' ') ? ' ' : '';
        const combined = prefix + separator + transcript;
        updateText(combined);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Error instantiating SpeechRecognition:', err);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [selectedLang]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(selectedLang === 'EN' 
        ? 'Voice dictation is not supported in this browser. You can type your message.' 
        : 'La dictación por voz no es compatible con este navegador. Puedes escribir tu mensaje.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      if (isConnected && !isPaused) {
        pause();
      }
      baseTextRef.current = currentText;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = selectedLang === 'EN' ? 'en-US' : 'es-US';
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.warn('Failed to start speech recognition:', e);
          setIsListening(false);
        }
      }
    }
  };

  const handleEscuchaClick = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
    setIsEscribeActive(false);
    setActiveMode('ESCUCHA');
    if (isConnected && isPaused) {
      resume();
    }
    if (onToggleLiveVoice) {
      onToggleLiveVoice();
    }
  };

  const handleDictaClick = () => {
    setActiveMode('DICTA');
    if (isConnected && !isPaused) {
      pause();
    }
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      toggleListening();
    }
  };

  const handleVirtualKeyPress = (key: string) => {
    if (key === 'BACKSPACE') {
      updateText(currentText.slice(0, -1));
    } else if (key === 'ENTER') {
      handleSubmit();
    } else {
      updateText(currentText + key);
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleEscribeClick = () => {
    setActiveMode('ESCRIBE');
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    }
    setIsEscribeActive(true);
    setShowVirtualKeyboard(prev => !prev);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handlePausaClick = () => {
    if (!isConnected) return;
    if (isPaused) {
      resume();
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } else {
      pause();
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }

    const trimmedText = (currentText || '').trim();
    if (!trimmedText) {
      return;
    }

    if (isConnected && isPaused) {
      resume();
    }
    onSubmitText(trimmedText);
    updateText('');
    setActiveMode('ESCUCHA');
    setIsEscribeActive(false);
    setShowVirtualKeyboard(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const defaultPlaceholder = isListening
    ? (selectedLang === 'EN' ? 'Listening... speak now' : 'Escuchando... habla ahora')
    : (selectedLang === 'EN' ? 'Write or dictate...' : 'Escribe o dicta...');

  return isLiveVoiceActive ? null : (
    <div className="flex-shrink-0 px-2 sm:px-3 pt-2 pb-2 md:pb-2.5 bg-transparent flex flex-col items-center w-full select-none">
      <form 
        onSubmit={handleSubmit} 
        className={`w-full max-w-full sm:max-w-[92%] mx-auto relative rounded-[22px] rounded-tr-none transition-all bg-white border-[5px] ${
          isListening 
            ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
            : 'border-cyan-400 shadow-sm hover:shadow-md'
        } px-3.5 py-2 flex items-center gap-2 min-h-[44px]`}
      >
        {/* Textarea or Sound Graph + Action Controls */}
        <div className="flex items-center gap-2 flex-1 min-h-[36px]">
          {/* Voice Mode Selector (+) Button & Popover */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowVoiceModeMenu((prev) => !prev)}
              title={selectedLang === 'EN' ? 'Voice mode selector' : 'Seleccionar modo de voz'}
              className={`p-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${
                showVoiceModeMenu
                  ? 'bg-[#1A365D] text-white shadow-md scale-105 rotate-45'
                  : 'bg-neutral-100 text-neutral-600 hover:text-[#1A365D] hover:bg-neutral-200 active:scale-95'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.8]" />
            </button>

            {/* Voice Mode Popover Menu */}
            {showVoiceModeMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowVoiceModeMenu(false)} 
                />
                <div className="absolute left-0 bottom-full mb-2 bg-[#0B1B3D]/95 border border-[#EAB308]/40 backdrop-blur-xl rounded-2xl p-2 shadow-2xl w-56 z-50 animate-fade-in flex flex-col text-white">
                  {/* List of Voice Modes */}
                  <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                    {[
                      {
                        id: 'spanish',
                        label: 'Español',
                        iconType: 'text',
                        badgeText: 'ES',
                        active: !!isSpanishOnlyMode,
                        activate: () => {
                          setIsSpanishOnlyMode?.(true);
                          if (isPaused) resume();
                        }
                      },
                      {
                        id: 'bilingual',
                        label: 'Bilingüe',
                        iconType: 'icon',
                        icon: RotateCw,
                        active: !!isBilingualMode,
                        activate: () => {
                          setIsBilingualMode?.(true);
                          if (isPaused) resume();
                        }
                      },
                      {
                        id: 'english',
                        label: 'Inglés',
                        iconType: 'text',
                        badgeText: 'EN',
                        active: !!isEnglishOnlyMode,
                        activate: () => {
                          setIsEnglishOnlyMode?.(true);
                          if (isPaused) resume();
                        }
                      },
                      {
                        id: 'translate',
                        label: 'Traductor',
                        iconType: 'icon',
                        icon: Languages,
                        active: !!isTranslateMode,
                        activate: () => {
                          setIsTranslateMode?.(true);
                          if (isPaused) resume();
                        }
                      },
                      {
                        id: 'pause',
                        label: 'Pausa',
                        iconType: 'icon',
                        icon: Pause,
                        active: !!isPaused,
                        activate: () => {
                          if (isPaused) {
                            resume();
                          } else {
                            pause();
                          }
                        }
                      }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          m.activate();
                          setShowVoiceModeMenu(false);
                        }}
                        className={`w-full flex items-center p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                          m.active
                            ? 'bg-[#EAB308]/15 text-[#EAB308]'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            {m.iconType === 'text' ? (
                              <span className={`font-bold text-xs leading-none tracking-tight ${m.active ? 'text-[#EAB308]' : 'text-white/70'}`}>
                                {m.badgeText}
                              </span>
                            ) : (
                              <m.icon className={`w-4 h-4 shrink-0 ${m.active ? 'text-[#EAB308]' : 'text-white/70'}`} />
                            )}
                          </div>
                          <span className={`text-[15px] leading-tight whitespace-nowrap tracking-normal ${
                            m.active ? 'font-bold text-[#EAB308]' : 'font-normal'
                          }`}>
                            {m.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Listening Waveform Indicator (Onda Visualizer) - visible when isListening is true */}
          {isListening && (
            <div className="flex-shrink-0 flex items-center justify-center h-[28px] px-2 bg-emerald-50 rounded-full border border-emerald-300/80 shadow-inner">
              <div className="flex items-center justify-center gap-[2.5px] h-[20px] w-[42px]">
                {waveformHeights.slice(0, 8).map((h, idx) => (
                  <span
                    key={idx}
                    style={{ height: `${Math.max(20, h)}%` }}
                    className="w-[2.5px] bg-emerald-500 rounded-full transition-all duration-75 ease-out shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Text Area for real-time transcription and typing */}
          <div className="relative flex-1 flex items-center min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={currentText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onClick={() => {
                setActiveMode('ESCRIBE');
                setIsEscribeActive(true);
                setShowVirtualKeyboard(true);
              }}
              onFocus={() => {
                setActiveMode('ESCRIBE');
                setIsEscribeActive(true);
                setShowVirtualKeyboard(true);
              }}
              inputMode="text"
              placeholder={placeholderText || defaultPlaceholder}
              style={{ fontFamily: '"Raleway", sans-serif', fontWeight: 600 }}
              className="w-full focus:outline-none transition-all border-none bg-transparent text-black text-right placeholder:text-right placeholder:text-black/40 font-semibold text-[14px] leading-snug p-0 resize-none min-h-[28px] max-h-[100px] overflow-y-auto pr-1"
            />
            {/* Blinking Caret / "I" Beam Indicator when ESCRIBE is active and empty */}
            {isEscribeActive && !currentText && !isListening && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pointer-events-none pr-0.5">
                <span className="w-[2px] h-[16px] bg-blue-600 animate-pulse inline-block" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
            {/* Primary Action Button: Mic -> Square (Stop) -> ArrowUp (Send) */}
            {isListening ? (
              <button
                type="button"
                onClick={handleDictaClick}
                title={selectedLang === 'EN' ? 'Stop dictating' : 'Detener dictado'}
                className="p-1.5 rounded-full bg-red-600 text-white shadow-md shadow-red-500/40 animate-pulse scale-105 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current stroke-none text-white" />
              </button>
            ) : currentText.trim().length > 0 ? (
              <button
                type="submit"
                onClick={handleSubmit}
                title={selectedLang === 'EN' ? 'Send message to Voyager' : 'Enviar mensaje a Voyager'}
                className="p-1.5 rounded-full bg-[#5A8DF8] hover:bg-blue-600 text-white shadow-md active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.8]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDictaClick}
                title={selectedLang === 'EN' ? 'Dictate with voice' : 'Dictar por voz'}
                className="p-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:text-[#1A365D] hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                <Mic className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            {/* Secondary Button: Voice interaction mode (Go Live) */}
            <button
              type="button"
              onClick={handleEscuchaClick}
              title={selectedLang === 'EN' ? 'Go Live Voice Mode (ChatGPT style)' : 'Modo de Voz en Vivo (Estilo ChatGPT)'}
              className={`p-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${
                isLiveVoiceActive
                  ? 'bg-amber-500 text-black shadow-lg scale-110 animate-pulse ring-2 ring-amber-300'
                  : activeMode === 'ESCUCHA' && isConnected && !isPaused
                  ? 'bg-[#1A365D] text-white shadow-md scale-105'
                  : 'bg-neutral-100 text-neutral-600 hover:text-[#1A365D] hover:bg-neutral-200 active:scale-95'
              }`}
            >
              <AudioLines className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </form>

      {/* Virtual Soft Keyboard Drawer for Smartphones / Touch Screens */}
      {showVirtualKeyboard && (
        <div className="w-full -mx-2 sm:-mx-3 -mb-2 md:-mb-2.5 mt-1">
          <VirtualKeyboard
            onKeyPress={handleVirtualKeyPress}
            onClose={() => setShowVirtualKeyboard(false)}
            selectedLang={selectedLang}
          />
        </div>
      )}
    </div>
  );
};

