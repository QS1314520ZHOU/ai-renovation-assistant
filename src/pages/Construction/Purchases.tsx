import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Checkbox, Tag, Badge } from 'antd-mobile';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';

export default function Purchases() {
    const navigate = useNavigate();
    const { purchases, togglePurchase, currentPhase } = useConstructionStore();

    const grouped = useMemo(() => {
        const map = new Map<string, typeof purchases>();
        PHASE_LIST.forEach(p => {
            const items = purchases.filter(pu => pu.phase === p.phase);
            if (items.length > 0) map.set(p.phase, items);
        });
        return map;
    }, [purchases]);

    const purchasedCount = purchases.filter(p => p.purchased).length;

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                采购时间表
            </NavBar>

            <div style={{
                margin: 12, padding: 14, background: '#fff', borderRadius: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>采购进度</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                        {purchasedCount} / {purchases.length}
                    </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-light)' }}>
                    {purchases.filter(p => p.needMeasureFirst && !p.purchased).length} 项需提前量尺
                </div>
            </div>

            <div style={{ padding: '0 12px 40px' }}>
                {Array.from(grouped.entries()).map(([phase, items]) => {
                    const phaseInfo = PHASE_LIST.find(p => p.phase === phase);
                    const isCurrent = currentPhase === phase;
                    const unboughtCount = items.filter(i => !i.purchased).length;

                    return (
                        <div key={phase} style={{ marginBottom: 20 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                                padding: '8px 12px', background: isCurrent ? '#EEF2FF' : '#fff', borderRadius: 8,
                            }}>
                                <span style={{ fontSize: 18 }}>{phaseInfo?.icon}</span>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{phaseInfo?.name}</span>
                                {isCurrent && <Tag color="primary" fill="solid" style={{ fontSize: 10 }}>当前阶段</Tag>}
                                {unboughtCount > 0 && (
                                    <Badge content={unboughtCount} style={{ '--right': '-4px', '--top': '-4px' } as any} />
                                )}
                            </div>

                            {items.map(item => (
                                <div key={item.id} style={{
                                    background: '#fff',
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    marginBottom: 8,
                                    border: item.purchased ? '1px solid #D1FAE5' : '1px solid var(--color-border)',
                                    opacity: item.purchased ? 0.7 : 1,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <Checkbox
                                            checked={item.purchased}
                                            onChange={() => togglePurchase(item.id)}
                                            style={{ flexShrink: 0, marginTop: 2 }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: 14, fontWeight: 500,
                                                textDecoration: item.purchased ? 'line-through' : 'none',
                                            }}>
                                                {item.name}
                                                {item.needMeasureFirst && (
                                                    <Tag color="warning" fill="outline" style={{ fontSize: 10, marginLeft: 6 }}>需量尺</Tag>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                                                <div>⏰ {item.mustBuyBefore}</div>
                                                <div>💰 预估：{item.estimatedBudget}</div>
                                                <div>💡 {item.tips}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
