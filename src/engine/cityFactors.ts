// 城市价格系数（基准城市成都 = 1.0）
export interface CityFactor {
    code: string;
    name: string;
    factor: number;
    hasLocalData: boolean;
    tier: '一线' | '新一线' | '二线' | '三线';
}

export const CITY_FACTORS: CityFactor[] = [
    { code: 'beijing', name: '北京', factor: 1.35, hasLocalData: true, tier: '一线' },
    { code: 'shanghai', name: '上海', factor: 1.35, hasLocalData: true, tier: '一线' },
    { code: 'guangzhou', name: '广州', factor: 1.25, hasLocalData: true, tier: '一线' },
    { code: 'shenzhen', name: '深圳', factor: 1.35, hasLocalData: true, tier: '一线' },
    { code: 'chengdu', name: '成都', factor: 1.00, hasLocalData: true, tier: '新一线' },
    { code: 'chongqing', name: '重庆', factor: 0.95, hasLocalData: true, tier: '新一线' },
    { code: 'hangzhou', name: '杭州', factor: 1.20, hasLocalData: true, tier: '新一线' },
    { code: 'wuhan', name: '武汉', factor: 1.05, hasLocalData: true, tier: '新一线' },
    { code: 'nanjing', name: '南京', factor: 1.15, hasLocalData: true, tier: '新一线' },
    { code: 'xian', name: '西安', factor: 0.95, hasLocalData: true, tier: '新一线' },
    { code: 'changsha', name: '长沙', factor: 0.92, hasLocalData: false, tier: '新一线' },
    { code: 'zhengzhou', name: '郑州', factor: 0.95, hasLocalData: false, tier: '新一线' },
    { code: 'kunming', name: '昆明', factor: 0.90, hasLocalData: false, tier: '二线' },
    { code: 'guiyang', name: '贵阳', factor: 0.85, hasLocalData: false, tier: '二线' },
    { code: 'nanning', name: '南宁', factor: 0.88, hasLocalData: false, tier: '二线' },
];

export function getCityFactor(cityName: string): CityFactor {
    const city = CITY_FACTORS.find(c => cityName.includes(c.name));
    if (city) return city;
    // 默认返回成都系数
    return { code: 'default', name: cityName, factor: 1.0, hasLocalData: false, tier: '二线' };
}

export function getCityNames(): string[] {
    return CITY_FACTORS.map(c => c.name);
}
