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
  const [state, setState] = useState<VideoAnalysisState>({
    videoFile: null,
    videoUrl: null,
    analysisResult: null,
    isAnalyzing: false,
    error: null,
  });

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
    setState((prev) => ({
      ...prev,
      analysisResult: result,
    }));
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

