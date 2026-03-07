import { RoomType, RoomDimension } from '@/types';
import { v4 as uuid } from 'uuid';

export interface LayoutTemplate {
    id: string;
    layout: string;
    minInnerArea: number;
    maxInnerArea: number;
    rooms: RoomTemplateItem[];
}

interface RoomTemplateItem {
    roomType: RoomType;
    roomName: string;
    areaRatio: number;
    defaultHeight: number;
    doorWindowRatio: number;
}

// 首批户型模板库——15个模板覆盖7种主流户型
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
    // 一室一厅一卫
    {
        id: 'T_1B1L1W_S',
        layout: '1室1厅1卫',
        minInnerArea: 30,
        maxInnerArea: 50,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.30, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.28, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.12, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '卫生间', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
    {
        id: 'T_1B1L1W_M',
        layout: '1室1厅1卫',
        minInnerArea: 50,
        maxInnerArea: 70,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.32, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.25, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.12, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '卫生间', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.11, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
    // 两室一厅一卫
    {
        id: 'T_2B1L1W_S',
        layout: '2室1厅1卫',
        minInnerArea: 50,
        maxInnerArea: 70,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.25, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.20, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧', areaRatio: 0.15, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '卫生间', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.12, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
    // 两室两厅一卫
    {
        id: 'T_2B2L1W_M',
        layout: '2室2厅1卫',
        minInnerArea: 60,
        maxInnerArea: 85,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.22, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'dining_room', roomName: '餐厅', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.10 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.18, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧', areaRatio: 0.14, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '卫生间', areaRatio: 0.07, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.11, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
    // 三室一厅一卫
    {
        id: 'T_3B1L1W_M',
        layout: '3室1厅1卫',
        minInnerArea: 70,
        maxInnerArea: 90,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.22, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.17, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧1', areaRatio: 0.13, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧2', areaRatio: 0.11, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '卫生间', areaRatio: 0.07, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.12, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
    // 三室两厅一卫 (核心户型 - 小)
    {
        id: 'T_3B2L1W_S',
        layout: '3室2厅1卫',
        minInnerArea: 70,
        maxInnerArea: 90,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.22, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'dining_room', roomName: '餐厅', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.10 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.16, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧1', areaRatio: 0.12, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧2', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.07, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '卫生间', areaRatio: 0.06, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.11, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
    // 三室两厅一卫 (核心户型 - 中)
    {
        id: 'T_3B2L1W_M',
        layout: '3室2厅1卫',
        minInnerArea: 90,
        maxInnerArea: 110,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.24, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'dining_room', roomName: '餐厅', areaRatio: 0.09, defaultHeight: 2.8, doorWindowRatio: 0.10 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.15, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧1', areaRatio: 0.12, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧2', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.07, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '卫生间', areaRatio: 0.06, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.09, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
    // 三室两厅二卫 (小)
    {
        id: 'T_3B2L2W_S',
        layout: '3室2厅2卫',
        minInnerArea: 85,
        maxInnerArea: 110,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.22, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'dining_room', roomName: '餐厅', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.10 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.15, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧1', areaRatio: 0.12, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧2', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.07, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '主卫', areaRatio: 0.05, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'bathroom', roomName: '客卫', areaRatio: 0.04, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.09, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
    // 三室两厅二卫 (中)
    {
        id: 'T_3B2L2W_M',
        layout: '3室2厅2卫',
        minInnerArea: 110,
        maxInnerArea: 140,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.23, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'dining_room', roomName: '餐厅', areaRatio: 0.09, defaultHeight: 2.8, doorWindowRatio: 0.10 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.14, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧1', areaRatio: 0.11, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧2', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.07, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '主卫', areaRatio: 0.05, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'bathroom', roomName: '客卫', areaRatio: 0.05, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
    // 四室两厅两卫
    {
        id: 'T_4B2L2W_M',
        layout: '4室2厅2卫',
        minInnerArea: 110,
        maxInnerArea: 150,
        rooms: [
            { roomType: 'living_room', roomName: '客厅', areaRatio: 0.20, defaultHeight: 2.8, doorWindowRatio: 0.15 },
            { roomType: 'dining_room', roomName: '餐厅', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.10 },
            { roomType: 'master_bedroom', roomName: '主卧', areaRatio: 0.13, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧1', areaRatio: 0.10, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧2', areaRatio: 0.09, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'bedroom', roomName: '次卧3', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.12 },
            { roomType: 'kitchen', roomName: '厨房', areaRatio: 0.07, defaultHeight: 2.8, doorWindowRatio: 0.08 },
            { roomType: 'bathroom', roomName: '主卫', areaRatio: 0.05, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'bathroom', roomName: '客卫', areaRatio: 0.04, defaultHeight: 2.8, doorWindowRatio: 0.05 },
            { roomType: 'balcony', roomName: '阳台', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.30 },
            { roomType: 'hallway', roomName: '过道', areaRatio: 0.08, defaultHeight: 2.8, doorWindowRatio: 0.0 },
        ],
    },
];

export function matchTemplate(layout: string, innerArea: number): LayoutTemplate | null {
    // 标准化户型字符串
    const normalized = normalizeLayout(layout);

    // 先按户型匹配，再按面积段匹配
    const candidates = LAYOUT_TEMPLATES.filter(t => normalizeLayout(t.layout) === normalized);

    if (candidates.length === 0) {
        // 退而求其次：按卧室数 + 卫生间数匹配
        const parsed = parseLayout(layout);
        const fallback = LAYOUT_TEMPLATES.filter(t => {
            const tp = parseLayout(t.layout);
            return tp.bedrooms === parsed.bedrooms && tp.bathrooms === parsed.bathrooms;
        });
        if (fallback.length > 0) {
            return findBestAreaMatch(fallback, innerArea);
        }
        return LAYOUT_TEMPLATES[6]; // 默认三室两厅一卫中户型
    }

    return findBestAreaMatch(candidates, innerArea);
}

function findBestAreaMatch(templates: LayoutTemplate[], area: number): LayoutTemplate {
    for (const t of templates) {
        if (area >= t.minInnerArea && area <= t.maxInnerArea) return t;
    }
    // 找最近的
    return templates.reduce((best, t) => {
        const mid = (t.minInnerArea + t.maxInnerArea) / 2;
        const bestMid = (best.minInnerArea + best.maxInnerArea) / 2;
        return Math.abs(area - mid) < Math.abs(area - bestMid) ? t : best;
    }, templates[0]);
}

function normalizeLayout(layout: string): string {
    return layout.replace(/\s+/g, '').replace(/房间|房/g, '室');
}

function parseLayout(layout: string): { bedrooms: number; bathrooms: number } {
    const bedroomMatch = layout.match(/(\d+)室/);
    const bathroomMatch = layout.match(/(\d+)卫/);
    return {
        bedrooms: bedroomMatch ? parseInt(bedroomMatch[1]) : 3,
        bathrooms: bathroomMatch ? parseInt(bathroomMatch[1]) : 1,
    };
}

export function generateRoomDimensions(template: LayoutTemplate, innerArea: number): RoomDimension[] {
    return template.rooms.map(room => {
        const floorArea = innerArea * room.areaRatio;
        const width = Math.sqrt(floorArea * 0.75); // 假设长宽比约 4:3
        const length = floorArea / width;
        const height = room.defaultHeight;
        const perimeter = 2 * (length + width);
        const doorWindowArea = perimeter * height * room.doorWindowRatio;
        const wallArea = perimeter * height - doorWindowArea;
        const ceilingArea = floorArea;

        return {
            id: uuid(),
            roomType: room.roomType,
            roomName: room.roomName,
            length: Math.round(length * 100) / 100,
            width: Math.round(width * 100) / 100,
            height,
            doorWindowArea: Math.round(doorWindowArea * 100) / 100,
            floorArea: Math.round(floorArea * 100) / 100,
            wallArea: Math.round(wallArea * 100) / 100,
            ceilingArea: Math.round(ceilingArea * 100) / 100,
        };
    });
}
