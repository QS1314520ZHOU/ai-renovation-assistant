import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, Toast, TextArea, DotLoading } from 'antd-mobile';
import { CameraOutline } from 'antd-mobile-icons';
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
    details: ContractRiskItem[]; // Will map from data.risks
}

export default function ContractCheck() {
    const navigate = useNavigate();
    const { currentHouse } = useProjectStore();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ContractReport | null>(null);
    const [parsePhase, setParsePhase] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextAnalyze = async () => {
        if (!input.trim()) {
            Toast.show({ content: '请输入或粘贴合同内容', icon: 'fail' });
            return;
        }

        setLoading(true);
        setReport(null);
        setParsePhase('🔍 AI 正在深度解析合同条款...');

        try {
            const res = await contractApi.checkText(currentHouse?.id || 'default', input);
            setReport({
                ...res.data,
                details: res.data.risks_json || res.data.risks.details || res.data.risks || [] // Adjust based on API structure
            });
        } catch (error: any) {
            Toast.show({ content: `解析失败: ${error.message}`, icon: 'fail' });
        } finally {
            setLoading(false);
            setParsePhase('');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setReport(null);
        setParsePhase('📸 正在通过 AI 识别合同照片内容...');

        try {
            const res = await contractApi.upload(currentHouse?.id || 'default', file);
            if (res.error) {
                Toast.show({ content: res.error, icon: 'fail' });
            } else {
                setReport({
                    ...res.data,
                    details: res.data.risks_json || res.data.risks.details || res.data.risks || []
                });
                Toast.show({ content: '识别成功', icon: 'success' });
            }
        } catch (error: any) {
            Toast.show({ content: `识别失败: ${error.message}`, icon: 'fail' });
        } finally {
            setLoading(false);
            setParsePhase('');
        }
    };

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 40 }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                合同避坑审核
            </NavBar>

            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
            />

            {!report ? (
                <div style={{ padding: 16 }}>
                    <div style={{
                        padding: 16, background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                        borderRadius: 16, color: '#fff', marginBottom: 20, boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                    }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>AI 拍照审合同</h2>
                        <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 20 }}>
                            上传装修合同照片，重点筛查付款比例、延期赔付、增项约束等核心条款，帮你把关防坑。
                        </p>
                        <Button
                            block
                            color="default"
                            size="large"
                            shape="rounded"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                background: '#fff', color: '#1D4ED8', border: 'none',
                                fontWeight: 700, height: 48, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                            }}
                        >
                            <CameraOutline style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 8 }} />
                            拍个照识别
                        </Button>
                    </div>

                    <div style={{ padding: '0 4px 12px', fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                        或者粘贴合同内容
                    </div>

                    <TextArea
                        placeholder="在此粘贴合同的核心条款..."
                        value={input}
                        onChange={setInput}
                        autoSize={{ minRows: 8, maxRows: 12 }}
                        style={{
                            background: '#fff', borderRadius: 12, padding: 14,
                            fontSize: 14, lineHeight: 1.6, border: '1px solid var(--color-border)',
                        }}
                    />

                    {loading && (
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <DotLoading color="primary" />
                            <div style={{ fontSize: 13, color: 'var(--color-primary)', marginTop: 8 }}>{parsePhase}</div>
                        </div>
                    )}

                    <Button
                        block color="primary" size="large" shape="rounded"
                        loading={loading} disabled={!input.trim()}
                        onClick={handleTextAnalyze}
                        style={{ marginTop: 16, height: 48, fontWeight: 600 }}
                    >
                        🔍 文本审核
                    </Button>
                </div>
            ) : (
                <div style={{ padding: 12 }}>
                    <div style={{
                        background: report.score >= 80 ? 'linear-gradient(135deg, #059669, #10B981)' :
                            report.score >= 60 ? 'linear-gradient(135deg, #D97706, #F59E0B)' :
                                'linear-gradient(135deg, #DC2626, #EF4444)',
                        borderRadius: 16, padding: 24, color: '#fff', marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>合同安全评分: {report.score >= 80 ? '良好' : report.score >= 60 ? '存在风险' : '风险极高'}</div>
                        <div style={{ fontSize: 56, fontWeight: 700, margin: '8px 0' }}>{report.score}</div>
                        <div style={{ fontSize: 13, opacity: 0.8 }}>
                            AI综合评价: {report.summary}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12 }}>
                            <span>🔴 高风险 {report.risks.high}</span>
                            <span>🟡 中风险 {report.risks.medium}</span>
                            <span>🟢 低风险 {report.risks.low}</span>
                        </div>
                    </div>

                    {report.payment_terms && (
                        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>💰 付款比例分析</h3>
                            <div style={{ color: '#4B5563', fontSize: 13, lineHeight: 1.6 }}> {report.payment_terms.details} </div>
                            <div style={{
                                color: report.payment_terms.is_healthy ? '#059669' : '#DC2626',
                                fontSize: 13, marginTop: 8, fontWeight: 500, background: report.payment_terms.is_healthy ? '#ECFDF5' : '#FEF2F2', padding: '6px 10px', borderRadius: 6
                            }}>
                                {report.payment_terms.analysis}
                            </div>
                        </div>
                    )}

                    <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>具体条款风险点</h3>
                        {Array.isArray(report.details) && report.details.map((risk, idx) => (
                            <div key={idx} style={{
                                padding: '12px', background: '#F9FAFB', borderRadius: 10, marginBottom: 10,
                                border: risk.risk_level === 'high' ? '1px solid #FEE2E2' : '1px solid #F3F4F6'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                                        {risk.category}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginBottom: 8 }}>
                                    原文: "{risk.original_text}"
                                </div>
                                <div style={{
                                    color: risk.risk_level === 'high' ? '#DC2626' : (risk.risk_level === 'medium' ? '#D97706' : '#059669'),
                                    fontSize: 12, background: risk.risk_level === 'high' ? '#FEF2F2' : (risk.risk_level === 'medium' ? '#FFFBEB' : '#ECFDF5'),
                                    padding: '6px 10px', borderRadius: 6, marginTop: 4, lineHeight: 1.4
                                }}>
                                    <strong>风险点：</strong>{risk.risk_point}
                                    <div style={{ marginTop: 4 }}><strong>💡 建议：</strong>{risk.suggestion}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                        <Button block shape="rounded" fill="outline" onClick={() => setReport(null)}>
                            重新上传
                        </Button>
                        <Button block shape="rounded" color="primary" onClick={() => navigate('/consult')}>
                            咨询 AI 助理
                        </Button>
                    </div>
                </div>
            )}
            <FeedbackWidget type="ai" />
        </div>
    );
}
