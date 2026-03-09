import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd-mobile';
import { useAuthStore } from '@/store/authStore';
import JourneyMap from '@/components/JourneyMap';

const features = [
    { icon: 'AI', title: '先算大概多少钱', desc: 'AI 对话收集需求，直接帮你生成预算。', path: '/ai-consult', accent: '#eef2ff' },
    { icon: '图', title: 'AI 效果图', desc: '上传房间实拍，快速看风格改造参考。', path: '/ai-design', accent: '#e0f2fe' },
    { icon: '测', title: '风格测试', desc: 'A/B 问卷定位偏好，输出装修风格画像。', path: '/style-quiz', accent: '#ede9fe' },
    { icon: '瀑', title: '灵感瀑布流', desc: '按风格/房间/档次筛选并收藏到 mood board。', path: '/inspiration', accent: '#f0fdf4' },
    { icon: '表', title: '直接填表算', desc: '不想聊天也行，几分钟快速出结果。', path: '/quick-budget', accent: '#ecfdf5' },
    { icon: '价', title: '帮我看报价', desc: '拍照或粘贴报价单，快速找坑点。', path: '/quote-check', accent: '#fef3c7' },
    { icon: '约', title: '合同避坑审核', desc: '把付款、延期、质保等关键条款过一遍。', path: '/contract-check', accent: '#e0e7ff' },
    { icon: '漏', title: '检查漏了什么', desc: '把容易遗漏的项目和预算风险提前提醒出来。', path: '/missing-check', accent: '#fff7ed' },
    { icon: '工', title: '施工陪跑', desc: '进度、采购、验收、付款一页管起来。', path: '/construction', accent: '#ecfeff' },
    { icon: 'AR', title: 'AR 实景预览', desc: '基于 WebXR 的轻量 AR 预览入口。', path: '/ar-preview', accent: '#cffafe' },
    { icon: 'VR', title: 'VR 全景漫游', desc: '360 全景图沉浸浏览，提前看空间感。', path: '/vr-tour', accent: '#fef2f2' },
    { icon: '词', title: '术语百科', desc: '看不懂装修黑话时，随手查一下。', path: '/glossary', accent: '#fdf2f8' },
];

export default function Home() {
    const navigate = useNavigate();
    const { nickname, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="page-shell page-shell--tight">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(99, 102, 241, 0.10)', color: 'var(--color-primary)' }}>
                            欢迎回来
                        </div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>
                            {nickname || '装修达人'}，今天先解决哪一步？
                        </div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>
                            预算、报价、合同、施工，全流程都可以在这里一起推进。
                        </div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={handleLogout}>
                        退出登录
                    </Button>
                </div>

                <div className="page-hero page-hero--indigo">
                    <div className="page-kicker">AI 装修预算助手</div>
                    <div className="page-title" style={{ marginTop: 16 }}>把装修这件复杂事，拆成你看得懂的每一步</div>
                    <div className="page-subtitle" style={{ marginTop: 12, maxWidth: 640 }}>
                        从前期预算、报价审核到施工陪跑和术语解释，系统会按节点给你建议，让第一次装修也能有章法。
                    </div>
                    <div className="action-row" style={{ marginTop: 18 }}>
                        <Button color="primary" fill="solid" shape="rounded" onClick={() => navigate('/ai-consult')}>
                            立即开始 AI 咨询
                        </Button>
                        <Button fill="outline" shape="rounded" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.26)' }} onClick={() => navigate('/quick-budget')}>
                            直接填表出预算
                        </Button>
                    </div>
                </div>

                <JourneyMap />

                <div className="section-card">
                    <div className="page-section-title">
                        <h2>常用功能</h2>
                        <span className="inline-pill">一站式陪跑</span>
                    </div>
                    <div className="feature-grid">
                        {features.map((item) => (
                            <div key={item.path} className="feature-card" onClick={() => navigate(item.path)} style={{ cursor: 'pointer' }}>
                                <div className="feature-icon" style={{ background: item.accent, fontWeight: 800, color: 'var(--color-text)' }}>
                                    {item.icon}
                                </div>
                                <div className="feature-title">{item.title}</div>
                                <div className="feature-desc">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="note-card note-card--warning">
                    <div className="note-icon">提示</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>温馨说明</div>
                        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                            所有预算结果都是参考估算，实际费用会受到施工报价、材料品牌、现场条件和工艺标准影响，通常会有 10% - 20% 的浮动。
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
