export interface GlossaryEntry {
    id: string;
    term: string;
    definition: string;
    purpose: string;
    riskIfSkipped: string;
    commonMistakes: string;
    howToVerify: string;
    tags: string[];
}

export const GLOSSARY_FULL: GlossaryEntry[] = [
    // ===== 基础工程（20条） =====
    { id: 'g001', term: '闭水试验', definition: '防水施工完成后在卫生间/厨房蓄满水至少48小时，检查楼下是否渗漏。', purpose: '验证防水层是否完好。', riskIfSkipped: '入住后漏水到楼下，赔钱返工代价极高。', commonMistakes: '只放24小时就急着贴砖；蓄水深度不够。', howToVerify: '确认蓄水达到指定深度，48小时后去楼下看有无渗漏。', tags: ['防水', '卫生间', '必做'] },
    { id: 'g002', term: '找平', definition: '用水泥砂浆或自流平将不平整地面处理平整。', purpose: '保证地面平整，满足铺地板条件。', riskIfSkipped: '地板踩着咯吱响、不平整有落差，严重时开裂。', commonMistakes: '以为毛坯地面可以直接铺地板。', howToVerify: '2米靠尺检查，误差不超过3mm。', tags: ['地面', '基础工程'] },
    { id: 'g003', term: '空鼓', definition: '瓷砖或墙面与底层出现空隙，敲击时发出"空空"的声音。', purpose: '检测施工质量。', riskIfSkipped: '日后瓷砖翘起、脱落。', commonMistakes: '验收时不用空鼓锤检测。', howToVerify: '用空鼓锤逐块敲击，整面空鼓率不超过5%。', tags: ['瓦工', '验收'] },
    { id: 'g004', term: '强弱电分离', definition: '强电线（照明插座）和弱电线（网线电话线）保持一定距离避免干扰。', purpose: '防止信号干扰。', riskIfSkipped: 'WiFi不稳定、电视有干扰。', commonMistakes: '强弱电同管穿线。', howToVerify: '强弱电线分管分槽，交叉处有锡纸屏蔽，间距不低于30cm。', tags: ['水电', '基础工程'] },
    { id: 'g005', term: '止逆阀', definition: '安装在烟道和排风管上的单向阀门，只出不进。', purpose: '防止邻居油烟倒灌。', riskIfSkipped: '家里闻到别人家的油烟和异味。', commonMistakes: '只装抽油烟机自带止逆阀。', howToVerify: '查看烟道口是否安装止逆阀，外面吹气不能进来。', tags: ['厨房', '卫生间', '配件'] },
    { id: 'g006', term: '投影面积', definition: '定制柜计价方式——柜子正面看成矩形，宽×高算面积。', purpose: '简化定制柜计价。', riskIfSkipped: '被展开面积报价多花钱。', commonMistakes: '混淆投影和展开面积。', howToVerify: '问清计价方式，展开面积通常是投影的3-4倍。', tags: ['定制柜', '计价方式'] },
    { id: 'g007', term: '展开面积', definition: '定制柜计价方式——所有板材面积加起来计算。', purpose: '按实际用料计价。', riskIfSkipped: '被低单价误导，总价可能更贵。', commonMistakes: '只看单价不算总价。', howToVerify: '让商家同时报投影和展开两种价格做对比。', tags: ['定制柜', '计价方式'] },
    { id: 'g008', term: '轻钢龙骨', definition: '薄钢板冷弯成型的骨架，用于吊顶或隔墙结构支撑。', purpose: '吊顶骨架，比木龙骨防潮防腐。', riskIfSkipped: '木龙骨在潮湿环境易变形致吊顶开裂。', commonMistakes: '厨卫用木龙骨。', howToVerify: '封板前查看龙骨材料，主龙骨间距≤1.2m，副龙骨≤40cm。', tags: ['吊顶', '材料'] },
    { id: 'g009', term: '打压试验', definition: '水管安装完后加压到0.8MPa，保压30分钟检测是否漏水。', purpose: '检测水管连接是否牢固。', riskIfSkipped: '入住后水管接头渗漏，泡坏地板和楼下。', commonMistakes: '打压不到标准压力或保压时间不够。', howToVerify: '加压到0.8MPa，30分钟压力下降≤0.05MPa。', tags: ['水电', '验收', '必做'] },
    { id: 'g010', term: '回填', definition: '用陶粒或碳渣将卫生间沉箱（下沉区域）填充找平。', purpose: '为卫生间地面铺贴做基础。', riskIfSkipped: '不回填无法铺砖，回填不当会塌陷。', commonMistakes: '用建筑垃圾回填（重且伤防水）。', howToVerify: '确认用轻质陶粒回填并做二次防水和二次排水。', tags: ['卫生间', '基础工程'] },
    { id: 'g011', term: '挂网', definition: '在新旧墙交接处、开槽处贴网格布，防止后期开裂。', purpose: '减少墙面开裂风险。', riskIfSkipped: '新旧墙接缝处墙面100%会裂。', commonMistakes: '不挂网直接批腻子。', howToVerify: '检查新旧墙交接、开槽回填处是否有网格布覆盖。', tags: ['墙面', '基础工程'] },
    { id: 'g012', term: '阴角/阳角', definition: '两面墙凹进去交汇的角叫阴角，凸出来的角叫阳角。', purpose: '装修中经常涉及的位置描述。', riskIfSkipped: '阴阳角不顺直影响美观。', commonMistakes: '不处理阳角保护，容易磕碰损坏。', howToVerify: '用靠尺检查是否笔直，阳角建议贴阳角条保护。', tags: ['基础概念'] },
    { id: 'g013', term: '腻子', definition: '刮在墙面上的白色膏状物，用于填补不平和为刷漆做基层。', purpose: '让墙面平整光滑，提高漆面效果。', riskIfSkipped: '乳胶漆直接刷在水泥墙上会剥落。', commonMistakes: '用非耐水腻子（南方潮湿地区易发霉）。', howToVerify: '确认使用耐水腻子（N型），至少批刮2-3遍。', tags: ['墙面', '材料'] },
    { id: 'g014', term: '底漆', definition: '刷在腻子层上、面漆之前的漆。', purpose: '封闭基层、增加附着力、防碱防潮。', riskIfSkipped: '面漆容易脱落、起泡、泛碱。', commonMistakes: '省略底漆直接刷面漆。', howToVerify: '确认底漆1遍+面漆2遍的标准流程。', tags: ['墙面', '材料', '油工'] },
    { id: 'g015', term: '瓷砖倒角', definition: '将瓷砖边缘磨成45度角，两块砖在阳角处对拼。', purpose: '阳角处美观处理方式之一。', riskIfSkipped: '不处理阳角会露出砖坯不美观。', commonMistakes: '倒角太薄容易崩瓷。', howToVerify: '查看阳角处两砖接缝是否紧密无崩边，也可选阳角条替代。', tags: ['瓦工', '工艺'] },
    { id: 'g016', term: '门套', definition: '包裹在门洞四周的装饰板，门安装在门套上。', purpose: '固定门扇、装饰门洞。', riskIfSkipped: '门洞裸露不美观，门无法安装。', commonMistakes: '门套和门不同色系导致不协调。', howToVerify: '门套与墙面接缝要打密封胶，颜色和门一致。', tags: ['门', '安装'] },
    { id: 'g017', term: '波导线', definition: '地面瓷砖铺贴时在边缘或中间铺设的不同花色砖带。', purpose: '起装饰和分区作用。', riskIfSkipped: '不做也完全可以，纯装饰性。', commonMistakes: '小户型做波导线反而显得拥挤。', howToVerify: '如果要做，在贴砖前确认好图案和位置。', tags: ['瓦工', '装饰'] },
    { id: 'g018', term: '水电点位', definition: '每个开关、插座、水龙头、地漏等的安装位置。', purpose: '装修中最重要的前期规划之一。', riskIfSkipped: '后期加点位要重新开槽，费用高且破坏墙面。', commonMistakes: '前期规划不够多，入住后到处不够用。', howToVerify: '按房间逐一确认每个点位的位置和高度。', tags: ['水电', '规划'] },
    { id: 'g019', term: '配电箱', definition: '家庭电路的总控箱，内含空气开关和漏电保护器。', purpose: '控制和保护家庭各路电路。', riskIfSkipped: '没有漏电保护极度危险。', commonMistakes: '回路不够用、不分路控制。', howToVerify: '确认配电箱容量足够、各回路独立（照明、插座、厨房、卫生间、空调各一路）。', tags: ['水电', '安全'] },
    { id: 'g020', term: '等电位', definition: '卫生间内的金属部件（花洒、管道等）用铜线连接到接地端子。', purpose: '防止触电。', riskIfSkipped: '洗澡时可能有触电风险。', commonMistakes: '装修时被拆除或不连接。', howToVerify: '检查卫生间等电位端子箱是否完好连接。', tags: ['水电', '安全', '卫生间'] },

    // ===== 材料类（20条） =====
    { id: 'g021', term: 'PPR管', definition: '一种常用的给水管材料，全称无规共聚聚丙烯管。', purpose: '家庭冷热水管路的主要材料。', riskIfSkipped: '使用劣质水管可能导致渗漏和水质问题。', commonMistakes: '冷热水管不区分（热水管壁更厚）。', howToVerify: '确认品牌（如伟星、日丰），热水管标注为S3.2或S2.5。', tags: ['水电', '材料'] },
    { id: 'g022', term: '防水涂料', definition: '涂刷在卫生间/厨房/阳台的防水材料，常见有柔性和刚性两类。', purpose: '形成防水层阻止水渗透。', riskIfSkipped: '没有防水层一定会渗漏。', commonMistakes: '只做一遍或选用不合格产品。', howToVerify: '确认品牌（如东方雨虹、德高），涂刷至少两遍、相互垂直涂刷。', tags: ['防水', '材料'] },
    { id: 'g023', term: '石英石台面', definition: '用石英砂加树脂压制的人造石台面。', purpose: '厨房橱柜台面主流材料。', riskIfSkipped: '选差的台面容易渗色、断裂。', commonMistakes: '过于追求便宜选低含量石英石。', howToVerify: '石英含量≥90%、厚度≥15mm、有检测报告。', tags: ['橱柜', '材料'] },
    { id: 'g024', term: '颗粒板', definition: '用木材碎屑加胶压制的板材，也叫刨花板/实木颗粒板。', purpose: '定制柜体最常用的板材之一。', riskIfSkipped: '劣质颗粒板甲醛含量高。', commonMistakes: '认为"实木颗粒板"就是实木。', howToVerify: '确认环保等级（至少ENF/E0），品牌板材（如爱格、克诺斯邦）。', tags: ['定制柜', '材料'] },
    { id: 'g025', term: '多层板', definition: '多层薄木板交叉胶合压制的板材。', purpose: '定制柜体的另一种常用板材。', riskIfSkipped: '品质差的多层板也有甲醛问题。', commonMistakes: '认为多层板一定比颗粒板好。', howToVerify: '看横截面层次是否紧密，确认环保等级和品牌。', tags: ['定制柜', '材料'] },
    { id: 'g026', term: 'SPC地板', definition: '石塑复合地板，一种新型零甲醛地面材料。', purpose: '防水防潮的地板替代方案。', riskIfSkipped: '无特殊风险，只是一种选择。', commonMistakes: '底层不平整直接铺SPC导致翘边。', howToVerify: '确认厚度≥4mm，锁扣连接是否牢固。', tags: ['地面', '材料'] },
    { id: 'g027', term: '强化地板', definition: '也叫复合强化地板，基材是高密度纤维板。', purpose: '价格最低的地板选择。', riskIfSkipped: '低价强化板甲醛风险大。', commonMistakes: '以为强化地板防水（其实怕水）。', howToVerify: '确认环保等级至少E1，面层耐磨转数≥4000。', tags: ['地面', '材料'] },
    { id: 'g028', term: '三层实木地板', definition: '表层为实木、中间为软木或松木的多层结构地板。', purpose: '兼顾实木质感和稳定性。', riskIfSkipped: '无特殊风险。', commonMistakes: '和多层实木地板混淆。', howToVerify: '看表层木材厚度（建议≥2mm），表层树种和油漆工艺。', tags: ['地面', '材料'] },
    { id: 'g029', term: '美缝剂', definition: '填充瓷砖缝隙的材料，有普通填缝剂、美缝剂、环氧彩砂三类。', purpose: '防水防霉、美化瓷砖缝隙。', riskIfSkipped: '缝隙发黑发霉难清理。', commonMistakes: '只用白水泥填缝（容易变色）。', howToVerify: '建议用真瓷美缝或环氧彩砂，确认品牌。', tags: ['瓦工', '材料'] },
    { id: 'g030', term: '角阀', definition: '安装在墙出水口和软管之间的阀门，形状像直角。', purpose: '控制单个出水点的水流开关。', riskIfSkipped: '没有角阀，维修时只能关总阀门。', commonMistakes: '用塑料角阀（容易断裂）。', howToVerify: '选用全铜角阀，热水用红标、冷水用蓝标。', tags: ['卫浴', '五金', '配件'] },

    // ===== 工艺类（20条） =====
    { id: 'g031', term: '薄贴法', definition: '用齿形刮板将瓷砖胶均匀刮在墙面上再贴砖的工艺。', purpose: '粘接更牢固，特别适合大砖和墙砖。', riskIfSkipped: '传统水泥贴大砖容易空鼓掉落。', commonMistakes: '不用瓷砖胶用水泥贴大规格砖。', howToVerify: '查看是否用齿形刮板刮胶，胶层是否均匀。', tags: ['瓦工', '工艺'] },
    { id: 'g032', term: '拉毛', definition: '在光滑墙面上做出粗糙纹理，增加瓷砖粘结力。', purpose: '光滑墙面贴砖前必须处理。', riskIfSkipped: '瓷砖直接贴在光滑面上会脱落。', commonMistakes: '拉毛层没干透就贴砖。', howToVerify: '用手摸墙面是否有粗糙颗粒感。', tags: ['瓦工', '工艺'] },
    { id: 'g033', term: '开槽', definition: '在墙面或地面切出凹槽用于埋设水管或电管。', purpose: '将管线暗装在墙内。', riskIfSkipped: '不开槽只能走明管，不美观。', commonMistakes: '在承重墙上横向开长槽（损坏结构安全）。', howToVerify: '承重墙只能竖向开槽，深度不超过墙厚1/3。', tags: ['水电', '工艺'] },
    { id: 'g034', term: '横平竖直', definition: '水电管线走线方式，横向和竖向必须是直线。', purpose: '规范走线、便于后期维修定位。', riskIfSkipped: '斜走乱走导致后期打孔可能打到管线。', commonMistakes: '为省线材走斜线。', howToVerify: '看管线走向是否横平竖直，转弯处用弯头不急弯。', tags: ['水电', '工艺'] },
    { id: 'g035', term: '管卡', definition: '固定水管或线管在墙上的金属或塑料夹子。', purpose: '固定管线不松动。', riskIfSkipped: '管线松动产生噪音或位移。', commonMistakes: '管卡间距过大。', howToVerify: '管卡间距80-100cm，转弯处增加固定。', tags: ['水电', '配件'] },
    { id: 'g036', term: '同层排水', definition: '排水管路在本层楼板内完成，不穿越到楼下天花板。', purpose: '检修方便、不影响楼下。', riskIfSkipped: '传统排水马桶移位很困难。', commonMistakes: '沉箱深度不够导致排水不畅。', howToVerify: '确认沉箱深度满足排水坡度要求。', tags: ['卫生间', '工艺'] },
    { id: 'g037', term: '二次排水', definition: '在卫生间回填层内设置排水管，防止回填层积水。', purpose: '避免沉箱积水导致防水失效。', riskIfSkipped: '回填层积水腐蚀防水层导致渗漏。', commonMistakes: '回填后不做二次排水直接贴砖。', howToVerify: '确认回填前是否预留了二次排水口。', tags: ['卫生间', '防水'] },
    { id: 'g038', term: '存水弯', definition: '排水管中S形或P形弯管，管内始终存一段水。', purpose: '阻隔下水道异味上返。', riskIfSkipped: '卫生间和厨房有下水道臭味。', commonMistakes: '选用过浅的存水弯（封堵不住气味）。', howToVerify: '确认关键排水点都有存水弯，深度≥50mm。', tags: ['水电', '卫生间'] },
    { id: 'g039', term: '墙固/地固', definition: '涂刷在墙面或地面上的界面处理剂。', purpose: '增加腻子/水泥与基层的粘结力，减少空鼓。', riskIfSkipped: '后期腻子/找平层可能脱落。', commonMistakes: '省略不刷或用劣质产品。', howToVerify: '查看墙面是否涂刷了黄色/蓝色墙固，地面是否涂了绿色地固。', tags: ['墙面', '地面', '材料'] },
    { id: 'g040', term: '阳角条', definition: '安装在瓷砖阳角处的PVC或铝合金保护条。', purpose: '保护阳角不崩瓷、不伤人。', riskIfSkipped: '阳角处尖锐容易磕碰受伤。', commonMistakes: '颜色选得和砖不搭配。', howToVerify: '阳角条应紧密贴合砖面，无翘起。', tags: ['瓦工', '配件'] },

    // ===== 安装验收类（20条） =====
    { id: 'g041', term: '靠尺', definition: '一根2米长的直尺（铝合金），用于检测墙面/地面平整度。', purpose: '验收平整度的专业工具。', riskIfSkipped: '不检测就不知道墙地面是否合格。', commonMistakes: '没有靠尺就用肉眼判断。', howToVerify: '靠尺贴墙/地，中间缝隙≤3mm为合格（地面）、≤4mm（墙面）。', tags: ['验收', '工具'] },
    { id: 'g042', term: '空鼓锤', definition: '一个小金属锤子，敲击瓷砖听声音判断是否空鼓。', purpose: '瓷砖验收的必备工具。', riskIfSkipped: '无法发现空鼓问题。', commonMistakes: '力度太大敲坏瓷砖。', howToVerify: '轻轻敲击瓷砖各部位，声音沉闷为实、清脆为空。', tags: ['验收', '工具'] },
    { id: 'g043', term: '隐蔽工程', definition: '施工完成后会被覆盖看不到的部分，主要指水电、防水。', purpose: '这些工程一旦封住就很难检修。', riskIfSkipped: '封住后出问题返修代价极大。', commonMistakes: '不在封闭前验收和拍照。', howToVerify: '水电验收+拍照必须在封槽/回填之前完成。', tags: ['水电', '验收', '基础概念'] },
    { id: 'g044', term: '闪电纹', definition: '墙面乳胶漆干燥后出现的细小裂纹。', purpose: '判断油工施工质量。', riskIfSkipped: '轻微闪电纹正常，严重的说明施工有问题。', commonMistakes: '把正常的干燥收缩纹当成质量问题。', howToVerify: '细小裂纹属正常，贯穿性裂纹需返工。', tags: ['油工', '验收'] },
    { id: 'g045', term: '收口', definition: '不同材料或不同施工面之间的收边处理。', purpose: '美观和保护。', riskIfSkipped: '接缝处粗糙不美观。', commonMistakes: '不做收口或收口粗糙。', howToVerify: '检查瓷砖与木地板交接、墙面与吊顶交接等位置是否整洁。', tags: ['工艺', '验收'] },
    { id: 'g046', term: '交底', definition: '开工前施工方向业主和工人交代施工方案和要求。', purpose: '确保所有人理解一致，减少后期纠纷。', riskIfSkipped: '工人按自己理解做，结果可能不是你要的。', commonMistakes: '不参加交底或交底内容不具体。', howToVerify: '要求书面交底记录，重点标注材料品牌、工艺要求、完工标准。', tags: ['流程', '管理'] },
    { id: 'g047', term: '增项', definition: '施工过程中增加的、报价单中没有的项目。', purpose: '了解什么是合理增项什么是恶意增项。', riskIfSkipped: '不明不白多花钱。', commonMistakes: '所有增项都同意或所有都拒绝。', howToVerify: '合理增项（如拆除发现问题）可以接受，报价中应有的项目不算增项。', tags: ['合同', '费用'] },
    { id: 'g048', term: '付款节点', definition: '装修款按施工进度分批支付的时间点。', purpose: '保护双方权益。', riskIfSkipped: '一次性付完款后无制约手段。', commonMistakes: '首期款比例过高（建议不超过30%）。', howToVerify: '常见节点：开工30%、水电验收30%、瓦木完工25%、竣工验收15%。', tags: ['合同', '费用'] },
    { id: 'g049', term: '竣工验收', definition: '所有施工完成后的全面检查和确认。', purpose: '确认所有施工符合合同约定。', riskIfSkipped: '验收不仔细后期发现问题难追责。', commonMistakes: '只看表面不检查细节。', howToVerify: '对照合同逐项检查，拍照记录，问题列清单要求整改后再签竣工。', tags: ['验收', '流程'] },
    { id: 'g050', term: '质保期', definition: '施工方承诺免费维修的时间段。', purpose: '保障业主在一定时间内的维修权益。', riskIfSkipped: '不明确质保条款后期维修无据可依。', commonMistakes: '不在合同中明确质保内容和时间。', howToVerify: '合同中要写明：隐蔽工程质保≥5年，其他项目≥2年。', tags: ['合同', '维保'] },

    // ===== 补充30条覆盖更多高频词汇 =====
    { id: 'g051', term: '全包', definition: '施工方包工包料（含人工、辅材和主材）。', purpose: '业主省心，但费用相对较高。', riskIfSkipped: '不了解模式容易被坑。', commonMistakes: '以为全包什么都包，实际很多项不含。', howToVerify: '明确全包范围清单，逐一确认哪些包含哪些不包含。', tags: ['合同', '模式'] },
    { id: 'g052', term: '半包', definition: '施工方包工包辅材，主材由业主自购。', purpose: '主材自选品质可控，辅材交给施工方。', riskIfSkipped: '不了解哪些是主材哪些是辅材。', commonMistakes: '漏买主材耽误工期。', howToVerify: '明确主材清单（瓷砖、地板、门、橱柜、卫浴等）和采购时间表。', tags: ['合同', '模式'] },
    { id: 'g053', term: '清包', definition: '施工方只出人工，所有材料业主自购。', purpose: '费用最低但业主最累。', riskIfSkipped: '材料购买和协调工作量巨大。', commonMistakes: '低估了自己买材料的时间成本。', howToVerify: '除非有足够时间和装修知识，否则不建议选择。', tags: ['合同', '模式'] },
    { id: 'g054', term: '样板间', definition: '装修公司用来展示施工能力的成品房间。', purpose: '帮助业主直观了解施工水平。', riskIfSkipped: '样板间未必代表你家的真实施工水平。', commonMistakes: '只看样板间就签约。', howToVerify: '要求看在施工地（正在装修的其他客户家）。', tags: ['选择', '参考'] },
    { id: 'g055', term: '设计费', definition: '请设计师出设计方案的费用。', purpose: '获得专业的空间规划和效果呈现。', riskIfSkipped: '没有设计容易返工和布局不合理。', commonMistakes: '以为免费设计和付费设计效果一样。', howToVerify: '确认设计费包含内容（效果图、施工图、跟踪服务）。', tags: ['费用', '设计'] },
    { id: 'g056', term: '水电走天走地', definition: '水电管线选择从天花板还是地面走线。', purpose: '各有优劣，影响维修便利性和费用。', riskIfSkipped: '走地便宜但后期维修难，走天贵但维修方便。', commonMistakes: '不了解区别随便选。', howToVerify: '厨卫建议走天（便于维修），其他区域看预算选择。', tags: ['水电', '工艺'] },
    { id: 'g057', term: '新风系统', definition: '将室外新鲜空气过滤后送入室内的通风设备。', purpose: '不开窗也能换气，过滤PM2.5。', riskIfSkipped: '不装也可以，开窗通风即可。', commonMistakes: '装修快完了才想装（管道需要提前布置）。', howToVerify: '如果要装，在水电阶段前确定方案和管道走向。', tags: ['设备', '规划'] },
    { id: 'g058', term: '前置过滤器', definition: '安装在入户水管上的粗过滤装置。', purpose: '过滤水中大颗粒杂质，保护后端设备。', riskIfSkipped: '水中杂质可能堵塞水龙头和热水器。', commonMistakes: '水电完了才想装（需要在入户管处预留）。', howToVerify: '确认在水电阶段预留安装位置，选择可反冲洗的型号。', tags: ['水电', '设备'] },
    { id: 'g059', term: '断桥铝', definition: '中间有隔热条断开热传导的铝合金型材。', purpose: '门窗主流材料，隔热隔音效果好。', riskIfSkipped: '普通铝合金不隔热，冬冷夏热。', commonMistakes: '只看价格不看型材品牌和壁厚。', howToVerify: '壁厚≥1.4mm（国标），五金件用品牌货。', tags: ['门窗', '材料'] },
    { id: 'g060', term: '窗台石', definition: '安装在窗台上的石材板。', purpose: '保护窗台、防水、方便清洁。', riskIfSkipped: '窗台容易积灰渗水损坏墙面。', commonMistakes: '忘记在瓦工阶段安装。', howToVerify: '在瓦工阶段安装，和窗框衔接处打密封胶。', tags: ['瓦工', '配件'] },
    { id: 'g061', term: '地暖', definition: '铺设在地面下的采暖管路或发热电缆。', purpose: '冬季地面辐射采暖。', riskIfSkipped: '不装地暖不影响基础使用。', commonMistakes: '装修开始后才决定装地暖（影响地面高度和工序）。', howToVerify: '开工前决定，影响找平高度和地面材料选择。', tags: ['设备', '规划'] },
    { id: 'g062', term: '中央空调', definition: '一台室外机带多台室内机的空调系统。', purpose: '不占地面空间，美观。', riskIfSkipped: '可以用壁挂空调替代。', commonMistakes: '和吊顶设计不协调。', howToVerify: '在水电前确定方案，配合吊顶设计出风口位置。', tags: ['设备', '规划'] },
    { id: 'g063', term: '厨房动线', definition: '厨房内洗-切-炒三个区域的布局顺序。', purpose: '合理动线做饭更高效舒适。', riskIfSkipped: '动线不合理做饭来回跑。', commonMistakes: '水槽和灶台离太远或太近。', howToVerify: '标准动线：冰箱→水槽→台面→灶台，方向一致不交叉。', tags: ['橱柜', '设计'] },
    { id: 'g064', term: '插座布局', definition: '全屋开关插座的位置和数量规划。', purpose: '满足日常用电需求。', riskIfSkipped: '入住后到处不够用，只能拉排插。', commonMistakes: '按现在的习惯规划，不考虑未来需求。', howToVerify: '玄关1-2个、客厅8-12个、卧室6-8个、厨房8-10个、卫生间3-4个。', tags: ['水电', '规划'] },
    { id: 'g065', term: '回路', definition: '从配电箱出发经过用电器再回到配电箱的一个完整电路环路。', purpose: '独立控制不同区域和类型的用电。', riskIfSkipped: '一个回路带太多电器容易跳闸。', commonMistakes: '厨房和卫生间不单独设回路。', howToVerify: '至少分：照明、普通插座、厨房、卫生间、空调各一路。', tags: ['水电', '安全'] },
    { id: 'g066', term: '漏电保护器', definition: '检测到漏电时自动断电的保护装置，安装在配电箱里。', purpose: '防止触电事故。', riskIfSkipped: '有触电生命危险。', commonMistakes: '不定期测试漏保按钮。', howToVerify: '配电箱内所有插座回路必须有漏电保护器，每月按一次测试按钮。', tags: ['水电', '安全'] },
    { id: 'g067', term: '吊趟门', definition: '上方有轨道悬挂滑动的推拉门。', purpose: '卫生间或厨房的门型选择之一。', riskIfSkipped: '地面无轨道更好清洁。', commonMistakes: '吊轨承重不够导致下垂。', howToVerify: '确认吊轨品牌和承重，门扇不超过吊轨承重上限。', tags: ['门', '安装'] },
    { id: 'g068', term: '马桶坑距', definition: '马桶排污口中心到墙面的距离。', purpose: '买马桶前必须量的尺寸。', riskIfSkipped: '坑距不对马桶装不上或离墙太远。', commonMistakes: '没量坑距就买马桶。', howToVerify: '量排污管中心到墙面距离（不含瓷砖厚度），常见300mm和400mm。', tags: ['卫浴', '尺寸'] },
    { id: 'g069', term: '干湿分离', definition: '将卫生间的淋浴区和非淋浴区分隔开。', purpose: '洗澡时不溅湿整个卫生间。', riskIfSkipped: '整个卫生间湿漉漉的，不卫生且有滑倒风险。', commonMistakes: '只用浴帘效果有限。', howToVerify: '可以用玻璃隔断、挡水条+浴帘、独立淋浴间等方式。', tags: ['卫生间', '设计'] },
    { id: 'g070', term: '耐水腻子', definition: '遇水不溶解、不脱粉的腻子，也叫N型腻子。', purpose: '南方潮湿地区的墙面基层处理。', riskIfSkipped: '普通腻子受潮后发霉起皮。', commonMistakes: '工人为了省事用普通腻子。', howToVerify: '查看腻子包装上的型号标识（N型或标注耐水）。', tags: ['墙面', '材料'] },
];
