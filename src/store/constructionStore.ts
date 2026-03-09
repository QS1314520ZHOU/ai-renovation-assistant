import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { constructionApi, aiApi } from '@/api/services';
import { CHECKLIST_DATA, PHASE_LIST, PURCHASE_DATA } from '@/engine/constructionData';
import {
    ChecklistItem,
    ConstructionLog,
    ConstructionPhase,
    PaymentRecord,
    PhaseInfo,
    PurchaseItem,
} from '@/types';

export interface PhaseState extends PhaseInfo {
    status: 'pending' | 'active' | 'completed';
    startDate?: string;
    endDate?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUUID(value: string | null | undefined): value is string {
    return Boolean(value && UUID_REGEX.test(value));
}

function uid(): string {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

function normalizePhaseStatus(status: string | undefined): 'pending' | 'active' | 'completed' {
    if (status === 'completed') return 'completed';
    if (status === 'active' || status === 'in_progress') return 'active';
    return 'pending';
}

function deriveCurrentPhase(phases: PhaseState[]): ConstructionPhase {
    const active = phases.find((item) => item.status === 'active');
    if (active) return active.phase;

    const pending = phases.find((item) => item.status === 'pending');
    if (pending) return pending.phase;

    return (phases[phases.length - 1]?.phase || 'pre_construction') as ConstructionPhase;
}

function parseEstimatedPrice(item: PurchaseItem): number | undefined {
    if (typeof item.estimatedPrice === 'number' && Number.isFinite(item.estimatedPrice)) {
        return item.estimatedPrice;
    }

    const text = String(item.estimatedBudget || '').trim();
    if (!text) return undefined;

    const matches = text.match(/\d+(?:\.\d+)?/g);
    if (!matches || matches.length === 0) return undefined;

    const values = matches.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    if (!values.length) return undefined;

    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (text.includes('万')) {
        return Math.round(avg * 10000);
    }
    return Math.round(avg);
}

function mapBackendPhases(items: any[]): PhaseState[] {
    const byPhase = new Map<string, any>();
    items.forEach((item) => {
        if (item?.phase) byPhase.set(String(item.phase), item);
    });

    return PHASE_LIST.map((phase, index) => {
        const row = byPhase.get(phase.phase);
        return {
            ...phase,
            status: normalizePhaseStatus(row?.status || (index === 0 ? 'active' : 'pending')),
            startDate: row?.start_date || undefined,
            endDate: row?.end_date || undefined,
        };
    });
}

function mapBackendChecklists(items: any[]): ChecklistItem[] {
    const byKey = new Map<string, any>();
    items.forEach((item) => {
        const key = `${String(item.phase)}::${String(item.content)}`;
        byKey.set(key, item);
    });

    const merged = CHECKLIST_DATA.map((template) => {
        const key = `${template.phase}::${template.content}`;
        const row = byKey.get(key);
        return {
            ...template,
            id: String(row?.id || template.id),
            category: String(row?.category || template.category),
            completed: Boolean(row?.is_checked),
            note: row?.note || template.note,
            photoUrl: row?.photo_url || template.photoUrl,
            completedAt: row?.is_checked ? (row?.updated_at || template.completedAt) : undefined,
        };
    });

    const knownKeys = new Set(merged.map((item) => `${item.phase}::${item.content}`));
    const extra = items
        .filter((item) => !knownKeys.has(`${String(item.phase)}::${String(item.content)}`))
        .map((item) => ({
            id: String(item.id),
            phase: String(item.phase) as ConstructionPhase,
            category: String(item.category || '其他'),
            content: String(item.content || ''),
            importance: 'normal' as const,
            howToCheck: '请结合现场情况与施工标准核验。',
            photoRequired: false,
            completed: Boolean(item.is_checked),
            note: item.note || undefined,
            photoUrl: item.photo_url || undefined,
            completedAt: item.is_checked ? (item.updated_at || undefined) : undefined,
        }));

    return [...merged, ...extra];
}

function mapBackendPurchases(items: any[]): PurchaseItem[] {
    const byKey = new Map<string, any>();
    items.forEach((item) => {
        const key = `${String(item.phase)}::${String(item.name)}`;
        byKey.set(key, item);
    });

    const merged = PURCHASE_DATA.map((template) => {
        const key = `${template.phase}::${template.name}`;
        const row = byKey.get(key);
        return {
            ...template,
            id: String(row?.id || template.id),
            purchased: Boolean(row?.is_purchased),
            purchasedAt: row?.is_purchased ? (row?.updated_at || template.purchasedAt) : undefined,
            actualPrice: typeof row?.actual_price === 'number' ? row.actual_price : template.actualPrice,
            estimatedPrice: typeof row?.estimated_price === 'number' ? row.estimated_price : template.estimatedPrice,
            needMeasureFirst: typeof row?.need_measure === 'boolean' ? row.need_measure : template.needMeasureFirst,
        };
    });

    const knownKeys = new Set(merged.map((item) => `${item.phase}::${item.name}`));
    const extra = items
        .filter((item) => !knownKeys.has(`${String(item.phase)}::${String(item.name)}`))
        .map((item) => ({
            id: String(item.id),
            phase: String(item.phase) as ConstructionPhase,
            name: String(item.name || '未命名采购项'),
            category: String(item.category || '其他'),
            mustBuyBefore: '-',
            needMeasureFirst: Boolean(item.need_measure),
            estimatedBudget: '-',
            estimatedPrice: typeof item.estimated_price === 'number' ? item.estimated_price : undefined,
            actualPrice: typeof item.actual_price === 'number' ? item.actual_price : undefined,
            tips: item.note || '请按现场进度安排采购。',
            purchased: Boolean(item.is_purchased),
            purchasedAt: item.is_purchased ? (item.updated_at || undefined) : undefined,
        }));

    return [...merged, ...extra];
}

function mapBackendLogs(items: any[]): ConstructionLog[] {
    return (items || []).map((item: any) => ({
        id: String(item.id),
        date: String(item.log_date),
        phase: String(item.phase) as ConstructionPhase,
        title: String(item.title || '施工记录'),
        content: String(item.content || ''),
        photos: Array.isArray(item.photos) ? item.photos : [],
        tags: [String(item.phase || '施工')],
        createdAt: String(item.created_at || new Date().toISOString()),
    }));
}

function mapBackendPayments(items: any[]): PaymentRecord[] {
    return (items || []).map((item: any) => ({
        id: String(item.id),
        phase: String(item.phase) as ConstructionPhase,
        amount: Number(item.amount || 0),
        description: String(item.note || item.payment_type || '阶段付款'),
        payee: String(item.payee || '未填写收款方'),
        paymentMethod: String(item.payment_type || ''),
        receiptUrl: item.receipt_url || undefined,
        date: String(item.payment_date),
        createdAt: String(item.created_at || new Date().toISOString()),
        isAddon: Boolean(item.is_addon),
        addonReason: item.addon_reason || undefined,
    }));
}

function buildDefaultState(startDate?: string) {
    const start = startDate ?? new Date().toISOString().slice(0, 10);
    const phases: PhaseState[] = PHASE_LIST.map((phase, idx) => ({
        ...phase,
        status: idx === 0 ? 'active' : 'pending',
    }));

    const checklists: ChecklistItem[] = CHECKLIST_DATA.map((item) => ({
        ...item,
        completed: false,
        completedAt: undefined,
        note: undefined,
        photoUrl: undefined,
    }));

    const purchases: PurchaseItem[] = PURCHASE_DATA.map((item) => ({
        ...item,
        purchased: false,
        purchasedAt: undefined,
        actualPrice: undefined,
    }));

    return {
        startDate: start,
        phases,
        checklists,
        purchases,
        currentPhase: deriveCurrentPhase(phases),
        logs: [] as ConstructionLog[],
        payments: [] as PaymentRecord[],
    };
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
    syncProject: (projectId?: string) => Promise<void>;
    setCurrentPhase: (phase: ConstructionPhase) => void;
    updatePhase: (phase: string, updates: Partial<PhaseState>) => void;
    completePhase: (phase: string) => void;

    toggleChecklist: (id: string) => void;
    updateChecklistNote: (id: string, note: string) => void;
    updateChecklistPhoto: (id: string, url: string) => Promise<void>;

    togglePurchase: (id: string) => void;
    updatePurchasePrice: (id: string, price: number) => void;

    uploadPhoto: (file: File) => Promise<string>;
    addLog: (log: Omit<ConstructionLog, 'id' | 'createdAt'>) => Promise<void>;
    deleteLog: (id: string) => void;

    addPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => Promise<void>;
    deletePayment: (id: string) => void;

    getPhaseProgress: (phase: string) => { completed: number; total: number; percent: number };
    getTotalProgress: () => number;
    getTotalSpent: () => number;
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
                const state = buildDefaultState(startDate);
                set({ projectId, ...state });
                void get().syncProject(projectId);
            },

            syncProject: async (projectId) => {
                const targetProjectId = projectId || get().projectId;
                if (!isUUID(targetProjectId)) return;

                const state = get();
                const bootstrapPayload = {
                    phases: PHASE_LIST.map((phase, idx) => ({
                        phase: phase.phase,
                        status: idx === 0 ? 'active' : 'pending',
                        sort_order: phase.order,
                    })),
                    checklists: CHECKLIST_DATA.map((item, idx) => ({
                        phase: item.phase,
                        category: item.category,
                        content: item.content,
                        sort_order: idx,
                    })),
                    purchases: PURCHASE_DATA.map((item) => ({
                        phase: item.phase,
                        name: item.name,
                        category: item.category,
                        estimated_price: parseEstimatedPrice(item),
                        need_measure: item.needMeasureFirst,
                        note: item.tips,
                    })),
                };

                try {
                    const boot = await constructionApi.bootstrap(targetProjectId, bootstrapPayload);
                    const phases = mapBackendPhases(Array.isArray(boot.phases) ? boot.phases : []);
                    const checklists = mapBackendChecklists(Array.isArray(boot.checklists) ? boot.checklists : []);
                    const purchases = mapBackendPurchases(Array.isArray(boot.purchases) ? boot.purchases : []);

                    const [logsRaw, paymentsRaw] = await Promise.all([
                        constructionApi.getLogs(targetProjectId),
                        constructionApi.getPayments(targetProjectId),
                    ]);

                    const logs = mapBackendLogs(logsRaw);
                    const payments = mapBackendPayments(paymentsRaw);

                    set({
                        projectId: targetProjectId,
                        startDate: state.startDate || new Date().toISOString().slice(0, 10),
                        phases,
                        currentPhase: deriveCurrentPhase(phases),
                        checklists,
                        purchases,
                        logs,
                        payments,
                    });
                } catch (error) {
                    console.error('Failed to sync construction project:', error);
                }
            },

            setCurrentPhase: (phase) => set({ currentPhase: phase }),

            updatePhase: (phase, updates) => {
                const prev = get().phases;
                const next = prev.map((item) => (item.phase === phase ? { ...item, ...updates } : item));
                set({ phases: next });

                const projectId = get().projectId;
                if (!isUUID(projectId)) return;

                const target = next.find((item) => item.phase === phase);
                if (!target) return;

                void constructionApi
                    .updatePhase(projectId, {
                        phase: target.phase,
                        status: target.status,
                        start_date: target.startDate || null,
                        end_date: target.endDate || null,
                        notes: undefined,
                    })
                    .catch((error) => {
                        console.error('Failed to update phase:', error);
                        set({ phases: prev });
                    });
            },

            completePhase: (phase) => {
                const state = get();
                const idx = state.phases.findIndex((item) => item.phase === phase);
                const nextPhase = (state.phases[idx + 1]?.phase || phase) as ConstructionPhase;
                const today = new Date().toISOString().slice(0, 10);

                const nextPhases = state.phases.map((item) => {
                    if (item.phase === phase) return { ...item, status: 'completed' as const, endDate: today };
                    if (item.phase === nextPhase && item.status === 'pending') {
                        return { ...item, status: 'active' as const, startDate: item.startDate || today };
                    }
                    return item;
                });
                set({ phases: nextPhases, currentPhase: nextPhase });

                const projectId = state.projectId;
                if (!isUUID(projectId)) return;

                void constructionApi.updatePhase(projectId, {
                    phase,
                    status: 'completed',
                    end_date: today,
                });

                if (nextPhase !== phase) {
                    void constructionApi.updatePhase(projectId, {
                        phase: nextPhase,
                        status: 'active',
                        start_date: today,
                    });
                }
            },

            toggleChecklist: (id) => {
                const state = get();
                const target = state.checklists.find((item) => item.id === id);
                if (!target) return;

                const nextCompleted = !target.completed;
                const next = state.checklists.map((item) =>
                    item.id === id
                        ? { ...item, completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : undefined }
                        : item,
                );
                set({ checklists: next });

                if (!isUUID(state.projectId) || !isUUID(id)) return;

                void constructionApi
                    .updateChecklist(state.projectId, {
                        checklist_id: id,
                        is_checked: nextCompleted,
                        note: target.note ?? null,
                        photo_url: target.photoUrl ?? null,
                    })
                    .catch((error) => {
                        console.error('Failed to toggle checklist:', error);
                        set({ checklists: state.checklists });
                    });
            },

            updateChecklistNote: (id, note) => {
                const state = get();
                const target = state.checklists.find((item) => item.id === id);
                if (!target) return;

                const next = state.checklists.map((item) => (item.id === id ? { ...item, note } : item));
                set({ checklists: next });

                if (!isUUID(state.projectId) || !isUUID(id)) return;

                void constructionApi
                    .updateChecklist(state.projectId, {
                        checklist_id: id,
                        is_checked: target.completed,
                        note,
                        photo_url: target.photoUrl ?? null,
                    })
                    .catch((error) => {
                        console.error('Failed to update checklist note:', error);
                        set({ checklists: state.checklists });
                    });
            },

            updateChecklistPhoto: async (id, url) => {
                const state = get();
                const target = state.checklists.find((item) => item.id === id);
                if (!target) return;

                const next = state.checklists.map((item) =>
                    item.id === id
                        ? { ...item, photoUrl: url, completed: true, completedAt: new Date().toISOString() }
                        : item,
                );
                set({ checklists: next });

                if (!isUUID(state.projectId) || !isUUID(id)) return;

                try {
                    await constructionApi.updateChecklist(state.projectId, {
                        checklist_id: id,
                        is_checked: true,
                        note: target.note ?? null,
                        photo_url: url,
                    });
                } catch (error) {
                    console.error('Failed to update checklist photo:', error);
                    set({ checklists: state.checklists });
                    throw error;
                }
            },

            togglePurchase: (id) => {
                const state = get();
                const target = state.purchases.find((item) => item.id === id);
                if (!target) return;

                const nextPurchased = !target.purchased;
                const next = state.purchases.map((item) =>
                    item.id === id
                        ? { ...item, purchased: nextPurchased, purchasedAt: nextPurchased ? new Date().toISOString() : undefined }
                        : item,
                );
                set({ purchases: next });

                if (!isUUID(state.projectId) || !isUUID(id)) return;

                void constructionApi
                    .updatePurchase(state.projectId, {
                        purchase_id: id,
                        is_purchased: nextPurchased,
                        actual_price: target.actualPrice ?? null,
                    })
                    .catch((error) => {
                        console.error('Failed to toggle purchase:', error);
                        set({ purchases: state.purchases });
                    });
            },

            updatePurchasePrice: (id, price) => {
                const state = get();
                const target = state.purchases.find((item) => item.id === id);
                if (!target) return;

                const next = state.purchases.map((item) => (item.id === id ? { ...item, actualPrice: price } : item));
                set({ purchases: next });

                if (!isUUID(state.projectId) || !isUUID(id)) return;

                void constructionApi
                    .updatePurchase(state.projectId, {
                        purchase_id: id,
                        actual_price: price,
                        is_purchased: target.purchased,
                    })
                    .catch((error) => {
                        console.error('Failed to update purchase price:', error);
                        set({ purchases: state.purchases });
                    });
            },

            uploadPhoto: async (file: File) => {
                try {
                    const res = await aiApi.upload(file);
                    return res.url;
                } catch (error) {
                    console.error('Upload failed:', error);
                    throw error;
                }
            },

            addLog: async (log) => {
                const state = get();
                const tempId = `tmp-${uid()}`;
                const localRow: ConstructionLog = {
                    ...log,
                    id: tempId,
                    createdAt: new Date().toISOString(),
                };

                set((s) => ({ logs: [localRow, ...s.logs] }));

                if (!isUUID(state.projectId)) {
                    set((s) => ({
                        logs: s.logs.map((item) => (item.id === tempId ? { ...item, id: uid() } : item)),
                    }));
                    return;
                }

                try {
                    const saved = await constructionApi.addLog(state.projectId, {
                        phase: log.phase,
                        log_date: log.date,
                        title: log.title,
                        content: log.content,
                        photos: log.photos,
                    });
                    const mapped = mapBackendLogs([saved])[0];
                    set((s) => ({ logs: s.logs.map((item) => (item.id === tempId ? mapped : item)) }));
                } catch (error) {
                    set((s) => ({ logs: s.logs.filter((item) => item.id !== tempId) }));
                    throw error;
                }
            },

            deleteLog: (id) =>
                set((state) => ({ logs: state.logs.filter((item) => item.id !== id) })),

            addPayment: async (payment) => {
                const state = get();
                const tempId = `tmp-${uid()}`;
                const localRow: PaymentRecord = {
                    ...payment,
                    id: tempId,
                    createdAt: new Date().toISOString(),
                };
                set((s) => ({ payments: [localRow, ...s.payments] }));

                if (!isUUID(state.projectId)) {
                    set((s) => ({
                        payments: s.payments.map((item) => (item.id === tempId ? { ...item, id: uid() } : item)),
                    }));
                    return;
                }

                try {
                    const saved = await constructionApi.addPayment(state.projectId, {
                        phase: payment.phase,
                        payment_type: payment.paymentMethod || 'phase_payment',
                        amount: payment.amount,
                        payee: payment.payee,
                        payment_date: payment.date,
                        note: payment.description,
                        is_addon: Boolean(payment.isAddon),
                        addon_reason: payment.addonReason || null,
                    });
                    const mapped = mapBackendPayments([saved])[0];
                    set((s) => ({ payments: s.payments.map((item) => (item.id === tempId ? mapped : item)) }));
                } catch (error) {
                    set((s) => ({ payments: s.payments.filter((item) => item.id !== tempId) }));
                    throw error;
                }
            },

            deletePayment: (id) =>
                set((state) => ({ payments: state.payments.filter((item) => item.id !== id) })),

            getPhaseProgress: (phase) => {
                const items = get().checklists.filter((item) => item.phase === phase);
                const total = items.length;
                const completed = items.filter((item) => item.completed).length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                return { completed, total, percent };
            },

            getTotalProgress: () => {
                const all = get().checklists;
                if (all.length === 0) return 0;
                return Math.round((all.filter((item) => item.completed).length / all.length) * 100);
            },

            getTotalSpent: () => get().payments.reduce((sum, item) => sum + (item.amount || 0), 0),
        }),
        {
            name: 'renovation-construction-store-v3',
        },
    ),
);
