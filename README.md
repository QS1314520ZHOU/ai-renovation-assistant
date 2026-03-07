# AI Renovation Assistant (AI 装修预算助手)

智能化的装修全周期陪跑助手，基于 FastAPI (Python) + React (Vite) 开发。

## 🌟 核心功能

- **AI 智能咨询**：基于大模型的装修顾问，自动收集房屋信息并生成精准预算。
- **动态模型配置**：支持在后台管理界面动态修改 AI 接口地址、API Key 及模型参数。
- **RBAC 权限管理**：完善的管理员/普通用户权限体系，保护系统设置安全。
- **施工陪跑**：全流程施工节点检查、采购记录、备忘录及款项管理。
- **装修词典**：内置专业装修术语解释。
- **自动预算生成**：根据城市系数、面积及装修档次自动计算详细预算清单。

## 🛠️ 技术栈

- **后端**: FastAPI, SQLAlchemy (Async), PostgreSQL, Redis, OpenAI SDK
- **前端**: React 18, Vite, Ant Design Mobile, Zustand, TypeScript
- **部署**: Docker, Docker Compose

## 🚀 快速开始

### 1. 环境准备
- Python 3.10+
- Node.js 18+
- PostgreSQL
- Redis

### 2. 后端配置
```bash
# 进入后台目录（如果不在根目录）
cd ai-renovation-assistant
# 安装依赖
pip install -r requirements.txt
# 配置环境变量 (创建 .env)
# DATABASE_URL=postgresql+asyncpg://user:pass@localhost/db
# REDIS_URL=redis://localhost:6379
# 运行迁移
alembic upgrade head
# 启动
python main.py
```

### 3. 前端配置
```bash
# 安装依赖
npm install
# 启动开发服务器
npm run dev
```

## 🔐 管理员权限设置

系统默认注册用户为普通用户。如需提升为管理员，请在项目根目录运行：

```bash
python scripts/promote_admin.py <你的手机号>
```

提升后，你可以在底部导航栏看到“设置”入口，配置 AI 全局参数。

## 📄 开源协议
MIT
