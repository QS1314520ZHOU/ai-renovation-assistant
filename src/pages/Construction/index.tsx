import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ProgressBar, DatePicker, Toast, Dialog, Tag } from 'antd-mobile';
import dayjs from 'dayjs';
import { useConstructionStore, useProjectStore } from '@/store';
import { projectApi } from '@/api/services';
import { PHASE_LIST } from '@/engine/constructionData';
import { formatMoney } from '@/utils/format';
import { GanttView } from '@/components/GanttView';
import { FloorPlanView } from '@/components/FloorPlanView';

const actions = [
    { label: '验收清单', icon: '✅', path: '/construction/checklist' },
    { label: '采购清单', icon: '🛒', path: '/construction/purchases' },
    { label: '施工日志', icon: '📝', path: '/construction/log' },
    { label: '付款记录', icon: '💰', path: '/construction/payments' },
    { label: 'AI 验收', icon: '🔍', path: '/construction/ai-inspect' },
    { label: '竣工收尾', icon: '🏁', path: '/construction/post' },
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CITY_CODE_MAP: Record<string, string> = {
    北京: '110100',
    上海: '310100',
    广州: '440100',
    深圳: '440300',
    杭州: '330100',
    武汉: '420100',
    重庆: '500100',
    成都: '510100',
};

export default function Construction() {
    const navigate = useNavigate();
    const {
        projectId,
        phases,
        currentPhase,
        startDate,
        initProject,
        syncProject,
        completePhase,
        getPhaseProgress,
        getTotalSpent,
    } = useConstructionStore();
    const { currentHouse, updateCurrentHouse } = useProjectStore();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'gantt' | 'plan'>('list');

    useEffect(() => {
        if (!projectId) return;
        void syncProject(projectId);
    }, [projectId, syncProject]);

    const ensureProjectId = async (): Promise<string> => {
        const candidate = String(currentHouse?.id || '').trim();
        if (candidate && UUID_REGEX.test(candidate)) {
            try {
                const project = await projectApi.get(candidate);
                return project.id;
            } catch {
                // Fallback to creating a new project.
            }
        }

        const cityName = currentHouse?.city || '成都';
        const created = await projectApi.create({
            name: currentHouse?.projectName || `${cityName}装修项目`,
            city_code: CITY_CODE_MAP[cityName] || '510100',
            city_name: cityName,
            target_budget: currentHouse?.targetBudget || undefined,
        });
        updateCurrentHouse({ id: created.id });
        return created.id;
    };

    if (!projectId) {
        return (
            <div className="page-shell">
                <div className="page-stack">
                    <div className="page-hero page-hero--emerald">
                        <div className="page-kicker">施工陪跑</div>
                        <div className="page-title" style={{ marginTop: 16 }}>准备开工了？先把项目建起来</div>
                        <div className="page-subtitle" style={{ marginTop: 12, maxWidth: 640 }}>
                            设置开工日期后，系统会自动生成施工时间线、采购提醒和分阶段验收清单。
                        </div>
                        <div style={{ marginTop: 18 }}>
                            <Button color="primary" shape="rounded" onClick={() => setShowDatePicker(true)}>
                                选择开工日期
                            </Button>
                        </div>
                    </div>
                    <DatePicker
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onConfirm={async (value) => {
                            const dateString = dayjs(value).format('YYYY-MM-DD');
                            try {
                                const resolvedProjectId = await ensureProjectId();
                                initProject(resolvedProjectId, dateString);
                                Toast.show({ content: '施工项目已创建并同步到数据库', icon: 'success' });
                            } catch (error: any) {
                                Toast.show({ content: `创建施工项目失败：${error.message || ''}`, icon: 'fail' });
                            } finally {
                                setShowDatePicker(false);
                            }
                        }}
                        min={new Date(2024, 0, 1)}
                        max={new Date(2028, 11, 31)}
                    />
                </div>
            </div>
        );
    }

    const visiblePhases = PHASE_LIST.filter((item) => item.phase !== 'warranty');
    const currentPhaseInfo = visiblePhases.find((item) => item.phase === currentPhase);
    const completedPhases = phases.filter((item) => item.status === 'completed' && item.phase !== 'warranty').length;
    const totalPhases = visiblePhases.length;
    const overallPercent = Math.round((completedPhases / Math.max(totalPhases, 1)) * 100);
    const totalSpent = getTotalSpent();
    const daysElapsed = startDate ? Math.max(0, dayjs().diff(dayjs(startDate), 'day')) : 0;
    const targetBudget = currentHouse?.targetBudget || 0;
    const isOverBudget = targetBudget > 0 && totalSpent > targetBudget;
    const isSevereWarning = targetBudget > 0 && totalSpent > targetBudget * 1.1;

    const phaseAvg = (relatedPhases: string[]) => {
        const values = relatedPhases.map((phase) => getPhaseProgress(phase).percent);
        const base = values.length ? Math.round(values.reduce((sum, item) => sum + item, 0) / values.length) : 0;
        return Math.max(base, overallPercent > 0 && currentPhase !== 'pre_construction' ? Math.min(25, base + 10) : base);
    };

    const toStatus = (progress: number, risk = false): 'pending' | 'active' | 'completed' | 'warning' => {
        if (risk) return 'warning';
        if (progress >= 95) return 'completed';
        if (progress > 0) return 'active';
        return 'pending';
    };

    const roomStates = {
        living: {
            label: '客厅',
            progress: phaseAvg(['demolition', 'hydroelectric', 'tiling', 'painting', 'final_install']),
            status: toStatus(phaseAvg(['demolition', 'hydroelectric', 'tiling', 'painting', 'final_install']), isSevereWarning),
        },
        kitchen: {
            label: '厨房',
            progress: phaseAvg(['hydroelectric', 'waterproof', 'tiling', 'cabinet_install', 'final_install']),
            status: toStatus(phaseAvg(['hydroelectric', 'waterproof', 'tiling', 'cabinet_install', 'final_install'])),
        },
        bathroom: {
            label: '卫生间',
            progress: phaseAvg(['hydroelectric', 'waterproof', 'tiling', 'final_install']),
            status: toStatus(phaseAvg(['hydroelectric', 'waterproof', 'tiling', 'final_install'])),
        },
        bedroom: {
            label: '主卧',
            progress: phaseAvg(['demolition', 'hydroelectric', 'carpentry', 'painting', 'door_window']),
            status: toStatus(phaseAvg(['demolition', 'hydroelectric', 'carpentry', 'painting', 'door_window'])),
        },
        secondBedroom: {
            label: '次卧',
            progress: phaseAvg(['demolition', 'hydroelectric', 'carpentry', 'painting', 'door_window']),
            status: toStatus(phaseAvg(['demolition', 'hydroelectric', 'carpentry', 'painting', 'door_window'])),
        },
        balcony: {
            label: '阳台',
            progress: phaseAvg(['waterproof', 'tiling', 'painting', 'final_install']),
            status: toStatus(phaseAvg(['waterproof', 'tiling', 'painting', 'final_install'])),
        },
    };

    return (
        <div className="page-shell">
            <div className="page-stack">
                <div className="page-hero page-hero--emerald">
                    <div className="page-kicker">施工总览</div>
                    <div className="page-title" style={{ marginTop: 16 }}>
                        {currentPhaseInfo?.icon} {currentPhaseInfo?.name || '待开工'}
                    </div>
                    <div className="page-subtitle" style={{ marginTop: 12 }}>
                        已开工 {daysElapsed} 天 · 总进度 {overallPercent}% · {currentPhaseInfo?.description}
                    </div>
                    <div className="stats-grid" style={{ marginTop: 16 }}>
                        <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                            <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>当前进度</div>
                            <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{overallPercent}%</div>
                        </div>
                        <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                            <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>已支出</div>
                            <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{formatMoney(totalSpent)}</div>
                        </div>
                        <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                            <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>目标预算</div>
                            <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{targetBudget ? formatMoney(targetBudget) : '未填写'}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <ProgressBar percent={overallPercent} style={{ '--track-width': '6px', '--fill-color': '#fff' } as React.CSSProperties} />
                    </div>
                </div>

                {isOverBudget && (
                    <div className={isSevereWarning ? 'note-card note-card--danger' : 'note-card note-card--warning'}>
                        <div className="note-icon">⚠️</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                                {isSevereWarning ? '支出严重超支提醒' : '预算执行预警'}
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                                当前累计支出 {formatMoney(totalSpent)}，建议优先锁定后续采购和增项边界，避免继续超预算。
                            </div>
                        </div>
                    </div>
                )}

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>快捷操作</h3>
                        <span className="inline-pill">常用入口</span>
                    </div>
                    <div className="feature-grid">
                        {actions.map((item) => (
                            <div key={item.path} className="feature-card" style={{ cursor: 'pointer' }} onClick={() => navigate(item.path)}>
                                <div className="feature-icon" style={{ background: 'rgba(236, 253, 245, 0.9)' }}>{item.icon}</div>
                                <div className="feature-title">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>施工进度</h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button size="small" fill={viewMode === 'list' ? 'solid' : 'outline'} color="primary" onClick={() => setViewMode('list')}>清单</Button>
                            <Button size="small" fill={viewMode === 'gantt' ? 'solid' : 'outline'} color="primary" onClick={() => setViewMode('gantt')}>甘特图</Button>
                            <Button size="small" fill={viewMode === 'plan' ? 'solid' : 'outline'} color="primary" onClick={() => setViewMode('plan')}>俯视图</Button>
                        </div>
                    </div>

                    {viewMode === 'gantt' && startDate ? (
                        <GanttView startDate={startDate} phases={phases} currentPhase={currentPhase} />
                    ) : viewMode === 'plan' ? (
                        <FloorPlanView rooms={roomStates} />
                    ) : (
                        <div className="timeline-list">
                            {visiblePhases.map((phaseInfo) => {
                                const record = phases.find((item) => item.phase === phaseInfo.phase);
                                const progress = getPhaseProgress(phaseInfo.phase);
                                const isCurrent = currentPhase === phaseInfo.phase;
                                const isCompleted = record?.status === 'completed';
                                const canOpen = isCurrent || isCompleted;

                                return (
                                    <div key={phaseInfo.phase} className="timeline-card">
                                        <div className="timeline-dot" style={{ background: isCompleted ? 'linear-gradient(135deg, #10b981, #22c55e)' : isCurrent ? 'var(--gradient-primary)' : 'linear-gradient(135deg, #cbd5e1, #94a3b8)' }}>
                                            {phaseInfo.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{phaseInfo.name}</div>
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    {isCompleted && <Tag color="success" fill="outline">已完成</Tag>}
                                                    {isCurrent && <Tag color="primary" fill="solid">进行中</Tag>}
                                                    {!isCompleted && !isCurrent && <Tag fill="outline">未开始</Tag>}
                                                </div>
                                            </div>
                                            <div className="feature-desc" style={{ marginTop: 6 }}>{phaseInfo.description}</div>
                                            <div style={{ marginTop: 10 }}>
                                                <ProgressBar percent={progress.percent} style={{ '--track-width': '5px' } as React.CSSProperties} />
                                                <div className="feature-desc" style={{ marginTop: 6 }}>验收清单 {progress.completed}/{progress.total}</div>
                                            </div>
                                            <div className="action-row" style={{ marginTop: 12 }}>
                                                <Button size="small" fill="outline" color="primary" disabled={!canOpen} onClick={() => navigate(`/construction/checklist/${phaseInfo.phase}`)}>
                                                    验收清单
                                                </Button>
                                                {isCurrent && (
                                                    <Button
                                                        size="small"
                                                        color="success"
                                                        onClick={() => {
                                                            Dialog.confirm({
                                                                content: `确认「${phaseInfo.name}」已完成？建议先完成验收清单再确认。`,
                                                                onConfirm: () => {
                                                                    completePhase(phaseInfo.phase);
                                                                    Toast.show({ content: `${phaseInfo.name} 已完成`, icon: 'success' });
                                                                },
                                                            });
                                                        }}
                                                    >
                                                        完成阶段
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
