import React, { useState, useEffect, useMemo } from 'react';
import { SearchBar, Collapse, Tag, DotLoading } from 'antd-mobile';
import { glossaryApi } from '@/api/services';
import FeedbackWidget from '@/components/Feedback/FeedbackWidget';

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
        return terms.filter((item) =>
            item.term.toLowerCase().includes(keyword)
            || (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(keyword)))
            || item.definition.toLowerCase().includes(keyword)
            || (item.purpose && item.purpose.toLowerCase().includes(keyword)),
        );
    }, [search, terms]);

    const popularTags = useMemo(() => {
        const map = new Map<string, number>();
        terms.forEach((item) => {
            if (item.tags) {
                item.tags.forEach((tag: string) => map.set(tag, (map.get(tag) || 0) + 1));
            }
        });
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag);
    }, [terms]);

    return (
        <div className="page-shell">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(99, 102, 241, 0.10)', color: 'var(--color-primary)' }}>术语百科</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>把装修黑话翻译成人话</div>
                        <div className="muted-text" style={{ fontSize: 13, marginTop: 6 }}>
                            共收录 {loading ? '...' : terms.length} 个术语，支持按关键词和标签快速检索。
                        </div>
                    </div>
                </div>

                <div className="section-card" style={{ position: 'sticky', top: 8, zIndex: 8 }}>
                    <SearchBar
                        placeholder="搜索术语，例如：闭水试验、空鼓、找平"
                        value={search}
                        onChange={setSearch}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                        {popularTags.map((tag) => (
                            <Tag key={tag} color={search === tag ? 'primary' : 'default'} fill={search === tag ? 'solid' : 'outline'} onClick={() => setSearch(search === tag ? '' : tag)} style={{ cursor: 'pointer' }}>
                                {tag}
                            </Tag>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="empty-card"><DotLoading color="primary" /></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-card">
                        <div className="empty-title">没找到相关术语</div>
                        <div className="empty-desc">换个关键词试试，或者直接搜索更具体的工艺名称。</div>
                    </div>
                ) : (
                    <div className="section-card">
                        <div className="page-section-title">
                            <h3>术语列表</h3>
                            <span className="inline-pill">{filtered.length} 条结果</span>
                        </div>
                        <Collapse accordion>
                            {filtered.map((item) => (
                                <Collapse.Panel
                                    key={item.id}
                                    title={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: 15 }}>{item.term}</span>
                                            {item.tags?.slice(0, 2).map((tag: string) => (
                                                <Tag key={tag} color="primary" fill="outline" style={{ fontSize: 10 }}>{tag}</Tag>
                                            ))}
                                        </div>
                                    }
                                >
                                    <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
                                        <div style={{ marginBottom: 10 }}><strong style={{ color: 'var(--color-text)' }}>一句话解释：</strong>{item.definition}</div>
                                        {item.purpose && <div style={{ marginBottom: 10 }}><strong style={{ color: 'var(--color-text)' }}>它的作用：</strong>{item.purpose}</div>}
                                        {item.risk && <div style={{ marginBottom: 10, color: '#be123c' }}><strong>不做会怎样：</strong>{item.risk}</div>}
                                        {item.common_pitfall && <div style={{ marginBottom: 10, color: '#b45309' }}><strong>常见误区：</strong>{item.common_pitfall}</div>}
                                        {item.verify_method && <div style={{ color: '#047857' }}><strong>现场怎么验：</strong>{item.verify_method}</div>}
                                    </div>
                                </Collapse.Panel>
                            ))}
                        </Collapse>
                    </div>
                )}

                <FeedbackWidget type="glossary" />
            </div>
        </div>
    );
}