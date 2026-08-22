import { ConversationMode } from './ConversationModes';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'splash' | 'system';
  text: string;
  timestamp: string;
  timeMs: number;
  showForm?: boolean;
  tab?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
  createdAt: string;
  chatTranscript: { sender: string; text: string; timestamp: string }[];
}

export interface TravelDestination {
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  subwayLines: string[];
  subwayDirections: string;
  subwayDirectionsEn: string;
  taxiTime: string;
  taxiFare: string;
  walkTime: string;
  walkDist: string;
  bikeTime: string;
  vocab: string[];
  phrases: { en: string; es: string }[];
}

export interface PronunciationFeedbackEvent {
  id: string;
  phraseSpoken: string;
  detectedIssue: string;
  correctedPronunciation: string;
  coachingSuggestion: string;
  confidence: number;
  evidence?: string;
  timestamp: number;
  sessionId: string;
}

export interface ConversationEvent {
  type: 'MODE_CHANGE' | 'PRONUNCIATION_COACHING' | 'USER_TRANSCRIPTION' | 'ASSISTANT_RESPONSE';
  timestamp: number;
  sessionId: string;
  data: any;
}

export interface LiveAgentProps {
  isWidgetMode: boolean;
  onClose?: () => void;
}
