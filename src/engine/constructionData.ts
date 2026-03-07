import { PhaseInfo, ChecklistItem, PurchaseItem, ConstructionPhase } from '@/types';

// 阶段基础信息
export const PHASE_LIST: PhaseInfo[] = [
    {
        phase: 'pre_construction', name: '开工准备', icon: '📋', order: 0,
        typicalDurationDays: 7,
        description: '确定施工方、签合同、办开工手续、邻居告知',
    },
    {
        phase: 'demolition', name: '拆改阶段', icon: '🔨', order: 1,
        typicalDurationDays: 5,
        description: '拆除旧墙体、砌新墙、改结构（如有需要）',
    },
    {
        phase: 'hydroelectric', name: '水电改造', icon: '🔌', order: 2,
        typicalDurationDays: 10,
        description: '布线布管、开槽、穿线、水管试压',
    },
    {
        phase: 'waterproof', name: '防水工程', icon: '💧', order: 3,
        typicalDurationDays: 5,
        description: '刷防水涂料、闭水试验',
    },
    {
        phase: 'tiling', name: '瓦工阶段', icon: '🧱', order: 4,
        typicalDurationDays: 15,
        description: '贴瓷砖、地面找平、门槛石安装',
    },
    {
        phase: 'carpentry', name: '木工/吊顶', icon: '🪚', order: 5,
        typicalDurationDays: 10,
        description: '吊顶、背景墙造型、部分木作',
    },
    {
        phase: 'painting', name: '油工阶段', icon: '🎨', order: 6,
        typicalDurationDays: 15,
        description: '批腻子、打磨、刷底漆面漆',
    },
    {
        phase: 'installation', name: '安装阶段', icon: '🔧', order: 7,
        typicalDurationDays: 10,
        description: '橱柜、门、定制柜、卫浴、灯具、开关面板安装',
    },
    {
        phase: 'cleaning', name: '开荒保洁', icon: '🧹', order: 8,
        typicalDurationDays: 3,
        description: '全屋深度清洁，为入住做准备',
    },
    {
        phase: 'completed', name: '竣工验收', icon: '✅', order: 9,
        typicalDurationDays: 3,
        description: '全面验收，签竣工确认，确认尾款事项',
    },
    {
        phase: 'warranty', name: '维保期', icon: '🛡️', order: 10,
        typicalDurationDays: 730, // 2年
        description: '关注隐蔽工程保修、墙面开裂、防水问题等',
    },
];

// 各阶段验收清单
export const CHECKLIST_DATA: ChecklistItem[] = [
    // ===== 水电验收 =====
    { id: 'CK_HE_01', phase: 'hydroelectric', category: '线路', content: '强弱电是否分管分槽', importance: 'critical', howToCheck: '打开线槽看强电弱电是否在不同的管子里，交叉处是否有锡纸屏蔽', photoRequired: true, completed: false },
    { id: 'CK_HE_02', phase: 'hydroelectric', category: '线路', content: '线管内穿线是否超过管径40%', importance: 'critical', howToCheck: '抽出一段线，看管内是否太挤，标准是穿线截面不超过管径面积的40%', photoRequired: true, completed: false },
    { id: 'CK_HE_03', phase: 'hydroelectric', category: '线路', content: '所有线管接头是否使用锁扣', importance: 'important', howToCheck: '查看每个线管接头处是否有锁扣连接，不能只用胶布缠绕', photoRequired: true, completed: false },
    { id: 'CK_HE_04', phase: 'hydroelectric', category: '水管', content: '水管打压试验是否合格', importance: 'critical', howToCheck: '加压到0.8MPa，保压30分钟，压力下降不超过0.05MPa', photoRequired: true, completed: false },
    { id: 'CK_HE_05', phase: 'hydroelectric', category: '水管', content: '冷热水管间距是否达标', importance: 'important', howToCheck: '冷热水管间距不低于15cm，左热右冷', photoRequired: false, completed: false },
    { id: 'CK_HE_06', phase: 'hydroelectric', category: '开关', content: '所有开关插座位置是否与设计一致', importance: 'important', howToCheck: '对照设计图或现场标记，逐一核对每个点位的位置和高度', photoRequired: false, completed: false },
    { id: 'CK_HE_07', phase: 'hydroelectric', category: '线路', content: '厨卫是否使用防水接线盒', importance: 'important', howToCheck: '查看厨房和卫生间的接线盒是否带防水盖', photoRequired: true, completed: false },
    { id: 'CK_HE_08', phase: 'hydroelectric', category: '安全', content: '电路是否回路分开', importance: 'critical', howToCheck: '查看配电箱，照明、插座、厨房、卫生间、空调应各自独立回路', photoRequired: true, completed: false },
    { id: 'CK_HE_09', phase: 'hydroelectric', category: '记录', content: '是否拍摄了水电走向照片', importance: 'critical', howToCheck: '封槽之前必须拍摄全部水电走向照片并存档，便于后续检修定位', photoRequired: true, completed: false },
    { id: 'CK_HE_10', phase: 'hydroelectric', category: '水管', content: '下水管道是否做了隔音处理', importance: 'normal', howToCheck: '查看卫生间下水主管是否包了隔音棉', photoRequired: false, completed: false },

    // ===== 防水验收 =====
    { id: 'CK_WP_01', phase: 'waterproof', category: '施工', content: '防水涂料是否刷满两遍', importance: 'critical', howToCheck: '查看防水涂层是否均匀，颜色是否一致（两遍往往颜色有深浅差异，可辨别）', photoRequired: true, completed: false },
    { id: 'CK_WP_02', phase: 'waterproof', category: '施工', content: '卫生间墙面防水高度是否达标', importance: 'critical', howToCheck: '淋浴区墙面防水不低于1.8m，其他区域不低于30cm', photoRequired: true, completed: false },
    { id: 'CK_WP_03', phase: 'waterproof', category: '试验', content: '闭水试验是否做满48小时', importance: 'critical', howToCheck: '蓄水深度不低于3cm，放置48小时后去楼下检查有无渗漏', photoRequired: true, completed: false },
    { id: 'CK_WP_04', phase: 'waterproof', category: '试验', content: '楼下天花板有无渗漏痕迹', importance: 'critical', howToCheck: '48小时后亲自去楼下查看，或请楼下邻居拍照确认', photoRequired: true, completed: false },
    { id: 'CK_WP_05', phase: 'waterproof', category: '细节', content: '管道根部、墙角是否加强处理', importance: 'important', howToCheck: '这些位置最容易漏水，查看是否做了额外的防水涂刷', photoRequired: true, completed: false },
    { id: 'CK_WP_06', phase: 'waterproof', category: '细节', content: '地漏处防水是否到位', importance: 'important', howToCheck: '地漏四周防水涂料是否完整包裹，无遗漏', photoRequired: false, completed: false },
    { id: 'CK_WP_07', phase: 'waterproof', category: '记录', content: '防水品牌和批次是否记录', importance: 'normal', howToCheck: '拍摄防水材料包装照片，记录品牌型号和生产日期', photoRequired: true, completed: false },
    { id: 'CK_WP_08', phase: 'waterproof', category: '施工', content: '厨房是否做了防水', importance: 'important', howToCheck: '厨房建议做防水，至少地面+墙面30cm高度', photoRequired: false, completed: false },

    // ===== 瓦工验收 =====
    { id: 'CK_TL_01', phase: 'tiling', category: '平整度', content: '瓷砖是否平整、无翘角', importance: 'critical', howToCheck: '用2m靠尺检查，误差不超过2mm', photoRequired: false, completed: false },
    { id: 'CK_TL_02', phase: 'tiling', category: '空鼓', content: '空鼓率是否在标准内', importance: 'critical', howToCheck: '用空鼓锤逐块敲击，单块砖空鼓面积不超过15%，整面空鼓率不超过5%', photoRequired: true, completed: false },
    { id: 'CK_TL_03', phase: 'tiling', category: '缝隙', content: '瓷砖缝隙是否均匀', importance: 'important', howToCheck: '目视检查砖缝是否横平竖直、宽度一致', photoRequired: false, completed: false },
    { id: 'CK_TL_04', phase: 'tiling', category: '排水', content: '地面坡度是否朝地漏方向', importance: 'critical', howToCheck: '向地面泼水，水应自然流向地漏，不积水', photoRequired: true, completed: false },
    { id: 'CK_TL_05', phase: 'tiling', category: '细节', content: '阳角处是否做了倒角或用阳角条', importance: 'important', howToCheck: '查看瓷砖阳角位置是否有45度倒角或阳角条保护', photoRequired: true, completed: false },
    { id: 'CK_TL_06', phase: 'tiling', category: '细节', content: '门槛石是否安装到位', importance: 'important', howToCheck: '门槛石与两侧瓷砖/地板衔接是否紧密，高度是否合适', photoRequired: false, completed: false },
    { id: 'CK_TL_07', phase: 'tiling', category: '排水', content: '挡水条是否安装（淋浴区）', importance: 'important', howToCheck: '淋浴区应有挡水条隔断，防止水流到干区', photoRequired: true, completed: false },
    { id: 'CK_TL_08', phase: 'tiling', category: '质量', content: '瓷砖花色和批次是否一致', importance: 'normal', howToCheck: '对比不同位置的瓷砖，颜色和纹理是否有明显差异', photoRequired: false, completed: false },

    // ===== 油工验收 =====
    { id: 'CK_PT_01', phase: 'painting', category: '基层', content: '腻子是否打磨平整', importance: 'critical', howToCheck: '侧光照射墙面，观察是否有明显凹凸不平', photoRequired: false, completed: false },
    { id: 'CK_PT_02', phase: 'painting', category: '涂层', content: '乳胶漆颜色是否均匀', importance: 'important', howToCheck: '从不同角度观察，不应有色差、漏刷、流坠', photoRequired: false, completed: false },
    { id: 'CK_PT_03', phase: 'painting', category: '涂层', content: '是否刷了底漆+面漆', importance: 'critical', howToCheck: '确认底漆1遍+面漆2遍的标准流程，查看是否有遗漏', photoRequired: false, completed: false },
    { id: 'CK_PT_04', phase: 'painting', category: '细节', content: '阴阳角是否顺直', importance: 'important', howToCheck: '用靠尺或目测检查墙面阴角阳角是否笔直', photoRequired: false, completed: false },
    { id: 'CK_PT_05', phase: 'painting', category: '保护', content: '门窗框、开关盒是否有漆污', importance: 'normal', howToCheck: '查看门框、窗框、开关底盒周围是否有乳胶漆污渍', photoRequired: false, completed: false },
    { id: 'CK_PT_06', phase: 'painting', category: '质量', content: '墙面是否有裂缝', importance: 'critical', howToCheck: '仔细检查所有墙面和顶面，特别是新旧墙交接处是否有裂缝', photoRequired: true, completed: false },
    { id: 'CK_PT_07', phase: 'painting', category: '细节', content: '石膏线/吊顶与墙面交接是否平整', importance: 'normal', howToCheck: '查看吊顶边缘、石膏线与墙面的接缝是否紧密', photoRequired: false, completed: false },
    { id: 'CK_PT_08', phase: 'painting', category: '记录', content: '乳胶漆品牌型号是否与约定一致', importance: 'important', howToCheck: '核对乳胶漆桶上的品牌、型号、色号是否与合同一致', photoRequired: true, completed: false },

    // ===== 安装验收 =====
    { id: 'CK_IN_01', phase: 'installation', category: '橱柜', content: '橱柜安装是否水平、稳固', importance: 'critical', howToCheck: '用水平尺检查台面和柜体，手推测试是否晃动', photoRequired: false, completed: false },
    { id: 'CK_IN_02', phase: 'installation', category: '橱柜', content: '橱柜五金件是否顺滑', importance: 'important', howToCheck: '反复开关每个门板和抽屉，铰链是否顺畅、阻尼是否正常', photoRequired: false, completed: false },
    { id: 'CK_IN_03', phase: 'installation', category: '门', content: '室内门开关是否顺畅', importance: 'important', howToCheck: '每扇门反复开关5次，看是否有卡顿、异响、自动弹开或关不严', photoRequired: false, completed: false },
    { id: 'CK_IN_04', phase: 'installation', category: '门', content: '门套与墙面之间是否打胶密封', importance: 'normal', howToCheck: '查看门套周圈是否打了密封胶，缝隙是否美观', photoRequired: false, completed: false },
    { id: 'CK_IN_05', phase: 'installation', category: '卫浴', content: '马桶是否稳固、排水顺畅', importance: 'critical', howToCheck: '坐上去晃动测试，冲水观察排水速度和是否有渗漏', photoRequired: false, completed: false },
    { id: 'CK_IN_06', phase: 'installation', category: '卫浴', content: '花洒水压和切换是否正常', importance: 'important', howToCheck: '开花洒测试水压，切换顶喷/手持/龙头是否正常', photoRequired: false, completed: false },
    { id: 'CK_IN_07', phase: 'installation', category: '电器', content: '所有开关插座是否通电', importance: 'critical', howToCheck: '用试电笔或手机充电器逐个测试每个插座', photoRequired: false, completed: false },
    { id: 'CK_IN_08', phase: 'installation', category: '电器', content: '灯具是否全部正常亮起', importance: 'important', howToCheck: '逐一开关每个灯具，检查是否闪烁、不亮、色温是否正确', photoRequired: false, completed: false },
    { id: 'CK_IN_09', phase: 'installation', category: '定制柜', content: '定制柜门板是否对齐无缝', importance: 'important', howToCheck: '关上所有柜门，看缝隙是否均匀一致，门板是否在同一平面', photoRequired: true, completed: false },
    { id: 'CK_IN_10', phase: 'installation', category: '定制柜', content: '定制柜内部结构与设计是否一致', importance: 'important', howToCheck: '对照设计图核对层板数量、挂衣杆高度、抽屉位置', photoRequired: true, completed: false },

    // ===== 竣工验收 =====
    { id: 'CK_FN_01', phase: 'completed', category: '整体', content: '全屋卫生清洁是否到位', importance: 'important', howToCheck: '检查地面、窗台、柜内、灯具等是否清洁干净', photoRequired: false, completed: false },
    { id: 'CK_FN_02', phase: 'completed', category: '整体', content: '全屋开关插座功能复测', importance: 'critical', howToCheck: '逐一测试所有开关插座，包括空调插座、厨房插座等', photoRequired: false, completed: false },
    { id: 'CK_FN_03', phase: 'completed', category: '整体', content: '全屋门窗开关功能复测', importance: 'important', howToCheck: '每扇门窗反复开关，检查五金件、密封条、锁具', photoRequired: false, completed: false },
    { id: 'CK_FN_04', phase: 'completed', category: '水电', content: '全屋给排水功能复测', importance: 'critical', howToCheck: '打开所有水龙头、冲马桶、排地漏，检查出水、排水和密封性', photoRequired: false, completed: false },
    { id: 'CK_FN_05', phase: 'completed', category: '文档', content: '施工方是否提供竣工图纸', importance: 'important', howToCheck: '索要水电改造竣工图纸，标注实际走线位置', photoRequired: true, completed: false },
    { id: 'CK_FN_06', phase: 'completed', category: '文档', content: '保修卡和维保承诺是否签署', importance: 'critical', howToCheck: '确认施工方签署书面保修承诺，明确保修期限和范围', photoRequired: true, completed: false },
    { id: 'CK_FN_07', phase: 'completed', category: '收尾', content: '成品保护是否去除干净', importance: 'normal', howToCheck: '检查地面保护膜、门窗保护贴、台面保护等是否全部去除', photoRequired: false, completed: false },
    { id: 'CK_FN_08', phase: 'completed', category: '收尾', content: '是否有遗留整改项', importance: 'critical', howToCheck: '根据之前各阶段验收记录，确认所有问题已整改完毕', photoRequired: false, completed: false },
];

// 各阶段采购清单
export const PURCHASE_DATA: PurchaseItem[] = [
    // ===== 开工前 =====
    { id: 'PU_PRE_01', phase: 'pre_construction', name: '中央空调（如需要）', category: '大件设备', mustBuyBefore: '开工前确定', needMeasureFirst: true, estimatedBudget: '1.5-4万', tips: '必须在水电前确定，需要配合吊顶设计', purchased: false },
    { id: 'PU_PRE_02', phase: 'pre_construction', name: '地暖（如需要）', category: '大件设备', mustBuyBefore: '开工前确定', needMeasureFirst: true, estimatedBudget: '1-3万', tips: '影响地面找平高度，必须提前规划', purchased: false },
    { id: 'PU_PRE_03', phase: 'pre_construction', name: '封阳台（如需要）', category: '门窗', mustBuyBefore: '拆改前', needMeasureFirst: true, estimatedBudget: '0.5-1.5万', tips: '影响后续瓷砖铺贴和防水施工', purchased: false },

    // ===== 水电前 =====
    { id: 'PU_HE_01', phase: 'hydroelectric', name: '橱柜初步量尺和方案确认', category: '定制', mustBuyBefore: '水电开始前', needMeasureFirst: true, estimatedBudget: '-', tips: '橱柜方案决定厨房水电点位，必须先定', purchased: false },
    { id: 'PU_HE_02', phase: 'hydroelectric', name: '浴室柜/马桶/花洒选定型号', category: '卫浴', mustBuyBefore: '水电开始前', needMeasureFirst: false, estimatedBudget: '0.3-1.5万', tips: '卫浴型号决定排水和给水点位', purchased: false },
    { id: 'PU_HE_03', phase: 'hydroelectric', name: '热水器确定类型和位置', category: '电器', mustBuyBefore: '水电开始前', needMeasureFirst: false, estimatedBudget: '0.2-0.8万', tips: '燃气/电/空气能决定不同水电管路方案', purchased: false },
    { id: 'PU_HE_04', phase: 'hydroelectric', name: '开关插座品牌和数量确认', category: '电气', mustBuyBefore: '水电完工前', needMeasureFirst: false, estimatedBudget: '0.1-0.5万', tips: '建议比计划多备10%', purchased: false },

    // ===== 瓦工前 =====
    { id: 'PU_TL_01', phase: 'tiling', name: '瓷砖', category: '主材', mustBuyBefore: '瓦工进场前一周', needMeasureFirst: true, estimatedBudget: '0.5-3万', tips: '注意批次一致性，建议多买5-10%备损耗', purchased: false },
    { id: 'PU_TL_02', phase: 'tiling', name: '地漏', category: '五金', mustBuyBefore: '瓦工进场前', needMeasureFirst: false, estimatedBudget: '100-500元', tips: '建议选防臭地漏，卫生间至少2个', purchased: false },
    { id: 'PU_TL_03', phase: 'tiling', name: '门槛石/窗台石', category: '石材', mustBuyBefore: '瓦工进场前', needMeasureFirst: true, estimatedBudget: '500-2000元', tips: '量尺后订做，注意颜色搭配', purchased: false },
    { id: 'PU_TL_04', phase: 'tiling', name: '挡水条', category: '石材', mustBuyBefore: '瓦工进场前', needMeasureFirst: true, estimatedBudget: '100-300元', tips: '淋浴区必备', purchased: false },

    // ===== 木工/吊顶前 =====
    { id: 'PU_CP_01', phase: 'carpentry', name: '定制柜复尺确认', category: '定制', mustBuyBefore: '木工进场前', needMeasureFirst: true, estimatedBudget: '-', tips: '瓷砖铺完再复尺，确认最终尺寸', purchased: false },
    { id: 'PU_CP_02', phase: 'carpentry', name: '厨卫集成吊顶', category: '吊顶', mustBuyBefore: '木工进场前', needMeasureFirst: true, estimatedBudget: '0.2-0.8万', tips: '量尺后下单，注意包含灯和换气扇', purchased: false },

    // ===== 油工前 =====
    { id: 'PU_PT_01', phase: 'painting', name: '乳胶漆', category: '主材', mustBuyBefore: '油工进场前', needMeasureFirst: false, estimatedBudget: '0.2-0.8万', tips: '选好色号，建议做实际上墙样板再大面积施工', purchased: false },
    { id: 'PU_PT_02', phase: 'painting', name: '木地板（如有）', category: '主材', mustBuyBefore: '油工完工前下单', needMeasureFirst: true, estimatedBudget: '0.5-2万', tips: '油工完了铺，但需提前量尺下单', purchased: false },

    // ===== 安装前 =====
    { id: 'PU_IN_01', phase: 'installation', name: '室内门', category: '门', mustBuyBefore: '安装阶段前30天（有生产周期）', needMeasureFirst: true, estimatedBudget: '0.3-1.5万', tips: '生产周期通常20-30天，瓦工阶段就要量尺下单', purchased: false },
    { id: 'PU_IN_02', phase: 'installation', name: '橱柜终安装', category: '定制', mustBuyBefore: '安装阶段', needMeasureFirst: false, estimatedBudget: '-', tips: '橱柜安装后才能约台面安装', purchased: false },
    { id: 'PU_IN_03', phase: 'installation', name: '卫浴安装', category: '卫浴', mustBuyBefore: '安装阶段', needMeasureFirst: false, estimatedBudget: '-', tips: '马桶、花洒、浴室柜、镜柜一起安装', purchased: false },
    { id: 'PU_IN_04', phase: 'installation', name: '灯具', category: '电气', mustBuyBefore: '安装阶段', needMeasureFirst: false, estimatedBudget: '0.2-1万', tips: '提前选好款式，安装当天到位即可', purchased: false },
    { id: 'PU_IN_05', phase: 'installation', name: '窗帘', category: '软装', mustBuyBefore: '安装阶段', needMeasureFirst: true, estimatedBudget: '0.2-1万', tips: '油工完成后量尺，生产周期7-15天', purchased: false },
    { id: 'PU_IN_06', phase: 'installation', name: '定制柜安装', category: '定制', mustBuyBefore: '安装阶段', needMeasureFirst: false, estimatedBudget: '-', tips: '通常生产30-45天，需提前下单', purchased: false },
    { id: 'PU_IN_07', phase: 'installation', name: '五金挂件', category: '五金', mustBuyBefore: '安装阶段', needMeasureFirst: false, estimatedBudget: '300-1500元', tips: '毛巾架、浴巾架、纸巾架、挂钩等', purchased: false },

    // ===== 入住前 =====
    { id: 'PU_CL_01', phase: 'cleaning', name: '家具', category: '家具', mustBuyBefore: '保洁后、入住前', needMeasureFirst: true, estimatedBudget: '1-5万', tips: '建议提前下单，大件家具有配送周期', purchased: false },
    { id: 'PU_CL_02', phase: 'cleaning', name: '家电', category: '家电', mustBuyBefore: '入住前', needMeasureFirst: false, estimatedBudget: '1-5万', tips: '冰箱、洗衣机、空调（如非中央空调）、电视等', purchased: false },
    { id: 'PU_CL_03', phase: 'cleaning', name: '除甲醛/通风', category: '环保', mustBuyBefore: '入住前', needMeasureFirst: false, estimatedBudget: '0-0.5万', tips: '至少通风3个月，可辅助除醛产品，建议检测合格后入住', purchased: false },
];

// 根据阶段获取验收清单
export function getChecklistByPhase(phase: ConstructionPhase): ChecklistItem[] {
    return CHECKLIST_DATA.filter(c => c.phase === phase);
}

// 根据阶段获取采购清单
export function getPurchasesByPhase(phase: ConstructionPhase): PurchaseItem[] {
    return PURCHASE_DATA.filter(p => p.phase === phase);
}

// 计算工期时间线
export function calculateTimeline(startDate: string): { phase: ConstructionPhase; name: string; startDate: string; endDate: string }[] {
    let current = new Date(startDate);
    return PHASE_LIST.filter(p => p.phase !== 'warranty').map(p => {
        const start = new Date(current);
        const end = new Date(current);
        end.setDate(end.getDate() + p.typicalDurationDays);
        current = new Date(end);
        return {
            phase: p.phase,
            name: p.name,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    });
}
