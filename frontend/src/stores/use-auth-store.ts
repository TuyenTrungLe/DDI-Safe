import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { drugInteractionAPI, type MedicineCabinetStats } from "@/lib/api";

export interface InteractionCheckRecord {
  id: string;
  timestamp: string;
  drugs: string[];
  result: any; // Can be string or object with parsed_result
  summary?: string;
  checked_drugs?: string[];
  checked_at?: string;
  result_summary?: string | null;
  overall_risk?: string;
  total_pairs?: number;
  interactions_found?: number;
  interaction_pairs?: Array<{
    drug1: string;
    drug2: string;
    status: string;
    details: string;
    has_interaction: boolean;
    severity: string;
  }>;
}

export interface DrugInCabinet {
  drug_name: string;
  interactions?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  // Personal medicine cabinet - list of drugs used with interactions
  personalMedicineCabinet?: DrugInCabinet[];
  // Interaction check history
  interactionHistory?: InteractionCheckRecord[];
  medicineCabinetStats?: MedicineCabinetStats;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => void;
  addInteractionCheck: (drugs: string[], result: any) => Promise<void>;
  addToMedicineCabinet: (drugs: string[]) => Promise<number>; // Returns number of new drugs added
  fetchMedicineCabinet: () => Promise<void>; // Fetch from API
  fetchInteractionHistory: () => Promise<void>; // Fetch saved check history
  removeDrugFromCabinet: (drugName: string) => Promise<void>; // Remove drug from API
  clearMedicineCabinet: () => Promise<void>; // Clear all drugs from API
  clearInteractionHistory: () => Promise<void>; // Clear saved check history
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, _password: string) => {
        // Mock login - frontend only, no API yet
        // Tạo user mới hoặc lấy từ localStorage
        const mockUser: User = {
          id: email, // Use email as user_id for API
          name: email.split("@")[0],
          email: email,
        };
        set({ user: mockUser, isAuthenticated: true });
        // Fetch medicine cabinet from API after login
        try {
          await useAuthStore.getState().fetchMedicineCabinet();
          await useAuthStore.getState().fetchInteractionHistory();
        } catch (error) {
          console.error("Error fetching profile data after login:", error);
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      updateProfile: (profile: Partial<User>) => {
        set((state) => {
          if (state.user) {
            return {
              user: { ...state.user, ...profile },
            };
          }
          return state;
        });
      },
      addInteractionCheck: async (drugs: string[], result: any) => {
        const state = useAuthStore.getState();
        if (!state.user) {
          return;
        }

        try {
          const response = await drugInteractionAPI.saveInteractionCheckHistory(state.user.id, drugs, result);
          const savedRecord: InteractionCheckRecord = {
            ...response.record,
            id: response.record.id,
            timestamp: response.record.checked_at,
            drugs: response.record.checked_drugs,
            result: response.record.result,
          };

          set((state) => {
            if (!state.user) return state;
            const history = state.user.interactionHistory || [];
            return {
              user: {
                ...state.user,
                interactionHistory: [savedRecord, ...history.filter((record) => record.id !== savedRecord.id)].slice(0, 50),
                medicineCabinetStats: response.stats,
              },
            };
          });
        } catch (error) {
          console.error("Error saving interaction check history:", error);
          set((state) => {
            if (!state.user) return state;
            const newRecord: InteractionCheckRecord = {
              id: `check-${Date.now()}`,
              timestamp: new Date().toISOString(),
              drugs,
              result,
              checked_drugs: drugs,
              checked_at: new Date().toISOString(),
              overall_risk: "Unknown",
              total_pairs: result?.parsed_result?.interactions?.length || 0,
              interactions_found: 0,
              interaction_pairs: [],
            };
            const history = state.user.interactionHistory || [];
            return {
              user: {
                ...state.user,
                interactionHistory: [newRecord, ...history].slice(0, 50),
              },
            };
          });
        }
      },
      addToMedicineCabinet: async (drugs: string[]) => {
        const state = useAuthStore.getState();
        if (!state.user) {
          return 0;
        }
        const userId = state.user.id;
        const currentDrugs = state.user.personalMedicineCabinet || [];
        const currentDrugNames = currentDrugs.map((d) => d.drug_name);
        const newDrugs = drugs.filter((drug) => !currentDrugNames.includes(drug));
        let newCount = 0;

        // Add each new drug to API
        for (const drug of newDrugs) {
          try {
            await drugInteractionAPI.addDrugToCabinet(drug, userId);
            newCount++;
          } catch (error) {
            console.error(`Error adding drug ${drug} to cabinet:`, error);
            // Continue with other drugs even if one fails
          }
        }

        // Refresh from API after adding
        if (newCount > 0) {
          await state.fetchMedicineCabinet();
        }

        return newCount;
      },
      fetchMedicineCabinet: async () => {
        const state = useAuthStore.getState();
        if (!state.user) return;

        try {
          const response = await drugInteractionAPI.getMedicineCabinet(state.user.id);
          // Map API response to DrugInCabinet format
          const drugs: DrugInCabinet[] = response.drugs.map((drug) => ({
            drug_name: drug.drug_name,
            interactions: drug.interactions,
          }));
          set((state) => {
            if (state.user) {
              return {
                user: {
                  ...state.user,
                  personalMedicineCabinet: drugs,
                  medicineCabinetStats: response.stats || state.user.medicineCabinetStats,
                },
              };
            }
            return state;
          });
        } catch (error) {
          console.error("Error fetching medicine cabinet:", error);
        }
      },
      fetchInteractionHistory: async () => {
        const state = useAuthStore.getState();
        if (!state.user) return;

        try {
          const response = await drugInteractionAPI.getInteractionCheckHistory(state.user.id, 20);
          const existingHistory = state.user.interactionHistory || [];
          const history: InteractionCheckRecord[] =
            response.history.length === 0 && existingHistory.length > 0
              ? existingHistory
              : response.history.map((record) => ({
                  ...record,
                  id: record.id,
                  timestamp: record.checked_at,
                  drugs: record.checked_drugs,
                  result: record.result,
                }));
          set((state) => {
            if (!state.user) return state;
            return {
              user: {
                ...state.user,
                interactionHistory: history,
                medicineCabinetStats:
                  response.history.length === 0 && history.length > 0
                    ? state.user.medicineCabinetStats
                    : response.stats,
              },
            };
          });
        } catch (error) {
          console.error("Error fetching interaction check history:", error);
        }
      },
      removeDrugFromCabinet: async (drugName: string) => {
        const state = useAuthStore.getState();
        if (!state.user) return;

        try {
          await drugInteractionAPI.removeDrugFromCabinet(drugName, state.user.id);
          // Refresh from API after removing
          await state.fetchMedicineCabinet();
        } catch (error) {
          console.error("Error removing drug from cabinet:", error);
          throw error;
        }
      },
      clearMedicineCabinet: async () => {
        const state = useAuthStore.getState();
        if (!state.user) return;

        try {
          await drugInteractionAPI.clearMedicineCabinet(state.user.id);
          // Update local state
          set((state) => {
            if (state.user) {
              return {
                user: {
                  ...state.user,
                  personalMedicineCabinet: [],
                  medicineCabinetStats: {
                    ...(state.user.medicineCabinetStats || {
                      total_saved_drugs: 0,
                      total_checks: 0,
                      total_interaction_alerts: 0,
                      high_risk_checks: 0,
                      last_checked_at: null,
                      most_checked_drugs: [],
                    }),
                    total_saved_drugs: 0,
                  },
                },
              };
            }
            return state;
          });
        } catch (error) {
          console.error("Error clearing medicine cabinet:", error);
          throw error;
        }
      },
      clearInteractionHistory: async () => {
        const state = useAuthStore.getState();
        if (!state.user) return;

        try {
          await drugInteractionAPI.clearInteractionCheckHistory(state.user.id);
          set((state) => {
            if (!state.user) return state;
            return {
              user: {
                ...state.user,
                interactionHistory: [],
                medicineCabinetStats: {
                  total_saved_drugs: state.user.personalMedicineCabinet?.length || 0,
                  total_checks: 0,
                  total_interaction_alerts: 0,
                  high_risk_checks: 0,
                  last_checked_at: null,
                  most_checked_drugs: [],
                },
              },
            };
          });
        } catch (error) {
          console.error("Error clearing interaction check history:", error);
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;
