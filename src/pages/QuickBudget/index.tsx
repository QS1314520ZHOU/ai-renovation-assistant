import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Form, Input, Picker, Button, Stepper, Switch, Toast, NavBar,
} from 'antd-mobile';
import { useProjectStore } from '@/store';
import { budgetApi } from '@/api/services';
import { getCityNames } from '@/engine/cityFactors';
import { HouseProfile, TierLevel } from '@/types';
import { v4 as uuid } from 'uuid';

const layoutOptions = [
    [
        { label: '1室1厅1卫', value: '1室1厅1卫' },
        { label: '2室1厅1卫', value: '2室1厅1卫' },
        { label: '2室2厅1卫', value: '2室2厅1卫' },
        { label: '3室1厅1卫', value: '3室1厅1卫' },
        { label: '3室2厅1卫', value: '3室2厅1卫' },
        { label: '3室2厅2卫', value: '3室2厅2卫' },
        { label: '4室2厅2卫', value: '4室2厅2卫' },
    ],
];

const tierOptions = [
    [
        { label: '经济档 - 实用为主', value: 'economy' },
        { label: '普通档 - 品质均衡', value: 'standard' },
        { label: '改善档 - 注重品质', value: 'premium' },
    ],
];

const floorOptions = [
    [
        { label: '全屋瓷砖', value: 'tile' },
        { label: '全屋木地板', value: 'wood' },
        { label: '混合（卧室木地板+其他瓷砖）', value: 'mixed' },
    ],
];

const cityOptions = [getCityNames().map(name => ({ label: name, value: name }))];

export default function QuickBudget() {
    const navigate = useNavigate();
    const { setCurrentHouse, setBudgetResult } = useProjectStore();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        city: '成都',
        innerArea: '',
        layout: '3室2厅1卫',
        tierLevel: 'standard' as TierLevel,
        floorPreference: 'mixed' as 'tile' | 'wood' | 'mixed',
        hasCeiling: true,
        hasCustomCabinet: true,
        includeFurniture: false,
        bathroomCount: 1,
        kitchenCount: 1,
        balconyCount: 1,
        targetBudget: '',
    });

    const updateForm = (key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
        // 户型变了自动更新卫生间数
        if (key === 'layout') {
            const match = (value as string).match(/(\d+)卫/);
            if (match) setForm(prev => ({ ...prev, [key]: value, bathroomCount: parseInt(match[1]) }));
        }
    };

    const handleCalculate = async () => {
        const innerArea = parseFloat(form.innerArea);
        if (!innerArea || innerArea < 20 || innerArea > 500) {
            Toast.show({ content: '请输入有效的套内面积（20-500㎡）', icon: 'fail' });
            return;
        }

        setLoading(true);

        try {
            const cityCodeMap: Record<string, string> = { '成都': '510100', '北京': '110100', '上海': '310100', '广州': '440100', '深圳': '440300' };
            const cityCode = cityCodeMap[form.city] || '510100';

            const result = await budgetApi.calculate({
                city_code: cityCode,
                inner_area: innerArea,
                layout_type: form.layout,
                tier: form.tierLevel,
                floor_preference: form.floorPreference,
                bathroom_count: form.bathroomCount,
            });

            if (result) {
                setBudgetResult(result);
                navigate('/budget-result');
            }
        } catch (error: any) {
            Toast.show({ content: '计算出错: ' + (error.message || '请重试'), icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                快速预算
            </NavBar>

            <div style={{ padding: '0 0 100px' }}>
                {/* 提示 */}
                <div style={{
                    margin: '12px 16px 0',
                    padding: '10px 14px',
                    background: '#EEF2FF',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#4338CA',
                    lineHeight: 1.5,
                }}>
                    💡 填写基本信息，3分钟内出预算。数据越完整结果越准确。
                </div>

                <Form layout="horizontal" style={{ '--border-top': 'none', marginTop: 12 } as any}>
                    {/* 城市 */}
                    <Form.Item label="所在城市" onClick={(_, pickerRef: any) => pickerRef.current?.open()}>
                        <Picker
                            columns={cityOptions}
                            value={[form.city]}
                            onConfirm={v => updateForm('city', v[0])}
                        >
                            {(_, { open }) => (
                                <div onClick={open} style={{ color: form.city ? 'var(--color-text)' : '#ccc' }}>
                                    {form.city || '请选择城市'}
                                </div>
                            )}
                        </Picker>
                    </Form.Item>

                    {/* 面积 */}
                    <Form.Item label="套内面积(㎡)">
                        <Input
                            type="number"
                            placeholder="如：89"
                            value={form.innerArea}
                            onChange={v => updateForm('innerArea', v)}
                            style={{ textAlign: 'right' }}
                        />
                    </Form.Item>

                    {/* 户型 */}
                    <Form.Item label="户型">
                        <Picker
                            columns={layoutOptions}
                            value={[form.layout]}
                            onConfirm={v => updateForm('layout', v[0])}
                        >
                            {(_, { open }) => (
                                <div onClick={open}>{form.layout}</div>
                            )}
                        </Picker>
                    </Form.Item>

                    {/* 档次 */}
                    <Form.Item label="装修档次">
                        <Picker
                            columns={tierOptions}
                            value={[form.tierLevel]}
                            onConfirm={v => updateForm('tierLevel', v[0])}
                        >
                            {(_, { open }) => (
                                <div onClick={open}>
                                    {tierOptions[0].find(o => o.value === form.tierLevel)?.label}
                                </div>
                            )}
                        </Picker>
                    </Form.Item>

                    {/* 地面 */}
                    <Form.Item label="地面偏好">
                        <Picker
                            columns={floorOptions}
                            value={[form.floorPreference]}
                            onConfirm={v => updateForm('floorPreference', v[0])}
                        >
                            {(_, { open }) => (
                                <div onClick={open}>
                                    {floorOptions[0].find(o => o.value === form.floorPreference)?.label}
                                </div>
                            )}
                        </Picker>
                    </Form.Item>

                    {/* 卫生间数 */}
                    <Form.Item label="卫生间数">
                        <Stepper min={1} max={4} value={form.bathroomCount}
                            onChange={v => updateForm('bathroomCount', v)} />
                    </Form.Item>

                    {/* 是否吊顶 */}
                    <Form.Item label="客厅做吊顶">
                        <Switch checked={form.hasCeiling}
                            onChange={v => updateForm('hasCeiling', v)} />
                    </Form.Item>

                    {/* 是否定制柜 */}
                    <Form.Item label="做定制衣柜">
                        <Switch checked={form.hasCustomCabinet}
                            onChange={v => updateForm('hasCustomCabinet', v)} />
                    </Form.Item>

                    {/* 目标预算 */}
                    <Form.Item label="目标预算(万元)" help="选填，用于判断是否超预算">
                        <Input
                            type="number"
                            placeholder="如：18"
                            value={form.targetBudget}
                            onChange={v => updateForm('targetBudget', v)}
                            style={{ textAlign: 'right' }}
                        />
                    </Form.Item>
                </Form>
            </div>

            {/* 底部按钮 */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                background: '#fff',
                borderTop: '1px solid var(--color-border)',
            }}>
                <Button
                    block
                    color="primary"
                    size="large"
                    shape="rounded"
                    loading={loading}
                    onClick={handleCalculate}
                    style={{ fontWeight: 600, fontSize: 16, height: 48 }}
                >
                    ✨ 生成预算报告
                </Button>
            </div>
        </div>
    );
}
