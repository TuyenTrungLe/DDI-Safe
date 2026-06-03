import { create } from 'zustand';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  messages: ChatMessageItem[];
  clientId: string | null;
  addMessage: (m: ChatMessageItem) => void;
  updateMessage: (id: string, partial: Partial<ChatMessageItem>) => void;
  setClientId: (id: string) => void;
  clear: () => void;
}

const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  clientId: null,
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  updateMessage: (id, partial) =>
    set((s) => ({
      messages: s.messages.map((message) =>
        message.id === id ? { ...message, ...partial } : message,
      ),
    })),
  setClientId: (id) => set({ clientId: id }),
  clear: () => set({ messages: [], clientId: null }),
}));

export default useChatStore;
