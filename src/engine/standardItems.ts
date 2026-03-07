export interface StandardItem {
    id: string;
    standardName: string;
    aliases: string[];
    category: string;
    pricingMode: 'area' | 'linear_meter' | 'point' | 'quantity';
    unit: string;
    commonPriceRange: { min: number; max: number };
    riskLevel: 'high' | 'medium' | 'low';
    isHighFrequency: boolean;
    isCommonMissingRelated: boolean;
    description: string;
    commonTricks: string[];  // 常见增项套路
}

export const STANDARD_ITEMS: StandardItem[] = [
    // ===== 拆改类 =====
    {
        id: 'STD_DEMOLISH_WALL',
        standardName: '拆墙',
        aliases: ['砸墙', '拆除墙体', '拆旧墙', '墙体拆除', '拆除非承重墙'],
        category: '拆改',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 40, max: 100 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '拆除非承重墙体',
        commonTricks: ['只报拆除不报垃圾清运', '按面积算但实际按体积收费'],
    },
    {
        id: 'STD_BUILD_WALL',
        standardName: '砌墙',
        aliases: ['新砌墙', '砌筑墙体', '加墙', '隔墙', '新建墙体', '轻质砖墙'],
        category: '拆改',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 80, max: 180 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '新砌轻质砖或红砖墙体',
        commonTricks: ['不含门头过梁费用', '不含粉刷费用'],
    },

    // ===== 水电类 =====
    {
        id: 'STD_STRONG_ELECTRIC',
        standardName: '强电改造',
        aliases: ['强电', '强电线路', '电路改造', '电线布线', '照明线路', '插座线路', '开槽布线'],
        category: '水电',
        pricingMode: 'point',
        unit: '点位',
        commonPriceRange: { min: 80, max: 200 },
        riskLevel: 'high',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '220V照明和插座线路改造',
        commonTricks: [
            '报价按米但不明确是单线还是一组线',
            '实际走线绕远增加米数',
            '不含配电箱升级费',
            '底盒另外收费',
        ],
    },
    {
        id: 'STD_WEAK_ELECTRIC',
        standardName: '弱电改造',
        aliases: ['弱电', '弱电线路', '网线', '电视线', '弱电布线', '智能线路'],
        category: '水电',
        pricingMode: 'point',
        unit: '点位',
        commonPriceRange: { min: 80, max: 180 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '网线、电话线、电视线等弱电线路',
        commonTricks: ['不含面板费用', '不明确网线规格（超五类/六类）'],
    },
    {
        id: 'STD_WATER_SUPPLY',
        standardName: '给水管改造',
        aliases: ['上水', '给水', '进水管', '水管改造', 'PPR管', '冷热水管'],
        category: '水电',
        pricingMode: 'linear_meter',
        unit: 'm',
        commonPriceRange: { min: 50, max: 120 },
        riskLevel: 'high',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: 'PPR冷热水管路改造',
        commonTricks: ['不含管件（弯头三通等）', '不含打压试验费', '冷热水管不分别报价'],
    },
    {
        id: 'STD_DRAINAGE',
        standardName: '排水管改造',
        aliases: ['下水', '排水', '排水管', '下水管', '污水管改造'],
        category: '水电',
        pricingMode: 'linear_meter',
        unit: 'm',
        commonPriceRange: { min: 60, max: 150 },
        riskLevel: 'high',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '排水管路改造',
        commonTricks: ['不含地漏安装', '移位马桶不含同层排水费用'],
    },

    // ===== 防水类 =====
    {
        id: 'STD_WATERPROOF',
        standardName: '防水施工',
        aliases: ['防水', '刷防水', '防水涂料', '防水层', '卫生间防水', '厨房防水'],
        category: '防水',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 45, max: 120 },
        riskLevel: 'high',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '防水涂料施工（含材料+人工）',
        commonTricks: [
            '不明确涂刷遍数（标准至少两遍）',
            '不含闭水试验费',
            '防水高度不明确',
            '不含墙面防水只做地面',
        ],
    },
    {
        id: 'STD_CLOSED_WATER_TEST',
        standardName: '闭水试验',
        aliases: ['闭水', '蓄水试验', '防水检测', '闭水测试'],
        category: '防水',
        pricingMode: 'quantity',
        unit: '次',
        commonPriceRange: { min: 0, max: 200 },
        riskLevel: 'high',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '防水施工后蓄水检测',
        commonTricks: ['一些公司免费做但不在报价里体现', '闭水时间不足48小时'],
    },

    // ===== 瓦工类 =====
    {
        id: 'STD_FLOOR_TILE',
        standardName: '铺地砖',
        aliases: ['贴地砖', '地面贴砖', '地砖铺贴', '铺贴地面砖', '地面瓷砖', '贴地面砖'],
        category: '瓦工',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 35, max: 80 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '地面瓷砖铺贴人工费',
        commonTricks: [
            '不含瓷砖费用只含人工',
            '异形砖/小砖/大板砖加价不明确',
            '不含水泥砂浆费',
            '波导线另外收费',
        ],
    },
    {
        id: 'STD_WALL_TILE',
        standardName: '铺墙砖',
        aliases: ['贴墙砖', '墙面贴砖', '墙砖铺贴', '厨卫墙砖', '贴墙面砖'],
        category: '瓦工',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 40, max: 90 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '墙面瓷砖铺贴人工费',
        commonTricks: ['不明确是否含拉毛处理', '异形砖加价'],
    },
    {
        id: 'STD_LEVELING',
        standardName: '地面找平',
        aliases: ['找平', '自流平', '水泥找平', '地面处理', '地面平整'],
        category: '瓦工',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 25, max: 60 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '铺木地板前地面找平处理',
        commonTricks: ['不明确找平厚度', '自流平和水泥砂浆找平价差大'],
    },
    {
        id: 'STD_THRESHOLD_STONE',
        standardName: '门槛石',
        aliases: ['过门石', '门坎石', '门口石', '过渡石'],
        category: '瓦工',
        pricingMode: 'quantity',
        unit: '块',
        commonPriceRange: { min: 80, max: 300 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '空间过渡处的石材',
        commonTricks: ['不含材料费只含安装费', '天然石和人造石价差大'],
    },
    {
        id: 'STD_GROUT_BEAUTY',
        standardName: '美缝',
        aliases: ['瓷砖美缝', '勾缝', '填缝', '美缝剂', '瓷砖缝处理'],
        category: '瓦工',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 15, max: 45 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '瓷砖缝隙填充美化处理',
        commonTricks: ['按平米算但实际按延米更准确', '品牌美缝剂和普通差价大'],
    },

    // ===== 墙面类 =====
    {
        id: 'STD_WALL_BASE',
        standardName: '墙面基层处理',
        aliases: ['铲墙皮', '墙面处理', '基层处理', '墙面找平', '刮腻子', '批腻子', '腻子处理'],
        category: '墙面',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 15, max: 35 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '墙面腻子批刮打磨',
        commonTricks: [
            '不明确腻子品牌',
            '批腻子遍数不明确（标准2-3遍）',
            '铲墙皮另外收费',
            '挂网另外收费',
        ],
    },
    {
        id: 'STD_WALL_PAINT',
        standardName: '乳胶漆施工',
        aliases: ['刷漆', '墙面漆', '乳胶漆', '刷乳胶漆', '涂料施工', '墙漆', '面漆'],
        category: '墙面',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 8, max: 25 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '乳胶漆涂刷（底漆+面漆）',
        commonTricks: [
            '只报面漆不含底漆',
            '不含调色费',
            '不明确是否含材料',
            '喷涂和滚涂价格不同但不标注',
        ],
    },
    {
        id: 'STD_CEILING_PAINT',
        standardName: '顶面乳胶漆',
        aliases: ['顶面漆', '天花板漆', '天花板刷漆', '顶面涂料'],
        category: '墙面',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 8, max: 25 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '顶面乳胶漆涂刷',
        commonTricks: ['与墙面漆合并计算面积导致不清晰'],
    },

    // ===== 吊顶类 =====
    {
        id: 'STD_CEILING_PLASTER',
        standardName: '石膏板吊顶',
        aliases: ['吊顶', '客厅吊顶', '轻钢龙骨吊顶', '造型吊顶', '石膏板天花'],
        category: '吊顶',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 100, max: 250 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '轻钢龙骨+石膏板吊顶',
        commonTricks: [
            '不含灯槽/灯带凹槽费用',
            '不明确龙骨类型（轻钢vs木龙骨）',
            '异形造型额外收费',
            '跌级吊顶按投影面积还是展开面积',
        ],
    },
    {
        id: 'STD_CEILING_INTEGRATED',
        standardName: '集成吊顶',
        aliases: ['铝扣板吊顶', '厨卫吊顶', '蜂窝大板', '厨房吊顶', '卫生间吊顶'],
        category: '吊顶',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 100, max: 250 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '厨卫铝扣板/蜂窝板集成吊顶',
        commonTricks: ['不含灯和换气扇', '边角料另外计费'],
    },

    // ===== 门类 =====
    {
        id: 'STD_INTERIOR_DOOR',
        standardName: '室内门',
        aliases: ['木门', '房间门', '卧室门', '实木门', '复合门', '免漆门'],
        category: '门',
        pricingMode: 'quantity',
        unit: '樘',
        commonPriceRange: { min: 1000, max: 4000 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '室内房间门（含门套五金）',
        commonTricks: [
            '不含门锁五金',
            '超标准尺寸加价',
            '门套单独计费',
            '安装费另算',
        ],
    },
    {
        id: 'STD_BATHROOM_DOOR',
        standardName: '卫生间门',
        aliases: ['卫生间推拉门', '卫生间移门', '厕所门', '铝合金门'],
        category: '门',
        pricingMode: 'quantity',
        unit: '樘',
        commonPriceRange: { min: 800, max: 3000 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '卫生间铝合金/钛镁合金门',
        commonTricks: ['玻璃类型不明确', '轨道五金另外收费'],
    },

    // ===== 橱柜类 =====
    {
        id: 'STD_CABINET_BASE',
        standardName: '橱柜地柜',
        aliases: ['橱柜', '地柜', '厨柜', '下柜体'],
        category: '橱柜',
        pricingMode: 'linear_meter',
        unit: 'm',
        commonPriceRange: { min: 800, max: 3000 },
        riskLevel: 'high',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '橱柜地柜（含柜体+柜门）',
        commonTricks: [
            '标配只含最基础板材',
            '超标准加价项多（拉篮、调味架、转角柜等）',
            '五金件按标配计算，升级另付费',
            '台下盆开孔另外收费',
        ],
    },
    {
        id: 'STD_CABINET_WALL',
        standardName: '橱柜吊柜',
        aliases: ['吊柜', '上柜', '壁柜'],
        category: '橱柜',
        pricingMode: 'linear_meter',
        unit: 'm',
        commonPriceRange: { min: 500, max: 2000 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '橱柜吊柜（含柜体+柜门）',
        commonTricks: ['超标准高度加价', '上翻门五金另外收费'],
    },
    {
        id: 'STD_COUNTERTOP',
        standardName: '橱柜台面',
        aliases: ['台面', '石英石台面', '岩板台面', '厨房台面'],
        category: '橱柜',
        pricingMode: 'linear_meter',
        unit: 'm',
        commonPriceRange: { min: 400, max: 2000 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '橱柜台面（石英石/岩板等）',
        commonTricks: ['前挡水条和后挡水条另外收费', '台面厚度不同价差大'],
    },

    // ===== 卫浴类 =====
    {
        id: 'STD_TOILET',
        standardName: '马桶',
        aliases: ['座便器', '坐便器', '智能马桶', '虹吸马桶'],
        category: '卫浴',
        pricingMode: 'quantity',
        unit: '个',
        commonPriceRange: { min: 800, max: 5000 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '马桶（含安装）',
        commonTricks: ['安装费不含', '角阀和软管不含', '法兰圈不含'],
    },
    {
        id: 'STD_SHOWER',
        standardName: '花洒套装',
        aliases: ['花洒', '淋浴花洒', '淋浴器', '淋浴套装', '恒温花洒'],
        category: '卫浴',
        pricingMode: 'quantity',
        unit: '套',
        commonPriceRange: { min: 500, max: 3000 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '淋浴花洒套装（顶喷+手持）',
        commonTricks: ['安装费不含', '混水阀不含'],
    },
    {
        id: 'STD_VANITY',
        standardName: '浴室柜',
        aliases: ['洗手台', '洗漱台', '面盆柜', '卫浴柜', '台盆柜'],
        category: '卫浴',
        pricingMode: 'quantity',
        unit: '套',
        commonPriceRange: { min: 800, max: 4000 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '浴室柜（含柜体+面盆+镜子/镜柜）',
        commonTricks: ['龙头不含', '下水器不含', '镜柜另配'],
    },

    // ===== 定制类 =====
    {
        id: 'STD_WARDROBE_PROJECTION',
        standardName: '定制衣柜（投影面积）',
        aliases: ['衣柜', '定制柜', '全屋定制', '入墙柜'],
        category: '定制',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 500, max: 1800 },
        riskLevel: 'high',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '定制衣柜按投影面积计价',
        commonTricks: [
            '五金件额外收费（抽屉、裤架、旋转镜等）',
            '非标准深度加价',
            '顶封板/收边另外收费',
            '投影面积和展开面积计价方式混淆',
        ],
    },
    {
        id: 'STD_WARDROBE_EXPAND',
        standardName: '定制衣柜（展开面积）',
        aliases: ['衣柜展开', '柜体展开面积'],
        category: '定制',
        pricingMode: 'area',
        unit: '㎡',
        commonPriceRange: { min: 150, max: 600 },
        riskLevel: 'high',
        isHighFrequency: false,
        isCommonMissingRelated: false,
        description: '定制衣柜按展开面积计价',
        commonTricks: ['看起来单价低但总价可能更高', '层板越多总价越高'],
    },

    // ===== 其他类 =====
    {
        id: 'STD_BASEBOARD',
        standardName: '踢脚线',
        aliases: ['踢脚', '地脚线', '墙角线'],
        category: '其他',
        pricingMode: 'linear_meter',
        unit: 'm',
        commonPriceRange: { min: 10, max: 40 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '墙底踢脚线安装',
        commonTricks: ['不含材料只含安装', '阴角阳角另外收费'],
    },
    {
        id: 'STD_SWITCH_PANEL',
        standardName: '开关面板',
        aliases: ['开关', '插座', '开关插座', '面板', '五孔插座', '开关面板'],
        category: '电气',
        pricingMode: 'quantity',
        unit: '个',
        commonPriceRange: { min: 10, max: 80 },
        riskLevel: 'low',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '开关和插座面板',
        commonTricks: ['只含普通五孔，USB插座和特殊开关另付'],
    },
    {
        id: 'STD_GARBAGE_REMOVAL',
        standardName: '垃圾清运',
        aliases: ['垃圾清理', '建筑垃圾', '装修垃圾', '渣土清运', '垃圾外运'],
        category: '其他',
        pricingMode: 'quantity',
        unit: '项',
        commonPriceRange: { min: 500, max: 2000 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '装修垃圾从室内到指定堆放点',
        commonTricks: ['只含下楼不含外运', '按车数额外收费', '不含上楼搬运'],
    },
    {
        id: 'STD_MATERIAL_TRANSPORT',
        standardName: '材料搬运',
        aliases: ['上楼费', '搬运费', '材料上楼', '人工搬运'],
        category: '其他',
        pricingMode: 'quantity',
        unit: '项',
        commonPriceRange: { min: 300, max: 1500 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '装修材料从楼下搬到室内',
        commonTricks: ['无电梯加价', '高楼层加价标准不清'],
    },
    {
        id: 'STD_PRODUCT_PROTECTION',
        standardName: '成品保护',
        aliases: ['保护', '地面保护', '成品保护膜', '施工保护'],
        category: '其他',
        pricingMode: 'quantity',
        unit: '项',
        commonPriceRange: { min: 300, max: 1500 },
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: true,
        description: '已安装好的门窗、地面等成品保护',
        commonTricks: ['保护范围不明确', '保护时长不明确'],
    },
    {
        id: 'STD_MANAGEMENT_FEE',
        standardName: '管理费',
        aliases: ['工程管理费', '项目管理', '设计管理费'],
        category: '其他',
        pricingMode: 'quantity',
        unit: '项',
        commonPriceRange: { min: 0, max: 0 },  // 按比例
        riskLevel: 'medium',
        isHighFrequency: true,
        isCommonMissingRelated: false,
        description: '施工管理费（通常为工程总价的5%-10%）',
        commonTricks: ['比例不明确', '管理内容不明确（是否含监理）'],
    },
];

// 标准项匹配引擎
export function matchStandardItem(rawName: string): { item: StandardItem; confidence: number } | null {
    const normalized = rawName.trim().toLowerCase();

    // 第一层：精确匹配标准名
    for (const item of STANDARD_ITEMS) {
        if (item.standardName === rawName.trim()) {
            return { item, confidence: 1.0 };
        }
    }

    // 第二层：精确匹配别名
    for (const item of STANDARD_ITEMS) {
        if (item.aliases.some(a => a === rawName.trim())) {
            return { item, confidence: 0.95 };
        }
    }

    // 第三层：模糊关键词匹配
    let bestMatch: { item: StandardItem; score: number } | null = null;

    for (const item of STANDARD_ITEMS) {
        const allNames = [item.standardName, ...item.aliases];
        for (const name of allNames) {
            const score = fuzzyMatchScore(normalized, name.toLowerCase());
            if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = { item, score };
            }
        }
    }

    if (bestMatch) {
        return { item: bestMatch.item, confidence: Math.min(0.85, bestMatch.score) };
    }

    return null;
}

// 简单模糊匹配评分
function fuzzyMatchScore(input: string, target: string): number {
    if (input === target) return 1.0;
    if (input.includes(target) || target.includes(input)) return 0.8;

    // 关键词重叠度
    const inputChars = new Set(input.split(''));
    const targetChars = new Set(target.split(''));
    const intersection = [...inputChars].filter(c => targetChars.has(c));
    const union = new Set([...inputChars, ...targetChars]);

    return intersection.length / union.size;
}

// 获取所有标准项（按类目分组）
export function getStandardItemsByCategory(): Map<string, StandardItem[]> {
    const map = new Map<string, StandardItem[]>();
    for (const item of STANDARD_ITEMS) {
        if (!map.has(item.category)) map.set(item.category, []);
        map.get(item.category)!.push(item);
    }
    return map;
}
