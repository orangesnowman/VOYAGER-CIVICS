import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
}

export interface RouteInfo {
  origin: string;
  destination: string;
  travelMode: string;
  description?: string;
}

interface NycMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MapMarker[];
  routeInfo: RouteInfo | null;
  onSelectPlace?: (placeName: string) => void;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Route rendering helper component
function RouteDisplay({ origin, destination, travelMode }: {
  origin: string;
  destination: string;
  travelMode: string;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;
    
    // Clear previous routes
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: (travelMode || 'WALKING') as any,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach((p: any) => p.setMap(map));
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }
      }
    }).catch(err => {
      console.error("Error computing directions route:", err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin, destination, travelMode]);

  return null;
}

export const NycMap: React.FC<NycMapProps> = ({ center, zoom, markers, routeInfo, onSelectPlace }) => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Set map center when the center prop changes
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-neutral-900 border border-white/10 rounded-2xl p-6 text-center text-white font-sans overflow-y-auto">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-yellow-950/40 text-yellow-500 rounded-full flex items-center justify-center mx-auto border border-yellow-800 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-wider text-yellow-500 uppercase font-tech">Google Maps API Key Required</h2>
          <p className="text-xs text-neutral-300 leading-relaxed">
            To view interactive maps in your conversation with VOYAGER, you must add your Google Maps API key as a secret.
          </p>
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-left space-y-2.5 text-xs text-neutral-300 font-mono">
            <p className="text-yellow-500 font-bold font-sans">👉 To add your API key:</p>
            <ol className="list-decimal pl-4 space-y-1.5 text-neutral-400">
              <li>Get an API key: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-yellow-500 underline">Get Started</a></li>
              <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right corner)</li>
              <li>Select <strong>Secrets</strong></li>
              <li>Add a secret with name: <code className="text-white bg-white/10 px-1 py-0.5 rounded">GOOGLE_MAPS_PLATFORM_KEY</code></li>
              <li>Paste your key as the value and press <strong>Enter</strong></li>
            </ol>
          </div>
          <p className="text-[10px] text-neutral-500 italic">The applet will automatically rebuild and load the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="cooperative"
          disableDefaultUI={false}
        >
          {markers.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setSelectedMarker(marker)}
            >
              <Pin background="#facc15" borderColor="#ffffff" glyphColor="#000000" scale={1.1} />
            </AdvancedMarker>
          ))}

          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="text-black p-2 max-w-xs font-sans">
                <h4 className="font-bold text-sm text-yellow-600 font-tech">{selectedMarker.title}</h4>
                {selectedMarker.description && (
                  <p className="text-xs text-neutral-700 mt-1 leading-relaxed">{selectedMarker.description}</p>
                )}
                {onSelectPlace && (
                  <button
                    onClick={() => {
                      onSelectPlace(selectedMarker.title);
                      setSelectedMarker(null);
                    }}
                    className="mt-2 text-[10px] font-bold text-yellow-600 uppercase tracking-wider hover:underline block cursor-pointer"
                  >
                    Ask Voyager about this spot
                  </button>
                )}
              </div>
            </InfoWindow>
          )}

          {routeInfo && (
            <RouteDisplay
              origin={routeInfo.origin}
              destination={routeInfo.destination}
              travelMode={routeInfo.travelMode}
            />
          )}
        </Map>
      </APIProvider>

      {/* Floating Info Overlay for Current Active Location or Route */}
      {(routeInfo || selectedMarker || markers.length > 0) && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 z-10 text-white font-mono text-xs max-w-md mx-auto shadow-lg space-y-1">
          <div className="flex items-center justify-between text-yellow-500 font-bold uppercase text-[10px] tracking-wider border-b border-white/10 pb-1">
            <span>VOYAGER Navigator</span>
            <button 
              onClick={() => setSelectedMarker(null)} 
              className="text-neutral-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          {routeInfo ? (
            <div className="space-y-1">
              <p><span className="text-neutral-400">Route:</span> {routeInfo.origin} ➔ {routeInfo.destination}</p>
              <p><span className="text-neutral-400">Mode:</span> {routeInfo.travelMode}</p>
              {routeInfo.description && <p className="text-[10px] text-neutral-300 italic mt-1 leading-relaxed">{routeInfo.description}</p>}
            </div>
          ) : selectedMarker ? (
            <div>
              <p className="font-bold text-yellow-400">{selectedMarker.title}</p>
              {selectedMarker.description && <p className="text-[10px] text-neutral-300 leading-relaxed mt-1">{selectedMarker.description}</p>}
            </div>
          ) : (
            <p>Showing {markers.length} spots on the map. Speak or ask questions to explore!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NycMap;
