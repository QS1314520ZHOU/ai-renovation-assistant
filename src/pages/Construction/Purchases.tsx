
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox, Tag, Badge, Button } from 'antd-mobile';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';

export default function Purchases() {
    const navigate = useNavigate();
    const { purchases, togglePurchase, currentPhase } = useConstructionStore();

    const grouped = useMemo(() => {
        const map = new Map<string, typeof purchases>();
        PHASE_LIST.forEach((phase) => {
            const items = purchases.filter((purchase) => purchase.phase === phase.phase);
            if (items.length > 0) map.set(phase.phase, items);
        });
        return map;
    }, [purchases]);

    const purchasedCount = purchases.filter((item) => item.purchased).length;

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(14, 165, 233, 0.10)', color: '#0369a1' }}>采购清单</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>按施工阶段管理采购事项</div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>
                            已采购 {purchasedCount} / {purchases.length} 项 · 当前阶段：{PHASE_LIST.find((item) => item.phase === currentPhase)?.name}
                        </div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>
                        返回
                    </Button>
                </div>

                {Array.from(grouped.entries()).map(([phase, items]) => {
                    const phaseInfo = PHASE_LIST.find((item) => item.phase === phase);
                    const isCurrent = currentPhase === phase;
                    const pendingCount = items.filter((item) => !item.purchased).length;

                    return (
                        <div key={phase} className="section-card">
                            <div className="page-section-title">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <h3>{phaseInfo?.icon} {phaseInfo?.name}</h3>
                                    {isCurrent && <Tag color="primary" fill="solid">当前阶段</Tag>}
                                </div>
                                {pendingCount > 0 ? <Badge content={pendingCount} /> : <span className="inline-pill">已完成</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {items.map((item) => (
                                    <div key={item.id} className="panel-card" style={{ padding: '14px 16px', opacity: item.purchased ? 0.72 : 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                            <Checkbox checked={item.purchased} onChange={() => togglePurchase(item.id)} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--color-text)', textDecoration: item.purchased ? 'line-through' : 'none' }}>{item.name}</div>
                                                    {item.needMeasureFirst && <Tag color="warning" fill="outline">先量尺</Tag>}
                                                </div>
                                                <div className="feature-desc" style={{ marginTop: 6 }}>
                                                    <div>最晚购买节点：{item.mustBuyBefore}</div>
                                                    <div>预算参考：{item.estimatedBudget}</div>
                                                    <div>选购提示：{item.tips}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
