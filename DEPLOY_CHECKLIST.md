# Vercel 部署检查清单

## ✅ 已完成的配置

- [x] 创建了 `api/analyze.js` Serverless Function
- [x] 创建了 `api/health.js` 健康检查端点
- [x] 创建了 `requirements.txt` Python 依赖文件
- [x] 更新了 `vercel.json` 配置文件
- [x] 创建了 `.vercelignore` 文件
- [x] 更新了前端 API 调用逻辑（自动适配生产环境）
- [x] 创建了部署文档 `VERCEL_DEPLOY.md`

## 📋 部署前必须完成的步骤

### 1. 环境变量配置

在 Vercel Dashboard 中设置以下环境变量：

**必需：**
- `DASHSCOPE_API_KEY` - 你的阿里云 DashScope API 密钥

**可选：**
- `DASHSCOPE_BASE_URL` - 默认：`https://dashscope.aliyuncs.com/compatible-mode/v1`
- `MODEL_NAME` - 默认：`qwen-vl-plus`
- `VITE_API_URL` - 生产环境可以留空（会自动使用相对路径）

### 2. 验证文件存在

确保以下文件在项目根目录：
- ✅ `api/analyze.js`
- ✅ `api/health.js`
- ✅ `analyse_video.py`
- ✅ `requirements.txt`
- ✅ `vercel.json`
- ✅ `.vercelignore`

### 3. 测试本地构建

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 检查构建输出
ls -la out/
```

### 4. 部署到 Vercel

**方法一：使用 Vercel CLI**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署（首次会引导配置）
vercel

# 生产环境部署
vercel --prod
```

**方法二：GitHub 集成**
1. 将代码推送到 GitHub
2. 在 Vercel Dashboard 导入项目
3. 配置环境变量
4. 点击部署

## ⚠️ 重要注意事项

### 文件大小限制

Vercel Serverless Functions 有以下限制：
- **请求体大小限制**: 4.5MB（Hobby 计划）
- **函数执行时间**: 60秒（已配置）
- **内存限制**: 1024MB

**如果视频文件超过 4.5MB，需要：**
1. 使用客户端直接上传到对象存储（如 AWS S3、阿里云 OSS）
2. 或升级到 Vercel Pro 计划（支持更大的请求体）

### Python 依赖

确保 `requirements.txt` 包含：
```
openai>=1.0.0
python-dotenv>=1.0.0
```

Vercel 会自动安装这些依赖。

### API 端点测试

部署后，测试以下端点：

```bash
# 健康检查
curl https://your-project.vercel.app/api/health

# 视频分析（需要上传文件）
curl -X POST https://your-project.vercel.app/api/analyze \
  -F "video=@your-video.mp4"
```

## 🔍 故障排查

### 问题：Python 脚本执行失败

**检查：**
1. `analyse_video.py` 是否在项目根目录
2. `requirements.txt` 是否正确
3. 环境变量是否设置（特别是 `DASHSCOPE_API_KEY`）

**查看日志：**
- Vercel Dashboard → Functions → 查看执行日志

### 问题：文件上传失败

**可能原因：**
- 文件超过 4.5MB 限制
- 网络问题

**解决方案：**
- 压缩视频文件
- 或使用对象存储服务

### 问题：API 超时

**可能原因：**
- 视频分析时间超过 60 秒

**解决方案：**
- 优化视频长度（建议 30 秒以内）
- 或考虑异步处理

## 📚 相关文档

- [Vercel 部署文档](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [详细部署指南](./VERCEL_DEPLOY.md)

