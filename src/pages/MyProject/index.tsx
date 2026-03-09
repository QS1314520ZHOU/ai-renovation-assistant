import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag } from 'antd-mobile';
import { useProjectStore } from '@/store';
import { formatMoney, tierLevelLabel } from '@/utils/format';

export default function MyProject() {
    const navigate = useNavigate();
    const { projects } = useProjectStore();

    return (
        <div className="page-shell">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(99, 102, 241, 0.10)', color: 'var(--color-primary)' }}>我的项目</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>已保存的预算与装修档案</div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>方便回看预算结果、施工过程和历史项目参数。</div>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="empty-card">
                        <div className="empty-title">还没有保存的项目</div>
                        <div className="empty-desc">先去做一次预算，系统就可以把项目资料沉淀下来。</div>
                        <div style={{ marginTop: 18 }}>
                            <Button color="primary" shape="rounded" onClick={() => navigate('/ai-consult')}>
                                去生成预算
                            </Button>
                        </div>
                    </div>
                ) : (
                    projects.map((project) => (
                        <div key={project.id} className="section-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/budget-result')}>
                            <div className="page-section-title" style={{ marginBottom: 10 }}>
                                <h3>{project.projectName || '未命名项目'}</h3>
                                <span className="inline-pill">{new Date(project.createdAt).toLocaleDateString('zh-CN')}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                <Tag color="primary" fill="outline">{project.city}</Tag>
                                <Tag fill="outline">{project.layout}</Tag>
                                <Tag fill="outline">{project.innerArea}㎡</Tag>
                                <Tag color="warning" fill="outline">{tierLevelLabel(project.tierLevel)}</Tag>
                            </div>
                            <div className="metric-grid">
                                <div className="metric-card">
                                    <div className="metric-label">目标预算</div>
                                    <div className="metric-value" style={{ fontSize: 24, marginTop: 8 }}>{formatMoney(project.targetBudget || 0)}</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">更新时间</div>
                                    <div className="feature-desc" style={{ marginTop: 8 }}>{new Date(project.updatedAt).toLocaleString('zh-CN')}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}