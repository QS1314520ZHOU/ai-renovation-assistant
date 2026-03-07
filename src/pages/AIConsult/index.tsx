import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextArea, Toast, DotLoading } from 'antd-mobile';
import { useProjectStore } from '@/store';
import { aiApi, budgetApi } from '@/api/services';
import { HouseProfile, TierLevel, BudgetResult } from '@/types';
import { v4 as uuid } from 'uuid';

interface ChatMsg {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    fields?: Record<string, any>;
    loading?: boolean;
}

const GREETING = `你好！我是你的 AI 装修预算顾问 🏠

告诉我你家的情况，比如：
"我家 108 平新房，成都，三室两厅一卫，准备普通装修，预算 18 万左右"

说得越详细，预算越准确！你也可以直接说 "帮我算一下"，我会用目前信息先出个结果。`;

export default function AIConsult() {
    const navigate = useNavigate();
    const { currentHouse, updateCurrentHouse, setBudgetResult } = useProjectStore();
    const [messages, setMessages] = useState<ChatMsg[]>([
        { id: 'greeting', role: 'assistant', content: GREETING },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [collectedFields, setCollectedFields] = useState<Record<string, any>>({});
    const [sessionId, setSessionId] = useState<string | undefined>();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const askCountRef = useRef(0);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        const userMsg: ChatMsg = { id: uuid(), role: 'user', content: text };
        const loadingMsg: ChatMsg = { id: uuid(), role: 'assistant', content: '', loading: true };
        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setLoading(true);

        try {
            const res = await aiApi.chat({
                session_id: sessionId,
                project_id: currentHouse?.id || undefined,
                message: text,
                session_type: 'consult'
            });

            if (res.session_id && !sessionId) {
                setSessionId(res.session_id);
            }

            askCountRef.current += 1;

            // 提取字段 (后端返回 extracted_fields)
            if (res.extracted_fields) {
                const newFields = { ...collectedFields, ...res.extracted_fields };
                setCollectedFields(newFields);
                updateCurrentHouse(mapFieldsToHouse(newFields));
            }

            // 更新消息
            setMessages(prev => prev.map(m =>
                m.id === loadingMsg.id
                    ? { ...m, content: res.reply, loading: false, fields: res.extracted_fields || undefined }
                    : m
            ));

            // 检查是否可以生成预算
            if (res.is_complete || askCountRef.current >= 8 || text.includes('先算') || text.includes('算一下')) {
                handleGenerateBudget(res.extracted_fields || undefined);
            }
        } catch (error: any) {
            setMessages(prev => prev.map(m =>
                m.id === loadingMsg.id
                    ? { ...m, content: `抱歉，AI 服务暂时不可用。${error.message || ''} 你可以去 "直接填表算" 页面手动输入。`, loading: false }
                    : m
            ));
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, collectedFields, sessionId, currentHouse, updateCurrentHouse]);

    const handleGenerateBudget = async (extraFields?: Record<string, any>) => {
        const fields = { ...collectedFields, ...extraFields };
        const house = mapFieldsToHouse(fields);

        // 检查最小输入集 (使用更严格的校验)
        if (!house.city || !house.innerArea || !house.layout || !house.tierLevel) {
            Toast.show({ content: '信息不足，请至少告诉我城市、面积、户型和装修档次', icon: 'fail' });
            return;
        }

        try {
            const cityName = house.city || '成都';
            const result = await budgetApi.calculate({
                city_name: cityName,
                inner_area: house.innerArea,
                layout_type: house.layout,
                tier: (house.tierLevel as string) || 'standard',
                floor_preference: house.floorPreference || 'tile',
                bathroom_count: house.bathroomCount || 1,
            });

            if (result && result.schemes) {
                const mappedResult: BudgetResult = {
                    ...result,
                    economy: result.schemes.find(s => s.tier === 'economy'),
                    standard: result.schemes.find(s => s.tier === 'standard'),
                    premium: result.schemes.find(s => s.tier === 'premium'),
                    missingItems: [],
                    optimizations: [],
                    overBudget: false,
                    overBudgetAmount: 0,
                };
                setBudgetResult(mappedResult);
                navigate('/budget-result');
            }
        } catch (error: any) {
            Toast.show({ content: '预算生成失败: ' + (error.message || '请重试'), icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#F3F4F6' }}>
            {/* Header */}
            <div style={{
                background: '#fff',
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <h1 style={{ fontSize: 17, fontWeight: 600 }}>AI装修问诊</h1>
                <Button
                    size="small"
                    onClick={() => navigate('/quick-budget')}
                    style={{ fontSize: 12 }}
                >
                    直接填表算 →
                </Button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        marginBottom: 16,
                    }}>
                        <div style={{
                            maxWidth: '85%',
                            background: msg.role === 'user' ? 'var(--color-primary)' : '#fff',
                            color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
                            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            padding: '12px 16px',
                            fontSize: 14,
                            lineHeight: 1.6,
                            boxShadow: 'var(--shadow-sm)',
                            whiteSpace: 'pre-wrap',
                        }}>
                            {msg.loading ? (
                                <DotLoading color="primary" />
                            ) : (
                                msg.content
                            )}

                            {/* 已识别字段展示 */}
                            {msg.fields && Object.keys(msg.fields).length > 0 && (
                                <div style={{
                                    marginTop: 10,
                                    padding: '8px 12px',
                                    background: '#F0FDF4',
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}>
                                    <div style={{ fontWeight: 600, color: '#059669', marginBottom: 4 }}>✅ 已识别信息：</div>
                                    {Object.entries(msg.fields).map(([key, value]) => (
                                        <div key={key} style={{ color: '#065F46' }}>
                                            {fieldLabel(key)}: {String(value)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Collected fields summary */}
                {Object.keys(collectedFields).length > 0 && (
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: '12px 16px',
                        marginBottom: 12,
                        border: '1px solid #E0E7FF',
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>
                            📋 当前已收集信息
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(collectedFields).map(([key, value]) => (
                                <span key={key} style={{
                                    background: '#EEF2FF',
                                    color: '#4338CA',
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                }}>
                                    {fieldLabel(key)}: {String(value)}
                                </span>
                            ))}
                        </div>
                        <Button
                            size="mini"
                            color="primary"
                            fill="outline"
                            style={{ marginTop: 10 }}
                            onClick={() => handleGenerateBudget()}
                        >
                            ✨ 直接用这些信息生成预算
                        </Button>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            {/* Input - 接上面 */}
            <div style={{
                background: '#fff',
                padding: '10px 16px',
                paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-end',
                flexShrink: 0,
            }}>
                <TextArea
                    placeholder="描述你的装修需求..."
                    value={input}
                    onChange={setInput}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{
                        flex: 1,
                        '--font-size': '14px',
                        background: '#F3F4F6',
                        borderRadius: 20,
                        padding: '8px 16px',
                    } as any}
                    onEnterPress={() => {
                        if (!loading) sendMessage();
                    }}
                />
                <Button
                    color="primary"
                    shape="rounded"
                    size="middle"
                    loading={loading}
                    disabled={!input.trim()}
                    onClick={sendMessage}
                    style={{ flexShrink: 0, height: 40, width: 64 }}
                >
                    发送
                </Button>
            </div>
        </div>
    );
}

// 字段映射：AI提取字段 → HouseProfile
function mapFieldsToHouse(fields: Record<string, any>): Partial<HouseProfile> {
    const house: Partial<HouseProfile> = {};
    // 支持驼峰和蛇形
    const getVal = (camel: string, snake: string) => fields[camel] ?? fields[snake];

    const city = getVal('city', 'city');
    if (city) house.city = city;

    const innerArea = getVal('innerArea', 'inner_area');
    if (innerArea) house.innerArea = Number(innerArea);

    const grossArea = getVal('grossArea', 'gross_area');
    if (grossArea) house.grossArea = Number(grossArea);

    const layout = getVal('layout', 'layout_type') || getVal('layout', 'layout');
    if (layout) house.layout = layout;

    const tier = getVal('tierLevel', 'tier_level') || getVal('tierLevel', 'tier');
    if (tier) house.tierLevel = tier as TierLevel;

    const targetBudget = getVal('targetBudget', 'target_budget');
    if (targetBudget) house.targetBudget = Number(targetBudget);

    const floorPreference = getVal('floorPreference', 'floor_preference');
    if (floorPreference) house.floorPreference = floorPreference;

    const hasCeiling = getVal('hasCeiling', 'has_ceiling');
    if (hasCeiling !== undefined) house.hasCeiling = Boolean(hasCeiling);

    const hasCustomCabinet = getVal('hasCustomCabinet', 'has_custom_cabinet');
    if (hasCustomCabinet !== undefined) house.hasCustomCabinet = Boolean(hasCustomCabinet);

    const includeFurniture = getVal('includeFurniture', 'include_furniture');
    if (includeFurniture !== undefined) house.includeFurniture = Boolean(includeFurniture);

    const bathroomCount = getVal('bathroomCount', 'bathroom_count');
    if (bathroomCount) house.bathroomCount = Number(bathroomCount);

    const kitchenCount = getVal('kitchenCount', 'kitchen_count');
    if (kitchenCount) house.kitchenCount = Number(kitchenCount);

    const balconyCount = getVal('balconyCount', 'balcony_count');
    if (balconyCount) house.balconyCount = Number(balconyCount);

    const purpose = getVal('purpose', 'purpose');
    if (purpose) house.purpose = purpose;

    const moveInDate = getVal('targetMoveInDate', 'target_move_in_date') || getVal('targetMoveInDate', 'move_in_date');
    if (moveInDate) house.targetMoveInDate = moveInDate;

    if (!house.innerArea && house.grossArea) house.innerArea = Math.round(house.grossArea * 0.82);
    if (!house.grossArea && house.innerArea) house.grossArea = Math.round(house.innerArea * 1.22);
    return house;
}

// 字段中文标签
function fieldLabel(key: string): string {
    const map: Record<string, string> = {
        city: '城市',
        innerArea: '套内面积', inner_area: '套内面积',
        grossArea: '建筑面积', gross_area: '建筑面积',
        layout: '户型', layout_type: '户型',
        tierLevel: '装修档次', tier_level: '装修档次', tier: '装修档次',
        targetBudget: '目标预算', target_budget: '目标预算',
        floorPreference: '地面偏好', floor_preference: '地面偏好',
        hasCeiling: '是否吊顶', has_ceiling: '是否吊顶',
        hasCustomCabinet: '是否定制柜', has_custom_cabinet: '是否定制柜',
        includeFurniture: '含家具家电', include_furniture: '含家具家电',
        bathroomCount: '卫生间数', bathroom_count: '卫生间数',
        kitchenCount: '厨房数', kitchen_count: '厨房数',
        balconyCount: '阳台数', balcony_count: '阳台数',
        purpose: '装修目的',
        targetMoveInDate: '入住时间', target_move_in_date: '入住时间', move_in_date: '入住时间',
        familyHasElderly: '有老人', family_has_elderly: '有老人',
        familyHasChildren: '有孩子', family_has_children: '有孩子',
        familyHasPets: '有宠物', family_has_pets: '有宠物',
        houseType: '房屋类型', house_type: '房屋类型',
    };
    return map[key] || key;
}
