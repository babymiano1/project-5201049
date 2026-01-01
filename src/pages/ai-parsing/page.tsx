import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVideoAnalysis } from '../../contexts/VideoAnalysisContext';

// ✅ Vercel 部署：在生产环境使用相对路径，开发环境使用 localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3001');

export default function AIParsing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setAnalysisResult, setIsAnalyzing, setError } = useVideoAnalysis();
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState(0);
  const analysisCalledRef = useRef(false);

  const tasks = [
    { id: 1, name: '动作语义解析', icon: 'ri-hand-heart-line' },
    { id: 2, name: '音乐音轨分析', icon: 'ri-music-2-line' },
    { id: 3, name: '节奏卡点识别', icon: 'ri-rhythm-line' },
    { id: 4, name: '生成创作任务', icon: 'ri-magic-line' },
  ];

  // 调用 API 分析视频
  const analyzeVideo = useCallback(async () => {
    if (!state.videoFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', state.videoFile);

      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '分析失败');
      }

      // 保存分析结果到全局状态
      setAnalysisResult(result.data);
      console.log('分析结果:', result.data);
    } catch (err) {
      console.error('分析视频时出错:', err);
      setError(err instanceof Error ? err.message : '分析视频时发生未知错误');
    } finally {
      setIsAnalyzing(false);
    }
  }, [state.videoFile, setIsAnalyzing, setError, setAnalysisResult]);

  // 调用 API 分析视频
  useEffect(() => {
    // 如果没有视频文件，检查是否是示例视频
    if (!state.videoFile && !location.state?.exampleId) {
      // 如果没有视频文件且不是示例，返回首页
      navigate('/');
      return;
    }

    // 如果是示例视频，跳过 API 调用
    if (location.state?.exampleId) {
      return;
    }

    // 只在进度达到 50% 时调用一次 API
    if (progress >= 50 && !analysisCalledRef.current && state.videoFile) {
      analysisCalledRef.current = true;
      analyzeVideo();
    }
  }, [progress, state.videoFile, location.state, navigate, analyzeVideo]);

  // 进度条更新逻辑
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // ✅ 写入确认：只有当 state.analysisResult 确实不为 null 时，才执行跳转
  useEffect(() => {
    // 只有当进度达到 100% 且分析结果确实存在时才跳转
    if (progress >= 100 && state.analysisResult && state.analysisResult.length > 0) {
      console.log('✅ 数据写入确认，准备跳转，动作数量:', state.analysisResult.length);
      setTimeout(() => {
        navigate('/creation-setup', {
          state: {
            actionScript: state.analysisResult
          }
        });
      }, 500);
    } else if (progress >= 100 && !state.analysisResult) {
      console.warn('⚠️ 进度已完成但分析结果为空，等待数据写入...');
    }
  }, [progress, state.analysisResult, navigate]);

  useEffect(() => {
    const taskIndex = Math.floor(progress / 25);
    setCurrentTask(Math.min(taskIndex, tasks.length - 1));
  }, [progress]);

  return (
    <div className="min-h-screen bg-black font-['Inter',sans-serif]">
      {/* Header */}
      <div className="px-6 pt-16 pb-12">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            AI 解析中
          </h1>
          <p className="text-lg text-white/50 font-medium">
            正在分析你的视频内容
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-20 max-w-2xl mx-auto">
        {/* AI Brain Animation */}
        <div className="relative mb-16">
          <div className="relative bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[32px] p-12 overflow-hidden border border-white/10">
            {/* Soft glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Animated circles */}
              <div className="relative w-40 h-40 mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/20 to-cyan-400/20 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-400/30 to-cyan-400/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-400/40 to-cyan-400/40 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="ri-brain-line text-6xl text-white/90"></i>
                </div>
              </div>

              {/* Progress */}
              <div className="text-6xl font-black text-white mb-4">
                {progress}%
              </div>
              
              {/* Current task */}
              <div className="text-lg text-white/60 font-medium">
                {tasks[currentTask].name}
              </div>
              
              {/* Error message */}
              {state.error && (
                <div className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{state.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={`relative bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[24px] p-6 border transition-all duration-500 ${
                index <= currentTask
                  ? 'border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                  : 'border-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                  index <= currentTask
                    ? 'bg-gradient-to-br from-purple-400/20 to-cyan-400/20 border border-white/10'
                    : 'bg-white/5'
                }`}>
                  <i className={`${task.icon} text-2xl ${
                    index <= currentTask ? 'text-white/90' : 'text-white/30'
                  }`}></i>
                </div>

                {/* Task name */}
                <div className="flex-1">
                  <div className={`text-lg font-semibold transition-colors duration-500 ${
                    index <= currentTask ? 'text-white' : 'text-white/30'
                  }`}>
                    {task.name}
                  </div>
                </div>

                {/* Status */}
                {index < currentTask && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400/20 to-green-400/10 flex items-center justify-center border border-green-400/20">
                    <i className="ri-check-line text-lg text-green-400"></i>
                  </div>
                )}
                {index === currentTask && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400/20 to-cyan-400/20 flex items-center justify-center border border-white/10">
                    <i className="ri-loader-4-line text-lg text-white/90 animate-spin"></i>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
