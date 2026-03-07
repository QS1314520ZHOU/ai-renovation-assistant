import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Tabs, Tag, Toast, Button, Collapse } from 'antd-mobile';
import ReactECharts from 'echarts-for-react';
import { useProjectStore } from '@/store';
import { formatMoney, tierLevelLabel, tierLevelColor, categoryLabel } from '@/utils/format';
import { TierLevel, BudgetScheme } from '@/types';
import FeedbackWidget from '@/components/Feedback/FeedbackWidget';

export default function BudgetResult() {
    const navigate = useNavigate();
    const { budgetResult, currentHouse } = useProjectStore();
    const [activeTier, setActiveTier] = useState<TierLevel>(currentHouse?.tierLevel || 'standard');

    if (!budgetResult || !currentHouse) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <p>暂无预算数据</p>
                <Button color="primary" onClick={() => navigate('/consult')}>去生成预算</Button>
            </div>
        );
    }

    const currentScheme: BudgetScheme = budgetResult[activeTier];

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
                { value: currentScheme.hardDecorationBudget, name: '硬装基础' },
                { value: currentScheme.mainMaterialBudget, name: '主材' },
                { value: currentScheme.kitchenBathroomBudget, name: '厨卫' },
                { value: currentScheme.customBudget, name: '定制' },
                { value: currentScheme.otherBudget, name: '其他' },
                { value: currentScheme.contingencyBudget, name: '预备金' },
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
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
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
                    {formatMoney(currentScheme.totalBudget)}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    套内 {currentHouse.innerArea}㎡ · 约{Math.round(currentScheme.totalBudget / currentHouse.innerArea!)}元/㎡
                </div>

                {/* 超预算提示 */}
                {budgetResult.overBudget && activeTier === currentHouse.tierLevel && (
                    <div style={{
                        marginTop: 12,
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 13,
                    }}>
                        ⚠️ 超出目标预算 {formatMoney(budgetResult.overBudgetAmount)}，建议查看下方优化建议
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
                            {formatMoney(budgetResult[tier].totalBudget)}
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
                        { label: '硬装基础', value: currentScheme.hardDecorationBudget, color: '#4F46E5' },
                        { label: '主材', value: currentScheme.mainMaterialBudget, color: '#10B981' },
                        { label: '厨卫', value: currentScheme.kitchenBathroomBudget, color: '#F59E0B' },
                        { label: '定制', value: currentScheme.customBudget, color: '#EF4444' },
                        { label: '其他', value: currentScheme.otherBudget, color: '#8B5CF6' },
                        { label: '预备金', value: currentScheme.contingencyBudget, color: '#EC4899' },
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
                                                <div style={{ color: 'var(--color-text)' }}>{item.itemName}</div>
                                                <div style={{ color: 'var(--color-text-light)', fontSize: 11 }}>
                                                    {item.quantity}{item.unit} × {item.materialUnitPrice + item.laborUnitPrice + item.accessoryUnitPrice}元/{item.unit}
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
            {budgetResult.missingItems.length > 0 && (
                <div style={{ margin: '0 12px 16px', background: '#fff', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600 }}>⚠️ 漏项提醒</h3>
                        <Tag color="warning">{budgetResult.missingItems.length}项</Tag>
                    </div>
                    {budgetResult.missingItems.map(item => (
                        <div key={item.id} style={{
                            padding: '10px 12px',
                            background: item.riskLevel === 'high' ? '#FEF2F2' : item.riskLevel === 'medium' ? '#FFFBEB' : '#F0FDF4',
                            borderRadius: 8,
                            marginBottom: 8,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.itemName}</span>
                                <span className={`risk-${item.riskLevel}`}>{
                                    item.riskLevel === 'high' ? '高风险' : item.riskLevel === 'medium' ? '中风险' : '低风险'
                                }</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>
                                {item.explanation}
                            </div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                                预估费用：{formatMoney(item.estimatedPriceMin)} - {formatMoney(item.estimatedPriceMax)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 优化建议 */}
            {budgetResult.optimizations.length > 0 && (
                <div style={{ margin: '0 12px 16px', background: '#fff', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>💡 优化建议</h3>
                    {budgetResult.optimizations.map(opt => (
                        <div key={opt.id} style={{
                            padding: '10px 12px',
                            background: opt.type === 'must_keep' ? '#FEF2F2' : opt.type === 'save' ? '#F0FDF4' : '#EEF2FF',
                            borderRadius: 8,
                            marginBottom: 8,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <Tag color={opt.type === 'must_keep' ? 'danger' : opt.type === 'save' ? 'success' : 'primary'} fill="outline" style={{ fontSize: 11 }}>
                                    {opt.type === 'must_keep' ? '🔒 不建议省' : opt.type === 'save' ? '✂️ 可优化' : '🔄 可替代'}
                                </Tag>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.title}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                                {opt.description}
                            </div>
                            {opt.savingAmount && (
                                <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                                    预估可省：{formatMoney(opt.savingAmount)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 反馈 */}
            <FeedbackWidget type="budget" />

            {/* 底部操作 */}
            <div style={{
                padding: '12px 16px 32px',
                display: 'flex',
                gap: 10,
            }}>
                <Button
                    block
                    fill="outline"
                    color="primary"
                    shape="rounded"
                    onClick={() => navigate('/missing-check')}
                >
                    查看完整漏项
                </Button>
                <Button
                    block
                    color="primary"
                    shape="rounded"
                    onClick={() => {
                        Toast.show({ content: '报告已保存，可在"我的项目"中查看', icon: 'success' });
                    }}
                >
                    保存报告
                </Button>
            </div>
        </div>
    );
}
