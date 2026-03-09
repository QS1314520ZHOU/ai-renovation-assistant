import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Collapse, DotLoading, Tabs, Tag, Toast } from 'antd-mobile'
import ReactECharts from 'echarts-for-react'

import { useProjectStore } from '@/store'
import { useGlossaryStore } from '@/store/glossaryStore'
import { BudgetResult as BudgetResultType, BudgetScheme, HouseProfile, TierLevel } from '@/types'
import { categoryLabel, formatArea, formatMoney, tierLevelLabel } from '@/utils/format'
import TermItem from '@/components/Glossary/TermItem'
import FeedbackWidget from '@/components/Feedback/FeedbackWidget'

function parseLayout(layout: string) {
    const match = layout.match(/(\d)室(\d)厅(\d)卫/)
    return {
        bedroomCount: match ? Number(match[1]) : 3,
        livingRoomCount: match ? Number(match[2]) : 2,
        bathroomCount: match ? Number(match[3]) : 1,
    }
}

function toProjectSnapshot(house: Partial<HouseProfile>): HouseProfile {
    const now = new Date().toISOString()
    const parsed = parseLayout(house.layout || '3室2厅1卫')
    return {
        id: house.id || crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10),
        projectName: house.projectName || `${house.city || '未命名'}${house.layout || ''}装修预算`,
        city: house.city || '成都',
        grossArea: house.grossArea || Math.round((house.innerArea || 0) * 1.22),
        innerArea: house.innerArea || 0,
        layout: house.layout || '3室2厅1卫',
        bedroomCount: house.bedroomCount || parsed.bedroomCount,
        livingRoomCount: house.livingRoomCount || parsed.livingRoomCount,
        bathroomCount: house.bathroomCount || parsed.bathroomCount,
        kitchenCount: house.kitchenCount || 1,
        balconyCount: house.balconyCount || 1,
        floorHeight: house.floorHeight || 2.8,
        houseType: house.houseType || 'new_blank',
        purpose: house.purpose || 'self_use',
        targetBudget: house.targetBudget || 0,
        familyMembers: house.familyMembers || { hasElderly: false, hasChildren: false, hasPets: false },
        tierLevel: house.tierLevel || 'standard',
        floorPreference: house.floorPreference || 'tile',
        hasCeiling: Boolean(house.hasCeiling),
        hasCustomCabinet: Boolean(house.hasCustomCabinet),
        includeFurniture: Boolean(house.includeFurniture),
        createdAt: house.createdAt || now,
        updatedAt: now,
    }
}

export default function BudgetResult() {
    const navigate = useNavigate()
    const { budgetResult, currentHouse, saveProject } = useProjectStore()
    const { init: initGlossary } = useGlossaryStore()
    const [activeTier, setActiveTier] = useState<TierLevel>((currentHouse?.tierLevel as TierLevel) || 'standard')

    useEffect(() => {
        initGlossary()
    }, [initGlossary])

    if (!budgetResult || !currentHouse) {
        return (
            <div className="page-shell page-shell--no-tabbar">
                <div className="page-stack">
                    <div className="empty-card">
                        <div className="empty-title">还没有预算结果</div>
                        <div className="empty-desc">先去 AI 咨询或直接填表算，系统生成预算后会展示在这里。</div>
                        <div style={{ marginTop: 18 }}>
                            <Button color="primary" shape="rounded" onClick={() => navigate('/ai-consult')}>
                                去生成预算
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const house = currentHouse as Partial<HouseProfile>
    const scheme = (budgetResult.schemes || []).find((item) => item.tier === activeTier)
        || budgetResult.standard
        || budgetResult.schemes?.[0] as BudgetScheme | undefined

    if (!scheme) {
        return (
            <div className="page-shell page-shell--no-tabbar">
                <div className="page-stack">
                    <div className="empty-card"><DotLoading color="primary" /></div>
                </div>
            </div>
        )
    }

    const categoryTotals = useMemo(() => {
        const map = new Map<string, number>()
        scheme.items.forEach((item) => {
            map.set(item.category, (map.get(item.category) || 0) + Number(item.subtotal || 0))
        })
        return Array.from(map.entries())
            .map(([category, total]) => ({ category, label: categoryLabel(category), total }))
            .sort((a, b) => b.total - a.total)
    }, [scheme])

    const topCategory = categoryTotals[0]
    const unitPrice = Math.round(Number(scheme.total_amount || 0) / Math.max(Number(house.innerArea || 1), 1))

    const pieOption = {
        tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 元 ({d}%)' },
        color: ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#0EA5E9', '#14B8A6'],
        series: [
            {
                type: 'pie',
                radius: ['42%', '72%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 4 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 12, fontWeight: 700 } },
                data: categoryTotals.map((item) => ({ name: item.label, value: item.total })),
            },
        ],
    }

    const saveCurrentProject = () => {
        saveProject(toProjectSnapshot(house))
        Toast.show({ content: '已保存到我的项目', icon: 'success' })
    }

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-hero page-hero--indigo">
                    <div className="page-kicker">预算结果</div>
                    <div className="page-title" style={{ marginTop: 16 }}>
                        {tierLevelLabel(activeTier)} · {formatMoney(Number(scheme.total_amount || 0))}
                    </div>
                    <div className="page-subtitle" style={{ marginTop: 12 }}>
                        {house.city} · {house.layout} · 套内 {formatArea(Number(house.innerArea || 0))} · 约 {unitPrice} 元/㎡
                    </div>
                    <div className="stats-grid" style={{ marginTop: 18 }}>
                        <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                            <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>目标预算</div>
                            <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>
                                {house.targetBudget ? formatMoney(Number(house.targetBudget)) : '未填写'}
                            </div>
                        </div>
                        <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                            <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>最大占比</div>
                            <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>
                                {topCategory ? topCategory.label : '—'}
                            </div>
                        </div>
                    </div>
                </div>

                {budgetResult.overBudget && activeTier === house.tierLevel && (
                    <div className="note-card note-card--danger">
                        <div className="note-icon">⚠️</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>当前方案超预算</div>
                            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                                超出 {formatMoney(Number(budgetResult.overBudgetAmount || 0))}。建议切换档次、压缩定制柜或家具家电范围，再重新测一版。
                            </div>
                        </div>
                    </div>
                )}

                <div className="section-card">
                    <Tabs activeKey={activeTier} onChange={(key) => setActiveTier(key as TierLevel)}>
                        <Tabs.Tab key="economy" title="经济档" />
                        <Tabs.Tab key="standard" title="标准档" />
                        <Tabs.Tab key="premium" title="品质档" />
                    </Tabs>
                </div>

                <div className="metric-grid">
                    <div className="metric-card">
                        <div className="metric-label">材料费</div>
                        <div className="metric-value" style={{ marginTop: 8 }}>{formatMoney(Number(scheme.material_amount || 0))}</div>
                        <div className="metric-desc">主材、辅材与损耗</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">人工费</div>
                        <div className="metric-value" style={{ marginTop: 8 }}>{formatMoney(Number(scheme.labor_amount || 0))}</div>
                        <div className="metric-desc">按当前城市系数估算</div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">管理 + 预备</div>
                        <div className="metric-value" style={{ marginTop: 8 }}>{formatMoney(Number(scheme.management_fee || 0) + Number(scheme.contingency || 0))}</div>
                        <div className="metric-desc">现场管理与预算浮动</div>
                    </div>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>预算结构</h3>
                        <span className="inline-pill">分类占比</span>
                    </div>
                    <ReactECharts option={pieOption} style={{ height: 280 }} />
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>分类明细</h3>
                        <span className="inline-pill">{categoryTotals.length} 个分类</span>
                    </div>
                    <Collapse accordion>
                        {categoryTotals.map((category) => (
                            <Collapse.Panel
                                key={category.category}
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingRight: 8 }}>
                                        <span style={{ fontWeight: 700 }}>{category.label}</span>
                                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{formatMoney(category.total)}</span>
                                    </div>
                                }
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {scheme.items.filter((item) => item.category === category.category).map((item) => (
                                        <div key={item.id} className="panel-card" style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 700, color: 'var(--color-text)' }}><TermItem name={item.item_name} /></span>
                                                        <Tag color="primary" fill="outline" style={{ fontSize: 10 }}>{item.unit}</Tag>
                                                    </div>
                                                    <div className="feature-desc" style={{ marginTop: 6 }}>
                                                        {item.quantity}{item.unit} × {formatMoney(Number(item.material_unit_price || 0) + Number(item.labor_unit_price || 0) + Number(item.accessory_unit_price || 0))}/{item.unit}
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 800, color: 'var(--color-text)', flexShrink: 0, textAlign: 'right' }}>
                                                    {formatMoney(Number(item.subtotal || 0))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Collapse.Panel>
                        ))}
                    </Collapse>
                </div>

                {Array.isArray((budgetResult as BudgetResultType).suggestions) && budgetResult.suggestions.length > 0 && (
                    <div className="section-card">
                        <div className="page-section-title">
                            <h3>优化建议</h3>
                            <span className="inline-pill">落地提醒</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {budgetResult.suggestions.map((item, index) => (
                                <div key={`${item}-${index}`} className="note-card note-card--warning">
                                    <div className="note-icon">💡</div>
                                    <div style={{ fontSize: 13, lineHeight: 1.7 }}>{item}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {Array.isArray((budgetResult as BudgetResultType).missingItems) && budgetResult.missingItems.length > 0 && (
                    <div className="section-card">
                        <div className="page-section-title">
                            <h3>查漏项提醒</h3>
                            <span className="inline-pill">{budgetResult.missingItems.length} 条</span>
                        </div>
                        <div className="muted-text" style={{ fontSize: 13, marginBottom: 12 }}>
                            预算之外，系统还识别出一些施工中容易被漏掉或后补的项目，建议单独检查一遍。
                        </div>
                        <Button color="primary" fill="outline" shape="rounded" onClick={() => navigate('/missing-check')}>
                            去看查漏项
                        </Button>
                    </div>
                )}

                <div className="action-row">
                    <Button block color="primary" shape="rounded" onClick={saveCurrentProject}>
                        保存到我的项目
                    </Button>
                    <Button block fill="outline" shape="rounded" onClick={() => navigate('/quick-budget')}>
                        重新填写
                    </Button>
                </div>

                <FeedbackWidget type="budget" />
            </div>
        </div>
    )
}
