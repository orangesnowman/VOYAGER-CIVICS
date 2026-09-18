import React, { useState } from 'react';
import { X, Bookmark, Plus, Search, Trash2, Edit3, Check, MessageSquare, Play, Clock, Sparkles, FolderOpen, ArrowRight } from 'lucide-react';

export interface SavedChatSession {
  id: string;
  date: string;
  title: string;
  durationSeconds: number;
  messageCount: number;
  snippet: string;
  messages: { sender: string; text: string; timestamp?: Date | string }[];
}

interface SavedChatsModalProps {
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
}

export const SavedChatsModal: React.FC<SavedChatsModalProps> = ({
  isOpen,
  onClose,
  selectedLang,
  savedChats,
  currentBookmarkedChatId,
  onLoadChat,
  onNewChat,
  onSaveCurrentChat,
  onRenameChat,
  onDeleteChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [expandedChatId, setExpandedChatId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredChats = savedChats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (chat.title || '').toLowerCase().includes(q);
    const snippetMatch = (chat.snippet || '').toLowerCase().includes(q);
    const msgMatch = chat.messages && chat.messages.some(m => (m.text || '').toLowerCase().includes(q));
    return titleMatch || snippetMatch || msgMatch;
  });

  const handleStartEditing = (chat: SavedChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitleText(chat.title);
  };

  const handleSaveTitle = (chatId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitleText.trim()) {
      onRenameChat(chatId, editingTitleText.trim());
    }
    setEditingChatId(null);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(selectedLang === 'EN' ? 'en-US' : 'es-ES', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in select-none">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      
      <div className="relative z-10 w-full max-w-2xl bg-[#0B172E] border border-amber-500/30 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden text-white animate-scale-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between bg-gradient-to-r from-[#0E2044] to-[#0A162D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Bookmark className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
                <span>{selectedLang === 'EN' ? 'Saved Conversations' : 'Conversaciones Guardadas'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  {savedChats.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {selectedLang === 'EN' 
                  ? 'Review, restore or manage your practice chats' 
                  : 'Revisa, restaura o administra tus chats de práctica'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md"
              title={selectedLang === 'EN' ? 'Start New Chat' : 'Iniciar Nueva Conversación'}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">{selectedLang === 'EN' ? 'New Chat' : 'Nueva Chat'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar (Search & Quick Action) */}
        <div className="p-4 bg-[#081226] border-b border-slate-800 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={selectedLang === 'EN' ? 'Search saved chats...' : 'Buscar conversaciones guardadas...'}
              className="w-full pl-9 pr-3 py-2 bg-[#0E1C38] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:border-amber-400/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onSaveCurrentChat();
            }}
            className="w-full sm:w-auto px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/60 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            title={selectedLang === 'EN' ? 'Save Current Active Chat' : 'Guardar Conversación Actual'}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            <span>{selectedLang === 'EN' ? 'Save Active Chat' : 'Guardar Chat Actual'}</span>
          </button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0 bg-[#071124]">
          {filteredChats.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500">
                <Bookmark className="w-8 h-8 opacity-40" />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-bold text-slate-300 mb-1">
                  {searchQuery 
                    ? (selectedLang === 'EN' ? 'No chats match your search' : 'No hay conversaciones que coincidan')
                    : (selectedLang === 'EN' ? 'No saved conversations yet' : 'Aún no hay conversaciones guardadas')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {selectedLang === 'EN'
                    ? 'Save your practice sessions with VOYAGER using the 🔖 bookmark icon to review or reload them anytime.'
                    : 'Guarda tus sesiones de práctica con VOYAGER usando el ícono 🔖 para revisarlas o reanudarlas en cualquier momento.'}
                </p>
              </div>

              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveCurrentChat();
                  }}
                  className="mt-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg active:scale-95"
                >
                  <Bookmark className="w-4 h-4 fill-slate-950" />
                  <span>{selectedLang === 'EN' ? 'Save Current Chat Now' : 'Guardar Conversación Actual Ahora'}</span>
                </button>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === currentBookmarkedChatId;
              const isEditing = editingChatId === chat.id;
              const isExpanded = expandedChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  className={`group border rounded-2xl p-3.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-[#0B1832] border-slate-700/70 hover:border-amber-400/40 hover:bg-[#0F2042]'
                  }`}
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400 border border-amber-400/30'
                        }`}>
                          <Bookmark className={`w-4 h-4 ${isActive ? 'fill-slate-950' : 'fill-amber-400/30'}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <form 
                              onSubmit={(e) => handleSaveTitle(chat.id, e)}
                              className="flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                autoFocus
                                value={editingTitleText}
                                onChange={(e) => setEditingTitleText(e.target.value)}
                                className="bg-slate-900 border border-amber-400 rounded-lg px-2 py-1 text-xs text-white outline-none w-full"
                              />
                              <button
                                type="submit"
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2 group/title">
                              <h4 className="text-sm font-bold text-white leading-tight truncate">
                                {chat.title}
                              </h4>
                              <button
                                type="button"
                                onClick={(e) => handleStartEditing(chat, e)}
                                className="opacity-0 group-hover/title:opacity-100 p-0.5 text-slate-400 hover:text-amber-300 transition-opacity cursor-pointer"
                                title={selectedLang === 'EN' ? 'Rename' : 'Renombrar'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {isActive && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                  {selectedLang === 'EN' ? 'Active' : 'Activo'}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1">
                            <span>{formatDate(chat.date)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-cyan-400" />
                              {chat.messageCount} {selectedLang === 'EN' ? 'messages' : 'mensajes'}
                            </span>
                            {chat.durationSeconds > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-mono text-amber-300/90">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(chat.durationSeconds)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadChat(chat);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                          title={selectedLang === 'EN' ? 'Load & Continue Chat' : 'Cargar y Continuar Chat'}
                        >
                          <FolderOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{selectedLang === 'EN' ? 'Load' : 'Cargar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteChat(chat.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                          title={selectedLang === 'EN' ? 'Delete saved chat' : 'Eliminar conversación guardada'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Snippet / Preview */}
                    {chat.snippet && (
                      <div className="text-xs text-slate-300/90 bg-[#081328] border border-slate-800 rounded-xl p-2.5 leading-relaxed font-sans line-clamp-2 italic">
                        "{chat.snippet}"
                      </div>
                    )}

                    {/* Expandable full history preview */}
                    {chat.messages && chat.messages.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedChatId(isExpanded ? null : chat.id)}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? (selectedLang === 'EN' ? 'Hide Transcript' : 'Ocultar Transcripción') : (selectedLang === 'EN' ? 'View Transcript' : 'Ver Transcripción')}</span>
                          <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-3 bg-[#050D1D] rounded-xl border border-slate-800 max-h-56 overflow-y-auto space-y-2 custom-scrollbar text-xs">
                            {chat.messages.map((msg, mIdx) => (
                              <div
                                key={mIdx}
                                className={`p-2 rounded-lg leading-relaxed ${
                                  msg.sender === 'user'
                                    ? 'bg-cyan-950/40 border border-cyan-800/40 text-cyan-100 text-right ml-6'
                                    : 'bg-slate-900 border border-slate-800 text-slate-200 text-left mr-6'
                                }`}
                              >
                                <div className="text-[10px] font-bold text-slate-400 mb-0.5">
                                  {msg.sender === 'user' ? (selectedLang === 'EN' ? 'You' : 'Tú') : 'VOYAGER'}
                                </div>
                                <div>{msg.text}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#081226] flex items-center justify-between text-xs text-slate-400">
          <span>
            {selectedLang === 'EN'
              ? 'Saved chats automatically synchronize across sessions.'
              : 'Tus chats guardados se sincronizan automáticamente.'}
          </span>
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{selectedLang === 'EN' ? '+ Start Fresh Conversation' : '+ Iniciar Conversación Limpia'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedChatsModal;
