import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AchievementCenter() {
  const [selectedTab, setSelectedTab] = useState<'stats' | 'videos' | 'badges'>('stats');

  const userStats = {
    rhythm: 85,
    creativity: 92,
    coordination: 78,
    accuracy: 88,
  };

  const videos = [
    { id: 1, title: '霓虹梦境表演', date: '2025-01-15', views: 12500, likes: 890, waveform: 'M0,50 Q25,20 50,50 T100,50', thumbnail: 'https://readdy.ai/api/search-image?query=A%20minimalist%20abstract%20blob%20shape%20with%20soft%20pastel%20gradient%20colors%20from%20purple%20to%20cyan%2C%20floating%20on%20pure%20black%20background%2C%20smooth%20rounded%20organic%20form%2C%20gentle%20glow%20effect%2C%20modern%20minimalist%20aesthetic%2C%20clean%20composition%2C%20high%20quality%20digital%20art&width=400&height=300&seq=vid1v2&orientation=landscape' },
    { id: 2, title: '电音波浪混音', date: '2025-01-14', views: 8900, likes: 654, waveform: 'M0,50 Q25,80 50,50 T100,50', thumbnail: 'https://readdy.ai/api/search-image?query=A%20minimalist%20abstract%20blob%20shape%20with%20soft%20pastel%20gradient%20colors%20from%20cyan%20to%20blue%2C%20floating%20on%20pure%20black%20background%2C%20smooth%20rounded%20organic%20form%2C%20gentle%20glow%20effect%2C%20modern%20minimalist%20aesthetic%2C%20clean%20composition%2C%20high%20quality%20digital%20art&width=400&height=300&seq=vid2v2&orientation=landscape' },
    { id: 3, title: '节奏大师挑战', date: '2025-01-13', views: 15200, likes: 1120, waveform: 'M0,50 Q25,30 50,70 T100,50', thumbnail: 'https://readdy.ai/api/search-image?query=A%20minimalist%20abstract%20blob%20shape%20with%20soft%20pastel%20gradient%20colors%20from%20yellow%20to%20orange%2C%20floating%20on%20pure%20black%20background%2C%20smooth%20rounded%20organic%20form%2C%20gentle%20glow%20effect%2C%20modern%20minimalist%20aesthetic%2C%20clean%20composition%2C%20high%20quality%20digital%20art&width=400&height=300&seq=vid3v2&orientation=landscape' },
    { id: 4, title: '合成波之旅', date: '2025-01-12', views: 10300, likes: 782, waveform: 'M0,50 Q25,40 50,60 T100,50', thumbnail: 'https://readdy.ai/api/search-image?query=A%20minimalist%20abstract%20blob%20shape%20with%20soft%20pastel%20gradient%20colors%20from%20pink%20to%20purple%2C%20floating%20on%20pure%20black%20background%2C%20smooth%20rounded%20organic%20form%2C%20gentle%20glow%20effect%2C%20modern%20minimalist%20aesthetic%2C%20clean%20composition%2C%20high%20quality%20digital%20art&width=400&height=300&seq=vid4v2&orientation=landscape' },
    { id: 5, title: '像素派对节拍', date: '2025-01-11', views: 9500, likes: 701, waveform: 'M0,50 Q25,60 50,40 T100,50', thumbnail: 'https://readdy.ai/api/search-image?query=A%20minimalist%20abstract%20blob%20shape%20with%20soft%20pastel%20gradient%20colors%20from%20green%20to%20cyan%2C%20floating%20on%20pure%20black%20background%2C%20smooth%20rounded%20organic%20form%2C%20gentle%20glow%20effect%2C%20modern%20minimalist%20aesthetic%2C%20clean%20composition%2C%20high%20quality%20digital%20art&width=400&height=300&seq=vid5v2&orientation=landscape' },
    { id: 6, title: '宇宙声波', date: '2025-01-10', views: 11800, likes: 945, waveform: 'M0,50 Q25,70 50,30 T100,50', thumbnail: 'https://readdy.ai/api/search-image?query=A%20minimalist%20abstract%20blob%20shape%20with%20soft%20pastel%20gradient%20colors%20from%20magenta%20to%20purple%2C%20floating%20on%20pure%20black%20background%2C%20smooth%20rounded%20organic%20form%2C%20gentle%20glow%20effect%2C%20modern%20minimalist%20aesthetic%2C%20clean%20composition%2C%20high%20quality%20digital%20art&width=400&height=300&seq=vid6v2&orientation=landscape' },
  ];

  const badges = [
    { id: 1, name: '节奏大师', icon: 'ri-music-fill', color: 'from-yellow-400 to-orange-400', unlocked: true, description: '连续100次完美击中' },
    { id: 2, name: '音波新手', icon: 'ri-sound-module-fill', color: 'from-cyan-400 to-blue-400', unlocked: true, description: '创建第一个视频' },
    { id: 3, name: '连击之王', icon: 'ri-fire-fill', color: 'from-red-400 to-pink-400', unlocked: true, description: '达到50连击' },
    { id: 4, name: '创意天才', icon: 'ri-lightbulb-flash-fill', color: 'from-purple-400 to-pink-400', unlocked: true, description: '一周内使用所有乐器' },
    { id: 5, name: '社交之星', icon: 'ri-share-fill', color: 'from-green-400 to-cyan-400', unlocked: true, description: '分享10个视频' },
    { id: 6, name: '完美主义者', icon: 'ri-star-fill', color: 'from-yellow-300 to-yellow-400', unlocked: false, description: '达到100%准确度' },
    { id: 7, name: '马拉松表演者', icon: 'ri-time-fill', color: 'from-indigo-400 to-purple-400', unlocked: false, description: '连续表演60分钟' },
    { id: 8, name: '病毒式传播', icon: 'ri-rocket-fill', color: 'from-orange-400 to-red-400', unlocked: false, description: '单个视频获得10万观看' },
  ];

  const maxStat = Math.max(...Object.values(userStats));
  const radarPoints = Object.values(userStats).map((value, index) => {
    const angle = (index * 2 * Math.PI) / 4 - Math.PI / 2;
    const radius = (value / 100) * 80;
    const x = 100 + radius * Math.cos(angle);
    const y = 100 + radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative min-h-screen bg-black font-['Inter',sans-serif]">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Top Navigation */}
      <div className="relative z-50 px-6 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <i className="ri-arrow-left-line text-xl text-white/80"></i>
          </Link>
          <h1 className="text-xl font-bold text-white">成就中心</h1>
          <Link to="/" className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
            <i className="ri-add-circle-line text-xl text-white/80"></i>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative z-40 px-6 py-6">
        <div className="flex items-center justify-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => setSelectedTab('stats')}
            className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap cursor-pointer ${
              selectedTab === 'stats'
                ? 'bg-white/90 text-black shadow-[0_8px_32px_rgba(255,255,255,0.1)]'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <i className="ri-bar-chart-fill mr-2"></i>
            数据统计
          </button>
          <button
            onClick={() => setSelectedTab('videos')}
            className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap cursor-pointer ${
              selectedTab === 'videos'
                ? 'bg-white/90 text-black shadow-[0_8px_32px_rgba(255,255,255,0.1)]'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <i className="ri-video-fill mr-2"></i>
            我的视频
          </button>
          <button
            onClick={() => setSelectedTab('badges')}
            className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap cursor-pointer ${
              selectedTab === 'badges'
                ? 'bg-white/90 text-black shadow-[0_8px_32px_rgba(255,255,255,0.1)]'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            <i className="ri-trophy-fill mr-2"></i>
            徽章
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-30 px-6 pb-12">
        
        {/* Stats Tab */}
        {selectedTab === 'stats' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Radar Chart */}
            <div className="bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[32px] border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">你的技能</h2>
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-80 h-80">
                  {/* Grid circles */}
                  {[20, 40, 60, 80].map((r) => (
                    <circle
                      key={r}
                      cx="100"
                      cy="100"
                      r={r}
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Grid lines */}
                  {['节奏', '创意', '协调', '准确'].map((_, index) => {
                    const angle = (index * 2 * Math.PI) / 4 - Math.PI / 2;
                    const x = 100 + 80 * Math.cos(angle);
                    const y = 100 + 80 * Math.sin(angle);
                    return (
                      <line
                        key={index}
                        x1="100"
                        y1="100"
                        x2={x}
                        y2={y}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                      />
                    );
                  })}
                  
                  {/* Data polygon */}
                  <polygon
                    points={radarPoints}
                    fill="rgba(34,211,238,0.2)"
                    stroke="rgb(34,211,238)"
                    strokeWidth="2"
                  />
                  
                  {/* Data points */}
                  {radarPoints.split(' ').map((point, index) => (
                    <circle
                      key={index}
                      cx={point.split(',')[0]}
                      cy={point.split(',')[1]}
                      r="4"
                      fill="rgb(34,211,238)"
                    />
                  ))}
                  
                  {/* Labels */}
                  <text x="100" y="15" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">节奏</text>
                  <text x="185" y="105" textAnchor="start" fill="white" fontSize="12" fontWeight="600">创意</text>
                  <text x="100" y="195" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">协调</text>
                  <text x="15" y="105" textAnchor="end" fill="white" fontSize="12" fontWeight="600">准确</text>
                </svg>
              </div>
              
              {/* Stats bars */}
              <div className="mt-8 space-y-4">
                {Object.entries(userStats).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    rhythm: '节奏',
                    creativity: '创意',
                    coordination: '协调',
                    accuracy: '准确'
                  };
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white">{labels[key]}</span>
                        <span className="text-sm font-bold text-cyan-400">{value}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-1000"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[24px] border border-white/10 p-6 text-center">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-400">156</div>
                <div className="text-sm text-white/50 mt-2">总视频数</div>
              </div>
              <div className="bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[24px] border border-white/10 p-6 text-center">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-400">2.4M</div>
                <div className="text-sm text-white/50 mt-2">总观看量</div>
              </div>
              <div className="bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[24px] border border-white/10 p-6 text-center">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-400">89K</div>
                <div className="text-sm text-white/50 mt-2">总点赞数</div>
              </div>
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {selectedTab === 'videos' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="group bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[24px] border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-purple-900/20 to-cyan-900/20 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                        <i className="ri-play-fill text-3xl text-white"></i>
                      </div>
                    </div>
                    
                    {/* Waveform overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent">
                      <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
                        <path
                          d={video.waveform}
                          fill="none"
                          stroke="rgba(34,211,238,0.6)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2">{video.title}</h3>
                    <div className="flex items-center justify-between text-sm text-white/50">
                      <span>{video.date}</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <i className="ri-eye-fill"></i>
                          {(video.views / 1000).toFixed(1)}K
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-heart-fill text-red-400"></i>
                          {video.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Share Button */}
            <div className="mt-12 flex justify-center">
              <button className="px-10 py-4 bg-white/90 text-black font-bold text-lg rounded-full hover:bg-white hover:scale-[1.02] transition-all duration-300 whitespace-nowrap cursor-pointer shadow-[0_8px_32px_rgba(255,255,255,0.1)]">
                <i className="ri-share-fill mr-2"></i>
                分享到抖音
              </button>
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {selectedTab === 'badges' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`relative bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[24px] border p-6 text-center transition-all duration-300 ${
                    badge.unlocked
                      ? 'border-white/20 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] cursor-pointer'
                      : 'border-white/5 opacity-40'
                  }`}
                >
                  {/* Badge icon */}
                  <div className={`relative mx-auto w-20 h-20 flex items-center justify-center rounded-full mb-4 ${
                    badge.unlocked ? `bg-gradient-to-br ${badge.color}` : 'bg-gray-700'
                  }`}>
                    <div className="w-16 h-16 flex items-center justify-center">
                      <i className={`${badge.icon} text-4xl text-white`}></i>
                    </div>
                    {!badge.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                        <i className="ri-lock-fill text-2xl text-white/60"></i>
                      </div>
                    )}
                  </div>
                  
                  {/* Badge name */}
                  <h3 className="text-sm font-bold text-white mb-2">{badge.name}</h3>
                  <p className="text-xs text-white/50">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
