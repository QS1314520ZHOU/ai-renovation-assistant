import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Button, SwipeAction } from 'antd-mobile';
import { useProjectStore } from '@/store';
import { formatMoney, tierLevelLabel } from '@/utils/format';

export default function MyProject() {
    const navigate = useNavigate();
    const { projects } = useProjectStore();

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>
            <div style={{ padding: '16px', background: '#fff', borderBottom: '1px solid var(--color-border)' }}>
                <h1 style={{ fontSize: 18, fontWeight: 600 }}>我的项目</h1>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    保存的装修预算和报告
                </p>
            </div>

            <div style={{ padding: 16 }}>
                {projects.length === 0 ? (
                    <div style={{ marginTop: 60 }}>
                        <Empty description="还没有保存的项目" />
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <Button color="primary" onClick={() => navigate('/consult')}>
                                开始第一个项目
                            </Button>
                        </div>
                    </div>
                ) : (
                    projects.map(project => (
                        <SwipeAction
                            key={project.id}
                            rightActions={[
                                { key: 'delete', text: '删除', color: 'danger' },
                            ]}
                        >
                            <div
                                style={{
                                    background: '#fff',
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 12,
                                    boxShadow: 'var(--shadow-sm)',
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    // TODO: 加载项目详情
                                    navigate('/budget-result');
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>{project.projectName}</h3>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-light)' }}>
                                        {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, display: 'flex', gap: 12 }}>
                                    <span>{project.city}</span>
                                    <span>{project.layout}</span>
                                    <span>{project.innerArea}㎡</span>
                                    <span>{tierLevelLabel(project.tierLevel)}</span>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)', marginTop: 8 }}>
                                    目标预算：{formatMoney(project.targetBudget)}
                                </div>
                            </div>
                        </SwipeAction>
                    ))
                )}
            </div>
        </div>
    );
}
