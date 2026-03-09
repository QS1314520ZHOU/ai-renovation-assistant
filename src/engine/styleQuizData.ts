import { StyleKey } from './designInspirationData';

export interface QuizOption {
    id: 'A' | 'B';
    title: string;
    desc: string;
    imageUrl: string;
    styleWeight: Partial<Record<StyleKey, number>>;
    tone: 'warm' | 'neutral' | 'cool';
    material: 'wood' | 'stone' | 'mixed';
}

export interface QuizQuestion {
    id: string;
    title: string;
    options: [QuizOption, QuizOption];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 'q1',
        title: '你更喜欢哪种客厅氛围？',
        options: [
            {
                id: 'A',
                title: '留白简洁',
                desc: '线条干净、装饰少、收纳隐藏。',
                imageUrl: 'https://images.unsplash.com/photo-1616594039964-8db67f4f62f5?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { modern: 3, nordic: 1 },
                tone: 'neutral',
                material: 'mixed',
            },
            {
                id: 'B',
                title: '木质温润',
                desc: '木纹比例更高、温馨感明显。',
                imageUrl: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { nordic: 2, japanese: 2 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
    {
        id: 'q2',
        title: '厨房更偏向哪种风格？',
        options: [
            {
                id: 'A',
                title: '极简台面',
                desc: '大面积纯色柜门，视觉更利落。',
                imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { modern: 2, luxury: 1 },
                tone: 'neutral',
                material: 'stone',
            },
            {
                id: 'B',
                title: '木色厨区',
                desc: '木质面板和柔和光源更生活化。',
                imageUrl: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { nordic: 2, chinese: 1, japanese: 1 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
    {
        id: 'q3',
        title: '你更想要的卧室感觉是？',
        options: [
            {
                id: 'A',
                title: '酒店感',
                desc: '灯光层次明显、材质精致。',
                imageUrl: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { luxury: 3, modern: 1 },
                tone: 'neutral',
                material: 'mixed',
            },
            {
                id: 'B',
                title: '治愈感',
                desc: '低饱和、自然光、舒压放松。',
                imageUrl: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { japanese: 2, nordic: 2 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
    {
        id: 'q4',
        title: '颜色偏好更接近？',
        options: [
            {
                id: 'A',
                title: '灰白冷静',
                desc: '黑白灰+局部深色对比。',
                imageUrl: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { modern: 2, luxury: 2 },
                tone: 'cool',
                material: 'stone',
            },
            {
                id: 'B',
                title: '米棕暖调',
                desc: '更柔和、更生活化的暖色。',
                imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { nordic: 1, japanese: 2, chinese: 1 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
    {
        id: 'q5',
        title: '背景墙你会选？',
        options: [
            {
                id: 'A',
                title: '石材岩板',
                desc: '纹理清晰、冲击力强。',
                imageUrl: 'https://images.unsplash.com/photo-1617104551722-3b2d513664fd?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { luxury: 3, modern: 1 },
                tone: 'neutral',
                material: 'stone',
            },
            {
                id: 'B',
                title: '木格栅',
                desc: '更温润，适合东方审美。',
                imageUrl: 'https://images.unsplash.com/photo-1600494603989-9650cf6ddd3d?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { chinese: 3, japanese: 1 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
    {
        id: 'q6',
        title: '你偏好哪种软装？',
        options: [
            {
                id: 'A',
                title: '线条家具',
                desc: '造型干净、边角利落。',
                imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { modern: 2, nordic: 1 },
                tone: 'neutral',
                material: 'mixed',
            },
            {
                id: 'B',
                title: '低矮木家具',
                desc: '更松弛，靠近自然感。',
                imageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { japanese: 3, nordic: 1 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
    {
        id: 'q7',
        title: '照明风格更像？',
        options: [
            {
                id: 'A',
                title: '无主灯',
                desc: '磁吸轨道和洗墙灯做氛围。',
                imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { modern: 2, luxury: 2 },
                tone: 'cool',
                material: 'mixed',
            },
            {
                id: 'B',
                title: '暖黄灯带',
                desc: '柔和均匀，居家氛围更明显。',
                imageUrl: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { japanese: 1, nordic: 2, chinese: 1 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
    {
        id: 'q8',
        title: '餐厅形态你更倾向？',
        options: [
            {
                id: 'A',
                title: '开放岛台',
                desc: '强调社交和互动，空间更现代。',
                imageUrl: 'https://images.unsplash.com/photo-1600566752227-8f3b2e4e50f5?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { modern: 2, luxury: 2 },
                tone: 'neutral',
                material: 'stone',
            },
            {
                id: 'B',
                title: '木质餐桌',
                desc: '注重日常烟火和温润触感。',
                imageUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { nordic: 2, chinese: 1, japanese: 1 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
    {
        id: 'q9',
        title: '你更看重哪种质感？',
        options: [
            {
                id: 'A',
                title: '高级冷感',
                desc: '金属、玻璃、深色石材。',
                imageUrl: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { luxury: 3, modern: 1 },
                tone: 'cool',
                material: 'stone',
            },
            {
                id: 'B',
                title: '自然暖感',
                desc: '木材、棉麻、低饱和配色。',
                imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { nordic: 2, japanese: 2 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
    {
        id: 'q10',
        title: '你希望家里更像？',
        options: [
            {
                id: 'A',
                title: '展示空间',
                desc: '秩序感强，视觉冲击更明确。',
                imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { modern: 1, luxury: 2, chinese: 1 },
                tone: 'neutral',
                material: 'mixed',
            },
            {
                id: 'B',
                title: '居住空间',
                desc: '舒适优先，耐看耐用。',
                imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { nordic: 2, japanese: 1, chinese: 1 },
                tone: 'warm',
                material: 'mixed',
            },
        ],
    },
    {
        id: 'q11',
        title: '你更偏好哪种卫浴？',
        options: [
            {
                id: 'A',
                title: '大理石纹',
                desc: '视觉干净，质感偏高级。',
                imageUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { modern: 1, luxury: 2 },
                tone: 'cool',
                material: 'stone',
            },
            {
                id: 'B',
                title: '木石平衡',
                desc: '干区温润，湿区实用。',
                imageUrl: 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c3?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { japanese: 1, nordic: 1, chinese: 2 },
                tone: 'warm',
                material: 'mixed',
            },
        ],
    },
    {
        id: 'q12',
        title: '收纳方式你更倾向？',
        options: [
            {
                id: 'A',
                title: '全隐藏柜体',
                desc: '统一立面，观感干净。',
                imageUrl: 'https://images.unsplash.com/photo-1616137466000-7174d3d9a0ce?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { modern: 2, luxury: 2 },
                tone: 'neutral',
                material: 'mixed',
            },
            {
                id: 'B',
                title: '开放+封闭组合',
                desc: '展示与实用平衡，更有生活气息。',
                imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?auto=format&fit=crop&w=1200&q=80',
                styleWeight: { nordic: 2, chinese: 1, japanese: 1 },
                tone: 'warm',
                material: 'wood',
            },
        ],
    },
];
