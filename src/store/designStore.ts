import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DesignBudgetBridge } from '@/engine/designBudgetBridge';

export type StyleKey = 'modern' | 'nordic' | 'japanese' | 'luxury' | 'chinese';

export interface StyleProfile {
    primaryStyle: StyleKey;
    styleScores: Record<StyleKey, number>;
    tonePreference: 'warm' | 'neutral' | 'cool';
    materialPreference: 'wood' | 'stone' | 'mixed';
    keywords: string[];
}

interface DesignState {
    preferredStyle: StyleKey | null;
    favorites: string[];
    quizProfile: StyleProfile | null;
    budgetBridge: DesignBudgetBridge | null;

    toggleFavorite: (id: string) => void;
    setPreferredStyle: (style: StyleKey | null) => void;
    setQuizProfile: (profile: StyleProfile | null) => void;
    setBudgetBridge: (bridge: DesignBudgetBridge | null) => void;
    consumeBudgetBridge: () => DesignBudgetBridge | null;
    clearFavorites: () => void;
}

export const useDesignStore = create<DesignState>()(
    persist(
        (set, get) => ({
            preferredStyle: null,
            favorites: [],
            quizProfile: null,
            budgetBridge: null,

            toggleFavorite: (id) =>
                set((state) => {
                    const has = state.favorites.includes(id);
                    return {
                        favorites: has
                            ? state.favorites.filter((item) => item !== id)
                            : [...state.favorites, id],
                    };
                }),

            setPreferredStyle: (style) => set({ preferredStyle: style }),
            setQuizProfile: (profile) => set({ quizProfile: profile }),
            setBudgetBridge: (bridge) => set({ budgetBridge: bridge }),
            consumeBudgetBridge: () => {
                const bridge = get().budgetBridge;
                set({ budgetBridge: null });
                return bridge;
            },
            clearFavorites: () => set({ favorites: [] }),
        }),
        {
            name: 'renovation-design-store',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
