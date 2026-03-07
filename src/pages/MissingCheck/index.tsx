import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Tag, Empty } from 'antd-mobile';
import { useProjectStore } from '@/store';
import { formatMoney } from '@/utils/format';
import FeedbackWidget from '@/components/Feedback/FeedbackWidget';

export default function MissingCheck() {
    const navigate = useNavigate();
    const { budgetResult } = useProjectStore();

    const items = budgetResult?.missingItems || [];

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                漏项检查
            </NavBar>

            <div style={{ padding: '12px 16px' }}>
                {/* 统计 */}
                <div style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 16,
                }}>
                    {[
                        { label: '高风险', count: items.filter(i => i.riskLevel === 'high').length, color: '#EF4444', bg: '#FEF2F2' },
                        { label: '中风险', count: items.filter(i => i.riskLevel === 'medium').length, color: '#F59E0B', bg: '#FFFBEB' },
                        { label: '低风险', count: items.filter(i => i.riskLevel === 'low').length, color: '#10B981', bg: '#F0FDF4' },
                    ].map(s => (
                        <div key={s.label} style={{
                            flex: 1,
                            background: s.bg,
                            borderRadius: 10,
                            padding: '12px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
                            <div style={{ fontSize: 12, color: s.color }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {items.length === 0 ? (
                    <Empty description="暂无漏项提醒" style={{ marginTop: 60 }} />
                ) : (
                    items.map(item => (
                        <div key={item.id} style={{
                            background: '#fff',
                            borderRadius: 12,
                            padding: '16px',
                            marginBottom: 12,
                            boxShadow: 'var(--shadow-sm)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 16, fontWeight: 600 }}>{item.itemName}</span>
                                <span className={`risk-${item.riskLevel}`}>
                                    {item.riskLevel === 'high' ? '高风险' : item.riskLevel === 'medium' ? '中风险' : '低风险'}
                                </span>
                            </div>

                            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 8 }}>
                                {item.explanation}
                            </div>

                            <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
                                💰 预估费用：<b>{formatMoney(item.estimatedPriceMin)} - {formatMoney(item.estimatedPriceMax)}</b>
                            </div>

                            <div style={{
                                background: '#F3F4F6',
                                borderRadius: 8,
                                padding: '10px 12px',
                                fontSize: 12,
                                color: '#4B5563',
                                lineHeight: 1.5,
                            }}>
                                💬 建议追问：{item.askTemplate}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <FeedbackWidget type="missing" />
        </div>
    );
}
