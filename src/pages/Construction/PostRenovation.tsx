import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Button, Tag, Toast } from 'antd-mobile';
import { useConstructionStore, useProjectStore } from '@/store';
import { formatMoney } from '@/utils/format';
import dayjs from 'dayjs';

const WARRANTY_ITEMS = [
    { name: '防水工程', period: '5年', checkPoints: ['卫生间天花板是否有水渍', '墙面是否起皮/发霉'] },
    { name: '水电隐蔽工程', period: '5年', checkPoints: ['是否有跳闸', '水管是否渗漏', '水压是否正常'] },
    { name: '墙面乳胶漆', period: '2年', checkPoints: ['是否有裂缝', '是否有掉皮/起泡'] },
    { name: '瓷砖工程', period: '2年', checkPoints: ['是否有空鼓脱落', '勾缝是否完好'] },
    { name: '木工/吊顶', period: '2年', checkPoints: ['石膏板接缝是否开裂', '龙骨是否松动'] },
    { name: '门窗五金', period: '1年', checkPoints: ['铰链是否松动', '锁具是否灵活'] },
];

const MOVE_IN_CHECKLIST = [
    { name: '甲醛检测', desc: '建议通风至少3个月后做一次甲醛检测，确保达标后再入住', done: false },
    { name: '全屋通电测试', desc: '入住前再次逐一测试所有开关插座', done: false },
    { name: '水管排查', desc: '打开所有水龙头、冲马桶，检查有无渗漏', done: false },
    { name: '门窗密封', desc: '检查所有门窗开关是否顺畅、密封条是否完好', done: false },
    { name: '地漏排水', desc: '向每个地漏灌水，检查排水是否顺畅', done: false },
    { name: '保留施工资料', desc: '水电走向图、竣工照片、合同保修卡要妥善保管', done: false },
    { name: '保留剩余材料', desc: '留少量瓷砖、乳胶漆（同批次），方便后期修补', done: false },
    { name: '与施工方确认维保', desc: '确认维保期限、联系方式、响应时间', done: false },
];

export default function PostRenovation() {
    const navigate = useNavigate();
    const { startDate, phases, getTotalSpent } = useConstructionStore();
    const { currentHouse } = useProjectStore();

    const totalSpent = getTotalSpent();
    const endDate = phases.find((p: any) => p.phase === 'completed')?.endDate;
    const totalDays = startDate && endDate ? dayjs(endDate).diff(dayjs(startDate), 'day') : 0;

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <NavBar onBack={() => navigate(-1)} style={{ background: '#fff' }}>
                装修总结与维保
            </NavBar>

            {/* 装修总结卡片 */}
            <div style={{
                margin: 12, padding: 20,
                background: 'linear-gradient(135deg, #059669, #10B981)',
                borderRadius: 16, color: '#fff',
            }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🎉 恭喜装修完成！</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>总工期</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{totalDays}天</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>实际花费</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{formatMoney(totalSpent)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>预算目标</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{formatMoney(currentHouse?.targetBudget || 0)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>预算偏差</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>
                            {currentHouse?.targetBudget
                                ? `${totalSpent > currentHouse.targetBudget ? '+' : ''}${formatMoney(totalSpent - currentHouse.targetBudget)}`
                                : '-'
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* 入住前检查清单 */}
            <div style={{ margin: '0 12px 16px', padding: 16, background: '#fff', borderRadius: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🏡 入住前必做清单</h3>
                {MOVE_IN_CHECKLIST.map((item, idx) => (
                    <div key={idx} style={{
                        padding: '10px 0',
                        borderBottom: idx < MOVE_IN_CHECKLIST.length - 1 ? '1px solid #F3F4F6' : 'none',
                    }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                            {item.desc}
                        </div>
                    </div>
                ))}
            </div>

            {/* 维保提醒 */}
            <div style={{ margin: '0 12px 16px', padding: 16, background: '#fff', borderRadius: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>🛡️ 维保期关注事项</h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                    以下是各项目常见保修期限和需要定期检查的点，发现问题及时联系施工方处理。
                </p>
                {WARRANTY_ITEMS.map((item, idx) => (
                    <div key={idx} style={{
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: 10,
                        marginBottom: 8,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</span>
                            <Tag color="primary" fill="outline" style={{ fontSize: 11 }}>保修{item.period}</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                            定期检查：{item.checkPoints.join('；')}
                        </div>
                    </div>
                ))}
            </div>

            {/* 导出归档 */}
            <div style={{ padding: '0 12px 40px' }}>
                <Button block color="primary" size="large" shape="rounded" style={{ marginBottom: 10, height: 48 }}
                    onClick={() => { Toast.show({ content: '项目资料已归档保存', icon: 'success' }); }}>
                    📦 归档项目资料
                </Button>
                <Button block fill="outline" size="large" shape="rounded" style={{ height: 48 }}
                    onClick={() => { Toast.show({ content: '报告已导出', icon: 'success' }); }}>
                    📄 导出装修总结报告
                </Button>
            </div>
        </div>
    );
}
