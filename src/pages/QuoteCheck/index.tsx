
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Toast, TextArea, Tag } from 'antd-mobile';
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
            Toast.show({ content: '????????????', icon: 'fail' });
            return;
        }

        setLoading(true);
        setReport(null);
        setParsePhase('AI ?????????');
        try {
            const result = await quoteApi.checkText(currentHouse?.id || 'default', input);
            setReport(result);
        } catch (error: any) {
            Toast.show({ content: `?????${error.message}`, icon: 'fail' });
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
        setParsePhase('AI ?????????');
        try {
            const result = await quoteApi.upload(currentHouse?.id || 'default', file);
            if (result.error) {
                Toast.show({ content: result.error, icon: 'fail' });
            } else {
                setReport(result);
                Toast.show({ content: '??????', icon: 'success' });
            }
        } catch (error: any) {
            Toast.show({ content: `?????${error.message}`, icon: 'fail' });
        } finally {
            setLoading(false);
            setParsePhase('');
            event.target.value = '';
        }
    };

    const scoreLabel = report
        ? report.score >= 80
            ? '????'
            : report.score >= 60
                ? '????'
                : '????'
        : '';

    return (
        <div className="page-shell page-shell--no-tabbar">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageUpload} />
            <div className="page-stack">
                <div className="page-hero page-hero--amber">
                    <div className="page-kicker">?????</div>
                    <div className="page-title" style={{ marginTop: 16 }}>AI ??????????????</div>
                    <div className="page-subtitle" style={{ marginTop: 12, maxWidth: 640 }}>
                        ??????????????????????????????????????????
                    </div>
                    <div className="action-row" style={{ marginTop: 18 }}>
                        <Button shape="rounded" color="primary" onClick={() => fileInputRef.current?.click()}>
                            ???????
                        </Button>
                        <Button shape="rounded" fill="outline" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.26)' }} onClick={() => navigate(-1)}>
                            ?????
                        </Button>
                    </div>
                </div>

                {!report ? (
                    <>
                        <div className="section-card">
                            <div className="page-section-title">
                                <h3>????</h3>
                                <span className="inline-pill">???????</span>
                            </div>
                            <TextArea
                                value={input}
                                onChange={setInput}
                                placeholder="????????????????????? 120? ? 38 ?/???"
                                autoSize={{ minRows: 7, maxRows: 14 }}
                            />
                            <Button block color="primary" shape="rounded" loading={loading} disabled={!input.trim()} onClick={handleTextAnalyze} style={{ marginTop: 14 }}>
                                ????
                            </Button>
                        </div>

                        {parsePhase && (
                            <div className="note-card note-card--warning">
                                <div className="note-icon">?</div>
                                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{parsePhase}</div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="page-hero page-hero--rose">
                            <div className="page-kicker">????</div>
                            <div className="page-title" style={{ marginTop: 16 }}>{report.score}</div>
                            <div className="page-subtitle" style={{ marginTop: 10 }}>{scoreLabel} ? ???? {formatMoney(report.total_amount)}</div>
                            <div className="stats-grid" style={{ marginTop: 16 }}>
                                <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                                    <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>???</div>
                                    <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{report.risks.high}</div>
                                </div>
                                <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                                    <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>???</div>
                                    <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{report.risks.medium}</div>
                                </div>
                                <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                                    <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>???</div>
                                    <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{report.risks.low}</div>
                                </div>
                            </div>
                        </div>

                        {report.suggestions.length > 0 && (
                            <div className="section-card">
                                <div className="page-section-title">
                                    <h3>????</h3>
                                    <span className="inline-pill">????</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {report.suggestions.map((item, index) => (
                                        <div key={`${item}-${index}`} className="note-card note-card--warning">
                                            <div className="note-icon">?</div>
                                            <div style={{ fontSize: 13, lineHeight: 1.7 }}>{item}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="section-card">
                            <div className="page-section-title">
                                <h3>????</h3>
                                <span className="inline-pill">{report.items.length} ?</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {report.items.map((item, index) => (
                                    <div key={`${item.name}-${index}`} className="panel-card" style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}><TermItem name={item.name} /></div>
                                                <div className="feature-desc" style={{ marginTop: 6 }}>
                                                    {item.quantity || 0}{item.unit || ''} ? {item.unitPrice || 0} ?/{item.unit || ''}
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
                                ????
                            </Button>
                            <Button block color="primary" shape="rounded" onClick={() => navigate('/ai-consult')}>
                                ??? AI
                            </Button>
                        </div>
                    </>
                )}

                <FeedbackWidget type="ai" />
            </div>
        </div>
    );
}
