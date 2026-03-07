import { getActiveAIConfig } from './index';

export interface ChatCompletionOptions {
    messages: { role: string; content: string }[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    onChunk?: (chunk: string) => void;
}

export async function chatCompletion(options: ChatCompletionOptions): Promise<string> {
    const config = getActiveAIConfig();
    if (!config) throw new Error('未配置AI模型，请在设置中配置AI服务');

    const model = options.model || config.models[0];
    const body = {
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        stream: options.stream ?? false,
    };

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    if (options.stream && options.onChunk) {
        const response = await fetch(config.baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...body, stream: true }),
        });

        if (!response.ok) throw new Error(`AI服务请求失败: ${response.status}`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

                for (const line of lines) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        if (content) {
                            fullContent += content;
                            options.onChunk(content);
                        }
                    } catch (e) {
                        // ignore parse errors in stream
                    }
                }
            }
        }
        return fullContent;
    }

    const response = await fetch(config.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`AI服务请求失败: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// 装修问诊的 System Prompt
export const CONSULT_SYSTEM_PROMPT = `你是一个专业的AI装修预算顾问。你的任务是通过和用户对话，收集装修信息并帮助生成预算。

## 你的工作方式：
1. 从用户的描述中提取装修相关信息
2. 对缺失的关键信息进行追问
3. 所有回复必须同时输出两部分：结构化数据（JSON）和用户可读解释

## 最小输入集（必须收集到才能算预算）：
- city: 所在城市
- innerArea 或 grossArea: 面积
- layout: 户型
- tierLevel: 装修档次 (economy经济/standard普通/premium改善)

## 精度增强字段（有就更准，没有用默认值）：
- floorPreference: 地面偏好 (tile瓷砖/wood木地板/mixed混合)
- hasCeiling: 是否做吊顶
- hasCustomCabinet: 是否做定制柜
- includeFurniture: 是否含家具家电
- bathroomCount: 卫生间数
- kitchenCount: 厨房数
- balconyCount: 阳台数
- targetBudget: 目标预算
- purpose: 装修目的 (self_use自住/rental出租/wedding婚房/improvement改善)
- targetMoveInDate: 目标入住时间
- familyHasElderly: 是否有老人
- familyHasChildren: 是否有孩子
- familyHasPets: 是否有宠物

## 输出格式要求：
每次回复都用以下格式：

\`\`\`json
{
  "extracted_fields": { ... },
  "missing_required": ["field1", "field2"],
  "phase": "collecting|confirming|completed"
}
\`\`\`

然后是给用户看的自然语言回复。

## 重要规则：
- 追问不超过8轮
- 用户说"先算一下"就立即停止追问，phase设为completed
- 如果用户给出矛盾信息（如预算很低但要求很高），温和指出
- 始终用通俗语言，不要说专业术语
- 价格不要胡编，说"系统会根据你所在城市计算"`;

// 解析AI返回中的JSON
export function parseAIResponse(content: string): {
    json: Record<string, any> | null;
    text: string;
} {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
    let json = null;
    let text = content;

    if (jsonMatch) {
        try {
            json = JSON.parse(jsonMatch[1].trim());
            text = content.replace(/```json[\s\S]*?```/, '').trim();
        } catch (e) {
            // JSON解析失败，降级
        }
    }

    return { json, text };
}
