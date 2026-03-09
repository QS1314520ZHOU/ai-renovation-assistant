
import React from 'react';
import dayjs from 'dayjs';
import { PhaseState } from '@/store/constructionStore';

interface GanttViewProps {
    startDate: string;
    phases: PhaseState[];
    currentPhase: string;
}

export const GanttView: React.FC<GanttViewProps> = ({ startDate, phases, currentPhase }) => {
    const start = dayjs(startDate);
    const today = dayjs();
    const dayWidth = 42;
    let accumulatedDays = 0;

    const items = phases.filter((item) => item.phase !== 'warranty').map((item) => {
        const duration = item.typicalDurationDays || 7;
        const phaseStart = item.startDate ? dayjs(item.startDate) : start.add(accumulatedDays, 'day');
        const phaseEnd = item.endDate ? dayjs(item.endDate) : phaseStart.add(duration, 'day');
        const left = phaseStart.diff(start, 'day') * dayWidth;
        const width = Math.max(phaseEnd.diff(phaseStart, 'day') * dayWidth, dayWidth * 2);
        accumulatedDays += duration;

        return {
            ...item,
            left,
            width,
            phaseStart,
            phaseEnd,
            isActive: currentPhase === item.phase,
            isCompleted: item.status === 'completed' || phaseEnd.isBefore(today, 'day'),
        };
    });

    const lastEnd = items.length > 0 ? items[items.length - 1].phaseEnd : start.add(30, 'day');
    const totalDays = lastEnd.diff(start, 'day') + 5;
    const totalWidth = totalDays * dayWidth;
    const weekCount = Math.ceil(totalDays / 7);
    const todayOffset = today.diff(start, 'day');

    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: totalWidth, paddingBottom: 8 }}>
                <div style={{ display: 'flex', height: 34, marginBottom: 12 }}>
                    {Array.from({ length: weekCount }).map((_, index) => (
                        <div
                            key={index}
                            style={{
                                width: dayWidth * 7,
                                fontSize: 11,
                                color: 'var(--color-text-light)',
                                paddingLeft: 6,
                                borderLeft: index === 0 ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
                            }}
                        >
                            第 {index + 1} 周
                        </div>
                    ))}
                </div>

                <div style={{ position: 'relative', minHeight: items.length * 58 + 24 }}>
                    {items.map((item, index) => (
                        <div key={item.phase} style={{ position: 'relative', height: 52, marginBottom: 10 }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    left: item.left,
                                    width: item.width,
                                    height: 30,
                                    borderRadius: 16,
                                    padding: '0 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    whiteSpace: 'nowrap',
                                    color: item.isActive ? '#fff' : item.isCompleted ? '#047857' : 'var(--color-text-secondary)',
                                    background: item.isActive
                                        ? 'var(--gradient-primary)'
                                        : item.isCompleted
                                            ? 'linear-gradient(135deg, rgba(220, 252, 231, 1), rgba(187, 247, 208, 1))'
                                            : 'rgba(241, 245, 249, 0.95)',
                                    boxShadow: item.isActive ? '0 14px 26px rgba(79, 70, 229, 0.18)' : 'var(--shadow-xs)',
                                    border: item.isActive ? 'none' : '1px solid rgba(226, 232, 240, 0.9)',
                                }}
                            >
                                <span>{item.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>{item.name}</span>
                            </div>
                            {item.isActive && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: item.left,
                                        top: 30,
                                        width: item.width,
                                        bottom: -14,
                                        borderLeft: '1px dashed rgba(99, 102, 241, 0.28)',
                                        borderRight: '1px dashed rgba(99, 102, 241, 0.28)',
                                        background: 'rgba(99, 102, 241, 0.03)',
                                        pointerEvents: 'none',
                                    }}
                                />
                            )}
                        </div>
                    ))}

                    {todayOffset >= 0 && todayOffset <= totalDays && (
                        <div
                            style={{
                                position: 'absolute',
                                left: todayOffset * dayWidth,
                                top: 0,
                                width: 2,
                                height: '100%',
                                background: '#ef4444',
                                zIndex: 10,
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -24,
                                    left: -22,
                                    padding: '4px 8px',
                                    borderRadius: '999px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}
                            >
                                今天
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
