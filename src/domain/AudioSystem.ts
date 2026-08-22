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
  private onAudioDataCallback: ((base64Pcm: string) => void) | null = null;

  constructor() {}

  async start(onAudioData: (base64Pcm: string) => void): Promise<MediaStream> {
    this.onAudioDataCallback = onAudioData;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize AudioContext at 16000 Hz for input
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.onAudioDataCallback) return;

        const resampled = PCMConverter.resample(e.inputBuffer, 16000);
        const pcm16 = PCMConverter.float32ToPcm16(resampled);
        const pcmBytes = new Uint8Array(pcm16.buffer);
        const base64Data = PCMConverter.bytesToBase64(pcmBytes);

        this.onAudioDataCallback(base64Data);
      };

      this.sourceNode.connect(this.processorNode);
      this.sourceNode.connect(this.analyserNode);
      this.processorNode.connect(this.audioContext.destination);

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      return this.stream;
    } catch (err) {
      this.stop();
      throw err;
    }
  }

  stop(): void {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
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
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
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

  constructor() {}

  init(): void {
    if (!this.audioContext) {
      // Initialize AudioContext at 24000 Hz for high quality output
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playRawPCM(base64Pcm: string): void {
    this.init();
    if (!this.audioContext) return;

    try {
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
    } catch (err) {
      console.error('Failed to schedule raw PCM audio playback:', err);
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
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
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
