import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Play, Pause, Camera, XCircle, SkipBack, SkipForward, ChevronLeft, ChevronRight, FileVideo, Film, Link as LinkIcon, MousePointerClick } from 'lucide-react';
import { CapturedFrame } from '../types';

// Simple ID generator
const generateId = () => `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface VideoPlayerProps {
  onCapture: (frame: CapturedFrame) => void;
  seekToTimestamp: number | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ onCapture, seekToTimestamp }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // URL Input State
  const [inputUrl, setInputUrl] = useState('');

  // Handle external seek requests
  useEffect(() => {
    if (seekToTimestamp !== null && videoRef.current) {
      videoRef.current.currentTime = seekToTimestamp;
      setCurrentTime(seekToTimestamp);
    }
  }, [seekToTimestamp]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleUrlSubmit = () => {
    if (inputUrl.trim()) {
      setVideoSrc(inputUrl.trim());
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleExampleClick = () => {
    setInputUrl('http://vjs.zencdn.net/v/oceans.mp4');
  };

  const handleClearVideo = () => {
    if (videoSrc && videoSrc.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoSrc(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setInputUrl('');
  };

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const stepFrame = useCallback((frames: number) => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      // Assuming 30fps as a safe default for stepping (approx 33ms)
      videoRef.current.currentTime += frames * 0.033; 
    }
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          
          const newFrame: CapturedFrame = {
            id: generateId(),
            dataUrl,
            timestamp: video.currentTime,
            createdAt: Date.now(),
            width: video.videoWidth,
            height: video.videoHeight
          };
          
          onCapture(newFrame);
        } catch (e) {
          console.error("Screenshot failed (likely CORS issue):", e);
          alert("截图失败：无法捕获该视频源画面。如果是在线视频，请确保服务器支持跨域 (CORS)。");
        }
      }
    }
  }, [onCapture]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoSrc) return;
      
      // Only trigger if not typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepFrame(-1); // Step back 1 frame
          break;
        case 'ArrowRight':
          e.preventDefault();
          stepFrame(1); // Step forward 1 frame
          break;
        case 'j':
          stepFrame(-10); // Back 10 frames
          break;
        case 'l':
          stepFrame(10); // Forward 10 frames
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoSrc, togglePlay, stepFrame]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) URL.revokeObjectURL(videoSrc);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!videoSrc) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gray-950 p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

        <div 
          className={`relative z-10 w-full max-w-xl min-h-[340px] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-6 group cursor-pointer bg-gray-900/40 backdrop-blur-sm ${
            isHovering ? 'border-blue-500/50 bg-gray-900/60 shadow-2xl shadow-blue-500/10' : 'border-gray-800 hover:border-gray-700'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
          onDragLeave={() => setIsHovering(false)}
          onDrop={(e) => {
             e.preventDefault();
             setIsHovering(false);
             const file = e.dataTransfer.files?.[0];
             if (file && file.type.startsWith('video/')) {
               const url = URL.createObjectURL(file);
               setVideoSrc(url);
             }
          }}
        >
          <div className="relative mt-2">
             <div className={`absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 transition-opacity duration-500 ${isHovering ? 'opacity-40' : ''}`}></div>
             <div className="relative bg-gray-800 p-4 rounded-full shadow-xl border border-gray-700 group-hover:scale-110 transition-transform duration-300">
                <Upload className={`w-8 h-8 ${isHovering ? 'text-blue-400' : 'text-gray-400'}`} />
             </div>
          </div>
          
          <div className="text-center px-4">
             <h3 className="text-xl font-bold text-gray-200 tracking-tight">上传视频素材</h3>
             <p className="text-gray-500 text-xs mt-1">
               拖拽文件到此处，或点击下方按钮选择
             </p>
          </div>

          <label className="relative overflow-hidden group/btn bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 cursor-pointer text-sm tracking-wide">
            <span className="relative z-10 flex items-center gap-2">
              <FileVideo className="w-5 h-5" /> 选择本地视频文件
            </span>
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>

          {/* Divider */}
          <div className="flex items-center w-full max-w-[200px] gap-2 mt-1">
             <div className="h-px bg-gray-800 flex-1"></div>
             <span className="text-[10px] text-gray-500 font-bold">OR</span>
             <div className="h-px bg-gray-800 flex-1"></div>
          </div>

          {/* URL Input */}
          <div className="w-full max-w-sm px-4" onClick={(e) => e.stopPropagation()}>
             <div className="flex w-full gap-2 relative z-20">
                <div className="relative flex-1 group/input">
                   <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within/input:text-blue-500 transition-colors" />
                   <input 
                     type="text"
                     value={inputUrl}
                     onChange={(e) => setInputUrl(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                     placeholder="输入MP4网络地址..."
                     className="w-full bg-gray-950/50 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                   />
                </div>
                <button 
                  onClick={handleUrlSubmit}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-700 transition-colors whitespace-nowrap"
                >
                  加载
                </button>
             </div>
             <div className="text-center mt-3">
                <div 
                  onClick={handleExampleClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-gray-800/50 bg-gray-900/50 hover:bg-gray-800 hover:border-blue-500/30 cursor-pointer transition-all group/example"
                  title="点击自动填入此地址"
                >
                  <MousePointerClick className="w-3 h-3 text-gray-600 group-hover/example:text-blue-400" />
                  <p className="text-[10px] text-gray-500 font-mono group-hover/example:text-blue-300 select-none">
                    示例: http://vjs.zencdn.net/v/oceans.mp4
                  </p>
                </div>
             </div>
          </div>

        </div>
      </div>
    );
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col w-full h-full bg-black shadow-2xl overflow-hidden relative group">
      {/* Video Area: Flex-1 to consume available space, min-h-0 to allow shrinking */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          crossOrigin="anonymous" 
          className="max-h-full max-w-full w-auto h-auto object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <button 
          onClick={handleClearVideo}
          className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-600/80 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md z-10"
          title="移除视频"
        >
          <XCircle className="w-5 h-5" />
        </button>

        {/* Play/Pause Overlay when paused (optional visual cue) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/30 p-4 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
               <Play className="w-8 h-8 text-white/80" />
            </div>
          </div>
        )}
      </div>

      {/* Editor Controls Bar - Explicit z-index and shrink-0 to prevent collapsing */}
      <div className="bg-gray-900 border-t border-gray-800 flex flex-col shrink-0 z-30 shadow-2xl">
        
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-1">
           <span className="text-[10px] text-blue-400 font-mono w-14 text-right tabular-nums">{formatTime(currentTime)}</span>
           <div className="relative flex-grow h-6 flex items-center group/seeker">
             <div className="absolute w-full h-1 bg-gray-700 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600/50" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
             </div>
             <input
                type="range"
                min="0"
                max={duration}
                step="0.033" 
                value={currentTime}
                onChange={handleSeek}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="pointer-events-none absolute h-3 w-1 bg-white rounded-full shadow-md transition-all group-hover/seeker:h-4 group-hover/seeker:w-1.5 group-hover/seeker:shadow-blue-500/50"
                style={{ left: `${(duration ? currentTime / duration : 0) * 100}%` }}
              ></div>
           </div>
           <span className="text-[10px] text-gray-500 font-mono w-14 tabular-nums">{formatTime(duration)}</span>
        </div>
        
        {/* Main Buttons Row */}
        <div className="flex items-center px-4 pb-3 pt-1">
          
          {/* Left Spacer to balance layout */}
          <div className="flex-1 w-0 flex items-center text-xs text-gray-600">
             <Film className="w-3 h-3 mr-1" />
             <span className="hidden sm:inline">ClipForge Player</span>
          </div>

          {/* Playback Controls (Center) */}
          <div className="flex items-center justify-center gap-1 flex-shrink-0">
            {/* Step Back */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => stepFrame(-5)}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="后退5帧"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => stepFrame(-1)}
                className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                title="上一帧 (←)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all mx-2 shadow-lg shadow-white/10"
              title={isPlaying ? "暂停 (Space)" : "播放 (Space)"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Step Forward */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => stepFrame(1)}
                className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                title="下一帧 (→)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => stepFrame(5)}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="前进5帧"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Capture Action (Right) */}
          <div className="flex-1 flex justify-end w-0">
             <button
              onClick={captureFrame}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/30 transition-all active:scale-95 hover:shadow-blue-500/20 border border-white/10 whitespace-nowrap"
              title="捕获当前帧画面"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">截取画面</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;