import React, { useState, useMemo } from 'react';
import { SearchBar, Collapse, Tag, Empty } from 'antd-mobile';
import { GLOSSARY_FULL, GlossaryEntry } from '@/engine/glossaryData';

// 提取所有标签并统计频次
const ALL_TAGS = (() => {
    const tagCount = new Map<string, number>();
    GLOSSARY_FULL.forEach(g => g.tags.forEach(t => tagCount.set(t, (tagCount.get(t) || 0) + 1)));
    return Array.from(tagCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([tag]) => tag);
})();

export default function Glossary() {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search.trim()) return GLOSSARY_FULL;
        const keyword = search.trim().toLowerCase();
        return GLOSSARY_FULL.filter(g =>
            g.term.toLowerCase().includes(keyword) ||
            g.tags.some(t => t.includes(keyword)) ||
            g.definition.includes(keyword) ||
            g.purpose.includes(keyword)
        );
    }, [search]);

    // 按标签分组（当搜索标签时）
    const isTagSearch = ALL_TAGS.includes(search);

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>
            {/* 搜索 */}
            <div style={{ padding: '12px 16px', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                <SearchBar
                    placeholder="搜索装修术语，如：闭水试验、空鼓、找平"
                    value={search}
                    onChange={setSearch}
                    style={{ '--background': '#F3F4F6', '--border-radius': '20px' } as any}
                />
                <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 6 }}>
                    共收录 {GLOSSARY_FULL.length} 个装修术语
                </div>
            </div>

            <div style={{ padding: '0 16px 16px' }}>
                {/* 标签快捷筛选 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0' }}>
                    <Tag
                        color={!search ? 'primary' : 'default'}
                        fill={!search ? 'solid' : 'outline'}
                        style={{ cursor: 'pointer', padding: '4px 10px' }}
                        onClick={() => setSearch('')}
                    >
                        全部 ({GLOSSARY_FULL.length})
                    </Tag>
                    {ALL_TAGS.map(tag => (
                        <Tag
                            key={tag}
                            color={search === tag ? 'primary' : 'default'}
                            fill={search === tag ? 'solid' : 'outline'}
                            style={{ cursor: 'pointer', padding: '4px 10px' }}
                            onClick={() => setSearch(search === tag ? '' : tag)}
                        >
                            {tag}
                        </Tag>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <Empty description="没有找到相关术语" style={{ marginTop: 60 }} />
                ) : (
                    <Collapse accordion>
                        {filtered.map(item => (
                            <Collapse.Panel
                                key={item.id}
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 600, fontSize: 15 }}>{item.term}</span>
                                        {item.tags.slice(0, 2).map(t => (
                                            <Tag key={t} color="primary" fill="outline" style={{ fontSize: 10 }}>{t}</Tag>
                                        ))}
                                    </div>
                                }
                            >
                                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                                    <div style={{ marginBottom: 10 }}>
                                        <b>📖 一句话解释：</b>{item.definition}
                                    </div>
                                    <div style={{ marginBottom: 10 }}>
                                        <b>🎯 作用是什么：</b>{item.purpose}
                                    </div>
                                    <div style={{ marginBottom: 10, color: '#DC2626' }}>
                                        <b>⚠️ 不做会怎样：</b>{item.riskIfSkipped}
                                    </div>
                                    <div style={{ marginBottom: 10, color: '#D97706' }}>
                                        <b>❌ 常见误区：</b>{item.commonMistakes}
                                    </div>
                                    <div style={{ color: '#059669' }}>
                                        <b>✅ 怎么验/怎么问：</b>{item.howToVerify}
                                    </div>
                                </div>
                            </Collapse.Panel>
                        ))}
                    </Collapse>
                )}
            </div>
        </div>
    );
}
