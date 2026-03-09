
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Picker, Toast, Empty, Tag, Switch } from 'antd-mobile';
import dayjs from 'dayjs';
import { useConstructionStore, useProjectStore } from '@/store';
import { PHASE_LIST } from '@/engine/constructionData';
import { formatMoney } from '@/utils/format';

const phaseOptions = [
    PHASE_LIST.filter((item) => item.phase !== 'warranty').map((item) => ({ label: `${item.icon} ${item.name}`, value: item.phase })),
];

export default function Payments() {
    const navigate = useNavigate();
    const { currentPhase, payments, addPayment, getTotalSpent } = useConstructionStore();
    const { currentHouse } = useProjectStore();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        description: '',
        payee: '',
        phase: currentPhase || 'pre_construction',
        isAddon: false,
        addonReason: '',
    });

    const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const totalSpent = getTotalSpent();
    const addonSpent = payments.filter((item) => item.isAddon).reduce((sum, item) => sum + item.amount, 0);
    const phaseSpending = PHASE_LIST.map((item) => ({
        ...item,
        spent: payments.filter((payment) => payment.phase === item.phase).reduce((sum, payment) => sum + payment.amount, 0),
    })).filter((item) => item.spent > 0);

    const handleSubmit = async () => {
        const amount = Number(form.amount);
        if (!amount || amount <= 0) {
            Toast.show({ content: '请输入有效金额', icon: 'fail' });
            return;
        }

        try {
            await addPayment({
                phase: form.phase as any,
                amount,
                description: form.description || '阶段付款',
                payee: form.payee || '未填写收款方',
                paymentMethod: '',
                date: dayjs().format('YYYY-MM-DD'),
                isAddon: form.isAddon,
                addonReason: form.addonReason,
            } as any);

            setForm({ amount: '', description: '', payee: '', phase: currentPhase, isAddon: false, addonReason: '' });
            setShowForm(false);
            Toast.show({ content: '付款记录已添加', icon: 'success' });
        } catch (error: any) {
            Toast.show({ content: `付款保存失败：${error.message || ''}`, icon: 'fail' });
        }
    };

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(99, 102, 241, 0.10)', color: 'var(--color-primary)' }}>付款记录</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>掌握装修支出节奏</div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>记录每笔付款并追踪增项情况</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="small" fill="outline" onClick={() => navigate(-1)}>返回</Button>
                        <Button size="small" color="primary" onClick={() => setShowForm((prev) => !prev)}>{showForm ? '收起' : '新增'}</Button>
                    </div>
                </div>

                <div className="page-hero page-hero--indigo">
                    <div className="page-kicker">累计支出</div>
                    <div className="page-title" style={{ marginTop: 16 }}>{formatMoney(totalSpent)}</div>
                    <div className="page-subtitle" style={{ marginTop: 10 }}>
                        目标预算 {currentHouse?.targetBudget ? formatMoney(currentHouse.targetBudget) : '未填写'}
                        {currentHouse?.targetBudget ? ` · 剩余 ${formatMoney(Math.max(0, currentHouse.targetBudget - totalSpent))}` : ''}
                    </div>
                    {addonSpent > 0 && (
                        <div style={{ marginTop: 14 }} className="page-kicker">其中增项：{formatMoney(addonSpent)}</div>
                    )}
                </div>

                {phaseSpending.length > 0 && (
                    <div className="section-card">
                        <div className="page-section-title">
                            <h3>阶段支出</h3>
                            <span className="inline-pill">按节点统计</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {phaseSpending.map((item) => (
                                <div key={item.phase} className="panel-card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>{item.icon} {item.name}</div>
                                    <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatMoney(item.spent)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showForm && (
                    <div className="section-card">
                        <div className="page-section-title">
                            <h3>新增付款记录</h3>
                            <span className="inline-pill">支持增项标记</span>
                        </div>
                        <Form layout="vertical">
                            <Form.Item label="付款金额">
                                <Input type="number" placeholder="例如：15000" value={form.amount} onChange={(value) => setForm((prev) => ({ ...prev, amount: value }))} clearable />
                            </Form.Item>
                            <Form.Item label="说明">
                                <Input placeholder="例如：水电阶段首付款" value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} clearable />
                            </Form.Item>
                            <Form.Item label="收款方">
                                <Input placeholder="例如：XX 装修公司" value={form.payee} onChange={(value) => setForm((prev) => ({ ...prev, payee: value }))} clearable />
                            </Form.Item>
                            <Form.Item label="所属阶段">
                                <Picker columns={phaseOptions} value={[form.phase]} onConfirm={(value) => setForm((prev) => ({ ...prev, phase: value[0] as any }))}>
                                    {(_, { open }) => (
                                        <div className="panel-card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={open}>
                                            {PHASE_LIST.find((item) => item.phase === form.phase)?.name || '未选择阶段'}
                                        </div>
                                    )}
                                </Picker>
                            </Form.Item>
                            <Form.Item label="是否增项">
                                <Switch checked={form.isAddon} onChange={(value) => setForm((prev) => ({ ...prev, isAddon: value }))} />
                            </Form.Item>
                            {form.isAddon && (
                                <Form.Item label="增项原因">
                                    <Input placeholder="请填写增项原因，如现场改动、材料升级等" value={form.addonReason} onChange={(value) => setForm((prev) => ({ ...prev, addonReason: value }))} clearable />
                                </Form.Item>
                            )}
                        </Form>
                        <div className="action-row">
                            <Button fill="outline" shape="rounded" onClick={() => setShowForm(false)}>取消</Button>
                            <Button color="primary" shape="rounded" onClick={handleSubmit}>保存</Button>
                        </div>
                    </div>
                )}

                {sortedPayments.length === 0 ? (
                    <div className="empty-card">
                        <div className="empty-title">暂无付款记录</div>
                        <div className="empty-desc">先添加首笔款项，后续系统会自动累计并给出预算预警。</div>
                    </div>
                ) : (
                    sortedPayments.map((payment) => {
                        const phaseInfo = PHASE_LIST.find((item) => item.phase === payment.phase);
                        return (
                            <div key={payment.id} className="section-card">
                                <div className="page-section-title" style={{ marginBottom: 8 }}>
                                    <h3>{payment.description}</h3>
                                    <div style={{ fontWeight: 800, color: '#ef4444' }}>-{formatMoney(payment.amount)}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <Tag fill="outline">{phaseInfo?.icon} {phaseInfo?.name}</Tag>
                                    <Tag fill="outline">{payment.payee}</Tag>
                                    <Tag fill="outline">{payment.date}</Tag>
                                    {payment.isAddon && <Tag color="warning" fill="outline">增项</Tag>}
                                </div>
                                {payment.addonReason && <div className="feature-desc" style={{ marginTop: 10 }}>增项原因：{payment.addonReason}</div>}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
