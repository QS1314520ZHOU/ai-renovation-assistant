
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ImageUploader, ImageUploadItem, Toast, DotLoading, Tag } from 'antd-mobile';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { aiApi } from '@/api/services';

export default function AIInspect() {
    const navigate = useNavigate();
    const { currentPhase, checklists } = useConstructionStore();
    const [fileList, setFileList] = useState<ImageUploadItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const phaseInfo = PHASE_LIST.find((item) => item.phase === currentPhase);
    const phaseChecklist = checklists.filter((item) => item.phase === currentPhase);
    const criticalItems = phaseChecklist
        .filter((item) => item.importance === 'critical')
        .map((item) => item.content)
        .join('、');

    const handleInspect = async () => {
        if (fileList.length === 0) {
            Toast.show({ content: '请先上传验收照片', icon: 'fail' });
            return;
        }

        const fileItem = fileList[0];
        const rawFile = (fileItem as any).file || fileItem.extra;
        if (!rawFile) {
            Toast.show({ content: '读取上传文件失败，请重新选择', icon: 'fail' });
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const response = await aiApi.inspect({
                phase: phaseInfo?.name || currentPhase,
                items: criticalItems || '暂无关键检查项',
                file: rawFile,
            });
            setResult(response.reply);
            Toast.show({ content: 'AI 分析完成', icon: 'success' });
        } catch (error: any) {
            Toast.show({ content: `分析失败：${error.message || '请稍后重试'}`, icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    const mockUpload = async (file: File) => ({
        url: URL.createObjectURL(file),
        extra: file,
    });

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(99, 102, 241, 0.10)', color: 'var(--color-primary)' }}>AI 验收</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>上传施工照片，AI 帮你做节点验收</div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>当前阶段：{phaseInfo?.name || '未选择阶段'}</div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>
                        返回
                    </Button>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>本阶段关键检查项</h3>
                        <Tag color="primary" fill="outline">自动带入清单</Tag>
                    </div>
                    <div className="muted-text" style={{ fontSize: 13 }}>
                        {criticalItems || '当前阶段暂无关键项，你也可以直接上传照片让 AI 给建议。'}
                    </div>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>上传照片</h3>
                        <span className="inline-pill">支持相机拍照</span>
                    </div>
                    <ImageUploader value={fileList} onChange={setFileList} upload={mockUpload} maxCount={1} capture="environment" />
                    <div className="feature-desc" style={{ marginTop: 8 }}>建议拍摄清晰近景和全景各一张，便于识别细节。</div>
                </div>

                <Button block color="primary" shape="rounded" loading={loading} disabled={fileList.length === 0} onClick={handleInspect}>
                    开始 AI 验收
                </Button>

                {loading && (
                    <div className="empty-card">
                        <DotLoading color="primary" />
                        <div className="empty-desc" style={{ marginTop: 10 }}>AI 正在识别图片并生成建议...</div>
                    </div>
                )}

                {result && (
                    <div className="section-card">
                        <div className="page-section-title">
                            <h3>分析结果</h3>
                            <span className="inline-pill">AI 建议</span>
                        </div>
                        <div className="muted-text" style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{result}</div>
                        <Button block fill="outline" shape="rounded" onClick={() => setResult(null)} style={{ marginTop: 14 }}>
                            重新分析
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
