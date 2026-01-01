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
    // 核心策略：只提取 { 和 } 之间的内容，忽略所有其他输出
    let result;
    try {
      // Debug: 打印原始输出用于诊断
      console.log('📥 Python 原始输出长度:', stdout.length);
      if (stdout.length > 0) {
        console.log('📥 Python 原始输出前200字符:', stdout.substring(0, Math.min(200, stdout.length)));
      }
      
      // 清理输出：移除可能的 BOM 和首尾空白
      let cleanedStdout = stdout.trim();
      
      // 移除 BOM（如果存在）
      if (cleanedStdout.length > 0 && cleanedStdout.charCodeAt(0) === 0xFEFF) {
        cleanedStdout = cleanedStdout.slice(1);
      }
      
      // 核心逻辑：查找第一个 { 的位置
      const firstBraceIndex = cleanedStdout.indexOf('{');
      
      if (firstBraceIndex === -1) {
        throw new Error('无法找到 JSON 开始标记 {');
      }
      
      // 从第一个 { 开始，正确匹配括号对
      // 需要处理字符串内的 { } 和转义字符
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      let jsonEndIndex = -1;
      
      for (let i = firstBraceIndex; i < cleanedStdout.length; i++) {
        const char = cleanedStdout[i];
        
        // 处理转义字符
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        // 处理字符串边界
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        // 在字符串内部，忽略所有括号
        if (inString) continue;
        
        // 统计括号
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          // 当括号计数归零时，找到了完整的 JSON 对象
          if (braceCount === 0) {
            jsonEndIndex = i + 1;
            break;
          }
        }
      }
      
      if (jsonEndIndex === -1) {
        throw new Error('无法找到匹配的 JSON 结束标记 }');
      }
      
      // 提取 { 和 } 之间的完整 JSON 字符串
      const jsonString = cleanedStdout.substring(firstBraceIndex, jsonEndIndex);
      
      console.log('✅ 成功提取 JSON，长度:', jsonString.length);
      console.log('📦 提取的 JSON 前100字符:', jsonString.substring(0, Math.min(100, jsonString.length)));
      
      // 解析 JSON
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ 解析 JSON 失败:', parseError.message);
      console.error('📥 原始 stdout 长度:', stdout.length);
      console.error('📥 原始 stdout 内容:', stdout);
      console.error('📥 原始 stderr 内容:', stderr);
      return res.status(500).json({
        success: false,
        error: '解析结果失败，请检查 Python 脚本输出',
        parseError: parseError.message,
        rawOutput: stdout.substring(0, 500), // 只返回前500字符避免日志过长
        rawStderr: stderr,
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


