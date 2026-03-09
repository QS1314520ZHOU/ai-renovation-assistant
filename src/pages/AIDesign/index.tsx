import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Button,
    DotLoading,
    Form,
    Image,
    ImageUploader,
    ImageUploadItem,
    Input,
    Picker,
    Slider,
    Tag,
    Toast,
} from 'antd-mobile';

import { DesignGenerateResult, DesignOption, budgetApi, designApi } from '@/api/services';
import {
    defaultBudgetByTierWan,
    DesignBudgetBridge,
    inferFloorPreference,
    inferSpecialNeeds,
    mapStyleToTier,
} from '@/engine/designBudgetBridge';
import { getDesignInspirations } from '@/engine/designInspirationData';
import { useDesignStore, useProjectStore } from '@/store';
import { BudgetResult, HouseProfile } from '@/types';

const DEFAULT_STYLES: DesignOption[] = [
    { label: '现代简约', value: 'modern_minimal' },
    { label: '北欧', value: 'nordic' },
    { label: '日式', value: 'japanese' },
    { label: '轻奢', value: 'light_luxury' },
    { label: '新中式', value: 'new_chinese' },
];

const DEFAULT_ROOM_TYPES: DesignOption[] = [
    { label: '客厅', value: 'living' },
    { label: '卧室', value: 'bedroom' },
    { label: '厨房', value: 'kitchen' },
    { label: '卫生间', value: 'bathroom' },
];

function normalizeBudgetResult(result: any, house: Partial<HouseProfile>): BudgetResult {
    const schemes = Array.isArray(result?.schemes) ? result.schemes : [];
    const economy = schemes.find((item: any) => item.tier === 'economy');
    const standard = schemes.find((item: any) => item.tier === 'standard');
    const premium = schemes.find((item: any) => item.tier === 'premium');
    const selectedScheme = schemes.find((item: any) => item.tier === house.tierLevel) || standard || schemes[0];
    const targetBudget = Number(house.targetBudget || 0);
    const actualTotal = Number(selectedScheme?.total_amount || 0);
    const overBudget = targetBudget > 0 && actualTotal > targetBudget;

    return {
        ...result,
        schemes,
        economy,
        standard,
        premium,
        missingItems: result?.missing_items || [],
        optimizations: [],
        overBudget,
        overBudgetAmount: overBudget ? actualTotal - targetBudget : 0,
    } as BudgetResult;
}

export default function AIDesign() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryStyle = searchParams.get('style');
    const styleAliasMap: Record<string, string> = {
        modern: 'modern_minimal',
        nordic: 'nordic',
        japanese: 'japanese',
        luxury: 'light_luxury',
        chinese: 'new_chinese',
    };
    const normalizedQueryStyle = queryStyle ? (styleAliasMap[queryStyle] || queryStyle) : null;
    const [styleOptions, setStyleOptions] = useState<DesignOption[]>(DEFAULT_STYLES);
    const [roomTypeOptions, setRoomTypeOptions] = useState<DesignOption[]>(DEFAULT_ROOM_TYPES);
    const [style, setStyle] = useState(DEFAULT_STYLES[0].value);
    const [roomType, setRoomType] = useState(DEFAULT_ROOM_TYPES[0].value);
    const [controlMode, setControlMode] = useState<'none' | 'canny' | 'depth' | 'mlsd'>('canny');
    const [strength, setStrength] = useState(0.72);
    const [tone, setTone] = useState('');
    const [material, setMaterial] = useState('');
    const [lighting, setLighting] = useState('');
    const [fileList, setFileList] = useState<ImageUploadItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [bridging, setBridging] = useState(false);
    const [result, setResult] = useState<DesignGenerateResult | null>(null);
    const { favorites, quizProfile, setBudgetBridge } = useDesignStore();
    const { currentHouse, setCurrentHouse, setBudgetResult } = useProjectStore();

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const options = await designApi.getOptions();
                if (options.styles?.length) {
                    setStyleOptions(options.styles);
                    const matched = normalizedQueryStyle
                        ? options.styles.find((item) => item.value === normalizedQueryStyle)
                        : null;
                    setStyle(matched?.value || options.styles[0].value);
                }
                if (options.room_types?.length) {
                    setRoomTypeOptions(options.room_types);
                    setRoomType(options.room_types[0].value);
                }
            } catch (error) {
                // Fallback to defaults to keep page usable.
            }
        };
        void loadOptions();
    }, [normalizedQueryStyle]);

    const uploadPreview = async (file: File) => ({
        url: URL.createObjectURL(file),
        extra: file,
    });

    const handleGenerate = async () => {
        const item = fileList[0];
        const rawFile = (item as any)?.file || item?.extra;
        if (!rawFile) {
            Toast.show({ content: '请先上传房间照片', icon: 'fail' });
            return;
        }

        const moodBoardTitles = getDesignInspirations({ ids: favorites, limit: 8 }).map((item) => item.title);
        setLoading(true);
        try {
            const generated = await designApi.generate({
                file: rawFile,
                style,
                room_type: roomType,
                preferences: {
                    tone: tone.trim(),
                    material: material.trim(),
                    lighting: lighting.trim(),
                    style_keywords: quizProfile?.keywords || [],
                    mood_board: moodBoardTitles,
                },
                control_mode: controlMode,
                strength,
            });
            setResult(generated);
            Toast.show({ content: '效果图已生成', icon: 'success' });
        } catch (error: any) {
            Toast.show({ content: error.message || '生成失败，请稍后重试', icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    const buildBridge = (payload: DesignGenerateResult): DesignBudgetBridge => {
        const tierLevel = mapStyleToTier(style);
        const floorPreference = inferFloorPreference(
            material,
            payload.style,
            String(payload.preferences?.material || ''),
            ...(quizProfile?.keywords || []),
        );
        const includeFurniture = tierLevel === 'premium' || roomType === 'living' || roomType === 'bedroom';
        const hasCustomCabinet = roomType === 'kitchen' || roomType === 'bedroom' || tierLevel !== 'economy';
        const hasCeiling = Boolean(
            lighting.includes('无主灯')
            || String(payload.preferences?.lighting || '').includes('无主灯')
            || tierLevel !== 'economy',
        );
        const suggestedBudgetWan = defaultBudgetByTierWan(tierLevel);
        const specialNeeds = inferSpecialNeeds({ hasCeiling, hasCustomCabinet, includeFurniture });

        return {
            source: 'ai_design',
            styleKey: style,
            tierLevel,
            floorPreference,
            hasCeiling,
            hasCustomCabinet,
            includeFurniture,
            suggestedBudgetWan,
            specialNeeds,
            summary: `来自 AI 效果图：${payload.style} / ${payload.room_type}，建议 ${tierLevel} 档，地面偏好 ${floorPreference}。`,
        };
    };

    const handleBridgeToBudget = async () => {
        if (!result) return;

        const bridge = buildBridge(result);
        setBudgetBridge(bridge);

        const baseHouse = (currentHouse || {}) as Partial<HouseProfile>;
        const innerArea = Number(baseHouse.innerArea || 0);
        const layoutType = String(baseHouse.layout || '');
        const cityName = String(baseHouse.city || '');

        if (!innerArea || !layoutType || !cityName) {
            Toast.show({ content: '已带入风格参数，请补全面积与户型后生成预算', icon: 'success' });
            navigate('/quick-budget?from=design');
            return;
        }

        setBridging(true);
        try {
            const calc = await budgetApi.calculate({
                city_name: cityName,
                inner_area: innerArea,
                layout_type: layoutType,
                tier: bridge.tierLevel,
                floor_preference: bridge.floorPreference,
                bathroom_count: Number(baseHouse.bathroomCount || 1),
                special_needs: bridge.specialNeeds,
            });

            const now = new Date().toISOString();
            const mergedHouse: Partial<HouseProfile> = {
                ...baseHouse,
                tierLevel: bridge.tierLevel,
                floorPreference: bridge.floorPreference,
                hasCeiling: bridge.hasCeiling,
                hasCustomCabinet: bridge.hasCustomCabinet,
                includeFurniture: bridge.includeFurniture,
                targetBudget: Number(baseHouse.targetBudget || 0) || bridge.suggestedBudgetWan! * 10000,
                updatedAt: now,
            };

            setCurrentHouse(mergedHouse);
            setBudgetResult(normalizeBudgetResult(calc, mergedHouse));
            Toast.show({ content: '已根据效果图更新预算方案', icon: 'success' });
            navigate('/budget-result');
        } catch (error: any) {
            Toast.show({ content: error.message || '自动生成预算失败，已跳转到预填页', icon: 'fail' });
            navigate('/quick-budget?from=design');
        } finally {
            setBridging(false);
        }
    };

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0369a1' }}>AI 效果图</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>上传实拍图，一键看改造参考</div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>
                            先做轻量版视觉预览，后续可升级为真实图生图模型。
                        </div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>
                        返回
                    </Button>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>设计参数</h3>
                        <span className="inline-pill">风格 + 房间类型</span>
                    </div>
                    <Form layout="vertical">
                        <Form.Item label="装修风格">
                            <Picker columns={[styleOptions]} value={[style]} onConfirm={(value) => setStyle(String(value[0]))}>
                                {(_, { open }) => (
                                    <div className="panel-card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={open}>
                                        {styleOptions.find((item) => item.value === style)?.label || style}
                                    </div>
                                )}
                            </Picker>
                        </Form.Item>
                        <Form.Item label="房间类型">
                            <Picker columns={[roomTypeOptions]} value={[roomType]} onConfirm={(value) => setRoomType(String(value[0]))}>
                                {(_, { open }) => (
                                    <div className="panel-card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={open}>
                                        {roomTypeOptions.find((item) => item.value === roomType)?.label || roomType}
                                    </div>
                                )}
                            </Picker>
                        </Form.Item>
                        <Form.Item label="结构约束模式">
                            <Picker
                                columns={[[
                                    { label: 'Canny 边缘约束', value: 'canny' },
                                    { label: 'Depth 深度约束', value: 'depth' },
                                    { label: 'MLSD 线框约束', value: 'mlsd' },
                                    { label: '不约束（自由生成）', value: 'none' },
                                ]]}
                                value={[controlMode]}
                                onConfirm={(value) => setControlMode(String(value[0]) as any)}
                            >
                                {(_, { open }) => (
                                    <div className="panel-card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={open}>
                                        {controlMode}
                                    </div>
                                )}
                            </Picker>
                        </Form.Item>
                        <Form.Item label={`结构保持强度（${strength.toFixed(2)}）`}>
                            <Slider
                                min={0.1}
                                max={1}
                                step={0.01}
                                value={strength}
                                onChange={(value) => setStrength(Number(value))}
                            />
                        </Form.Item>
                        <Form.Item label="色调偏好（可选）">
                            <Input placeholder="例如：暖白 + 木色" value={tone} onChange={setTone} clearable />
                        </Form.Item>
                        <Form.Item label="材质偏好（可选）">
                            <Input placeholder="例如：岩板台面、木地板" value={material} onChange={setMaterial} clearable />
                        </Form.Item>
                        <Form.Item label="灯光氛围（可选）">
                            <Input placeholder="例如：无主灯、暖光" value={lighting} onChange={setLighting} clearable />
                        </Form.Item>
                    </Form>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>上传房间照片</h3>
                        <span className="inline-pill">建议白天拍摄</span>
                    </div>
                    <ImageUploader
                        value={fileList}
                        onChange={setFileList}
                        upload={uploadPreview}
                        maxCount={1}
                        capture="environment"
                    />
                    <div className="feature-desc" style={{ marginTop: 8 }}>
                        尽量包含完整墙面和地面，避免强烈逆光或过暗场景。
                    </div>
                    {favorites.length > 0 && (
                        <div className="note-card note-card--success" style={{ marginTop: 12 }}>
                            <div className="note-icon">收藏</div>
                            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                                已自动带入 {favorites.length} 张收藏灵感图特征到生成偏好。
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    block
                    color="primary"
                    shape="rounded"
                    loading={loading}
                    disabled={!fileList.length}
                    onClick={handleGenerate}
                >
                    生成 AI 效果图
                </Button>

                {loading && (
                    <div className="empty-card">
                        <DotLoading color="primary" />
                        <div className="empty-desc" style={{ marginTop: 10 }}>
                            正在生成效果图，请稍候...
                        </div>
                    </div>
                )}

                {result && (
                    <div className="section-card">
                        <div className="page-section-title">
                            <h3>生成结果</h3>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <Tag color="primary" fill="outline">{result.style}</Tag>
                                <Tag fill="outline">{result.room_type}</Tag>
                                <Tag fill="outline">{result.provider}</Tag>
                                <Tag fill="outline">{result.control_mode}</Tag>
                                <Tag fill="outline">强度 {Number(result.strength || 0).toFixed(2)}</Tag>
                            </div>
                        </div>
                        {result.note && (
                            <div className="note-card note-card--warning" style={{ marginBottom: 12 }}>
                                <div className="note-icon">提示</div>
                                <div style={{ fontSize: 13, lineHeight: 1.7 }}>{result.note}</div>
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                            <div className="panel-card" style={{ padding: 10 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>原始照片</div>
                                <Image src={result.source_image_url} width="100%" height={180} fit="cover" style={{ borderRadius: 12 }} />
                            </div>
                            <div className="panel-card" style={{ padding: 10 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>AI 效果图</div>
                                <Image src={result.generated_image_url} width="100%" height={180} fit="cover" style={{ borderRadius: 12 }} />
                            </div>
                        </div>
                        {result.prompt && (
                            <div className="feature-desc" style={{ marginTop: 10 }}>
                                Prompt：{result.prompt}
                            </div>
                        )}
                        <div className="action-row" style={{ marginTop: 12 }}>
                            <Button block color="primary" shape="rounded" loading={bridging} onClick={handleBridgeToBudget}>
                                一键回写预算方案
                            </Button>
                            <Button block fill="outline" shape="rounded" onClick={() => navigate('/quick-budget?from=design')}>
                                打开预算预填页
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
