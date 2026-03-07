import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, Toast, TextArea, DotLoading, Tag, ProgressBar } from 'antd-mobile';
import { chatCompletion, parseAIResponse } from '@/api/ai';
import { matchStandardItem, STANDARD_ITEMS } from '@/engine/standardItems';
import { formatMoney } from '@/utils/format';
import FeedbackWidget from '@/components/Feedback/FeedbackWidget';
import { v4 as uuid } from 'uuid';

interface QuoteItem {
    id: string;
    rawName: string;
    standardName: string | null;
    standardItemId: string | null;
    matchConfidence: number;
    quantity: number | null;
    unit: string;
    unitPrice: number | null;
    subtotal: number | null;
    risks: QuoteRisk[];
}

interface QuoteRisk {
    type: 'missing' | 'vague' | 'price_low' | 'price_high' | 'quantity_abnormal' | 'trick';
    level: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
}

interface QuoteReport {
    score: number;
    totalItems: number;
    totalAmount: number;
    items: QuoteItem[];
    missingItems: string[];
    risks: { high: number; medium: number; low: number };
    suggestions: string[];
}

const QUOTE_PARSE_PROMPT = `你是一个装修报价单分析专家。请将以下报价单内容解析为结构化JSON格式。

要求：
1. 提取每一个报价项目，包括：项目名称、数量、单位、单价、小计
2. 如果某些字段无法识别，设为null
3. 尽可能还原表格结构

输出格式：
\`\`\`json
{
  "items": [
    {
      "name": "项目名称",
      "quantity": 数量或null,
      "unit": "单位",
      "unitPrice": 单价或null,
      "subtotal": 小计或null
    }
  ],
  "totalAmount": 合计金额或null,
  "notes": "补充说明"
}
\`\`\`

以下是报价单内容：
`;

export default function QuoteCheck() {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<QuoteReport | null>(null);
    const [parsePhase, setParsePhase] = useState<string>('');

    const handleAnalyze = async () => {
        if (!input.trim()) {
            Toast.show({ content: '请输入或粘贴报价单内容', icon: 'fail' });
            return;
        }

        setLoading(true);
        setReport(null);

        try {
            // 阶段1：AI解析报价单
            setParsePhase('🔍 正在解析报价单内容...');
            const parseResult = await chatCompletion({
                messages: [
                    { role: 'system', content: QUOTE_PARSE_PROMPT },
                    { role: 'user', content: input },
                ],
                temperature: 0.3,
                maxTokens: 3000,
            });

            const { json } = parseAIResponse(parseResult);
            if (!json?.items || !Array.isArray(json.items)) {
                Toast.show({ content: '解析失败，请检查输入内容', icon: 'fail' });
                setLoading(false);
                return;
            }

            // 阶段2：标准化映射
            setParsePhase('📋 正在进行标准项匹配...');
            const quoteItems: QuoteItem[] = json.items.map((raw: any) => {
                const match = matchStandardItem(raw.name || '');
                const risks: QuoteRisk[] = [];

                // 检查价格异常
                if (match && raw.unitPrice) {
                    const priceRange = match.item.commonPriceRange;
                    if (raw.unitPrice < priceRange.min * 0.6) {
                        risks.push({
                            type: 'price_low', level: 'high',
                            description: `单价${raw.unitPrice}元明显低于市场参考价${priceRange.min}-${priceRange.max}元，可能是低价引流后续增项`,
                            suggestion: '询问该价格包含的具体内容和材料品牌，确认是否有后续加价项',
                        });
                    }
                    if (raw.unitPrice > priceRange.max * 1.5) {
                        risks.push({
                            type: 'price_high', level: 'medium',
                            description: `单价${raw.unitPrice}元高于常见市场价${priceRange.min}-${priceRange.max}元`,
                            suggestion: '确认高出部分对应的品牌、工艺或材料升级，判断是否合理',
                        });
                    }
                }

                // 检查模糊项
                if (match && match.item.commonTricks.length > 0 && match.confidence > 0.7) {
                    risks.push({
                        type: 'trick', level: 'medium',
                        description: `该项目常见的增项陷阱：${match.item.commonTricks[0]}`,
                        suggestion: `建议追问：${match.item.commonTricks.slice(0, 2).join('；')}`,
                    });
                }

                // 低匹配度
                if (match && match.confidence < 0.7) {
                    risks.push({
                        type: 'vague', level: 'low',
                        description: `项目名称"${raw.name}"表述不够标准，不确定对应哪个标准项`,
                        suggestion: '要求装修公司明确该项具体施工内容、材料品牌和工艺标准',
                    });
                }

                return {
                    id: uuid(),
                    rawName: raw.name || '未知项目',
                    standardName: match?.item.standardName || null,
                    standardItemId: match?.item.id || null,
                    matchConfidence: match?.confidence || 0,
                    quantity: raw.quantity,
                    unit: raw.unit || '',
                    unitPrice: raw.unitPrice,
                    subtotal: raw.subtotal || (raw.quantity && raw.unitPrice ? raw.quantity * raw.unitPrice : null),
                    risks,
                };
            });

            // 阶段3：漏项检测
            setParsePhase('⚠️ 正在检查缺失项目...');
            const foundItemIds = new Set(quoteItems.map(q => q.standardItemId).filter(Boolean));
            const essentialItems = STANDARD_ITEMS.filter(s => s.isHighFrequency && s.isCommonMissingRelated);
            const missingItems = essentialItems
                .filter(s => !foundItemIds.has(s.id))
                .map(s => s.standardName);

            // 阶段4：生成报告
            setParsePhase('📊 正在生成体检报告...');
            const allRisks = quoteItems.flatMap(q => q.risks);
            const riskCount = {
                high: allRisks.filter(r => r.level === 'high').length,
                medium: allRisks.filter(r => r.level === 'medium').length,
                low: allRisks.filter(r => r.level === 'low').length,
            };

            // 评分逻辑：基础80分，高风险-10、中风险-5、低风险-2、漏项-3
            let score = 80;
            score -= riskCount.high * 10;
            score -= riskCount.medium * 5;
            score -= riskCount.low * 2;
            score -= missingItems.length * 3;
            score = Math.max(0, Math.min(100, score));

            const totalAmount = json.totalAmount || quoteItems.reduce((s, q) => s + (q.subtotal || 0), 0);

            // 生成建议
            const suggestions: string[] = [];
            if (riskCount.high > 0) suggestions.push('有高风险项需要重点关注，建议和装修公司逐项确认');
            if (missingItems.length > 0) suggestions.push(`可能缺少${missingItems.length}项常见项目，建议确认是否需要后续增项`);
            if (quoteItems.some(q => !q.unitPrice)) suggestions.push('部分项目缺少单价信息，建议要求装修公司补全');
            if (quoteItems.some(q => q.risks.some(r => r.type === 'price_low'))) {
                suggestions.push('存在疑似低价引流项，务必确认该价格包含的具体内容');
            }

            setReport({
                score,
                totalItems: quoteItems.length,
                totalAmount,
                items: quoteItems,
                missingItems,
                risks: riskCount,
                suggestions,
            });

        } catch (error: any) {
            Toast.show({ content: `分析失败: ${error.message}`, icon: 'fail' });
        } finally {
            setLoading(false);
            setParsePhase('');
        }
    };

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                报价单体检
            </NavBar>

            {!report ? (
                // ===== 输入阶段 =====
                <div style={{ padding: 16 }}>
                    <div style={{
                        padding: 14, background: '#EEF2FF', borderRadius: 10,
                        fontSize: 13, color: '#4338CA', lineHeight: 1.5, marginBottom: 16,
                    }}>
                        💡 将装修公司的报价单内容粘贴到下方，AI会帮你逐项分析价格是否合理、是否有漏项、是否存在增项风险。
                    </div>

                    <TextArea
                        placeholder={`请粘贴报价单内容，格式示例：

1. 水电改造  套内面积89㎡  120元/㎡  10680元
2. 防水  卫生间+厨房约15㎡  80元/㎡  1200元
3. 铺地砖  客餐厅+厨卫约55㎡  65元/㎡  3575元
4. 墙面基层处理  约210㎡  28元/㎡  5880元
5. 乳胶漆  约210㎡  18元/㎡  3780元
...

也可以直接粘贴微信聊天记录、Excel内容等`}
                        value={input}
                        onChange={setInput}
                        autoSize={{ minRows: 10, maxRows: 20 }}
                        style={{
                            background: '#fff',
                            borderRadius: 12,
                            padding: 14,
                            fontSize: 14,
                            lineHeight: 1.6,
                            border: '1px solid var(--color-border)',
                        }}
                    />

                    {loading && (
                        <div style={{
                            marginTop: 16, padding: 16, background: '#fff', borderRadius: 12,
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <DotLoading color="primary" />
                            <span style={{ fontSize: 14, color: 'var(--color-primary)' }}>{parsePhase}</span>
                        </div>
                    )}

                    <Button
                        block color="primary" size="large" shape="rounded"
                        loading={loading} disabled={!input.trim()}
                        onClick={handleAnalyze}
                        style={{ marginTop: 16, height: 48, fontWeight: 600, fontSize: 16 }}
                    >
                        🔍 开始体检
                    </Button>
                </div>
            ) : (
                // ===== 报告阶段 =====
                <div style={{ padding: 12 }}>
                    {/* 评分卡片 */}
                    <div style={{
                        background: report.score >= 70 ? 'linear-gradient(135deg, #059669, #10B981)' :
                            report.score >= 40 ? 'linear-gradient(135deg, #D97706, #F59E0B)' :
                                'linear-gradient(135deg, #DC2626, #EF4444)',
                        borderRadius: 16, padding: 24, color: '#fff', marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>报价单体检评分</div>
                        <div style={{ fontSize: 56, fontWeight: 700, margin: '8px 0' }}>{report.score}</div>
                        <div style={{ fontSize: 13, opacity: 0.8 }}>
                            共{report.totalItems}个项目 · 合计约{formatMoney(report.totalAmount)}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                            <span>🔴 高风险 {report.risks.high}</span>
                            <span>🟡 中风险 {report.risks.medium}</span>
                            <span>🟢 低风险 {report.risks.low}</span>
                        </div>
                    </div>

                    {/* 建议 */}
                    {report.suggestions.length > 0 && (
                        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>📋 总体建议</h3>
                            {report.suggestions.map((s, i) => (
                                <div key={i} style={{
                                    padding: '8px 12px', background: '#F9FAFB', borderRadius: 8,
                                    marginBottom: 6, fontSize: 13, lineHeight: 1.5,
                                }}>
                                    {i + 1}. {s}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 缺失项目 */}
                    {report.missingItems.length > 0 && (
                        <div style={{ background: '#FEF2F2', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#DC2626', marginBottom: 10 }}>
                                ⚠️ 可能缺失的项目（{report.missingItems.length}项）
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {report.missingItems.map(name => (
                                    <Tag key={name} color="danger" fill="outline" style={{ fontSize: 12 }}>
                                        {name}
                                    </Tag>
                                ))}
                            </div>
                            <div style={{ fontSize: 12, color: '#991B1B', marginTop: 8, lineHeight: 1.5 }}>
                                以上项目在报价单中未发现，可能后续会作为增项收费。建议提前和装修公司确认是否包含。
                            </div>
                        </div>
                    )}

                    {/* 逐项分析 */}
                    <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🔍 逐项分析</h3>
                        {report.items.map(item => (
                            <div key={item.id} style={{
                                padding: '12px',
                                background: item.risks.some(r => r.level === 'high') ? '#FEF2F2' :
                                    item.risks.some(r => r.level === 'medium') ? '#FFFBEB' : '#F9FAFB',
                                borderRadius: 10, marginBottom: 10,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <div>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{item.rawName}</span>
                                        {item.standardName && item.standardName !== item.rawName && (
                                            <span style={{ fontSize: 11, color: 'var(--color-primary)', marginLeft: 6 }}>
                                                → {item.standardName}
                                            </span>
                                        )}
                                    </div>
                                    {item.subtotal && (
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{formatMoney(item.subtotal)}</span>
                                    )}
                                </div>

                                {/* 数量单价 */}
                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                                    {item.quantity && `${item.quantity}${item.unit}`}
                                    {item.unitPrice && ` × ${item.unitPrice}元/${item.unit}`}
                                    {item.matchConfidence > 0 && (
                                        <span style={{ marginLeft: 8 }}>
                                            匹配度：
                                            <span style={{
                                                color: item.matchConfidence > 0.8 ? '#059669' :
                                                    item.matchConfidence > 0.5 ? '#D97706' : '#DC2626'
                                            }}>
                                                {Math.round(item.matchConfidence * 100)}%
                                            </span>
                                        </span>
                                    )}
                                </div>

                                {/* 风险 */}
                                {item.risks.map((risk, idx) => (
                                    <div key={idx} style={{
                                        padding: '8px 10px',
                                        background: risk.level === 'high' ? '#FEE2E2' : risk.level === 'medium' ? '#FEF3C7' : '#F3F4F6',
                                        borderRadius: 6, marginTop: 6, fontSize: 12, lineHeight: 1.5,
                                    }}>
                                        <div style={{
                                            color: risk.level === 'high' ? '#DC2626' : risk.level === 'medium' ? '#D97706' : '#6B7280',
                                            fontWeight: 500,
                                        }}>
                                            {risk.level === 'high' ? '🔴' : risk.level === 'medium' ? '🟡' : '🟢'} {risk.description}
                                        </div>
                                        <div style={{ color: '#4B5563', marginTop: 4 }}>
                                            💬 {risk.suggestion}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* 反馈 */}
                    <FeedbackWidget type="ai" />

                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
                        <Button block fill="outline" color="primary" shape="rounded"
                            onClick={() => { setReport(null); setInput(''); }}>
                            重新体检
                        </Button>
                        <Button block color="primary" shape="rounded"
                            onClick={() => Toast.show({ content: '报告已保存', icon: 'success' })}>
                            保存报告
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
