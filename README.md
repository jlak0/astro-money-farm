# Astro Money Farm

使用 Turborepo + pnpm workspaces 管理的内容农场 Monorepo，支持多个独立 Astro 站点共享核心代码。

## 目录结构

```
astro-money-farm/
├── .github/workflows/     # CI/CD 配置
├── packages/
│   └── core/            # 共享核心包
│       ├── components/   # 16个共享组件
│       ├── layouts/     # 共享布局
│       ├── config/       # 共享配置
│       ├── utils/        # 工具函数
│       ├── styles/       # 全局样式
│       └── templates/     # 内容模板
├── scripts/
│   ├── create-site.sh    # 创建新站点
│   ├── create-post.sh    # 创建文章
│   └── deploy-site.sh    # 部署站点
├── sites/
│   ├── template/        # 站点模板
│   └── test-site/       # 测试站点
├── turbo.json            # Turborepo 配置
└── pnpm-workspace.yaml
```

## 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 创建新站点
```bash
./scripts/create-site.sh my-new-site
```

### 3. 开发站点
```bash
pnpm dev                    # 所有站点并行开发
pnpm dev --filter=my-site   # 单个站点
```

### 4. 构建
```bash
pnpm build                  # 增量构建（Turbo）
```

### 5. 部署
```bash
./scripts/deploy-site.sh my-site
```

## 创建文章

```bash
./scripts/create-post.sh my-site "文章标题" "标签1,标签2"
```

## 工作流

- **增量构建**: Turbo 自动只构建改动的站点
- **并行执行**: `pnpm dev` 并行启动所有站点
- **共享核心**: 组件/布局/工具函数统一管理

## 添加新站点

1. 复制 `sites/template` 为新目录
2. 修改配置:
   - `src/config/site.json` - 站点信息
   - `site.config.json` - 站点名称/URL
3. 运行 `pnpm install`
4. 开始开发 `pnpm dev --filter=@astro-money-farm/site-new`

## CI/CD

GitHub Actions 自动部署到 Cloudflare Pages。

需要配置 secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
