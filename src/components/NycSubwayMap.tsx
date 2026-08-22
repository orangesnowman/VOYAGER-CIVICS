import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Map, 
  ArrowRight, 
  Layers, 
  Volume2, 
  Eye, 
  EyeOff, 
  Compass, 
  HelpCircle,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

interface NycSubwayMapProps {
  selectedLang: 'EN' | 'ES';
  onAskVoyager: (text: string) => void;
  onSelectStationOnMap?: (stationName: string, lat: number, lng: number) => void;
}

interface InteractiveStation {
  id: string;
  name: string;
  nameEs: string;
  lines: string[];
  x: number;
  y: number;
  landmarks: string;
  landmarksEs: string;
  descriptionEn: string;
  descriptionEs: string;
  latitude: number;
  longitude: number;
}

const INTERACTIVE_STATIONS: InteractiveStation[] = [
  {
    id: 'columbus_circle',
    name: '59 St - Columbus Circle',
    nameEs: 'Estación de 59 St - Columbus Circle',
    lines: ['1', 'A', 'C', 'B', 'D'],
    x: 170,
    y: 110,
    landmarks: "Central Park West, Lincoln Center, Museum of Arts & Design",
    landmarksEs: "Central Park West, Lincoln Center, Museo de Artes y Diseño",
    descriptionEn: "Located at the southwest corner of Central Park, this major express station connects Uptown Manhattan with the West Side trunk lines.",
    descriptionEs: "Ubicada en la esquina suroeste de Central Park, esta gran estación expresa conecta el norte de Manhattan con las líneas troncales del West Side.",
    latitude: 40.768250,
    longitude: -73.981928
  },
  {
    id: 'times_square',
    name: 'Times Square - 42 St Hub',
    nameEs: 'Terminal Times Square - Calle 42',
    lines: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W'],
    x: 200,
    y: 180,
    landmarks: "Times Square, Broadway Theaters, Madame Tussauds, Bryant Park",
    landmarksEs: "Times Square, Teatros de Broadway, Museo de Cera, Bryant Park",
    descriptionEn: "The most famous and busiest transit complex in NYC. Features free transfers across almost all major Manhattan subway lines.",
    descriptionEs: "El complejo de tránsito más famoso y concurrido de Nueva York. Cuenta con transbordos gratuitos entre casi todas las líneas del metro.",
    latitude: 40.758895,
    longitude: -73.985131
  },
  {
    id: 'grand_central',
    name: 'Grand Central - 42 St',
    nameEs: 'Terminal Grand Central - Calle 42',
    lines: ['4', '5', '6', '7'],
    x: 300,
    y: 180,
    landmarks: "Grand Central Terminal, Chrysler Building, United Nations, Library",
    landmarksEs: "Terminal Grand Central, Edificio Chrysler, Naciones Unidas, Biblioteca",
    descriptionEn: "A magnificent Beaux-Arts railroad terminal. Famous for its astronomical ceiling paint, Whispering Gallery, and easy connection to Metro-North.",
    descriptionEs: "Una magnífica terminal de trenes Beaux-Arts. Famosa por su pintura de techo astronómica, la Galería de los Susurros y conexión a trenes.",
    latitude: 40.752726,
    longitude: -73.977229
  },
  {
    id: 'penn_station',
    name: '34 St - Penn Station Hub',
    nameEs: 'Estación Penn Station - Calle 34',
    lines: ['1', '2', '3', 'A', 'C', 'E'],
    x: 160,
    y: 230,
    landmarks: "Madison Square Garden, Macy's Herald Square, James A. Farley Post Office",
    landmarksEs: "Madison Square Garden, Tienda Macy's, Oficina de Correos Farley",
    descriptionEn: "The busiest train station in North America, connecting regional commuter railroads (LIRR, NJ Transit, Amtrak) with critical subway arteries.",
    descriptionEs: "La estación de trenes más transitada de Norteamérica, conectando ferrocarriles regionales con las arterias más importantes del metro.",
    latitude: 40.750580,
    longitude: -73.991102
  },
  {
    id: 'herald_square',
    name: '34 St - Herald Square',
    nameEs: 'Estación Herald Square - Calle 34',
    lines: ['N', 'Q', 'R', 'W', 'B', 'D', 'F', 'M'],
    x: 240,
    y: 230,
    landmarks: "Empire State Building, Macy's Flagship, Koreatown, Manhattan Mall",
    landmarksEs: "Edificio Empire State, Tienda Principal de Macy's, Barrio Coreano",
    descriptionEn: "A major retail and transit intersection. Convenient access to the iconic Empire State Building and the PATH train system.",
    descriptionEs: "Una de las mayores intersecciones de tiendas y tránsito. Acceso directo al icónico Empire State y al sistema de trenes PATH.",
    latitude: 40.748440,
    longitude: -73.985664
  },
  {
    id: 'canal_street',
    name: 'Canal St Station',
    nameEs: 'Estación de Canal St',
    lines: ['N', 'Q', 'R', 'W', 'J', 'Z', '6'],
    x: 210,
    y: 330,
    landmarks: "Chinatown, Little Italy, SoHo shopping, Chinatown Ice Cream Factory",
    landmarksEs: "Chinatown, Pequeña Italia, Compras en SoHo, Heladería de Chinatown",
    descriptionEn: "A massive multi-level interchange situated directly below Canal Street. Perfect launching point for exploring Chinatown and SoHo's boutiques.",
    descriptionEs: "Un enorme intercambiador de niveles múltiples situado debajo de Canal Street. Ideal para explorar el Barrio Chino y SoHo.",
    latitude: 40.7188,
    longitude: -74.0018
  },
  {
    id: 'fulton_transit',
    name: 'Fulton Street Transit Center',
    nameEs: 'Centro de Tránsito de Fulton Street',
    lines: ['2', '3', '4', '5', 'A', 'C', 'J', 'Z'],
    x: 210,
    y: 395,
    landmarks: "One World Trade Center, 9/11 Memorial, Wall Street, Oculus",
    landmarksEs: "One World Trade Center, Memorial del 11S, Wall Street, Oculus",
    descriptionEn: "A modern glass-and-steel transit gateway in Lower Manhattan, featuring an iconic sky-reflector dome that channels sunlight into the platforms.",
    descriptionEs: "Un moderno portal de tránsito de acero y vidrio en el Bajo Manhattan, con un domo reflector solar que ilumina los andenes profundos.",
    latitude: 40.710368,
    longitude: -74.007582
  },
  {
    id: 'whitehall_ferry',
    name: 'South Ferry - Whitehall St',
    nameEs: 'Estación South Ferry - Whitehall',
    lines: ['1', 'R', 'W'],
    x: 180,
    y: 445,
    landmarks: "Statue of Liberty Ferry, Staten Island Ferry, Battery Park, Wall Street Bull",
    landmarksEs: "Ferry de la Estatua de la Libertad, Ferry de Staten Island, Parque Battery",
    descriptionEn: "The southernmost station in Manhattan. Offers immediate outdoor transfers to the Staten Island Ferry and cruise terminals to Liberty Island.",
    descriptionEs: "La estación más al sur de Manhattan. Ofrece transbordos inmediatos al Ferry de Staten Island y botes hacia la Estatua de la Libertad.",
    latitude: 40.7020,
    longitude: -74.0130
  },
  {
    id: 'astoria_ditmars',
    name: 'Astoria - Ditmars Blvd',
    nameEs: 'Estación de Astoria - Ditmars Blvd',
    lines: ['N', 'W'],
    x: 390,
    y: 40,
    landmarks: "Astoria Park, Bohemian Hall Beer Garden, Museum of the Moving Image",
    landmarksEs: "Parque Astoria, Jardín de Cerveza Bohemian Hall, Museo de la Imagen",
    descriptionEn: "The northern terminal of the Broadway line in Queens. Located in a historic, energetic neighborhood famed for Greek food and cinema history.",
    descriptionEs: "La terminal norte de las líneas Broadway en Queens. Ubicada en un barrio histórico famoso por su gastronomía griega e historia del cine.",
    latitude: 40.7750,
    longitude: -73.9120
  },
  {
    id: 'queensboro_plaza',
    name: 'Queensboro Plaza',
    nameEs: 'Estación Queensboro Plaza',
    lines: ['7', 'N', 'W'],
    x: 360,
    y: 110,
    landmarks: "Long Island City Art Galleries, MoMA PS1, Gantry Plaza State Park",
    landmarksEs: "Galerías de Arte de Long Island City, MoMA PS1, Parque Gantry Plaza",
    descriptionEn: "A unique elevated two-tier subway station in Queens. Riders can enjoy spectacular views of the Queensboro Bridge during cross-platform transfers.",
    descriptionEs: "Una estación elevada única de dos niveles en Queens. Ofrece vistas espectaculares del Puente de Queensboro al cambiar de tren.",
    latitude: 40.7505,
    longitude: -73.9402
  },
  {
    id: 'flushing_main',
    name: 'Flushing - Main St',
    nameEs: 'Estación de Flushing - Calle Principal',
    lines: ['7'],
    x: 470,
    y: 110,
    landmarks: "Queens Chinatown, Citi Field (NY Mets), Flushing Meadows Park",
    landmarksEs: "Barrio Chino de Queens, Estadio Citi Field, Parque Flushing Meadows",
    descriptionEn: "The bustling eastern end of the Flushing 7 line. Serves NYC's largest and most vibrant Asian culinary and cultural neighborhood.",
    descriptionEs: "El bullicioso extremo este de la línea 7 de Flushing. Conecta con el barrio de cultura y gastronomía asiática más grande de Nueva York.",
    latitude: 40.7596,
    longitude: -73.8300
  },
  {
    id: 'bedford_ave',
    name: 'Bedford Ave (Williamsburg)',
    nameEs: 'Estación Bedford Ave (Williamsburg)',
    lines: ['L'],
    x: 360,
    y: 280,
    landmarks: "Williamsburg Waterfront, Brooklyn Flea Market, Boutique Shopping",
    landmarksEs: "Costanera de Williamsburg, Mercado de Pulgas de Brooklyn, Boutiques",
    descriptionEn: "The first station in Brooklyn on the L train. The epicentre of Williamsburg's globally renowned hipster shopping, dining, and art scene.",
    descriptionEs: "La primera estación en Brooklyn del tren L. Epicentro de la famosa cultura hipster, restaurantes gourmet y galerías de Williamsburg.",
    latitude: 40.7161,
    longitude: -73.9591
  },
  {
    id: 'atlantic_barclays',
    name: 'Atlantic Av - Barclays Center',
    nameEs: 'Estación Atlantic Av - Barclays Center',
    lines: ['2', '3', '4', '5', 'B', 'D', 'N', 'Q', 'R'],
    x: 340,
    y: 450,
    landmarks: "Barclays Center (Nets NBA), Brooklyn Academy of Music, Prospect Park",
    landmarksEs: "Estadio Barclays Center, Academia de Música de Brooklyn, Prospect Park",
    descriptionEn: "The ultimate transit hub in Brooklyn. Links nine subway lines with commuter trains and sits right underneath the Barclays Center arena.",
    descriptionEs: "El núcleo de tránsito definitivo de Brooklyn. Conecta nueve líneas de metro con trenes de cercanías, situado bajo la arena Barclays Center.",
    latitude: 40.683661,
    longitude: -73.978810
  }
];

const SUBWAY_LINES_GEOMETRY = [
  // Broadway Line (Yellow)
  { id: 'yellow-line', color: '#FCCC0A', name: 'N Q R W (Broadway Line)', coords: [[390, 40], [360, 110], [270, 110], [200, 180], [240, 230], [210, 330], [180, 445], [340, 450]] },
  // Lexington Line (Green)
  { id: 'green-line', color: '#00933C', name: '4 5 6 (Lexington Avenue Line)', coords: [[300, 40], [300, 180], [210, 330], [210, 395], [340, 450]] },
  // Seventh Ave Line (Red)
  { id: 'red-line', color: '#EE352E', name: '1 2 3 (Broadway-Seventh Avenue Line)', coords: [[170, 110], [200, 180], [160, 230], [210, 395], [180, 445], [340, 450]] },
  // Eighth Ave Line (Blue)
  { id: 'blue-line', color: '#0039A6', name: 'A C E (Eighth Avenue Line)', coords: [[170, 110], [160, 230], [210, 395]] },
  // Sixth Ave Line (Orange)
  { id: 'orange-line', color: '#FF6319', name: 'B D F M (Sixth Avenue Line)', coords: [[170, 110], [240, 230], [210, 330], [340, 450]] },
  // Flushing Line (Purple)
  { id: 'purple-line', color: '#B933AD', name: '7 (Flushing Line)', coords: [[200, 180], [300, 180], [360, 110], [470, 110]] },
  // Canarsie Line (Grey)
  { id: 'grey-line', color: '#A7A9AC', name: 'L (Canarsie Line)', coords: [[120, 280], [160, 280], [240, 280], [360, 280]] }
];

export const NycSubwayMap: React.FC<NycSubwayMapProps> = ({ selectedLang, onAskVoyager, onSelectStationOnMap }) => {
  const [selectedStation, setSelectedStation] = useState<InteractiveStation | null>(INTERACTIVE_STATIONS[1]); // Default to Times Square
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null);
  const [hoveredStation, setHoveredStation] = useState<InteractiveStation | null>(null);

  const getLineColorName = (line: string): string => {
    switch (line) {
      case '1': case '2': case '3': return 'red';
      case '4': case '5': case '6': return 'green';
      case '7': return 'purple';
      case 'A': case 'C': case 'E': return 'blue';
      case 'B': case 'D': case 'F': case 'M': return 'orange';
      case 'N': case 'Q': case 'R': case 'W': return 'yellow';
      case 'L': return 'grey';
      case 'J': case 'Z': return 'brown';
      default: return 'neutral';
    }
  };

  const getBadgeStyle = (line: string) => {
    const color = getLineColorName(line);
    switch (color) {
      case 'red': return 'bg-red-600 text-white font-extrabold';
      case 'blue': return 'bg-blue-600 text-white font-extrabold';
      case 'green': return 'bg-emerald-600 text-white font-extrabold';
      case 'purple': return 'bg-purple-600 text-white font-extrabold';
      case 'orange': return 'bg-orange-500 text-white font-extrabold';
      case 'yellow': return 'bg-yellow-400 text-black font-extrabold';
      case 'grey': return 'bg-neutral-500 text-white font-extrabold';
      default: return 'bg-yellow-700 text-white font-extrabold';
    }
  };

  const speakStationName = (station: InteractiveStation) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(selectedLang === 'EN' ? station.name : station.nameEs);
    
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
      speech.voice = voyagerVoice;
      speech.lang = voyagerVoice.lang;
    } else {
      speech.lang = selectedLang === 'EN' ? 'en-US' : 'es-ES';
    }
    
    speech.rate = 1.05;
    speech.pitch = 1.05;
    
    window.speechSynthesis.speak(speech);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black/40 border border-white/10 rounded-2xl p-3 md:p-4 text-white overflow-hidden max-h-[380px] md:max-h-[440px]">
      
      {/* Title & Interactive Toggle Row */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
        <div className="flex items-center gap-1.5 text-left">
          <Map className="w-4 h-4 text-yellow-500" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-yellow-400">
              {selectedLang === 'EN' ? 'Interactive Subway Grid' : 'Red de Metro Interactiva'}
            </h3>
            <p className="text-[9px] text-neutral-400 leading-none">
              {selectedLang === 'EN' ? 'Bilingual Transit Map of NYC Hubs' : 'Mapa de Tránsito Bilingüe de NYC'}
            </p>
          </div>
        </div>

        {/* Floating Line Highlighter Panel */}
        <div className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded-lg border border-white/5">
          <Layers className="w-3 h-3 text-neutral-400" />
          <span className="text-[8px] font-mono text-neutral-400 mr-1 select-none">
            {selectedLang === 'EN' ? 'Focus:' : 'Línea:'}
          </span>
          <select 
            className="bg-transparent text-[9px] font-mono font-bold text-yellow-400 outline-none cursor-pointer"
            value={highlightedLineId || ''}
            onChange={(e) => setHighlightedLineId(e.target.value || null)}
          >
            <option value="" className="bg-neutral-900 text-neutral-400">
              {selectedLang === 'EN' ? 'All Lines' : 'Todas'}
            </option>
            {SUBWAY_LINES_GEOMETRY.map(line => (
              <option key={line.id} value={line.id} className="bg-neutral-900 text-white">
                {line.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Split Layout on Larger screens, Stacked on Mobile */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
        
        {/* Interactive SVG Vector Map Canvas */}
        <div className="flex-1 bg-neutral-950/70 rounded-xl border border-white/5 relative p-1 flex items-center justify-center overflow-hidden h-[180px] md:h-full select-none group">
          
          {/* Watermark Compass Grid */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Compass className="w-32 h-32 animate-spin-slow text-white" />
          </div>

          <svg 
            viewBox="0 0 500 500" 
            className="w-full h-full max-w-full max-h-full transition-all duration-300"
          >
            {/* Geographic Water background overlays (Hudson and East River paths) */}
            {/* Hudson River (Left) */}
            <path 
              d="M 50,0 Q 110,180 80,300 T 50,500 L 0,500 L 0,0 Z" 
              fill="#081e3a" 
              opacity="0.35" 
            />
            {/* East River (S-Curve Center-East) */}
            <path 
              d="M 330,0 Q 280,110 330,220 T 260,370 T 320,500 L 500,500 L 500,0 Z" 
              fill="#081e3a" 
              opacity="0.25" 
            />

            {/* Geographic Labels */}
            <text x="35" y="240" fill="#ffffff" opacity="0.1" fontSize="12" fontFamily="monospace" letterSpacing="2" transform="rotate(-90 35 240)">HUDSON RIVER</text>
            <text x="430" y="290" fill="#ffffff" opacity="0.1" fontSize="12" fontFamily="monospace" letterSpacing="2" transform="rotate(70 430 290)">EAST RIVER</text>
            <text x="20" y="30" fill="#ffffff" opacity="0.15" fontSize="9" fontFamily="monospace" fontWeight="bold">MANHATTAN</text>
            <text x="440" y="30" fill="#ffffff" opacity="0.15" fontSize="9" fontFamily="monospace" fontWeight="bold">QUEENS</text>
            <text x="440" y="480" fill="#ffffff" opacity="0.15" fontSize="9" fontFamily="monospace" fontWeight="bold">BROOKLYN</text>

            {/* Subway Lines Paths (Geometry) */}
            {SUBWAY_LINES_GEOMETRY.map((line) => {
              const isFocused = !highlightedLineId || highlightedLineId === line.id;
              // Build standard SVG polyline path
              const pathData = line.coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c[0]} ${c[1]}`).join(' ');
              return (
                <g key={line.id}>
                  {/* Glowing background path for highlighted line */}
                  <path 
                    d={pathData} 
                    fill="none" 
                    stroke={line.color} 
                    strokeWidth={isFocused ? "8" : "2"} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    opacity={isFocused ? "0.25" : "0.04"} 
                    className="transition-all duration-300"
                  />
                  {/* Solid core line */}
                  <path 
                    d={pathData} 
                    fill="none" 
                    stroke={line.color} 
                    strokeWidth={isFocused ? "3.5" : "1.5"} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    opacity={isFocused ? "0.85" : "0.15"} 
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}

            {/* Interactive Stations (Circles) */}
            {INTERACTIVE_STATIONS.map((station) => {
              const isSelected = selectedStation?.id === station.id;
              const isHovered = hoveredStation?.id === station.id;
              
              // Check if any line of this station is part of the highlighted line
              const lineMatch = !highlightedLineId || SUBWAY_LINES_GEOMETRY.find(g => g.id === highlightedLineId)?.coords.some(
                coord => coord[0] === station.x && coord[1] === station.y
              );

              return (
                <g 
                  key={station.id}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => setSelectedStation(station)}
                  onMouseEnter={() => setHoveredStation(station)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  {/* Ripple Ring when selected or hovered */}
                  {(isSelected || isHovered) && (
                    <circle 
                      cx={station.x} 
                      cy={station.y} 
                      r="10" 
                      fill="none" 
                      stroke="#facc15" 
                      strokeWidth="1.5" 
                      className="animate-ping" 
                      opacity="0.6"
                    />
                  )}
                  {/* Thick Border Ring */}
                  <circle 
                    cx={station.x} 
                    cy={station.y} 
                    r={isSelected ? "7" : "5"} 
                    fill={isSelected ? "#facc15" : "#000000"} 
                    stroke={isSelected ? "#ffffff" : lineMatch ? "#facc15" : "#555555"} 
                    strokeWidth="2"
                    opacity={lineMatch ? "1" : "0.35"}
                    className="transition-all duration-300"
                  />
                  {/* Inner Core dot */}
                  {isSelected && (
                    <circle 
                      cx={station.x} 
                      cy={station.y} 
                      r="3" 
                      fill="#000000" 
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Map Overlay tooltip (Station Name when Hovered) */}
          {hoveredStation && (
            <div className="absolute top-2 left-2 bg-neutral-900/90 border border-yellow-500/30 px-2 py-1 rounded-md text-[9px] font-mono text-white pointer-events-none shadow-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
              {selectedLang === 'EN' ? hoveredStation.name : hoveredStation.nameEs}
            </div>
          )}
        </div>

        {/* Sidebar Panel containing metadata for selected station */}
        <div className="w-full md:w-[190px] bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col justify-between min-h-0 overflow-y-auto">
          {selectedStation ? (
            <div className="space-y-2.5 text-left flex flex-col h-full justify-between">
              
              {/* Station General Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-mono uppercase font-bold text-yellow-500/80 tracking-wider flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    {selectedLang === 'EN' ? 'Station Details' : 'Detalles de Estación'}
                  </span>
                  
                  {/* Pronunciation audio trigger */}
                  <button 
                    onClick={() => speakStationName(selectedStation)}
                    title={selectedLang === 'EN' ? "Hear Pronunciation" : "Escuchar Pronunciación"}
                    className="p-1 hover:bg-white/5 rounded text-neutral-400 hover:text-white transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-xs font-bold leading-tight text-white font-sans">
                  {selectedLang === 'EN' ? selectedStation.name : selectedStation.nameEs}
                </h4>

                {/* Available Subway Line badges */}
                <div className="flex flex-wrap gap-1 py-0.5">
                  {selectedStation.lines.map((line) => (
                    <span 
                      key={line} 
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] tracking-tighter ${getBadgeStyle(line)}`}
                    >
                      {line}
                    </span>
                  ))}
                </div>

                {/* Station Description */}
                <p className="text-[10px] text-neutral-300 leading-snug">
                  {selectedLang === 'EN' ? selectedStation.descriptionEn : selectedStation.descriptionEs}
                </p>
                
                {/* Landmarks Row */}
                <div className="p-1.5 bg-neutral-900/40 border border-white/5 rounded-lg space-y-0.5">
                  <span className="block text-[8px] font-mono font-bold uppercase text-neutral-500">
                    📍 {selectedLang === 'EN' ? 'Nearby Sights:' : 'Atracciones:'}
                  </span>
                  <p className="text-[9px] text-neutral-400 leading-tight">
                    {selectedLang === 'EN' ? selectedStation.landmarks : selectedStation.landmarksEs}
                  </p>
                </div>
              </div>

              {/* Interaction Action Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                
                {/* Ask Voyager Button */}
                <button 
                  onClick={() => onAskVoyager(
                    selectedLang === 'EN' 
                    ? `Explain the historic station ${selectedStation.name}, which lines serve it, and teach me some related vocabulary.` 
                    : `Explícame la histórica estación ${selectedStation.nameEs}, qué líneas pasan por ahí, y enséñame algo de vocabulario relacionado.`
                  )}
                  className="w-full py-1.5 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  {selectedLang === 'EN' ? 'Ask Voyager' : 'Preguntar a Voyager'}
                </button>

                {/* Draw Route or Show Pin on Map */}
                <button 
                  onClick={() => {
                    if (onSelectStationOnMap) {
                      onSelectStationOnMap(selectedStation.name, selectedStation.latitude, selectedStation.longitude);
                    } else {
                      onAskVoyager(
                        selectedLang === 'EN' 
                        ? `Show me ${selectedStation.name} on the map!` 
                        : `¡Muéstrame ${selectedStation.nameEs} en el mapa!`
                      );
                    }
                  }}
                  className="w-full py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  {selectedLang === 'EN' ? 'Locate on Live Map' : 'Ubicar en Mapa Vivo'}
                </button>

              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-2 text-neutral-400 font-sans">
              <Compass className="w-6 h-6 text-neutral-600 mb-1.5 animate-pulse" />
              <p className="text-[10px] leading-normal italic">
                {selectedLang === 'EN' ? 'Select a subway hub on the map grid to view its properties.' : 'Selecciona un centro de metro en la cuadrícula del mapa para ver detalles.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
