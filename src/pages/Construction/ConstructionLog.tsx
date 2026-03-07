import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, TextArea, ImageUploader, ImageUploadItem, Toast, Tag, Input, Form, Empty, Image } from 'antd-mobile';
import { CameraOutline } from 'antd-mobile-icons';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { ConstructionPhase } from '@/types';
import dayjs from 'dayjs';

export default function ConstructionLogPage() {
    const navigate = useNavigate();
    const { currentPhase, logs, addLog, uploadPhoto } = useConstructionStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [fileList, setFileList] = useState<ImageUploadItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const phaseInfo = PHASE_LIST.find(p => p.phase === currentPhase);
    const sortedLogs = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleSubmit = async () => {
        if (!content.trim()) {
            Toast.show('请输入日志内容');
            return;
        }

        setLoading(true);
        try {
            const imageUrls: string[] = [];
            for (const item of fileList) {
                if (item.url && item.url.startsWith('http')) {
                    imageUrls.push(item.url);
                } else if (item.extra instanceof File) {
                    const url = await uploadPhoto(item.extra);
                    imageUrls.push(url);
                }
            }

            addLog({
                date: dayjs().format('YYYY-MM-DD'),
                phase: currentPhase as ConstructionPhase,
                title: title || `${phaseInfo?.name}施工日常`,
                content,
                photos: imageUrls,
                tags: [phaseInfo?.name || '施工中'],
            });

            Toast.show({ content: '日志已保存', icon: 'success' });
            setTitle('');
            setContent('');
            setFileList([]);
            setShowForm(false);
        } catch (error: any) {
            Toast.show({ content: '保存失败: ' + (error.message || '服务错误'), icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File) => {
        return {
            url: URL.createObjectURL(file),
            extra: file
        };
    };

    return (
        <div style={{ background: '#F3F4F6', minHeight: '100vh', paddingBottom: 40 }}>
            <NavBar
                onBack={() => navigate(-1)}
                style={{ background: '#fff' }}
                right={
                    <Button size="mini" color="primary" fill="solid" onClick={() => setShowForm(!showForm)}>
                        {showForm ? '取消' : '+ 记录'}
                    </Button>
                }
            >
                施工日志
            </NavBar>

            <div style={{ padding: 16 }}>
                {showForm && (
                    <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Form layout="vertical">
                            <Form.Item label="日志标题" extra={<Tag color="primary" fill="outline">{phaseInfo?.name}</Tag>}>
                                <Input
                                    placeholder="给今天的进展起个标题"
                                    value={title}
                                    onChange={setTitle}
                                />
                            </Form.Item>

                            <Form.Item label="施工内容" required>
                                <TextArea
                                    placeholder="描述下今天的施工进展..."
                                    value={content}
                                    onChange={setContent}
                                    rows={4}
                                    autoSize={{ minRows: 4, maxRows: 8 }}
                                />
                            </Form.Item>

                            <Form.Item label="现场照片">
                                <ImageUploader
                                    value={fileList}
                                    onChange={setFileList}
                                    upload={handleUpload}
                                    multiple
                                    maxCount={9}
                                    capture="environment"
                                />
                            </Form.Item>

                            <Button
                                block
                                color="primary"
                                size="large"
                                shape="rounded"
                                loading={loading}
                                onClick={handleSubmit}
                                style={{ marginTop: 8 }}
                            >
                                发布日志
                            </Button>
                        </Form>
                    </div>
                )}

                {/* 日志列表 */}
                <div style={{ marginTop: 12 }}>
                    {sortedLogs.length === 0 ? (
                        <Empty description="暂无日志记录" style={{ marginTop: 40 }} />
                    ) : (
                        sortedLogs.map(log => (
                            <div key={log.id} style={{
                                background: '#fff',
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 12,
                                border: '1px solid #E5E7EB'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontWeight: 600, fontSize: 15 }}>{log.title}</span>
                                    <span style={{ fontSize: 12, color: '#999' }}>{log.date}</span>
                                </div>
                                <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, marginBottom: 12 }}>
                                    {log.content}
                                </div>
                                {log.photos && log.photos.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                        {log.photos.map((url, i) => (
                                            <Image
                                                key={i}
                                                src={url}
                                                width="100%"
                                                height={80}
                                                fit="cover"
                                                style={{ borderRadius: 4 }}
                                                onClick={() => {
                                                    import('antd-mobile').then(({ ImageViewer }) => {
                                                        ImageViewer.show({ image: url });
                                                    });
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                                    {log.tags.map(tag => (
                                        <Tag key={tag} color="default" style={{ fontSize: 10 }}>{tag}</Tag>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
