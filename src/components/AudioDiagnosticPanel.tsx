import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Volume2, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Radio, 
  X
} from 'lucide-react';

interface AudioDiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  isSessionActive: boolean;
  isPaused: boolean;
  volume: number; // 0 - 100
  statusText: string;
  error: string | null;
  selectedLang: 'EN' | 'ES';
  framesSent: number;
  chunksReceived: number;
  lastUserTranscription: string;
  lastModelResponse: string;
}

export const AudioDiagnosticPanel: React.FC<AudioDiagnosticPanelProps> = ({
  isOpen,
  onClose,
  isConnected,
  isSessionActive,
  isPaused,
  volume,
  statusText,
  error,
  selectedLang,
  framesSent,
  chunksReceived,
  lastUserTranscription,
  lastModelResponse
}) => {
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [activeTrackName, setActiveTrackName] = useState<string>('Detecting...');
  const [peakVolume, setPeakVolume] = useState<number>(0);

  // Check Microphone permission state
  useEffect(() => {
    if (!isOpen) return;

    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const res = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicPermission(res.state as any);
          res.onchange = () => setMicPermission(res.state as any);
        }
      } catch (e) {
        setMicPermission('unknown');
      }
    };

    checkPermission();
  }, [isOpen]);

  // Track max peak volume
  useEffect(() => {
    if (volume > peakVolume) {
      setPeakVolume(volume);
    }
  }, [volume, peakVolume]);

  // Query Web Audio API state if mic stream active
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      // Check active MediaStream tracks
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        if (audioInputs.length > 0) {
          const activeDev = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0];
          setActiveTrackName(activeDev.label || 'Default System Microphone');
        }
      }).catch(() => {});
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isSpanish = selectedLang === 'ES';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                {isSpanish ? 'Panel de Diagnóstico de Audio y Voz' : 'Audio & Voice Pipeline Diagnostic'}
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  LIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isSpanish ? 'Monitoreo en tiempo real de permisos, Web Audio API y pipeline Gemini Live' : 'Real-time telemetry for microphone stream, Web Audio API, and Gemini Live pipeline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Dashboard Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-sans text-slate-200">
          
          {/* Section 1: Live Audio Signal VU Meter */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                {isSpanish ? '1. Nivel de Ganancia y Audio en Tiempo Real (VU Meter)' : '1. Real-time Audio Stream & Gain Level (VU Meter)'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Gain: <span className="font-bold text-emerald-400">{volume}%</span> | Peak: <span className="text-amber-400">{peakVolume}%</span>
              </span>
            </div>

            {/* Visualizer Bar */}
            <div className="space-y-1">
              <div className="w-full h-4 bg-slate-900 rounded-full border border-slate-800 p-0.5 relative overflow-hidden flex items-center">
                <div 
                  className={`h-full rounded-full transition-all duration-75 ${
                    volume > 75 ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500' :
                    volume > 20 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                    'bg-slate-700'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, volume))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>0% (Silent)</span>
                <span>25% (Whisper)</span>
                <span>50% (Speech)</span>
                <span>75% (Loud)</span>
                <span>100% (Clipping)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className={`w-2 h-2 rounded-full ${volume > 5 ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <span className="text-[11px] text-slate-400">
                {volume > 5 
                  ? (isSpanish ? 'Capturando señal de voz activa del micrófono' : 'Active speech signal detected on microphone input')
                  : (isSpanish ? 'Sin señal de audio activa (Habla frente al micrófono para verificar)' : 'No active speech signal detected (Speak into mic to test)')}
              </span>
            </div>
          </div>

          {/* Grid Section: Permissions & Web Audio API */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Box A: Permission & Device */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase text-[11px] tracking-wider border-b border-slate-800 pb-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                {isSpanish ? '2. Permisos y Dispositivo' : '2. Permissions & Media Device'}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">getUserMedia Status:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                    micPermission === 'granted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    micPermission === 'denied' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {micPermission.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isSpanish ? 'Dispositivo Seleccionado:' : 'Selected Device:'}</span>
                  <span className="font-mono text-slate-200 truncate max-w-[180px]" title={activeTrackName}>
                    {activeTrackName}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isSpanish ? 'Procesamiento:' : 'DSP Filters:'}</span>
                  <span className="font-mono text-emerald-400">
                    Echo Cancel, Noise Supp.
                  </span>
                </div>
              </div>
            </div>

            {/* Box B: Web Audio API Engine */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase text-[11px] tracking-wider border-b border-slate-800 pb-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                {isSpanish ? '3. Motor Web Audio API' : '3. Web Audio API Engine'}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">AudioContext State:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                    isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isConnected ? 'RUNNING' : 'IDLE / SUSPENDED'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sample Rate (Capture):</span>
                  <span className="font-mono text-slate-200">
                    Native Device Rate (16kHz resampled)
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sample Rate (Playback):</span>
                  <span className="font-mono text-cyan-300">
                    24,000 Hz PCM
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 4: Speech-to-Text & Gemini Live Pipeline */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Radio className="w-4 h-4 text-purple-400" />
                {isSpanish ? '4. Pipeline Gemini Live & Telemetría WebSocket' : '4. Gemini Live & WebSocket Telemetry'}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                isConnected && isSessionActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                isConnected ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {isConnected ? (isSessionActive ? 'PIPELINE ACTIVE' : 'CONNECTING GEMINI') : 'DISCONNECTED'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400 uppercase">WS State</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  {isConnected ? 'OPEN (1)' : 'CLOSED (3)'}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400 uppercase">PCM Frames Sent</div>
                <div className="text-xs font-bold text-amber-400 mt-0.5">
                  {framesSent}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400 uppercase">Audio Chunks Rcvd</div>
                <div className="text-xs font-bold text-cyan-400 mt-0.5">
                  {chunksReceived}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400 uppercase">Status</div>
                <div className="text-xs font-bold text-purple-300 truncate mt-0.5" title={statusText}>
                  {statusText}
                </div>
              </div>
            </div>

            {/* Last Transcriptions & AI Responses */}
            <div className="space-y-2 pt-1">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] uppercase font-bold text-amber-400 mb-1 flex items-center justify-between">
                  <span>{isSpanish ? 'Última Transcripción de Voz (Speech-to-Text):' : 'Last User Speech Transcription:'}</span>
                  {lastUserTranscription && <span className="text-emerald-400 text-[9px]">Captured ✓</span>}
                </div>
                <p className="font-mono text-slate-300 italic text-[11px] min-h-[1.25rem]">
                  {lastUserTranscription ? `"${lastUserTranscription}"` : (isSpanish ? '(Esperando voz del usuario... habla frente al micrófono)' : '(Awaiting user voice input... speak into microphone)')}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1 flex items-center justify-between">
                  <span>{isSpanish ? 'Última Respuesta de Voyager:' : 'Last Voyager Response:'}</span>
                  {lastModelResponse && <span className="text-cyan-300 text-[9px]">Received ✓</span>}
                </div>
                <p className="font-mono text-slate-300 italic text-[11px] min-h-[1.25rem] line-clamp-2">
                  {lastModelResponse ? `"${lastModelResponse}"` : (isSpanish ? '(Esperando respuesta de voz de Voyager...)' : '(Awaiting Voyager voice response...)')}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-lg text-red-200 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {isSpanish ? 'Diagnóstico activo en tiempo real' : 'Live real-time telemetry active'}
          </span>
          <button
            onClick={onClose}
            type="button"
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
          >
            {isSpanish ? 'Cerrar Panel' : 'Close Panel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioDiagnosticPanel;
