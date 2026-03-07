import React, { useState } from 'react';
import { Form, Input, Picker, Button, Toast } from 'antd-mobile';
import { useUserStore } from '@/store';
import { StorageConfig as StorageConfigType } from '@/types';

const storageTypeOptions = [
  [
    { label: 'Cloudflare R2 (S3 Compatible)', value: 'cloudflare_r2' },
    { label: '百度网盘 (Baidu Netdisk)', value: 'baidu_netdisk' },
  ],
];

export default function StorageConfig() {
  const { storageConfig, setStorageConfig } = useUserStore();
  const [form, setForm] = useState<Partial<StorageConfigType>>(
    storageConfig || {
      type: 'cloudflare_r2',
      endpointUrl: '',
      bucketName: '',
      accessKeyId: '',
      secretAccessKey: '',
      publicDomain: '',
      enabled: false,
    }
  );

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!form.endpointUrl || !form.bucketName || !form.accessKeyId || !form.secretAccessKey) {
      Toast.show({ content: '请填写完整配置信息', icon: 'fail' });
      return;
    }
    setStorageConfig({ ...form, enabled: true } as StorageConfigType);
    Toast.show({ content: '存储配置已保存', icon: 'success' });
  };

  const handleTest = async () => {
    Toast.show({ content: '测试连接中...', icon: 'loading' });
    try {
      // 简单的 HEAD 请求测试连通性
      const url = `${form.endpointUrl}/${form.bucketName}`;
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      Toast.show({ content: '✅ 连接测试完成（请检查控制台）', icon: 'success' });
    } catch (err: any) {
      Toast.show({ content: `❌ 连接失败: ${err.message}`, icon: 'fail' });
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>云存储配置</h3>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          配置用于存储报价单、图纸、报告等文件的云存储服务
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
        <Form layout="vertical">
          <Form.Item label="选择存储后端">
            <Picker
              columns={storageTypeOptions}
              value={[form.type || 'cloudflare_r2']}
              onConfirm={v => updateForm('type', v[0])}
            >
              {(_, { open }) => (
                <div onClick={open} style={{
                  padding: '8px 12px',
                  background: '#F3F4F6',
                  borderRadius: 8,
                  fontSize: 14,
                }}>
                  {storageTypeOptions[0].find(o => o.value === form.type)?.label || '请选择'}
                </div>
              )}
            </Picker>
          </Form.Item>

          {form.type === 'cloudflare_r2' && (
            <>
              <Form.Item label="Endpoint URL (S3 API)">
                <Input
                  placeholder="https://xxx.r2.cloudflarestorage.com/xxx"
                  value={form.endpointUrl}
                  onChange={v => updateForm('endpointUrl', v)}
                />
              </Form.Item>

              <Form.Item label="Bucket Name">
                <Input
                  placeholder="my-bucket"
                  value={form.bucketName}
                  onChange={v => updateForm('bucketName', v)}
                />
              </Form.Item>

              <Form.Item label="Access Key ID">
                <Input
                  placeholder="Access Key ID"
                  value={form.accessKeyId}
                  onChange={v => updateForm('accessKeyId', v)}
                />
              </Form.Item>

              <Form.Item label="Secret Access Key">
                <Input
                  type="password"
                  placeholder="Secret Access Key"
                  value={form.secretAccessKey}
                  onChange={v => updateForm('secretAccessKey', v)}
                />
              </Form.Item>

              <Form.Item label="Public Domain (Optional)" help="自定义域名或公共访问域名">
                <Input
                  placeholder="https://pub-xxx.r2.dev"
                  value={form.publicDomain}
                  onChange={v => updateForm('publicDomain', v)}
                />
              </Form.Item>
            </>
          )}

          {form.type === 'baidu_netdisk' && (
            <div style={{
              padding: 20,
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: 14,
            }}>
              百度网盘配置功能开发中...
            </div>
          )}
        </Form>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button
            block
            color="primary"
            shape="rounded"
            onClick={handleSave}
            style={{ height: 44 }}
          >
            保存并启用
          </Button>
          <Button
            block
            fill="outline"
            shape="rounded"
            onClick={handleTest}
            style={{ height: 44 }}
          >
            测试连接
          </Button>
        </div>
      </div>

      {/* 当前状态 */}
      {storageConfig?.enabled && (
        <div style={{
          marginTop: 16,
          padding: '10px 14px',
          background: '#F0FDF4',
          borderRadius: 10,
          fontSize: 13,
          color: '#059669',
        }}>
          ✅ 云存储已启用：{storageConfig.type === 'cloudflare_r2' ? 'Cloudflare R2' : '百度网盘'}
        </div>
      )}
    </div>
  );
}
