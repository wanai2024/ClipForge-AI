import React, { useState, useEffect } from 'react';
import { CapturedFrame, WorkflowStep, GeneratedImage } from './types';
import VideoPlayer from './components/VideoPlayer';
import ScreenshotGallery from './components/ScreenshotGallery';
import CreativeStudio from './components/CreativeStudio';
import VeoStudio from './components/VeoStudio';
import FrameInfoSidebar from './components/FrameInfoSidebar';
import { Clapperboard, Layers, Video as VideoIcon, Image as ImageIcon, Camera, KeyRound, Settings, CheckCircle2, Download, XCircle, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<CapturedFrame | null>(null);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowStep.CAPTURE);
  const [seekTimestamp, setSeekTimestamp] = useState<number | null>(null);
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Load API Key from local storage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('user_gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSaveApiKey = () => {
    const trimmedKey = apiKey.trim();
    
    if (!trimmedKey) {
      setKeyError('API Key 不能为空');
      return;
    }

    // Basic format check for Google Cloud Keys (usually start with AIza)
    if (!trimmedKey.startsWith('AIza')) {
       setKeyError('无效的 Key 格式 (应以 AIza 开头)');
       return;
    }

    localStorage.setItem('user_gemini_api_key', trimmedKey);
    setApiKey(trimmedKey); // Update state with trimmed value
    setShowKeyInput(false);
    setKeyError(null);
  };

  const handleCancelKeyInput = () => {
    setShowKeyInput(false);
    setKeyError(null);
    // Revert to stored key if cancelled
    const storedKey = localStorage.getItem('user_gemini_api_key');
    setApiKey(storedKey || '');
  };

  const handleCapture = (frame: CapturedFrame) => {
    setFrames(prev => [...prev, frame]);
    if (!selectedFrame) {
      setSelectedFrame(frame);
    }
  };

  const handleSelectFrame = (frame: CapturedFrame) => {
    setSelectedFrame(frame);
    // If in Capture mode, sync video
    if (currentStep === WorkflowStep.CAPTURE) {
      setSeekTimestamp(frame.timestamp);
    }
  };

  const handleDeleteFrame = (id: string) => {
    setFrames(prev => prev.filter(f => f.id !== id));
    if (selectedFrame?.id === id) {
      setSelectedFrame(null);
    }
  };

  const handleDownloadFrame = (frame: CapturedFrame) => {
    const link = document.createElement('a');
    link.href = frame.dataUrl;
    link.download = `clipforge-${frame.isGenerated ? 'gen' : 'cap'}-${frame.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFrameEvent = (e: React.MouseEvent, frame: CapturedFrame) => {
    e.stopPropagation();
    handleDownloadFrame(frame);
  };

  const handleImageSaved = (img: GeneratedImage) => {
     // Convert GeneratedImage to CapturedFrame to add to the main gallery
     const newFrame: CapturedFrame = {
       id: img.id,
       dataUrl: img.dataUrl,
       timestamp: 0, // Placeholder
       createdAt: img.createdAt,
       isGenerated: true
     };
     setFrames(prev => [newFrame, ...prev]);
     // Optionally verify nicely
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case WorkflowStep.CAPTURE:
        return (
           <div className="flex h-full overflow-hidden">
             {/* Main Content Area (Video + Gallery) */}
             <div className="flex-1 flex flex-col min-w-0 bg-gray-950 h-full relative">
               
               {/* Video Player Area */}
               <div className="flex-grow relative overflow-hidden bg-black flex flex-col">
                  <div className="absolute inset-0 w-full h-full">
                    <VideoPlayer 
                      onCapture={handleCapture} 
                      seekToTimestamp={seekTimestamp}
                    />
                  </div>
               </div>

               {/* Bottom Gallery - Fixed height */}
               <div className="h-48 bg-slate-900 border-t border-slate-800 flex flex-col flex-shrink-0 z-10 shadow-2xl">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900 shadow-sm shrink-0">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" /> 
                      素材库 (截图 & 生成)
                      <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center">
                         {frames.length}
                      </span>
                    </h2>
                  </div>
                  <div className="flex-grow overflow-hidden bg-slate-900/50 relative">
                    <ScreenshotGallery 
                      frames={frames} 
                      onSelect={handleSelectFrame} 
                      onDelete={handleDeleteFrame}
                      selectedId={selectedFrame?.id || null}
                    />
                  </div>
               </div>
             </div>

             {/* Right Sidebar Info Panel */}
             <div className="flex-shrink-0 h-full hidden lg:block">
                <FrameInfoSidebar 
                  frame={selectedFrame} 
                  onDelete={handleDeleteFrame}
                  onDownload={handleDownloadFrame}
                />
             </div>
           </div>
        );
      
      case WorkflowStep.CREATIVE:
        return (
          <div className="flex-1 flex flex-row h-full overflow-hidden">
             {/* Left Sidebar Gallery for Selection */}
             <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
                <div className="p-3 border-b border-slate-800 font-bold text-gray-400 text-xs">选择参考素材</div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                   <div className="grid grid-cols-1 gap-2">
                      {frames.map(f => (
                        <div 
                          key={f.id} 
                          onClick={() => handleSelectFrame(f)}
                          className={`aspect-video rounded border overflow-hidden cursor-pointer relative group ${selectedFrame?.id === f.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-700 opacity-60 hover:opacity-100'}`}
                        >
                          <img src={f.dataUrl} className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1">
                             {f.isGenerated ? (
                               <span className="bg-purple-600 text-white text-[8px] px-1 rounded shadow">AI</span>
                             ) : (
                               <span className="bg-black/60 text-white text-[8px] px-1 rounded shadow">{f.timestamp.toFixed(1)}s</span>
                             )}
                          </div>
                          {/* Download Button Overlay */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={(e) => handleDownloadFrameEvent(e, f)}
                               className="bg-black/70 hover:bg-blue-600 text-white p-1 rounded-full backdrop-blur-sm"
                               title="下载图片"
                             >
                               <Download className="w-3 h-3" />
                             </button>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             {/* Main Creative Studio */}
             <div className="flex-1 bg-gray-950 p-4 overflow-hidden flex flex-col">
                <CreativeStudio 
                  selectedFrame={selectedFrame} 
                  onImageSaved={handleImageSaved} 
                  apiKey={apiKey}
                />
             </div>
          </div>
        );

      case WorkflowStep.VEO:
        return (
          <div className="flex-1 flex flex-row h-full overflow-hidden">
             {/* Left Sidebar Gallery for Selection */}
             <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
                <div className="p-3 border-b border-slate-800 font-bold text-gray-400 text-xs">选择素材 (填充到选中框)</div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                   <div className="grid grid-cols-1 gap-2">
                      {frames.map(f => (
                        <div 
                          key={f.id} 
                          onClick={() => handleSelectFrame(f)}
                          className={`aspect-video rounded border overflow-hidden cursor-pointer relative group ${selectedFrame?.id === f.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-700 opacity-60 hover:opacity-100'}`}
                        >
                          <img src={f.dataUrl} className="w-full h-full object-cover" />
                          {f.isGenerated && (
                            <span className="absolute top-1 left-1 bg-purple-600 text-white text-[8px] px-1 rounded shadow">AI</span>
                          )}
                           {/* Download Button Overlay */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={(e) => handleDownloadFrameEvent(e, f)}
                               className="bg-black/70 hover:bg-blue-600 text-white p-1 rounded-full backdrop-blur-sm"
                               title="下载图片"
                             >
                               <Download className="w-3 h-3" />
                             </button>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
             {/* Main Veo Studio - Note: Veo handles its own key for paid tier usually via window.aistudio, but passing prop as backup */}
             <div className="flex-1 bg-gray-950 p-4 overflow-hidden flex flex-col">
                <VeoStudio selectedFrame={selectedFrame} apiKey={apiKey} />
             </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 flex-shrink-0 z-20">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent hidden sm:block">
              ClipForge AI
            </h1>
            
            {/* Step Navigation */}
            <div className="flex items-center bg-gray-950 rounded-lg p-1 border border-gray-800 ml-4">
               <button 
                 onClick={() => setCurrentStep(WorkflowStep.CAPTURE)}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${currentStep === WorkflowStep.CAPTURE ? 'bg-gray-800 text-white font-medium shadow' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 <Camera className="w-4 h-4" /> <span className="hidden sm:inline">1. 采集</span>
               </button>
               <button 
                 onClick={() => setCurrentStep(WorkflowStep.CREATIVE)}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${currentStep === WorkflowStep.CREATIVE ? 'bg-blue-900/30 text-blue-200 font-medium shadow border border-blue-800/30' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 <ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">2. 创作</span>
               </button>
               <button 
                 onClick={() => setCurrentStep(WorkflowStep.VEO)}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${currentStep === WorkflowStep.VEO ? 'bg-emerald-900/30 text-emerald-200 font-medium shadow border border-emerald-800/30' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 <VideoIcon className="w-4 h-4" /> <span className="hidden sm:inline">3. 生成</span>
               </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
             {/* API Key Manager */}
             <div className="relative z-50">
                {showKeyInput ? (
                  <div className="relative">
                    <div className={`flex items-center gap-2 bg-gray-800 p-1 pr-2 rounded-lg border animate-in fade-in slide-in-from-right-4 duration-200 shadow-xl ${keyError ? 'border-red-500 ring-1 ring-red-500/50' : 'border-gray-700'}`}>
                      <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          if (keyError) setKeyError(null);
                        }}
                        placeholder="Paste Gemini API Key"
                        className="bg-gray-900 border-none rounded px-2 py-1 text-xs w-48 text-white focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-600"
                        autoFocus
                      />
                      <button 
                        onClick={handleSaveApiKey} 
                        className="text-green-400 hover:text-green-300 hover:bg-green-900/20 p-1 rounded transition-colors"
                        title="保存并关闭"
                      >
                        <CheckCircle2 className="w-4 h-4"/>
                      </button>
                      <button 
                        onClick={handleCancelKeyInput} 
                        className="text-gray-500 hover:text-gray-300 hover:bg-gray-700 p-1 rounded transition-colors"
                        title="取消"
                      >
                        <XCircle className="w-4 h-4"/>
                      </button>
                    </div>
                    
                    {/* Error Popup */}
                    {keyError && (
                      <div className="absolute top-full right-0 mt-2 bg-red-900/90 border border-red-500/30 text-red-200 text-[10px] px-2 py-1 rounded shadow-lg flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
                        <AlertCircle className="w-3 h-3" />
                        {keyError}
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowKeyInput(true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${apiKey ? 'bg-green-900/20 border-green-800 text-green-400 hover:bg-green-900/30' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {apiKey ? 'API Key Configured' : 'Set API Key'}
                  </button>
                )}
             </div>

             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-xs text-slate-300 font-medium">Gemini 3 + Veo</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col overflow-hidden relative">
        {renderStepContent()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-1.5 px-4 flex-shrink-0 z-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
           <div className="flex items-center gap-2">
             <span className="font-medium text-slate-400">ClipForge AI</span>
             <span>&copy; {new Date().getFullYear()}</span>
             <span className="hidden md:inline text-slate-700">|</span>
             <span className="hidden md:inline">版权所有 All Rights Reserved.</span>
           </div>
           <div className="flex items-center gap-3">
             <span>Powered by <span className="text-blue-400 font-medium">Google Gemini</span> & <span className="text-emerald-400 font-medium">Veo</span></span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;