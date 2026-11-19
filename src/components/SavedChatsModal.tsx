import React from 'react';

export interface SavedChatSession {
  id: string;
  date: string;
  title: string;
  durationSeconds: number;
  messageCount: number;
  snippet: string;
  messages: { sender: string; text: string; timestamp?: Date | string }[];
  sessionType?: 'free_conversation' | 'guided_lesson';
  isDeliberatelySaved?: boolean;
  lessonId?: string;
  category?: string;
  level?: string;
  lessonStatus?: 'in_progress' | 'completed';
  progressPercentage?: number;
}

export interface ActiveLessonItem {
  id: string;
  lessonId: string;
  title: string;
  subtitle?: string;
  category: string;
  level: string;
  estimatedMinutes: number;
  objective?: string;
  scenario?: string;
  status: 'in_progress' | 'completed';
  progressPercentage?: number;
  startedAt: string;
  completedAt?: string;
}

export interface SavedChatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLang: 'EN' | 'ES';
  savedChats: SavedChatSession[];
  currentBookmarkedChatId: string | null;
  onLoadChat: (chat: SavedChatSession) => void;
  onNewChat: () => void;
  onSaveCurrentChat: () => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onStartLessonInChat?: (lesson: any, assignment?: any) => void;
}

/**
 * Permanently deactivated: The modal, backdrop, and floating dialog have been removed.
 * In-layout, page-based navigation is hosted inside NavigationDrawer within the hamburger container.
 */
export const SavedChatsModal: React.FC<SavedChatsModalProps> = () => null;

export default SavedChatsModal;
