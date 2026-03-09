
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Toast } from 'antd-mobile';
import dayjs from 'dayjs';
import { useConstructionStore, useProjectStore } from '@/store';
import { formatMoney } from '@/utils/format';

const WARRANTY_ITEMS = [
    { name: '防水工程', period: '5 年', checkPoints: ['是否渗漏返潮', '闭水记录保留'] },
    { name: '水电隐蔽工程', period: '5 年', checkPoints: ['开关插座稳定', '水路无渗漏', '强弱电安全'] },
    { name: '墙地砖铺贴', period: '2 年', checkPoints: ['是否空鼓', '勾缝是否开裂'] },
    { name: '木作工程', period: '2 年', checkPoints: ['柜门变形松动', '五金是否异响'] },
    { name: '门窗 / 五金', period: '2 年', checkPoints: ['开合是否顺畅', '密封条老化'] },
    { name: '油漆工程', period: '1 年', checkPoints: ['墙面起皮开裂', '色差是否明显'] },
];

const MOVE_IN_CHECKLIST = [
    { name: '空气检测', desc: '建议通风满 3 个月后再检测甲醛、TVOC 等指标' },
    { name: '深度保洁', desc: '清除粉尘和胶渍，重点处理柜体内部和边角' },
    { name: '水电复查', desc: '检查插座、灯具、龙头、地漏是否运行正常' },
    { name: '家具进场', desc: '先大件后小件，避免反复搬运磕碰墙面' },
    { name: '家电安装', desc: '确认尺寸和预留点位，安装后做通电测试' },
    { name: '软装布置', desc: '窗帘、地毯、挂画分批进场，避免一次堆放' },
    { name: '质保资料整理', desc: '收集合同、发票、保修单并拍照留存云端' },
    { name: '入住复盘记录', desc: '记录 1-2 周居住问题，便于集中整改' },
];

export default function PostRenovation() {
    const navigate = useNavigate();
    const { startDate, phases, getTotalSpent } = useConstructionStore();
    const { currentHouse } = useProjectStore();

    const totalSpent = getTotalSpent();
    const endDate = phases.find((item: any) => item.phase === 'completed')?.endDate;
    const totalDays = startDate && endDate ? dayjs(endDate).diff(dayjs(startDate), 'day') : 0;

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#047857' }}>竣工收尾</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>交付后仍要关注这些事项</div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>
                        返回
                    </Button>
                </div>

                <div className="page-hero page-hero--emerald">
                    <div className="page-kicker">完工总结</div>
                    <div className="page-title" style={{ marginTop: 16 }}>复盘周期、花费与入住准备</div>
                    <div className="stats-grid" style={{ marginTop: 18 }}>
                        <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                            <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>总工期</div>
                            <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{totalDays || '-'} 天</div>
                        </div>
                        <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                            <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>总花费</div>
                            <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>{formatMoney(totalSpent)}</div>
                        </div>
                        <div className="metric-card" style={{ background: 'rgba(255,255,255,0.14)' }}>
                            <div className="metric-label" style={{ color: 'rgba(255,255,255,0.72)' }}>预算偏差</div>
                            <div className="metric-value" style={{ marginTop: 8, color: '#fff', fontSize: 26 }}>
                                {currentHouse?.targetBudget ? `${totalSpent > currentHouse.targetBudget ? '+' : ''}${formatMoney(totalSpent - currentHouse.targetBudget)}` : '-'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>入住前检查清单</h3>
                        <span className="inline-pill">建议逐项确认</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {MOVE_IN_CHECKLIST.map((item) => (
                            <div key={item.name} className="panel-card" style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                                <div className="feature-desc" style={{ marginTop: 6 }}>{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>保修维保提醒</h3>
                        <span className="inline-pill">按周期回访</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {WARRANTY_ITEMS.map((item) => (
                            <div key={item.name} className="panel-card" style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.name}</div>
                                    <Tag color="primary" fill="outline">保修 {item.period}</Tag>
                                </div>
                                <div className="feature-desc" style={{ marginTop: 8 }}>重点检查：{item.checkPoints.join('、')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="action-row">
                    <Button color="primary" shape="rounded" onClick={() => { Toast.show({ content: '竣工清单导出中...', icon: 'success' }); }}>
                        导出竣工清单
                    </Button>
                    <Button fill="outline" shape="rounded" onClick={() => { Toast.show({ content: '维保提醒已生成', icon: 'success' }); }}>
                        生成维保提醒
                    </Button>
                </div>
            </div>
        </div>
    );
}
