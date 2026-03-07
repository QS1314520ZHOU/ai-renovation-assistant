import { MissingItem } from '@/types';
import { v4 as uuid } from 'uuid';

export interface MissingItemRule {
    id: string;
    ruleName: string;
    missingItemName: string;
    riskLevel: 'high' | 'medium' | 'low';
    estimatedPriceMin: number;
    estimatedPriceMax: number;
    explanation: string;
    askTemplate: string;
    // 条件化触发
    trigger: {
        operator: 'AND' | 'OR';
        conditions: RuleCondition[];
    };
}

interface RuleCondition {
    field: string;
    op: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'includes' | 'not_includes' | 'greater_than' | 'less_than' | 'exists';
    value: any;
}

export const MISSING_ITEM_RULES: MissingItemRule[] = [
    {
        id: 'MR_001',
        ruleName: '美缝遗漏',
        missingItemName: '瓷砖美缝',
        riskLevel: 'medium',
        estimatedPriceMin: 1500,
        estimatedPriceMax: 4000,
        explanation: '铺了瓷砖但没有做美缝，缝隙容易发黑发霉，后期补做费用更高。',
        askTemplate: '请确认报价中是否包含瓷砖美缝费用？如没有，建议让装修公司明确美缝品牌和价格。',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'floorPreference', op: 'contains', value: 'tile' },
                { field: 'budgetItems', op: 'not_includes', value: 'SI_GROUT_BEAUTY' },
            ],
        },
    },
    {
        id: 'MR_002',
        ruleName: '闭水试验遗漏',
        missingItemName: '闭水试验',
        riskLevel: 'high',
        estimatedPriceMin: 0,
        estimatedPriceMax: 200,
        explanation: '防水做完必须做闭水试验（至少48小时），不做闭水就贴砖后期漏水维修代价极大。',
        askTemplate: '请确认施工方案中是否包含闭水试验？这是防水施工的必检环节。',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'bathroomCount', op: 'greater_than', value: 0 },
            ],
        },
    },
    {
        id: 'MR_003',
        ruleName: '垃圾清运遗漏',
        missingItemName: '垃圾清运费',
        riskLevel: 'medium',
        estimatedPriceMin: 500,
        estimatedPriceMax: 2000,
        explanation: '装修垃圾清运经常不在基础报价中，容易后期单独收费。',
        askTemplate: '请确认报价中是否包含装修垃圾清运费？如不包含，需要额外预算。',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'budgetItems', op: 'not_includes', value: 'SI_GARBAGE_REMOVAL' },
            ],
        },
    },
    {
        id: 'MR_004',
        ruleName: '开荒保洁遗漏',
        missingItemName: '开荒保洁',
        riskLevel: 'low',
        estimatedPriceMin: 400,
        estimatedPriceMax: 1500,
        explanation: '装修完成后的全屋深度清洁，不做的话入住前会很痛苦。',
        askTemplate: '请确认是否已预留开荒保洁费用？',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'budgetItems', op: 'not_includes', value: 'SI_CLEANING' },
            ],
        },
    },
    {
        id: 'MR_005',
        ruleName: '成品保护遗漏',
        missingItemName: '成品保护',
        riskLevel: 'medium',
        estimatedPriceMin: 300,
        estimatedPriceMax: 1500,
        explanation: '先装好的门、地板、橱柜等在后续施工中容易被损坏，成品保护费是必要开支。',
        askTemplate: '请确认报价中是否包含成品保护费用？',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'budgetItems', op: 'not_includes', value: 'SI_PROTECTION' },
            ],
        },
    },
    {
        id: 'MR_006',
        ruleName: '门槛石遗漏',
        missingItemName: '门槛石/过门石',
        riskLevel: 'medium',
        estimatedPriceMin: 200,
        estimatedPriceMax: 1200,
        explanation: '卫生间、厨房与其他空间之间的过渡石，兼具挡水和美观功能，容易被遗漏。',
        askTemplate: '请确认报价中是否包含门槛石/过门石费用？',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'bathroomCount', op: 'greater_than', value: 0 },
            ],
        },
    },
    {
        id: 'MR_007',
        ruleName: '窗台石遗漏',
        missingItemName: '窗台石',
        riskLevel: 'low',
        estimatedPriceMin: 200,
        estimatedPriceMax: 800,
        explanation: '窗台不做窗台石容易积灰、浸水，影响墙面。',
        askTemplate: '请确认是否需要安装窗台石？',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'houseType', op: 'equals', value: 'new_blank' },
            ],
        },
    },
    {
        id: 'MR_008',
        ruleName: '地漏遗漏',
        missingItemName: '地漏',
        riskLevel: 'high',
        estimatedPriceMin: 100,
        estimatedPriceMax: 600,
        explanation: '卫生间和阳台必须安装地漏，且建议选防臭型，这项容易被报价忽略。',
        askTemplate: '请确认报价中地漏是否包含？建议选用防臭地漏。',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'bathroomCount', op: 'greater_than', value: 0 },
            ],
        },
    },
    {
        id: 'MR_009',
        ruleName: '角阀遗漏',
        missingItemName: '角阀',
        riskLevel: 'medium',
        estimatedPriceMin: 100,
        estimatedPriceMax: 400,
        explanation: '每个用水点都需要角阀控制水流，通常报价不含，安装时才告知需额外购买。',
        askTemplate: '请确认角阀是否已包含在报价中？通常需要8-12个。',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'houseType', op: 'equals', value: 'new_blank' },
            ],
        },
    },
    {
        id: 'MR_010',
        ruleName: '止逆阀遗漏',
        missingItemName: '烟道止逆阀',
        riskLevel: 'high',
        estimatedPriceMin: 50,
        estimatedPriceMax: 200,
        explanation: '厨房烟道不装止逆阀，邻居家炒菜的油烟会倒灌进来，属于必装项。',
        askTemplate: '请确认是否包含厨房烟道止逆阀？这是防止油烟倒灌的关键配件。',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'kitchenCount', op: 'greater_than', value: 0 },
            ],
        },
    },
    {
        id: 'MR_011',
        ruleName: '厨卫吊顶遗漏',
        missingItemName: '厨卫吊顶',
        riskLevel: 'high',
        estimatedPriceMin: 1500,
        estimatedPriceMax: 5000,
        explanation: '厨房和卫生间必须做吊顶，防潮防油烟，同时遮挡管道线路。',
        askTemplate: '请确认报价中是否包含厨房和卫生间的吊顶？',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'kitchenCount', op: 'greater_than', value: 0 },
                { field: 'budgetItems', op: 'not_includes', value: 'SI_CEILING_KITCHEN_BATH' },
            ],
        },
    },
    {
        id: 'MR_012',
        ruleName: '找平遗漏',
        missingItemName: '地面找平',
        riskLevel: 'medium',
        estimatedPriceMin: 1000,
        estimatedPriceMax: 3000,
        explanation: '铺木地板前通常需要做地面找平，报价中容易遗漏。',
        askTemplate: '如果铺木地板，请确认报价中是否包含地面找平费用？',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'floorPreference', op: 'contains', value: 'wood' },
            ],
        },
    },
    {
        id: 'MR_013',
        ruleName: '收边条/压条遗漏',
        missingItemName: '收边条/压条',
        riskLevel: 'low',
        estimatedPriceMin: 200,
        estimatedPriceMax: 800,
        explanation: '不同材质地面交接处需要压条收口，属于小额但容易遗漏的项目。',
        askTemplate: '请确认不同区域地面交接处的收边条/压条是否包含在报价中？',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'floorPreference', op: 'equals', value: 'mixed' },
            ],
        },
    },
    {
        id: 'MR_014',
        ruleName: '五金挂件遗漏',
        missingItemName: '卫浴五金挂件',
        riskLevel: 'low',
        estimatedPriceMin: 300,
        estimatedPriceMax: 1500,
        explanation: '毛巾架、浴巾架、置物架、马桶刷架等卫浴五金，报价单通常不含。',
        askTemplate: '卫浴五金挂件（毛巾架等）通常需要另行购买，是否已纳入预算？',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'bathroomCount', op: 'greater_than', value: 0 },
            ],
        },
    },
    {
        id: 'MR_015',
        ruleName: '灯具安装遗漏',
        missingItemName: '灯具安装费',
        riskLevel: 'low',
        estimatedPriceMin: 300,
        estimatedPriceMax: 1000,
        explanation: '自购灯具的安装费通常不包含在施工报价中。',
        askTemplate: '请确认灯具安装费是否已包含？自购灯具通常需要单独支付安装费。',
        trigger: {
            operator: 'AND',
            conditions: [
                { field: 'budgetItems', op: 'not_includes', value: 'SI_LIGHTING_INSTALL' },
            ],
        },
    },
];

// 条件评估引擎
export function evaluateMissingItems(context: Record<string, any>): MissingItem[] {
    const results: MissingItem[] = [];

    for (const rule of MISSING_ITEM_RULES) {
        const triggered = evaluateTrigger(rule.trigger, context);
        if (triggered) {
            results.push({
                id: uuid(),
                ruleName: rule.ruleName,
                itemName: rule.missingItemName,
                riskLevel: rule.riskLevel,
                estimatedPriceMin: rule.estimatedPriceMin,
                estimatedPriceMax: rule.estimatedPriceMax,
                explanation: rule.explanation,
                askTemplate: rule.askTemplate,
                shouldInclude: rule.riskLevel === 'high',
            });
        }
    }

    return results.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.riskLevel] - order[b.riskLevel];
    });
}

function evaluateTrigger(trigger: { operator: string; conditions: RuleCondition[] }, context: Record<string, any>): boolean {
    const results = trigger.conditions.map(c => evaluateCondition(c, context));
    return trigger.operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

function evaluateCondition(condition: RuleCondition, context: Record<string, any>): boolean {
    const fieldValue = getNestedValue(context, condition.field);

    switch (condition.op) {
        case 'equals':
            return fieldValue === condition.value;
        case 'not_equals':
            return fieldValue !== condition.value;
        case 'contains':
            if (typeof fieldValue === 'string') return fieldValue.includes(condition.value);
            if (Array.isArray(fieldValue)) return fieldValue.includes(condition.value);
            return String(fieldValue || '').includes(condition.value);
        case 'not_contains':
            if (typeof fieldValue === 'string') return !fieldValue.includes(condition.value);
            if (Array.isArray(fieldValue)) return !fieldValue.includes(condition.value);
            return !String(fieldValue || '').includes(condition.value);
        case 'includes':
            return Array.isArray(fieldValue) && fieldValue.some(v => v === condition.value);
        case 'not_includes':
            return !Array.isArray(fieldValue) || !fieldValue.some(v => v === condition.value);
        case 'greater_than':
            return Number(fieldValue) > Number(condition.value);
        case 'less_than':
            return Number(fieldValue) < Number(condition.value);
        case 'exists':
            return fieldValue !== undefined && fieldValue !== null;
        default:
            return false;
    }
}

function getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
