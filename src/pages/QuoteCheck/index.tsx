import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, Toast, TextArea, DotLoading, Tag, ProgressBar, ImageUploader, ImageUploadItem } from 'antd-mobile';
import { CameraOutline } from 'antd-mobile-icons';
import { quoteApi } from '@/api/services';
import { useProjectStore } from '@/store';
import { formatMoney } from '@/utils/format';
import FeedbackWidget from '@/components/Feedback/FeedbackWidget';

interface QuoteItem {
    name: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
    risks: any[];
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
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<QuoteReport | null>(null);
    const [parsePhase, setParsePhase] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextAnalyze = async () => {
        if (!input.trim()) {
            Toast.show({ content: '请输入或粘贴报价单内容', icon: 'fail' });
            return;
        }

        setLoading(true);
        setReport(null);
        setParsePhase('🔍 AI 正在深度解析报价内容...');

        try {
            const res = await quoteApi.checkText(currentHouse?.id || 'default', input);
            setReport(res);
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
        setParsePhase('📸 正在通过 AI 识别照片内容...');

        try {
            const res = await quoteApi.upload(currentHouse?.id || 'default', file);
            if (res.error) {
                Toast.show({ content: res.error, icon: 'fail' });
            } else {
                setReport(res);
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
                报价单体检
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
                        padding: 16, background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        borderRadius: 16, color: '#fff', marginBottom: 20, boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)',
                    }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>AI 拍照审报价</h2>
                        <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 20 }}>
                            上传装修公司给的纸质报价单照片，AI 自动解析每一项，找出高价坑、低价漏，帮你省下数万元。
                        </p>
                        <Button
                            block
                            color="default"
                            size="large"
                            shape="rounded"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                background: '#fff', color: '#4F46E5', border: 'none',
                                fontWeight: 700, height: 48, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
                            }}
                        >
                            <CameraOutline style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 8 }} />
                            拍个照识别
                        </Button>
                    </div>

                    <div style={{ padding: '0 4px 12px', fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                        或者粘贴报价内容
                    </div>

                    <TextArea
                        placeholder="在此粘贴报价单内容，或装修公司的聊天记录"
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
                        🔍 文本体检
                    </Button>
                </div>
            ) : (
                <div style={{ padding: 12 }}>
                    <div style={{
                        background: report.score >= 70 ? 'linear-gradient(135deg, #059669, #10B981)' :
                            report.score >= 40 ? 'linear-gradient(135deg, #D97706, #F59E0B)' :
                                'linear-gradient(135deg, #DC2626, #EF4444)',
                        borderRadius: 16, padding: 24, color: '#fff', marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>体检评分: {report.score >= 80 ? '良好' : report.score >= 60 ? '一般' : '风险较高'}</div>
                        <div style={{ fontSize: 56, fontWeight: 700, margin: '8px 0' }}>{report.score}</div>
                        <div style={{ fontSize: 13, opacity: 0.8 }}>
                            分析了{report.items.length}个项目 · 总金额约{formatMoney(report.total_amount)}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12 }}>
                            <span>🔴 高风险 {report.risks.high}</span>
                            <span>🟡 中风险 {report.risks.medium}</span>
                            <span>🟢 低风险 {report.risks.low}</span>
                        </div>
                    </div>

                    {report.suggestions.length > 0 && (
                        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>专家建议</h3>
                            {report.suggestions.map((s, i) => (
                                <div key={i} style={{ color: '#4B5563', fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>• {s}</div>
                            ))}
                        </div>
                    )}

                    <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>分析详情</h3>
                        {report.items.map((item, idx) => (
                            <div key={idx} style={{
                                padding: '12px', background: '#F9FAFB', borderRadius: 10, marginBottom: 10,
                                border: item.risks.length > 0 ? '1px solid #FEE2E2' : '1px solid #F3F4F6'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                                    <span style={{ fontWeight: 600 }}>{formatMoney(item.subtotal || 0)}</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginBottom: 8 }}>
                                    {item.quantity}{item.unit} × {item.unitPrice}元/{item.unit}
                                </div>
                                {item.risks.map((risk, ridx) => (
                                    <div key={ridx} style={{
                                        color: risk.level === 'high' ? '#DC2626' : '#D97706',
                                        fontSize: 12, background: risk.level === 'high' ? '#FEF2F2' : '#FFFBEB',
                                        padding: '4px 8px', borderRadius: 4, marginTop: 4
                                    }}>
                                        ⚠️ {risk.desc}
                                    </div>
                                ))}
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
