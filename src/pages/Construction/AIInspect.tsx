import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, ImageUploader, ImageUploadItem, Toast, DotLoading, Tag } from 'antd-mobile';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { aiApi } from '@/api/services';

export default function AIInspect() {
    const navigate = useNavigate();
    const { currentPhase, checklists, uploadPhoto } = useConstructionStore();
    const [fileList, setFileList] = useState<ImageUploadItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const phaseInfo = PHASE_LIST.find(p => p.phase === currentPhase);
    const phaseChecklist = checklists.filter(c => c.phase === currentPhase);
    const criticalItems = phaseChecklist
        .filter(c => c.importance === 'critical')
        .map(c => c.content)
        .join('、');

    const handleInspect = async () => {
        if (fileList.length === 0) {
            Toast.show({ content: '请先拍摄或上传施工照片', icon: 'fail' });
            return;
        }

        const fileItem = fileList[0];
        if (!fileItem.extra) {
            Toast.show({ content: '照片处理中，请稍后', icon: 'fail' });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // 调用真正的 Vision 接口
            const res = await aiApi.inspect({
                phase: phaseInfo?.name || currentPhase,
                items: criticalItems || '常规施工标准',
                file: fileItem.extra as File
            });

            setResult(res.reply);
            Toast.show({ content: '分析完成', icon: 'success' });
        } catch (error: any) {
            Toast.show({ content: '分析失败: ' + (error.message || '服务繁忙'), icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    const mockUpload = async (file: File) => {
        // 实际上这只是为了让 ImageUploader 能显示预览并拿到 File 对象
        return {
            url: URL.createObjectURL(file),
            extra: file
        };
    };

    return (
        <div style={{ background: '#F3F4F6', minHeight: '100vh', paddingBottom: 40 }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                AI 现场验收
            </NavBar>

            <div style={{ padding: 16 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>当前阶段: {phaseInfo?.name}</span>
                        <Tag color="primary" fill="outline">现场巡检</Tag>
                    </div>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                        上传施工现场照片，AI将针对该阶段的关键点（如：{criticalItems.slice(0, 30)}...）进行专业分析。
                    </p>
                </div>

                <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ marginBottom: 12, fontWeight: 600 }}>上传现场照片</div>
                    <ImageUploader
                        value={fileList}
                        onChange={setFileList}
                        upload={mockUpload}
                        maxCount={1}
                        capture="environment"
                    />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                        建议拍摄清晰的局部细节或施工工法照片
                    </div>
                </div>

                <Button
                    block
                    color="primary"
                    size="large"
                    shape="rounded"
                    loading={loading}
                    onClick={handleInspect}
                    disabled={fileList.length === 0}
                >
                    开始 AI 巡检
                </Button>

                {loading && (
                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <DotLoading color="primary" />
                        <div style={{ fontSize: 13, color: 'var(--color-primary)', marginTop: 8 }}>AI 正在睁大眼睛观察...</div>
                    </div>
                )}

                {result && (
                    <div style={{
                        marginTop: 24,
                        background: '#fff',
                        borderRadius: 12,
                        padding: 20,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            ✨ AI 验收意见
                        </div>
                        <div style={{
                            fontSize: 14,
                            lineHeight: 1.8,
                            color: '#333',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {result}
                        </div>
                        <Button
                            block
                            fill="outline"
                            color="primary"
                            style={{ marginTop: 20 }}
                            onClick={() => setResult(null)}
                        >
                            重新分析
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
