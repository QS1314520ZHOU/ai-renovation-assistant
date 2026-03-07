import React from 'react';
import { Popover } from 'antd-mobile';
import { QuestionCircleOutline } from 'antd-mobile-icons';
import { useGlossaryStore } from '@/store/glossaryStore';

interface TermItemProps {
    name: string;
    children?: React.ReactNode;
}

const TermItem: React.FC<TermItemProps> = ({ name, children }) => {
    const { findTerm } = useGlossaryStore();
    const term = findTerm(name);

    if (!term) return <>{children || name}</>;

    return (
        <Popover
            content={
                <div style={{ padding: 12, maxWidth: 240, fontSize: 13 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-primary)' }}>{term.term}</div>
                    <div style={{ marginBottom: 8, color: '#4B5563', lineHeight: 1.5 }}>{term.definition}</div>
                    {term.risk && (
                        <div style={{ color: '#DC2626', fontSize: 12, borderTop: '1px solid #F3F4F6', paddingTop: 8, marginTop: 4 }}>
                            ⚠️ 风险：{term.risk}
                        </div>
                    )}
                    {term.verify_method && (
                        <div style={{ color: '#059669', fontSize: 12, marginTop: 4 }}>
                            ✅ 检查：{term.verify_method}
                        </div>
                    )}
                </div>
            }
            trigger='click'
            placement='top-start'
        >
            <span style={{
                color: 'var(--color-primary)',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2
            }}>
                {children || name} <QuestionCircleOutline style={{ fontSize: 12 }} />
            </span>
        </Popover>
    );
};

export default TermItem;
