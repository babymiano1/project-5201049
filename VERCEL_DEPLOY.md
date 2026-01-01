# Vercel 部署指南

## 📋 部署前准备

### 1. 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

#### 必需的环境变量：
- `DASHSCOPE_API_KEY` - 阿里云 DashScope API 密钥
- `DASHSCOPE_BASE_URL` - DashScope API 基础 URL（可选，默认值：`https://dashscope.aliyuncs.com/compatible-mode/v1`）
- `MODEL_NAME` - 使用的模型名称（可选，默认值：`qwen-vl-plus`）

#### 可选的环境变量：
- `VITE_API_URL` - API 基础 URL（可选，生产环境会自动使用相对路径）

#### 在 Vercel 中设置环境变量：
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加上述环境变量

### 2. Python 依赖

项目会自动检测 `requirements.txt` 并安装 Python 依赖。确保 `requirements.txt` 包含：
- `openai>=1.0.0`
- `python-dotenv>=1.0.0`

## 🚀 部署步骤

### 方法一：通过 Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 在项目根目录部署
vercel

# 4. 生产环境部署
vercel --prod
```

### 方法二：通过 GitHub 集成

1. 将代码推送到 GitHub 仓库
2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 点击 **Add New Project**
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测配置并部署

## 📁 项目结构说明

```
project-5201049/
├── api/                    # Vercel Serverless Functions
│   ├── analyze.js         # 视频分析 API
│   └── health.js          # 健康检查 API
├── src/                    # React 前端代码
├── analyse_video.py       # Python 视频分析脚本
├── vercel.json            # Vercel 配置文件
├── requirements.txt       # Python 依赖
└── package.json           # Node.js 依赖
```

## ⚙️ 配置说明

### vercel.json 配置

- `buildCommand`: 构建命令（`npm run build`）
- `outputDirectory`: 输出目录（`out`）
- `framework`: 框架类型（`vite`）
- `functions`: Serverless Functions 配置
  - `maxDuration`: 最大执行时间（60秒，用于视频分析）
- `rewrites`: URL 重写规则

### API 端点

- `POST /api/analyze` - 分析视频
- `GET /api/health` - 健康检查

## 🔧 常见问题

### 1. Python 脚本执行失败

**问题**: Python 脚本无法执行或找不到模块

**解决方案**:
- 确保 `requirements.txt` 包含所有必需的依赖
- 检查 Python 版本（Vercel 默认使用 Python 3.9）
- 查看 Vercel 构建日志中的错误信息

### 2. 文件上传大小限制

**问题**: 上传大文件时失败

**解决方案**:
- Vercel Serverless Functions 有 4.5MB 的请求体大小限制
- 对于大文件，建议使用：
  - 客户端直接上传到对象存储（如 AWS S3、阿里云 OSS）
  - 或使用 Vercel Blob Storage（需要升级计划）

### 3. 超时问题

**问题**: API 请求超时

**解决方案**:
- 当前配置的 `maxDuration` 为 60 秒
- 如果视频分析需要更长时间，考虑：
  - 使用异步处理（队列系统）
  - 优化 Python 脚本性能
  - 升级到 Vercel Pro 计划（支持更长的执行时间）

### 4. 环境变量未生效

**问题**: 环境变量在部署后未生效

**解决方案**:
- 确保在 Vercel Dashboard 中设置了环境变量
- 检查环境变量名称是否正确（区分大小写）
- 重新部署项目以应用新的环境变量

## 📝 注意事项

1. **文件存储**: Vercel Serverless Functions 是无状态的，文件存储在 `/tmp` 目录，函数执行完成后会自动清理。

2. **Python 脚本**: `analyse_video.py` 需要能够访问，确保它在项目根目录。

3. **构建输出**: Vite 构建输出到 `out` 目录，确保 `vercel.json` 中的 `outputDirectory` 配置正确。

4. **CORS**: API 端点已配置 CORS，允许跨域请求。

5. **日志**: 查看 Vercel Dashboard 中的 **Functions** 标签页可以查看 API 执行日志。

## 🔗 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)

