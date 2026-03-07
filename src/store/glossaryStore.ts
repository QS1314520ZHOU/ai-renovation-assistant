import { create } from 'zustand';
import { glossaryApi } from '@/api/services';

interface GlossaryTerm {
    id: string;
    term: string;
    definition: string;
    category: string;
    risk?: string;
    verify_method?: string;
    aliases?: string[];
}

interface GlossaryState {
    terms: GlossaryTerm[];
    loading: boolean;
    initialized: boolean;
    init: () => Promise<void>;
    findTerm: (name: string) => GlossaryTerm | undefined;
}

export const useGlossaryStore = create<GlossaryState>((set, get) => ({
    terms: [],
    loading: false,
    initialized: false,
    init: async () => {
        if (get().initialized) return;
        set({ loading: true });
        try {
            const terms = await glossaryApi.list();
            set({ terms, initialized: true });
        } catch (error) {
            console.error('Failed to fetch glossary:', error);
        } finally {
            set({ loading: false });
        }
    },
    findTerm: (name: string) => {
        const { terms } = get();
        return terms.find(t =>
            t.term === name ||
            (t.aliases && t.aliases.includes(name))
        );
    }
}));
