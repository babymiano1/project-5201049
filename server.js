import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import cors from 'cors';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 配置 multer 用于文件上传
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// 确保 uploads 目录存在
await fs.mkdir('uploads', { recursive: true });

// API 路由：分析视频
app.post('/api/analyze', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传视频文件',
      });
    }

    const videoPath = req.file.path;
    const pythonScriptPath = join(__dirname, 'analyse_video.py');

    console.log(`开始分析视频: ${videoPath}`);

    // 调用 Python 脚本
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScriptPath}" "${videoPath}"`
    );

    // 清理上传的文件
    await fs.unlink(videoPath).catch(() => {});

    if (stderr && !stderr.includes('Warning')) {
      console.error('Python 脚本错误:', stderr);
      return res.status(500).json({
        success: false,
        error: `分析失败: ${stderr}`,
      });
    }

    // 解析 Python 脚本的输出（JSON）
    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      console.error('解析 JSON 失败:', stdout);
      return res.status(500).json({
        success: false,
        error: '解析结果失败，请检查 Python 脚本输出',
        rawOutput: stdout,
      });
    }

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('分析视频时出错:', error);
    
    // 尝试清理文件
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: error.message || '分析视频时发生未知错误',
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API 服务器运行在 http://localhost:${PORT}`);
});

