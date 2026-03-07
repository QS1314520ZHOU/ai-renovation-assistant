import { useUserStore } from '@/store';

export function getActiveAIConfig() {
    const state = useUserStore.getState();
    const activeId = state.activeModelId;
    if (activeId) {
        const model = state.aiModels.find(m => m.id === activeId);
        if (model?.enabled) return model;
    }
    // 按优先级排序取第一个可用的
    const sorted = [...state.aiModels]
        .filter(m => m.enabled)
        .sort((a, b) => a.priority - b.priority);
    return sorted[0] || null;
}
