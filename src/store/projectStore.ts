import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { HouseProfile, BudgetResult, AIMessage } from '@/types';

interface ProjectState {
    // 当前项目
    currentHouse: Partial<HouseProfile> | null;
    budgetResult: BudgetResult | null;
    aiMessages: AIMessage[];

    // 项目列表
    projects: HouseProfile[];

    // Actions
    setCurrentHouse: (house: Partial<HouseProfile>) => void;
    updateCurrentHouse: (updates: Partial<HouseProfile>) => void;
    setBudgetResult: (result: BudgetResult) => void;
    addAIMessage: (message: AIMessage) => void;
    clearAIMessages: () => void;
    saveProject: (house: HouseProfile) => void;
    reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            currentHouse: null,
            budgetResult: null,
            aiMessages: [],
            projects: [],

            setCurrentHouse: (house) => set({ currentHouse: house }),

            updateCurrentHouse: (updates) => set((state) => ({
                currentHouse: { ...state.currentHouse, ...updates },
            })),

            setBudgetResult: (result) => set({ budgetResult: result }),

            addAIMessage: (message) => set((state) => ({
                aiMessages: [...state.aiMessages, message],
            })),

            clearAIMessages: () => set({ aiMessages: [] }),

            saveProject: (house) => set((state) => {
                const existing = state.projects.findIndex(p => p.id === house.id);
                const projects = [...state.projects];
                if (existing >= 0) {
                    projects[existing] = house;
                } else {
                    projects.push(house);
                }
                return { projects };
            }),

            reset: () => set({
                currentHouse: null,
                budgetResult: null,
                aiMessages: [],
            }),
        }),
        {
            name: 'renovation-project',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                projects: state.projects,
                currentHouse: state.currentHouse,
            }),
        }
    )
);
