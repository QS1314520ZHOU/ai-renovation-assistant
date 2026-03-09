# AI Renovation Assistant

基于 FastAPI + React 的装修全周期助手，覆盖预算、施工、材料、合同审核、AI 问诊与效果图能力。

## 核心能力

- 预算引擎：按城市、户型、面积、档次生成三档预算（经济/标准/豪华）。
- 城市双系数：材料系数与人工系数分离计算（`material_factor` / `labor_factor`）。
- 施工跟踪落库：阶段、清单、采购、日志、付款全部持久化。
- AI 问诊：
  - 普通问答接口：`POST /api/v1/ai/chat`
  - 流式 SSE 接口：`POST /api/v1/ai/chat/stream`
  - 多模型 fallback（主模型失败自动切换候选模型）
  - 上下文窗口管理（消息条数 + 估算 token 双重裁剪）
- 价格同步闭环：
  - 快照表：`price_snapshots`
  - 调价建议表：`price_adjustment_suggestions`
  - 同步服务：`PriceSyncService`
  - 管理端接口：`/api/v1/price-sync/*`
- AI 效果图：`/api/v1/design/generate`（支持 mock / stability / vertical provider）。

## 安全基线（已收敛）

- `JWT_SECRET` 不再使用固定弱默认值 `changeme`。
- CORS 改为配置白名单（不再在代码中硬编码 `allow_origins=["*"]`）。
- 全局异常默认不返回 traceback（仅在 `DEBUG=true` 且 `EXPOSE_TRACEBACK=true` 时返回）。

## 环境变量

最小必填：

```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ai_renovation
```

推荐补充：

```bash
REDIS_URL=redis://localhost:6379/0
REDIS_ENABLED=true

JWT_SECRET=replace_with_a_long_random_secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

DEBUG=true
EXPOSE_TRACEBACK=false

CORS_ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CORS_ALLOW_METHODS=*
CORS_ALLOW_HEADERS=*
CORS_ALLOW_CREDENTIALS=true

AI_BASE_URL=https://api.deepseek.com/v1
AI_API_KEY=your_api_key
AI_MODEL=deepseek-chat
AI_FALLBACK_MODELS=gpt-4o-mini,claude-3-5-sonnet
AI_MAX_HISTORY_MESSAGES=20
AI_MAX_CONTEXT_TOKENS=6000
AI_CONTEXT_CACHE_TTL_SECONDS=21600

PRICE_SYNC_ENABLED=true
PRICE_DEVIATION_THRESHOLD=0.15
ZJTCN_API_TOKEN=
```

说明：

- `JWT_SECRET` 在 `DEBUG=true` 且未配置时会生成临时随机值（重启后 token 失效）。
- 生产环境请显式配置强随机 `JWT_SECRET`，并使用精确 CORS 白名单。

## 本地启动

```bash
pip install -r requirements.txt
alembic upgrade head
python scripts/seed_data.py
python main.py
```

前端：

```bash
npm install
npm run dev
```

## 数据迁移

- 新增迁移：`alembic/versions/a71f3cf3bfb6_add_price_snapshot.py`
- 新增模型：`app/models/price_snapshot.py`

## 价格同步接口（管理员）

- 触发同步：`POST /api/v1/price-sync/trigger?city_code=510100`
- 查看快照：`GET /api/v1/price-sync/snapshots`
- 查看建议：`GET /api/v1/price-sync/suggestions`
- 审批建议：`POST /api/v1/price-sync/suggestions/{id}/approve`

## 测试

```bash
pytest -q
```

