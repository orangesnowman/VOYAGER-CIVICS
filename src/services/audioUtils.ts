export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function float32ToPcm16(float32Array: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

export function createAudioBufferFromPCM(ctx: AudioContext, pcmData: Int16Array, sampleRate: number): AudioBuffer {
  const audioBuffer = ctx.createBuffer(1, pcmData.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < pcmData.length; i++) {
    channelData[i] = pcmData[i] / 32768.0;
  }
  return audioBuffer;
}

export function resampleAudioBuffer(audioBuffer: AudioBuffer, targetSampleRate: number): Float32Array {
  const channelData = audioBuffer.getChannelData(0);
  const sourceSampleRate = audioBuffer.sampleRate;
  if (sourceSampleRate === targetSampleRate) {
    return channelData;
  }
  const ratio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(channelData.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = Math.min(channelData.length - 1, Math.round(i * ratio));
    result[i] = channelData[srcIndex];
  }
  return result;
}

/**
 * Plays a pleasant, subtle "bing" chime when switching between states (e.g. Pause <-> Resume/Active).
 * Uses Web Audio API oscillator with quick attack and gentle exponential decay.
 *
 * @param type 'pause' (softer mid tone) or 'resume' (bright upward chime) or 'neutral'
 */
export function playStateSwitchBing(type: 'pause' | 'resume' | 'neutral' = 'neutral'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    if (type === 'resume') {
      // Crisp, pleasant bright rising chime: E5 (659Hz) -> A5 (880Hz)
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'pause') {
      // Soft, warm gentle drop chime: G5 (784Hz) -> E5 (659Hz)
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.07);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.start(now);
      osc.stop(now + 0.30);
    } else {
      // Clean, single bright bell tone at C6 (1046.5Hz)
      osc.frequency.setValueAtTime(1046.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.13, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);

      osc.start(now);
      osc.stop(now + 0.32);
    }

    // Auto-clean audio context after sound finishes
    setTimeout(() => {
      try {
        ctx.close().catch(() => {});
      } catch (_) {}
    }, 450);
  } catch (err) {
    console.debug('[Audio] State switch sound bypassed:', err);
  }
}
