import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Tabs, Tag, Toast, Button, Collapse, Popover, DotLoading } from 'antd-mobile';
import { QuestionCircleOutline } from 'antd-mobile-icons';
import ReactECharts from 'echarts-for-react';
import { useProjectStore } from '@/store';
import { formatMoney, tierLevelLabel, tierLevelColor, categoryLabel } from '@/utils/format';
import { TierLevel, BudgetScheme, BudgetItem } from '@/types';
import { glossaryApi } from '@/api/services';
import FeedbackWidget from '@/components/Feedback/FeedbackWidget';

// 术语辅助组件
const TermItem = ({ item, glossary }: { item: BudgetItem, glossary: any[] }) => {
    const term = glossary.find(g => g.term === item.item_name || (g.aliases && g.aliases.includes(item.item_name)));

    if (!term) return <span>{item.item_name}</span>;

    return (
        <Popover
            content={
                <div style={{ padding: 12, maxWidth: 240, fontSize: 13 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-primary)' }}>{term.term}</div>
                    <div style={{ marginBottom: 8, color: '#4B5563' }}>{term.definition}</div>
                    {term.risk && (
                        <div style={{ color: '#DC2626', fontSize: 12, borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
                            ⚠️ 风险：{term.risk}
                        </div>
                    )}
                </div>
            }
            trigger='click'
            placement='top-start'
        >
            <span style={{ color: 'var(--color-primary)', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'pointer' }}>
                {item.item_name} <QuestionCircleOutline style={{ fontSize: 12, verticalAlign: 'middle' }} />
            </span>
        </Popover>
    );
};

export default function BudgetResult() {
    const navigate = useNavigate();
    const { budgetResult, currentHouse } = useProjectStore();
    const [activeTier, setActiveTier] = useState<TierLevel>(currentHouse?.tierLevel || 'standard');
    const [glossary, setGlossary] = useState<any[]>([]);

    useEffect(() => {
        glossaryApi.list().then(setGlossary).catch(console.error);
    }, []);

    if (!budgetResult || !currentHouse) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <p>暂无预算数据</p>
                <Button color="primary" onClick={() => navigate('/consult')}>去生成预算</Button>
            </div>
        );
    }

    const currentScheme = (budgetResult[activeTier] || budgetResult.schemes?.find(s => s.tier === activeTier) || budgetResult.schemes?.[0]) as BudgetScheme;

    if (!currentScheme) {
        return <div style={{ padding: 40, textAlign: 'center' }}><DotLoading /> 数据加载中...</div>;
    }

    // 饼图数据
    const pieOption = useMemo(() => ({
        tooltip: { trigger: 'item', formatter: '{b}: {c}元 ({d}%)' },
        color: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
        series: [{
            type: 'pie',
            radius: ['45%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: [
                { value: currentScheme.material_amount, name: '材料' },
                { value: currentScheme.labor_amount, name: '人工' },
                { value: currentScheme.management_fee, name: '管理费' },
                { value: currentScheme.contingency, name: '预备金' },
            ].filter(d => d.value > 0),
        }],
    }), [currentScheme]);

    const categories = useMemo(() => {
        const map = new Map<string, number>();
        currentScheme.items.forEach(item => {
            map.set(item.category, (map.get(item.category) || 0) + item.subtotal);
        });
        return Array.from(map.entries())
            .map(([cat, total]) => ({ category: cat, label: categoryLabel(cat), total }))
            .sort((a, b) => b.total - a.total);
    }, [currentScheme]);

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 40 }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                预算报告
            </NavBar>

            {/* 总预算卡片 */}
            <div style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                margin: 12,
                borderRadius: 16,
                padding: '24px 20px',
                color: '#fff',
            }}>
                <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>
                    {currentHouse.city} · {currentHouse.layout} · {tierLevelLabel(activeTier)}
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
                    {formatMoney(currentScheme.total_amount)}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    套内 {currentHouse.innerArea}㎡ · 约{Math.round(currentScheme.total_amount / (currentHouse.innerArea || 1))}元/㎡
                </div>

                {budgetResult.overBudget && activeTier === currentHouse.tierLevel && (
                    <div style={{
                        marginTop: 12,
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 13,
                    }}>
                        ⚠️ 超出目标预算 {formatMoney(budgetResult.overBudgetAmount)}
                    </div>
                )}

                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
                    * 以上为参考估算，实际费用通常有10%-20%浮动
                </div>
            </div>

            {/* 三档切换 */}
            <div style={{ margin: '0 12px', display: 'flex', gap: 8 }}>
                {(['economy', 'standard', 'premium'] as TierLevel[]).map(tier => (
                    <div
                        key={tier}
                        onClick={() => setActiveTier(tier)}
                        style={{
                            flex: 1,
                            padding: '12px 8px',
                            background: activeTier === tier ? tierLevelColor(tier) : '#fff',
                            color: activeTier === tier ? '#fff' : 'var(--color-text)',
                            borderRadius: 10,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{tierLevelLabel(tier)}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                            {formatMoney(budgetResult[tier]?.total_amount || 0)}
                        </div>
                    </div>
                ))}
            </div>

            {/* 饼图 */}
            <div style={{ margin: '16px 12px', background: '#fff', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>费用构成</h3>
                <ReactECharts option={pieOption} style={{ height: 220 }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {[
                        { label: '材料', value: currentScheme.material_amount, color: '#4F46E5' },
                        { label: '人工', value: currentScheme.labor_amount, color: '#10B981' },
                        { label: '管理费', value: currentScheme.management_fee, color: '#F59E0B' },
                        { label: '预备金', value: currentScheme.contingency, color: '#EC4899' },
                    ].filter(d => d.value > 0).map(d => (
                        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                            {d.label} {formatMoney(d.value)}
                        </div>
                    ))}
                </div>
            </div>

            {/* 分类明细 */}
            <div style={{ margin: '0 12px 16px', background: '#fff', borderRadius: 12 }}>
                <div style={{ padding: '14px 16px 0' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>分项明细</h3>
                </div>
                <Collapse>
                    {categories.map(cat => (
                        <Collapse.Panel
                            key={cat.category}
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: 8 }}>
                                    <span>{cat.label}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                        {formatMoney(cat.total)}
                                    </span>
                                </div>
                            }
                        >
                            <div style={{ fontSize: 13 }}>
                                {currentScheme.items
                                    .filter(i => i.category === cat.category)
                                    .map(item => (
                                        <div key={item.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '6px 0',
                                            borderBottom: '1px solid #F3F4F6',
                                        }}>
                                            <div>
                                                <div style={{ color: 'var(--color-text)' }}>
                                                    <TermItem item={item} glossary={glossary} />
                                                </div>
                                                <div style={{ color: 'var(--color-text-light)', fontSize: 11 }}>
                                                    {item.quantity}{item.unit} × {item.material_unit_price + item.labor_unit_price + item.accessory_unit_price}元/{item.unit}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                {formatMoney(item.subtotal)}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </Collapse.Panel>
                    ))}
                </Collapse>
            </div>

            {/* 漏项提醒 */}
            {budgetResult.missing_items && budgetResult.missing_items.length > 0 && (
                <div style={{ margin: '0 12px 16px', background: '#fff', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>⚠️ 重点关注</h3>
                    {budgetResult.suggestions?.map((s, idx) => (
                        <div key={idx} style={{ fontSize: 13, color: '#6B7280', marginBottom: 8, display: 'flex', gap: 8 }}>
                            <span style={{ color: 'var(--color-primary)' }}>•</span>
                            <span>{s}</span>
                        </div>
                    ))}
                </div>
            )}

            <FeedbackWidget type="budget" />

            <div style={{ padding: '12px 16px 32px', display: 'flex', gap: 10 }}>
                <Button block fill="outline" color="primary" shape="rounded" onClick={() => navigate('/consult')}>
                    重新咨询
                </Button>
                <Button block color="primary" shape="rounded" onClick={() => { Toast.show({ content: '报告已保存', icon: 'success' }); }}>
                    保存报告
                </Button>
            </div>
        </div>
    );
}
