import { HouseProfile, RoomDimension, BudgetItem, BudgetScheme, BudgetResult, TierLevel, MissingItem, OptimizationSuggestion } from '@/types';
import { matchTemplate, generateRoomDimensions } from './layoutTemplates';
import { BASE_PRICING_RULES, OTHER_COSTS, PricingRule } from './pricingRules';
import { getCityFactor } from './cityFactors';
import { evaluateMissingItems } from './missingItemRules';
import { v4 as uuid } from 'uuid';

export function calculateBudget(house: HouseProfile): BudgetResult {
    // 1. 匹配户型模板
    const template = matchTemplate(house.layout, house.innerArea);
    if (!template) throw new Error('无法匹配户型模板');

    // 2. 生成房间尺寸
    const rooms = generateRoomDimensions(template, house.innerArea);

    // 3. 获取城市系数
    const cityFactor = getCityFactor(house.city);

    // 4. 三档分别计算
    const tiers: TierLevel[] = ['economy', 'standard', 'premium'];
    const schemes: Record<TierLevel, BudgetScheme> = {} as any;

    for (const tier of tiers) {
        schemes[tier] = calculateTierBudget(house, rooms, tier, cityFactor.factor);
    }

    // 5. 漏项检查
    const missingContext = {
        floorPreference: house.floorPreference,
        bathroomCount: house.bathroomCount,
        kitchenCount: house.kitchenCount,
        houseType: house.houseType,
        hasCeiling: house.hasCeiling,
        hasCustomCabinet: house.hasCustomCabinet,
        budgetItems: schemes[house.tierLevel]?.items.map(i => i.standardItemId) || [],
    };
    const missingItems = evaluateMissingItems(missingContext);

    // 6. 优化建议
    const optimizations = generateOptimizations(house, schemes[house.tierLevel]);

    // 7. 是否超预算
    const currentScheme = schemes[house.tierLevel];
    const overBudget = currentScheme.totalBudget > house.targetBudget;
    const overBudgetAmount = overBudget ? currentScheme.totalBudget - house.targetBudget : 0;

    return {
        economy: schemes.economy,
        standard: schemes.standard,
        premium: schemes.premium,
        missingItems,
        optimizations,
        overBudget,
        overBudgetAmount,
    };
}

function calculateTierBudget(
    house: HouseProfile,
    rooms: RoomDimension[],
    tier: TierLevel,
    cityFactor: number
): BudgetScheme {
    const items: BudgetItem[] = [];
    const schemeId = uuid();

    for (const rule of BASE_PRICING_RULES) {
        // 判断该标准项是否适用
        const applicableRooms = rule.applicableRooms.length === 0
            ? rooms
            : rooms.filter(r => rule.applicableRooms.includes(r.roomType));

        if (applicableRooms.length === 0) continue;

        // 特殊逻辑：经济档不做客厅吊顶
        if (rule.standardItemId === 'SI_CEILING_LIVING' && tier === 'economy') continue;

        // 根据用户偏好过滤
        if (rule.standardItemId === 'SI_FLOOR_TILE' && house.floorPreference === 'wood') {
            // 只保留厨卫阳台的瓷砖
            const tileRooms = applicableRooms.filter(r =>
                ['kitchen', 'bathroom', 'balcony'].includes(r.roomType)
            );
            if (tileRooms.length > 0) {
                items.push(...calculateRoomItems(tileRooms, rule, tier, cityFactor, schemeId));
            }
            continue;
        }

        if (rule.standardItemId === 'SI_FLOOR_WOOD' && house.floorPreference === 'tile') continue;

        if (rule.standardItemId === 'SI_CUSTOM_WARDROBE' && !house.hasCustomCabinet) continue;

        items.push(...calculateRoomItems(applicableRooms, rule, tier, cityFactor, schemeId));
    }

    // 计算各类合计
    const itemsTotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const otherCosts = OTHER_COSTS[tier];
    const fixedOther = (otherCosts.garbageRemoval + otherCosts.cleaning + otherCosts.protection) * cityFactor;
    const managementFee = itemsTotal * otherCosts.management;
    const contingency = itemsTotal * otherCosts.contingency;
    const totalBudget = Math.round(itemsTotal + fixedOther + managementFee + contingency);

    // 分类汇总
    const hardDeco = items.filter(i => ['hydroelectric', 'waterproof', 'wall', 'ceiling'].includes(i.category)).reduce((s, i) => s + i.subtotal, 0);
    const mainMaterial = items.filter(i => ['floor', 'baseboard', 'door'].includes(i.category)).reduce((s, i) => s + i.subtotal, 0);
    const kitchenBathroom = items.filter(i => ['cabinet', 'bathroom_fixture'].includes(i.category)).reduce((s, i) => s + i.subtotal, 0);
    const custom = items.filter(i => i.category === 'custom_furniture').reduce((s, i) => s + i.subtotal, 0);
    const other = items.filter(i => ['electrical', 'lighting'].includes(i.category)).reduce((s, i) => s + i.subtotal, 0) + fixedOther;

    return {
        id: schemeId,
        projectId: '',
        tierLevel: tier,
        totalBudget,
        hardDecorationBudget: Math.round(hardDeco),
        mainMaterialBudget: Math.round(mainMaterial),
        kitchenBathroomBudget: Math.round(kitchenBathroom),
        customBudget: Math.round(custom),
        otherBudget: Math.round(other + managementFee),
        contingencyBudget: Math.round(contingency),
        items,
        createdAt: new Date().toISOString(),
    };
}

function calculateRoomItems(
    rooms: RoomDimension[],
    rule: PricingRule,
    tier: TierLevel,
    cityFactor: number,
    schemeId: string
): BudgetItem[] {
    const tierPrices = rule.tiers[tier];

    return rooms.map(room => {
        let quantity = 0;

        switch (rule.pricingMode) {
            case 'area':
                if (rule.category === 'wall') quantity = room.wallArea;
                else if (rule.standardItemId === 'SI_CEILING_PAINT') quantity = room.ceilingArea;
                else if (rule.category === 'waterproof') {
                    const perimeter = 2 * (room.length + room.width);
                    const waterproofHeight = room.roomType === 'bathroom' ? 1.8 : 0.3;
                    quantity = room.floorArea + perimeter * waterproofHeight;
                }
                else if (rule.category === 'hydroelectric') quantity = room.floorArea;
                else if (rule.category === 'custom_furniture') {
                    // 投影面积：假设2.4m高 × 房间宽度的60%
                    quantity = 2.4 * room.width * 0.6;
                }
                else quantity = room.floorArea;
                break;

            case 'linear_meter':
                if (rule.category === 'baseboard') {
                    const perimeter = 2 * (room.length + room.width);
                    quantity = perimeter - 0.9; // 减一个门宽
                } else if (rule.category === 'cabinet') {
                    // 橱柜延米：假设 L型，约2.5m + 1.5m
                    quantity = 4;
                } else {
                    quantity = 2 * (room.length + room.width);
                }
                break;

            case 'quantity':
                if (rule.category === 'door') quantity = 1;
                else if (rule.category === 'bathroom_fixture') quantity = 1;
                else if (rule.category === 'lighting') quantity = 1;
                else quantity = 1;
                break;

            case 'point':
                if (rule.category === 'electrical') {
                    // 每个房间的开关插座估算
                    const pointMap: Record<string, number> = {
                        living_room: 12, dining_room: 4, master_bedroom: 8,
                        bedroom: 6, kitchen: 8, bathroom: 4, balcony: 2, hallway: 2,
                    };
                    quantity = pointMap[room.roomType] || 4;
                }
                break;
        }

        const lossMultiplier = 1 + rule.defaultLossRate;
        const unitPrice = (tierPrices.materialUnitPrice + tierPrices.laborUnitPrice + tierPrices.accessoryUnitPrice) * cityFactor;
        const subtotal = Math.round(quantity * lossMultiplier * unitPrice);

        return {
            id: uuid(),
            schemeId,
            roomId: room.id,
            category: rule.category,
            standardItemId: rule.standardItemId,
            itemName: `${room.roomName} - ${rule.name}`,
            pricingMode: rule.pricingMode,
            quantity: Math.round(quantity * 100) / 100,
            unit: rule.unit,
            materialUnitPrice: Math.round(tierPrices.materialUnitPrice * cityFactor),
            laborUnitPrice: Math.round(tierPrices.laborUnitPrice * cityFactor),
            accessoryUnitPrice: Math.round(tierPrices.accessoryUnitPrice * cityFactor),
            lossRate: rule.defaultLossRate,
            subtotal,
            tierLevel: tier,
            dataSource: '平台参考价格库',
            isUserModified: false,
            remark: '',
        };
    });
}

function generateOptimizations(house: HouseProfile, scheme: BudgetScheme): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // 不建议省的
    suggestions.push({
        id: uuid(), type: 'must_keep', category: 'hydroelectric',
        title: '水电改造不建议省',
        description: '水电是隐蔽工程，一旦入住后出问题，返修代价极高。建议使用合格品牌线材和管材。',
    });
    suggestions.push({
        id: uuid(), type: 'must_keep', category: 'waterproof',
        title: '防水工程不建议省',
        description: '卫生间防水不到位会导致渗漏到楼下，维修费用和邻里纠纷代价远超防水本身费用。',
    });

    // 可优化的
    if (house.hasCeiling) {
        suggestions.push({
            id: uuid(), type: 'save', category: 'ceiling',
            title: '客厅吊顶可以简化',
            description: '不做复杂造型吊顶，改做简单石膏线或局部吊顶，可节省3000-8000元。',
            savingAmount: 5000,
        });
    }

    // 替代建议
    suggestions.push({
        id: uuid(), type: 'alternative', category: 'bathroom_fixture',
        title: '卫浴可选国产中高端替代进口',
        description: '国产品牌（如九牧、恒洁、箭牌）品质已经很稳定，相比进口品牌可省30%-50%。',
        savingAmount: 3000,
    });

    suggestions.push({
        id: uuid(), type: 'alternative', category: 'custom_furniture',
        title: '定制柜板材可考虑多层板替代实木',
        description: '多层实木板环保性和稳定性都不错，价格比纯实木便宜40%左右。',
        savingAmount: 5000,
    });

    return suggestions;
}
