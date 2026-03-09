import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ProgressBar, Tag } from 'antd-mobile';

import { QUIZ_QUESTIONS, QuizOption } from '@/engine/styleQuizData';
import {
    defaultBudgetByTierWan,
    inferFloorPreference,
    inferSpecialNeeds,
    mapStyleToTier,
} from '@/engine/designBudgetBridge';
import { STYLE_OPTIONS, StyleKey } from '@/engine/designInspirationData';
import { useDesignStore } from '@/store';

type ToneType = 'warm' | 'neutral' | 'cool';
type MaterialType = 'wood' | 'stone' | 'mixed';

const STYLE_LABEL_MAP = Object.fromEntries(STYLE_OPTIONS.map((item) => [item.key, item.label])) as Record<StyleKey, string>;
const TONE_LABEL: Record<ToneType, string> = {
    warm: '偏暖',
    neutral: '中性',
    cool: '偏冷',
};
const MATERIAL_LABEL: Record<MaterialType, string> = {
    wood: '木质感',
    stone: '石材感',
    mixed: '平衡混搭',
};

function buildKeywords(style: StyleKey, tone: ToneType, material: MaterialType): string[] {
    const styleWords: Record<StyleKey, string[]> = {
        modern: ['利落线条', '大面留白', '无主灯层次'],
        nordic: ['自然光感', '浅木柔和', '轻松舒适'],
        japanese: ['原木留白', '低饱和', '收纳有序'],
        luxury: ['精致材质', '光影对比', '高级氛围'],
        chinese: ['东方元素', '木格栅', '礼序感'],
    };
    return [...styleWords[style], TONE_LABEL[tone], MATERIAL_LABEL[material]];
}

export default function StyleQuiz() {
    const navigate = useNavigate();
    const { setQuizProfile, setPreferredStyle, setBudgetBridge } = useDesignStore();

    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, QuizOption>>({});
    const [finished, setFinished] = useState(false);

    const current = QUIZ_QUESTIONS[index];
    const progress = Math.round(((index + (finished ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100);

    const result = useMemo(() => {
        if (!finished) return null;

        const styleScores: Record<StyleKey, number> = {
            modern: 0,
            nordic: 0,
            japanese: 0,
            luxury: 0,
            chinese: 0,
        };
        const toneCounter: Record<ToneType, number> = { warm: 0, neutral: 0, cool: 0 };
        const materialCounter: Record<MaterialType, number> = { wood: 0, stone: 0, mixed: 0 };

        Object.values(answers).forEach((option) => {
            toneCounter[option.tone] += 1;
            materialCounter[option.material] += 1;
            (Object.keys(option.styleWeight) as StyleKey[]).forEach((key) => {
                styleScores[key] += Number(option.styleWeight[key] || 0);
            });
        });

        const primaryStyle = (Object.keys(styleScores) as StyleKey[]).sort(
            (a, b) => styleScores[b] - styleScores[a],
        )[0];
        const tonePreference = (Object.keys(toneCounter) as ToneType[]).sort(
            (a, b) => toneCounter[b] - toneCounter[a],
        )[0];
        const materialPreference = (Object.keys(materialCounter) as MaterialType[]).sort(
            (a, b) => materialCounter[b] - materialCounter[a],
        )[0];

        return {
            primaryStyle,
            styleScores,
            tonePreference,
            materialPreference,
            keywords: buildKeywords(primaryStyle, tonePreference, materialPreference),
        };
    }, [answers, finished]);

    const handleSelect = (option: QuizOption) => {
        const nextAnswers = { ...answers, [current.id]: option };
        setAnswers(nextAnswers);

        if (index >= QUIZ_QUESTIONS.length - 1) {
            setFinished(true);
            const styleScores: Record<StyleKey, number> = {
                modern: 0,
                nordic: 0,
                japanese: 0,
                luxury: 0,
                chinese: 0,
            };
            const toneCounter: Record<ToneType, number> = { warm: 0, neutral: 0, cool: 0 };
            const materialCounter: Record<MaterialType, number> = { wood: 0, stone: 0, mixed: 0 };

            Object.values(nextAnswers).forEach((item) => {
                toneCounter[item.tone] += 1;
                materialCounter[item.material] += 1;
                (Object.keys(item.styleWeight) as StyleKey[]).forEach((key) => {
                    styleScores[key] += Number(item.styleWeight[key] || 0);
                });
            });

            const primaryStyle = (Object.keys(styleScores) as StyleKey[]).sort(
                (a, b) => styleScores[b] - styleScores[a],
            )[0];
            const tonePreference = (Object.keys(toneCounter) as ToneType[]).sort(
                (a, b) => toneCounter[b] - toneCounter[a],
            )[0];
            const materialPreference = (Object.keys(materialCounter) as MaterialType[]).sort(
                (a, b) => materialCounter[b] - materialCounter[a],
            )[0];

            const profile = {
                primaryStyle,
                styleScores,
                tonePreference,
                materialPreference,
                keywords: buildKeywords(primaryStyle, tonePreference, materialPreference),
            };
            setPreferredStyle(primaryStyle);
            setQuizProfile(profile);
            return;
        }
        setIndex((prev) => prev + 1);
    };

    const handlePrefillBudget = () => {
        if (!result) return;
        const styleMap: Record<StyleKey, string> = {
            modern: 'modern_minimal',
            nordic: 'nordic',
            japanese: 'japanese',
            luxury: 'light_luxury',
            chinese: 'new_chinese',
        };
        const styleKey = styleMap[result.primaryStyle];
        const tierLevel = mapStyleToTier(styleKey);
        const floorPreference = inferFloorPreference(
            result.materialPreference === 'wood' ? '木质' : result.materialPreference === 'stone' ? '岩板' : '木石混搭',
            STYLE_LABEL_MAP[result.primaryStyle],
        );
        const hasCustomCabinet = tierLevel !== 'economy';
        const hasCeiling = tierLevel !== 'economy' || result.tonePreference !== 'warm';
        const includeFurniture = true;

        setBudgetBridge({
            source: 'style_quiz',
            styleKey,
            tierLevel,
            floorPreference,
            hasCeiling,
            hasCustomCabinet,
            includeFurniture,
            suggestedBudgetWan: defaultBudgetByTierWan(tierLevel),
            specialNeeds: inferSpecialNeeds({ hasCeiling, hasCustomCabinet, includeFurniture }),
            summary: `来自风格测试：${STYLE_LABEL_MAP[result.primaryStyle]}，建议 ${tierLevel} 档，地面偏好 ${floorPreference}。`,
        });
        navigate('/quick-budget?from=design');
    };

    return (
        <div className="page-shell page-shell--no-tabbar">
            <div className="page-stack">
                <div className="page-topbar">
                    <div>
                        <div className="page-kicker" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0369a1' }}>风格测试</div>
                        <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>
                            10-15 题，找出你的装修风格画像
                        </div>
                    </div>
                    <Button fill="outline" shape="rounded" onClick={() => navigate(-1)}>
                        返回
                    </Button>
                </div>

                {!finished && (
                    <>
                        <div className="section-card">
                            <div className="page-section-title">
                                <h3>
                                    第 {index + 1} / {QUIZ_QUESTIONS.length} 题
                                </h3>
                                <span className="inline-pill">{progress}%</span>
                            </div>
                            <ProgressBar percent={progress} style={{ '--track-width': '6px' } as React.CSSProperties} />
                            <div style={{ marginTop: 14, fontSize: 16, fontWeight: 700 }}>{current.title}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                            {current.options.map((option) => (
                                <div key={option.id} className="section-card" style={{ padding: 12, cursor: 'pointer' }} onClick={() => handleSelect(option)}>
                                    <img
                                        src={option.imageUrl}
                                        alt={option.title}
                                        style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 14 }}
                                    />
                                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Tag color="primary" fill="outline">选项 {option.id}</Tag>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{option.title}</div>
                                    </div>
                                    <div className="feature-desc" style={{ marginTop: 6 }}>{option.desc}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {finished && result && (
                    <>
                        <div className="page-hero page-hero--sky">
                            <div className="page-kicker">风格画像</div>
                            <div className="page-title" style={{ marginTop: 14 }}>{STYLE_LABEL_MAP[result.primaryStyle]}</div>
                            <div className="page-subtitle" style={{ marginTop: 10 }}>
                                色调偏好 {TONE_LABEL[result.tonePreference]} · 材质偏好 {MATERIAL_LABEL[result.materialPreference]}
                            </div>
                        </div>

                        <div className="section-card">
                            <div className="page-section-title">
                                <h3>关键偏好</h3>
                                <span className="inline-pill">可用于生成效果图 prompt</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {result.keywords.map((word) => (
                                    <Tag key={word} color="primary" fill="outline">{word}</Tag>
                                ))}
                            </div>
                            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(Object.keys(result.styleScores) as StyleKey[])
                                    .sort((a, b) => result.styleScores[b] - result.styleScores[a])
                                    .map((key) => (
                                        <div key={key}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                <span>{STYLE_LABEL_MAP[key]}</span>
                                                <span>{result.styleScores[key]}</span>
                                            </div>
                                            <ProgressBar
                                                percent={Math.min(100, Math.round((result.styleScores[key] / 12) * 100))}
                                                style={{ '--track-width': '5px' } as React.CSSProperties}
                                            />
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="action-row">
                            <Button block color="primary" shape="rounded" onClick={() => navigate(`/inspiration?style=${result.primaryStyle}`)}>
                                去看灵感瀑布流
                            </Button>
                            <Button block fill="outline" shape="rounded" onClick={() => navigate(`/ai-design?style=${result.primaryStyle}`)}>
                                用这个风格生成效果图
                            </Button>
                            <Button block fill="outline" shape="rounded" onClick={handlePrefillBudget}>
                                按风格预填预算
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
