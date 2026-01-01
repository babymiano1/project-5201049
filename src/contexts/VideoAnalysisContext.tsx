import { createContext, useContext, useState, ReactNode } from 'react';

// 动作序列项类型
export interface ActionItem {
  id: number;
  timestamp: string;
  action_tag: string;
  description: string;
  intensity: number;
  rhythm_point: boolean;
}

// 视频分析状态类型
export interface VideoAnalysisState {
  videoFile: File | null;
  videoUrl: string | null;
  analysisResult: ActionItem[] | null;
  isAnalyzing: boolean;
  error: string | null;
}

// Context 类型
interface VideoAnalysisContextType {
  state: VideoAnalysisState;
  setVideoFile: (file: File | null) => void;
  setAnalysisResult: (result: ActionItem[] | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setError: (error: string | null) => void;
  clearState: () => void;
}

const VideoAnalysisContext = createContext<VideoAnalysisContextType | undefined>(undefined);

// Provider 组件
export function VideoAnalysisProvider({ children }: { children: ReactNode }) {
  // ✅ 数据持久化：从 sessionStorage 读取初始状态
  const getInitialState = (): VideoAnalysisState => {
    try {
      const stored = sessionStorage.getItem('videoAnalysisState');
      if (stored) {
        const parsed = JSON.parse(stored);
        // 注意：File 对象无法序列化，所以 videoFile 始终为 null
        // videoUrl 也需要重新生成，所以也设为 null
        return {
          ...parsed,
          videoFile: null,
          videoUrl: null,
          // 保留 analysisResult，这是最重要的数据
        };
      }
    } catch (error) {
      console.warn('读取 sessionStorage 失败:', error);
    }
    
    return {
      videoFile: null,
      videoUrl: null,
      analysisResult: null,
      isAnalyzing: false,
      error: null,
    };
  };

  const [state, setState] = useState<VideoAnalysisState>(getInitialState);

  const setVideoFile = (file: File | null) => {
    // 如果之前有 URL，先清理
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }

    const videoUrl = file ? URL.createObjectURL(file) : null;

    setState((prev) => ({
      ...prev,
      videoFile: file,
      videoUrl,
    }));
  };

  const setAnalysisResult = (result: ActionItem[] | null) => {
    setState((prev) => {
      const newState = {
        ...prev,
        analysisResult: result,
      };
      
      // ✅ 数据持久化：同步将数据存入 sessionStorage
      try {
        sessionStorage.setItem('videoAnalysisState', JSON.stringify({
          ...newState,
          videoFile: null, // File 对象无法序列化
          videoUrl: null,  // URL 对象需要重新生成
        }));
        console.log('💾 分析结果已保存到 sessionStorage，动作数量:', result?.length || 0);
      } catch (error) {
        console.warn('保存到 sessionStorage 失败:', error);
      }
      
      return newState;
    });
  };

  const setIsAnalyzing = (isAnalyzing: boolean) => {
    setState((prev) => ({
      ...prev,
      isAnalyzing,
    }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  };

  const clearState = () => {
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }
    
    // ✅ 清理 sessionStorage
    try {
      sessionStorage.removeItem('videoAnalysisState');
      console.log('🗑️ 已清理 sessionStorage');
    } catch (error) {
      console.warn('清理 sessionStorage 失败:', error);
    }
    
    setState({
      videoFile: null,
      videoUrl: null,
      analysisResult: null,
      isAnalyzing: false,
      error: null,
    });
  };

  return (
    <VideoAnalysisContext.Provider
      value={{
        state,
        setVideoFile,
        setAnalysisResult,
        setIsAnalyzing,
        setError,
        clearState,
      }}
    >
      {children}
    </VideoAnalysisContext.Provider>
  );
}

// Hook
export function useVideoAnalysis() {
  const context = useContext(VideoAnalysisContext);
  if (context === undefined) {
    throw new Error('useVideoAnalysis must be used within a VideoAnalysisProvider');
  }
  return context;
}

