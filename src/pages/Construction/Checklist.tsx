import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Checkbox, Tag, TextArea, Toast } from 'antd-mobile';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { ConstructionPhase, ChecklistItem } from '@/types';

export default function Checklist() {
    const navigate = useNavigate();
    const { phase } = useParams<{ phase: string }>();
    const { checklists, toggleChecklistItem, addChecklistNote } = useConstructionStore();

    const currentPhase = phase as ConstructionPhase;
    const phaseInfo = PHASE_LIST.find(p => p.phase === currentPhase);
    const items = checklists.filter(c => c.phase === currentPhase);

    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ChecklistItem[]>);

    const completedCount = items.filter(i => i.completed).length;

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                {phaseInfo?.name} - 验收清单
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
                {items.some(i => i.importance === 'critical' && !i.completed) && (
                    <div style={{ marginTop: 8, fontSize: 12, background: 'rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: 6 }}>
                        ⚠️ 还有关键检查项未完成，建议全部确认后再进入下一阶段
                    </div>
                )}
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
                                        onChange={() => toggleChecklistItem(item.id)}
                                        style={{ '--icon-size': '20px', '--font-size': '14px', flexShrink: 0, marginTop: 2 } as any}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            textDecoration: item.completed ? 'line-through' : 'none',
                                            color: item.completed ? 'var(--color-text-light)' : 'var(--color-text)',
                                        }}>
                                            {item.content}
                                            {item.photoRequired && <span style={{ color: '#EF4444', fontSize: 11, marginLeft: 4 }}>📷需拍照</span>}
                                        </div>

                                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                            <Tag color={
                                                item.importance === 'critical' ? 'danger' :
                                                    item.importance === 'important' ? 'warning' : 'default'
                                            } fill="outline" style={{ fontSize: 10 }}>
                                                {item.importance === 'critical' ? '⭐ 关键' : item.importance === 'important' ? '重要' : '一般'}
                                            </Tag>
                                        </div>

                                        {/* 检查方法 */}
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

                                        {/* 备注 */}
                                        {item.completed && (
                                            <TextArea
                                                placeholder="添加备注或问题记录..."
                                                value={item.note || ''}
                                                onChange={v => addChecklistNote(item.id, v)}
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
