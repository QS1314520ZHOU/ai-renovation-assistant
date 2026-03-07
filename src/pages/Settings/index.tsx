import React, { useState } from 'react';
import { Tabs } from 'antd-mobile';
import AIModelConfig from './AIModelConfig';
import StorageConfig from './StorageConfig';

export default function Settings() {
    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 80 }}>
            <div style={{ padding: '16px', background: '#fff', borderBottom: '1px solid var(--color-border)' }}>
                <h1 style={{ fontSize: 18, fontWeight: 600 }}>设置</h1>
            </div>

            <Tabs
                style={{
                    '--title-font-size': '14px',
                    '--active-line-color': 'var(--color-primary)',
                    '--active-title-color': 'var(--color-primary)',
                } as any}
            >
                <Tabs.Tab title="AI模型配置" key="ai">
                    <AIModelConfig />
                </Tabs.Tab>
                <Tabs.Tab title="云存储配置" key="storage">
                    <StorageConfig />
                </Tabs.Tab>
            </Tabs>
        </div>
    );
}
