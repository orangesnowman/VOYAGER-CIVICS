import React, { useState, useEffect } from 'react';
import LiveAgent from './components/LiveAgent';

const App: React.FC = () => {
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('mode') === 'widget') {
      setIsWidgetMode(true);
    }
  }, []);

  if (!isWidgetMode) {
    return <LiveAgent isWidgetMode={false} />;
  }

  return (
    <div className="fixed bottom-0 right-0 p-4 z-50 flex flex-col items-end">
        {isWidgetOpen && (
            <div className="mb-4 w-[350px] h-[500px] shadow-2xl origin-bottom-right transition-all">
                <LiveAgent isWidgetMode={true} onClose={() => setIsWidgetOpen(false)} />
            </div>
        )}

        <button 
            onClick={() => setIsWidgetOpen(!isWidgetOpen)}
            className="w-16 h-16 rounded-full bg-neutral-800 border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-110 hover:bg-neutral-750 transition-all duration-300 group"
        >
            {isWidgetOpen ? (
                <svg className="w-8 h-8 text-white group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ) : (
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-20 animate-ping"></div>
                    <svg className="w-8 h-8 text-white group-hover:text-yellow-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                </div>
            )}
        </button>
    </div>
  );
};

export default App;
