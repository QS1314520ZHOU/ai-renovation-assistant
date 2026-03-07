import { TierLevel } from './house';

export type PricingMode = 'area' | 'linear_meter' | 'point' | 'quantity';

export interface BudgetCategory {
    id: string;
    name: string;
    nameZh: string;
    icon: string;
    order: number;
}

export interface BudgetItem {
    id: string;
    scheme_id: string;
    room_id: string | null;
    category: string;
    standard_item_id: string;
    item_name: string;
    pricing_mode: PricingMode;
    quantity: number;
    unit: string;
    material_unit_price: number;
    labor_unit_price: number;
    accessory_unit_price: number;
    loss_rate: number;
    subtotal: number;
    data_source: string;
    is_user_modified: boolean;
    remark?: string;
}

export interface BudgetScheme {
    id: string;
    project_id: string;
    tier: TierLevel;
    total_amount: number;
    material_amount: number;
    labor_amount: number;
    management_fee: number;
    contingency: number;
    items: BudgetItem[];
    createdAt: string;
    // Legacy mapping (to be removed after refactoring components)
    totalBudget?: number;
}

export interface BudgetResult {
    project_id: string;
    schemes: BudgetScheme[];
    economy?: BudgetScheme;
    standard?: BudgetScheme;
    premium?: BudgetScheme;
    missing_items: any[];
    suggestions: string[];
    missingItems: MissingItem[]; // Legacy support
    optimizations: OptimizationSuggestion[]; // Legacy support
    overBudget: boolean;
    overBudgetAmount: number;
}

export interface MissingItem {
    id: string;
    ruleName: string;
    itemName: string;
    riskLevel: 'high' | 'medium' | 'low';
    estimatedPriceMin: number;
    estimatedPriceMax: number;
    explanation: string;
    askTemplate: string;
    shouldInclude: boolean;
}

export interface OptimizationSuggestion {
    id: string;
    type: 'save' | 'must_keep' | 'alternative';
    category: string;
    title: string;
    description: string;
    savingAmount?: number;
}
