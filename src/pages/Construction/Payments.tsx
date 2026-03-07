import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, Form, Input, Picker, Toast, Empty, Tag } from 'antd-mobile';
import { useConstructionStore, useProjectStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { formatMoney } from '@/utils/format';
import dayjs from 'dayjs';

const phaseOptions = [PHASE_LIST.filter(p => p.phase !== 'warranty').map(p => ({
    label: `${p.icon} ${p.name}`,
    value: p.phase,
}))];

export default function Payments() {
    const navigate = useNavigate();
    const { project, addPayment, getTotalSpent } = useConstructionStore();
    const { currentHouse } = useProjectStore();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        description: '',
        payee: '',
        phase: project?.currentPhase || 'pre_construction',
    });

    if (!project) return null;

    const payments = [...project.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalSpent = getTotalSpent();

    // 按阶段分组统计
    const phaseSpending = PHASE_LIST.map(p => ({
        ...p,
        spent: project.payments.filter(pay => pay.phase === p.phase).reduce((s, pay) => s + pay.amount, 0),
    })).filter(p => p.spent > 0);

    const handleSubmit = () => {
        const amount = parseFloat(form.amount);
        if (!amount || amount <= 0) {
            Toast.show({ content: '请输入有效金额', icon: 'fail' });
            return;
        }
        addPayment({
            phase: form.phase as any,
            amount,
            description: form.description || '装修付款',
            payee: form.payee || '施工方',
            paymentMethod: '',
            date: dayjs().format('YYYY-MM-DD'),
        });
        setForm({ amount: '', description: '', payee: '', phase: project.currentPhase });
        setShowForm(false);
        Toast.show({ content: '付款记录已添加', icon: 'success' });
    };

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <NavBar
                onBack={() => navigate(-1)}
                style={{ background: '#fff' }}
                right={
                    <Button size="mini" color="primary" fill="solid" onClick={() => setShowForm(true)}>
                        + 记录
                    </Button>
                }
            >
                付款记录
            </NavBar>

            {/* 总览 */}
            <div style={{
                margin: 12, padding: 16,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                borderRadius: 12, color: '#fff',
            }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>累计已支出</div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{formatMoney(totalSpent)}</div>
                {currentHouse?.targetBudget && (
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        目标预算 {formatMoney(currentHouse.targetBudget)} · 剩余 {formatMoney(Math.max(0, currentHouse.targetBudget - totalSpent))}
                    </div>
                )}
            </div>

            {/* 阶段支出占比 */}
            {phaseSpending.length > 0 && (
                <div style={{ margin: '0 12px 12px', padding: 14, background: '#fff', borderRadius: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>各阶段支出</div>
                    {phaseSpending.map(p => (
                        <div key={p.phase} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '6px 0', borderBottom: '1px solid #F3F4F6',
                        }}>
                            <span style={{ fontSize: 13 }}>{p.icon} {p.name}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{formatMoney(p.spent)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* 新增表单 */}
            {showForm && (
                <div style={{ margin: 12, padding: 16, background: '#fff', borderRadius: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💰 新增付款记录</h3>
                    <Form layout="vertical">
                        <Form.Item label="金额（元）">
                            <Input type="number" placeholder="如：15000" value={form.amount}
                                onChange={v => setForm(f => ({ ...f, amount: v }))} />
                        </Form.Item>
                        <Form.Item label="说明">
                            <Input placeholder="如：水电改造首期款" value={form.description}
                                onChange={v => setForm(f => ({ ...f, description: v }))} />
                        </Form.Item>
                        <Form.Item label="支付对象">
                            <Input placeholder="如：XX装修公司" value={form.payee}
                                onChange={v => setForm(f => ({ ...f, payee: v }))} />
                        </Form.Item>
                        <Form.Item label="所属阶段">
                            <Picker
                                columns={phaseOptions}
                                value={[form.phase]}
                                onConfirm={v => setForm(f => ({ ...f, phase: v[0] as string }))}
                            >
                                {(_, { open }) => (
                                    <div onClick={open}>
                                        {PHASE_LIST.find(p => p.phase === form.phase)?.name || '选择阶段'}
                                    </div>
                                )}
                            </Picker>
                        </Form.Item>
                    </Form>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <Button block fill="outline" onClick={() => setShowForm(false)}>取消</Button>
                        <Button block color="primary" onClick={handleSubmit}>保存</Button>
                    </div>
                </div>
            )}

            {/* 付款明细 */}
            <div style={{ padding: '0 12px 40px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, paddingLeft: 4 }}>付款明细</h3>
                {payments.length === 0 ? (
                    <Empty description="暂无付款记录" />
                ) : (
                    payments.map(p => {
                        const phaseInfo = PHASE_LIST.find(ph => ph.phase === p.phase);
                        return (
                            <div key={p.id} style={{
                                background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.description}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <Tag style={{ fontSize: 10 }}>{phaseInfo?.icon} {phaseInfo?.name}</Tag>
                                        <span>{p.payee}</span>
                                        <span>{dayjs(p.date).format('MM-DD')}</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap' }}>
                                    -{formatMoney(p.amount)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
