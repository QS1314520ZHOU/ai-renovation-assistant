import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Grid } from 'antd-mobile';
import { useAuthStore } from '@/store/authStore';
const features = [
  { icon: '🤖', title: '先算大概多少钱', desc: 'AI帮你快速出预算', path: '/ai-consult', color: '#EEF2FF' },
  { icon: '📋', title: '直接填表算', desc: '手动填写快速估算', path: '/quick-budget', color: '#F0FDF4' },
  { icon: '🔍', title: '帮我看报价', desc: '报价单体检找问题', path: '/quote-check', color: '#FEF3C7' },
  { icon: '⚠️', title: '检查漏了什么', desc: '智能漏项提醒', path: '/missing-check', color: '#FFF7ED' },
  { icon: '🏗️', title: '施工陪跑', desc: '进度·采购·验收·付款', path: '/construction', color: '#ECFDF5' },
  { icon: '📖', title: '这个词啥意思', desc: '装修术语翻译器', path: '/glossary', color: '#FDF2F8' },
];


export default function Home() {
  const navigate = useNavigate();
  const { nickname, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f5f5f5', borderRadius: 8, margin: '0 16px 16px' }}>
        <span>👋 你好，{nickname || '装修达人'}</span>
        <Button size="small" onClick={handleLogout}>退出</Button>
      </div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        padding: '40px 20px 50px',
        borderRadius: '0 0 24px 24px',
        color: '#fff',
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>AI装修预算助手</h1>
        <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, marginBottom: 24 }}>
          帮你算清装修账、看懂报价单、避开装修坑
        </p>
        <Button
          color="default"
          size="large"
          shape="rounded"
          style={{
            width: '100%',
            fontWeight: 600,
            fontSize: 16,
            height: 48,
            '--background-color': '#fff',
            '--text-color': '#4F46E5',
          } as any}
          onClick={() => navigate('/ai-consult')}
        >
          🚀 开始装修
        </Button>
      </div>

      {/* Feature Grid */}
      <div style={{ padding: '20px 16px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text)' }}>
          我想做什么？
        </h2>
        <Grid columns={2} gap={12}>
          {features.map((f) => (
            <Grid.Item key={f.path}>
              <div
                onClick={() => navigate(f.path)}
                style={{
                  background: f.color,
                  borderRadius: 'var(--radius-md)',
                  padding: '20px 16px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {f.desc}
                </div>
              </div>
            </Grid.Item>
          ))}
        </Grid>
      </div>

      {/* Tip Banner */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>
              小贴士
            </div>
            <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
              所有预算为参考估算，实际费用受施工报价、材料品牌、现场情况影响，通常存在10%-20%的浮动。
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 60 }} />
    </div>
  );
}
