import React, { useState } from 'react';
import { NYC_SUBWAY_INFO, NYC_LANDMARKS, Landmark, SubwayLine, SubwayTerm } from '../constants';
import { Train, Info, BookOpen, MapPin, Landmark as LandmarkIcon, CreditCard, ExternalLink, HelpCircle } from 'lucide-react';

interface SubwayGuideProps {
  selectedLang: 'EN' | 'ES';
  onSelectStation: (station: Landmark) => void;
  onAskVoyager: (text: string) => void;
}

export const SubwayGuide: React.FC<SubwayGuideProps> = ({ selectedLang, onSelectStation, onAskVoyager }) => {
  const [activeSubTab, setActiveSubTab] = useState<'lines' | 'vocab' | 'tips'>('lines');
  const [selectedLine, setSelectedLine] = useState<SubwayLine | null>(NYC_SUBWAY_INFO.lines[0]);
  const [selectedVocab, setSelectedVocab] = useState<SubwayTerm | null>(NYC_SUBWAY_INFO.vocabulary[0]);
  const [quizTerm, setQuizTerm] = useState<SubwayTerm | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<'en' | 'es'>('en');
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);

  const startRandomQuiz = () => {
    const randomIndex = Math.floor(Math.random() * NYC_SUBWAY_INFO.vocabulary.length);
    const term = NYC_SUBWAY_INFO.vocabulary[randomIndex];
    const coinFlip = Math.random() > 0.5;
    setQuizTerm(term);
    setQuizAnswer(coinFlip ? 'en' : 'es');
    setShowQuizAnswer(false);
  };

  // Get color styles for subway lines
  const getLineColorClass = (color: string) => {
    switch (color.toLowerCase()) {
      case 'red': return 'bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.5)]';
      case 'blue': return 'bg-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.5)]';
      case 'green': return 'bg-emerald-600 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'purple': return 'bg-purple-600 text-white shadow-[0_0_8px_rgba(147,51,234,0.5)]';
      case 'grey': return 'bg-neutral-500 text-white shadow-[0_0_8px_rgba(115,115,115,0.5)]';
      case 'yellow': return 'bg-yellow-400 text-black shadow-[0_0_8px_rgba(250,204,21,0.5)]';
      default: return 'bg-neutral-600 text-white';
    }
  };

  const getLineBorderClass = (color: string) => {
    switch (color.toLowerCase()) {
      case 'red': return 'border-red-600/30';
      case 'blue': return 'border-blue-600/30';
      case 'green': return 'border-emerald-600/30';
      case 'purple': return 'border-purple-600/30';
      case 'grey': return 'border-neutral-500/30';
      case 'yellow': return 'border-yellow-400/30';
      default: return 'border-neutral-600/30';
    }
  };

  const subwayStations = NYC_LANDMARKS.filter(landmark => landmark.category === 'station');

  return (
    <div className="w-full h-full flex flex-col bg-black/45 border border-white/10 rounded-2xl p-4 font-sans text-white overflow-hidden max-h-[380px] md:max-h-[440px]">
      
      {/* Sub Tabs */}
      <div className="flex border-b border-white/10 pb-2 mb-3 gap-1">
        <button
          onClick={() => setActiveSubTab('lines')}
          className={`flex-1 py-1 px-2 text-[10px] font-mono font-bold tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all uppercase cursor-pointer ${
            activeSubTab === 'lines' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Train className="w-3.5 h-3.5" />
          {selectedLang === 'EN' ? 'Lines & Hubs' : 'Líneas y Hubs'}
        </button>
        <button
          onClick={() => setActiveSubTab('vocab')}
          className={`flex-1 py-1 px-2 text-[10px] font-mono font-bold tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all uppercase cursor-pointer ${
            activeSubTab === 'vocab' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          {selectedLang === 'EN' ? 'Subway Vocab' : 'Vocabulario'}
        </button>
        <button
          onClick={() => setActiveSubTab('tips')}
          className={`flex-1 py-1 px-2 text-[10px] font-mono font-bold tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all uppercase cursor-pointer ${
            activeSubTab === 'tips' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          {selectedLang === 'EN' ? 'Fares & Tips' : 'Tarifas y Tips'}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[290px] md:max-h-[350px]">
        
        {/* SUB-TAB: LINES */}
        {activeSubTab === 'lines' && (
          <div className="space-y-4 animate-fade-in">
            {/* Horizontal list of line bubbles */}
            <div className="space-y-1.5">
              <span className="block text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                {selectedLang === 'EN' ? 'Select a Line to Inspect Stop List' : 'Selecciona una línea para ver paradas'}
              </span>
              <div className="flex flex-wrap gap-1.5 py-1">
                {NYC_SUBWAY_INFO.lines.map((line) => (
                  <button
                    key={line.code}
                    onClick={() => setSelectedLine(line)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer select-none active:scale-90 ${getLineColorClass(line.color)} ${
                      selectedLine?.code === line.code ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {line.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Stop Details */}
            {selectedLine && (
              <div className={`p-3 bg-black/30 border rounded-xl space-y-2 ${getLineBorderClass(selectedLine.color)}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getLineColorClass(selectedLine.color)}`}>
                    {selectedLine.code}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{selectedLine.name}</h4>
                    <p className="text-[9px] text-neutral-400 font-mono">Color: {selectedLine.color}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] font-mono text-yellow-500 font-bold uppercase tracking-wider">
                    {selectedLang === 'EN' ? 'Major Connection Stops:' : 'Estaciones Principales de Conexión:'}
                  </p>
                  <div className="flex flex-wrap gap-1 text-[9px]">
                    {selectedLine.stations.map((station, idx) => (
                      <span key={idx} className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md font-medium text-neutral-200">
                        {station}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Hub Stations Map trigger */}
            <div className="space-y-2 border-t border-white/5 pt-2">
              <span className="block text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                {selectedLang === 'EN' ? 'Major Subway Interchange Hubs' : 'Grandes Centros de Conexión'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {subwayStations.map((station) => (
                  <div key={station.id} className="p-2 bg-neutral-900/60 border border-white/5 rounded-xl flex flex-col justify-between hover:border-yellow-500/35 transition-all text-left">
                    <div>
                      <h5 className="text-[10px] font-bold text-white line-clamp-1">{selectedLang === 'EN' ? station.name : station.nameEs}</h5>
                      <p className="text-[8px] text-neutral-400 line-clamp-1 mt-0.5">
                        {selectedLang === 'EN' ? station.descriptionEn : station.descriptionEs}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                      <button
                        onClick={() => onSelectStation(station)}
                        className="text-[8px] font-mono font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-0.5 uppercase cursor-pointer"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        {selectedLang === 'EN' ? 'Show Map' : 'Ver Mapa'}
                      </button>
                      <button
                        onClick={() => onAskVoyager(selectedLang === 'EN' ? `Tell me about the ${station.name} and which lines connect there.` : `Cuéntame sobre la estación ${station.nameEs} y qué líneas conectan ahí.`)}
                        className="text-[8px] font-mono font-bold text-neutral-400 hover:text-white uppercase cursor-pointer"
                      >
                        {selectedLang === 'EN' ? 'Ask Info' : 'Preguntar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB: VOCABULARY */}
        {activeSubTab === 'vocab' && (
          <div className="space-y-4 animate-fade-in">
            {/* Vocabulary Grid */}
            <div className="space-y-1.5">
              <span className="block text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                {selectedLang === 'EN' ? 'Transit Vocabulary List' : 'Vocabulario de Transporte'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {NYC_SUBWAY_INFO.vocabulary.map((vocab) => (
                  <button
                    key={vocab.en}
                    onClick={() => setSelectedVocab(vocab)}
                    className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer text-xs select-none ${
                      selectedVocab?.en === vocab.en 
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400 font-bold' 
                      : 'bg-black/30 border-white/5 text-neutral-300 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{vocab.en}</span>
                      <span className="text-[8px] text-neutral-500 truncate text-right font-mono ml-1">{vocab.es}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Vocabulary Detail */}
            {selectedVocab && (
              <div className="p-3 bg-neutral-900/80 border border-yellow-500/20 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                      {selectedVocab.en}
                    </h4>
                    <p className="text-[10px] text-neutral-400 font-mono italic">Spanish: {selectedVocab.es}</p>
                  </div>
                  <button
                    onClick={() => onAskVoyager(selectedLang === 'EN' ? `Teach me how to use the word "${selectedVocab.en}" in a sentence when navigating the subway!` : `¡Enséñame cómo usar la palabra "${selectedVocab.en}" (${selectedVocab.es}) en una oración para viajar en metro!`)}
                    className="px-2 py-0.5 bg-yellow-500 hover:bg-yellow-600 text-black rounded-md text-[8px] font-bold uppercase transition-all cursor-pointer"
                  >
                    {selectedLang === 'EN' ? 'Practice word' : 'Practicar palabra'}
                  </button>
                </div>
                <div className="text-[10px] space-y-1 text-neutral-300 leading-relaxed border-t border-white/5 pt-1.5">
                  <p><strong className="text-neutral-500">EN:</strong> {selectedVocab.definitionEn}</p>
                  <p><strong className="text-neutral-500">ES:</strong> {selectedVocab.definitionEs}</p>
                </div>
              </div>
            )}

            {/* Study Quiz Box */}
            <div className="p-3 bg-yellow-950/20 border border-yellow-500/20 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-mono font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {selectedLang === 'EN' ? 'Bilingual Flashcard Quiz' : 'Quiz de Tarjetas Bilingües'}
                </h5>
                <button
                  onClick={startRandomQuiz}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[8px] font-bold uppercase cursor-pointer"
                >
                  {quizTerm ? (selectedLang === 'EN' ? 'Next Card' : 'Siguiente') : (selectedLang === 'EN' ? 'Start Quiz' : 'Empezar Quiz')}
                </button>
              </div>

              {quizTerm ? (
                <div className="space-y-2 text-center py-1">
                  <p className="text-[9px] text-neutral-400 font-mono">
                    {selectedLang === 'EN' 
                      ? `What is the ${quizAnswer === 'en' ? 'Spanish' : 'English'} translation for:` 
                      : `¿Cuál es la traducción al ${quizAnswer === 'en' ? 'español' : 'inglés'} de:`}
                  </p>
                  <p className="text-base font-bold text-white uppercase tracking-wider">
                    {quizAnswer === 'en' ? quizTerm.en : quizTerm.es}
                  </p>

                  {showQuizAnswer ? (
                    <div className="space-y-1.5 pt-1 border-t border-white/5 animate-fade-in">
                      <p className="text-xs font-bold text-yellow-400 uppercase">
                        {quizAnswer === 'en' ? quizTerm.es : quizTerm.en}
                      </p>
                      <p className="text-[9px] text-neutral-300 leading-tight italic px-2">
                        {selectedLang === 'EN' ? quizTerm.definitionEn : quizTerm.definitionEs}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowQuizAnswer(true)}
                      className="w-full py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer"
                    >
                      {selectedLang === 'EN' ? 'Reveal Answer' : 'Revelar Respuesta'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-neutral-400 text-center py-2 italic">
                  {selectedLang === 'EN' ? 'Click "Start Quiz" to test your vocabulary!' : '¡Haz clic en "Empezar Quiz" para probar tu vocabulario!'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* SUB-TAB: FARES & TIPS */}
        {activeSubTab === 'tips' && (
          <div className="space-y-4 animate-fade-in">
            {/* Fares & Payments */}
            <div className="p-3 bg-neutral-900/80 border border-white/5 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono text-yellow-500">
                <CreditCard className="w-3.5 h-3.5" />
                {selectedLang === 'EN' ? 'Fare & Fares Info' : 'Tarifas y Pago'}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed text-neutral-300">
                <div className="space-y-1 border-r border-white/5 pr-2">
                  <p className="text-[9px] text-neutral-500 font-mono uppercase">{selectedLang === 'EN' ? 'Single Ride Fare' : 'Tarifa Sencilla'}</p>
                  <p className="text-lg font-bold text-white">{NYC_SUBWAY_INFO.farePrice}</p>
                  <p className="text-[9px] text-neutral-400">
                    {selectedLang === 'EN' ? 'Children under 44" ride free with an adult.' : 'Niños menores de 44 pulgadas viajan gratis con adulto.'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] text-neutral-500 font-mono uppercase">{selectedLang === 'EN' ? 'Payment Modes' : 'Medios de Pago'}</p>
                  <div className="space-y-1 text-[9px]">
                    {NYC_SUBWAY_INFO.paymentMethods.map((method, idx) => (
                      <p key={idx} className="flex items-start gap-1">
                        <span className="text-yellow-500">•</span>
                        <span>{method}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* OMNY Cap Callout */}
            <div className="p-3 bg-gradient-to-r from-emerald-950/20 to-teal-950/20 border border-emerald-500/20 rounded-xl space-y-1">
              <h4 className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-mono">
                <span>🌟 OMNY Fare Cap: $34 Weekly Limit</span>
              </h4>
              <p className="text-[9px] text-neutral-300 leading-relaxed">
                {selectedLang === 'EN' 
                  ? "Tap to ride 12 times in a single week (Monday to Sunday) with the exact same phone or card, and all subsequent rides that week are completely free! Perfect for tourists!"
                  : "¡Viaja 12 veces en una semana (lunes a domingo) pagando con el mismo móvil o tarjeta y todos los siguientes trayectos serán gratis! ¡Ideal para turistas!"}
              </p>
            </div>

            {/* Local Transit Tips */}
            <div className="space-y-2">
              <span className="block text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                {selectedLang === 'EN' ? 'Expert NYC Subway Tips' : 'Tips de Expertos del Metro de NYC'}
              </span>
              <ul className="space-y-1.5 text-[10px] text-neutral-300">
                {(selectedLang === 'EN' ? NYC_SUBWAY_INFO.tipsEn : NYC_SUBWAY_INFO.tipsEs).map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-neutral-900/40 p-2 rounded-lg border border-white/5">
                    <span className="text-yellow-500 font-bold">0{idx + 1}.</span>
                    <span className="leading-normal">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
