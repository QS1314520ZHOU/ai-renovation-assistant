
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextArea, ImageUploader, ImageUploadItem, Toast, Input, Form, Image, Tag } from 'antd-mobile';
import dayjs from 'dayjs';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { ConstructionPhase } from '@/types';

export default function ConstructionLogPage() {
    const navigate = useNavigate();
    const { currentPhase, logs, addLog, uploadPhoto } = useConstructionStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [fileList, setFileList] = useState<ImageUploadItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const phaseInfo = PHASE_LIST.find((item) => item.phase === currentPhase);
    const sortedLogs = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleSubmit = async () => {
        if (!content.trim()) {
            Toast.show({ content: '请先填写日志内容', icon: 'fail' });
            return;
        }

        setLoading(true);
        try {
            const photos: string[] = [];
            for (const item of fileList) {
                if (item.url && item.url.startsWith('http')) {
                    photos.push(item.url);
                } else if (item.extra instanceof File) {
                    const url = await uploadPhoto(item.extra);
                    photos.push(url);
                }
            }

            await addLog({
                date: dayjs().format('YYYY-MM-DD'),
                phase: currentPhase as ConstructionPhase,
                title: title || `${phaseInfo?.name || '当前阶段'}记录`,
                content,
                photos,
                tags: [phaseInfo?.name || '施工'],
            });

            Toast.show({ content: '日志已保存', icon: 'success' });
            setTitle('');
            setContent('');
            setFileList([]);
            setShowForm(false);
        } catch (error: any) {
            Toast.show({ content: `保存失败：${error.message || '请稍后重试'}`, icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File) => ({
        url: URL.createObjectURL(file),
        extra: file,
    });

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(99, 102, 241, 0.10)', color: 'var(--color-primary)' }}>施工日志</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>记录每天进度与现场问题</div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>当前阶段：{phaseInfo?.name || '未选择阶段'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="small" fill="outline" onClick={() => navigate(-1)}>返回</Button>
                        <Button size="small" color="primary" onClick={() => setShowForm((prev) => !prev)}>{showForm ? '收起' : '新建'}</Button>
                    </div>
                </div>

                {showForm && (
                    <div className="section-card">
                        <div className="page-section-title">
                            <h3>新建日志</h3>
                            <span className="inline-pill">支持图文记录</span>
                        </div>
                        <Form layout="vertical">
                            <Form.Item label="标题">
                                <Input placeholder="例如：客厅墙面找平完成" value={title} onChange={setTitle} clearable />
                            </Form.Item>
                            <Form.Item label="内容">
                                <TextArea value={content} onChange={setContent} placeholder="记录今天完成了什么、发现了什么问题、下一步计划是什么" autoSize={{ minRows: 4, maxRows: 8 }} />
                            </Form.Item>
                            <Form.Item label="照片">
                                <ImageUploader value={fileList} onChange={setFileList} upload={handleUpload} multiple maxCount={9} capture="environment" />
                            </Form.Item>
                        </Form>
                        <Button block color="primary" shape="rounded" loading={loading} onClick={handleSubmit}>
                            保存日志
                        </Button>
                    </div>
                )}

                {sortedLogs.length === 0 ? (
                    <div className="empty-card">
                        <div className="empty-title">还没有施工日志</div>
                        <div className="empty-desc">先记录今天的进展、问题和现场照片，后面复盘会很有帮助。</div>
                    </div>
                ) : (
                    sortedLogs.map((log) => (
                        <div key={log.id} className="section-card">
                            <div className="page-section-title" style={{ marginBottom: 8 }}>
                                <h3>{log.title}</h3>
                                <span className="inline-pill">{log.date}</span>
                            </div>
                            <div className="muted-text" style={{ fontSize: 13 }}>{log.content}</div>
                            {log.photos?.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                                    {log.photos.map((url, index) => (
                                        <Image
                                            key={`${url}-${index}`}
                                            src={url}
                                            width="100%"
                                            height={88}
                                            fit="cover"
                                            style={{ borderRadius: 12 }}
                                            onClick={() => {
                                                import('antd-mobile').then(({ ImageViewer }) => ImageViewer.show({ image: url }));
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                                {log.tags.map((tag) => (
                                    <Tag key={tag} fill="outline">{tag}</Tag>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
