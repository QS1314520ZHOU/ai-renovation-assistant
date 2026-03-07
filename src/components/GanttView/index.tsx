import React from 'react';
import { PhaseInfo } from '@/types';
import dayjs from 'dayjs';

interface GanttViewProps {
    startDate: string;
    phases: PhaseInfo[];
    currentPhase: string;
}

export const GanttView: React.FC<GanttViewProps> = ({ startDate, phases, currentPhase }) => {
    const start = dayjs(startDate);
    const today = dayjs();

    // 计算总天数和每一天的宽度
    const DAY_WIDTH = 40;
    let totalDays = 0;
    const items = phases.filter(p => p.phase !== 'warranty').map(p => {
        const duration = p.typicalDurationDays || 7;
        const phaseStart = start.add(totalDays, 'day');
        const phaseEnd = phaseStart.add(duration, 'day');
        const left = totalDays * DAY_WIDTH;
        const width = duration * DAY_WIDTH;
        totalDays += duration;

        return {
            ...p,
            left,
            width,
            phaseStart,
            phaseEnd,
            isActive: currentPhase === p.phase,
            isCompleted: phaseEnd.isBefore(today)
        };
    });

    const totalWidth = totalDays * DAY_WIDTH;

    return (
        <div style={{ padding: '0 16px', overflowX: 'auto', background: '#fff', borderRadius: 12, paddingBottom: 16 }}>
            <div style={{ position: 'relative', width: totalWidth, height: 320, marginTop: 20 }}>
                {/* 顶部时间轴刻度 */}
                <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', marginBottom: 20 }}>
                    {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => (
                        <div key={i} style={{ width: DAY_WIDTH * 7, fontSize: 10, color: '#9CA3AF', paddingLeft: 4 }}>
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
                        {/* 连线 */}
                        {idx > 0 && (
                            <div style={{
                                position: 'absolute',
                                left: item.left - 2,
                                top: -24,
                                width: 1,
                                height: 24,
                                borderLeft: '1px dashed #E5E7EB',
                                zIndex: 1
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
                            top: -20,
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
