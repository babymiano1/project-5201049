# API 设置指南

## 概述

项目已集成视频分析 API，通过后端服务调用 Python 脚本 `analyse_video.py` 来分析上传的视频文件。

## 架构说明

### 前端
- **全局状态管理**: 使用 React Context (`VideoAnalysisContext`) 存储视频文件和分析结果
- **API 调用**: 在 `AIParsing` 页面进度达到 50% 时自动调用 API

### 后端
- **服务器**: Node.js + Express (`server.js`)
- **端口**: 3001 (默认)
- **API 端点**: `POST /api/analyze`

## 安装和启动

### 1. 安装依赖

```bash
npm install
```

后端依赖包括：
- `express`: Web 框架
- `multer`: 文件上传处理
- `cors`: 跨域支持
- `concurrently`: 同时运行前后端（可选）

### 2. 配置环境变量

创建 `.env` 文件（如果还没有）：

```env
# DashScope API 配置（用于 analyse_video.py）
DASHSCOPE_API_KEY=your_api_key_here
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-vl-plus

# 后端 API 端口（可选）
PORT=3001

# 前端 API URL（可选，默认 http://localhost:3001）
VITE_API_URL=http://localhost:3001
```

### 3. 确保 Python 环境

确保已安装 Python 3 和所需依赖：

```bash
pip install openai python-dotenv
```

### 4. 启动服务

#### 方式一：分别启动（推荐用于开发）

**终端 1 - 启动前端**:
```bash
npm run dev
```

**终端 2 - 启动后端 API**:
```bash
npm run dev:api
```

#### 方式二：同时启动（需要安装 concurrently）

```bash
npm run dev:all
```

## API 使用

### 端点: `POST /api/analyze`

**请求**:
- Content-Type: `multipart/form-data`
- Body: `video` (文件字段)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "timestamp": "00:01.5",
      "action_tag": "WAVE",
      "description": "轻盈流线波浪",
      "intensity": 7,
      "rhythm_point": true
    }
  ]
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 数据流

1. **首页** (`/`): 用户选择视频文件 → 保存到 `VideoAnalysisContext`
2. **AI 解析页** (`/ai-parsing`): 
   - 进度条开始增长
   - 当进度达到 50% 时，自动调用 `/api/analyze`
   - 分析结果保存到 `VideoAnalysisContext`
   - 进度达到 100% 后跳转到创作设置页
3. **创作设置页** (`/creation-setup`): 可以从 Context 读取分析结果

## 访问分析结果

在任何组件中使用 `useVideoAnalysis` Hook:

```typescript
import { useVideoAnalysis } from '@/contexts/VideoAnalysisContext';

function MyComponent() {
  const { state } = useVideoAnalysis();
  
  // state.videoFile - 视频文件对象
  // state.videoUrl - 视频预览 URL
  // state.analysisResult - 分析结果数组
  // state.isAnalyzing - 是否正在分析
  // state.error - 错误信息
}
```

## 故障排除

### 1. API 调用失败

- 检查后端服务是否运行在正确的端口（默认 3001）
- 检查 `VITE_API_URL` 环境变量是否正确
- 查看浏览器控制台的网络请求错误

### 2. Python 脚本执行失败

- 确保 Python 3 已安装
- 检查 `.env` 文件中的 `DASHSCOPE_API_KEY` 是否正确
- 查看后端控制台的错误日志

### 3. 文件上传失败

- 检查文件大小限制（默认 100MB）
- 确保 `uploads/` 目录有写入权限

## 开发注意事项

1. **文件清理**: 后端会自动清理上传的临时文件
2. **错误处理**: API 调用失败时会在 UI 上显示错误信息
3. **示例视频**: 如果使用示例视频（通过 `exampleId`），会跳过 API 调用
4. **进度同步**: 进度条是模拟的，实际分析可能在进度条完成前就结束了

## 生产环境部署

1. 设置正确的 `VITE_API_URL` 环境变量
2. 确保后端服务在生产环境运行
3. 配置 CORS 策略（如果需要）
4. 设置文件上传大小限制
5. 配置日志和监控

