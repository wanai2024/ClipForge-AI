import React, { useState, useEffect } from 'react';
import { CapturedFrame, AppState, GeneratedVideo } from '../types';
import { generateVideoFromImage } from '../services/geminiService';
import { Clapperboard, Video as VideoIcon, Download, AlertCircle, PlayCircle, Lock, Ratio, ArrowRight, X, ExternalLink } from 'lucide-react';

interface VeoStudioProps {
  selectedFrame: CapturedFrame | null; // This comes from sidebar selection
  apiKey?: string;
}

const VEO_RATIOS = [
  { label: '横屏 16:9', value: '16:9' },
  { label: '竖屏 9:16', value: '9:16' },
];

const VeoStudio: React.FC<VeoStudioProps> = ({ selectedFrame, apiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  
  // Dual frame state
  const [startFrame, setStartFrame] = useState<CapturedFrame | null>(null);
  const [endFrame, setEndFrame] = useState<CapturedFrame | null>(null);
  const [activeSlot, setActiveSlot] = useState<'start' | 'end'>('start');

  // Sync selectedFrame from sidebar to the active slot
  useEffect(() => {
    if (selectedFrame) {
      if (activeSlot === 'start') {
        setStartFrame(selectedFrame);
      } else {
        setEndFrame(selectedFrame);
      }
    }
  }, [selectedFrame, activeSlot]);

  // Initial load logic: If nothing is set, select start slot
  useEffect(() => {
    if (!startFrame && selectedFrame) {
      setStartFrame(selectedFrame);
    }
  }, []); // Run once to bootstrap if needed

  const hasAiStudio = typeof window !== 'undefined' && (window as any).aistudio;

  const handleGenerateVideo = async () => {
    if (!startFrame) {
        setError("请至少选择一个起始帧。");
        return;
    }

    // 1. API Key Check for Veo (Paid feature) - Browser context flow
    if (hasAiStudio) {
      try {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
           await (window as any).aistudio.openSelectKey();
        }
      } catch (e) {
        console.error("Error checking API key status:", e);
      }
    }

    setAppState(AppState.GENERATING);
    setError(null);
    setGeneratedVideo(null);

    try {
      // Pass both frames if available
      const endImage = endFrame ? endFrame.dataUrl : undefined;
      const videoUrl = await generateVideoFromImage(startFrame.dataUrl, prompt, aspectRatio, apiKey, endImage);
      
      setGeneratedVideo({
        videoUrl,
        promptUsed: prompt,
        createdAt: Date.now()
      });
      setAppState(AppState.IDLE);
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "生成视频失败。";
      
      if (errMsg.includes("403") || errMsg.includes("Permission Denied")) {
          errMsg = "权限拒绝 (403): Veo 模型需要开通计费的 API Key。请在右上角设置您的 API Key。";
          if (hasAiStudio) {
             try { await (window as any).aistudio.openSelectKey(); } catch {}
          }
      }

      setError(errMsg);
      setAppState(AppState.ERROR);
    }
  };

  const clearEndFrame = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEndFrame(null);
    setActiveSlot('end'); // Keep focus here so next click fills it
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-4">
      
      {/* Input Section */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4 shadow-lg shrink-0">
        
        {/* Frame Selection Area */}
        <div className="flex gap-4 items-center">
            {/* Start Frame Slot */}
            <div 
                onClick={() => setActiveSlot('start')}
                className={`relative w-32 h-24 rounded-lg border-2 overflow-hidden cursor-pointer transition-all group ${
                    activeSlot === 'start' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-700 hover:border-gray-500'
                }`}
            >
                {startFrame ? (
                    <img src={startFrame.dataUrl} className="w-full h-full object-cover" alt="Start" />
                ) : (
                    <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center text-gray-600">
                        <Clapperboard className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">起始帧</span>
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 text-center">
                    Start Frame
                </div>
            </div>

            <ArrowRight className="w-5 h-5 text-gray-600" />

            {/* End Frame Slot */}
            <div 
                onClick={() => setActiveSlot('end')}
                className={`relative w-32 h-24 rounded-lg border-2 overflow-hidden cursor-pointer transition-all group ${
                    activeSlot === 'end' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-700 hover:border-gray-500'
                }`}
            >
                {endFrame ? (
                    <>
                        <img src={endFrame.dataUrl} className="w-full h-full object-cover" alt="End" />
                        <button 
                            onClick={clearEndFrame}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </>
                ) : (
                    <div className="w-full h-full bg-gray-950 flex flex-col items-center justify-center text-gray-600 border-dashed border-gray-700">
                        <div className="border border-dashed border-gray-600 rounded p-1 mb-1">
                            <Clapperboard className="w-4 h-4 opacity-50" />
                        </div>
                        <span className="text-[10px] text-center px-2">结束帧 (可选)</span>
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 text-center">
                    End Frame
                </div>
            </div>

            {/* Prompt Input */}
            <div className="flex-1 min-w-0 flex flex-col h-24">
                 <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="描述视频中的动作，例如：光影变化，云雾缭绕..."
                    className="flex-1 bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-2"
                />
            </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-gray-800/50">
           <div className="flex items-center gap-2">
             <span className="text-xs text-gray-500 flex items-center gap-1"><Ratio className="w-3 h-3"/> 画幅</span>
             <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-800">
               {VEO_RATIOS.map(r => (
                 <button
                   key={r.value}
                   onClick={() => setAspectRatio(r.value)}
                   className={`px-3 py-1 text-[10px] rounded transition-all ${aspectRatio === r.value ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                   {r.label}
                 </button>
               ))}
             </div>
             <span className="text-[10px] text-gray-500 ml-2">提示: 侧边栏点击图片可填充选中框</span>
           </div>

           <button
             onClick={handleGenerateVideo}
             disabled={appState === AppState.GENERATING || !startFrame}
             className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             {appState === AppState.GENERATING ? (
               <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 生成中 (需1-2分钟)...
               </>
             ) : (
               <>
                 <PlayCircle className="w-4 h-4" /> 生成视频 (Veo)
               </>
             )}
           </button>
        </div>
        
        {/* Billing Note */}
        <div className="flex items-start gap-2 text-[10px] text-gray-500 bg-gray-950/50 p-2 rounded">
           <Lock className="w-3 h-3 mt-0.5" />
           <p>Veo 模型需要付费 API Key。请在右上角 "Set API Key" 设置您的 Key。<a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-500 hover:underline">查看计费说明</a></p>
        </div>

        {/* Third Party Tools Recommendation */}
        <div className="pt-2 border-t border-gray-800 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-[10px]">
           <span className="text-gray-500 font-medium whitespace-nowrap">第三方图生视频工具推荐：</span>
           <div className="flex items-center gap-3 text-gray-400">
              <a href="https://app.klingai.com/cn/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-400 hover:underline transition-colors group">
                可灵AI <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
              </a>
              <span className="text-gray-700">|</span>
              <a href="https://jimeng.jianying.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-400 hover:underline transition-colors group">
                即梦AI <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
              </a>
              <span className="text-gray-700">|</span>
              <a href="https://wuli.art/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-400 hover:underline transition-colors group">
                呜哩AI <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
              </a>
           </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-900/50 text-red-300 p-3 rounded-lg text-xs flex gap-2 items-center animate-pulse shrink-0">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Result Section */}
      <div className="flex-1 min-h-0 bg-black rounded-xl border border-gray-800 overflow-hidden relative group flex items-center justify-center">
        {generatedVideo ? (
          <div className="relative w-full h-full flex items-center justify-center">
             <video 
               src={generatedVideo.videoUrl} 
               controls 
               loop 
               autoPlay 
               className="max-h-full max-w-full"
             />
             <a 
               href={generatedVideo.videoUrl} 
               download={`veo-video-${Date.now()}.mp4`}
               className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
               title="下载视频"
             >
               <Download className="w-5 h-5" />
             </a>
          </div>
        ) : (
          <div className="text-center text-gray-700">
             <VideoIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
             <p className="text-sm">预览区域</p>
             <p className="text-xs text-gray-600 mt-2">选择 起始帧 和 可选的 结束帧 来生成视频</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default VeoStudio;