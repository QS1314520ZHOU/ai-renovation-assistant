import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Form, Input, Picker, Button, Stepper, Switch, Toast } from 'antd-mobile'
import { v4 as uuid } from 'uuid'

import { budgetApi } from '@/api/services'
import { DesignBudgetBridge } from '@/engine/designBudgetBridge'
import { useDesignStore, useProjectStore } from '@/store'
import { BudgetResult, HouseProfile, TierLevel } from '@/types'

const cityOptions = [[
    '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '重庆', '西安',
].map((name) => ({ label: name, value: name }))]

const layoutOptions = [[
    { label: '2 室 1 厅 1 卫', value: '2室1厅1卫' },
    { label: '2 室 2 厅 1 卫', value: '2室2厅1卫' },
    { label: '3 室 1 厅 1 卫', value: '3室1厅1卫' },
    { label: '3 室 2 厅 1 卫', value: '3室2厅1卫' },
    { label: '3 室 2 厅 2 卫', value: '3室2厅2卫' },
    { label: '4 室 2 厅 2 卫', value: '4室2厅2卫' },
]]

const tierOptions = [[
    { label: '经济档 · 先住进去', value: 'economy' },
    { label: '标准档 · 主流实用', value: 'standard' },
    { label: '品质档 · 质感升级', value: 'premium' },
]]

const floorOptions = [[
    { label: '全屋瓷砖', value: 'tile' },
    { label: '卧室木地板', value: 'mixed' },
    { label: '更多木地板', value: 'wood' },
]]

function parseLayout(layout: string) {
    const match = layout.match(/(\d)室(\d)厅(\d)卫/)
    return {
        bedroomCount: match ? Number(match[1]) : 3,
        livingRoomCount: match ? Number(match[2]) : 2,
        bathroomCount: match ? Number(match[3]) : 1,
    }
}

function normalizeBudgetResult(result: any, house: Partial<HouseProfile>): BudgetResult {
    const schemes = Array.isArray(result?.schemes) ? result.schemes : []
    const economy = schemes.find((item: any) => item.tier === 'economy')
    const standard = schemes.find((item: any) => item.tier === 'standard')
    const premium = schemes.find((item: any) => item.tier === 'premium')
    const selectedScheme = schemes.find((item: any) => item.tier === house.tierLevel) || standard || schemes[0]
    const targetBudget = Number(house.targetBudget || 0)
    const actualTotal = Number(selectedScheme?.total_amount || 0)
    const overBudget = targetBudget > 0 && actualTotal > targetBudget

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
    } as BudgetResult
}

export default function QuickBudget() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { setCurrentHouse, setBudgetResult } = useProjectStore()
    const { budgetBridge, consumeBudgetBridge } = useDesignStore()
    const [loading, setLoading] = useState(false)
    const [bridgeHint, setBridgeHint] = useState<DesignBudgetBridge | null>(null)
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
    })

    useEffect(() => {
        if (!budgetBridge) return
        setBridgeHint(budgetBridge)
        setForm((prev) => ({
            ...prev,
            tierLevel: budgetBridge.tierLevel,
            floorPreference: budgetBridge.floorPreference,
            hasCeiling: budgetBridge.hasCeiling,
            hasCustomCabinet: budgetBridge.hasCustomCabinet,
            includeFurniture: budgetBridge.includeFurniture,
            targetBudget: prev.targetBudget || (budgetBridge.suggestedBudgetWan ? String(budgetBridge.suggestedBudgetWan) : ''),
        }))
        consumeBudgetBridge()
    }, [budgetBridge, consumeBudgetBridge])

    const layoutInfo = useMemo(() => parseLayout(form.layout), [form.layout])
    const isBridgeFlow = searchParams.get('from') === 'design'

    const updateForm = (key: string, value: any) => {
        setForm((prev) => {
            const next = { ...prev, [key]: value }
            if (key === 'layout') {
                const parsed = parseLayout(String(value))
                next.bathroomCount = parsed.bathroomCount
            }
            return next
        })
    }

    const handleCalculate = async () => {
        const innerArea = Number(form.innerArea)
        if (!innerArea || innerArea < 20 || innerArea > 500) {
            Toast.show({ content: '请输入 20 到 500 ㎡之间的套内面积', icon: 'fail' })
            return
        }

        setLoading(true)
        try {
            const now = new Date().toISOString()
            const house: HouseProfile = {
                id: uuid(),
                projectName: `${form.city}${form.layout}装修预算`,
                city: form.city,
                grossArea: Math.round(innerArea * 1.22),
                innerArea,
                layout: form.layout,
                bedroomCount: layoutInfo.bedroomCount,
                livingRoomCount: layoutInfo.livingRoomCount,
                bathroomCount: form.bathroomCount,
                kitchenCount: form.kitchenCount,
                balconyCount: form.balconyCount,
                floorHeight: 2.8,
                houseType: 'new_blank',
                purpose: 'self_use',
                targetBudget: form.targetBudget ? Math.round(Number(form.targetBudget) * 10000) : 0,
                familyMembers: {
                    hasElderly: false,
                    hasChildren: false,
                    hasPets: false,
                },
                tierLevel: form.tierLevel,
                floorPreference: form.floorPreference,
                hasCeiling: form.hasCeiling,
                hasCustomCabinet: form.hasCustomCabinet,
                includeFurniture: form.includeFurniture,
                createdAt: now,
                updatedAt: now,
            }

            const specialNeeds: string[] = []
            if (form.hasCeiling) specialNeeds.push('吊顶')
            if (form.hasCustomCabinet) specialNeeds.push('定制柜')
            if (form.includeFurniture) specialNeeds.push('含家具家电')

            const result = await budgetApi.calculate({
                city_name: form.city,
                inner_area: innerArea,
                layout_type: form.layout,
                tier: form.tierLevel,
                floor_preference: form.floorPreference,
                bathroom_count: form.bathroomCount,
                special_needs: specialNeeds,
            })

            setCurrentHouse(house)
            setBudgetResult(normalizeBudgetResult(result, house))
            Toast.show({ content: '预算生成成功，正在打开结果页', icon: 'success' })
            navigate('/budget-result')
        } catch (error: any) {
            Toast.show({ content: `预算生成失败：${error.message || '请稍后再试'}`, icon: 'fail' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-hero page-hero--emerald">
                    <div className="page-kicker">直接填表算</div>
                    <div className="page-title" style={{ marginTop: 16 }}>3 分钟填完，直接拿到装修预算</div>
                    <div className="page-subtitle" style={{ marginTop: 12, maxWidth: 720 }}>
                        适合已经知道房屋基础信息的情况。系统会按城市、面积、户型和档次快速生成三档预算结果。
                    </div>
                </div>

                <div className="note-card note-card--success">
                    <div className="note-icon">✨</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>推荐填写顺序</div>
                        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                            先确定面积、户型和预算范围，再补充地面偏好、柜体和家具需求，结果会更接近真实落地成本。
                        </div>
                    </div>
                </div>

                {(bridgeHint || isBridgeFlow) && (
                    <div className="note-card note-card--warning">
                        <div className="note-icon">🔁</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>已进入预算闭环预填</div>
                            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                                {bridgeHint?.summary || '已从视觉入口带入部分参数，请确认面积和户型后生成预算。'}
                            </div>
                        </div>
                    </div>
                )}

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>房屋信息</h3>
                        <span className="inline-pill">基础必填</span>
                    </div>
                    <Form layout="vertical">
                        <Form.Item label="城市">
                            <Picker columns={cityOptions} value={[form.city]} onConfirm={(value) => updateForm('city', value[0])}>
                                {(_, { open }) => (
                                    <div className="panel-card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={open}>
                                        {form.city}
                                    </div>
                                )}
                            </Picker>
                        </Form.Item>

                        <Form.Item label="套内面积（㎡）" help="建议按房本或量房结果填写">
                            <Input type="number" placeholder="例如 89" value={form.innerArea} onChange={(value) => updateForm('innerArea', value)} clearable />
                        </Form.Item>

                        <Form.Item label="户型">
                            <Picker columns={layoutOptions} value={[form.layout]} onConfirm={(value) => updateForm('layout', value[0])}>
                                {(_, { open }) => (
                                    <div className="panel-card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={open}>
                                        {layoutOptions[0].find((item) => item.value === form.layout)?.label || form.layout}
                                    </div>
                                )}
                            </Picker>
                        </Form.Item>

                        <Form.Item label="装修档次">
                            <Picker columns={tierOptions} value={[form.tierLevel]} onConfirm={(value) => updateForm('tierLevel', value[0])}>
                                {(_, { open }) => (
                                    <div className="panel-card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={open}>
                                        {tierOptions[0].find((item) => item.value === form.tierLevel)?.label}
                                    </div>
                                )}
                            </Picker>
                        </Form.Item>
                    </Form>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>偏好与选配</h3>
                        <span className="inline-pill">影响精度</span>
                    </div>
                    <Form layout="vertical">
                        <Form.Item label="地面偏好">
                            <Picker columns={floorOptions} value={[form.floorPreference]} onConfirm={(value) => updateForm('floorPreference', value[0])}>
                                {(_, { open }) => (
                                    <div className="panel-card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={open}>
                                        {floorOptions[0].find((item) => item.value === form.floorPreference)?.label}
                                    </div>
                                )}
                            </Picker>
                        </Form.Item>

                        <Form.Item label="卫生间数量">
                            <Stepper min={1} max={4} value={form.bathroomCount} onChange={(value) => updateForm('bathroomCount', value)} />
                        </Form.Item>

                        <Form.Item label="厨房数量">
                            <Stepper min={1} max={3} value={form.kitchenCount} onChange={(value) => updateForm('kitchenCount', value)} />
                        </Form.Item>

                        <Form.Item label="阳台数量">
                            <Stepper min={0} max={3} value={form.balconyCount} onChange={(value) => updateForm('balconyCount', value)} />
                        </Form.Item>

                        <Form.Item label="计划总预算（万元）" help="不填也能生成，填了会自动判断是否超预算">
                            <Input type="number" placeholder="例如 18" value={form.targetBudget} onChange={(value) => updateForm('targetBudget', value)} clearable />
                        </Form.Item>

                        <Form.Item label="包含吊顶">
                            <Switch checked={form.hasCeiling} onChange={(value) => updateForm('hasCeiling', value)} />
                        </Form.Item>

                        <Form.Item label="包含定制柜">
                            <Switch checked={form.hasCustomCabinet} onChange={(value) => updateForm('hasCustomCabinet', value)} />
                        </Form.Item>

                        <Form.Item label="包含家具家电">
                            <Switch checked={form.includeFurniture} onChange={(value) => updateForm('includeFurniture', value)} />
                        </Form.Item>
                    </Form>
                </div>

                <div className="stats-grid">
                    <div className="metric-card">
                        <div className="metric-label">户型拆解</div>
                        <div className="metric-value" style={{ marginTop: 8 }}>{layoutInfo.bedroomCount} / {layoutInfo.livingRoomCount} / {layoutInfo.bathroomCount}</div>
                        <div className="metric-desc">室 / 厅 / 卫</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">默认建筑面积</div>
                        <div className="metric-value" style={{ marginTop: 8 }}>{form.innerArea ? Math.round(Number(form.innerArea) * 1.22) : '--'}</div>
                        <div className="metric-desc">按套内面积约算</div>
                    </div>
                </div>

                <div className="action-row">
                    <Button block color="primary" shape="rounded" loading={loading} onClick={handleCalculate}>
                        生成预算结果
                    </Button>
                    <Button block fill="outline" shape="rounded" onClick={() => navigate('/ai-consult')}>
                        改用 AI 咨询
                    </Button>
                </div>
            </div>
        </div>
    )
}
