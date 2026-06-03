import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:8000",
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface DrugInteraction {
  drug: string;
  condition: string;
}

export interface QueryResponse {
  answer: string;
  timestamp?: string;
  drug_links?: Record<string, string>;
  parsed_result?: {
    drug_conversion?: Array<{
      original: string;
      converted: string;
      reference?: {
        name: string;
        link: string;
      };
    }>;
    interactions?: Array<{
      drug1: string;
      drug2: string;
      status: string;
      details: string;
      reference1?: {
        name: string;
        link: string;
      };
      reference2?: {
        name: string;
        link: string;
      };
    }>;
    summary?: {
      overall_risk?: string;
      major_interactions?: string[];
      recommendations?: string[];
    };
  };
}

export interface StatsResponse {
  drugs: number;
  interactions: number;
  sessions: number;
}

export interface DrugNamesFromImageResponse {
  result: string[];
  timestamp: string;
}

export interface ChatRequest {
  question: string;
  session_id?: string;
}

export interface ChatResponse {
  answer: string;
  session_id: string;
  timestamp: string;
}

// Medicine Cabinet APIs
export interface AddDrugRequest {
  drug_name: string;
  user_id: string;
}

export interface AddDrugResponse {
  message: string;
}

export interface MedicineCabinetStats {
  total_saved_drugs: number;
  total_checks: number;
  total_interaction_alerts: number;
  high_risk_checks: number;
  last_checked_at?: string | null;
  most_checked_drugs: Array<{
    drug_name: string;
    count: number;
  }>;
}

export interface DrugInCabinet {
  drug_name: string;
  interactions: string;
}

export interface MedicineCabinetListResponse {
  user_id: string;
  drugs: DrugInCabinet[];
  count: number;
  stats?: MedicineCabinetStats;
  timestamp: string;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
}

export interface DrugInteractionsResponse {
  drug_name: string;
  user_id: string;
  interactions: DrugInteraction[];
}

export interface InteractionPairRecord {
  drug1: string;
  drug2: string;
  status: string;
  details: string;
  has_interaction: boolean;
  severity: string;
}

export interface InteractionCheckRecordResponse {
  id: string;
  user_id: string;
  checked_drugs: string[];
  result_summary?: string | null;
  overall_risk: string;
  total_pairs: number;
  interactions_found: number;
  interaction_pairs: InteractionPairRecord[];
  result?: unknown;
  source: string;
  checked_at: string;
}

export interface SaveInteractionCheckResponse {
  success: boolean;
  message: string;
  record: InteractionCheckRecordResponse;
  stats: MedicineCabinetStats;
  timestamp: string;
}

export interface InteractionCheckHistoryResponse {
  user_id: string;
  history: InteractionCheckRecordResponse[];
  stats: MedicineCabinetStats;
  count: number;
  timestamp: string;
}

export const drugInteractionAPI = {
  // Query for drug interactions
  query: async (question: string): Promise<QueryResponse> => {
    const response = await api.post<QueryResponse>("/query", { question });
    return response.data;
  },

  // Get statistics
  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get<StatsResponse>("/stats");
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get("/health");
    return response.data;
  },

  // Extract drug names from image
  extractDrugNamesFromImage: async (file: File): Promise<DrugNamesFromImageResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<DrugNamesFromImageResponse>("/drug-name-extract/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Chat with session
  chat: async (question: string, sessionId?: string): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>("/chat", {
      question,
      session_id: sessionId,
    });
    return response.data;
  },

  clearChatSession: async (sessionId = "hackathon"): Promise<void> => {
    await api.delete(`/chat/${sessionId}`);
  },

  // Medicine Cabinet APIs
  addDrugToCabinet: async (drugName: string, userId: string): Promise<AddDrugResponse> => {
    const response = await api.post<AddDrugResponse>("/medicine-cabinet/add", {
      drug_name: drugName,
      user_id: userId,
    });
    return response.data;
  },

  getMedicineCabinet: async (userId: string): Promise<MedicineCabinetListResponse> => {
    const response = await api.get<MedicineCabinetListResponse>("/medicine-cabinet/list", {
      params: { user_id: userId },
    });
    return response.data;
  },

  removeDrugFromCabinet: async (drugName: string, userId: string): Promise<string> => {
    const response = await api.delete<string>(`/medicine-cabinet/remove/${drugName}`, {
      params: { user_id: userId },
    });
    return response.data;
  },

  getDrugInteractions: async (drugName: string, userId: string): Promise<DrugInteractionsResponse> => {
    const response = await api.get<DrugInteractionsResponse>(`/medicine-cabinet/interactions/${drugName}`, {
      params: { user_id: userId },
    });
    return response.data;
  },

  clearMedicineCabinet: async (userId: string): Promise<string> => {
    const response = await api.delete<string>("/medicine-cabinet/clear", {
      params: { user_id: userId },
    });
    return response.data;
  },

  saveInteractionCheckHistory: async (
    userId: string,
    checkedDrugs: string[],
    result: unknown,
    source = "interaction_check"
  ): Promise<SaveInteractionCheckResponse> => {
    const response = await api.post<SaveInteractionCheckResponse>("/medicine-cabinet/check-history", {
      user_id: userId,
      checked_drugs: checkedDrugs,
      result,
      source,
    });
    return response.data;
  },

  getInteractionCheckHistory: async (userId: string, limit = 20): Promise<InteractionCheckHistoryResponse> => {
    const response = await api.get<InteractionCheckHistoryResponse>("/medicine-cabinet/check-history", {
      params: { user_id: userId, limit },
    });
    return response.data;
  },

  clearInteractionCheckHistory: async (userId: string): Promise<string> => {
    const response = await api.delete<string>("/medicine-cabinet/check-history", {
      params: { user_id: userId },
    });
    return response.data;
  },
};

export default api;
