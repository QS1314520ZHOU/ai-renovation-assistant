import { TierLevel } from '@/types';

export interface PricingRule {
    standardItemId: string;
    name: string;
    category: string;
    pricingMode: 'area' | 'linear_meter' | 'point' | 'quantity';
    unit: string;
    tiers: Record<TierLevel, {
        materialUnitPrice: number;
        laborUnitPrice: number;
        accessoryUnitPrice: number;
    }>;
    defaultLossRate: number;
    applicableRooms: string[]; // 空数组=全部房间
}

// 基准价格库（基准城市：成都）
export const BASE_PRICING_RULES: PricingRule[] = [
    // ===== 水电改造 =====
    {
        standardItemId: 'SI_HYDRO_ELECTRIC',
        name: '水电改造',
        category: 'hydroelectric',
        pricingMode: 'area',
        unit: '㎡',
        tiers: {
            economy: { materialUnitPrice: 50, laborUnitPrice: 40, accessoryUnitPrice: 10 },
            standard: { materialUnitPrice: 65, laborUnitPrice: 50, accessoryUnitPrice: 15 },
            premium: { materialUnitPrice: 85, laborUnitPrice: 65, accessoryUnitPrice: 20 },
        },
        defaultLossRate: 0,
        applicableRooms: [],
    },
    // ===== 防水 =====
    {
        standardItemId: 'SI_WATERPROOF',
        name: '防水',
        category: 'waterproof',
        pricingMode: 'area',
        unit: '㎡',
        tiers: {
            economy: { materialUnitPrice: 25, laborUnitPrice: 20, accessoryUnitPrice: 5 },
            standard: { materialUnitPrice: 35, laborUnitPrice: 25, accessoryUnitPrice: 8 },
            premium: { materialUnitPrice: 50, laborUnitPrice: 35, accessoryUnitPrice: 10 },
        },
        defaultLossRate: 0,
        applicableRooms: ['kitchen', 'bathroom', 'balcony'],
    },
    // ===== 地面 - 瓷砖 =====
    {
        standardItemId: 'SI_FLOOR_TILE',
        name: '地面瓷砖',
        category: 'floor',
        pricingMode: 'area',
        unit: '㎡',
        tiers: {
            economy: { materialUnitPrice: 60, laborUnitPrice: 45, accessoryUnitPrice: 15 },
            standard: { materialUnitPrice: 100, laborUnitPrice: 55, accessoryUnitPrice: 20 },
            premium: { materialUnitPrice: 180, laborUnitPrice: 70, accessoryUnitPrice: 25 },
        },
        defaultLossRate: 0.08,
        applicableRooms: ['living_room', 'dining_room', 'kitchen', 'bathroom', 'balcony', 'hallway'],
    },
    // ===== 地面 - 木地板 =====
    {
        standardItemId: 'SI_FLOOR_WOOD',
        name: '木地板',
        category: 'floor',
        pricingMode: 'area',
        unit: '㎡',
        tiers: {
            economy: { materialUnitPrice: 80, laborUnitPrice: 30, accessoryUnitPrice: 15 },
            standard: { materialUnitPrice: 150, laborUnitPrice: 35, accessoryUnitPrice: 20 },
            premium: { materialUnitPrice: 280, laborUnitPrice: 45, accessoryUnitPrice: 25 },
        },
        defaultLossRate: 0.05,
        applicableRooms: ['master_bedroom', 'bedroom'],
    },
    // ===== 墙面乳胶漆 =====
    {
        standardItemId: 'SI_WALL_PAINT',
        name: '墙面乳胶漆',
        category: 'wall',
        pricingMode: 'area',
        unit: '㎡',
        tiers: {
            economy: { materialUnitPrice: 12, laborUnitPrice: 15, accessoryUnitPrice: 8 },
            standard: { materialUnitPrice: 20, laborUnitPrice: 18, accessoryUnitPrice: 10 },
            premium: { materialUnitPrice: 35, laborUnitPrice: 22, accessoryUnitPrice: 12 },
        },
        defaultLossRate: 0.05,
        applicableRooms: [],
    },
    // ===== 顶面乳胶漆 =====
    {
        standardItemId: 'SI_CEILING_PAINT',
        name: '顶面乳胶漆',
        category: 'wall',
        pricingMode: 'area',
        unit: '㎡',
        tiers: {
            economy: { materialUnitPrice: 10, laborUnitPrice: 12, accessoryUnitPrice: 6 },
            standard: { materialUnitPrice: 16, laborUnitPrice: 15, accessoryUnitPrice: 8 },
            premium: { materialUnitPrice: 28, laborUnitPrice: 18, accessoryUnitPrice: 10 },
        },
        defaultLossRate: 0.05,
        applicableRooms: [],
    },
    // ===== 厨卫吊顶 =====
    {
        standardItemId: 'SI_CEILING_KITCHEN_BATH',
        name: '厨卫吊顶',
        category: 'ceiling',
        pricingMode: 'area',
        unit: '㎡',
        tiers: {
            economy: { materialUnitPrice: 80, laborUnitPrice: 40, accessoryUnitPrice: 15 },
            standard: { materialUnitPrice: 120, laborUnitPrice: 50, accessoryUnitPrice: 20 },
            premium: { materialUnitPrice: 180, laborUnitPrice: 65, accessoryUnitPrice: 25 },
        },
        defaultLossRate: 0.03,
        applicableRooms: ['kitchen', 'bathroom'],
    },
    // ===== 客厅吊顶 =====
    {
        standardItemId: 'SI_CEILING_LIVING',
        name: '客厅吊顶',
        category: 'ceiling',
        pricingMode: 'area',
        unit: '㎡',
        tiers: {
            economy: { materialUnitPrice: 0, laborUnitPrice: 0, accessoryUnitPrice: 0 }, // 经济档不做
            standard: { materialUnitPrice: 100, laborUnitPrice: 55, accessoryUnitPrice: 20 },
            premium: { materialUnitPrice: 160, laborUnitPrice: 75, accessoryUnitPrice: 30 },
        },
        defaultLossRate: 0.03,
        applicableRooms: ['living_room', 'dining_room'],
    },
    // ===== 踢脚线 =====
    {
        standardItemId: 'SI_BASEBOARD',
        name: '踢脚线',
        category: 'baseboard',
        pricingMode: 'linear_meter',
        unit: 'm',
        tiers: {
            economy: { materialUnitPrice: 12, laborUnitPrice: 8, accessoryUnitPrice: 2 },
            standard: { materialUnitPrice: 20, laborUnitPrice: 10, accessoryUnitPrice: 3 },
            premium: { materialUnitPrice: 35, laborUnitPrice: 12, accessoryUnitPrice: 5 },
        },
        defaultLossRate: 0.05,
        applicableRooms: ['living_room', 'dining_room', 'master_bedroom', 'bedroom', 'hallway'],
    },
    // ===== 门 =====
    {
        standardItemId: 'SI_DOOR',
        name: '室内门',
        category: 'door',
        pricingMode: 'quantity',
        unit: '樘',
        tiers: {
            economy: { materialUnitPrice: 1200, laborUnitPrice: 200, accessoryUnitPrice: 100 },
            standard: { materialUnitPrice: 2000, laborUnitPrice: 250, accessoryUnitPrice: 150 },
            premium: { materialUnitPrice: 3500, laborUnitPrice: 300, accessoryUnitPrice: 200 },
        },
        defaultLossRate: 0,
        applicableRooms: ['master_bedroom', 'bedroom', 'bathroom', 'kitchen'],
    },
    // ===== 橱柜 =====
    {
        standardItemId: 'SI_CABINET_KITCHEN',
        name: '橱柜',
        category: 'cabinet',
        pricingMode: 'linear_meter',
        unit: 'm',
        tiers: {
            economy: { materialUnitPrice: 1200, laborUnitPrice: 300, accessoryUnitPrice: 200 },
            standard: { materialUnitPrice: 2000, laborUnitPrice: 400, accessoryUnitPrice: 300 },
            premium: { materialUnitPrice: 3500, laborUnitPrice: 500, accessoryUnitPrice: 400 },
        },
        defaultLossRate: 0,
        applicableRooms: ['kitchen'],
    },
    // ===== 卫浴 =====
    {
        standardItemId: 'SI_BATHROOM_SET',
        name: '卫浴套装',
        category: 'bathroom_fixture',
        pricingMode: 'quantity',
        unit: '套',
        tiers: {
            economy: { materialUnitPrice: 3000, laborUnitPrice: 500, accessoryUnitPrice: 300 },
            standard: { materialUnitPrice: 6000, laborUnitPrice: 600, accessoryUnitPrice: 400 },
            premium: { materialUnitPrice: 12000, laborUnitPrice: 800, accessoryUnitPrice: 500 },
        },
        defaultLossRate: 0,
        applicableRooms: ['bathroom'],
    },
    // ===== 定制柜 =====
    {
        standardItemId: 'SI_CUSTOM_WARDROBE',
        name: '定制衣柜',
        category: 'custom_furniture',
        pricingMode: 'area',
        unit: '㎡(投影)',
        tiers: {
            economy: { materialUnitPrice: 600, laborUnitPrice: 100, accessoryUnitPrice: 80 },
            standard: { materialUnitPrice: 900, laborUnitPrice: 120, accessoryUnitPrice: 100 },
            premium: { materialUnitPrice: 1500, laborUnitPrice: 150, accessoryUnitPrice: 130 },
        },
        defaultLossRate: 0,
        applicableRooms: ['master_bedroom', 'bedroom'],
    },
    // ===== 开关插座 =====
    {
        standardItemId: 'SI_SWITCH_SOCKET',
        name: '开关插座',
        category: 'electrical',
        pricingMode: 'point',
        unit: '个',
        tiers: {
            economy: { materialUnitPrice: 15, laborUnitPrice: 10, accessoryUnitPrice: 0 },
            standard: { materialUnitPrice: 30, laborUnitPrice: 12, accessoryUnitPrice: 0 },
            premium: { materialUnitPrice: 60, laborUnitPrice: 15, accessoryUnitPrice: 0 },
        },
        defaultLossRate: 0,
        applicableRooms: [],
    },
    // ===== 灯具 =====
    {
        standardItemId: 'SI_LIGHTING',
        name: '灯具',
        category: 'lighting',
        pricingMode: 'quantity',
        unit: '套',
        tiers: {
            economy: { materialUnitPrice: 200, laborUnitPrice: 50, accessoryUnitPrice: 0 },
            standard: { materialUnitPrice: 500, laborUnitPrice: 60, accessoryUnitPrice: 0 },
            premium: { materialUnitPrice: 1200, laborUnitPrice: 80, accessoryUnitPrice: 0 },
        },
        defaultLossRate: 0,
        applicableRooms: [],
    },
];

// 其他固定费用
export const OTHER_COSTS = {
    economy: { garbageRemoval: 800, cleaning: 600, protection: 500, management: 0.05, contingency: 0.08 },
    standard: { garbageRemoval: 1200, cleaning: 1000, protection: 800, management: 0.06, contingency: 0.10 },
    premium: { garbageRemoval: 1500, cleaning: 1500, protection: 1200, management: 0.08, contingency: 0.10 },
};

export function getPricingRule(standardItemId: string): PricingRule | undefined {
    return BASE_PRICING_RULES.find(r => r.standardItemId === standardItemId);
}
