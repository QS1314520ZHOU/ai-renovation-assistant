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
    schemeId: string;
    roomId: string | null;
    category: string;
    standardItemId: string;
    itemName: string;
    pricingMode: PricingMode;
    quantity: number;
    unit: string;
    materialUnitPrice: number;
    laborUnitPrice: number;
    accessoryUnitPrice: number;
    lossRate: number;
    subtotal: number;
    tierLevel: TierLevel;
    dataSource: string;
    isUserModified: boolean;
    remark: string;
}

export interface BudgetScheme {
    id: string;
    projectId: string;
    tierLevel: TierLevel;
    totalBudget: number;
    hardDecorationBudget: number;
    mainMaterialBudget: number;
    kitchenBathroomBudget: number;
    customBudget: number;
    otherBudget: number;
    contingencyBudget: number;
    items: BudgetItem[];
    createdAt: string;
}

export interface BudgetResult {
    economy: BudgetScheme;
    standard: BudgetScheme;
    premium: BudgetScheme;
    missingItems: MissingItem[];
    optimizations: OptimizationSuggestion[];
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
