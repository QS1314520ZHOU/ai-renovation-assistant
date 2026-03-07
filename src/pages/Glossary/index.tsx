import React, { useState, useEffect, useMemo } from 'react';
import { SearchBar, Collapse, Tag, Empty, DotLoading } from 'antd-mobile';
import { glossaryApi } from '@/api/services';

export default function Glossary() {
    const [search, setSearch] = useState('');
    const [terms, setTerms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const data = await glossaryApi.list();
                setTerms(data);
            } catch (error) {
                console.error('Failed to fetch glossary:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTerms();
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return terms;
        const keyword = search.trim().toLowerCase();
        return terms.filter(g =>
            g.term.toLowerCase().includes(keyword) ||
            (g.tags && g.tags.some((t: string) => t.includes(keyword))) ||
            g.definition.includes(keyword) ||
            (g.purpose && g.purpose.includes(keyword))
        );
    }, [search, terms]);

    // 提取热门标签
    const ALL_TAGS = useMemo(() => {
        const tagCount = new Map<string, number>();
        terms.forEach(g => {
            if (g.tags) g.tags.forEach((t: string) => tagCount.set(t, (tagCount.get(t) || 0) + 1));
        });
        return Array.from(tagCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag]) => tag);
    }, [terms]);

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>
            <div style={{ padding: '12px 16px', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                <SearchBar
                    placeholder="搜索装修术语，如：闭水试验、空鼓、找平"
                    value={search}
                    onChange={setSearch}
                    style={{ '--background': '#F3F4F6', '--border-radius': '20px' } as any}
                />
                <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 6 }}>
                    {loading ? '加载中...' : `共收录 ${terms.length} 个装修术语`}
                </div>
            </div>

            <div style={{ padding: '0 16px 16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0' }}>
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

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><DotLoading /></div>
                ) : filtered.length === 0 ? (
                    <Empty description="没有找到相关术语" style={{ marginTop: 60 }} />
                ) : (
                    <Collapse accordion>
                        {filtered.map(item => (
                            <Collapse.Panel
                                key={item.id}
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 600, fontSize: 15 }}>{item.term}</span>
                                        {item.tags?.slice(0, 2).map((t: string) => (
                                            <Tag key={t} color="primary" fill="outline" style={{ fontSize: 10 }}>{t}</Tag>
                                        ))}
                                    </div>
                                }
                            >
                                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                                    <div style={{ marginBottom: 10 }}>
                                        <b>📖 一句话解释：</b>{item.definition}
                                    </div>
                                    {item.purpose && (
                                        <div style={{ marginBottom: 10 }}>
                                            <b>🎯 作用是什么：</b>{item.purpose}
                                        </div>
                                    )}
                                    {item.risk && (
                                        <div style={{ marginBottom: 10, color: '#DC2626' }}>
                                            <b>⚠️ 不做会怎样：</b>{item.risk}
                                        </div>
                                    )}
                                    {item.common_pitfall && (
                                        <div style={{ marginBottom: 10, color: '#D97706' }}>
                                            <b>❌ 常见误区：</b>{item.common_pitfall}
                                        </div>
                                    )}
                                    {item.verify_method && (
                                        <div style={{ color: '#059669' }}>
                                            <b>✅ 怎么验/怎么问：</b>{item.verify_method}
                                        </div>
                                    )}
                                </div>
                            </Collapse.Panel>
                        ))}
                    </Collapse>
                )}
            </div>
        </div>
    );
}
