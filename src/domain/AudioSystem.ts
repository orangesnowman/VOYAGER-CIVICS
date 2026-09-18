import { base64ToBytes, bytesToBase64, float32ToPcm16, createAudioBufferFromPCM, resampleAudioBuffer } from '../services/audioUtils';

/**
 * Handles all PCM, Float32, and Base64 translations and resampling.
 */
export class PCMConverter {
  static base64ToBytes(base64: string): Uint8Array {
    return base64ToBytes(base64);
  }

  static bytesToBase64(bytes: Uint8Array): string {
    return bytesToBase64(bytes);
  }

  static float32ToPcm16(float32Array: Float32Array): Int16Array {
    return float32ToPcm16(float32Array);
  }

  static createAudioBuffer(ctx: AudioContext, pcmData: Int16Array, sampleRate: number): AudioBuffer {
    return createAudioBufferFromPCM(ctx, pcmData, sampleRate);
  }

  static resample(audioBuffer: AudioBuffer, targetSampleRate: number): Float32Array {
    return resampleAudioBuffer(audioBuffer, targetSampleRate);
  }
}

/**
 * Handles mic capture, input analysis, script processing, and resampling/PCM-encoding.
 */
export class AudioCapture {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private dummyGain: GainNode | null = null;
  private onAudioDataCallback: ((base64Pcm: string) => void) | null = null;
  private frameCounter = 0;

  constructor() {}

  async start(onAudioData: (base64Pcm: string) => void): Promise<MediaStream> {
    this.onAudioDataCallback = onAudioData;
    this.frameCounter = 0;
    try {
      if (!this.stream || !this.stream.active) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('[AudioCapture] Mic MediaStream active:', this.stream.id, 'Tracks:', this.stream.getAudioTracks().length);
      }

      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        console.log('[AudioCapture] Created AudioContext with sampleRate:', this.audioContext.sampleRate);
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('[AudioCapture] Resumed AudioContext');
      }

      if (!this.analyserNode) {
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 256;
      }

      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
      }

      if (!this.processorNode) {
        this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
        this.processorNode.onaudioprocess = (e) => {
          if (!this.onAudioDataCallback) return;

          this.frameCounter++;
          const resampled = PCMConverter.resample(e.inputBuffer, 16000);
          const pcm16 = PCMConverter.float32ToPcm16(resampled);
          const pcmBytes = new Uint8Array(pcm16.buffer);
          const base64Data = PCMConverter.bytesToBase64(pcmBytes);

          if (this.frameCounter === 1 || this.frameCounter % 50 === 0) {
            console.log(`[AudioCapture] Frame #${this.frameCounter} processed. Base64 len: ${base64Data.length}, Volume RMS: ${this.getVolume()}`);
          }

          this.onAudioDataCallback(base64Data);
        };

        this.sourceNode.connect(this.processorNode);
        this.sourceNode.connect(this.analyserNode);
        this.processorNode.connect(this.audioContext.destination);
      }

      return this.stream;
    } catch (err) {
      console.error('[AudioCapture ERROR] Failed to start mic capture:', err);
      this.stop();
      throw err;
    }
  }

  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('AudioCapture resume failed:', e);
      }
    }
  }

  stop(): void {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.dummyGain) {
      this.dummyGain.disconnect();
      this.dummyGain = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyserNode = null;
    this.onAudioDataCallback = null;
  }

  getVolume(): number {
    if (!this.analyserNode) return 0;
    const dataArray = new Uint8Array(this.analyserNode.fftSize);
    this.analyserNode.getByteTimeDomainData(dataArray);
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const norm = (dataArray[i] - 128) / 128;
      sumSquares += norm * norm;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);
    if (rms < 0.015) return 0;
    const scaled = Math.min(100, Math.round(Math.pow((rms - 0.01) * 3.2, 0.7) * 100));
    return Math.max(0, scaled);
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}

/**
 * Handles audio playback, volume analyzer, audio buffer queue scheduling, and timing.
 */
export class AudioPlayback {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private nextStartTime = 0;
  private playbackChunkCounter = 0;

  constructor() {}

  init(): void {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } catch (e) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      console.log('[AudioPlayback] Initialized AudioContext for playback. sampleRate:', this.audioContext.sampleRate);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      console.log('[AudioPlayback] Resumed playback AudioContext');
    }
  }

  playRawPCM(base64Pcm: string): void {
    this.init();
    if (!this.audioContext) {
      console.error('[AudioPlayback ERROR] Cannot play PCM: audioContext is null');
      return;
    }

    try {
      this.playbackChunkCounter++;
      const pcmBytes = PCMConverter.base64ToBytes(base64Pcm);
      const samplesCount = Math.floor(pcmBytes.byteLength / 2);
      const pcmData = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, samplesCount);
      const audioBuffer = PCMConverter.createAudioBuffer(this.audioContext, pcmData, 24000);

      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;

      if (this.analyserNode) {
        sourceNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
      } else {
        sourceNode.connect(this.audioContext.destination);
      }

      const now = this.audioContext.currentTime;
      const startTime = Math.max(now, this.nextStartTime);
      sourceNode.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      if (this.playbackChunkCounter === 1 || this.playbackChunkCounter % 10 === 0) {
        console.log(`[AudioPlayback] Played PCM chunk #${this.playbackChunkCounter}. Duration: ${audioBuffer.duration.toFixed(3)}s, nextStartTime: ${this.nextStartTime.toFixed(3)}s`);
      }
    } catch (err) {
      console.error('[AudioPlayback ERROR] Failed to schedule raw PCM audio playback:', err);
    }
  }

  stop(): void {
    this.nextStartTime = 0;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyserNode = null;
  }

  getVolume(): number {
    if (!this.analyserNode) return 0;
    const dataArray = new Uint8Array(this.analyserNode.fftSize);
    this.analyserNode.getByteTimeDomainData(dataArray);
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const norm = (dataArray[i] - 128) / 128;
      sumSquares += norm * norm;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);
    if (rms < 0.015) return 0;
    const scaled = Math.min(100, Math.round(Math.pow((rms - 0.01) * 3.2, 0.7) * 100));
    return Math.max(0, scaled);
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  resetTimeline(): void {
    this.nextStartTime = this.audioContext ? this.audioContext.currentTime : 0;
  }
}

/**
 * Handles basic voice activity and inactivity tracking (VAD-lite).
 */
export class VoiceActivityDetector {
  private lastActivityTime = Date.now();

  constructor() {}

  recordActivity(): void {
    this.lastActivityTime = Date.now();
  }

  getInactiveMs(): number {
    return Date.now() - this.lastActivityTime;
  }

  reset(): void {
    this.lastActivityTime = Date.now();
  }
}
