import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, ImageUploader, Button, ErrorBlock, Card, Tag, Loading, Toast } from 'antd-mobile';
import { SearchOutline, CheckCircleOutline, ExclamationTriangleOutline } from 'antd-mobile-icons';
import { aiApi } from '@/api/services';
import { useConstructionStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { ImageUploadItem } from 'antd-mobile/es/components/image-uploader';

export default function AIInspect() {
    const navigate = useNavigate();
    const { currentPhase } = useConstructionStore();
    const [fileList, setFileList] = useState<ImageUploadItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const phaseInfo = PHASE_LIST.find(p => p.phase === currentPhase);

    const handleInspect = async () => {
        if (fileList.length === 0) {
            Toast.show('请先上传至少一张施工现场照片');
            return;
        }

        setLoading(true);
        try {
            const prompt = `你是一位专业的装修监理。当前装修阶段：${phaseInfo?.name}。
请分析这张施工现场照片。
1. 识别图中的工作内容。
2. 评价其工艺水平是否达到${phaseInfo?.name}的验收标准。
3. 如果存在违规或隐患，请明确指出。
4. 给出具体的整改建议。
请以结构化的方式回复，使用Markdown格式。`;

            // 由于 aiApi.chat 当前接受 string，对于图片，如果是后端支持 URL 最好
            // 这里的 mockUpload 已经生成了 blob URL，实际后端应支持 Base64 或文件上传
            const response = await aiApi.chat({ message: prompt });
            setResult(response.reply);
        } catch (error) {
            Toast.show('分析失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const mockUpload = async (file: File) => {
        return {
            url: URL.createObjectURL(file),
        };
    };

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 40 }}>
            <NavBar onBack={() => navigate(-1)}>AI 现场验收</NavBar>

            <div style={{ padding: 16 }}>
                <Card style={{ marginBottom: 16, borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <SearchOutline fontSize={20} color="var(--color-primary)" />
                        <span style={{ fontWeight: 600 }}>当前阶段：{phaseInfo?.name}</span>
                        <Tag round color="primary" fill="outline">{phaseInfo?.typicalDurationDays}天</Tag>
                    </div>
                    <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                        上传施工现场真实照片，AI将为您提供专业的验收建议，帮您识别潜在的施工陷阱。
                    </div>
                </Card>

                <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>📸 现场拍照/选择照片</div>
                    <ImageUploader
                        value={fileList}
                        onChange={setFileList}
                        upload={mockUpload}
                        multiple
                        maxCount={3}
                        style={{ '--cell-size': '90px' }}
                    />
                    <Button
                        block
                        color="primary"
                        size="large"
                        loading={loading}
                        onClick={handleInspect}
                        style={{ marginTop: 16, borderRadius: 8 }}
                    >
                        开始 AI 质量分析
                    </Button>
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Loading color="primary" />
                        <div style={{ marginTop: 12, color: '#999', fontSize: 14 }}>监理正在通过照片巡检中...</div>
                    </div>
                )}

                {result && (
                    <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircleOutline color="#10B981" /> 验收结论</div>} style={{ borderRadius: 12 }}>
                        <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                            {result}
                        </div>
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #eee' }}>
                            <div style={{ fontSize: 13, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ExclamationTriangleOutline /> AI 意见仅供参考，重大验收建议结合监理实地勘查。
                            </div>
                        </div>
                    </Card>
                )}

                {!loading && !result && fileList.length === 0 && (
                    <ErrorBlock status="empty" title="尚未上传照片" description="请上传一张清晰的现场施工照片开始分析" />
                )}
            </div>
        </div>
    );
}
