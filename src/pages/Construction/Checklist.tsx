import React, { useState } from 'react';
import { NavBar, List, Checkbox, Button, Modal, Tag, Toast } from 'antd-mobile';
import { QuestionCircleOutline, ExclamationTriangleOutline } from 'antd-mobile-icons';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { aiApi } from '@/api/services';
import { ChecklistItem } from '@/types';

export default function Checklist() {
    const { currentPhase, checklists, toggleChecklist } = useConstructionStore();
    const [aiLoading, setAiLoading] = useState<string | null>(null);

    const phaseInfo = PHASE_LIST.find(p => p.phase === currentPhase);
    const items = checklists.filter(item => item.phase === currentPhase);

    const handleAICoach = async (item: ChecklistItem) => {
        setAiLoading(item.id);
        try {
            const prompt = `你是一位资深的装修监理。针对【${phaseInfo?.name}】阶段的检查项：【${item.content}】，请提供专业的验收指导。包含：1. 风险点（为什么要查） 2. 检查方法（怎么查） 3. 常见陷阱 4. 整改要求。`;
            const res = await aiApi.chat({
                message: prompt,
                session_type: 'coach'
            });

            Modal.show({
                title: 'AI 监理指导',
                content: <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}>
                    {res.reply}
                </div>,
                closeOnAction: true,
                actions: [{ key: 'ok', text: '我知道了' }]
            });
        } catch (error: any) {
            Toast.show({ content: 'AI 服务暂时不可用: ' + (error.message || ''), icon: 'fail' });
        } finally {
            setAiLoading(null);
        }
    };

    return (
        <div style={{ background: '#F3F4F6', minHeight: '100vh', paddingBottom: 40 }}>
            <NavBar back="返回" style={{ background: '#fff' }}>阶段验收清单</NavBar>

            <div style={{ padding: 16 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 600 }}>{phaseInfo?.name} 验收</span>
                        <Tag color="success" fill="outline">
                            已完成 {items.filter(i => i.completed).length}/{items.length}
                        </Tag>
                    </div>
                    <p style={{ fontSize: 13, color: '#666' }}>{phaseInfo?.description}</p>
                </div>

                {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>该阶段暂无清单项</div>
                ) : (
                    <List style={{ '--border-top': 'none', '--border-bottom': 'none', background: 'transparent' }}>
                        {items.map(item => (
                            <List.Item
                                key={item.id}
                                style={{
                                    marginBottom: 12,
                                    borderRadius: 12,
                                    background: '#fff',
                                    padding: '4px 0'
                                }}
                                prefix={
                                    <Checkbox
                                        checked={item.completed}
                                        onChange={() => toggleChecklist(item.id)}
                                        style={{ '--icon-size': '22px' }}
                                    />
                                }
                                extra={
                                    <Button
                                        size="mini"
                                        fill="none"
                                        onClick={() => handleAICoach(item)}
                                        loading={aiLoading === item.id}
                                        style={{ color: 'var(--color-primary)', border: 'none', padding: 0 }}
                                    >
                                        <QuestionCircleOutline style={{ fontSize: 20 }} />
                                    </Button>
                                }
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ fontSize: 15, fontWeight: item.importance === 'critical' ? 600 : 400, color: item.importance === 'critical' ? '#333' : '#4B5563' }}>
                                        {item.importance === 'critical' && <ExclamationTriangleOutline style={{ color: '#EF4444', marginRight: 4 }} />}
                                        {item.content}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#999' }}>
                                        <Tag color={item.importance === 'critical' ? 'danger' : 'default'} style={{ fontSize: 10, marginRight: 6 }}>
                                            {item.importance === 'critical' ? '严控' : item.importance === 'important' ? '重要' : '常规'}
                                        </Tag>
                                        {item.category}
                                    </div>
                                </div>
                            </List.Item>
                        ))}
                    </List>
                )}

                <div style={{ marginTop: 24, padding: '0 8px' }}>
                    <div style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>
                        💡 建议：<br />
                        1. 关键项（红色标签）必须由业主亲自在场或通过视频验收。<br />
                        2. 凡要求拍照的项，请务必在施工日志中上传照片存档。<br />
                        3. 如发现不合格项，请立即要求停工并整改，切勿进入下一环节。
                    </div>
                </div>
            </div>
        </div>
    );
}
