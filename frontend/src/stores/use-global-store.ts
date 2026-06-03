import { create } from "zustand";

interface GlobalState {
  inputSearch: string;
  globalLoading: boolean;
  clientId: string;
  isChatbotOpen: boolean;
  interactionContext: string[];
}

export interface GlobalStore extends GlobalState {
  setInputSearch: (value: string) => void;
  setGlobalLoading: (value: boolean) => void;
  setClientId: (value: string) => void;
  openChatbot: () => void;
  closeChatbot: () => void;
  setInteractionContext: (value: string[]) => void;
  clearInteractionContext: () => void;
}

const initialState: Pick<GlobalStore, keyof GlobalState> = {
  inputSearch: "",
  globalLoading: false,
  clientId: "",
  isChatbotOpen: false,
  interactionContext: [],
};

const useGlobalStore = create<GlobalStore>((set) => ({
  ...initialState,
  setInputSearch: (value) => set(() => ({ inputSearch: value })),
  setGlobalLoading: (value: boolean) => set(() => ({ globalLoading: value })),
  setClientId: (value: string) => set(() => ({ clientId: value })),
  openChatbot: () => set(() => ({ isChatbotOpen: true })),
  closeChatbot: () => set(() => ({ isChatbotOpen: false })),
  setInteractionContext: (value: string[]) => set(() => ({ interactionContext: value })),
  clearInteractionContext: () => set(() => ({ interactionContext: [] })),
}));

export default useGlobalStore;
