import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreationSetup() {
  const navigate = useNavigate();
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);

  const avatars = [
    { 
      id: 1, 
      icon: '🐱🐶🐼', 
      name: '像素动物', 
      color: 'from-purple-400 to-pink-400',
      description: '灵动可爱，多种动物形象可选'
    },
    { 
      id: 2, 
      icon: '😎', 
      name: '3D Emoji人', 
      color: 'from-cyan-400 to-blue-400',
      description: '酷炫时尚，适合街舞风格'
    },
    { 
      id: 3, 
      icon: '✨', 
      name: '粒子态', 
      color: 'from-yellow-400 to-orange-400',
      description: '梦幻流动，适合电音氛围'
    },
    { 
      id: 4, 
      icon: '🦄', 
      name: '独角兽', 
      color: 'from-pink-400 to-purple-400',
      description: '梦幻优雅，适合柔和旋律'
    },
    { 
      id: 5, 
      icon: '🤖', 
      name: '赛博机器人', 
      color: 'from-green-400 to-cyan-400',
      description: '科技未来，适合电子音乐'
    },
    { 
      id: 6, 
      icon: '👤', 
      name: '真人', 
      color: 'from-orange-400 to-red-400',
      description: '真实自我，展现个人魅力'
    },
  ];

  const handleNext = () => {
    navigate('/creator-lounge');
  };

  const canProceed = () => {
    return selectedAvatar !== null;
  };

  return (
    <div className="min-h-screen bg-black font-['Inter',sans-serif]">
      {/* Header */}
      <div className="px-6 pt-16 pb-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            选择你的虚拟形象
          </h1>
          <p className="text-lg text-white/50 font-medium">
            Step 2/3
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-12">
        <div className="max-w-2xl mx-auto">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/80 transition-all duration-500 rounded-full"
              style={{ width: '66%' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-20 max-w-2xl mx-auto">
        
        {/* Avatar Selection */}
        <div className="space-y-6">
          <div className="space-y-4">
            {avatars.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`w-full relative bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[28px] p-8 border transition-all duration-300 cursor-pointer ${
                  selectedAvatar === avatar.id
                    ? 'border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.1)] scale-[1.02]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Soft glow effect */}
                {selectedAvatar === avatar.id && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
                )}
                
                <div className="relative z-10 flex items-center gap-6">
                  {/* Avatar Icon */}
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center text-5xl`}>
                    {avatar.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <h3 className="text-2xl font-bold text-white mb-2">{avatar.name}</h3>
                    <p className="text-base text-white/60">{avatar.description}</p>
                  </div>

                  {/* Check mark */}
                  {selectedAvatar === avatar.id && (
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <i className="ri-check-line text-2xl text-white"></i>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Magic Hint */}
          <div className="mt-8 p-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-xl rounded-[24px] border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                <i className="ri-magic-line text-2xl text-white"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white mb-2">✨ 已注入灵感</h4>
                <p className="text-sm text-white/70 leading-relaxed">
                  你的手势将实时触发电音采样，与原曲同步共鸣。挥手、拍手、旋转...每个动作都会产生独特的音效和粒子特效，让你成为真正的音乐创作者！
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-12 flex items-center gap-4">
          <button
            onClick={() => navigate('/ai-parsing')}
            className="px-8 py-4 bg-white/5 text-white/60 font-semibold text-lg rounded-full hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer border border-white/10"
          >
            上一步
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex-1 py-5 font-bold text-lg rounded-full transition-all whitespace-nowrap ${
              canProceed()
                ? 'bg-white/90 text-black cursor-pointer hover:bg-white hover:scale-[1.02] shadow-[0_8px_32px_rgba(255,255,255,0.1)]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            开始表演
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
