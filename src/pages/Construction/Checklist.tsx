
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Checkbox, ImageUploader, Modal, Tag, Toast } from 'antd-mobile';
import { ExclamationTriangleOutline, PictureOutline, QuestionCircleOutline } from 'antd-mobile-icons';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { aiApi } from '@/api/services';
import { ChecklistItem } from '@/types';

export default function Checklist() {
    const navigate = useNavigate();
    const { phase } = useParams();
    const { currentPhase, setCurrentPhase, checklists, toggleChecklist, uploadPhoto, updateChecklistPhoto } = useConstructionStore();
    const [aiLoading, setAiLoading] = useState<string | null>(null);

    const phaseKey = (phase as any) || currentPhase;

    useEffect(() => {
        if (phase && phase !== currentPhase) {
            setCurrentPhase(phase as any);
        }
    }, [phase, currentPhase, setCurrentPhase]);

    const phaseInfo = PHASE_LIST.find((item) => item.phase === phaseKey);
    const items = checklists.filter((item) => item.phase === phaseKey);

    const handleAICoach = async (item: ChecklistItem) => {
        setAiLoading(item.id);
        try {
            const prompt = `你是装修监理顾问。请针对“${phaseInfo?.name}”阶段的验收项“${item.content}”给业主建议，包含：1）重点检查点 2）常见问题 3）快速排查方法 4）和工人沟通话术。`;
            const response = await aiApi.chat({ message: prompt, session_type: 'coach' });
            Modal.show({
                title: 'AI 教练建议',
                content: <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}>{response.reply}</div>,
                closeOnAction: true,
                actions: [{ key: 'ok', text: '我知道了' }],
            });
        } catch (error: any) {
            Toast.show({ content: `AI 建议获取失败：${error.message || ''}`, icon: 'fail' });
        } finally {
            setAiLoading(null);
        }
    };

    const handleUpload = async (file: File, itemId: string) => {
        try {
            Toast.show({ icon: 'loading', content: '正在上传照片...' });
            const url = await uploadPhoto(file);
            await updateChecklistPhoto(itemId, url);
            Toast.clear();
            Toast.show({ icon: 'success', content: '照片上传成功' });
            return url;
        } catch (error: any) {
            Toast.clear();
            Toast.show({ icon: 'fail', content: `上传失败：${error.message}` });
            throw error;
        }
    };

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(16, 185, 129, 0.10)', color: '#047857' }}>验收清单</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>{phaseInfo?.name || '未选择阶段'}</div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>
                            已完成 {items.filter((item) => item.completed).length} / {items.length} 项
                        </div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>
                        返回
                    </Button>
                </div>

                <div className="note-card note-card--success">
                    <div className="note-icon">提示</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7 }}>{phaseInfo?.description}</div>
                </div>

                {items.length === 0 ? (
                    <div className="empty-card">
                        <div className="empty-title">当前阶段暂无验收项</div>
                        <div className="empty-desc">你可以先在施工总览中切换阶段，或稍后同步清单模板。</div>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="section-card">
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <Checkbox checked={item.completed} onChange={() => toggleChecklist(item.id)} style={{ '--icon-size': '22px' } as React.CSSProperties} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                                            {item.importance === 'critical' && <ExclamationTriangleOutline style={{ color: '#ef4444', marginRight: 6 }} />}
                                            {item.content}
                                        </div>
                                        <Button size="small" fill="none" loading={aiLoading === item.id} onClick={() => handleAICoach(item)}>
                                            <QuestionCircleOutline />
                                        </Button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                        <Tag color={item.importance === 'critical' ? 'danger' : item.importance === 'important' ? 'warning' : 'default'} fill="outline">
                                            {item.importance === 'critical' ? '关键' : item.importance === 'important' ? '重要' : '常规'}
                                        </Tag>
                                        <Tag fill="outline">{item.category}</Tag>
                                        {item.photoRequired && <Tag color="primary" fill="outline"><PictureOutline /> 需拍照</Tag>}
                                    </div>
                                    <div className="feature-desc" style={{ marginTop: 10 }}>
                                        <strong style={{ color: 'var(--color-text)' }}>验收方法：</strong>{item.howToCheck}
                                    </div>

                                    {item.photoRequired && (
                                        <div style={{ marginTop: 12 }} onClick={(event) => event.stopPropagation()}>
                                            <ImageUploader
                                                value={item.photoUrl ? [{ url: item.photoUrl }] : []}
                                                upload={async (file) => ({ url: await handleUpload(file, item.id) })}
                                                onDelete={() => {
                                                    updateChecklistPhoto(item.id, '');
                                                    return true;
                                                }}
                                                maxCount={1}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                <div className="note-card note-card--warning">
                    <div className="note-icon">提醒</div>
                    <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                        建议先完成关键项再进入下一阶段，所有照片和备注都可以作为后续维保凭证。
                    </div>
                </div>
            </div>
        </div>
    );
}
