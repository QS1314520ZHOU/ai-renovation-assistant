import { TierLevel } from '@/types';

export type StyleKey = 'modern' | 'nordic' | 'japanese' | 'luxury' | 'chinese';
export type DesignRoomType = 'living' | 'bedroom' | 'kitchen' | 'bathroom';

export interface DesignInspiration {
    id: string;
    tier: TierLevel;
    styleKey: StyleKey;
    style: string;
    roomType: DesignRoomType;
    title: string;
    desc: string;
    imageUrl: string;
    areaRange: string;
}

export interface InspirationQuery {
    tier?: TierLevel;
    styleKey?: StyleKey | 'all';
    roomType?: DesignRoomType | 'all';
    keyword?: string;
    ids?: string[];
    limit?: number;
}

export const STYLE_OPTIONS: Array<{ key: StyleKey; label: string }> = [
    { key: 'modern', label: '现代简约' },
    { key: 'nordic', label: '北欧自然' },
    { key: 'japanese', label: '日式原木' },
    { key: 'luxury', label: '轻奢现代' },
    { key: 'chinese', label: '新中式' },
];

export const ROOM_OPTIONS: Array<{ key: DesignRoomType; label: string }> = [
    { key: 'living', label: '客厅' },
    { key: 'bedroom', label: '卧室' },
    { key: 'kitchen', label: '厨房' },
    { key: 'bathroom', label: '卫生间' },
];

const ITEMS: DesignInspiration[] = [
    {
        id: 'modern-eco-living-1',
        tier: 'economy',
        styleKey: 'modern',
        style: '现代简约',
        roomType: 'living',
        title: '经济档简约客厅',
        desc: '白墙+木色，硬装轻投入，软装后期慢慢加。',
        imageUrl: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80',
        areaRange: '70-95㎡',
    },
    {
        id: 'modern-eco-bedroom-1',
        tier: 'economy',
        styleKey: 'modern',
        style: '现代简约',
        roomType: 'bedroom',
        title: '经济档主卧',
        desc: '通刷乳胶漆 + 成品衣柜，预算可控。',
        imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        areaRange: '70-95㎡',
    },
    {
        id: 'modern-standard-living-1',
        tier: 'standard',
        styleKey: 'modern',
        style: '现代简约',
        roomType: 'living',
        title: '标准档现代客厅',
        desc: '无主灯 + 电视背景简化，层次感更好。',
        imageUrl: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'modern-standard-kitchen-1',
        tier: 'standard',
        styleKey: 'modern',
        style: '现代简约',
        roomType: 'kitchen',
        title: '标准档厨房',
        desc: 'U 型动线，石英石台面，收纳到顶。',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'modern-premium-living-1',
        tier: 'premium',
        styleKey: 'modern',
        style: '现代简约',
        roomType: 'living',
        title: '品质档极简客厅',
        desc: '大板材与定制柜体一体化，空间更完整。',
        imageUrl: 'https://images.unsplash.com/photo-1616594039964-8db67f4f62f5?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
    {
        id: 'modern-premium-bathroom-1',
        tier: 'premium',
        styleKey: 'modern',
        style: '现代简约',
        roomType: 'bathroom',
        title: '品质档卫浴',
        desc: '壁挂马桶 + 岩板台盆，整体感强。',
        imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
    {
        id: 'nordic-eco-living-1',
        tier: 'economy',
        styleKey: 'nordic',
        style: '北欧自然',
        roomType: 'living',
        title: '北欧轻量客厅',
        desc: '大白墙 + 原木色家具，舒适又省预算。',
        imageUrl: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80',
        areaRange: '70-95㎡',
    },
    {
        id: 'nordic-standard-living-1',
        tier: 'standard',
        styleKey: 'nordic',
        style: '北欧自然',
        roomType: 'living',
        title: '北欧平衡客厅',
        desc: '柔和木色+亚麻布艺，光线友好。',
        imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'nordic-standard-bedroom-1',
        tier: 'standard',
        styleKey: 'nordic',
        style: '北欧自然',
        roomType: 'bedroom',
        title: '北欧卧室',
        desc: '低饱和配色，适合睡眠环境。',
        imageUrl: 'https://images.unsplash.com/photo-1495433324511-bf8e92934d90?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'nordic-premium-living-1',
        tier: 'premium',
        styleKey: 'nordic',
        style: '北欧自然',
        roomType: 'living',
        title: '北欧高配客厅',
        desc: '木饰面和软装统一，细节更精致。',
        imageUrl: 'https://images.unsplash.com/photo-1617098474202-0d0d7f60b14c?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
    {
        id: 'nordic-premium-kitchen-1',
        tier: 'premium',
        styleKey: 'nordic',
        style: '北欧自然',
        roomType: 'kitchen',
        title: '北欧高配厨房',
        desc: '浅色橱柜与木色点缀，耐看耐用。',
        imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
    {
        id: 'japanese-eco-bedroom-1',
        tier: 'economy',
        styleKey: 'japanese',
        style: '日式原木',
        roomType: 'bedroom',
        title: '日式入门卧室',
        desc: '简洁线条+原木纹理，成本友好。',
        imageUrl: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?auto=format&fit=crop&w=1200&q=80',
        areaRange: '70-95㎡',
    },
    {
        id: 'japanese-standard-living-1',
        tier: 'standard',
        styleKey: 'japanese',
        style: '日式原木',
        roomType: 'living',
        title: '日式治愈客厅',
        desc: '榻榻米角落+低矮家具，放松感强。',
        imageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'japanese-standard-bedroom-1',
        tier: 'standard',
        styleKey: 'japanese',
        style: '日式原木',
        roomType: 'bedroom',
        title: '日式原木卧室',
        desc: '留白+收纳，适合中小户型。',
        imageUrl: 'https://images.unsplash.com/photo-1616593969747-4797dc75033e?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'japanese-premium-living-1',
        tier: 'premium',
        styleKey: 'japanese',
        style: '日式原木',
        roomType: 'living',
        title: '日式高配客厅',
        desc: '整屋木作比例更高，触感和质感更统一。',
        imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
    {
        id: 'japanese-premium-bathroom-1',
        tier: 'premium',
        styleKey: 'japanese',
        style: '日式原木',
        roomType: 'bathroom',
        title: '日式高配卫浴',
        desc: '干区木纹+湿区微水泥，质感温和。',
        imageUrl: 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c3?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
    {
        id: 'luxury-eco-living-1',
        tier: 'economy',
        styleKey: 'luxury',
        style: '轻奢现代',
        roomType: 'living',
        title: '轻奢轻投入客厅',
        desc: '重点做灯光和局部金属元素，成本可控。',
        imageUrl: 'https://images.unsplash.com/photo-1600607687644-c7f34b5c40f3?auto=format&fit=crop&w=1200&q=80',
        areaRange: '70-95㎡',
    },
    {
        id: 'luxury-standard-living-1',
        tier: 'standard',
        styleKey: 'luxury',
        style: '轻奢现代',
        roomType: 'living',
        title: '轻奢标准客厅',
        desc: '石材纹理+黄铜点缀，质感明显提升。',
        imageUrl: 'https://images.unsplash.com/photo-1617104551722-3b2d513664fd?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'luxury-standard-bedroom-1',
        tier: 'standard',
        styleKey: 'luxury',
        style: '轻奢现代',
        roomType: 'bedroom',
        title: '轻奢标准卧室',
        desc: '软包床头 + 分层灯光，氛围感更强。',
        imageUrl: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'luxury-premium-living-1',
        tier: 'premium',
        styleKey: 'luxury',
        style: '轻奢现代',
        roomType: 'living',
        title: '轻奢高配客厅',
        desc: '大板岩板和定制柜统一，观感更完整。',
        imageUrl: 'https://images.unsplash.com/photo-1616594039964-8db67f4f62f5?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
    {
        id: 'luxury-premium-bathroom-1',
        tier: 'premium',
        styleKey: 'luxury',
        style: '轻奢现代',
        roomType: 'bathroom',
        title: '轻奢高配卫浴',
        desc: '岩板+无边框淋浴间，体验升级明显。',
        imageUrl: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
    {
        id: 'chinese-eco-living-1',
        tier: 'economy',
        styleKey: 'chinese',
        style: '新中式',
        roomType: 'living',
        title: '新中式简配客厅',
        desc: '保留东方元素，减少复杂造型。',
        imageUrl: 'https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?auto=format&fit=crop&w=1200&q=80',
        areaRange: '70-95㎡',
    },
    {
        id: 'chinese-standard-living-1',
        tier: 'standard',
        styleKey: 'chinese',
        style: '新中式',
        roomType: 'living',
        title: '新中式平衡客厅',
        desc: '木格栅与现代灯光结合，传统不老气。',
        imageUrl: 'https://images.unsplash.com/photo-1600494603989-9650cf6ddd3d?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'chinese-standard-bedroom-1',
        tier: 'standard',
        styleKey: 'chinese',
        style: '新中式',
        roomType: 'bedroom',
        title: '新中式卧室',
        desc: '暖木色背景，睡眠空间更安稳。',
        imageUrl: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80',
        areaRange: '85-120㎡',
    },
    {
        id: 'chinese-premium-living-1',
        tier: 'premium',
        styleKey: 'chinese',
        style: '新中式',
        roomType: 'living',
        title: '新中式高配客厅',
        desc: '木作细节丰富，空间礼序感更强。',
        imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
    {
        id: 'chinese-premium-kitchen-1',
        tier: 'premium',
        styleKey: 'chinese',
        style: '新中式',
        roomType: 'kitchen',
        title: '新中式高配厨房',
        desc: '木色柜门+岩板台面，实用与气质兼顾。',
        imageUrl: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80',
        areaRange: '110-160㎡',
    },
];

export function getAllInspirations(): DesignInspiration[] {
    return [...ITEMS];
}

export function getDesignInspirations(query: InspirationQuery = {}): DesignInspiration[] {
    const { tier, styleKey, roomType, keyword, ids, limit } = query;
    let list = [...ITEMS];

    if (tier) {
        list = list.filter((item) => item.tier === tier);
    }
    if (styleKey && styleKey !== 'all') {
        list = list.filter((item) => item.styleKey === styleKey);
    }
    if (roomType && roomType !== 'all') {
        list = list.filter((item) => item.roomType === roomType);
    }
    if (Array.isArray(ids) && ids.length > 0) {
        const idSet = new Set(ids);
        list = list.filter((item) => idSet.has(item.id));
    }
    if (keyword) {
        const key = keyword.trim().toLowerCase();
        if (key) {
            list = list.filter(
                (item) =>
                    item.title.toLowerCase().includes(key)
                    || item.desc.toLowerCase().includes(key)
                    || item.style.toLowerCase().includes(key),
            );
        }
    }

    if (typeof limit === 'number' && limit > 0) {
        return list.slice(0, limit);
    }
    return list;
}

export function getDesignInspirationsByTier(
    tier: TierLevel,
    limit = 6,
    styleKey?: StyleKey | 'all',
): DesignInspiration[] {
    const sameTier = getDesignInspirations({ tier, styleKey, limit });
    if (sameTier.length >= limit) {
        return sameTier.slice(0, limit);
    }
    const fallback = getDesignInspirations({ styleKey, limit: Math.max(limit * 2, 12) }).filter(
        (item) => item.tier !== tier,
    );
    return [...sameTier, ...fallback].slice(0, limit);
}
