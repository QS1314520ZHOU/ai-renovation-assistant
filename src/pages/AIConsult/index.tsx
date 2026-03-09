import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DotLoading, Tag, TextArea, Toast } from 'antd-mobile';

import { aiApi, budgetApi } from '@/api/services';
import { useProjectStore } from '@/store';
import { BudgetResult, HouseProfile, TierLevel } from '@/types';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    loading?: boolean;
    error?: boolean;
    fields?: Record<string, any>;
}

const GREETING = [
    '你好，我是你的 AI 装修预算顾问。',
    '',
    '你可以直接告诉我房屋情况，例如：',
    '“我家 108 平新房，成都，三室两厅一卫，准备普通装修，预算 18 万左右。”',
    '',
    '如果信息已经比较完整，我会直接帮你生成预算。',
].join('\n');

const QUICK_PROMPTS = [
    '我家 108 平新房，成都，三室两厅一卫，准备普通装修，预算 18 万左右。',
    '重庆，建筑面积 89 平，三室两厅，想做标准装修，预算控制在 15 万内。',
    '我想先算一个现代简约风的预算，套内 96 平，两卫，预算 20 万。',
];

const FIELD_LABELS: Record<string, string> = {
    city: '城市',
    inner_area: '套内面积',
    building_area: '建筑面积',
    layout_type: '户型',
    tier: '装修档次',
    target_budget: '目标预算',
    floor_preference: '地面偏好',
    bathroom_count: '卫生间',
    kitchen_count: '厨房',
    balcony_count: '阳台',
};

export default function AIConsult() {
    const navigate = useNavigate();
    const { currentHouse, updateCurrentHouse, setBudgetResult } = useProjectStore();

    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: createId(), role: 'assistant', content: GREETING },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>();
    const [collectedFields, setCollectedFields] = useState<Record<string, any>>({});

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, loading]);

    const hasUserMessage = useMemo(
        () => messages.some((message) => message.role === 'user'),
        [messages],
    );

    const sendMessage = async (presetText?: string) => {
        const text = (presetText ?? input).trim();
        if (!text || loading) {
            return;
        }

        setInput('');
        const userMessage: ChatMessage = { id: createId(), role: 'user', content: text };
        const pendingMessage: ChatMessage = { id: createId(), role: 'assistant', content: '', loading: true };
        setMessages((prev) => [...prev, userMessage, pendingMessage]);
        setLoading(true);

        const requestChat = async (activeSessionId?: string) => aiApi.chat({
            session_id: activeSessionId,
            message: text,
            session_type: 'budget',
        });

        try {
            let response;

            try {
                response = await requestChat(sessionId);
            } catch (error: any) {
                const detail = formatErrorMessage(error);
                const shouldRetryWithoutSession = Boolean(sessionId) && /internal server error/i.test(detail);

                if (!shouldRetryWithoutSession) {
                    throw error;
                }

                console.warn('AI consult hit a stale session, retrying without session_id');
                setSessionId(undefined);
                response = await requestChat(undefined);
            }

            if (response.session_id) {
                setSessionId(response.session_id);
            }

            const mergedFields = {
                ...collectedFields,
                ...(response.extracted_fields || {}),
            };

            if (response.extracted_fields) {
                setCollectedFields(mergedFields);
                updateCurrentHouse(mapFieldsToHouse(mergedFields));
            }

            replaceMessage(pendingMessage.id, {
                content: stripJsonBlock(response.reply) || '抱歉，我这次没有拿到有效回复，你可以继续补充信息，我会重新帮你整理预算。',
                loading: false,
                fields: response.extracted_fields || undefined,
            }, setMessages);

            const house = mapFieldsToHouse(mergedFields);
            if (shouldAutoGenerateBudget(text, house, response.is_complete, hasUserMessage)) {
                await handleGenerateBudget(mergedFields);
            }
        } catch (error: any) {
            const detail = formatErrorMessage(error);
            console.error('AI consult failed:', error);

            replaceMessage(pendingMessage.id, {
                loading: false,
                error: true,
                content: [
                    '这次 AI 咨询没有成功。',
                    detail ? `原因：${detail}` : '',
                    '你也可以先去"直接填表算"页面手动生成预算。',
                ].filter(Boolean).join('\n'),
            }, setMessages);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBudget = async (extraFields?: Record<string, any>) => {
        const mergedFields = { ...collectedFields, ...extraFields };
        const house = mapFieldsToHouse(mergedFields);

        updateCurrentHouse(house);

        if (!canGenerateBudget(house)) {
            Toast.show({
                content: '还缺少城市、面积、户型或装修档次，补充后我就能直接给你出预算。',
                icon: 'fail',
            });
            return false;
        }

        try {
            const result = await budgetApi.calculate({
                city_name: house.city,
                inner_area: house.innerArea as number,
                layout_type: house.layout as string,
                tier: house.tierLevel as TierLevel,
                floor_preference: house.floorPreference || 'tile',
                bathroom_count: house.bathroomCount || 1,
                special_needs: buildSpecialNeeds(house),
            });

            const normalizedResult = normalizeBudgetResult(result, house);
            setBudgetResult(normalizedResult);

            Toast.show({ content: '预算已经生成，正在打开结果页。', icon: 'success' });
            navigate('/budget-result');
            return true;
        } catch (error: any) {
            const detail = formatErrorMessage(error);
            Toast.show({ content: `预算生成失败：${detail}`, icon: 'fail' });
            console.error('Budget generation failed:', error);
            return false;
        }
    };

    return (
        <div style={pageStyle}>
            <div style={heroStyle}>
                <div style={heroBadgeStyle}>AI 装修预算顾问</div>
                <div style={heroTitleStyle}>先聊需求，再出预算</div>
                <div style={heroSubtitleStyle}>
                    自动提取城市、面积、户型和档次；信息够了就直接生成预算。
                </div>
                <div style={heroActionRowStyle}>
                    <Button
                        color="primary"
                        fill="solid"
                        shape="rounded"
                        style={heroActionButtonStyle}
                        onClick={() => navigate('/quick-budget')}
                    >
                        直接填表算
                    </Button>
                    <Button
                        fill="outline"
                        shape="rounded"
                        style={heroActionButtonStyle}
                        onClick={() => sendMessage('我想先算一个预算，先帮我整理必填信息。')}
                    >
                        先帮我梳理
                    </Button>
                </div>
            </div>

            {!hasUserMessage && (
                <div style={promptPanelStyle}>
                    <div style={sectionTitleStyle}>一键示例</div>
                    <div style={promptListStyle}>
                        {QUICK_PROMPTS.map((prompt) => (
                            <button key={prompt} style={promptChipStyle} onClick={() => sendMessage(prompt)}>
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div style={chatPanelStyle}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        style={{
                            display: 'flex',
                            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={
                                message.role === 'user'
                                    ? userBubbleStyle
                                    : message.error
                                        ? errorBubbleStyle
                                        : assistantBubbleStyle
                            }
                        >
                            {message.role === 'assistant' && (
                                <div style={message.error ? errorMetaStyle : bubbleMetaStyle}>
                                    {message.error ? '状态提示' : '预算顾问'}
                                </div>
                            )}

                            <div style={bubbleTextStyle}>
                                {message.loading ? <DotLoading color="primary" /> : message.content}
                            </div>

                            {message.fields && getVisibleFields(message.fields).length > 0 && !message.loading && (
                                <div style={fieldCardStyle}>
                                    <div style={fieldTitleStyle}>已识别信息</div>
                                    <div style={fieldTagWrapStyle}>
                                        {getVisibleFields(message.fields).map(([key, value]) => (
                                            <Tag key={key} color="primary" fill="outline" style={{ marginRight: 8, marginBottom: 8 }}>
                                                {FIELD_LABELS[key] || key}：{formatFieldValue(value)}
                                            </Tag>
                                        ))}
                                    </div>
                                    {canGenerateBudget(mapFieldsToHouse(message.fields)) && (
                                        <Button
                                            size="mini"
                                            color="primary"
                                            fill="solid"
                                            shape="rounded"
                                            onClick={async () => {
                                                await handleGenerateBudget(message.fields);
                                            }}
                                        >
                                            直接生成预算
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <div ref={chatEndRef} />
            </div>

            <div style={composerShellStyle}>
                <div style={composerHintStyle}>描述越具体，预算越接近实际落地成本。</div>
                <div style={composerRowStyle}>
                    <div style={composerInputWrapStyle}>
                        <TextArea
                            value={input}
                            onChange={setInput}
                            placeholder="例如：成都，套内 98 平，三室两厅一卫，普通装修，预算 18 万。"
                            autoSize={{ minRows: 2, maxRows: 5 }}
                            style={textAreaStyle as any}
                            onEnterPress={() => {
                                if (!loading) {
                                    sendMessage();
                                }
                            }}
                        />
                    </div>
                    <Button
                        color="primary"
                        shape="rounded"
                        loading={loading}
                        disabled={!input.trim()}
                        onClick={() => sendMessage()}
                        style={sendButtonStyle}
                    >
                        发送
                    </Button>
                </div>
            </div>
        </div>
    );
}

function createId() {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

function replaceMessage(
    messageId: string,
    patch: Partial<ChatMessage>,
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) {
    setMessages((prev) => prev.map((message) => (message.id === messageId ? { ...message, ...patch } : message)));
}

function stripJsonBlock(content: string) {
    return content.replace(/```json[\s\S]*?```/gi, '').trim();
}

function formatErrorMessage(error: any) {
    const raw = typeof error === 'string' ? error : error?.message || error?.detail || '';
    if (!raw) {
        return '未知错误';
    }

    return String(raw)
        .replace(/^Error:\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getVisibleFields(fields: Record<string, any>) {
    return Object.entries(fields).filter(([, value]) => {
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
    });
}

function formatFieldValue(value: any) {
    if (Array.isArray(value)) return value.join('、');
    if (typeof value === 'boolean') return value ? '是' : '否';
    return String(value);
}

function shouldAutoGenerateBudget(
    text: string,
    house: Partial<HouseProfile>,
    isComplete: boolean,
    hasUserMessage: boolean,
) {
    if (!canGenerateBudget(house)) {
        return false;
    }

    if (isComplete) {
        return true;
    }

    if (/(算一下|算一算|先算|生成预算|直接算|出预算)/.test(text)) {
        return true;
    }

    return !hasUserMessage;
}

function canGenerateBudget(house: Partial<HouseProfile>) {
    return Boolean(house.city && house.innerArea && house.layout && house.tierLevel);
}

function normalizeBudgetResult(result: any, house: Partial<HouseProfile>): BudgetResult {
    const schemes = Array.isArray(result?.schemes) ? result.schemes : [];
    const economy = schemes.find((scheme: any) => scheme.tier === 'economy');
    const standard = schemes.find((scheme: any) => scheme.tier === 'standard');
    const premium = schemes.find((scheme: any) => scheme.tier === 'premium');
    const selectedScheme = schemes.find((scheme: any) => scheme.tier === house.tierLevel) || standard || schemes[0];

    const targetBudget = Number(house.targetBudget || 0);
    const actualTotal = Number(selectedScheme?.total_amount || 0);
    const overBudget = targetBudget > 0 && actualTotal > targetBudget;

    return {
        ...result,
        schemes,
        economy,
        standard,
        premium,
        missingItems: result?.missing_items || [],
        optimizations: [],
        overBudget,
        overBudgetAmount: overBudget ? actualTotal - targetBudget : 0,
    } as BudgetResult;
}

function mapFieldsToHouse(fields: Record<string, any>): Partial<HouseProfile> {
    const house: Partial<HouseProfile> = {};

    const city = pickField(fields, 'city');
    const layout = pickField(fields, 'layout', 'layout_type');
    const buildingArea = toNumber(pickField(fields, 'buildingArea', 'building_area'));
    const innerArea = toNumber(pickField(fields, 'innerArea', 'inner_area'))
        || (buildingArea ? buildingArea * 0.82 : undefined);
    const grossArea = toNumber(pickField(fields, 'grossArea', 'gross_area'))
        || buildingArea
        || (innerArea ? Math.round(innerArea * 1.22) : undefined);
    const tier = normalizeTierValue(pickField(fields, 'tierLevel', 'tier_level', 'tier'));
    const targetBudget = parseBudgetValue(pickField(fields, 'targetBudget', 'target_budget'));
    const floorPreference = normalizeFloorPreference(pickField(fields, 'floorPreference', 'floor_preference'));

    if (city) house.city = String(city).trim();
    if (layout) house.layout = String(layout).trim();
    if (innerArea) house.innerArea = Math.round(innerArea);
    if (grossArea) house.grossArea = Math.round(grossArea);
    if (tier) house.tierLevel = tier;
    if (targetBudget) house.targetBudget = targetBudget;
    if (floorPreference) house.floorPreference = floorPreference;

    const counts = extractCountsFromLayout(String(layout || ''));
    const bathroomCount = toNumber(pickField(fields, 'bathroomCount', 'bathroom_count')) || counts.bathroomCount || 1;
    const kitchenCount = toNumber(pickField(fields, 'kitchenCount', 'kitchen_count')) || 1;
    const balconyCount = toNumber(pickField(fields, 'balconyCount', 'balcony_count')) || counts.balconyCount || 0;

    house.bathroomCount = bathroomCount;
    house.kitchenCount = kitchenCount;
    house.balconyCount = balconyCount;

    const hasCeiling = toBoolean(pickField(fields, 'hasCeiling', 'has_ceiling'));
    const hasCustomCabinet = toBoolean(pickField(fields, 'hasCustomCabinet', 'has_custom_cabinet'));
    const includeFurniture = toBoolean(pickField(fields, 'includeFurniture', 'include_furniture'));

    if (hasCeiling !== undefined) house.hasCeiling = hasCeiling;
    if (hasCustomCabinet !== undefined) house.hasCustomCabinet = hasCustomCabinet;
    if (includeFurniture !== undefined) house.includeFurniture = includeFurniture;

    return house;
}

function buildSpecialNeeds(house: Partial<HouseProfile>) {
    const needs: string[] = [];
    if (house.hasCeiling) needs.push('吊顶');
    if (house.hasCustomCabinet) needs.push('定制柜');
    if (house.includeFurniture) needs.push('含家具家电');
    return needs;
}

function pickField(fields: Record<string, any>, ...keys: string[]) {
    for (const key of keys) {
        if (fields[key] !== undefined && fields[key] !== null) {
            return fields[key];
        }
    }
    return undefined;
}

function toNumber(value: any) {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/,/g, '').match(/\d+(\.\d+)?/);
    return cleaned ? Number(cleaned[0]) : undefined;
}

function parseBudgetValue(value: any) {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') return value;

    const text = String(value).replace(/,/g, '').trim();
    const num = Number(text.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(num)) return undefined;
    return text.includes('万') ? Math.round(num * 10000) : Math.round(num);
}

function toBoolean(value: any) {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;

    const text = String(value).trim().toLowerCase();
    if (['true', '1', 'yes', 'y', '是', '有'].includes(text)) return true;
    if (['false', '0', 'no', 'n', '否', '无'].includes(text)) return false;
    return undefined;
}

function normalizeTierValue(value: any): TierLevel | undefined {
    if (!value) return undefined;
    const text = String(value).trim().toLowerCase();

    if (text.includes('economy') || text.includes('经济')) return 'economy';
    if (text.includes('premium') || text.includes('品质') || text.includes('高端') || text.includes('改善') || text.includes('轻奢')) return 'premium';
    if (text.includes('standard') || text.includes('标准') || text.includes('普通')) return 'standard';
    return undefined;
}

function normalizeFloorPreference(value: any): HouseProfile['floorPreference'] | undefined {
    if (!value) return undefined;
    const text = String(value).trim().toLowerCase();
    if (text.includes('wood') || text.includes('木')) return 'wood';
    if (text.includes('mixed') || text.includes('混')) return 'mixed';
    if (text.includes('tile') || text.includes('砖') || text.includes('瓷')) return 'tile';
    return undefined;
}

function extractCountsFromLayout(layout: string) {
    const normalized = layout
        .replace(/一/g, '1')
        .replace(/二|两/g, '2')
        .replace(/三/g, '3')
        .replace(/四/g, '4')
        .replace(/五/g, '5');

    return {
        bathroomCount: extractCount(normalized, '卫'),
        balconyCount: extractCount(normalized, '阳台'),
    };
}

function extractCount(text: string, label: string) {
    const match = text.match(new RegExp(`(\\d+)${label}`));
    return match ? Number(match[1]) : undefined;
}

function isUuidLike(value?: string | null) {
    return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #EEF2FF 0%, #F8FAFC 28%, #F8FAFC 100%)',
    padding: '16px 16px calc(208px + env(safe-area-inset-bottom, 0px))',
};

const heroStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #0F172A 0%, #312E81 58%, #4F46E5 100%)',
    color: '#fff',
    borderRadius: 24,
    padding: '22px 18px',
    boxShadow: '0 24px 60px rgba(79, 70, 229, 0.24)',
    marginBottom: 16,
};

const heroBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.14)',
    fontSize: 12,
    marginBottom: 12,
};

const heroTitleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 8,
    letterSpacing: 0.3,
};

const heroSubtitleStyle: React.CSSProperties = {
    fontSize: 13,
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.82)',
};

const heroActionRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
};

const heroActionButtonStyle: React.CSSProperties = {
    flex: '1 1 150px',
};

const promptPanelStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(16px)',
    borderRadius: 22,
    padding: 16,
    boxShadow: '0 16px 42px rgba(15, 23, 42, 0.08)',
    marginBottom: 16,
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#0F172A',
    marginBottom: 12,
};

const promptListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};

const promptChipStyle: React.CSSProperties = {
    border: '1px solid rgba(99, 102, 241, 0.12)',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    color: '#1E293B',
    borderRadius: 16,
    padding: '12px 14px',
    textAlign: 'left',
    wordBreak: 'break-word',
    lineHeight: 1.6,
    cursor: 'pointer',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
};

const chatPanelStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.68)',
    backdropFilter: 'blur(18px)',
    borderRadius: 26,
    padding: '18px 14px',
    boxShadow: '0 20px 48px rgba(15, 23, 42, 0.08)',
};

const assistantBubbleStyle: React.CSSProperties = {
    width: 'min(90%, 720px)',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    border: '1px solid rgba(226, 232, 240, 0.9)',
    borderRadius: '22px 22px 22px 8px',
    padding: '14px 16px',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.07)',
};

const userBubbleStyle: React.CSSProperties = {
    width: 'min(88%, 680px)',
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    color: '#fff',
    borderRadius: '22px 22px 8px 22px',
    padding: '14px 16px',
    boxShadow: '0 16px 36px rgba(99, 102, 241, 0.24)',
};

const errorBubbleStyle: React.CSSProperties = {
    width: 'min(92%, 760px)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,244,246,0.96) 42%, rgba(255,237,240,0.98) 100%)',
    border: '1px solid rgba(251, 113, 133, 0.26)',
    borderLeft: '4px solid rgba(244, 63, 94, 0.88)',
    borderRadius: '24px 24px 24px 10px',
    padding: '16px 18px',
    boxShadow: '0 18px 42px rgba(244, 63, 94, 0.12)',
};

const bubbleMetaStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#6366F1',
    marginBottom: 8,
    letterSpacing: 0.6,
};

const errorMetaStyle: React.CSSProperties = {
    ...bubbleMetaStyle,
    color: '#E11D48',
};

const bubbleTextStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    lineHeight: 1.75,
    fontSize: 14,
    color: 'inherit',
};

const fieldCardStyle: React.CSSProperties = {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    background: 'rgba(99, 102, 241, 0.05)',
};

const fieldTitleStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#334155',
    marginBottom: 10,
};

const fieldTagWrapStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: 4,
};

const composerShellStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 'calc(86px + env(safe-area-inset-bottom, 0px))',
    padding: '12px 16px 12px',
    background: 'linear-gradient(180deg, rgba(248,250,252,0) 0%, rgba(248,250,252,0.92) 18%, #F8FAFC 100%)',
};

const composerHintStyle: React.CSSProperties = {
    maxWidth: 960,
    margin: '0 auto 8px',
    fontSize: 12,
    color: '#64748B',
};

const composerRowStyle: React.CSSProperties = {
    maxWidth: 960,
    margin: '0 auto',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
    minWidth: 0,
    padding: 10,
    borderRadius: 24,
    background: 'rgba(255,255,255,0.84)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.10)',
};

const composerInputWrapStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
};

const textAreaStyle: React.CSSProperties = {
    '--font-size': '15px',
    background: '#F8FAFC',
    borderRadius: 18,
    width: '100%',
    padding: '10px 14px',
    lineHeight: 1.7,
} as React.CSSProperties;

const sendButtonStyle: React.CSSProperties = {
    flexShrink: 0,
    minWidth: 68,
    height: 44,
    padding: '0 14px',
    fontWeight: 600,
};
