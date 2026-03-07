import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ProgressBar, DatePicker, Toast, Dialog, Tag } from 'antd-mobile';
import { useConstructionStore, useProjectStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { formatMoney } from '@/utils/format';
import dayjs from 'dayjs';
import { GanttView } from '@/components/GanttView';

export default function Construction() {
    const navigate = useNavigate();
    const { projectId, phases, currentPhase, startDate, initProject, updatePhase, completePhase, getPhaseProgress, getTotalSpent } = useConstructionStore();
    const { currentHouse } = useProjectStore();
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

    // 未初始化 → 显示开工引导
    if (!projectId) {
        return (
            <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>
                <div style={{ padding: '16px', background: '#fff', borderBottom: '1px solid var(--color-border)' }}>
                    <h1 style={{ fontSize: 18, fontWeight: 600 }}>施工陪跑</h1>
                </div>
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 20 }}>🏗️</div>
                    <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>准备开工了？</h2>
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                        设置开工日期后，系统会自动生成施工时间线、采购提醒和各阶段验收清单，帮你全程跟进装修进度。
                    </p>
                    <Button block color="primary" onClick={() => setShowDatePicker(true)}>
                        选择开工日期，开始记录 →
                    </Button>
                    <DatePicker
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onConfirm={val => {
                            const dateStr = dayjs(val).format('YYYY-MM-DD');
                            initProject(currentHouse?.id || 'default', dateStr);
                            Toast.show({ content: '施工项目已创建！', icon: 'success' });
                            setShowDatePicker(false);
                        }}
                        min={new Date(2024, 0, 1)}
                        max={new Date(2028, 11, 31)}
                    />
                </div>
            </div>
        );
    }

    // 已初始化 → 显示施工面板
    const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
    const currentPhaseInfo = PHASE_LIST.find(p => p.phase === currentPhase);
    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const totalPhases = phases.filter(p => (p as any).key !== 'warranty').length;
    const overallPercent = Math.round(completedPhases / totalPhases * 100);
    const totalSpent = getTotalSpent();
    const daysElapsed = Math.max(0, dayjs().diff(dayjs(startDate), 'day'));

    // 增项预警逻辑：如果支出超过目标预算的 110%，显示严重预警
    const isOverBudget = currentHouse?.targetBudget && totalSpent > currentHouse.targetBudget;
    const isSevereWarning = currentHouse?.targetBudget && totalSpent > (currentHouse.targetBudget * 1.1);

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                padding: '20px',
                color: '#fff',
            }}>
                <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>施工陪跑</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>当前阶段</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                            {currentPhaseInfo?.icon} {currentPhaseInfo?.name}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>已开工</div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{daysElapsed}天</div>
                    </div>
                </div>
                <ProgressBar
                    percent={overallPercent}
                    style={{
                        '--fill-color': '#fff',
                        '--track-color': 'rgba(255,255,255,0.3)',
                        '--track-width': '8px',
                    } as any}
                />
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                    总体进度 {overallPercent}%（{completedPhases}/{totalPhases}个阶段）
                </div>
            </div>

            {/* 增项预警 */}
            {isOverBudget && (
                <div style={{
                    margin: 12,
                    padding: '10px 16px',
                    background: isSevereWarning ? '#FEF2F2' : '#FFFBEB',
                    border: `1px solid ${isSevereWarning ? '#FCA5A5' : '#FCD34D'}`,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                }}>
                    <span style={{ fontSize: 20 }}>{isSevereWarning ? '🚨' : '⚠️'}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isSevereWarning ? '#991B1B' : '#92400E' }}>
                            {isSevereWarning ? '支出严重超支提醒' : '预算执行预警'}
                        </div>
                        <div style={{ fontSize: 12, color: isSevereWarning ? '#B91C1C' : '#B45309', marginTop: 2 }}>
                            当前支出已达 {formatMoney(totalSpent)}，{isSevereWarning ? '已超过目标预算 10% 以上，请严格把控增项！' : '已超出目标预算，请关注后续大件采购支出。'}
                        </div>
                    </div>
                </div>
            )}

            {/* 快捷操作 */}
            <div style={{ display: 'flex', gap: 10, padding: '16px', overflowX: 'auto' }}>
                {[
                    { label: '验收清单', icon: '✅', path: '/construction/checklist' },
                    { label: 'AI验收', icon: '🔍', path: '/construction/ai-inspect' },
                    { label: '采购清单', icon: '🛒', path: '/construction/purchases' },
                    { label: '记录日志', icon: '📝', path: '/construction/log' },
                    { label: '付款记录', icon: '💰', path: '/construction/payments' },
                ].map((action: any) => (
                    <div key={action.label}
                        onClick={() => navigate(action.path)}
                        style={{
                            minWidth: 80,
                            padding: '14px 12px',
                            background: '#fff',
                            borderRadius: 12,
                            textAlign: 'center',
                            boxShadow: 'var(--shadow-sm)',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>{action.icon}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{action.label}</div>
                    </div>
                ))}
            </div>

            {/* 费用概览 */}
            {totalSpent > 0 && (
                <div style={{ margin: '0 16px 16px', padding: 16, background: '#fff', borderRadius: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>💰 已支出</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>{formatMoney(totalSpent)}</div>
                    {currentHouse?.targetBudget && (
                        <div style={{ marginTop: 8 }}>
                            <ProgressBar
                                percent={Math.min(100, Math.round(totalSpent / currentHouse.targetBudget * 100))}
                                style={{
                                    '--fill-color': totalSpent > currentHouse.targetBudget ? '#EF4444' : 'var(--color-primary)',
                                    '--track-width': '6px',
                                } as any}
                            />
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                目标预算 {formatMoney(currentHouse.targetBudget)}，已用 {Math.round(totalSpent / currentHouse.targetBudget * 100)}%
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 阶段展示切换 */}
            <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>施工进度</h3>
                <div style={{ background: '#E5E7EB', padding: 2, borderRadius: 6, display: 'flex' }}>
                    <div
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: '4px 12px',
                            fontSize: 12,
                            borderRadius: 4,
                            background: viewMode === 'list' ? '#fff' : 'transparent',
                            boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer'
                        }}>清单</div>
                    <div
                        onClick={() => setViewMode('gantt')}
                        style={{
                            padding: '4px 12px',
                            fontSize: 12,
                            borderRadius: 4,
                            background: viewMode === 'gantt' ? '#fff' : 'transparent',
                            boxShadow: viewMode === 'gantt' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer'
                        }}>甘特图</div>
                </div>
            </div>

            {viewMode === 'gantt' ? (
                <GanttView startDate={startDate!} phases={phases as any} currentPhase={currentPhase} />
            ) : (
                <div style={{ padding: '0 16px' }}>
                    {PHASE_LIST.filter(p => p.phase !== 'warranty').map((phaseInfo, idx) => {
                        const record = phases.find(p => p.phase === phaseInfo.phase);
                        const progress = getPhaseProgress(phaseInfo.phase);
                        const isActive = currentPhase === phaseInfo.phase;
                        const isCompleted = record?.status === 'completed';

                        return (
                            <div key={phaseInfo.phase} style={{
                                display: 'flex',
                                gap: 12,
                                marginBottom: 4,
                            }}>
                                {/* 时间线左侧 */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
                                    <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: isCompleted ? '#10B981' : isActive ? 'var(--color-primary)' : '#E5E7EB',
                                        color: isCompleted || isActive ? '#fff' : '#9CA3AF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        flexShrink: 0,
                                    }}>
                                        {isCompleted ? '✓' : phaseInfo.icon}
                                    </div>
                                    {idx < PHASE_LIST.length - 2 && (
                                        <div style={{
                                            width: 2,
                                            flex: 1,
                                            minHeight: 40,
                                            background: isCompleted ? '#10B981' : '#E5E7EB',
                                        }} />
                                    )}
                                </div>

                                {/* 阶段卡片 */}
                                <div
                                    onClick={() => {
                                        if (isActive || isCompleted) {
                                            navigate(`/construction/checklist/${phaseInfo.phase}`);
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        background: isActive ? '#EEF2FF' : '#fff',
                                        borderRadius: 10,
                                        padding: '12px 14px',
                                        marginBottom: 8,
                                        border: isActive ? '1px solid #C7D2FE' : '1px solid var(--color-border)',
                                        cursor: (isActive || isCompleted) ? 'pointer' : 'default',
                                        opacity: record?.status === 'pending' ? 0.6 : 1,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>{phaseInfo.name}</span>
                                        {isCompleted && <Tag color="success" fill="outline" style={{ fontSize: 10 }}>已完成</Tag>}
                                        {isActive && <Tag color="primary" fill="outline" style={{ fontSize: 10 }}>进行中</Tag>}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                        {phaseInfo.description}
                                    </div>
                                    {(isActive || isCompleted) && progress.total > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <ProgressBar
                                                percent={progress.percent}
                                                style={{ '--track-width': '4px', '--fill-color': isCompleted ? '#10B981' : 'var(--color-primary)' } as any}
                                            />
                                            <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 2 }}>
                                                验收清单 {progress.completed}/{progress.total}
                                            </div>
                                        </div>
                                    )}

                                    {/* 当前阶段额外操作 */}
                                    {isActive && (
                                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                            <Button size="mini" color="primary" fill="outline"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/construction/checklist/${phaseInfo.phase}`); }}>
                                                验收清单
                                            </Button>
                                            <Button size="mini" color="success" fill="solid"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    Dialog.confirm({
                                                        content: `确认「${phaseInfo.name}」已完成？建议先完成验收清单再确认。`,
                                                        onConfirm: () => {
                                                            completePhase(phaseInfo.phase);
                                                            Toast.show({ content: `${phaseInfo.name}已完成！`, icon: 'success' });
                                                        },
                                                    });
                                                }}>
                                                完成此阶段
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ height: 40 }} />
        </div>
    );
}
