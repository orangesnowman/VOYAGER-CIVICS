/**
 * VOYAGER EXCLUSIVE VOICE SERVICE
 *
 * Voyager Voice Engine Mandate:
 * - All spoken audio must originate EXCLUSIVELY from Voyager's configured voice ("Puck" via Gemini Live / backend WebSocket).
 * - Strictly PROHIBITED: window.speechSynthesis, SpeechSynthesisUtterance, browser OS voices.
 * - When Gemini Live is disconnected or unavailable, the system MUST REMAIN SILENT and display text only.
 */

export interface VoiceSendOptions {
  isConnected?: boolean;
  sendLiveText?: ((text: string) => void) | null;
  onDisplayTextOnly?: (text: string) => void;
  lang?: 'EN' | 'ES';
  role?: 'assistant' | 'instruction';
}

export const voyagerVoice = {
  /**
   * Speak a message exclusively through Voyager's authentic Gemini Live voice ("Puck").
   * If the voice engine is disconnected/unavailable, displays text and remains 100% silent.
   * NEVER falls back to browser SpeechSynthesis.
   */
  speak(text: string, options: VoiceSendOptions = {}): boolean {
    const { isConnected = false, sendLiveText = null, onDisplayTextOnly, lang = 'ES' } = options;

    // Strict safety: cancel any browser speech synthesis that may have been triggered
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    if (isConnected && sendLiveText) {
      const prompt = lang === 'EN'
        ? `[VOYAGER EXCLUSIVE VOICE INSTRUCTION: Speak aloud in your natural Voyager voice: "${text}". Do not add greetings, extra commentary, or conversational filler.]`
        : `[INSTRUCCIÓN MANDATORIA DE VOZ VOYAGER: Di en voz alta con tu voz natural de Voyager: "${text}". No agregues saludos, comentarios extras ni relleno conversacional.]`;
      sendLiveText(prompt);
      return true;
    }

    // Disconnected / unavailable fallback: SILENT text display only
    if (onDisplayTextOnly) {
      onDisplayTextOnly(text);
    }
    return false;
  },

  /**
   * Cancel and silence any active browser audio / speech synthesis.
   */
  silenceAll(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  },

  /**
   * Check if Voyager's native voice engine is currently connected and ready.
   */
  isAvailable(isConnected: boolean): boolean {
    return isConnected;
  }
};
