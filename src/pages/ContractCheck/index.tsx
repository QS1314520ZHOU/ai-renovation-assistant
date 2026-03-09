
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Toast, TextArea } from 'antd-mobile';
import ReactECharts from 'echarts-for-react';
import { contractApi } from '@/api/services';
import { useProjectStore } from '@/store';
import FeedbackWidget from '@/components/Feedback/FeedbackWidget';

interface ContractRiskItem {
    category: string;
    risk_level: 'high' | 'medium' | 'low';
    original_text?: string;
    risk_point: string;
    suggestion: string;
}

interface ContractReport {
    score: number;
    risks: { high: number; medium: number; low: number };
    payment_terms: any;
    recommendations: string[];
    summary: string;
    details: ContractRiskItem[];
}

export default function ContractCheck() {
    const navigate = useNavigate();
    const { currentHouse } = useProjectStore();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ContractReport | null>(null);
    const [parsePhase, setParsePhase] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toReport = (payload: any): ContractReport => {
        const data = payload?.data || payload;
        return {
            score: data.score,
            risks: data.risks,
            payment_terms: data.payment_terms,
            recommendations: data.recommendations || [],
            summary: data.summary,
            details: data.risks_json || [],
        };
    };

    const handleTextAnalyze = async () => {
        if (!input.trim()) {
            Toast.show({ content: '请先输入合同内容', icon: 'fail' });
            return;
        }

        setLoading(true);
        setReport(null);
        setParsePhase('AI 正在解析合同内容');
        try {
            const result = await contractApi.checkText(currentHouse?.id || 'default', input);
            setReport(toReport(result));
        } catch (error: any) {
            Toast.show({ content: `解析失败：${error.message}`, icon: 'fail' });
        } finally {
            setLoading(false);
            setParsePhase('');
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setReport(null);
        setParsePhase('AI 正在解析合同图片');
        try {
            const result = await contractApi.upload(currentHouse?.id || 'default', file);
            if (result.error) {
                Toast.show({ content: result.error, icon: 'fail' });
            } else {
                setReport(toReport(result));
                Toast.show({ content: '合同识别完成', icon: 'success' });
            }
        } catch (error: any) {
            Toast.show({ content: `解析失败：${error.message}`, icon: 'fail' });
        } finally {
            setLoading(false);
            setParsePhase('');
            event.target.value = '';
        }
    };

    const scoreLabel = report
        ? report.score >= 80
            ? '条款相对完善'
            : report.score >= 60
                ? '存在改进空间'
                : '风险较高'
        : '';

    const scoreGaugeOption = report ? {
        series: [
            {
                type: 'gauge',
                min: 0,
                max: 100,
                splitNumber: 5,
                axisLine: {
                    lineStyle: {
                        width: 12,
                        color: [[0.6, '#ef4444'], [0.8, '#f59e0b'], [1, '#10b981']],
                    },
                },
                progress: { show: true, width: 12 },
                detail: { valueAnimation: true, formatter: '{value}', fontSize: 18, offsetCenter: [0, '65%'] },
                data: [{ value: report.score }],
            },
        ],
    } : null;

    const radarOption = report ? {
        radar: {
            indicator: [
                { name: '总分', max: 100 },
                { name: '高风险控制', max: 100 },
                { name: '中风险控制', max: 100 },
                { name: '低风险控制', max: 100 },
            ],
        },
        series: [{
            type: 'radar',
            data: [{
                value: [
                    report.score,
                    Math.max(0, 100 - report.risks.high * 25),
                    Math.max(0, 100 - report.risks.medium * 15),
                    Math.max(0, 100 - report.risks.low * 8),
                ],
                areaStyle: { color: 'rgba(99,102,241,0.28)' },
                lineStyle: { color: '#4f46e5' },
            }],
        }],
    } : null;

    return (
        <div className="page-shell page-shell--no-tabbar">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageUpload} />
            <div className="page-stack">
                <div className="page-hero page-hero--sky">
                    <div className="page-kicker">合同体检</div>
                    <div className="page-title" style={{ marginTop: 16 }}>AI 合同条款风险审查</div>
                    <div className="page-subtitle" style={{ marginTop: 12, maxWidth: 640 }}>
                        支持上传合同截图或粘贴条款文本，自动识别高风险条款并给出修改建议。
                    </div>
                    <div className="action-row" style={{ marginTop: 18 }}>
                        <Button shape="rounded" color="primary" onClick={() => fileInputRef.current?.click()}>
                            上传合同图片
                        </Button>
                        <Button shape="rounded" fill="outline" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.26)' }} onClick={() => navigate(-1)}>
                            返回上一页
                        </Button>
                    </div>
                </div>

                {!report ? (
                    <>
                        <div className="section-card">
                            <div className="page-section-title">
                                <h3>粘贴合同文本</h3>
                                <span className="inline-pill">支持长文本</span>
                            </div>
                            <TextArea
                                value={input}
                                onChange={setInput}
                                placeholder="请粘贴合同正文、付款条款、工期与质保条款等内容"
                                autoSize={{ minRows: 7, maxRows: 14 }}
                            />
                            <Button block color="primary" shape="rounded" loading={loading} disabled={!input.trim()} onClick={handleTextAnalyze} style={{ marginTop: 14 }}>
                                开始审查
                            </Button>
                        </div>

                        {parsePhase && (
                            <div className="note-card note-card--warning">
                                <div className="note-icon">i</div>
                                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{parsePhase}</div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="page-hero page-hero--rose">
                            <div className="page-kicker">体检评分</div>
                            <div className="page-title" style={{ marginTop: 16 }}>{report.score}</div>
                            <div className="page-subtitle" style={{ marginTop: 10 }}>{scoreLabel} | {report.summary}</div>
                            <div className="stats-grid" style={{ marginTop: 16 }}>
                                <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                                    <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>高风险</div>
                                    <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{report.risks.high}</div>
                                </div>
                                <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                                    <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>中风险</div>
                                    <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{report.risks.medium}</div>
                                </div>
                                <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                                    <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>低风险</div>
                                    <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{report.risks.low}</div>
                                </div>
                            </div>
                        </div>

                        {scoreGaugeOption && radarOption && (
                            <div className="section-card">
                                <div className="page-section-title">
                                    <h3>可视化体检</h3>
                                    <span className="inline-pill">仪表盘 + 雷达图</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                                    <ReactECharts option={scoreGaugeOption} style={{ height: 220 }} />
                                    <ReactECharts option={radarOption} style={{ height: 220 }} />
                                </div>
                            </div>
                        )}

                        {report.payment_terms && (
                            <div className="section-card">
                                <div className="page-section-title">
                                    <h3>付款条款分析</h3>
                                    <span className="inline-pill">重点检查</span>
                                </div>
                                <div className="muted-text" style={{ fontSize: 13 }}>{report.payment_terms.details}</div>
                                <div className={report.payment_terms.is_healthy ? 'note-card note-card--success' : 'note-card note-card--danger'} style={{ marginTop: 12 }}>
                                    <div className="note-icon">i</div>
                                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>{report.payment_terms.analysis}</div>
                                </div>
                            </div>
                        )}

                        {report.recommendations?.length > 0 && (
                            <div className="section-card">
                                <div className="page-section-title">
                                    <h3>修改建议</h3>
                                    <span className="inline-pill">建议优先</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {report.recommendations.map((item, index) => (
                                        <div key={`${item}-${index}`} className="note-card note-card--warning">
                                            <div className="note-icon">i</div>
                                            <div style={{ fontSize: 13, lineHeight: 1.7 }}>{item}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="section-card">
                            <div className="page-section-title">
                                <h3>风险明细</h3>
                                <span className="inline-pill">{report.details.length} 条</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {report.details.map((risk, index) => (
                                    <div key={`${risk.category}-${index}`} className="panel-card" style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                                            <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{risk.category}</div>
                                            <span className={`risk-${risk.risk_level}`}>{risk.risk_level === 'high' ? '高风险' : risk.risk_level === 'medium' ? '中风险' : '低风险'}</span>
                                        </div>
                                        {risk.original_text && (
                                            <div className="feature-desc" style={{ marginBottom: 10 }}>原文：{risk.original_text}</div>
                                        )}
                                        <div className={risk.risk_level === 'high' ? 'note-card note-card--danger' : risk.risk_level === 'medium' ? 'note-card note-card--warning' : 'note-card note-card--success'}>
                                            <div className="note-icon">!</div>
                                            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                                                <div><strong>风险点：</strong>{risk.risk_point}</div>
                                                <div style={{ marginTop: 6 }}><strong>建议：</strong>{risk.suggestion}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="action-row">
                            <Button block fill="outline" shape="rounded" onClick={() => setReport(null)}>
                                重新审查
                            </Button>
                            <Button block color="primary" shape="rounded" onClick={() => navigate('/ai-consult')}>
                                去 AI 咨询
                            </Button>
                        </div>
                    </>
                )}

                <FeedbackWidget type="ai" />
            </div>
        </div>
    );
}
