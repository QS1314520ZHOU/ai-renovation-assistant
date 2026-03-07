export type ConstructionPhase =
    | 'pre_construction'   // 开工前
    | 'demolition'          // 拆改阶段
    | 'hydroelectric'       // 水电阶段
    | 'waterproof'          // 防水阶段
    | 'tiling'              // 瓦工阶段
    | 'carpentry'           // 木工阶段
    | 'painting'            // 油工阶段
    | 'cabinet_install'     // 橱柜安装
    | 'door_window'         // 门窗安装
    | 'final_install'       // 终端安装
    | 'installation'        // 安装阶段 (通用)
    | 'cleaning'            // 保洁阶段
    | 'completed'           // 竣工验收
    | 'warranty';           // 维保期

export interface PhaseInfo {
    phase: ConstructionPhase;
    name: string;
    icon: string;
    order: number;
    typicalDurationDays: number;
    description: string;
}

export interface ConstructionProject {
    id: string;
    houseId: string;
    currentPhase: ConstructionPhase;
    startDate: string;
    estimatedEndDate: string;
    actualEndDate?: string;
    phases: PhaseRecord[];
    logs: ConstructionLog[];
    photos: ConstructionPhoto[];
    payments: PaymentRecord[];
    createdAt: string;
    updatedAt: string;
}

export interface PhaseRecord {
    phase: ConstructionPhase;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    startDate?: string;
    endDate?: string;
    checklistCompleted: number;
    checklistTotal: number;
    notes: string;
}

export interface ConstructionLog {
    id: string;
    date: string;
    phase: ConstructionPhase;
    title: string;
    content: string;
    photos: string[];
    tags: string[];
    createdAt: string;
}

export interface ConstructionPhoto {
    id: string;
    phase: ConstructionPhase;
    url: string;
    thumbnailUrl?: string;
    caption: string;
    category: 'progress' | 'acceptance' | 'problem' | 'material';
    createdAt: string;
}

export interface PaymentRecord {
    id: string;
    phase: ConstructionPhase;
    amount: number;
    description: string;
    payee: string;
    paymentMethod: string;
    receiptUrl?: string;
    date: string;
    createdAt: string;
}

export interface ChecklistItem {
    id: string;
    phase: ConstructionPhase;
    category: string;
    content: string;
    importance: 'critical' | 'important' | 'normal';
    howToCheck: string;
    photoRequired: boolean;
    completed: boolean;
    completedAt?: string;
    note?: string;
}

export interface PurchaseItem {
    id: string;
    phase: ConstructionPhase;
    name: string;
    category: string;
    mustBuyBefore: string;
    needMeasureFirst: boolean;
    estimatedBudget: string;
    estimatedPrice?: number; // 新增：数值型预计单价
    actualPrice?: number;    // 新增：数值型实际单价
    tips: string;
    purchased: boolean;
    purchasedAt?: string;
    actualCost?: number;
}

export interface AppNotification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    content: string;
    link?: string;
    read: boolean;
    createdAt: string;
}
