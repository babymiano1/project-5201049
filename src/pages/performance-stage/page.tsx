import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useVideoAnalysis, type ActionItem } from '../../contexts/VideoAnalysisContext';

// 粒子类型
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type?: 'normal' | 'firework' | 'explosion' | 'rainbow' | 'star' | 'sparkle'; // ✅ 特效类型
  trail?: boolean; // ✅ 是否带拖尾效果
}

// 动作提示类型
interface ActionHint {
  id: number;
  action_tag: string;
  description: string;
  timestamp: number; // 改为使用视频时间戳（秒），而非 Date.now()
  color: string;
  icon: string;
}

// 音符气泡类型
interface NoteBubble {
  id: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  delay: number;
  color: string;
  targetTime?: number; // 目标时间（rhythm_point 的时间戳，用于精确同步）
}

// Action Tag 到视觉配置的映射
const ACTION_TAG_CONFIG: Record<string, { icon: string; color: string; bubbleColor: string }> = {
  'POINT': {
    icon: '👆',
    color: 'from-blue-400 to-cyan-400',
    bubbleColor: 'from-blue-400 to-cyan-400'
  },
  'PUSH': {
    icon: '✋',
    color: 'from-purple-400 to-pink-400',
    bubbleColor: 'from-purple-400 to-pink-400'
  },
  'PULL': {
    icon: '✋',
    color: 'from-purple-400 to-pink-400',
    bubbleColor: 'from-purple-400 to-pink-400'
  },
  'SWIPE': {
    icon: '↔️',
    color: 'from-teal-400 to-cyan-400',
    bubbleColor: 'from-teal-400 to-cyan-400'
  },
  'WAVE': {
    icon: '👋',
    color: 'from-cyan-400 to-blue-400',
    bubbleColor: 'from-cyan-400 to-blue-400'
  },
  'ROLL': {
    icon: '🌊',
    color: 'from-cyan-400 to-blue-400',
    bubbleColor: 'from-cyan-400 to-blue-400'
  },
  'CLAP': {
    icon: '👏',
    color: 'from-purple-400 to-pink-400',
    bubbleColor: 'from-purple-400 to-pink-400'
  },
  'PUNCH': {
    icon: '👊',
    color: 'from-red-400 to-pink-400',
    bubbleColor: 'from-red-400 to-pink-400'
  },
  'HEART': {
    icon: '❤️',
    color: 'from-pink-400 to-rose-400',
    bubbleColor: 'from-pink-400 to-rose-400'
  },
  'HIT': {
    icon: '💥',
    color: 'from-yellow-400 to-orange-400',
    bubbleColor: 'from-yellow-400 to-orange-400'
  },
  'FRAME': {
    icon: '🖼️',
    color: 'from-indigo-400 to-purple-400',
    bubbleColor: 'from-indigo-400 to-purple-400'
  },
  'SPIN': {
    icon: '🔄',
    color: 'from-green-400 to-teal-400',
    bubbleColor: 'from-green-400 to-teal-400'
  },
  'CIRCLE': {
    icon: '⭕',
    color: 'from-green-400 to-teal-400',
    bubbleColor: 'from-green-400 to-teal-400'
  },
  'GREET': {
    icon: '👋',
    color: 'from-cyan-400 to-blue-400',
    bubbleColor: 'from-cyan-400 to-blue-400'
  },
};

// 默认配置
const DEFAULT_CONFIG = {
  icon: '✨',
  color: 'from-gray-400 to-gray-500',
  bubbleColor: 'from-gray-400 to-gray-500'
};

// 统一的时间戳转换函数：支持字符串（"mm:ss.ms"）和数字（秒数）
function parseTimestampToSeconds(ts: string | number): number {
  // 如果已经是数字，检查是否需要转换（如果大于1000，可能是毫秒）
  if (typeof ts === 'number') {
    // 如果数字大于1000，可能是毫秒，转换为秒
    if (ts > 1000) {
      console.warn('⚠️ 检测到可能为毫秒的时间戳:', ts, '，已转换为秒:', ts / 1000);
      return ts / 1000;
    }
    return ts;
  }
  
  // 如果是字符串，解析 "mm:ss.ms" 格式
  const parts = ts.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    const result = minutes * 60 + seconds;
    return result;
  }
  
  // 如果格式不正确，尝试直接解析为数字
  const parsed = parseFloat(ts);
  if (!isNaN(parsed)) {
    // 如果解析出的数字大于1000，可能是毫秒
    if (parsed > 1000) {
      console.warn('⚠️ 检测到可能为毫秒的时间戳字符串:', ts, '，已转换为秒:', parsed / 1000);
      return parsed / 1000;
    }
    return parsed;
  }
  
  console.warn('❌ 无法解析时间戳:', ts);
  return 0;
}

// 保持向后兼容的别名
const timestampToSeconds = parseTimestampToSeconds;

export default function PerformanceStage() {
  // 从 Context 获取分析结果
  const { state: videoAnalysisState } = useVideoAnalysis();
  
  // ✅ 增加数据存在性检查日志：在 render 函数顶部
  console.log('🔍 Final Check Before Render:', {
    analysisResultLength: videoAnalysisState.analysisResult?.length || 0,
    analysisResult: videoAnalysisState.analysisResult,
    videoUrl: videoAnalysisState.videoUrl ? '存在' : 'null',
    videoFile: videoAnalysisState.videoFile ? '存在' : 'null'
  });
  
  // 使用 Ref 存储脚本，避免闭包陷阱
  const scriptRef = useRef<ActionItem[] | null>(null);
  
  // 同步更新 scriptRef
  useEffect(() => {
    scriptRef.current = videoAnalysisState.analysisResult;
    if (videoAnalysisState.analysisResult) {
      console.log('✅ analysisResult 已更新，共', videoAnalysisState.analysisResult.length, '个动作');
    }
  }, [videoAnalysisState.analysisResult]);
  
  // 调试：打印 videoUrl 状态
  useEffect(() => {
    console.log('PerformanceStage - videoUrl:', videoAnalysisState.videoUrl);
    console.log('PerformanceStage - videoFile:', videoAnalysisState.videoFile);
    console.log('PerformanceStage - analysisResult:', videoAnalysisState.analysisResult?.length || 0, '个动作');
  }, [videoAnalysisState.videoUrl, videoAnalysisState.videoFile, videoAnalysisState.analysisResult]);
  
  // 状态管理
  const [stage, setStage] = useState<'tutorial' | 'countdown' | 'performing'>('tutorial');
  const [countdown, setCountdown] = useState(3);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [cameraError, setCameraError] = useState<string>('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  // ✅ 性能优化：将粒子和气泡数据迁移到 useRef，避免频繁的 React 重渲染
  const particlesRef = useRef<Particle[]>([]);
  const leftBubblesRef = useRef<NoteBubble[]>([]);
  const rightBubblesRef = useRef<NoteBubble[]>([]);
  
  // 保留 actionHints 使用 useState（因为需要触发 React 渲染来显示 UI）
  const [actionHints, setActionHints] = useState<ActionHint[]>([]);
  const [handDetected, setHandDetected] = useState(false);
  const [lastGestureTime, setLastGestureTime] = useState(0);

  // new
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false); // 如果需要录制结束后的弹窗
  const [finalScore, setFinalScore] = useState(0); // ✅ 最终分数（冻结）
  const [finalCombo, setFinalCombo] = useState(0); // ✅ 最终连击（冻结）

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null); // 右侧：用户摄像头
  const originalVideoRef = useRef<HTMLVideoElement>(null); // 左侧：原视频
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const particleIdRef = useRef(0);
  const actionIdRef = useRef(0);
  const bubbleIdRef = useRef(0);
  const gestureIntervalRef = useRef<number | undefined>(undefined);
  const processedActionsRef = useRef<Set<number>>(new Set<number>());
  const syncLoopRef = useRef<number | undefined>(undefined); // requestAnimationFrame ID for sync loop
  const processedIndicesRef = useRef<Set<number>>(new Set<number>()); // 记录已触发的动作下标
  const lastDebugTimeRef = useRef<number>(0); // 用于每秒打印一次日志

  // new refs
  const canvasRef = useRef<HTMLCanvasElement>(null); // 用于绘制骨骼
  const effectsCanvasRef = useRef<HTMLCanvasElement>(null); // ✅ 新增：用于绘制粒子和气泡的 Canvas
  const handsRef = useRef<Hands | null>(null);       // MediaPipe 实例
  const cameraRef = useRef<Camera | null>(null);     // MediaPipe Camera 工具
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scoreRef = useRef<number>(0); // ✅ 用于保存最新分数，确保冻结时获取最新值
  const comboRef = useRef<number>(0); // ✅ 用于保存最新连击，确保冻结时获取最新值
  
  // ✅ 性能优化：统一的动画循环 ref
  const mainAnimationFrameRef = useRef<number | undefined>(undefined);
  const lastHandsProcessTimeRef = useRef<number>(0); // ✅ 用于手势识别节流（30fps = 33ms）

  // ✅ 绘制手部骨骼（优化：移除 shadowBlur 等高能耗属性）
  const drawHandSkeleton = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    // ✅ 性能优化：移除 shadowBlur，使用更高效的绘制方式
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    // 移除 shadowBlur 和 shadowColor，改用更简单的绘制

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    });

    ctx.fillStyle = '#14b8a6';
    // 移除 shadowBlur

    landmarks.forEach((landmark) => {
      ctx.beginPath();
      ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, []);

  // ✅ 颜色映射工具函数（提前定义）
  const getColorFromGradient = useCallback((colorGradient: string): string => {
    const colorMap: Record<string, string> = {
      'from-blue-400 to-cyan-400': '#06b6d4',
      'from-purple-400 to-pink-400': '#8b5cf6',
      'from-yellow-400 to-orange-400': '#f59e0b',
      'from-pink-400 to-rose-400': '#ec4899',
      'from-green-400 to-teal-400': '#14b8a6',
      'from-red-400 to-pink-400': '#ef4444',
      'from-indigo-400 to-purple-400': '#6366f1',
      'from-teal-400 to-cyan-400': '#14b8a6',
      'from-gray-400 to-gray-500': '#9ca3af',
    };
    return colorMap[colorGradient] || '#8b5cf6';
  }, []);

  // ✅ 性能优化：统一的 Canvas 绘制函数（绘制粒子和气泡）
  const drawEffects = useCallback(() => {
    if (!effectsCanvasRef.current) return;
    
    const canvas = effectsCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置 Canvas 尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const JUDGE_LINE_Y = window.innerHeight * 0.2;
    const deltaTime = 1 / 60; // 固定帧率 60fps
    
    // ✅ 更新并绘制左侧气泡
    leftBubblesRef.current = leftBubblesRef.current
      .map(bubble => {
        const audioTime = audioRef.current?.currentTime || 0;
        
        // 如果有目标时间，进行精确同步检查
        if (bubble.targetTime !== undefined) {
          const timeDiff = audioTime - bubble.targetTime;
          if (timeDiff > 0.2 && bubble.y > JUDGE_LINE_Y + 50) {
            return null;
          }
        }
        
        let newY = bubble.y + bubble.speed * (deltaTime * 60);
        if (newY > window.innerHeight + 100) {
          return null;
        }
        
        // 绘制气泡
        const gradient = ctx.createRadialGradient(
          window.innerWidth * 0.08, newY,
          0,
          window.innerWidth * 0.08, newY,
          bubble.size / 2
        );
        const color = getColorFromGradient(bubble.color);
        gradient.addColorStop(0, color);
        // 创建透明边缘：将 hex 颜色转换为 rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = bubble.opacity;
        ctx.beginPath();
        ctx.arc(window.innerWidth * 0.08, newY, bubble.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        return { ...bubble, y: newY };
      })
      .filter((bubble): bubble is NoteBubble => bubble !== null);
    
    // ✅ 更新并绘制右侧气泡
    rightBubblesRef.current = rightBubblesRef.current
      .map(bubble => {
        const audioTime = audioRef.current?.currentTime || 0;
        
        // 如果有目标时间，进行精确同步检查
        if (bubble.targetTime !== undefined) {
          const timeDiff = audioTime - bubble.targetTime;
          if (timeDiff > 0.2 && bubble.y > JUDGE_LINE_Y + 50) {
            return null;
          }
        }
        
        let newY = bubble.y + bubble.speed * (deltaTime * 60);
        if (newY > window.innerHeight + 100) {
          return null;
        }
        
        // 绘制气泡
        const gradient = ctx.createRadialGradient(
          window.innerWidth * 0.92, newY,
          0,
          window.innerWidth * 0.92, newY,
          bubble.size / 2
        );
        const color = getColorFromGradient(bubble.color);
        gradient.addColorStop(0, color);
        // 创建透明边缘：将 hex 颜色转换为 rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = bubble.opacity;
        ctx.beginPath();
        ctx.arc(window.innerWidth * 0.92, newY, bubble.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        return { ...bubble, y: newY };
      })
      .filter((bubble): bubble is NoteBubble => bubble !== null);
    
    // ✅ 更新并绘制粒子
    particlesRef.current = particlesRef.current
      .map(p => {
        let newVx = p.vx;
        let newVy = p.vy;
        
        // 根据特效类型应用不同的物理效果
        switch (p.type) {
          case 'firework':
            newVy = p.vy + 0.15;
            newVx = p.vx * 0.98;
            break;
          case 'explosion':
            newVy = p.vy + 0.08;
            newVx = p.vx * 0.97;
            break;
          case 'rainbow':
            newVy = p.vy + 0.05;
            newVx = p.vx * 0.99;
            break;
          case 'star':
            newVy = p.vy + 0.03;
            newVx = p.vx * 0.995;
            break;
          case 'sparkle':
            newVy = p.vy + 0.1;
            newVx = p.vx * 0.95;
            break;
          default:
            newVy = p.vy + 0.1;
            break;
        }
        
        const newX = p.x + newVx;
        const newY = p.y + newVy;
        const lifeProgress = p.life / p.maxLife;
        const opacity = 1 - lifeProgress;
        
        // 绘制粒子
        ctx.globalAlpha = opacity;
        ctx.fillStyle = p.color;
        
        switch (p.type) {
          case 'star':
            // 绘制星形
            const starSize = p.size;
            ctx.save();
            ctx.translate(newX, newY);
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
              const x = Math.cos(angle) * starSize;
              const y = Math.sin(angle) * starSize;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            break;
          default:
            // 绘制圆形粒子
            ctx.beginPath();
            ctx.arc(newX, newY, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        
        ctx.globalAlpha = 1;
        
        return {
          ...p,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          life: p.life + 1
        };
      })
      .filter(p => p.life < p.maxLife);
  }, [getColorFromGradient]);

  // ✅ 创建基础粒子特效
  const createParticles = useCallback((x: number, y: number, colorGradient: string, intensity: number) => {
    const particleColor = getColorFromGradient(colorGradient);
    const particleCount = 15 + Math.floor(intensity / 2);
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + (intensity / 10) * 2;
      
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: particleColor,
        size: 3 + Math.random() * 3,
        type: 'normal'
      });
    }

    // ✅ 性能优化：直接更新 ref，不触发 React 重渲染
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, [getColorFromGradient]);

  // ✅ 创建烟花特效（多层爆炸效果）
  const createFireworks = useCallback((x: number, y: number, intensity: number) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8c94', '#95e1d3', '#f38181'];
    const newParticles: Particle[] = [];
    const layerCount = 2 + Math.floor(intensity / 3); // 2-4层
    
    for (let layer = 0; layer < layerCount; layer++) {
      const layerDelay = layer * 5; // 每层延迟
      const layerRadius = 30 + layer * 20;
      const particleCount = 30 + layer * 10;
      const color = colors[layer % colors.length];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
        const speed = 3 + layer * 1.5 + Math.random() * 2;
        const baseVx = Math.cos(angle) * speed;
        const baseVy = Math.sin(angle) * speed;
        
        newParticles.push({
          id: Date.now() + Math.random() + i + layer * 1000,
          x: x + Math.cos(angle) * layerRadius * 0.3,
          y: y + Math.sin(angle) * layerRadius * 0.3,
          vx: baseVx,
          vy: baseVy,
          life: layerDelay,
          maxLife: 80 + layer * 20,
          color,
          size: 4 + Math.random() * 4,
          type: 'firework',
          trail: true
        });
      }
    }

    // ✅ 性能优化：直接更新 ref
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // ✅ 创建爆炸特效（快速扩散）- 优化性能
  const createExplosion = useCallback((x: number, y: number, intensity: number) => {
    const colors = ['#ff4757', '#ff6348', '#ffa502', '#ffd32a', '#ff6b81'];
    const newParticles: Particle[] = [];
    // ✅ 优化：限制粒子数量，保证流畅度
    const particleCount = Math.min(30 + Math.floor(intensity * 2), 60);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 50 + Math.random() * 30,
        color,
        size: 5 + Math.random() * 6,
        type: 'explosion',
        trail: true
      });
    }

    // ✅ 性能优化：直接更新 ref
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // ✅ 创建彩虹特效（弧形粒子流）- 优化性能
  const createRainbow = useCallback((x: number, y: number, intensity: number) => {
    const rainbowColors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
    const newParticles: Particle[] = [];
    // ✅ 优化：减少粒子数量
    const particleCount = Math.min(30 + Math.floor(intensity * 1.5), 50);
    
    for (let i = 0; i < particleCount; i++) {
      const progress = i / particleCount;
      const angle = -Math.PI / 2 + (progress - 0.5) * Math.PI; // 弧形
      const speed = 2 + Math.random() * 3;
      const color = rainbowColors[Math.floor(progress * rainbowColors.length)];
      
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 1, // 向下飘落
        life: 1,
        maxLife: 60 + Math.random() * 40,
        color,
        size: 3 + Math.random() * 4,
        type: 'rainbow'
      });
    }

    // ✅ 性能优化：直接更新 ref
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // ✅ 创建星星特效（闪烁星星）- 优化性能
  const createStars = useCallback((x: number, y: number, intensity: number) => {
    const colors = ['#ffffff', '#ffd700', '#87ceeb', '#ff69b4', '#98fb98'];
    const newParticles: Particle[] = [];
    // ✅ 优化：减少粒子数量
    const particleCount = Math.min(15 + Math.floor(intensity * 1.5), 30);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 60;
      const speed = 0.5 + Math.random() * 1.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 100 + Math.random() * 50,
        color,
        size: 2 + Math.random() * 4,
        type: 'star'
      });
    }

    // ✅ 性能优化：直接更新 ref
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // ✅ 创建闪光特效（快速闪烁）- 优化性能
  const createSparkles = useCallback((x: number, y: number, intensity: number) => {
    const colors = ['#ffffff', '#ffff00', '#00ffff', '#ff00ff'];
    const newParticles: Particle[] = [];
    // ✅ 优化：减少粒子数量
    const particleCount = Math.min(20 + Math.floor(intensity * 1.5), 35);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      newParticles.push({
        id: Date.now() + Math.random() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 30 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 3,
        type: 'sparkle'
      });
    }

    // ✅ 性能优化：直接更新 ref
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // ✅ 触发手势效果（基于 action 数据）- 提前定义以便其他函数使用
  const triggerGesture = useCallback((action: ActionItem) => {
    const now = Date.now();
    // ✅ 降低防抖时间：从300ms降到100ms，让特效更容易触发
    if (now - lastGestureTime < 100) return;
    
    setLastGestureTime(now);
    setHandDetected(true);
    setTimeout(() => setHandDetected(false), 300);

    // 根据 intensity 计算分数（数据驱动）
    const baseScore = 50 + action.intensity * 10;
    scoreRef.current += baseScore;
    setScore(scoreRef.current); // ✅ 更新状态以触发 UI 更新
    
    // 如果是节奏点，增加连击
    if (action.rhythm_point) {
      comboRef.current += 1;
      setCombo(comboRef.current); // ✅ 更新状态以触发 UI 更新
    }

    // ✅ 根据不同的 action_tag 触发不同的炫酷特效
    const config = ACTION_TAG_CONFIG[action.action_tag] || {
      icon: '✨',
      color: 'from-purple-400 to-pink-400',
      bubbleColor: 'from-purple-400 to-pink-400'
    };
    
    // 根据手势类型选择特效位置（使用屏幕中心或手势位置）
    const effectX = window.innerWidth / 2;
    const effectY = window.innerHeight / 2;
    
    // ✅ 根据不同的 action_tag 触发不同的特效
    switch (action.action_tag) {
      case 'PUNCH':
      case 'HIT':
        // 拳击/击中：爆炸特效
        createExplosion(effectX, effectY, action.intensity);
        break;
      case 'CLAP':
        // 拍手：烟花特效
        createFireworks(effectX, effectY, action.intensity);
        break;
      case 'HEART':
        // 比心：星星特效
        createStars(effectX, effectY, action.intensity);
        break;
      case 'WAVE':
      case 'SWIPE':
        // 挥手/滑动：彩虹特效
        createRainbow(effectX, effectY, action.intensity);
        break;
      case 'SPIN':
      case 'CIRCLE':
        // 旋转/画圈：闪光特效
        createSparkles(effectX, effectY, action.intensity);
        break;
      default:
        // 默认：基础粒子特效
        createParticles(effectX, effectY, config.color, action.intensity);
        break;
    }
  }, [createParticles, createFireworks, createExplosion, createRainbow, createStars, createSparkles]);

  // ✅ 简单手势识别函数（检测握拳、张开等）
  const detectSimpleGesture = useCallback((landmarks: any[]): string | null => {
    if (!landmarks || landmarks.length < 21) return null;
    
    // 获取关键点
    const indexTip = landmarks[8];    // 食指指尖
    const indexPip = landmarks[6];     // 食指第二关节
    const middleTip = landmarks[12];   // 中指指尖
    const middlePip = landmarks[10];   // 中指第二关节
    const ringTip = landmarks[16];    // 无名指指尖
    const ringPip = landmarks[14];    // 无名指第二关节
    const pinkyTip = landmarks[20];   // 小指指尖
    const pinkyPip = landmarks[18];    // 小指第二关节
    const thumbTip = landmarks[4];    // 拇指指尖
    const thumbIp = landmarks[3];      // 拇指第一关节
    
    // ✅ 握拳检测：所有手指都弯曲（指尖y坐标大于关节y坐标）
    const fingersBent = [
      indexTip.y > indexPip.y,
      middleTip.y > middlePip.y,
      ringTip.y > ringPip.y,
      pinkyTip.y > pinkyPip.y
    ];
    const bentCount = fingersBent.filter(Boolean).length;
    
    // ✅ 张开检测：至少3个手指展开
    const fingersExtended = [
      indexTip.y < indexPip.y,
      middleTip.y < middlePip.y,
      ringTip.y < ringPip.y,
      pinkyTip.y < pinkyPip.y
    ];
    const extendedCount = fingersExtended.filter(Boolean).length;
    
    // ✅ 比心检测：拇指和食指靠近
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    
    if (bentCount >= 3) {
      return 'PUNCH'; // 握拳
    } else if (extendedCount >= 3) {
      return 'WAVE'; // 张开/挥手
    } else if (thumbIndexDistance < 0.05 && extendedCount >= 2) {
      return 'HEART'; // 比心
    }
    
    return null;
  }, []);

  // ✅ 碰撞检测逻辑（使用 useCallback 优化）
  const checkBubbleCollision = useCallback((handX: number, handY: number) => {
    if (!canvasRef.current) return;
    
    // ✅ 扩大判定范围：从50px增加到80px，更容易触发
    const hitRadius = 80;
    const canvasWidth = canvasRef.current.width;
    const JUDGE_LINE_Y = window.innerHeight * 0.2;
    
    // ✅ 性能优化：直接操作 ref，不触发 React 重渲染
    // 检查左侧气泡
    leftBubblesRef.current = leftBubblesRef.current.filter(bubble => {
      // 计算气泡在 Canvas 坐标系中的 Y 位置（需要考虑气泡的 y 是相对于窗口的）
      const bubbleCanvasY = (bubble.y / window.innerHeight) * canvasRef.current!.height;
      // ✅ 放宽判定条件：扩大判定窗口
      const isHit = Math.abs(handY - bubbleCanvasY) < hitRadius && 
                    handX < canvasWidth / 2 &&
                    Math.abs(bubble.y - JUDGE_LINE_Y) < 100; // ✅ 扩大判定窗口：从50px到100px
      
      if (isHit) {
        // 触发得分和特效
        const hitAction: ActionItem = { 
          id: bubble.id, 
          action_tag: 'HIT', 
          description: '击中气泡',
          intensity: 5, 
          timestamp: '0:00.0',
          rhythm_point: false
        };
        triggerGesture(hitAction); 
        return false; // 移除气泡
      }
      return true;
    });
    
    // 检查右侧气泡
    rightBubblesRef.current = rightBubblesRef.current.filter(bubble => {
      const bubbleCanvasY = (bubble.y / window.innerHeight) * canvasRef.current!.height;
      // ✅ 放宽判定条件：扩大判定窗口
      const isHit = Math.abs(handY - bubbleCanvasY) < hitRadius && 
                    handX >= canvasWidth / 2 &&
                    Math.abs(bubble.y - JUDGE_LINE_Y) < 100; // ✅ 扩大判定窗口：从50px到100px
      
      if (isHit) {
        const hitAction: ActionItem = { 
          id: bubble.id, 
          action_tag: 'HIT', 
          description: '击中气泡',
          intensity: 5, 
          timestamp: '0:00.0',
          rhythm_point: false
        };
        triggerGesture(hitAction); 
        return false; // 移除气泡
      }
      return true;
    });
  }, [triggerGesture]);

  // ✅ 处理识别结果并绘制（添加 30fps 节流处理）
  const onHandsResults = useCallback((results: Results) => {
    if (!canvasRef.current) return;
    
    // ✅ 性能优化：30fps 节流（33ms间隔）
    const now = Date.now();
    if (now - lastHandsProcessTimeRef.current < 33) {
      return; // 跳过本次处理
    }
    lastHandsProcessTimeRef.current = now;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true);
      
      results.multiHandLandmarks.forEach((landmarks) => {
        // 绘制手部骨骼
        drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height);

        // 获取食指指尖坐标 (Index 8)
        const indexTip = landmarks[8]; 
        const x = indexTip.x * canvas.width;
        const y = indexTip.y * canvas.height;

        // ✅ 检测碰撞：判断手是否碰到了气泡
        checkBubbleCollision(x, y);
        
        // ✅ 新增：直接基于手势识别触发特效（不依赖气泡碰撞）
        const detectedGesture = detectSimpleGesture(landmarks);
        if (detectedGesture) {
          // ✅ 降低防抖：允许更频繁触发（150ms间隔）
          if (now - lastGestureTime >= 150) {
            // 创建临时 ActionItem 来触发特效
            const tempAction: ActionItem = {
              id: Date.now(),
              action_tag: detectedGesture,
              description: `检测到${detectedGesture}手势`,
              intensity: 5, // 中等强度
              timestamp: '0:00.0',
              rhythm_point: false
            };
            triggerGesture(tempAction);
          }
        }
      });
    } else {
      setHandDetected(false);
    }
  }, [drawHandSkeleton, checkBubbleCollision, detectSimpleGesture, triggerGesture]);

  // ✅ 初始化手势跟踪（使用 useCallback 优化）
  const initHandTracking = useCallback(() => {
    // 必须确保 video 和 canvas 都已存在
    if (!videoRef.current || !canvasRef.current) {
      console.warn("MediaPipe 等待 DOM 元素中...");
      return;
    }

    // 如果已经初始化过了，不要重复创建 Camera，避免内存泄漏
    if (cameraRef.current || handsRef.current) {
      console.warn("MediaPipe 已经初始化，跳过重复初始化");
      return;
    }

    try {
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults(onHandsResults);
      handsRef.current = hands;

      // 使用 Camera Utils 自动将 videoRef 的帧送入 hands 处理
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            try {
              await handsRef.current.send({ image: videoRef.current });
            } catch (error) {
              console.warn('⚠️ 手势识别发送失败:', error);
            }
          }
        },
        width: 1280,
        height: 720
      });

      camera.start();
      cameraRef.current = camera;
      console.log('✅ MediaPipe Hands 初始化成功');
    } catch (error) {
      console.error('❌ MediaPipe Hands 初始化失败:', error);
    }
  }, [onHandsResults]);

  // 初始化摄像头
  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log('开始初始化摄像头...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });

        console.log('摄像头流获取成功', stream);
        streamRef.current = stream;
        
        // 确保 videoRef 已挂载
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('摄像头流已绑定到 videoRef');
          
          // 确保视频播放
          videoRef.current.play().catch(err => {
            console.error('视频播放失败:', err);
          });
        } else {
          console.warn('videoRef.current 为 null，延迟绑定');
          // 延迟重试
          setTimeout(() => {
            if (videoRef.current && streamRef.current) {
              videoRef.current.srcObject = streamRef.current;
              videoRef.current.play().catch(err => {
                console.error('延迟播放失败:', err);
              });
            }
          }, 100);
        }

        setCameraPermission('granted');
      } catch (error) {
        console.error('摄像头访问失败:', error);
        setCameraPermission('denied');
        
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            setCameraError('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头');
          } else if (error.name === 'NotFoundError') {
            setCameraError('未检测到摄像头设备');
          } else {
            setCameraError('摄像头启动失败，请刷新页面重试');
          }
        }
      }
    };

    initCamera();

    return () => {
      // 停止摄像头流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // ✅ 清理所有动画循环和定时器
      if (mainAnimationFrameRef.current) {
        cancelAnimationFrame(mainAnimationFrameRef.current);
        mainAnimationFrameRef.current = undefined;
      }
      
      if (syncLoopRef.current) {
        cancelAnimationFrame(syncLoopRef.current);
        syncLoopRef.current = undefined;
      }
      
      if (gestureIntervalRef.current) {
        clearInterval(gestureIntervalRef.current);
        gestureIntervalRef.current = undefined;
      }
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // 停止音频播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      }
      
      // 停止视频播放
      if (originalVideoRef.current) {
        originalVideoRef.current.pause();
        originalVideoRef.current.currentTime = 0;
        originalVideoRef.current.src = '';
      }
      
      // ✅ 停止 MediaPipe 资源
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
          cameraRef.current = null;
        } catch (error) {
          console.warn('⚠️ 停止 MediaPipe Camera 失败:', error);
        }
      }
      
      if (handsRef.current) {
        try {
          handsRef.current.close();
          handsRef.current = null;
        } catch (error) {
          console.warn('⚠️ 关闭 MediaPipe Hands 失败:', error);
        }
      }
      
      // ✅ 停止录制
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.warn('⚠️ 停止录制失败:', error);
        }
      }
      
      // 清理摄像头视频
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      
      // ✅ 性能优化：清理 ref 数据
      particlesRef.current = [];
      leftBubblesRef.current = [];
      rightBubblesRef.current = [];
      setActionHints([]);
      processedActionsRef.current.clear();
      
      // ✅ 清理统一的动画循环
      if (mainAnimationFrameRef.current) {
        cancelAnimationFrame(mainAnimationFrameRef.current);
        mainAnimationFrameRef.current = undefined;
      }
    };
  }, []);

  // 修复摄像头切换失效：当 stage 切换到 performing 时重新绑定摄像头流
  useEffect(() => {
    if (stage === 'performing' && streamRef.current && videoRef.current) {
      // 重新绑定摄像头流
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => {
        console.error('摄像头视频播放失败:', err);
      });
      console.log('摄像头流已重新绑定到 performing 阶段的 videoRef');
    }
  }, [stage]);

  // 当 stage 变化时处理音频和视频
  useEffect(() => {
    if (stage === 'tutorial') {
      // 在教程阶段，暂停并重置音频和左侧视频
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (originalVideoRef.current) {
        originalVideoRef.current.pause();
        originalVideoRef.current.currentTime = 0;
      }
    }
    // countdown 阶段不暂停，为 performing 阶段的立即播放做准备
    // performing 阶段的音频和视频播放由 startPerformance 函数处理
  }, [stage]);

  // 倒计时逻辑
  useEffect(() => {
    if (stage === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (stage === 'countdown' && countdown === 0) {
      setStage('performing');
    }
  }, [stage, countdown]);

  useEffect(() => {
    // 这个返回函数会在组件销毁或 stage 改变时执行
    return () => {
      console.log('🧹 正在清理 MediaPipe 和录制资源...');
      
      // 停止录制
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // 停止 MediaPipe 相机工具
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
  
      // 关闭手势检测实例
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
  
      // 清理计时器
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [stage]); // 监听阶段变化，一旦离开 performing 自动执行清理

  // 开始表演
  const startPerformance = useCallback(async () => {
    // 清理已处理的下标记录，准备新的表演
    processedIndicesRef.current.clear();
    processedActionsRef.current.clear();
    
    // ✅ 性能优化：直接重置 ref
    leftBubblesRef.current = [];
    rightBubblesRef.current = [];
    
    console.log('🎭 开始表演，清理所有状态');
    
    // 同步播放音频和左侧原视频
    if (audioRef.current && videoAnalysisState.videoUrl) {
      try {
        // 重置音频和视频到开始位置
        audioRef.current.currentTime = 0;
        if (originalVideoRef.current) {
          originalVideoRef.current.currentTime = 0;
        }
        
        // 同步播放音频和左侧视频
        const playPromises = [
          audioRef.current.play(),
          originalVideoRef.current?.play()
        ].filter(Boolean);
        
        await Promise.all(playPromises);
        console.log('音频和视频同步播放开始');
      } catch (error) {
        console.error('播放失败:', error);
        // 如果自动播放失败，可能需要用户交互
      }
    }
    
    // 开始基于 action_script 的手势检测（数据驱动）
    startGestureDetection();
  }, [videoAnalysisState.videoUrl, videoAnalysisState.analysisResult]);

  // --- 修改后的 useEffect ---
  useEffect(() => {
    if (stage === 'performing') {
      // 1. 立即执行：同步状态清理（防止旧数据闪现）
      console.log('🔄 执行状态重置');
      processedIndicesRef.current.clear();
      processedActionsRef.current.clear();
      setActionHints([]);
      // ✅ 性能优化：直接重置 ref
      leftBubblesRef.current = [];
      rightBubblesRef.current = [];
      particlesRef.current = [];
      setScore(0);
      setCombo(0);
      scoreRef.current = 0; // ✅ 重置 ref
      comboRef.current = 0; // ✅ 重置 ref

      // 2. 延迟执行：确保 DOM 已经渲染，且 video 标签已挂载
      const timer = setTimeout(() => {
        // 检查引用是否已准备好
        if (!videoRef.current) {
          console.error("❌ 找不到 Video 引用，手势识别启动失败");
          return;
        }

        console.log('🚀 启动手势识别与录制');
        
        // 按照依赖顺序启动
        initHandTracking(); // 先初始化算法
        startRecording();   // 再开始录制（此时画面已稳定）
        startPerformance(); // 最后开始业务逻辑（产生气泡等）
        
      }, 500); // 500ms 是一个安全的缓冲时间

      return () => {
        clearTimeout(timer);
        // 在这里添加清理逻辑（见下文第3点）
      };
    }
  }, [stage, startPerformance]);

  // ✅ 性能优化：统一的动画循环（更新粒子和气泡，并绘制到 Canvas）
  useEffect(() => {
    if (stage !== 'performing') return;

    const animate = () => {
      drawEffects();
      mainAnimationFrameRef.current = requestAnimationFrame(animate);
    };

    mainAnimationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (mainAnimationFrameRef.current) {
        cancelAnimationFrame(mainAnimationFrameRef.current);
        mainAnimationFrameRef.current = undefined;
      }
    };
  }, [stage, drawEffects]);

  // ✅ 下载视频功能（使用 useCallback 优化）
  const handleDownloadVideo = useCallback(() => {
    if (recordedChunksRef.current.length === 0) {
      console.warn('⚠️ 没有录制数据可下载');
      return;
    }
    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ 视频下载完成');
  }, []);

  // ✅ 格式化录制时间
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // ✅ 分享功能 - 改为只分享到抖音（参考 page-performance-stage.tsx）
  const handleShare = useCallback(() => {
    // 生成有网感的文案
    const emotionalTexts = [
      '要说晚安了吗？还是继续在音乐里沉沦',
      '跨年可以跨进你心里吗？反正我已经跨进音乐里了',
      '一秒钟的瞬间就已注定，我和这段旋律的相遇',
      '今晚的月亮不营业，我来营业',
      '慢慢来吧，反正来日方长',
      '人间烟火气，最抚凡人心，但音乐更懂我',
      '别慌，月亮也正在大海某处迷茫',
      '我贩卖黄昏，只为收集世间温柔',
      '落日余晖的路上，总有人在等你',
      '世界很大，幸好有音乐',
      '慢热的人真可怜，别人已经腻了，你才刚刚着迷',
      '想把所有的夜晚都给你，让你在我的梦里做主角',
      '我在贩卖日落，你像神明一样慷慨地将光撒向我',
      '温柔要有，但不是妥协，我们要在安静中，不慌不忙地坚强',
      '别否定自己，你特别好，特别温柔，特别值得'
    ];
    
    const randomText = emotionalTexts[Math.floor(Math.random() * emotionalTexts.length)];
    const hashtags = '#AI音乐创作 #即兴演奏 #音乐治愈 #深夜emo';
    const shareText = `${randomText} ${hashtags}`;
    
    // 复制到剪贴板
    navigator.clipboard.writeText(shareText).then(() => {
      // 提示用户
      alert('文案已复制！\n\n请打开抖音APP，粘贴文案并上传你的表演视频 🎵');
    }).catch(() => {
      alert('复制失败，请手动复制文案');
    });
  }, []);

  // ✅ 开始录制功能（使用 useCallback 优化）
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      console.warn('⚠️ 无法开始录制：摄像头流不存在');
      return;
    }

    setIsRecording(true);
    setRecordingTime(0);
    recordedChunksRef.current = [];

    try {
      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("✅ 录制结束，生成 Blob");
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        // ✅ 冻结分数和连击（使用 ref 获取最新值，避免闭包问题）
        setFinalScore(scoreRef.current);
        setFinalCombo(comboRef.current);
        console.log('📊 冻结分数:', { score: scoreRef.current, combo: comboRef.current });
        
        // ✅ 关闭摄像头
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('🛑 摄像头轨道已停止:', track.kind);
          });
          streamRef.current = null;
        }
        
        // ✅ 停止 MediaPipe 手势识别
        if (cameraRef.current) {
          try {
            cameraRef.current.stop();
            cameraRef.current = null;
            console.log('🛑 MediaPipe Camera 已停止');
          } catch (error) {
            console.warn('⚠️ 停止 MediaPipe Camera 失败:', error);
          }
        }
        
        if (handsRef.current) {
          try {
            handsRef.current.close();
            handsRef.current = null;
            console.log('🛑 MediaPipe Hands 已关闭');
          } catch (error) {
            console.warn('⚠️ 关闭 MediaPipe Hands 失败:', error);
          }
        }
        
        // ✅ 停止所有动画循环
        if (syncLoopRef.current) {
          cancelAnimationFrame(syncLoopRef.current);
          syncLoopRef.current = undefined;
        }
        if (mainAnimationFrameRef.current) {
          cancelAnimationFrame(mainAnimationFrameRef.current);
          mainAnimationFrameRef.current = undefined;
        }
        if (gestureIntervalRef.current) {
          clearInterval(gestureIntervalRef.current);
          gestureIntervalRef.current = undefined;
        }
        
        // ✅ 显示分享弹窗，而不是自动下载
        setShowShareModal(true);
      };

      mediaRecorder.start(1000); // 每 1 秒收集一次数据
      mediaRecorderRef.current = mediaRecorder;

      // 计时器
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('🎬 开始录制用户表演');
    } catch (error) {
      console.error('❌ 录制启动失败:', error);
      setIsRecording(false);
    }
  }, [handleDownloadVideo]);

  // ✅ 停止录制功能（使用 useCallback 优化）
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        // ✅ 先冻结分数（使用 ref 获取最新值）
        setFinalScore(scoreRef.current);
        setFinalCombo(comboRef.current);
        console.log('📊 停止录制时冻结分数:', { score: scoreRef.current, combo: comboRef.current });
        
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        console.log('🛑 停止录制');
        // ✅ 停止录制后，onstop 回调会自动处理摄像头关闭和显示分享弹窗
      } catch (error) {
        console.error('❌ 停止录制失败:', error);
        setIsRecording(false);
        // ✅ 即使出错也要冻结分数和关闭摄像头（使用 ref 获取最新值）
        setFinalScore(scoreRef.current);
        setFinalCombo(comboRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (recordedChunksRef.current.length > 0) {
          setShowShareModal(true);
        }
      }
    } else {
      console.warn('⚠️ MediaRecorder 不存在或已停止');
      // ✅ 即使 MediaRecorder 状态异常，也冻结分数、关闭摄像头并显示分享弹窗（使用 ref 获取最新值）
      setFinalScore(scoreRef.current);
      setFinalCombo(comboRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (recordedChunksRef.current.length > 0) {
        setShowShareModal(true);
      }
    }
  }, [score, combo]);
  // 基于视频时间轴同步动作提示（使用 requestAnimationFrame 高频同步检查）
  useEffect(() => {
    if (stage !== 'performing' || !originalVideoRef.current) return;

    const video = originalVideoRef.current;
    
    // 使用 Ref 存储脚本，避免闭包陷阱
    const syncLoop = () => {
      // 从 Ref 读取最新数据
      const actionScript = scriptRef.current;
      if (!actionScript || actionScript.length === 0) {
        syncLoopRef.current = requestAnimationFrame(syncLoop);
        return;
      }

      if (!video || video.paused) {
        syncLoopRef.current = requestAnimationFrame(syncLoop);
        return;
      }

      const currentTime = video.currentTime;

      // 🔍 强制校对单位：检查时间单位是否一致
      const firstAction = actionScript[0];
      if (firstAction) {
        const firstActionTime = parseTimestampToSeconds(firstAction.timestamp);
        const now = Date.now();
        if (now - lastDebugTimeRef.current >= 1000) {
          console.log('🔍 Sync Check:', {
            videoCurrentTime: currentTime.toFixed(3),
            firstActionTimestamp: firstAction.timestamp,
            firstActionTimeParsed: firstActionTime.toFixed(3),
            timeDiff: Math.abs(currentTime - firstActionTime).toFixed(3),
            unitCheck: currentTime < 100 && firstActionTime < 100 ? '✅ 都是秒' : '⚠️ 可能单位不一致'
          });
          lastDebugTimeRef.current = now;
        }
      }

      // Debug: 每秒打印一次当前视频时间
      const now = Date.now();
      if (now - lastDebugTimeRef.current >= 1000) {
        console.log('🎬 syncLoop - 当前视频时间:', currentTime.toFixed(2), 's');
        lastDebugTimeRef.current = now;
      }

      // 遍历动作脚本，检查是否有需要显示的动作
      actionScript.forEach((action: ActionItem, index: number) => {
        // 使用下标防止重复触发
        if (processedIndicesRef.current.has(index)) return;

        const actionTime = parseTimestampToSeconds(action.timestamp);

        // ✅ 放宽触发条件：currentTime >= actionTime（已到达或超过时间点）
        // 配合 processedIndicesRef 确保每个动作只触发一次
        if (currentTime >= actionTime) {
          processedIndicesRef.current.add(index);
          processedActionsRef.current.add(action.id);

          // 获取视觉配置
          const config = ACTION_TAG_CONFIG[action.action_tag] || DEFAULT_CONFIG;

          // ✅ 修复 ID 冲突：使用 Date.now() + Math.random() 生成唯一 ID
          const uniqueId = Date.now() + Math.random();
          
          // ✅ 确保状态累加：使用函数式更新，防止在高速循环中丢失数据
          setActionHints(prev => {
            // 检查是否已存在（防止重复添加，基于 action.id 而非 uniqueId）
            const exists = prev.some(h => {
              // 通过 action_tag 和 timestamp 判断是否为同一动作
              return h.action_tag === action.action_tag && 
                     Math.abs(h.timestamp - actionTime) < 0.1;
            });
            if (exists) {
              console.warn('⚠️ 动作已存在，跳过:', {
                actionId: action.id,
                action_tag: action.action_tag,
                timestamp: actionTime
              });
              return prev;
            }
            return [...prev, {
              id: uniqueId, // 使用唯一 ID 防止 React 键值冲突
              action_tag: action.action_tag,
              description: action.description,
              timestamp: actionTime, // 使用视频时间戳
              color: config.color,
              icon: config.icon
            }];
          });

          // ✅ 增强 Debug：保留触发动作时的日志
          console.log('✅ 触发动作:', {
            index,
            actionId: action.id,
            uniqueId: uniqueId,
            action_tag: action.action_tag,
            timestamp: action.timestamp,
            timestampParsed: actionTime.toFixed(3),
            currentTime: currentTime.toFixed(3),
            timeDiff: (currentTime - actionTime).toFixed(3),
            config: {
              icon: config.icon,
              color: config.color
            }
          });

          // 如果是节奏点，生成音符气泡（数据驱动，精确卡点）
          if (action.rhythm_point) {
            const bubbleConfig = ACTION_TAG_CONFIG[action.action_tag] || DEFAULT_CONFIG;
            
            // 使用 action.id 的奇偶性来决定左右，确保一致性
            const isLeft = action.id % 2 === 0;
            
            // 计算气泡速度，确保 rhythm_point 准确经过判定线
            const JUDGE_LINE_Y = window.innerHeight * 0.2;
            const BUBBLE_START_Y = -50;
            const DISTANCE_TO_JUDGE_LINE = JUDGE_LINE_Y - BUBBLE_START_Y;
            
            // 计算从当前时间到 rhythm_point 时间的时间差
            const timeUntilRhythmPoint = actionTime - currentTime;
            
            // 提前 0.5 秒到 5 秒内生成气泡
            if (timeUntilRhythmPoint >= -0.5 && timeUntilRhythmPoint <= 5) {
              const actualTimeUntil = Math.max(0.1, timeUntilRhythmPoint);
              
              // 计算气泡速度
              const speedPerSecond = DISTANCE_TO_JUDGE_LINE / actualTimeUntil;
              const speedPerFrame = speedPerSecond / 60;
              
              // 限制速度范围
              const minSpeed = 0.5;
              const maxSpeed = 8.0;
              const clampedSpeed = Math.max(minSpeed, Math.min(maxSpeed, speedPerFrame));
              
              // ✅ 修复 ID 冲突：使用 Date.now() + Math.random() 生成唯一 ID
              const bubbleUniqueId = Date.now() + Math.random();
              
              const newBubble: NoteBubble = {
                id: bubbleUniqueId,
                y: BUBBLE_START_Y,
                speed: clampedSpeed,
                size: 30 + action.intensity * 3,
                opacity: 0.5 + (action.intensity / 10) * 0.3,
                delay: 0,
                color: bubbleConfig.bubbleColor,
                targetTime: actionTime
              };
              
              console.log('🎈 生成音符气泡:', {
                action_tag: action.action_tag,
                timeUntilRhythmPoint: timeUntilRhythmPoint.toFixed(2),
                speed: clampedSpeed.toFixed(2),
                size: newBubble.size,
                isLeft
              });
              
              // ✅ 性能优化：直接更新 ref
              if (isLeft) {
                leftBubblesRef.current = [...leftBubblesRef.current, newBubble];
              } else {
                rightBubblesRef.current = [...rightBubblesRef.current, newBubble];
              }
            }
          }
        }
      });

      // 继续循环
      syncLoopRef.current = requestAnimationFrame(syncLoop);
    };

    // 启动同步循环
    console.log('🚀 启动 syncLoop，使用 requestAnimationFrame 高频同步检查');
    syncLoopRef.current = requestAnimationFrame(syncLoop);

    return () => {
      if (syncLoopRef.current) {
        cancelAnimationFrame(syncLoopRef.current);
        syncLoopRef.current = undefined;
      }
      // 清理已处理的下标记录
      processedIndicesRef.current.clear();
    };
  }, [stage]);

  // 清理过期的动作提示（基于视频时间）
  useEffect(() => {
    if (stage !== 'performing' || !originalVideoRef.current) return;

    const cleanup = () => {
      const video = originalVideoRef.current;
      if (!video) return;
      
      const currentTime = video.currentTime;
      // 移除 8 秒前的动作提示
      setActionHints(prev => prev.filter(hint => currentTime - hint.timestamp < 8));
    };

    const video = originalVideoRef.current;
    video.addEventListener('timeupdate', cleanup);

    return () => {
      video.removeEventListener('timeupdate', cleanup);
    };
  }, [stage]);

  // 基于 action_script 的手势检测（数据驱动）
  const startGestureDetection = () => {
    if (!videoAnalysisState.analysisResult || !audioRef.current) return;

    const actionScript = videoAnalysisState.analysisResult;
    
    // 基于音频时间检查动作，触发手势效果
    const checkGestures = () => {
      const currentTime = audioRef.current?.currentTime || 0;

      actionScript.forEach((action: ActionItem) => {
        const actionTime = parseTimestampToSeconds(action.timestamp);
        const timeDiff = currentTime - actionTime;

        // ✅ 放宽触发窗口：从0.2秒扩大到0.5秒，更容易触发
        if (timeDiff >= 0 && timeDiff <= 0.5 && !processedActionsRef.current.has(action.id + 10000)) {
          processedActionsRef.current.add(action.id + 10000);
          triggerGesture(action);
        }
      });
    };

    // 每 50ms 检查一次
    gestureIntervalRef.current = window.setInterval(checkGestures, 50);
  };


  // ✅ 已移除：粒子更新逻辑已合并到统一的 drawEffects 函数中

  // 处理开始按钮
  const handleStart = () => {
    if (cameraPermission !== 'granted') {
      alert('请先允许摄像头权限才能开始表演');
      return;
    }
    setStage('countdown');
  };

  // 重试摄像头
  const handleRetryCamera = async () => {
    setCameraPermission('pending');
    setCameraError('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraPermission('granted');
    } catch (error) {
      console.error('摄像头访问失败:', error);
      setCameraPermission('denied');
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头');
        } else if (error.name === 'NotFoundError') {
          setCameraError('未检测到摄像头设备');
        } else {
          setCameraError('摄像头启动失败，请刷新页面重试');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden font-['Inter',sans-serif]">
      {/* 隐藏的音频标签 */}
      {videoAnalysisState.videoUrl && (
        <audio
          ref={audioRef}
          src={videoAnalysisState.videoUrl}
          preload="auto"
          className="hidden"
          onEnded={() => {
            console.log('音频播放结束');
            // 可以在这里添加播放结束的处理逻辑
          }}
          onError={(e) => {
            console.error('音频加载错误:', e);
          }}
        />
      )}

      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* 返回按钮 */}
      <Link 
        to="/creation-setup" 
        className="absolute top-8 left-8 z-50 w-12 h-12 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
      >
        <i className="ri-arrow-left-line text-xl text-white/80"></i>
      </Link>

      {/* 教程阶段 */}
      {stage === 'tutorial' && (
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <div className="max-w-2xl w-full">
            {/* 摄像头预览 */}
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-8 border-2 border-white/10">
              {cameraPermission === 'granted' && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}

              {cameraPermission === 'pending' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                  <div className="text-center px-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center animate-pulse">
                      <i className="ri-camera-line text-4xl text-white"></i>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">正在请求摄像头权限</h3>
                    <p className="text-sm text-white/60">请在浏览器弹窗中允许访问摄像头</p>
                  </div>
                </div>
              )}

              {cameraPermission === 'denied' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                  <div className="text-center px-8 max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center">
                      <i className="ri-camera-off-line text-4xl text-white"></i>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">摄像头访问失败</h3>
                    <p className="text-sm text-white/70 mb-6">{cameraError}</p>
                    <button
                      onClick={handleRetryCamera}
                      className="px-6 py-3 bg-white/90 text-black rounded-full font-medium hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-refresh-line mr-2"></i>
                      重新尝试
                    </button>
                  </div>
                </div>
              )}

              {cameraPermission === 'granted' && (
                <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-white/80 font-medium">摄像头已激活</span>
                </div>
              )}
            </div>

            {/* 教程说明 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">即兴演奏技能</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20 flex items-center justify-center border border-cyan-400/30">
                    <span className="text-3xl">👋</span>
                  </div>
                  <p className="text-sm font-medium text-white mb-1">挥手</p>
                  <p className="text-xs text-white/60">触发电音采样</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center border border-purple-400/30">
                    <span className="text-3xl">👏</span>
                  </div>
                  <p className="text-sm font-medium text-white mb-1">拍手</p>
                  <p className="text-xs text-white/60">节奏打击音</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-400/20 flex items-center justify-center border border-teal-400/30">
                    <span className="text-3xl">🔄</span>
                  </div>
                  <p className="text-sm font-medium text-white mb-1">旋转</p>
                  <p className="text-xs text-white/60">音高变化</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-2xl p-4 border border-yellow-400/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <i className="ri-lightbulb-flash-line text-yellow-400"></i>
                  </div>
                  <div>
                    <p className="text-sm text-yellow-400/90 font-medium mb-1">提示</p>
                    <p className="text-xs text-white/70 leading-relaxed">
                      你的手势会自动与原曲节奏同步，随意发挥即可创造独特音效！屏幕两侧是音效触发区域，手部进入不同高度会触发不同音符。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 开始按钮 */}
            <button
              onClick={handleStart}
              disabled={cameraPermission !== 'granted'}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 whitespace-nowrap cursor-pointer ${
                cameraPermission !== 'granted'
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-white/90 text-black hover:bg-white hover:scale-[1.02] shadow-[0_8px_32px_rgba(255,255,255,0.1)]'
              }`}
            >
              {cameraPermission !== 'granted' ? (
                <>
                  <i className="ri-camera-line mr-2"></i>
                  等待摄像头授权...
                </>
              ) : (
                <>
                  <i className="ri-play-circle-fill mr-2"></i>
                  准备好了，开始！
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 倒计时阶段 */}
      {stage === 'countdown' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-[200px] font-black text-white animate-pulse leading-none">
              {countdown}
            </div>
            <p className="text-2xl text-white/60 mt-4">准备开始...</p>
          </div>
        </div>
      )}

      {/* 表演阶段 */}
      {stage === 'performing' && (
        <>
          {/* 顶部动作提示流 */}
          <div className="absolute top-0 left-0 right-0 h-32 z-30 overflow-hidden">
            <div className="relative h-full">
              {/* 中央引导线 */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 via-yellow-400 to-transparent" />
              
              {/* 动作卡片流 - 精确对齐：基于视频时间计算进度 */}
              {actionHints.length > 0 && (
                <div className="absolute inset-0" style={{ zIndex: 100 }}>
                  {actionHints.map((hint, index) => {
                    // 使用视频时间而非 Date.now() 计算进度
                    const video = originalVideoRef.current;
                    const currentVideoTime = video?.currentTime || 0;
                    const elapsed = Math.max(0, currentVideoTime - hint.timestamp); // 基于视频时间差
                    // ✅ 检查动画时长：确保分母至少为2秒以上（当前为8秒，满足要求）
                    const ANIMATION_DURATION = 8; // 8秒动画时长
                    const progress = elapsed / ANIMATION_DURATION;
                    const x = window.innerWidth - (progress * (window.innerWidth + 200));
                    const opacity = progress > 0.8 ? (1 - (progress - 0.8) / 0.2) : 1;
                    
                    return (
                      <div
                        key={hint.id}
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{
                          left: `${x}px`,
                          opacity: opacity,
                          zIndex: 1
                        }}
                      >
                        <div className={`bg-gradient-to-r ${hint.color} rounded-2xl px-6 py-3 shadow-lg border border-white/20 flex items-center gap-3`}>
                          <span className="text-3xl">{hint.icon}</span>
                          <span className="text-white font-bold text-lg whitespace-nowrap">{hint.description}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 分数显示 */}
          <div className="absolute top-8 right-8 z-40 text-right">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
              <div className="text-4xl font-black text-white mb-1">{score}</div>
              <div className="text-sm text-white/60">分数</div>
              {combo > 0 && (
                <div className="mt-2 text-2xl font-bold text-yellow-400">
                  {combo}x 连击
                </div>
              )}
            </div>
          </div>

          {/* ✅ 性能优化：气泡和粒子现在通过 Canvas 统一绘制，不再使用 DOM 元素 */}
          {/* 保留波浪线背景（静态 SVG，不影响性能） */}
          <div className="absolute left-8 top-0 bottom-0 w-24 z-20 pointer-events-none">
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 1000">
              <path
                d="M 50 0 Q 20 100 50 200 T 50 400 T 50 600 T 50 800 T 50 1000"
                stroke="url(#leftGradient)"
                strokeWidth="2"
                fill="none"
              />
              <defs>
                <linearGradient id="leftGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="absolute right-8 top-0 bottom-0 w-24 z-20 pointer-events-none">
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 1000">
              <path
                d="M 50 0 Q 80 100 50 200 T 50 400 T 50 600 T 50 800 T 50 1000"
                stroke="url(#rightGradient)"
                strokeWidth="2"
                fill="none"
              />
              <defs>
                <linearGradient id="rightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0" />
                  <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* 主舞台区域 */}
          <div className="relative z-10 flex items-center justify-center min-h-screen gap-8 px-32">
            {/* 左侧：原视频 */}
            <div className="relative w-[400px] h-[600px] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
              {videoAnalysisState.videoUrl ? (
                <>
                  <video
                    ref={originalVideoRef}
                    src={videoAnalysisState.videoUrl}
                    muted
                    playsInline
                    autoPlay
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ zIndex: 1 }}
                    onLoadedMetadata={() => {
                      console.log('✅ 左侧视频元数据加载完成', videoAnalysisState.videoUrl);
                      if (originalVideoRef.current) {
                        console.log('🎬 originalVideoRef 已赋值，准备播放');
                        originalVideoRef.current.play().catch(err => {
                          console.error('❌ 左侧视频自动播放失败:', err);
                        });
                      }
                    }}
                    onPlay={() => {
                      console.log('▶️ 左侧视频开始播放');
                    }}
                    onError={(e) => {
                      console.error('❌ 左侧视频加载错误:', e);
                      console.error('视频 URL:', videoAnalysisState.videoUrl);
                    }}
                  />
                  {/* 视频标签 */}
                  <div className="absolute top-4 left-4 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 z-20">
                    <span className="text-sm text-white/80 font-medium">原视频</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center z-0">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center">
                      <i className="ri-video-line text-4xl text-white"></i>
                    </div>
                    <p className="text-white/60 text-sm">原视频播放区域</p>
                    <p className="text-white/40 text-xs mt-2">（未找到视频文件）</p>
                    <p className="text-white/30 text-xs mt-2">videoUrl: {videoAnalysisState.videoUrl || 'null'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：用户摄像头 */}
            <div className="relative w-[400px] h-[600px] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
              {cameraPermission === 'granted' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  onLoadedMetadata={() => {
                    console.log('摄像头视频元数据加载完成');
                  }}
                  onPlay={() => {
                    console.log('摄像头视频开始播放');
                  }}
                />
              ) : cameraPermission === 'denied' ? (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center">
                      <i className="ri-camera-off-line text-4xl text-white"></i>
                    </div>
                    <p className="text-white/60 text-sm mb-2">摄像头未授权</p>
                    <p className="text-white/40 text-xs">{cameraError}</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center animate-pulse">
                      <i className="ri-loader-4-line text-4xl text-white animate-spin"></i>
                    </div>
                    <p className="text-white/60 text-sm">正在初始化摄像头...</p>
                  </div>
                </div>
              )}

              {/* 手势检测指示 */}
              {handDetected && (
                <div className="absolute inset-0 border-4 border-green-400 rounded-3xl animate-pulse" />
              )}

              {/* 2. Canvas (必须放在 Video 之上，且同样需要镜像以匹配手的位置) */}
              <canvas
                ref={canvasRef}
                width={1280}  // 设置为摄像头分辨率
                height={720}
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
              />

              {/* ✅ 性能优化：新增统一的特效 Canvas（绘制粒子和气泡） */}
              <canvas
                ref={effectsCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 10 }}
              />

              {/* 用户标签 */}
              <div className="absolute top-4 left-4 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <span className="text-sm text-white/80 font-medium">你的表演</span>
              </div>
            </div>
          </div>
        </>
      )}
      {/* 录制控制按钮 - 仅在录制时显示 */}
      {isRecording && stage === 'performing' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
          <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-bold text-lg">{formatTime(recordingTime)}</span>
          </div>
          
          <button
            onClick={handleStopRecording}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-lg transition-colors cursor-pointer whitespace-nowrap shadow-lg flex items-center"
          >
            <i className="ri-stop-circle-line mr-2"></i>
            停止录制
          </button>
        </div>
      )}

      {/* 分享弹窗 */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-white/10 max-w-lg w-full">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                <i className="ri-check-line text-4xl text-white"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">录制完成！</h2>
              <p className="text-white/70 text-sm">你的精彩表演已保存</p>
            </div>

            {/* 成绩展示 - 使用冻结的最终分数 */}
            <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-white mb-1">{finalScore}</div>
                  <div className="text-sm text-white/60">总分</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-yellow-400 mb-1">{finalCombo}</div>
                  <div className="text-sm text-white/60">最高连击</div>
                </div>
              </div>
            </div>

            {/* 分享到抖音 */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleShare}
                className="w-full py-4 bg-gradient-to-r from-[#FF0050] to-[#00F2EA] hover:from-[#E6004A] hover:to-[#00DAD4] text-white rounded-2xl font-bold text-lg transition-all cursor-pointer whitespace-nowrap shadow-lg flex items-center justify-center gap-3"
              >
                <i className="ri-music-2-fill text-2xl"></i>
                <span>分享到抖音</span>
              </button>
              
              <p className="text-xs text-white/50 text-center leading-relaxed">
                点击后将自动复制文案，打开抖音APP粘贴并上传视频即可
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleDownloadVideo}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap border border-white/20"
              >
                <i className="ri-download-line mr-2"></i>
                下载视频
              </button>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  // 可以选择返回首页或重新开始
                  window.location.href = '/';
                }}
                className="flex-1 py-3 bg-white/90 hover:bg-white text-black rounded-full font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        /* ✅ 粒子特效动画 */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.3) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}