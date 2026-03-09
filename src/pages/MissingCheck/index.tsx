import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd-mobile';
import { useProjectStore } from '@/store';
import { formatMoney } from '@/utils/format';
import { useGlossaryStore } from '@/store/glossaryStore';
import TermItem from '@/components/Glossary/TermItem';
import FeedbackWidget from '@/components/Feedback/FeedbackWidget';

export default function MissingCheck() {
    const navigate = useNavigate();
    const { budgetResult } = useProjectStore();
    const { init: initGlossary } = useGlossaryStore();

    React.useEffect(() => {
        initGlossary();
    }, [initGlossary]);

    const items = budgetResult?.missingItems || [];
    const stats = [
        { label: '高风险', value: items.filter((item) => item.riskLevel === 'high').length, color: '#be123c', background: '#fff1f2' },
        { label: '中风险', value: items.filter((item) => item.riskLevel === 'medium').length, color: '#b45309', background: '#fff7ed' },
        { label: '低风险', value: items.filter((item) => item.riskLevel === 'low').length, color: '#047857', background: '#ecfdf5' },
    ];

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(244, 114, 182, 0.10)', color: '#db2777' }}>漏项检查</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>预算之外，还要防止施工过程里的隐形支出</div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>把容易被漏掉、后期容易追加的项目提前提醒出来。</div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>
                        返回
                    </Button>
                </div>

                <div className="stats-grid">
                    {stats.map((item) => (
                        <div key={item.label} className="metric-card" style={{ background: item.background }}>
                            <div className="metric-label" style={{ color: item.color }}>{item.label}</div>
                            <div className="metric-value mono-number" style={{ fontSize: 28, marginTop: 8, color: item.color }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                {items.length === 0 ? (
                    <div className="empty-card">
                        <div className="empty-title">当前没有漏项提醒</div>
                        <div className="empty-desc">预算结果比较完整时，这里会显示为空。你也可以回到 AI 咨询页继续补充需求。</div>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="section-card">
                            <div className="page-section-title" style={{ marginBottom: 8 }}>
                                <h3><TermItem name={item.itemName} /></h3>
                                <span className={`risk-${item.riskLevel}`}>
                                    {item.riskLevel === 'high' ? '高风险' : item.riskLevel === 'medium' ? '中风险' : '低风险'}
                                </span>
                            </div>

                            <div className="muted-text" style={{ fontSize: 13 }}>{item.explanation}</div>

                            <div className="stats-grid" style={{ marginTop: 14 }}>
                                <div className="metric-card">
                                    <div className="metric-label">预估费用区间</div>
                                    <div className="feature-desc" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                                        {formatMoney(item.estimatedPriceMin)} - {formatMoney(item.estimatedPriceMax)}
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">建议追问</div>
                                    <div className="feature-desc" style={{ marginTop: 8 }}>{item.askTemplate}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                <FeedbackWidget type="missing" />
            </div>
        </div>
    );
}