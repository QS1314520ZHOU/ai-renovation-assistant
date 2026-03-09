
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Toast, TextArea } from 'antd-mobile';
import ReactECharts from 'echarts-for-react';
import { quoteApi } from '@/api/services';
import { useProjectStore } from '@/store';
import { formatMoney } from '@/utils/format';
import { useGlossaryStore } from '@/store/glossaryStore';
import TermItem from '@/components/Glossary/TermItem';
import FeedbackWidget from '@/components/Feedback/FeedbackWidget';

interface QuoteItem {
    name: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
    risks: Array<{ level: 'high' | 'medium' | 'low'; desc: string }>;
}

interface QuoteReport {
    score: number;
    total_amount: number;
    items: QuoteItem[];
    risks: { high: number; medium: number; low: number };
    suggestions: string[];
}

export default function QuoteCheck() {
    const navigate = useNavigate();
    const { currentHouse } = useProjectStore();
    const { init: initGlossary } = useGlossaryStore();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<QuoteReport | null>(null);
    const [parsePhase, setParsePhase] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        initGlossary();
    }, [initGlossary]);

    const handleTextAnalyze = async () => {
        if (!input.trim()) {
            Toast.show({ content: '请先输入报价内容', icon: 'fail' });
            return;
        }

        setLoading(true);
        setReport(null);
        setParsePhase('AI 正在解析报价内容');
        try {
            const result = await quoteApi.checkText(currentHouse?.id || 'default', input);
            setReport(result);
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
        setParsePhase('AI 正在解析报价图片');
        try {
            const result = await quoteApi.upload(currentHouse?.id || 'default', file);
            if (result.error) {
                Toast.show({ content: result.error, icon: 'fail' });
            } else {
                setReport(result);
                Toast.show({ content: '报价识别完成', icon: 'success' });
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
            ? '风险较低'
            : report.score >= 60
                ? '风险可控'
                : '风险偏高'
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
                areaStyle: { color: 'rgba(59,130,246,0.24)' },
                lineStyle: { color: '#2563eb' },
            }],
        }],
    } : null;

    return (
        <div className="page-shell page-shell--no-tabbar">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageUpload} />
            <div className="page-stack">
                <div className="page-hero page-hero--amber">
                    <div className="page-kicker">报价审核</div>
                    <div className="page-title" style={{ marginTop: 16 }}>AI 智能识别报价单风险</div>
                    <div className="page-subtitle" style={{ marginTop: 12, maxWidth: 640 }}>
                        支持粘贴报价文本或上传报价图片，自动拆解项目、识别异常单价并给出优化建议。
                    </div>
                    <div className="action-row" style={{ marginTop: 18 }}>
                        <Button shape="rounded" color="primary" onClick={() => fileInputRef.current?.click()}>
                            上传报价图片
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
                                <h3>粘贴报价文本</h3>
                                <span className="inline-pill">支持按行识别</span>
                            </div>
                            <TextArea
                                value={input}
                                onChange={setInput}
                                placeholder="示例：客厅地砖铺贴 120 平 38 元/平"
                                autoSize={{ minRows: 7, maxRows: 14 }}
                            />
                            <Button block color="primary" shape="rounded" loading={loading} disabled={!input.trim()} onClick={handleTextAnalyze} style={{ marginTop: 14 }}>
                                开始审核
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
                            <div className="page-kicker">审核结果</div>
                            <div className="page-title" style={{ marginTop: 16 }}>{report.score}</div>
                            <div className="page-subtitle" style={{ marginTop: 10 }}>{scoreLabel} | 总金额 {formatMoney(report.total_amount)}</div>
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

                        {report.suggestions.length > 0 && (
                            <div className="section-card">
                                <div className="page-section-title">
                                    <h3>优化建议</h3>
                                    <span className="inline-pill">优先处理</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {report.suggestions.map((item, index) => (
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
                                <h3>明细项目</h3>
                                <span className="inline-pill">{report.items.length} 项</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {report.items.map((item, index) => (
                                    <div key={`${item.name}-${index}`} className="panel-card" style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}><TermItem name={item.name} /></div>
                                                <div className="feature-desc" style={{ marginTop: 6 }}>
                                                    {item.quantity || 0}{item.unit || ''} x {item.unitPrice || 0} 元/{item.unit || '单位'}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: 800, color: 'var(--color-text)', flexShrink: 0, textAlign: 'right' }}>
                                                {formatMoney(item.subtotal || 0)}
                                            </div>
                                        </div>
                                        {item.risks?.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                                                {item.risks.map((risk, riskIndex) => (
                                                    <div key={`${risk.desc}-${riskIndex}`} className={risk.level === 'high' ? 'note-card note-card--danger' : 'note-card note-card--warning'}>
                                                        <div className="note-icon">!</div>
                                                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{risk.desc}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="action-row">
                            <Button block fill="outline" shape="rounded" onClick={() => setReport(null)}>
                                重新审核
                            </Button>
                            <Button block color="primary" shape="rounded" onClick={() => navigate('/ai-consult')}>
                                咨询 AI
                            </Button>
                        </div>
                    </>
                )}

                <FeedbackWidget type="ai" />
            </div>
        </div>
    );
}
