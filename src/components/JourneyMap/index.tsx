import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, ProgressBar } from 'antd-mobile';
import {
    SearchOutline,
    EditSOutline,
    ContentOutline,
    CheckShieldOutline,
    SmileOutline,
    AppOutline
} from 'antd-mobile-icons';
import { useConstructionStore, useProjectStore } from '@/store';
import styles from './index.module.css';

const JourneyMap: React.FC = () => {
    const navigate = useNavigate();
    const { projectId, getTotalProgress } = useConstructionStore();
    const { budgetResult } = useProjectStore();

    // 根据项目状态判断当前所处阶段
    const getCurrentStageId = () => {
        if (projectId) return 'construct';
        if (budgetResult) return 'compare';
        return 'prep';
    };

    const currentStageId = getCurrentStageId();
    const progress = projectId ? getTotalProgress() : 0;

    const stages = [
        {
            id: 'prep',
            title: '准备期',
            desc: '收集灵感 · 初步估产',
            icon: <AppOutline />,
            color: '#4F46E5',
            path: '/ai-consult',
            tips: ['多看案例定风格', '先算大数不抓瞎'],
        },
        {
            id: 'design',
            title: '设计期',
            desc: '确定方案 · 精细预算',
            icon: <EditSOutline />,
            color: '#7C3AED',
            path: '/quick-budget',
            tips: ['平面布局最核心', '开关插座先想好'],
        },
        {
            id: 'compare',
            title: '比价期',
            desc: '审核报价 · 规避陷阱',
            icon: <SearchOutline />,
            color: '#EC4899',
            path: '/quote-check',
            tips: ['单价低不代表总价低', '注意漏项和材料缩水'],
        },
        {
            id: 'construct',
            title: '施工期',
            desc: '节点验收 · 进度把控',
            icon: <CheckShieldOutline />,
            color: '#10B981',
            path: '/construction',
            tips: ['隐蔽工程是关键', '增项要先签单再干'],
        },
        {
            id: 'accept',
            title: '验收期',
            desc: '环保检测 · 尾款支付',
            icon: <ContentOutline />,
            color: '#F59E0B',
            path: '/construction/checklist',
            tips: ['空鼓检测', '水电压力测试'],
        },
        {
            id: 'movein',
            title: '入住期',
            desc: '软装搭配 · 售后保修',
            icon: <SmileOutline />,
            color: '#3B82F6',
            path: '/',
            tips: ['晾晒通风', '质保卡收齐'],
        },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.title}>装修生命周期</div>
                <div className={styles.subtitle}>跟着节奏走，装修不踩坑</div>
            </div>

            <div className={styles.track}>
                {stages.map((stage, index) => {
                    const isActive = stage.id === currentStageId;
                    const isCompleted = stages.findIndex(s => s.id === currentStageId) > index;

                    return (
                        <div key={stage.id} className={`${styles.stageItem} ${isActive ? styles.active : ''}`} onClick={() => navigate(stage.path)}>
                            <div className={styles.nodeWrapper}>
                                <div
                                    className={styles.iconNode}
                                    style={{
                                        backgroundColor: isCompleted ? '#10B981' : stage.color,
                                        boxShadow: isActive ? `0 0 15px ${stage.color}88` : 'none',
                                        opacity: isCompleted || isActive ? 1 : 0.6
                                    }}
                                >
                                    {isCompleted ? '✓' : stage.icon}
                                </div>
                                {index < stages.length - 1 && (
                                    <div className={`${styles.connector} ${isCompleted ? styles.connectorDone : ''}`} />
                                )}
                            </div>

                            <div className={styles.content}>
                                <div className={styles.stageHeader}>
                                    <div className={styles.stageTitle}>
                                        {stage.title}
                                        {isActive && <Tag color="primary" fill="outline" style={{ marginLeft: 8, fontSize: 10 }}>进行中</Tag>}
                                    </div>
                                    <span className={styles.index}>Step {index + 1}</span>
                                </div>
                                <div className={styles.stageDesc}>{stage.desc}</div>

                                {isActive && stage.id === 'construct' && projectId && (
                                    <div style={{ marginTop: 8 }}>
                                        <ProgressBar percent={progress} style={{ '--track-width': '4px' } as any} />
                                        <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 4 }}>
                                            当前进度 {progress}%
                                        </div>
                                    </div>
                                )}

                                <div className={styles.tips}>
                                    {stage.tips.map(tip => (
                                        <Tag key={tip} color="primary" fill="outline" className={styles.tipTag}>
                                            {tip}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default JourneyMap;
