import React from 'react';

type RoomState = {
    label: string;
    progress: number;
    status: 'pending' | 'active' | 'completed' | 'warning';
};

interface FloorPlanViewProps {
    rooms: Record<string, RoomState>;
}

const STATUS_STYLE: Record<RoomState['status'], { fill: string; stroke: string; label: string }> = {
    pending: { fill: 'rgba(148,163,184,0.28)', stroke: '#94a3b8', label: '未开始' },
    active: { fill: 'rgba(59,130,246,0.30)', stroke: '#2563eb', label: '进行中' },
    completed: { fill: 'rgba(16,185,129,0.30)', stroke: '#059669', label: '已完成' },
    warning: { fill: 'rgba(239,68,68,0.25)', stroke: '#dc2626', label: '有风险' },
};

function RoomBlock({
    x,
    y,
    width,
    height,
    room,
}: {
    x: number;
    y: number;
    width: number;
    height: number;
    room: RoomState;
}) {
    const style = STATUS_STYLE[room.status];
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={10}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={2}
            />
            <text x={x + 10} y={y + 24} fill="#0f172a" fontSize={13} fontWeight={700}>
                {room.label}
            </text>
            <text x={x + 10} y={y + 44} fill="#475569" fontSize={11}>
                {style.label}
            </text>
            <text x={x + 10} y={y + 62} fill="#334155" fontSize={11}>
                进度 {room.progress}%
            </text>
        </g>
    );
}

export function FloorPlanView({ rooms }: FloorPlanViewProps) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <svg
                viewBox="0 0 720 480"
                width="100%"
                height={360}
                style={{
                    background: 'rgba(255,255,255,0.64)',
                    borderRadius: 16,
                    border: '1px solid rgba(148,163,184,0.22)',
                }}
            >
                <rect x={12} y={12} width={696} height={456} fill="none" stroke="#334155" strokeWidth={3} rx={14} />

                <RoomBlock x={28} y={28} width={260} height={200} room={rooms.living} />
                <RoomBlock x={300} y={28} width={190} height={200} room={rooms.kitchen} />
                <RoomBlock x={500} y={28} width={190} height={200} room={rooms.bathroom} />
                <RoomBlock x={28} y={240} width={220} height={212} room={rooms.bedroom} />
                <RoomBlock x={258} y={240} width={220} height={212} room={rooms.secondBedroom || rooms.bedroom} />
                <RoomBlock x={488} y={240} width={202} height={212} room={rooms.balcony} />
            </svg>
        </div>
    );
}
