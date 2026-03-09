import React from 'react'
import { Tabs } from 'antd-mobile'

import AIModelConfig from './AIModelConfig'
import StorageConfig from './StorageConfig'

export default function Settings() {
    return (
        <div className="page-shell">
            <div className="page-stack">
                <div className="page-hero page-hero--indigo">
                    <div className="page-kicker">系统设置</div>
                    <div className="page-title" style={{ marginTop: 16 }}>统一管理 AI 模型与文件存储</div>
                    <div className="page-subtitle" style={{ marginTop: 12, maxWidth: 720 }}>
                        这里集中配置全局模型路由、优先级、密钥和对象存储。改完后，整套系统会使用同一套能力和视觉风格。
                    </div>
                </div>

                <div className="section-card">
                    <Tabs>
                        <Tabs.Tab title="AI 模型" key="ai">
                            <AIModelConfig />
                        </Tabs.Tab>
                        <Tabs.Tab title="文件存储" key="storage">
                            <StorageConfig />
                        </Tabs.Tab>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}