import { create } from 'zustand';

export const useAuth = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
}));

export const useChat = create((set, get) => ({
  sessions: [],
  activeChatId: null,
  messages: {},
  streaming: false,

  setSessions: (sessions) => set({ sessions }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setStreaming: (v) => set({ streaming: v }),

  setMessages: (chatId, messages) =>
    set(s => ({ messages: { ...s.messages, [chatId]: messages } })),

  pushMessage: (chatId, msg) =>
    set(s => ({ messages: { ...s.messages, [chatId]: [...(s.messages[chatId] || []), msg] } })),

  appendDelta: (chatId, delta) =>
    set(s => {
      const msgs = [...(s.messages[chatId] || [])];
      if (!msgs.length) return s;
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + delta };
      return { messages: { ...s.messages, [chatId]: msgs } };
    }),
}));
