import React from 'react';
import { PhaseState } from '@/store/constructionStore';
import dayjs from 'dayjs';

interface GanttViewProps {
    startDate: string;
    phases: PhaseState[];
    currentPhase: string;
}

export const GanttView: React.FC<GanttViewProps> = ({ startDate, phases, currentPhase }) => {
    const start = dayjs(startDate);
    const today = dayjs();

    const DAY_WIDTH = 40;
    let accumulatedDays = 0;

    const items = phases.filter(p => p.phase !== 'warranty').map((p, idx) => {
        const duration = p.typicalDurationDays || 7;

        // 如果 store 中没有记录日期，则根据典型的持续时间累加计算
        const phaseStart = p.startDate ? dayjs(p.startDate) : start.add(accumulatedDays, 'day');
        const phaseEnd = p.endDate ? dayjs(p.endDate) : phaseStart.add(duration, 'day');

        const left = phaseStart.diff(start, 'day') * DAY_WIDTH;
        const width = phaseEnd.diff(phaseStart, 'day') * DAY_WIDTH;

        // 为下一个没有日期的阶段累加
        accumulatedDays += duration;

        return {
            ...p,
            left,
            width: Math.max(width, DAY_WIDTH * 2), // 保证最小宽度以便显示文字
            phaseStart,
            phaseEnd,
            isActive: currentPhase === p.phase,
            isCompleted: p.status === 'completed' || phaseEnd.isBefore(today, 'day')
        };
    });

    // 计算总宽度 (根据最后一个阶段的结束日期)
    const lastEnd = items.length > 0 ? items[items.length - 1].phaseEnd : start.add(30, 'day');
    const totalDays = lastEnd.diff(start, 'day') + 5;
    const totalWidth = totalDays * DAY_WIDTH;

    return (
        <div style={{ padding: '0 16px', overflowX: 'auto', background: '#fff', borderRadius: 12, paddingBottom: 16 }}>
            <div style={{ position: 'relative', width: totalWidth, height: 350, marginTop: 20 }}>
                {/* 顶部时间轴刻度 */}
                <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', marginBottom: 20, height: 30 }}>
                    {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => (
                        <div key={i} style={{ width: DAY_WIDTH * 7, fontSize: 10, color: '#9CA3AF', paddingLeft: 4, borderLeft: '1px solid #F3F4F6' }}>
                            第 {i + 1} 周
                        </div>
                    ))}
                </div>

                {/* 阶段条 */}
                {items.map((item, idx) => (
                    <div key={item.phase} style={{ position: 'relative', height: 40, marginBottom: 8 }}>
                        <div style={{
                            position: 'absolute',
                            left: item.left,
                            width: item.width,
                            height: 24,
                            background: item.isActive ? 'var(--color-primary)' : item.isCompleted ? '#D1FAE5' : '#F3F4F6',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 12px',
                            color: item.isActive ? '#fff' : item.isCompleted ? '#059669' : '#9CA3AF',
                            fontSize: 11,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            boxShadow: item.isActive ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
                            zIndex: 2,
                        }}>
                            {item.icon} {item.name}
                        </div>

                        {/* 辅助线 */}
                        {item.isActive && (
                            <div style={{
                                position: 'absolute',
                                left: item.left,
                                top: 24,
                                width: item.width,
                                height: 300,
                                background: 'rgba(16, 185, 129, 0.03)',
                                borderLeft: '1px dashed rgba(16, 185, 129, 0.2)',
                                borderRight: '1px dashed rgba(16, 185, 129, 0.2)',
                                pointerEvents: 'none'
                            }} />
                        )}
                    </div>
                ))}

                {/* 今日指示线 */}
                {today.diff(start, 'day') >= 0 && today.diff(start, 'day') <= totalDays && (
                    <div style={{
                        position: 'absolute',
                        left: today.diff(start, 'day') * DAY_WIDTH,
                        top: 0,
                        width: 2,
                        height: '100%',
                        background: '#EF4444',
                        zIndex: 10,
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: -24,
                            left: -20,
                            background: '#EF4444',
                            color: '#fff',
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            whiteSpace: 'nowrap'
                        }}>
                            今天
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
