import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CHECKLIST_DATA } from '@/engine/constructionData';
import {
    ConstructionPhase,
    PhaseInfo as BasePhaseInfo,
    ChecklistItem as BaseChecklistItem,
    PurchaseItem as BasePurchaseItem,
    ConstructionLog,
    PaymentRecord as BasePaymentRecord
} from '@/types';

// ---- 扩展类型以适应 Store 状态 ----
export interface PhaseInfo extends Omit<BasePhaseInfo, 'phase' | 'order' | 'typicalDurationDays'> {
    key: string;
    duration: string;
    status: 'pending' | 'active' | 'completed';
}

export interface ChecklistItem {
    id: string;
    phase: string;
    group: string;
    content: string;
    checked: boolean;
    note?: string;
    requirePhoto?: boolean;
    photoUrl?: string;
}

export interface PurchaseItem {
    id: string;
    phase: string;
    name: string;
    category: string;
    estimatedPrice?: number;
    actualPrice?: number;
    purchased: boolean;
    needMeasure: boolean;
    measureNote?: string;
    deadline?: string;
}

// Re-export ConstructionLog from @/types to maintain interface compatibility
export type { ConstructionLog } from '@/types';

export interface PaymentRecord {
    id: string;
    phase: string;
    type: 'deposit' | 'phase_payment' | 'material_purchase' | 'final_payment' | 'other';
    amount: number;
    payee: string;
    date: string;
    note?: string;
    receiptUrl?: string;
}

export interface ConstructionState {
    // 状态
    projectId: string | null;
    phases: PhaseInfo[];
    currentPhase: ConstructionPhase;
    checklists: ChecklistItem[];
    purchases: PurchaseItem[];
    logs: ConstructionLog[];
    payments: PaymentRecord[];
    startDate: string | null;

    // 操作
    initProject: (projectId: string, startDate?: string) => void;
    setCurrentPhase: (phase: ConstructionPhase) => void;
    updatePhase: (phase: string, updates: Partial<PhaseInfo>) => void;
    completePhase: (phase: string) => void;

    // 验收清单
    toggleChecklist: (id: string, phase: string) => void;
    updateChecklistNote: (id: string, note: string) => void;

    // 采购
    togglePurchase: (id: string) => void;
    updatePurchasePrice: (id: string, price: number) => void;

    // 日志
    addLog: (log: Omit<ConstructionLog, 'id' | 'createdAt'>) => void;
    deleteLog: (id: string) => void;

    // 付款
    addPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => void;
    deletePayment: (id: string) => void;

    // 计算
    getPhaseProgress: (phase: string) => { completed: number; total: number; percent: number };
    getTotalProgress: () => number;
    getTotalSpent: () => number;
}

// ---- 默认阶段列表 ----
const DEFAULT_PHASES: PhaseInfo[] = [
    { key: 'demolition', name: '拆改阶段', icon: '🔨', duration: '3-5天', description: '墙体拆除、新建墙体、铲墙皮', status: 'pending' },
    { key: 'hydroelectric', name: '水电改造', icon: '🔌', duration: '5-7天', description: '水路电路改造、开槽布线', status: 'pending' },
    { key: 'waterproof', name: '防水工程', icon: '💧', duration: '3-5天', description: '卫生间厨房防水施工与闭水试验', status: 'pending' },
    { key: 'masonry', name: '泥瓦工程', icon: '🧱', duration: '7-15天', description: '瓷砖铺贴、地面找平', status: 'pending' },
    { key: 'carpentry', name: '木工工程', icon: '🪵', duration: '5-10天', description: '吊顶、造型、现场柜体', status: 'pending' },
    { key: 'painting', name: '油漆工程', icon: '🎨', duration: '7-10天', description: '墙面批腻子、刷漆/贴壁纸', status: 'pending' },
    { key: 'cabinet_install', name: '橱柜安装', icon: '🗄️', duration: '2-3天', description: '橱柜、衣柜安装', status: 'pending' },
    { key: 'door_window', name: '门窗安装', icon: '🚪', duration: '2-3天', description: '室内门、窗套、门套安装', status: 'pending' },
    { key: 'final_install', name: '终端安装', icon: '💡', duration: '3-5天', description: '灯具、开关面板、洁具、五金挂件', status: 'pending' },
    { key: 'cleaning', name: '开荒保洁', icon: '🧹', duration: '1-2天', description: '全屋深度清洁', status: 'pending' },
];

// ---- 生成 UUID ----
function uid(): string {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

// ---- Store ----
export const useConstructionStore = create<ConstructionState>()(
    persist(
        (set, get) => ({
            projectId: null,
            phases: DEFAULT_PHASES.map(p => ({ ...p })),
            currentPhase: 'demolition' as ConstructionPhase,
            checklists: [],
            purchases: [],
            logs: [],
            payments: [],
            startDate: null,

            initProject: (projectId, startDate) => {
                set({
                    projectId,
                    startDate: startDate ?? new Date().toISOString().slice(0, 10),
                    phases: DEFAULT_PHASES.map(p => ({ ...p, status: 'pending' as const })),
                    currentPhase: 'demolition',
                    checklists: [],
                    purchases: [],
                    logs: [],
                    payments: [],
                });
            },

            setCurrentPhase: (phase) => set({ currentPhase: phase }),

            updatePhase: (phase, updates) =>
                set((s) => ({
                    phases: s.phases.map(p => p.key === phase ? { ...p, ...updates } : p),
                })),

            completePhase: (phase) => {
                const s = get();
                const idx = s.phases.findIndex(p => p.key === phase);
                const nextPhase = (s.phases[idx + 1]?.key || phase) as ConstructionPhase;
                set({
                    phases: s.phases.map(p => p.key === phase ? { ...p, status: 'completed' as const } : p),
                    currentPhase: nextPhase
                });
            },

            toggleChecklist: (id, phase) =>
                set((s) => {
                    const exists = s.checklists.find(c => c.id === id);
                    if (!exists) {
                        const item = CHECKLIST_DATA.find((c: any) => c.id === id);
                        if (item) {
                            return { checklists: [...s.checklists, { ...item, checked: true, group: (item as any).group || 'default' }] };
                        }
                    }
                    return {
                        checklists: s.checklists.map(c => c.id === id ? { ...c, checked: !c.checked } : c),
                    };
                }),

            updateChecklistNote: (id, note) =>
                set((s) => ({
                    checklists: s.checklists.map(c => c.id === id ? { ...c, note } : c),
                })),

            togglePurchase: (id) =>
                set((s) => ({
                    purchases: s.purchases.map(p => p.id === id ? { ...p, purchased: !p.purchased } : p),
                })),

            updatePurchasePrice: (id, price) =>
                set((s) => ({
                    purchases: s.purchases.map(p => p.id === id ? { ...p, actualPrice: price } : p),
                })),

            addLog: (log) =>
                set((s) => ({
                    logs: [{ ...log, id: uid(), createdAt: new Date().toISOString() }, ...s.logs],
                })),

            deleteLog: (id) =>
                set((s) => ({ logs: s.logs.filter(l => l.id !== id) })),

            addPayment: (payment) =>
                set((s) => ({
                    payments: [...s.payments, { ...payment, id: uid() }],
                })),

            deletePayment: (id) =>
                set((s) => ({ payments: s.payments.filter(p => p.id !== id) })),

            getPhaseProgress: (phase) => {
                // const { CHECKLIST_DATA } = require('@/engine/constructionData'); // Removed this line
                const totalItems = CHECKLIST_DATA.filter((c: any) => c.phase === phase);
                const checkedItems = get().checklists.filter(c => c.phase === phase && c.checked);

                const total = totalItems.length;
                const completed = checkedItems.length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return { completed, total, percent };
            },

            getTotalProgress: () => {
                const all = get().checklists;
                if (all.length === 0) return 0;
                return Math.round((all.filter(c => c.checked).length / all.length) * 100);
            },

            getTotalSpent: () => {
                return get().payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            },
        }),
        {
            name: 'renovation-construction-store',
        }
    )
);
