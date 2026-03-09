import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Tag } from 'antd-mobile';

import {
    defaultBudgetByTierWan,
    inferFloorPreference,
    inferSpecialNeeds,
    mapStyleToTier,
} from '@/engine/designBudgetBridge';
import {
    ROOM_OPTIONS,
    STYLE_OPTIONS,
    DesignRoomType,
    StyleKey,
    getDesignInspirations,
} from '@/engine/designInspirationData';
import { useDesignStore } from '@/store';
import { TierLevel } from '@/types';

const TIER_OPTIONS: Array<{ key: TierLevel; label: string }> = [
    { key: 'economy', label: '经济档' },
    { key: 'standard', label: '标准档' },
    { key: 'premium', label: '品质档' },
];

type TierFilter = TierLevel | 'all';
type StyleFilter = StyleKey | 'all';
type RoomFilter = DesignRoomType | 'all';

export default function Inspiration() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const styleFromQuery = (searchParams.get('style') as StyleFilter | null) || 'all';

    const { favorites, toggleFavorite, clearFavorites, preferredStyle, setBudgetBridge } = useDesignStore();
    const [styleFilter, setStyleFilter] = useState<StyleFilter>(styleFromQuery === 'all' ? (preferredStyle || 'all') : styleFromQuery);
    const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');
    const [tierFilter, setTierFilter] = useState<TierFilter>('all');
    const [keyword, setKeyword] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const list = useMemo(() => {
        const result = getDesignInspirations({
            styleKey: styleFilter,
            roomType: roomFilter,
            tier: tierFilter === 'all' ? undefined : tierFilter,
            keyword,
            ids: showFavoritesOnly ? favorites : undefined,
        });
        return result;
    }, [favorites, keyword, roomFilter, showFavoritesOnly, styleFilter, tierFilter]);

    const moodBoard = useMemo(() => getDesignInspirations({ ids: favorites }), [favorites]);

    const handlePrefillBudget = () => {
        const styleAliasMap: Record<StyleKey, string> = {
            modern: 'modern_minimal',
            nordic: 'nordic',
            japanese: 'japanese',
            luxury: 'light_luxury',
            chinese: 'new_chinese',
        };

        const pickedStyle: StyleKey = (
            styleFilter !== 'all'
                ? styleFilter
                : preferredStyle
                    || (moodBoard[0]?.styleKey as StyleKey | undefined)
                    || 'modern'
        ) as StyleKey;
        const styleKey = styleAliasMap[pickedStyle];
        const tierLevel = tierFilter !== 'all' ? tierFilter : mapStyleToTier(styleKey);
        const floorPreference = inferFloorPreference(
            pickedStyle,
            keyword,
            moodBoard.map((item) => item.title).join(' '),
        );
        const hasCustomCabinet = tierLevel !== 'economy';
        const hasCeiling = tierLevel !== 'economy';
        const includeFurniture = true;

        setBudgetBridge({
            source: 'inspiration',
            styleKey,
            tierLevel,
            floorPreference,
            hasCeiling,
            hasCustomCabinet,
            includeFurniture,
            suggestedBudgetWan: defaultBudgetByTierWan(tierLevel),
            specialNeeds: inferSpecialNeeds({ hasCeiling, hasCustomCabinet, includeFurniture }),
            summary: `来自灵感收藏：${pickedStyle} 风格，建议 ${tierLevel} 档，地面偏好 ${floorPreference}。`,
        });
        navigate('/quick-budget?from=design');
    };

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(99, 102, 241, 0.10)', color: 'var(--color-primary)' }}>灵感瀑布流</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>按风格、房间、档次筛选灵感图</div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>
                        返回
                    </Button>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>筛选条件</h3>
                        <span className="inline-pill">{list.length} 张</span>
                    </div>
                    <Input
                        placeholder="搜索标题/描述/风格"
                        value={keyword}
                        onChange={setKeyword}
                        clearable
                    />
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <Tag color={styleFilter === 'all' ? 'primary' : 'default'} fill={styleFilter === 'all' ? 'solid' : 'outline'} onClick={() => setStyleFilter('all')}>
                            全部风格
                        </Tag>
                        {STYLE_OPTIONS.map((item) => (
                            <Tag
                                key={item.key}
                                color={styleFilter === item.key ? 'primary' : 'default'}
                                fill={styleFilter === item.key ? 'solid' : 'outline'}
                                onClick={() => setStyleFilter(item.key)}
                            >
                                {item.label}
                            </Tag>
                        ))}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <Tag color={roomFilter === 'all' ? 'primary' : 'default'} fill={roomFilter === 'all' ? 'solid' : 'outline'} onClick={() => setRoomFilter('all')}>
                            全部房间
                        </Tag>
                        {ROOM_OPTIONS.map((item) => (
                            <Tag
                                key={item.key}
                                color={roomFilter === item.key ? 'primary' : 'default'}
                                fill={roomFilter === item.key ? 'solid' : 'outline'}
                                onClick={() => setRoomFilter(item.key)}
                            >
                                {item.label}
                            </Tag>
                        ))}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <Tag color={tierFilter === 'all' ? 'primary' : 'default'} fill={tierFilter === 'all' ? 'solid' : 'outline'} onClick={() => setTierFilter('all')}>
                            全部档次
                        </Tag>
                        {TIER_OPTIONS.map((item) => (
                            <Tag
                                key={item.key}
                                color={tierFilter === item.key ? 'primary' : 'default'}
                                fill={tierFilter === item.key ? 'solid' : 'outline'}
                                onClick={() => setTierFilter(item.key)}
                            >
                                {item.label}
                            </Tag>
                        ))}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button size="small" color="primary" fill={showFavoritesOnly ? 'solid' : 'outline'} onClick={() => setShowFavoritesOnly((prev) => !prev)}>
                            {showFavoritesOnly ? '正在看收藏' : '只看收藏'}
                        </Button>
                        <Button size="small" fill="outline" onClick={clearFavorites} disabled={favorites.length === 0}>
                            清空收藏
                        </Button>
                    </div>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>灵感图墙</h3>
                        <span className="inline-pill">点击卡片右上角收藏</span>
                    </div>
                    <div style={{ columns: '2 180px', columnGap: 12 }}>
                        {list.map((item) => {
                            const active = favorites.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    style={{
                                        breakInside: 'avoid',
                                        marginBottom: 12,
                                        background: 'rgba(255,255,255,0.84)',
                                        borderRadius: 16,
                                        padding: 10,
                                        border: '1px solid rgba(148,163,184,0.18)',
                                        boxShadow: 'var(--shadow-xs)',
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleFavorite(item.id)}
                                            style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                border: 'none',
                                                borderRadius: 999,
                                                width: 34,
                                                height: 34,
                                                background: active ? '#ef4444' : 'rgba(15,23,42,0.45)',
                                                color: '#fff',
                                                fontSize: 18,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {active ? '❤' : '♡'}
                                        </button>
                                    </div>
                                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <Tag color="primary" fill="outline" style={{ fontSize: 10 }}>{item.style}</Tag>
                                        <Tag fill="outline" style={{ fontSize: 10 }}>{item.roomType}</Tag>
                                        <Tag fill="outline" style={{ fontSize: 10 }}>{item.areaRange}</Tag>
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                                    <div className="feature-desc" style={{ marginTop: 4 }}>{item.desc}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="section-card">
                    <div className="page-section-title">
                        <h3>我的 Mood Board</h3>
                        <span className="inline-pill">{moodBoard.length} 张已收藏</span>
                    </div>
                    {moodBoard.length === 0 ? (
                        <div className="feature-desc">先在上方收藏几张你喜欢的灵感图，再一键带入 AI 效果图生成。</div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                                {moodBoard.slice(0, 8).map((item) => (
                                    <img key={item.id} src={item.imageUrl} alt={item.title} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 12 }} />
                                ))}
                            </div>
                            <div className="action-row" style={{ marginTop: 12 }}>
                                <Button block color="primary" shape="rounded" onClick={() => navigate('/ai-design')}>
                                    用收藏灵感去生成效果图
                                </Button>
                                <Button block fill="outline" shape="rounded" onClick={() => navigate('/style-quiz')}>
                                    重做风格测试
                                </Button>
                                <Button block fill="outline" shape="rounded" onClick={handlePrefillBudget}>
                                    按收藏预填预算
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
