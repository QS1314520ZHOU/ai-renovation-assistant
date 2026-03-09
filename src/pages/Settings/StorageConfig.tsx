import React, { useState } from 'react'
import { Button, Form, Input, Picker, Switch, Toast } from 'antd-mobile'

import { useUserStore } from '@/store'
import { StorageConfig as StorageConfigType } from '@/types'

const storageTypeOptions = [[
    { label: 'Cloudflare R2 / 兼容 S3', value: 'cloudflare_r2' },
    { label: '百度网盘（预留）', value: 'baidu_netdisk' },
]]

export default function StorageConfig() {
    const { storageConfig, setStorageConfig } = useUserStore()
    const [testing, setTesting] = useState(false)
    const [form, setForm] = useState<Partial<StorageConfigType>>(
        storageConfig || {
            type: 'cloudflare_r2',
            endpointUrl: '',
            bucketName: '',
            accessKeyId: '',
            secretAccessKey: '',
            publicDomain: '',
            enabled: false,
        },
    )

    const updateForm = (key: keyof StorageConfigType, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const handleSave = () => {
        if (form.type === 'cloudflare_r2' && (!form.endpointUrl || !form.bucketName || !form.accessKeyId || !form.secretAccessKey)) {
            Toast.show({ content: '请补全 Endpoint、Bucket 和访问密钥', icon: 'fail' })
            return
        }

        setStorageConfig({ ...form, enabled: Boolean(form.enabled) } as StorageConfigType)
        Toast.show({ content: '存储配置已保存', icon: 'success' })
    }

    const handleTest = async () => {
        if (!form.endpointUrl || !form.bucketName) {
            Toast.show({ content: '请先填写 Endpoint 和 Bucket', icon: 'fail' })
            return
        }

        setTesting(true)
        try {
            await fetch(`${form.endpointUrl}/${form.bucketName}`, { method: 'HEAD', mode: 'no-cors' })
            Toast.show({ content: '连通性已发起测试，请结合浏览器网络请求确认', icon: 'success' })
        } catch (error: any) {
            Toast.show({ content: `测试失败：${error.message || '请检查地址与网络'}`, icon: 'fail' })
        } finally {
            setTesting(false)
        }
    }

    return (
        <div className="page-stack" style={{ gap: 12 }}>
            <div className="panel-card">
                <div className="page-section-title">
                    <h3>文件存储</h3>
                    <span className="inline-pill">上传、巡检、截图共用</span>
                </div>
                <div className="muted-text" style={{ fontSize: 13 }}>
                    图片上传、施工巡检和后续附件管理可以统一走对象存储。当前优先支持 Cloudflare R2 与兼容 S3 的方案。
                </div>
            </div>

            <div className="section-card">
                <Form layout="vertical">
                    <Form.Item label="存储类型">
                        <Picker
                            columns={storageTypeOptions}
                            value={[form.type || 'cloudflare_r2']}
                            onConfirm={(value) => updateForm('type', value[0])}
                        >
                            {(_, { open }) => (
                                <div className="panel-card" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={open}>
                                    {storageTypeOptions[0].find((item) => item.value === form.type)?.label || '请选择存储类型'}
                                </div>
                            )}
                        </Picker>
                    </Form.Item>

                    {form.type === 'cloudflare_r2' ? (
                        <>
                            <Form.Item label="Endpoint URL">
                                <Input placeholder="https://xxxx.r2.cloudflarestorage.com" value={form.endpointUrl} onChange={(value) => updateForm('endpointUrl', value)} clearable />
                            </Form.Item>
                            <Form.Item label="Bucket 名称">
                                <Input placeholder="renovation-assets" value={form.bucketName} onChange={(value) => updateForm('bucketName', value)} clearable />
                            </Form.Item>
                            <Form.Item label="Access Key ID">
                                <Input placeholder="R2 Access Key ID" value={form.accessKeyId} onChange={(value) => updateForm('accessKeyId', value)} clearable />
                            </Form.Item>
                            <Form.Item label="Secret Access Key">
                                <Input type="password" placeholder="R2 Secret Access Key" value={form.secretAccessKey} onChange={(value) => updateForm('secretAccessKey', value)} clearable />
                            </Form.Item>
                            <Form.Item label="公网域名" help="如果配置了 CDN 或自定义域名，可在这里填写">
                                <Input placeholder="https://cdn.example.com" value={form.publicDomain} onChange={(value) => updateForm('publicDomain', value)} clearable />
                            </Form.Item>
                        </>
                    ) : (
                        <div className="empty-card">
                            <div className="empty-title">该类型暂未接入</div>
                            <div className="empty-desc">目前推荐优先使用 Cloudflare R2 或其他兼容 S3 的对象存储。</div>
                        </div>
                    )}

                    <Form.Item label="启用存储">
                        <Switch checked={Boolean(form.enabled)} onChange={(value) => updateForm('enabled', value)} />
                    </Form.Item>
                </Form>
            </div>

            <div className="action-row">
                <Button color="primary" shape="rounded" onClick={handleSave}>
                    保存配置
                </Button>
                <Button fill="outline" shape="rounded" loading={testing} onClick={handleTest}>
                    连通性测试
                </Button>
            </div>

            {storageConfig?.enabled && (
                <div className="note-card note-card--success">
                    <div className="note-icon">🗂️</div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>当前已启用对象存储</div>
                        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                            类型：{storageConfig.type === 'cloudflare_r2' ? 'Cloudflare R2 / S3 兼容' : '百度网盘（预留）'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}