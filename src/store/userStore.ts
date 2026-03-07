import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AIModelConfig, StorageConfig } from '@/types';

interface UserState {
    // AI模型配置
    aiModels: AIModelConfig[];
    activeModelId: string | null;

    // 存储配置
    storageConfig: StorageConfig | null;

    // Actions
    setAIModels: (models: AIModelConfig[]) => void;
    addAIModel: (model: AIModelConfig) => void;
    updateAIModel: (id: string, updates: Partial<AIModelConfig>) => void;
    removeAIModel: (id: string) => void;
    setActiveModel: (id: string) => void;
    setStorageConfig: (config: StorageConfig) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            aiModels: [],
            activeModelId: null,
            storageConfig: null,

            setAIModels: (models) => set({ aiModels: models }),

            addAIModel: (model) => set((state) => ({
                aiModels: [...state.aiModels, model],
            })),

            updateAIModel: (id, updates) => set((state) => ({
                aiModels: state.aiModels.map(m => m.id === id ? { ...m, ...updates } : m),
            })),

            removeAIModel: (id) => set((state) => ({
                aiModels: state.aiModels.filter(m => m.id !== id),
                activeModelId: state.activeModelId === id ? null : state.activeModelId,
            })),

            setActiveModel: (id) => set({ activeModelId: id }),

            setStorageConfig: (config) => set({ storageConfig: config }),
        }),
        {
            name: 'renovation-user',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
