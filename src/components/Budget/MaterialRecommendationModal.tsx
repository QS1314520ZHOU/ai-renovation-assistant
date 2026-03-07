import React, { useState, useEffect } from 'react';
import { Popup, DotLoading, Button, Toast } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import { materialApi } from '@/api/services';

interface MaterialRecommendationModalProps {
    visible: boolean;
    onClose: () => void;
    projectId: string;
    itemId: string;
    itemName: string;
    totalBudget: number;
}

export default function MaterialRecommendationModal({
    visible,
    onClose,
    projectId,
    itemId,
    itemName,
    totalBudget
}: MaterialRecommendationModalProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (visible && itemId) {
            fetchRecommendation();
        } else {
            setData(null);
        }
    }, [visible, itemId]);

    const fetchRecommendation = async () => {
        setLoading(true);
        try {
            const res = await materialApi.getRecommendation(projectId, itemId, totalBudget);
            setData(res.data);
        } catch (error: any) {
            Toast.show({ content: `获取推荐失败: ${error.message}`, icon: 'fail' });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popup
            visible={visible}
            onMaskClick={onClose}
            bodyStyle={{
                minHeight: '60vh',
                maxHeight: '85vh',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: '16px',
                background: '#F9FAFB'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                    <span style={{ fontSize: 18, marginRight: 6 }}>🛍️</span>
                    {itemName} 选购推荐
                </h3>
                <div onClick={onClose} style={{ padding: 4, cursor: 'pointer' }}>
                    <CloseOutline fontSize={20} color="#9CA3AF" />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--color-primary)' }}>
                    <DotLoading color="primary" />
                    <span style={{ marginTop: 12, fontSize: 13, color: '#6B7280' }}>AI 教练正在为您匹配品牌...</span>
                </div>
            ) : data ? (
                <div style={{ overflowY: 'auto', paddingBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <div style={{ background: '#E0E7FF', color: '#3730A3', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                            {data.category}
                        </div>
                        <div style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                            {data.tier}档次
                        </div>
                    </div>

                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>推荐品牌及型号</h4>
                    {data.recommendations?.map((rec: any, idx: number) => (
                        <div key={idx} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{rec.brand}</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: 14 }}>{rec.estimated_price}</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 6 }}>
                                <span style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, fontSize: 12, marginRight: 6 }}>型号/系列</span>
                                {rec.model_or_series}
                            </div>
                            <div style={{ fontSize: 12, color: '#059669', background: '#ECFDF5', padding: '8px', borderRadius: 8, marginTop: 8 }}>
                                💡 <strong>推荐理由：</strong>{rec.reason}
                            </div>
                        </div>
                    ))}

                    {data.buying_tips && data.buying_tips.length > 0 && (
                        <>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginTop: 20, marginBottom: 12 }}>选购避坑指南</h4>
                            <div style={{ background: '#FFFBEB', borderRadius: 12, padding: 14, border: '1px solid #FEF3C7' }}>
                                {data.buying_tips.map((tip: string, idx: number) => (
                                    <div key={idx} style={{ color: '#92400E', fontSize: 13, lineHeight: 1.6, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                        <span style={{ fontSize: 14, marginTop: 1 }}>🛡️</span>
                                        <span>{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>暂无推荐数据</div>
            )}

            {!loading && data && (
                <div style={{ position: 'sticky', bottom: 0, padding: '12px 0', background: 'linear-gradient(to top, #F9FAFB 70%, transparent)' }}>
                    <Button block shape="rounded" color="primary" onClick={onClose}>
                        我知道了
                    </Button>
                </div>
            )}
        </Popup>
    );
}
