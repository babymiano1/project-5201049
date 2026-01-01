import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoAnalysis } from '../../contexts/VideoAnalysisContext';

export default function Home() {
  const navigate = useNavigate();
  const { setVideoFile } = useVideoAnalysis();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const exampleVideos = [
    {
      id: 1,
      title: '节奏手势舞+电音钢琴',
      thumbnail: 'https://readdy.ai/api/search-image?query=A%20minimalist%20abstract%20blob%20shape%20with%20soft%20pastel%20gradient%20colors%20from%20yellow%20to%20pink%20to%20purple%2C%20floating%20on%20pure%20black%20background%2C%20smooth%20rounded%20organic%20form%2C%20gentle%20glow%20effect%2C%20modern%20minimalist%20aesthetic%2C%20clean%20composition%2C%20high%20quality%20digital%20art&width=280&height=420&seq=example1v2&orientation=portrait',
      duration: '0:45',
      actions: 15,
      notes: 12
    },
    {
      id: 2,
      title: '卡点短剧+爵士鼓',
      thumbnail: 'https://readdy.ai/api/search-image?query=A%20minimalist%20abstract%20blob%20shape%20with%20soft%20pastel%20gradient%20colors%20from%20cyan%20to%20blue%20to%20purple%2C%20floating%20on%20pure%20black%20background%2C%20smooth%20rounded%20organic%20form%2C%20gentle%20glow%20effect%2C%20modern%20minimalist%20aesthetic%2C%20clean%20composition%2C%20high%20quality%20digital%20art&width=280&height=420&seq=example2v2&orientation=portrait',
      duration: '1:20',
      actions: 22,
      notes: 18
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 保存视频文件到全局状态
      setVideoFile(file);
      
      setIsUploading(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate('/ai-parsing');
          }, 500);
        }
      }, 200);
    }
  };

  const handleExampleClick = (videoId: number) => {
    navigate('/ai-parsing', { state: { exampleId: videoId } });
  };

  return (
    <div className="min-h-screen bg-black font-['SF_Pro_Display',system-ui,-apple-system,sans-serif]">
      {/* Header */}
      <div className="px-6 pt-16 pb-12">
        <div className="text-center mb-3">
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">
            AI 二创引擎
          </h1>
          <p className="text-xl text-white/60 font-medium">
            手势舞 + 手势弹琴 同步创作
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-20 max-w-2xl mx-auto">
        {/* Upload Section */}
        <div className="mb-16">
          <div className="relative bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-2xl rounded-[32px] p-10 overflow-hidden border border-white/10">
            {/* Soft glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400/20 to-cyan-400/20 flex items-center justify-center backdrop-blur-xl border border-white/10">
                  <i className="ri-upload-cloud-2-line text-5xl text-white/90"></i>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white text-center mb-3">
                上传手势舞/音乐类视频
              </h3>
              <p className="text-base text-white/50 text-center mb-8 max-w-md mx-auto leading-relaxed">
                上传后，AI将同步解析动作指令+音乐音轨<br/>生成"手势+音效"双轨创作任务
              </p>

              {!isUploading ? (
                <label className="block">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-full py-5 bg-white/90 text-black font-bold text-lg rounded-full text-center cursor-pointer hover:bg-white transition-all hover:scale-[1.02] whitespace-nowrap shadow-[0_8px_32px_rgba(255,255,255,0.1)]">
                    选择视频文件
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/80 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-white/60 text-base">
                    上传中... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Example Videos */}
        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-bold text-white">示例视频</h2>
            <span className="text-sm text-white/40">点击直接进入解析</span>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {exampleVideos.map((video) => (
              <button
                key={video.id}
                onClick={() => handleExampleClick(video.id)}
                className="group relative bg-white/5 backdrop-blur-sm rounded-[28px] overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer hover:scale-[1.02]"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[2/3] overflow-hidden rounded-t-[28px]">
                  <div className="w-full h-full">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                      <i className="ri-play-fill text-3xl text-black ml-1"></i>
                    </div>
                  </div>

                  {/* Duration badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10">
                    <span className="text-xs text-white/90 font-semibold">{video.duration}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-base font-semibold text-white mb-3 line-clamp-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                      <i className="ri-hand-heart-line text-base"></i>
                      {video.actions}动作
                    </span>
                    <span className="flex items-center gap-1.5">
                      <i className="ri-music-2-line text-base"></i>
                      {video.notes}音符
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400/10 to-cyan-400/5 flex items-center justify-center mx-auto mb-3 border border-cyan-400/10">
              <i className="ri-hand-heart-line text-2xl text-cyan-400/80"></i>
            </div>
            <p className="text-sm text-white/50 font-medium">手势舞识别</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400/10 to-purple-400/5 flex items-center justify-center mx-auto mb-3 border border-purple-400/10">
              <i className="ri-music-2-line text-2xl text-purple-400/80"></i>
            </div>
            <p className="text-sm text-white/50 font-medium">音轨同步</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400/10 to-pink-400/5 flex items-center justify-center mx-auto mb-3 border border-pink-400/10">
              <i className="ri-magic-line text-2xl text-pink-400/80"></i>
            </div>
            <p className="text-sm text-white/50 font-medium">AI 二创</p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
