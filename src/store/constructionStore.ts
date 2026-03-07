import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CHECKLIST_DATA, PURCHASE_DATA, PHASE_LIST } from '@/engine/constructionData';
import {
    ConstructionPhase,
    PhaseInfo,
    ChecklistItem,
    PurchaseItem,
    ConstructionLog,
    PaymentRecord
} from '@/types';
import { aiApi } from '@/api/services';

export interface PhaseState extends PhaseInfo {
    status: 'pending' | 'active' | 'completed';
    startDate?: string;
    endDate?: string;
}

export interface ConstructionState {
    projectId: string | null;
    phases: PhaseState[];
    currentPhase: ConstructionPhase;
    checklists: ChecklistItem[];
    purchases: PurchaseItem[];
    logs: ConstructionLog[];
    payments: PaymentRecord[];
    startDate: string | null;

    initProject: (projectId: string, startDate?: string) => void;
    setCurrentPhase: (phase: ConstructionPhase) => void;
    updatePhase: (phase: string, updates: Partial<PhaseState>) => void;
    completePhase: (phase: string) => void;

    toggleChecklist: (id: string) => void;
    updateChecklistNote: (id: string, note: string) => void;
    updateChecklistPhoto: (id: string, url: string) => void;

    togglePurchase: (id: string) => void;
    updatePurchasePrice: (id: string, price: number) => void;

    uploadPhoto: (file: File) => Promise<string>;
    addLog: (log: Omit<ConstructionLog, 'id' | 'createdAt'>) => void;
    deleteLog: (id: string) => void;

    addPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => void;
    deletePayment: (id: string) => void;

    getPhaseProgress: (phase: string) => { completed: number; total: number; percent: number };
    getTotalProgress: () => number;
    getTotalSpent: () => number;
}

function uid(): string {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

export const useConstructionStore = create<ConstructionState>()(
    persist(
        (set, get) => ({
            projectId: null,
            phases: [],
            currentPhase: 'pre_construction',
            checklists: [],
            purchases: [],
            logs: [],
            payments: [],
            startDate: null,

            initProject: (projectId, startDate) => {
                const start = startDate ?? new Date().toISOString().slice(0, 10);

                // 初始化阶段信息
                const phases: PhaseState[] = PHASE_LIST.map((p, idx) => ({
                    ...p,
                    status: idx === 0 ? 'active' : 'pending',
                }));

                // 初始化清单：确保所有项都有 checked 状态
                const checklists: ChecklistItem[] = CHECKLIST_DATA.map(item => ({
                    ...item,
                    completed: false
                }));

                // 初始化采购清单
                const purchases: PurchaseItem[] = PURCHASE_DATA.map(item => ({
                    ...item,
                    purchased: false
                }));

                set({
                    projectId,
                    startDate: start,
                    phases,
                    currentPhase: 'pre_construction',
                    checklists,
                    purchases,
                    logs: [],
                    payments: [],
                });
            },

            setCurrentPhase: (phase) => set({ currentPhase: phase }),

            updatePhase: (phase, updates) =>
                set((s) => ({
                    phases: s.phases.map(p => p.phase === phase ? { ...p, ...updates } : p),
                })),

            completePhase: (phase) => {
                const s = get();
                const idx = s.phases.findIndex(p => p.phase === phase);
                const nextPhase = (s.phases[idx + 1]?.phase || phase) as ConstructionPhase;
                set({
                    phases: s.phases.map(p => p.phase === phase ? { ...p, status: 'completed' as const } : p),
                    currentPhase: nextPhase
                });
            },

            toggleChecklist: (id) =>
                set((s) => ({
                    checklists: s.checklists.map(c =>
                        c.id === id ? { ...c, completed: !c.completed, completedAt: !c.completed ? new Date().toISOString() : undefined } : c
                    ),
                })),

            updateChecklistNote: (id, note) =>
                set((s) => ({
                    checklists: s.checklists.map(c => c.id === id ? { ...c, note } : c),
                })),

            updateChecklistPhoto: (id, url) =>
                set((s) => ({
                    checklists: s.checklists.map(c => c.id === id ? { ...c, photoUrl: url, completed: true, completedAt: new Date().toISOString() } : c),
                })),

            togglePurchase: (id) =>
                set((s) => ({
                    purchases: s.purchases.map(p => p.id === id ? { ...p, purchased: !p.purchased, purchasedAt: !p.purchased ? new Date().toISOString() : undefined } : p),
                })),

            updatePurchasePrice: (id, price) =>
                set((s) => ({
                    purchases: s.purchases.map(p => p.id === id ? { ...p, actualPrice: price } : p),
                })),

            uploadPhoto: async (file: File) => {
                try {
                    const res = await aiApi.upload(file);
                    return res.url;
                } catch (e) {
                    console.error('Upload failed:', e);
                    throw e;
                }
            },

            addLog: (log) =>
                set((s) => ({
                    logs: [{ ...log, id: uid(), createdAt: new Date().toISOString() }, ...s.logs],
                })),

            deleteLog: (id) =>
                set((s) => ({ logs: s.logs.filter(l => l.id !== id) })),

            addPayment: (payment) =>
                set((s) => ({
                    payments: [{ ...payment, id: uid(), createdAt: new Date().toISOString() }, ...s.payments],
                })),

            deletePayment: (id) =>
                set((s) => ({ payments: s.payments.filter(p => p.id !== id) })),

            getPhaseProgress: (phase) => {
                const items = get().checklists.filter(c => c.phase === phase);
                const total = items.length;
                const completed = items.filter(c => c.completed).length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                return { completed, total, percent };
            },

            getTotalProgress: () => {
                const all = get().checklists;
                if (all.length === 0) return 0;
                return Math.round((all.filter(c => c.completed).length / all.length) * 100);
            },

            getTotalSpent: () => {
                return get().payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            },
        }),
        {
            name: 'renovation-construction-store-v2', // Change name to clear old inconsistent state
        }
    )
);
