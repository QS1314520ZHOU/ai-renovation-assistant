import React, { useState } from 'react';
import { Toast } from 'antd-mobile';

interface Props {
    type: 'budget' | 'missing' | 'ai' | 'glossary';
}

const questions: Record<string, string> = {
    budget: '这个预算和你的预期相比？',
    missing: '这些提醒对你有帮助吗？',
    ai: '本次回答是否有用？',
    glossary: '这个解释你看懂了吗？',
};

const options: Record<string, string[]> = {
    budget: ['偏低', '差不多', '偏高'],
    missing: ['有帮助', '一般', '没帮助'],
    ai: ['有用', '不确定', '没用'],
    glossary: ['看懂了', '有点不懂', '完全不懂'],
};

export default function FeedbackWidget({ type }: Props) {
    const [submitted, setSubmitted] = useState(false);

    const handleFeedback = (value: string) => {
        setSubmitted(true);
        // 实际项目这里应该上报到后端
        console.log('Feedback:', { type, value, timestamp: new Date().toISOString() });
        Toast.show({ content: '感谢反馈！', duration: 1500 });
    };

    if (submitted) {
        return (
            <div style={{
                margin: '0 12px 16px',
                padding: '10px 16px',
                background: '#F0FDF4',
                borderRadius: 10,
                textAlign: 'center',
                fontSize: 13,
                color: '#059669',
            }}>
                ✅ 已收到你的反馈，谢谢！
            </div>
        );
    }

    return (
        <div style={{
            margin: '0 12px 16px',
            padding: '12px 16px',
            background: '#fff',
            borderRadius: 12,
            boxShadow: 'var(--shadow-sm)',
        }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                {questions[type]}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                {(options[type] || []).map(opt => (
                    <div
                        key={opt}
                        onClick={() => handleFeedback(opt)}
                        style={{
                            flex: 1,
                            padding: '8px 4px',
                            textAlign: 'center',
                            background: '#F3F4F6',
                            borderRadius: 8,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {opt}
                    </div>
                ))}
            </div>
        </div>
    );
}
