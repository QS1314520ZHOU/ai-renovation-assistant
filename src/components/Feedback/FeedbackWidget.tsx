import React, { useState } from 'react';
import { Toast } from 'antd-mobile';

interface Props {
    type: 'budget' | 'missing' | 'ai' | 'glossary';
}

const questions: Record<Props['type'], string> = {
    budget: '这个预算结果和你的预期相比怎么样？',
    missing: '这些漏项提醒对你有帮助吗？',
    ai: '这次 AI 结果对你有帮助吗？',
    glossary: '这个术语解释够清楚吗？',
};

const options: Record<Props['type'], string[]> = {
    budget: ['偏低', '差不多', '偏高'],
    missing: ['很有帮助', '一般', '没帮助'],
    ai: ['有帮助', '一般', '没帮助'],
    glossary: ['看懂了', '有点模糊', '还是不懂'],
};

export default function FeedbackWidget({ type }: Props) {
    const [submitted, setSubmitted] = useState(false);

    const handleFeedback = (value: string) => {
        setSubmitted(true);
        console.log('Feedback:', { type, value, timestamp: new Date().toISOString() });
        Toast.show({ content: '感谢反馈，我们会继续优化。', duration: 1500 });
    };

    if (submitted) {
        return (
            <div className="note-card note-card--success">
                <div className="note-icon">已收</div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>反馈已收到</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.88 }}>你的反馈会用于继续优化模型回答和页面体验。</div>
                </div>
            </div>
        );
    }

    return (
        <div className="panel-card">
            <div className="page-section-title">
                <h3>体验反馈</h3>
                <span className="inline-pill">30 秒完成</span>
            </div>
            <div className="muted-text" style={{ fontSize: 13, marginBottom: 12 }}>
                {questions[type]}
            </div>
            <div className="action-row">
                {(options[type] || []).map((option) => (
                    <div key={option} onClick={() => handleFeedback(option)} className="metric-card" style={{ padding: '12px 14px', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                        {option}
                    </div>
                ))}
            </div>
        </div>
    );
}