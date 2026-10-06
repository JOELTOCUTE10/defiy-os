import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { chatApi } from '../api/endpoints';
import type { Conversation, ChatMessage } from '../api/types';
import { useToast } from '../hooks/useToast';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { TypingDots } from '../components/chat/TypingDots';
import { SuggestedPrompts } from '../components/chat/SuggestedPrompts';
import { Button } from '../components/ui/Button';

export const ChatPage: React.FC = () => {
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [noEngineFlag, setNoEngineFlag] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Fetch initial conversations list
  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const convs = await chatApi.getConversations();
      setConversations(convs);
      if (convs.length > 0) {
        setActiveConvId(convs[0].id);
      } else {
        // Auto create first conversation
        handleNewConversation();
      }
    } catch {
      showToast('Failed to load chat history.', 'error');
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    let mounted = true;
    setLoadingMessages(true);
    chatApi
      .getMessages(activeConvId)
      .then((msgs) => {
        if (mounted) {
          setMessages(msgs);
        }
      })
      .catch(() => {
        if (mounted) {
          showToast('Failed to load conversation messages.', 'error');
        }
      })
      .finally(() => {
        if (mounted) setLoadingMessages(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeConvId]);

  const handleNewConversation = async () => {
    try {
      const newConv = await chatApi.createConversation('New Conversation');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setNoEngineFlag(false);
      setDrawerOpen(false);
    } catch {
      showToast('Failed to create new conversation.', 'error');
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatApi.deleteConversation(id);
      const updated = conversations.filter((c) => c.id !== id);
      setConversations(updated);
      if (activeConvId === id) {
        if (updated.length > 0) {
          setActiveConvId(updated[0].id);
        } else {
          handleNewConversation();
        }
      }
      showToast('Conversation deleted.', 'info');
    } catch {
      showToast('Failed to delete conversation.', 'error');
    }
  };

  const handleSendMessage = async (content: string, source: 'text' | 'voice' = 'text') => {
    if (!activeConvId || !content.trim()) return;

    // Optimistic user message insertion
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId,
      sender: 'user',
      content,
      created_date: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await chatApi.sendMessage(activeConvId, content, source);
      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
      if (res.flags?.no_engine) {
        setNoEngineFlag(true);
      } else {
        setNoEngineFlag(false);
      }

      // Update title in list if default
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId && c.title === 'New Conversation'
            ? { ...c, title: content.slice(0, 30) + '...' }
            : c
        )
      );
    } catch {
      showToast('Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex-1 flex h-[calc(100vh-8rem)] overflow-hidden rounded-3xl border border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard shadow-lg relative">
      {/* Sidebar Drawer */}
      <aside
        className={`absolute md:relative z-30 inset-y-0 left-0 w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-darkborder p-4 flex flex-col transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            <span>Chat History</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Button
          variant="primary"
          onClick={handleNewConversation}
          className="w-full flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </Button>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {loadingConvs ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading history...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">No chats yet.</div>
          ) : (
            conversations.map((conv) => {
              const active = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setDrawerOpen(false);
                  }}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer text-xs font-medium transition-all ${
                    active
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate pr-2">{conv.title || 'Untitled Chat'}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-20"
        />
      )}

      {/* Main Chat Content */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-darkbg/50">
        {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-accent flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeConv?.title || 'Defiy AI Life Coach'}
                </h2>
                <p className="text-[10px] text-slate-400">
                  Voice & text enabled • Multi-domain assistant
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Honest Banner if AI engine is not configured */}
        {noEngineFlag && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2.5 px-4">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              <strong>AI engine not connected yet</strong> — Add <code className="font-mono font-semibold">GEMINI_API_KEY</code> in backend <code className="font-mono">.env</code> for generative responses. Built-in command shortcuts still work!
            </span>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="text-center text-xs text-slate-400 py-10">
              Loading message history...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className="inline-flex p-4 rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-3">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  How can Defiy assist you today?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Log a meal, schedule a workout, check goals, or ask for guidance. Pick a prompt
                  or type below.
                </p>
              </div>
              <SuggestedPrompts onSelectPrompt={(p) => handleSendMessage(p)} />
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {sending && (
                <div className="mr-auto">
                  <TypingDots />
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input */}
        <div className="p-3 sm:p-4 bg-white dark:bg-darkcard border-t border-slate-200 dark:border-darkborder">
          <ChatInput onSend={(text, src) => handleSendMessage(text, src)} disabled={sending} />
        </div>
      </div>
    </div>
  );
};
