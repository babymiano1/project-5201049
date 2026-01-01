
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

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
}

// 动作提示类型
interface ActionHint {
  id: number;
  icon: string;
  text: string;
  time: number;
  color: string;
}

// 音符气泡类型
interface NoteBubble {
  id: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  delay: number;
}

export default function PerformanceStage() {
  // 状态管理
  const [stage, setStage] = useState<'tutorial' | 'countdown' | 'performing'>('tutorial');
  const [countdown, setCountdown] = useState(3);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [cameraError, setCameraError] = useState<string>('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [actionHints, setActionHints] = useState<ActionHint[]>([]);
  const [leftBubbles, setLeftBubbles] = useState<NoteBubble[]>([]);
  const [rightBubbles, setRightBubbles] = useState<NoteBubble[]>([]);
  const [handDetected, setHandDetected] = useState(false);
  const [lastGestureTime, setLastGestureTime] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const particleIdRef = useRef(0);
  const actionIdRef = useRef(0);
  const bubbleIdRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const gestureIntervalRef = useRef<number>();

  // 初始化摄像头
  useEffect(() => {
    const initCamera = async () => {
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

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gestureIntervalRef.current) {
        clearInterval(gestureIntervalRef.current);
      }
    };
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (stage === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (stage === 'countdown' && countdown === 0) {
      setStage('performing');
      startPerformance();
    }
  }, [stage, countdown]);

  // 开始表演
  const startPerformance = () => {
    // 初始化音符气泡
    initBubbles();
    
    // 开始动作提示流
    startActionHints();
    
    // 开始手势检测模拟
    startGestureDetection();
  };

  // 初始化音符气泡
  const initBubbles = () => {
    const createBubbles = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: bubbleIdRef.current++,
        y: -100 - (i * 150),
        speed: 1 + Math.random() * 0.5,
        size: 40 + Math.random() * 20,
        opacity: 0.3 + Math.random() * 0.4,
        delay: i * 0.2
      }));
    };

    setLeftBubbles(createBubbles(10));
    setRightBubbles(createBubbles(10));
  };

  // 更新音符气泡位置
  useEffect(() => {
    if (stage !== 'performing') return;

    const updateBubbles = () => {
      setLeftBubbles(prev => prev.map(bubble => {
        let newY = bubble.y + bubble.speed;
        if (newY > window.innerHeight + 100) {
          newY = -100;
        }
        return { ...bubble, y: newY };
      }));

      setRightBubbles(prev => prev.map(bubble => {
        let newY = bubble.y + bubble.speed;
        if (newY > window.innerHeight + 100) {
          newY = -100;
        }
        return { ...bubble, y: newY };
      }));

      animationFrameRef.current = requestAnimationFrame(updateBubbles);
    };

    animationFrameRef.current = requestAnimationFrame(updateBubbles);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stage]);

  // 开始动作提示流
  const startActionHints = () => {
    const actions = [
      { icon: '👋', text: '挥手', color: 'from-cyan-400 to-blue-400' },
      { icon: '👏', text: '拍手', color: 'from-purple-400 to-pink-400' },
      { icon: '🔄', text: '转圈', color: 'from-teal-400 to-cyan-400' },
      { icon: '✌️', text: '比耶', color: 'from-pink-400 to-rose-400' },
      { icon: '👆', text: '指向上', color: 'from-blue-400 to-cyan-400' },
    ];

    let index = 0;
    const addHint = () => {
      const action = actions[index % actions.length];
      setActionHints(prev => [...prev, {
        id: actionIdRef.current++,
        ...action,
        time: Date.now()
      }]);
      index++;
    };

    // 初始添加几个
    addHint();
    setTimeout(addHint, 1500);
    setTimeout(addHint, 3000);

    // 定期添加新的
    const interval = setInterval(addHint, 2500);

    return () => clearInterval(interval);
  };

  // 清理过期的动作提示
  useEffect(() => {
    if (stage !== 'performing') return;

    const cleanup = setInterval(() => {
      const now = Date.now();
      setActionHints(prev => prev.filter(hint => now - hint.time < 8000));
    }, 1000);

    return () => clearInterval(cleanup);
  }, [stage]);

  // 模拟手势检测
  const startGestureDetection = () => {
    gestureIntervalRef.current = window.setInterval(() => {
      // 随机触发手势检测（模拟）
      if (Math.random() > 0.7) {
        triggerGesture();
      }
    }, 1500);
  };

  // 触发手势效果
  const triggerGesture = () => {
    const now = Date.now();
    if (now - lastGestureTime < 500) return; // 防止过于频繁
    
    setLastGestureTime(now);
    setHandDetected(true);
    setTimeout(() => setHandDetected(false), 300);

    // 增加分数和连击
    setScore(prev => prev + 100);
    setCombo(prev => prev + 1);

    // 生成粒子
    createParticles(200, 300);
  };

  // 创建粒子
  const createParticles = (x: number, y: number) => {
    const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 2 + Math.random() * 3;
      
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 60 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  };

  // 更新粒子
  useEffect(() => {
    if (stage !== 'performing') return;

    const updateParticles = () => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // 重力
            life: p.life + 1
          }))
          .filter(p => p.life < p.maxLife)
      );
    };

    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, [stage]);

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
              
              {/* 动作卡片流 */}
              {actionHints.map((hint, index) => {
                const elapsed = Date.now() - hint.time;
                const progress = elapsed / 8000;
                const x = window.innerWidth - (progress * (window.innerWidth + 200));
                
                return (
                  <div
                    key={hint.id}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{
                      left: `${x}px`,
                      opacity: progress > 0.8 ? (1 - (progress - 0.8) / 0.2) : 1
                    }}
                  >
                    <div className={`bg-gradient-to-r ${hint.color} rounded-2xl px-6 py-3 shadow-lg border border-white/20 flex items-center gap-3`}>
                      <span className="text-3xl">{hint.icon}</span>
                      <span className="text-white font-bold text-lg whitespace-nowrap">{hint.text}</span>
                    </div>
                  </div>
                );
              })}
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

          {/* 左侧音符气泡 */}
          <div className="absolute left-8 top-0 bottom-0 w-24 z-20 pointer-events-none">
            {/* 波浪线背景 */}
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

            {/* 气泡 */}
            {leftBubbles.map(bubble => (
              <div
                key={bubble.id}
                className="absolute left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                style={{
                  top: `${bubble.y}px`,
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  opacity: bubble.opacity
                }}
              />
            ))}
          </div>

          {/* 右侧音符气泡 */}
          <div className="absolute right-8 top-0 bottom-0 w-24 z-20 pointer-events-none">
            {/* 波浪线背景 */}
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

            {/* 气泡 */}
            {rightBubbles.map(bubble => (
              <div
                key={bubble.id}
                className="absolute left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 shadow-[0_0_30px_rgba(20,184,166,0.5)]"
                style={{
                  top: `${bubble.y}px`,
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  opacity: bubble.opacity
                }}
              />
            ))}
          </div>

          {/* 主舞台区域 */}
          <div className="relative z-10 flex items-center justify-center min-h-screen gap-8 px-32">
            {/* 左侧：原视频 */}
            <div className="relative w-[400px] h-[600px] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center">
                    <i className="ri-video-line text-4xl text-white"></i>
                  </div>
                  <p className="text-white/60 text-sm">原视频播放区域</p>
                  <p className="text-white/40 text-xs mt-2">（待接入真实视频）</p>
                </div>
              </div>
              
              {/* 视频标签 */}
              <div className="absolute top-4 left-4 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <span className="text-sm text-white/80 font-medium">原视频</span>
              </div>
            </div>

            {/* 右侧：用户摄像头 */}
            <div className="relative w-[400px] h-[600px] rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />

              {/* 手势检测指示 */}
              {handDetected && (
                <div className="absolute inset-0 border-4 border-green-400 rounded-3xl animate-pulse" />
              )}

              {/* 粒子层 */}
              <div className="absolute inset-0 pointer-events-none">
                {particles.map(particle => {
                  const opacity = 1 - (particle.life / particle.maxLife);
                  return (
                    <div
                      key={particle.id}
                      className="absolute rounded-full"
                      style={{
                        left: `${particle.x}px`,
                        top: `${particle.y}px`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        backgroundColor: particle.color,
                        opacity,
                        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                      }}
                    />
                  );
                })}
              </div>

              {/* 用户标签 */}
              <div className="absolute top-4 left-4 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <span className="text-sm text-white/80 font-medium">你的表演</span>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
