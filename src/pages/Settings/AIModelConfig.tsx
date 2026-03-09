import React, { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, Form, Input, Stepper, Switch, Tag, Toast } from 'antd-mobile'
import { AddOutline } from 'antd-mobile-icons'
import { v4 as uuid } from 'uuid'

import { configApi } from '@/api/services'
import { useUserStore } from '@/store'
import { AIModelConfig as AIModelConfigType } from '@/types'

function normalizeAIConfig(value: any): { aiModels: AIModelConfigType[]; activeModelId: string | null } {
    const rawModels = value?.aiModels || value?.ai_models || []
    const aiModels = Array.isArray(rawModels)
        ? rawModels.map((model: any) => ({
            id: model.id,
            name: (model.name || '').trim(),
            baseUrl: (model.baseUrl || model.base_url || '').trim(),
            models: Array.isArray(model.models) ? model.models.map((item: string) => item.trim()).filter(Boolean) : [],
            priority: model.priority ?? 1,
            apiKey: (model.apiKey || model.api_key || '').trim(),
            enabled: model.enabled ?? true,
        }))
        : []

    return {
        aiModels,
        activeModelId: value?.activeModelId || value?.active_model_id || null,
    }
}

const initialForm = {
    name: '',
    baseUrl: '',
    models: '',
    priority: 1,
    apiKey: '',
    enabled: true,
}

export default function AIModelConfig() {
    const { aiModels, setAIModels, activeModelId, setActiveModel } = useUserStore()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(initialForm)

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await configApi.get()
                const aiConfig = res.find((item) => item.key === 'ai_config')
                if (aiConfig?.value) {
                    const normalized = normalizeAIConfig(aiConfig.value)
                    setAIModels(normalized.aiModels)
                    if (normalized.activeModelId) {
                        setActiveModel(normalized.activeModelId)
                    }
                }
            } catch (error) {
                console.error('加载 AI 配置失败:', error)
            }
        }

        loadConfig()
    }, [setAIModels, setActiveModel])

    const activeModel = useMemo(
        () => aiModels.find((item) => item.id === activeModelId) || null,
        [aiModels, activeModelId],
    )

    const syncToBackend = async (models: AIModelConfigType[], activeId: string | null) => {
        await configApi.update('ai_config', { aiModels: models, activeModelId: activeId }, 'AI 模型全局配置')
    }

    const resetForm = () => {
        setForm(initialForm)
        setEditingId(null)
        setShowForm(false)
    }

    const handleEdit = (model: AIModelConfigType) => {
        setEditingId(model.id)
        setForm({
            name: model.name,
            baseUrl: model.baseUrl,
            models: model.models.join(', '),
            priority: model.priority,
            apiKey: model.apiKey || '',
            enabled: model.enabled,
        })
        setShowForm(true)
    }

    const handleSave = async () => {
        if (!form.name.trim() || !form.baseUrl.trim()) {
            Toast.show({ content: '请填写模型名称和 Base URL', icon: 'fail' })
            return
        }

        const modelConfig: AIModelConfigType = {
            id: editingId || uuid(),
            name: form.name.trim(),
            baseUrl: form.baseUrl.trim().replace(/\/$/, ''),
            models: form.models.split(',').map((item) => item.trim()).filter(Boolean),
            priority: form.priority,
            apiKey: form.apiKey.trim() || undefined,
            enabled: form.enabled,
        }

        const nextModels = editingId
            ? aiModels.map((item) => (item.id === editingId ? modelConfig : item))
            : [...aiModels, modelConfig].sort((a, b) => a.priority - b.priority)

        setSaving(true)
        try {
            setAIModels(nextModels)
            await syncToBackend(nextModels, activeModelId)
            Toast.show({ content: editingId ? '模型已更新' : '模型已添加', icon: 'success' })
            resetForm()
        } catch (error: any) {
            Toast.show({ content: `保存失败：${error.message || '请稍后再试'}`, icon: 'fail' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (id: string) => {
        Dialog.confirm({
            title: '删除模型',
            content: '删除后该模型不会再参与路由，确认继续吗？',
            onConfirm: async () => {
                const nextModels = aiModels.filter((item) => item.id !== id)
                const nextActiveId = activeModelId === id ? nextModels[0]?.id || null : activeModelId
                try {
                    setAIModels(nextModels)
                    setActiveModel(nextActiveId || '')
                    await syncToBackend(nextModels, nextActiveId)
                    Toast.show({ content: '模型已删除', icon: 'success' })
                } catch (error: any) {
                    Toast.show({ content: `删除失败：${error.message || '请稍后再试'}`, icon: 'fail' })
                }
            },
        })
    }

    const handleToggleEnabled = async (id: string, enabled: boolean) => {
        const nextModels = aiModels.map((item) => item.id === id ? { ...item, enabled } : item)
        try {
            setAIModels(nextModels)
            await syncToBackend(nextModels, activeModelId)
            Toast.show({ content: enabled ? '模型已启用' : '模型已停用', icon: 'success' })
        } catch (error: any) {
            Toast.show({ content: `更新失败：${error.message || '请稍后再试'}`, icon: 'fail' })
        }
    }

    const handleSetPrimary = async (id: string) => {
        try {
            setActiveModel(id)
            await syncToBackend(aiModels, id)
            Toast.show({ content: '已设为主模型', icon: 'success' })
        } catch (error: any) {
            Toast.show({ content: `设置失败：${error.message || '请稍后再试'}`, icon: 'fail' })
        }
    }

    return (
        <div className="page-stack" style={{ gap: 12 }}>
            <div className="panel-card">
                <div className="page-section-title">
                    <h3>当前生效模型</h3>
                    <span className="inline-pill">路由状态</span>
                </div>
                <div className="muted-text" style={{ fontSize: 13 }}>
                    {activeModel
                        ? `当前主模型为 ${activeModel.name}，默认走 ${activeModel.models[0] || '未填写模型名'}。`
                        : '还没有选择主模型，新增后可直接设为默认。'}
                </div>
            </div>

            <div className="action-row">
                <Button color="primary" shape="rounded" onClick={() => setShowForm(true)}>
                    <AddOutline /> 添加模型
                </Button>
            </div>

            {showForm && (
                <div className="section-card">
                    <div className="page-section-title">
                        <h3>{editingId ? '编辑模型' : '新增模型'}</h3>
                        <span className="inline-pill">统一接入 OpenAI 兼容接口</span>
                    </div>
                    <Form layout="vertical">
                        <Form.Item label="模型名称">
                            <Input placeholder="例如 Notion Proxy / OpenAI / DeepSeek" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} clearable />
                        </Form.Item>
                        <Form.Item label="Base URL" help="填写到 /v1 即可，不要直接写 chat/completions 完整路径">
                            <Input placeholder="https://example.com/v1" value={form.baseUrl} onChange={(value) => setForm((prev) => ({ ...prev, baseUrl: value }))} clearable />
                        </Form.Item>
                        <Form.Item label="模型列表" help="多个模型用英文逗号隔开，首个模型会作为默认值">
                            <Input placeholder="gpt-4o-mini, claude-sonnet-4" value={form.models} onChange={(value) => setForm((prev) => ({ ...prev, models: value }))} clearable />
                        </Form.Item>
                        <Form.Item label="API Key" help="如果后端环境已配置，也可以留空">
                            <Input type="password" placeholder="sk-..." value={form.apiKey} onChange={(value) => setForm((prev) => ({ ...prev, apiKey: value }))} clearable />
                        </Form.Item>
                        <Form.Item label="优先级" help="数值越小越优先">
                            <Stepper min={1} max={10} value={form.priority} onChange={(value) => setForm((prev) => ({ ...prev, priority: value }))} />
                        </Form.Item>
                        <Form.Item label="启用状态">
                            <Switch checked={form.enabled} onChange={(value) => setForm((prev) => ({ ...prev, enabled: value }))} />
                        </Form.Item>
                    </Form>
                    <div className="action-row" style={{ marginTop: 8 }}>
                        <Button color="primary" shape="rounded" loading={saving} onClick={handleSave}>
                            {editingId ? '保存修改' : '添加模型'}
                        </Button>
                        <Button fill="outline" shape="rounded" onClick={resetForm}>
                            取消
                        </Button>
                    </div>
                </div>
            )}

            {aiModels.length === 0 ? (
                <div className="empty-card">
                    <div className="empty-title">还没有模型配置</div>
                    <div className="empty-desc">先添加一个可用模型，系统的 AI 咨询、报价审核、合同审核和图片巡检都会复用它。</div>
                </div>
            ) : (
                aiModels
                    .slice()
                    .sort((a, b) => a.priority - b.priority)
                    .map((model) => (
                        <div key={model.id} className="section-card">
                            <div className="page-section-title" style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <h3>{model.name}</h3>
                                    {activeModelId === model.id && <Tag color="primary" fill="solid">主模型</Tag>}
                                    {!model.enabled && <Tag color="warning" fill="outline">已停用</Tag>}
                                </div>
                                <span className="inline-pill">优先级 {model.priority}</span>
                            </div>

                            <div className="feature-desc" style={{ marginBottom: 12 }}>
                                <div><strong>Base URL：</strong>{model.baseUrl}</div>
                                <div style={{ marginTop: 6 }}><strong>模型：</strong>{model.models.join('、') || '未填写'}</div>
                                <div style={{ marginTop: 6 }}><strong>密钥：</strong>{model.apiKey ? '已填写' : '走环境变量或后端默认值'}</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="muted-text" style={{ fontSize: 13 }}>启用</span>
                                    <Switch checked={model.enabled} onChange={(value) => handleToggleEnabled(model.id, value)} />
                                </div>
                                <div className="action-row" style={{ flex: '1 1 420px' }}>
                                    <Button size="small" fill="outline" onClick={() => handleEdit(model)}>编辑</Button>
                                    <Button size="small" color="primary" fill={activeModelId === model.id ? 'solid' : 'outline'} onClick={() => handleSetPrimary(model.id)}>
                                        {activeModelId === model.id ? '当前主模型' : '设为主模型'}
                                    </Button>
                                    <Button size="small" color="danger" fill="outline" onClick={() => handleDelete(model.id)}>
                                        删除
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
            )}
        </div>
    )
}