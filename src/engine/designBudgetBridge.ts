import { FloorPreference, TierLevel } from '@/types';

export interface DesignBudgetBridge {
    source: 'ai_design' | 'style_quiz' | 'inspiration';
    styleKey: string;
    tierLevel: TierLevel;
    floorPreference: FloorPreference;
    hasCeiling: boolean;
    hasCustomCabinet: boolean;
    includeFurniture: boolean;
    suggestedBudgetWan?: number;
    summary: string;
    specialNeeds: string[];
}

const WOOD_HINTS = ['木', '原木', '木质', 'wood', 'japanese', 'nordic'];
const STONE_HINTS = ['石', '岩板', 'stone', 'luxury'];

export function mapStyleToTier(styleKey: string): TierLevel {
    const key = (styleKey || '').toLowerCase();
    if (key.includes('light_luxury') || key.includes('new_chinese') || key.includes('luxury') || key.includes('chinese')) {
        return 'premium';
    }
    if (key.includes('modern') || key.includes('nordic') || key.includes('japanese')) {
        return 'standard';
    }
    return 'standard';
}

export function inferFloorPreference(...texts: Array<string | undefined>): FloorPreference {
    const fullText = texts
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    const hasWood = WOOD_HINTS.some((item) => fullText.includes(item));
    const hasStone = STONE_HINTS.some((item) => fullText.includes(item));

    if (hasWood && !hasStone) return 'wood';
    if (hasStone && !hasWood) return 'tile';
    if (hasWood && hasStone) return 'mixed';
    return 'mixed';
}

export function defaultBudgetByTierWan(tier: TierLevel): number {
    if (tier === 'economy') return 12;
    if (tier === 'premium') return 30;
    return 18;
}

export function inferSpecialNeeds(config: {
    hasCeiling: boolean;
    hasCustomCabinet: boolean;
    includeFurniture: boolean;
}): string[] {
    const needs: string[] = [];
    if (config.hasCeiling) needs.push('吊顶');
    if (config.hasCustomCabinet) needs.push('定制柜');
    if (config.includeFurniture) needs.push('含家具家电');
    return needs;
}
