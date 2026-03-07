import React, { useState, useEffect } from 'react';
import {
    Button, Form, Input, Stepper, Switch, Dialog, Toast, Tag,
} from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/store';
import { AIModelConfig as AIModelConfigType } from '@/types';
import { v4 as uuid } from 'uuid';
import { configApi } from '@/api/services';

export default function AIModelConfig() {
    const { aiModels, setAIModels, activeModelId, setActiveModel } = useUserStore();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        baseUrl: '',
        models: '',
        priority: 1,
        apiKey: '',
        enabled: true,
    });

    // 初始化加载
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await configApi.get();
                const aiCfg = res.find(c => c.key === 'ai_config');
                if (aiCfg && aiCfg.value) {
                    setAIModels(aiCfg.value.aiModels || []);
                    if (aiCfg.value.activeModelId) {
                        setActiveModel(aiCfg.value.activeModelId);
                    }
                }
            } catch (err) {
                console.error('加载系统配置失败', err);
            }
        };
        loadConfig();
    }, []);

    // 辅助函数：推送到后端
    const syncToBackend = async (newModels: AIModelConfigType[], newActiveId: string | null) => {
        try {
            await configApi.update('ai_config', {
                aiModels: newModels,
                activeModelId: newActiveId
            }, 'AI 模型全局配置');
        } catch (err) {
            Toast.show({ content: '保存到服务器失败', icon: 'fail' });
        }
    };

    const resetForm = () => {
        setForm({ name: '', baseUrl: '', models: '', priority: 1, apiKey: '', enabled: true });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (model: AIModelConfigType) => {
        setForm({
            name: model.name,
            baseUrl: model.baseUrl,
            models: model.models.join(', '),
            priority: model.priority,
            apiKey: model.apiKey || '',
            enabled: model.enabled,
        });
        setEditingId(model.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.baseUrl) {
            Toast.show({ content: '请填写名称和Base URL', icon: 'fail' });
            return;
        }

        const modelConfig: AIModelConfigType = {
            id: editingId || uuid(),
            name: form.name,
            baseUrl: form.baseUrl.replace(/\/$/, ''),
            models: form.models.split(',').map(m => m.trim()).filter(Boolean),
            priority: form.priority,
            apiKey: form.apiKey || undefined,
            enabled: form.enabled,
        };

        let newModels: AIModelConfigType[];
        if (editingId) {
            newModels = aiModels.map(m => m.id === editingId ? modelConfig : m);
        } else {
            newModels = [...aiModels, modelConfig];
        }

        setAIModels(newModels);
        await syncToBackend(newModels, activeModelId);
        Toast.show({ content: '已保存', icon: 'success' });
        resetForm();
    };

    const handleDelete = (id: string) => {
        Dialog.confirm({
            content: '确定删除该模型配置？',
            onConfirm: async () => {
                const newModels = aiModels.filter(m => m.id !== id);
                const newActiveId = activeModelId === id ? (newModels[0]?.id || null) : activeModelId;
                setAIModels(newModels);
                setActiveModel(newActiveId || '');
                await syncToBackend(newModels, newActiveId);
                Toast.show({ content: '已删除', icon: 'success' });
            },
        });
    };

    const handleSetPrimary = async (id: string) => {
        setActiveModel(id);
        await syncToBackend(aiModels, id);
        Toast.show({ content: '已设为首选', icon: 'success' });
    };

    const handleTest = async (model: AIModelConfigType) => {
        Toast.show({ content: '测试连接中...', icon: 'loading' });
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (model.apiKey) headers['Authorization'] = `Bearer ${model.apiKey}`;

            const response = await fetch(model.baseUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: model.models[0] || 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: 'Hi, test connection.' }],
                    max_tokens: 10,
                }),
            });

            if (response.ok) {
                Toast.show({ content: '✅ 连接成功！', icon: 'success' });
            } else {
                Toast.show({ content: `❌ 连接失败: ${response.status}`, icon: 'fail' });
            }
        } catch (err: any) {
            Toast.show({ content: `❌ 连接异常: ${err.message}`, icon: 'fail' });
        }
    };

    return (
        <div style={{ padding: 16 }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
            }}>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>AI 服务接口</h3>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        配置用于问诊、解释、建议的AI模型接口
                    </p>
                </div>
                <Button
                    size="small"
                    color="primary"
                    onClick={() => { resetForm(); setShowForm(true); }}
                >
                    <AddOutline /> 新增
                </Button>
            </div>

            {/* 模型列表 */}
            {aiModels.map(model => (
                <div key={model.id} style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    border: activeModelId === model.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <b style={{ fontSize: 15 }}>{model.name}</b>
                            <Tag color={model.enabled ? 'success' : 'default'} fill="outline" style={{ fontSize: 10 }}>
                                {model.enabled ? '已启用' : '已停用'}
                            </Tag>
                            <Tag color="primary" fill="outline" style={{ fontSize: 10 }}>
                                优先级 {model.priority}
                            </Tag>
                        </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, wordBreak: 'break-all' }}>
                        <b>Base URL：</b>{model.baseUrl}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                        {model.models.map(m => (
                            <Tag key={m} style={{ fontSize: 11 }}>{m}</Tag>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button size="mini" fill="outline" onClick={() => handleTest(model)}>
                            🔗 测试
                        </Button>
                        <Button size="mini" fill="outline" onClick={() => handleEdit(model)}>
                            ✏️ 编辑
                        </Button>
                        <Button size="mini" fill="outline" color="primary"
                            disabled={activeModelId === model.id}
                            onClick={() => handleSetPrimary(model.id)}>
                            ⭐ 设为首选
                        </Button>
                        <Button size="mini" fill="outline" color="danger" onClick={() => handleDelete(model.id)}>
                            🗑️ 删除
                        </Button>
                    </div>
                </div>
            ))}

            {aiModels.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--color-text-secondary)',
                    fontSize: 14,
                }}>
                    暂无AI模型配置，请点击"新增"添加
                </div>
            )}

            {/* 新增/编辑表单 */}
            {showForm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'flex-end',
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px 16px 0 0',
                        width: '100%',
                        maxHeight: '85vh',
                        overflow: 'auto',
                        padding: '20px 16px',
                        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
                        }}>
                            <h3 style={{ fontSize: 17, fontWeight: 600 }}>
                                {editingId ? '编辑AI模型' : '新增AI模型'}
                            </h3>
                            <Button fill="none" size="small" onClick={resetForm}>取消</Button>
                        </div>

                        <Form layout="vertical">
                            <Form.Item label="名称">
                                <Input
                                    placeholder="如：notion, tapi, Cloudflare-AI"
                                    value={form.name}
                                    onChange={v => setForm(f => ({ ...f, name: v }))}
                                />
                            </Form.Item>

                            <Form.Item label="Base URL" help="OpenAI兼容的Chat Completions端点">
                                <Input
                                    placeholder="http://localhost:8000/v1/chat/completions"
                                    value={form.baseUrl}
                                    onChange={v => setForm(f => ({ ...f, baseUrl: v }))}
                                />
                            </Form.Item>

                            <Form.Item label="模型列表" help="多个模型用逗号分隔">
                                <Input
                                    placeholder="gpt-5.4, sonnet-4.6, opus-4.6"
                                    value={form.models}
                                    onChange={v => setForm(f => ({ ...f, models: v }))}
                                />
                            </Form.Item>

                            <Form.Item label="API Key" help="选填，部分接口需要">
                                <Input
                                    type="password"
                                    placeholder="sk-..."
                                    value={form.apiKey}
                                    onChange={v => setForm(f => ({ ...f, apiKey: v }))}
                                />
                            </Form.Item>

                            <Form.Item label="优先级" help="数字越小优先级越高">
                                <Stepper min={1} max={10} value={form.priority}
                                    onChange={v => setForm(f => ({ ...f, priority: v }))} />
                            </Form.Item>

                            <Form.Item label="启用">
                                <Switch checked={form.enabled}
                                    onChange={v => setForm(f => ({ ...f, enabled: v }))} />
                            </Form.Item>
                        </Form>

                        <Button block color="primary" size="large" shape="rounded"
                            style={{ marginTop: 16, height: 48 }} onClick={handleSave}>
                            保存
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
