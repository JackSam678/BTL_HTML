# BTL_HTML

本仓库包含博特勒机器人（BTL）前后端代码与简单 API 示例。

## 快速开始（开发环境）

先决条件
- Node.js >= 16
- MySQL 本地/远程数据库
- Git

安装依赖

```bash
cd /home/btl/桌面/BTL_HTML
npm install
```

配置环境变量
在项目根创建 `.env`（已添加到 `.gitignore`，不要提交到仓库）：

```properties
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=btl_robotics
DB_PORT=3306
# 管理接口用的临时管理员令牌（用于 GET /api/contacts）
ADMIN_TOKEN=your_admin_token_here
```

运行数据库 seed（将示例数据写入 `btl_robotics` 数据库）

（注：请保证 `.env` 中 DB 配置正确且数据库可连）

```bash
node integration/seed.js
```

启动服务器

```bash
npm start
# 或开发时使用自动重启
npm run dev
```

可用接口
- GET /health — 健康检查
- GET /api/products — 获取产品列表
- POST /api/contacts — 提交联系表单（JSON）
- GET /api/contacts — 管理接口（需在请求头中提供 `x-admin-token: <ADMIN_TOKEN>`）

示例：提交联系人

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H 'Content-Type: application/json' \
  -d '{"name":"测试","email":"test@example.com","subject":"咨询","message":"你好"}'
```

测试

仓库包含一个快速、无外部依赖的测试脚本（用于集成测试 contact 提交）：

```bash
npm run test:quick
```

如果你愿意安装 dev 依赖并使用 mocha/supertest，可按需在 `package.json` 中添加并运行 `npm test`。

安全注意事项
- 请勿把 `.env` 或任何密钥推送到远程仓库。
- 在线部署时请用更安全的 secret 管理方式（例如 GitHub Secrets、Vault、云 provider secrets）。

如需我为你添加 CI（GitHub Actions）来自动运行测试/seed，请告诉我。
