import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Checkbox, Tag, TextArea, Toast, Modal } from 'antd-mobile';
import { QuestionCircleOutline } from 'antd-mobile-icons';
import { useConstructionStore } from '@/store';
import { PHASE_LIST, CHECKLIST_DATA } from '@/engine/constructionData';
import { ConstructionPhase } from '@/types';
import { aiApi } from '@/api/services';

export default function Checklist() {
    const navigate = useNavigate();
    const { phase } = useParams<{ phase: string }>();
    const { currentPhase: storeCurrentPhase, checklists: storeItems, toggleChecklist, updateChecklistNote } = useConstructionStore();
    const [aiLoading, setAiLoading] = useState<string | null>(null);

    const activePhase = (phase || storeCurrentPhase) as ConstructionPhase;
    const phaseInfo = PHASE_LIST.find(p => p.phase === activePhase);

    // 获取当前阶段的所有标准检查项
    const baseItems = CHECKLIST_DATA.filter(c => c.phase === activePhase);

    // 合并 store 中的状态
    const items = baseItems.map(base => {
        const storeItem = storeItems.find(s => s.id === base.id);
        return {
            ...base,
            completed: storeItem?.checked || false,
            note: storeItem?.note || '',
        };
    });

    const groupedItems = items.reduce((acc, item) => {
        const cat = (item as any).category || '通用';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    const completedCount = items.filter(i => i.completed).length;

    const handleAICoach = async (item: any) => {
        setAiLoading(item.id);
        try {
            const prompt = `你是一位严苛的装修监理。针对"${phaseInfo?.name}"阶段的验收项："${item.content}"。
这个项目的检查类目是：${item.category}。
官方检查方法是：${item.howToCheck}。
请为业主提供：
1. 这个检查点最容易被工人掩盖的缺陷是什么？
2. 如果业主自己检查，除了官方方法，还有什么“土办法”或者细节可以快速判断质量？
3. 如果发现不合格，应该如何要求工人返工，或者有哪些通用的补救方案？
请用简练、口语化的专业术语回答。`;

            const res = await aiApi.chat({ message: prompt });
            Modal.show({
                title: 'AI 监理指导',
                content: <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}>{res.reply}</div>,
                closeOnMaskClick: true,
                actions: [{ key: 'confirm', text: '我知道了' }]
            });
        } catch (e) {
            Toast.show('咨询失败，请稍后重试');
        } finally {
            setAiLoading(null);
        }
    };

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                {phaseInfo?.name || '验收清单'}
            </NavBar>

            {/* 进度头部 */}
            <div style={{
                margin: 12,
                padding: 16,
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                borderRadius: 12,
                color: '#fff',
            }}>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                    {completedCount}/{items.length}
                </div>
                <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                    已完成 {items.length ? Math.round(completedCount / items.length * 100) : 0}% 的检查项
                </div>
            </div>

            {/* 分组清单 */}
            <div style={{ padding: '0 12px 40px' }}>
                {Object.entries(groupedItems).map(([category, catItems]) => (
                    <div key={category} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8, paddingLeft: 4 }}>
                            {category}
                        </div>
                        {catItems.map(item => (
                            <div key={item.id} style={{
                                background: '#fff',
                                borderRadius: 10,
                                padding: '12px 14px',
                                marginBottom: 8,
                                border: item.completed ? '1px solid #D1FAE5' : item.importance === 'critical' ? '1px solid #FCA5A5' : '1px solid var(--color-border)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <Checkbox
                                        checked={item.completed}
                                        onChange={() => toggleChecklist(item.id, activePhase)}
                                        style={{ '--icon-size': '20px', '--font-size': '14px', flexShrink: 0, marginTop: 2 } as any}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{
                                                fontSize: 14,
                                                fontWeight: 500,
                                                textDecoration: item.completed ? 'line-through' : 'none',
                                                color: item.completed ? 'var(--color-text-light)' : 'var(--color-text)',
                                            }}>
                                                {item.content}
                                                {item.photoRequired && <span style={{ color: '#EF4444', fontSize: 11, marginLeft: 4 }}>📷必拍</span>}
                                            </div>
                                            <div
                                                onClick={() => handleAICoach(item)}
                                                style={{ padding: '2px 8px', color: 'var(--color-primary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                                            >
                                                {aiLoading === item.id ? '分析中...' : <><QuestionCircleOutline fontSize={14} /> AI指导</>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                            <Tag color={
                                                item.importance === 'critical' ? 'danger' :
                                                    item.importance === 'important' ? 'warning' : 'default'
                                            } fill="outline" style={{ fontSize: 10 }}>
                                                {item.importance === 'critical' ? '⭐ 关键' : item.importance === 'important' ? '重要' : '一般'}
                                            </Tag>
                                        </div>

                                        <div style={{
                                            marginTop: 8,
                                            padding: '8px 10px',
                                            background: '#F9FAFB',
                                            borderRadius: 6,
                                            fontSize: 12,
                                            color: '#6B7280',
                                            lineHeight: 1.5,
                                        }}>
                                            💡 <b>怎么检查：</b>{item.howToCheck}
                                        </div>

                                        {item.completed && (
                                            <TextArea
                                                placeholder="添加备注或记录现场发现的问题..."
                                                value={item.note || ''}
                                                onChange={v => updateChecklistNote(item.id, v)}
                                                autoSize={{ minRows: 1, maxRows: 3 }}
                                                style={{ marginTop: 8, '--font-size': '12px', background: '#F9FAFB', borderRadius: 6, padding: '6px 10px' } as any}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
