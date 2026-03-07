import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BudgetResult, HouseProfile, BudgetScheme } from '@/types';
import { formatMoney, tierLevelLabel, categoryLabel } from './format';

// 导出为长图
export async function exportAsImage(elementId: string, filename: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error('导出元素未找到');

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        windowHeight: element.scrollHeight,
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// 导出为 PDF
export async function exportAsPDF(
    house: HouseProfile,
    result: BudgetResult,
    type: 'summary' | 'detail' = 'summary'
): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, bold = false, color = '#1F2937') => {
        pdf.setFontSize(size);
        pdf.setTextColor(color);
        const lines = pdf.splitTextToSize(text, contentWidth);
        pdf.text(lines, margin, y);
        y += lines.length * size * 0.45 + 2;
    };

    const addLine = () => {
        pdf.setDrawColor('#E5E7EB');
        pdf.line(margin, y, pageWidth - margin, y);
        y += 5;
    };

    const checkPageBreak = (needed: number) => {
        if (y + needed > 280) {
            pdf.addPage();
            y = 20;
        }
    };

    // 标题
    addText('AI装修预算报告', 20, true, '#4F46E5');
    addText(`生成日期：${new Date().toLocaleDateString('zh-CN')}`, 10, false, '#9CA3AF');
    y += 5;
    addLine();

    // 房屋信息
    addText('一、房屋基本信息', 14, true);
    addText(`城市：${house.city}`, 11);
    addText(`户型：${house.layout}   套内面积：${house.innerArea}㎡`, 11);
    addText(`装修档次：${tierLevelLabel(house.tierLevel)}`, 11);
    addText(`装修目的：${house.purpose === 'self_use' ? '自住' : house.purpose === 'rental' ? '出租' : '其他'}`, 11);
    addText(`目标预算：${formatMoney(house.targetBudget)}`, 11);
    y += 5;
    addLine();

    // 三档对比
    addText('二、三档预算对比', 14, true);
    const tiers = [
        { tier: 'economy', label: '经济档', scheme: result.economy },
        { tier: 'standard', label: '普通档', scheme: result.standard },
        { tier: 'premium', label: '改善档', scheme: result.premium },
    ];
    tiers.forEach(t => {
        if (t.scheme) {
            addText(`${t.label}：${formatMoney(t.scheme.total_amount)}（约${Math.round(t.scheme.total_amount / house.innerArea)}元/㎡）`, 11);
        }
    });
    y += 5;

    // 当前档次明细
    const currentScheme = result[house.tierLevel];
    addLine();
    addText(`三、${tierLevelLabel(house.tierLevel)}预算明细`, 14, true);
    if (currentScheme) {
        addText(`硬装与人工：${formatMoney(currentScheme.labor_amount)}`, 11);
        addText(`主材及辅配：${formatMoney(currentScheme.material_amount)}`, 11);
        addText(`管理费：${formatMoney(currentScheme.management_fee)}`, 11);
        addText(`预备金：${formatMoney(currentScheme.contingency)}`, 11);
    }
    y += 3;

    // 详细模式 - 逐项
    if (type === 'detail') {
        checkPageBreak(30);
        addLine();
        addText('四、分项工程量明细', 14, true);

        const categoryMap = new Map<string, any[]>();
        if (currentScheme && currentScheme.items) {
            currentScheme.items.forEach(item => {
                if (!categoryMap.has(item.category)) categoryMap.set(item.category, []);
                categoryMap.get(item.category)!.push(item);
            });
        }

        categoryMap.forEach((items, cat) => {
            checkPageBreak(20);
            addText(`【${categoryLabel(cat)}】`, 12, true, '#4F46E5');
            items.forEach(item => {
                checkPageBreak(12);
                addText(`${item.item_name}：${item.quantity}${item.unit} × ${item.material_unit_price + item.labor_unit_price + item.accessory_unit_price}元 = ${formatMoney(item.subtotal)}`, 10);
            });
            y += 3;
        });
    }

    // 漏项提醒
    if (result.missingItems.length > 0) {
        checkPageBreak(30);
        addLine();
        addText(type === 'detail' ? '五、漏项提醒' : '四、漏项提醒', 14, true);
        result.missingItems.forEach(item => {
            checkPageBreak(15);
            const riskLabel = item.riskLevel === 'high' ? '🔴' : item.riskLevel === 'medium' ? '🟡' : '🟢';
            addText(`${riskLabel} ${item.itemName}（${formatMoney(item.estimatedPriceMin)}-${formatMoney(item.estimatedPriceMax)}）`, 11);
            addText(`  ${item.explanation}`, 9, false, '#6B7280');
        });
    }

    // 免责声明
    checkPageBreak(20);
    y += 5;
    addLine();
    addText('⚠️ 免责声明', 10, true, '#9CA3AF');
    addText('以上预算为参考估算，实际费用受施工报价、材料品牌、工艺标准、现场情况等因素影响，通常存在10%-20%的浮动。本报告不构成任何施工合同或价格承诺。', 8, false, '#9CA3AF');
    addText(`报告由「AI装修预算助手」生成 · ${new Date().toLocaleString('zh-CN')}`, 8, false, '#D1D5DB');

    pdf.save(`装修预算报告_${house.city}_${house.layout}_${new Date().toLocaleDateString('zh-CN')}.pdf`);
}

// 生成分享文本
export function generateShareText(house: HouseProfile, result: BudgetResult): string {
    const scheme = result[house.tierLevel];
    if (!scheme) return '无法生成分享内容';
    return `📊 我的装修预算报告
🏠 ${house.city} · ${house.layout} · ${house.innerArea}㎡
💰 ${tierLevelLabel(house.tierLevel)}预算：${formatMoney(scheme.total_amount)}
📋 约${Math.round(scheme.total_amount / house.innerArea)}元/㎡
⚠️ 发现${result.missingItems.length}项容易遗漏的费用

—— 由AI装修预算助手生成`;
}
