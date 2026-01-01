import multer from 'multer';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

// 配置 multer 用于文件上传（使用 /tmp 目录，Vercel Serverless Functions 支持）
const upload = multer({
  dest: tmpdir(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// 处理文件上传的中间件
const uploadMiddleware = upload.single('video');

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: '方法不允许',
    });
  }

  // 使用 Promise 包装 multer 中间件
  await new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传视频文件',
      });
    }

    const videoPath = req.file.path;
    // Python 脚本路径（相对于项目根目录）
    // 在 Vercel 中，使用 /var/task 作为工作目录
    const pythonScriptPath = join(process.cwd(), 'analyse_video.py');

    // 调用 Python 脚本
    // 注意：Vercel 需要 Python 3.9+，使用 python3 命令
    // 确保 Python 脚本有执行权限
    const { stdout, stderr } = await execAsync(
      `python3 "${pythonScriptPath}" "${videoPath}"`,
      {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1', // 确保 Python 输出不被缓冲
        }
      }
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
      let cleanedStdout = stdout.trim();
      
      // 移除 BOM（如果存在）
      if (cleanedStdout.length > 0 && cleanedStdout.charCodeAt(0) === 0xFEFF) {
        cleanedStdout = cleanedStdout.slice(1);
      }
      
      // 查找第一个 { 的位置
      const firstBraceIndex = cleanedStdout.indexOf('{');
      
      if (firstBraceIndex === -1) {
        throw new Error('无法找到 JSON 开始标记 {');
      }
      
      // 匹配括号对
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      let jsonEndIndex = -1;
      
      for (let i = firstBraceIndex; i < cleanedStdout.length; i++) {
        const char = cleanedStdout[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        if (inString) continue;
        
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEndIndex = i + 1;
            break;
          }
        }
      }
      
      if (jsonEndIndex === -1) {
        throw new Error('无法找到匹配的 JSON 结束标记 }');
      }
      
      const jsonString = cleanedStdout.substring(firstBraceIndex, jsonEndIndex);
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ 解析 JSON 失败:', parseError.message);
      return res.status(500).json({
        success: false,
        error: '解析结果失败，请检查 Python 脚本输出',
        parseError: parseError.message,
        rawOutput: stdout.substring(0, 500),
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
}

