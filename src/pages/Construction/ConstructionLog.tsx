import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, TextArea, Button, Toast, Tag, ImageUploader, Empty, Image } from 'antd-mobile';
import { ImageUploadItem } from 'antd-mobile/es/components/image-uploader';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { ConstructionPhase } from '@/types';
import dayjs from 'dayjs';

export default function ConstructionLog() {
    const navigate = useNavigate();
    const { projectId, phases, currentPhase, logs, addLog } = useConstructionStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [fileList, setFileList] = useState<ImageUploadItem[]>([]);

    if (!projectId) return null;

    const sortedLogs = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleSubmit = () => {
        if (!title.trim()) {
            Toast.show({ content: '请输入日志标题', icon: 'fail' });
            return;
        }
        addLog({
            date: dayjs().format('YYYY-MM-DD'),
            phase: currentPhase as ConstructionPhase,
            title: title.trim(),
            content: content.trim(),
            photos: fileList.map(f => f.url),
            tags: [PHASE_LIST.find(p => p.phase === currentPhase)?.name || ''],
        });
        setTitle('');
        setContent('');
        setFileList([]);
        setShowForm(false);
        Toast.show({ content: '日志已记录', icon: 'success' });
    };

    // 模拟上传
    const mockUpload = async (file: File) => {
        return {
            url: URL.createObjectURL(file), // 实际应用应上传到服务器
        };
    };

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <NavBar
                onBack={() => navigate(-1)}
                style={{ background: '#fff' }}
                right={
                    <Button size="mini" color="primary" fill="solid" onClick={() => setShowForm(true)}>
                        + 记录
                    </Button>
                }
            >
                施工日志
            </NavBar>

            {/* 新增表单 */}
            {showForm && (
                <div style={{ margin: 12, padding: 16, background: '#fff', borderRadius: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📝 新增施工日志</h3>
                    <TextArea
                        placeholder="今天做了什么？（如：水电开槽完成）"
                        value={title}
                        onChange={setTitle}
                        autoSize={{ minRows: 1, maxRows: 2 }}
                        style={{ marginBottom: 10, background: '#F9FAFB', borderRadius: 8, padding: '10px 12px' }}
                    />
                    <TextArea
                        placeholder="详细记录（选填）"
                        value={content}
                        onChange={setContent}
                        autoSize={{ minRows: 2, maxRows: 5 }}
                        style={{ marginBottom: 12, background: '#F9FAFB', borderRadius: 8, padding: '10px 12px' }}
                    />
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>📷 上传照片</div>
                        <ImageUploader
                            value={fileList}
                            onChange={setFileList}
                            upload={mockUpload}
                            multiple
                            maxCount={9}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button block fill="outline" onClick={() => setShowForm(false)}>取消</Button>
                        <Button block color="primary" onClick={handleSubmit}>保存日志</Button>
                    </div>
                </div>
            )}

            {/* 日志列表 */}
            <div style={{ padding: '0 12px 40px' }}>
                {sortedLogs.length === 0 ? (
                    <Empty description="暂无日志记录" style={{ marginTop: 60 }} />
                ) : (
                    sortedLogs.map(log => {
                        const phaseInfo = PHASE_LIST.find(p => p.phase === log.phase);
                        return (
                            <div key={log.id} style={{
                                background: '#fff',
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 12,
                                boxShadow: 'var(--shadow-sm)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 14 }}>{phaseInfo?.icon}</span>
                                        <Tag color="primary" fill="outline" style={{ fontSize: 10 }}>{phaseInfo?.name}</Tag>
                                    </div>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-light)' }}>
                                        {dayjs(log.date).format('MM月DD日')}
                                    </span>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{log.title}</div>
                                {log.content && (
                                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                                        {log.content}
                                    </div>
                                )}
                                {log.photos && log.photos.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
                                        {log.photos.map((url, i) => (
                                            <Image
                                                key={i}
                                                src={url}
                                                fit="cover"
                                                style={{ aspectRatio: '1/1', borderRadius: 8 }}
                                                onClick={() => {
                                                    // TODO: Image preview logic
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
