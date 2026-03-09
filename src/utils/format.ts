export function formatMoney(amount: number | null | undefined): string {
    const value = Number(amount || 0)
    if (Math.abs(value) >= 10000) {
        const wan = value / 10000
        const digits = Number.isInteger(wan) ? 0 : 1
        return `${wan.toFixed(digits)} 万元`
    }
    return `${value.toLocaleString('zh-CN')} 元`
}

export function formatMoneyRange(min: number, max: number): string {
    return `${formatMoney(min)} - ${formatMoney(max)}`
}

export function formatArea(area: number): string {
    return `${Number(area || 0).toFixed(1)} ㎡`
}

export function tierLevelLabel(tier: string): string {
    const map: Record<string, string> = {
        economy: '经济档',
        standard: '标准档',
        premium: '品质档',
    }
    return map[tier] || tier
}

export function tierLevelColor(tier: string): string {
    const map: Record<string, string> = {
        economy: '#10B981',
        standard: '#4F46E5',
        premium: '#F59E0B',
    }
    return map[tier] || '#64748B'
}

export function riskLevelLabel(risk: string): string {
    const map: Record<string, string> = {
        high: '高风险',
        medium: '中风险',
        low: '低风险',
    }
    return map[risk] || risk
}

export function categoryLabel(category: string): string {
    const map: Record<string, string> = {
        hydroelectric: '水电改造',
        waterproof: '防水工程',
        floor: '地面工程',
        wall: '墙顶面工程',
        ceiling: '吊顶工程',
        baseboard: '踢脚线',
        door: '门类',
        cabinet: '柜体',
        bathroom_fixture: '卫浴洁具',
        custom_furniture: '定制家具',
        electrical: '开关插座',
        lighting: '灯具照明',
        '水电': '水电改造',
        '防水': '防水工程',
        '瓦工': '瓦工铺贴',
        '墙面': '墙顶面工程',
        '木工': '木作吊顶',
        '安装': '安装阶段',
        '定制': '定制柜体',
        '拆改': '拆改工程',
    }
    return map[category] || category
}