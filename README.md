# AI 二创引擎 - 手势舞视频解析与创作平台

## 📋 项目简介

这是一个基于 React + TypeScript 构建的 AI 手势舞视频解析与二创平台。用户可以通过上传手势舞视频，由 AI 自动解析动作序列和音乐音轨，然后选择虚拟形象进行实时手势表演，创作出独特的"手势+音效"双轨视频作品。

## 🏗️ 项目架构

### 技术栈

- **前端框架**: React 19.1.0 + TypeScript
- **构建工具**: Vite 7.0.3
- **路由管理**: React Router DOM 7.6.3
- **样式方案**: Tailwind CSS 3.4.17
- **国际化**: i18next 25.4.1 + react-i18next
- **手势识别**: @mediapipe/hands (MediaPipe)
- **图表库**: Recharts 3.2.0
- **后端服务**: Supabase / Firebase
- **支付集成**: Stripe React

### 项目结构

```
project-5201049/
├── src/
│   ├── App.tsx                 # 应用根组件
│   ├── main.tsx                # 应用入口文件
│   ├── index.css               # 全局样式（Tailwind）
│   ├── pages/                  # 页面组件目录
│   │   ├── home/              # 首页 - 视频上传
│   │   │   └── page.tsx
│   │   ├── ai-parsing/        # AI解析页 - 解析进度展示
│   │   │   └── page.tsx
│   │   ├── creation-setup/    # 创作设置页 - 虚拟形象选择
│   │   │   └── page.tsx
│   │   ├── performance-stage/ # 表演舞台页 - 实时手势表演
│   │   │   └── page.tsx
│   │   ├── achievement-center/# 成就中心页 - 数据统计与徽章
│   │   │   └── page.tsx
│   │   └── NotFound.tsx        # 404 页面
│   ├── router/                 # 路由配置
│   │   ├── index.ts           # 路由组件封装
│   │   └── config.tsx         # 路由配置定义
│   └── i18n/                   # 国际化配置
│       ├── index.ts           # i18n 初始化
│       └── local/             # 多语言文件目录
│           └── index.ts       # 语言文件动态加载
├── analyse_video.py           # 视频解析脚本（Python）
├── package.json               # 项目依赖配置
├── vite.config.ts             # Vite 构建配置
├── tailwind.config.ts         # Tailwind CSS 配置
└── tsconfig.json              # TypeScript 配置
```

## 📱 页面层次结构

### 1. 首页 (`/`) - `src/pages/home/page.tsx`

**功能**: 视频上传入口和示例展示

**主要特性**:
- 视频文件上传（支持所有视频格式）
- 上传进度条显示
- 示例视频展示（2个预设示例）
- 功能亮点展示（手势舞识别、音轨同步、AI二创）

**用户流程**:
1. 用户选择视频文件上传
2. 显示上传进度（模拟）
3. 上传完成后自动跳转到 AI 解析页

**关键状态**:
- `uploadProgress`: 上传进度（0-100%）
- `isUploading`: 是否正在上传

---

### 2. AI 解析页 (`/ai-parsing`) - `src/pages/ai-parsing/page.tsx`

**功能**: 展示视频 AI 解析进度和任务状态

**解析任务流程**:
1. **动作语义解析** - 识别手势动作类型
2. **音乐音轨分析** - 提取音频特征
3. **节奏卡点识别** - 识别音乐节拍点
4. **生成创作任务** - 生成双轨创作任务

**UI 特性**:
- 动态进度百分比显示（0-100%）
- 当前任务高亮显示
- 已完成任务显示完成标记
- 动画效果（脉冲动画、进度条）

**自动跳转**: 解析完成后自动跳转到创作设置页

**关键状态**:
- `progress`: 解析进度百分比
- `currentTask`: 当前执行的任务索引

---

### 3. 创作设置页 (`/creation-setup`) - `src/pages/creation-setup/page.tsx`

**功能**: 选择虚拟形象，配置创作参数

**虚拟形象选项**:
1. **像素动物** 🐱🐶🐼 - 灵动可爱，多种动物形象可选
2. **3D Emoji人** 😎 - 酷炫时尚，适合街舞风格
3. **粒子态** ✨ - 梦幻流动，适合电音氛围
4. **独角兽** 🦄 - 梦幻优雅，适合柔和旋律
5. **赛博机器人** 🤖 - 科技未来，适合电子音乐
6. **真人** 👤 - 真实自我，展现个人魅力

**UI 特性**:
- 进度条显示（Step 2/3，66%）
- 虚拟形象卡片选择
- 选中状态高亮显示
- 灵感提示卡片

**导航**:
- 上一步：返回 AI 解析页
- 开始表演：跳转到表演舞台页（需选择形象）

**关键状态**:
- `selectedAvatar`: 选中的虚拟形象 ID

---

### 4. 表演舞台页 (`/performance-stage`) - `src/pages/performance-stage/page.tsx`

**功能**: 实时手势识别和表演，生成双轨视频

**三个阶段**:

#### 4.1 教程阶段 (`tutorial`)
- 摄像头权限请求
- 摄像头预览
- 手势操作说明（挥手、拍手、旋转）
- 开始按钮

#### 4.2 倒计时阶段 (`countdown`)
- 3秒倒计时动画
- 全屏遮罩效果

#### 4.3 表演阶段 (`performing`)
- **左侧原视频区域**: 显示原始手势舞视频
- **右侧用户摄像头**: 实时显示用户手势
- **顶部动作提示流**: 从右到左流动的动作提示卡片
- **左侧音符气泡**: 垂直上升的青色音符气泡
- **右侧音符气泡**: 垂直上升的青色音符气泡
- **粒子特效**: 手势触发时的粒子爆炸效果
- **分数系统**: 实时分数和连击数显示

**手势检测**:
- 使用 MediaPipe Hands 进行手势识别（当前为模拟）
- 手势触发时生成粒子特效
- 增加分数和连击数

**关键状态**:
- `stage`: 当前阶段（tutorial/countdown/performing）
- `cameraPermission`: 摄像头权限状态
- `score`: 当前分数
- `combo`: 连击数
- `particles`: 粒子数组
- `actionHints`: 动作提示数组
- `leftBubbles/rightBubbles`: 左右侧音符气泡

---

### 5. 成就中心页 (`/achievement-center`) - `src/pages/achievement-center/page.tsx`

**功能**: 用户数据统计、视频管理和徽章系统

**三个标签页**:

#### 5.1 数据统计 (`stats`)
- **技能雷达图**: 展示节奏、创意、协调、准确四个维度
- **技能进度条**: 各技能数值显示
- **快速统计**: 总视频数、总观看量、总点赞数

#### 5.2 我的视频 (`videos`)
- 视频网格展示（6个示例视频）
- 视频缩略图、标题、日期
- 观看量和点赞数显示
- 音频波形图叠加
- 分享到抖音按钮

#### 5.3 徽章 (`badges`)
- 8个徽章展示（4个已解锁，4个未解锁）
- 徽章图标、名称、描述
- 解锁状态显示

**导航**:
- 返回首页
- 跳转到创作者休息室（待开发）

**关键状态**:
- `selectedTab`: 当前选中的标签页（stats/videos/badges）

---

### 6. 404 页面 (`*`) - `src/pages/NotFound.tsx`

**功能**: 处理未匹配的路由

**显示内容**:
- 404 大号文字
- 当前访问路径
- 提示信息

---

## 🔧 路由配置

路由定义在 `src/router/config.tsx`:

```typescript
const routes: RouteObject[] = [
  { path: "/", element: <Home /> },
  { path: "/ai-parsing", element: <AIParsing /> },
  { path: "/creation-setup", element: <CreationSetup /> },
  { path: "/performance-stage", element: <PerformanceStage /> },
  { path: "/achievement-center", element: <AchievementCenter /> },
  { path: "*", element: <NotFound /> },
];
```

路由封装在 `src/router/index.ts`，提供了全局导航函数 `window.REACT_APP_NAVIGATE`，方便在非 React 组件中使用。

---

## 🎬 视频处理脚本

### `analyse_video.py`

**功能**: 使用阿里云 DashScope API 解析手势舞视频，提取动作序列

**依赖**:
- `openai` (兼容 DashScope API)
- `python-dotenv` (环境变量管理)

**使用方法**:
```bash
python analyse_video.py <视频文件路径>
```

**输出格式**:
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

**动作标签类型**:
- `POINT`: 指向性动作
- `PUSH/PULL`: 推拉动作
- `SWIPE`: 扫动动作
- `WAVE/ROLL`: 波浪动作
- `CLAP/PUNCH`: 击掌/出拳
- `HEART`: 比心手势
- `FRAME`: 构图类动作
- `SPIN/CIRCLE`: 旋转动作
- `GREET`: 招手动作

**环境变量配置**:
```env
DASHSCOPE_API_KEY=your_api_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-vl-plus
```

---

## 🌐 国际化支持

项目使用 i18next 进行国际化管理：

- **配置位置**: `src/i18n/index.ts`
- **语言文件**: `src/i18n/local/` 目录
- **自动语言检测**: 使用浏览器语言检测器
- **默认语言**: 英语 (en)

语言文件采用动态加载机制，支持按需加载。

---

## 🎨 样式系统

### Tailwind CSS

项目使用 Tailwind CSS 进行样式管理：

- **配置文件**: `tailwind.config.ts`
- **全局样式**: `src/index.css`
- **设计风格**: 深色主题，玻璃态效果（glassmorphism）
- **颜色方案**: 紫色、青色、粉色渐变

### 设计特点

- **玻璃态效果**: `backdrop-blur-xl` + 半透明背景
- **渐变背景**: `bg-gradient-to-br`
- **圆角设计**: 大圆角（`rounded-[32px]`）
- **动画效果**: 脉冲、缩放、淡入淡出
- **响应式设计**: 移动端优先

---

## 🚀 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

输出目录: `out/`

### 代码检查

```bash
npm run lint
```

### 类型检查

```bash
npm run type-check
```

---

## 📦 核心依赖说明

### React 相关
- `react` / `react-dom`: React 19.1.0
- `react-router-dom`: 路由管理
- `react-i18next`: 国际化

### UI/样式
- `tailwindcss`: CSS 框架
- `recharts`: 图表库（成就中心雷达图）

### 媒体处理
- `@mediapipe/hands`: 手势识别
- `@mediapipe/camera_utils`: 摄像头工具
- `@mediapipe/drawing_utils`: 绘图工具

### 后端服务
- `@supabase/supabase-js`: Supabase 客户端
- `firebase`: Firebase SDK

### 支付
- `@stripe/react-stripe-js`: Stripe React 组件

---

## 🔄 用户流程

```
首页 (/)
  ↓ [上传视频]
AI解析页 (/ai-parsing)
  ↓ [解析完成]
创作设置页 (/creation-setup)
  ↓ [选择形象]
表演舞台页 (/performance-stage)
  ↓ [表演完成]
成就中心页 (/achievement-center)
```

---

## 🎯 核心功能模块

### 1. 视频上传模块
- 文件选择器
- 上传进度显示
- 文件格式验证

### 2. AI 解析模块
- 视频动作识别
- 音乐音轨分析
- 节奏卡点检测
- 任务进度展示

### 3. 虚拟形象选择模块
- 6种形象选项
- 形象预览
- 选择状态管理

### 4. 实时表演模块
- 摄像头访问
- 手势识别（MediaPipe）
- 粒子特效系统
- 音符气泡动画
- 动作提示流
- 分数计算系统

### 5. 数据统计模块
- 技能雷达图
- 视频列表管理
- 徽章系统

---

## 🛠️ 开发环境配置

### Vite 配置特性

- **Base Path**: 支持自定义基础路径（`BASE_PATH` 环境变量）
- **自动导入**: 使用 `unplugin-auto-import` 自动导入 React Hooks
- **路径别名**: `@` 指向 `src` 目录
- **环境变量**: 支持多个项目相关环境变量

### TypeScript 配置

- 严格模式启用
- React JSX 支持
- 路径别名支持

---

## 📝 待开发功能

2. **真实视频播放**: 表演舞台页的原视频区域待接入真实视频
3. **手势识别集成**: 当前为模拟，需要集成真实的 MediaPipe Hands
4. **视频导出功能**: 表演完成后导出双轨视频
5. **用户认证系统**: 登录、注册功能
6. **视频分享功能**: 分享到社交媒体平台

---

## 🔐 环境变量

创建 `.env` 文件：

```env
# DashScope API (视频解析脚本)
DASHSCOPE_API_KEY=your_api_key
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MODEL_NAME=qwen-vl-plus

# Vite 构建配置
BASE_PATH=/
PROJECT_ID=
VERSION_ID=
READDY_AI_DOMAIN=
```

---

## 📄 许可证

本项目为私有项目。

---

## 👥 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📞 联系方式

如有问题或建议，请提交 Issue。

---

**最后更新**: 2025-01-15

