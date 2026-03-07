export function formatMoney(amount: number): string {
    if (amount >= 10000) {
        return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toLocaleString('zh-CN') + '元';
}

export function formatMoneyRange(min: number, max: number): string {
    return `${formatMoney(min)} - ${formatMoney(max)}`;
}

export function formatArea(area: number): string {
    return area.toFixed(1) + '㎡';
}

export function tierLevelLabel(tier: string): string {
    const map: Record<string, string> = {
        economy: '经济档',
        standard: '普通档',
        premium: '改善档',
    };
    return map[tier] || tier;
}

export function tierLevelColor(tier: string): string {
    const map: Record<string, string> = {
        economy: '#10B981',
        standard: '#4F46E5',
        premium: '#F59E0B',
    };
    return map[tier] || '#6B7280';
}

export function riskLevelLabel(risk: string): string {
    const map: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' };
    return map[risk] || risk;
}

export function categoryLabel(category: string): string {
    const map: Record<string, string> = {
        hydroelectric: '水电改造',
        waterproof: '防水工程',
        floor: '地面工程',
        wall: '墙顶面工程',
        ceiling: '吊顶工程',
        baseboard: '踢脚线',
        door: '门',
        cabinet: '橱柜',
        bathroom_fixture: '卫浴',
        custom_furniture: '定制柜',
        electrical: '开关插座',
        lighting: '灯具',
    };
    return map[category] || category;
}
