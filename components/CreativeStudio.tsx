import React, { useState, useEffect } from 'react';
import { CapturedFrame, AppState, GeneratedImage } from '../types';
import { analyzeFrame, generateImageFromPrompt } from '../services/geminiService';
import { Wand2, Download, RefreshCw, AlertCircle, Image as ImageIcon, ArrowRight, Copy, Check, Ratio, BookmarkPlus, Layers } from 'lucide-react';

interface CreativeStudioProps {
  selectedFrame: CapturedFrame | null;
  onImageSaved: (img: GeneratedImage) => void;
  apiKey?: string;
}

const generateId = () => `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
];

const CreativeStudio: React.FC<CreativeStudioProps> = ({ selectedFrame, onImageSaved, apiKey }) => {
  const [englishPrompt, setEnglishPrompt] = useState<string>('');
  const [chineseDesc, setChineseDesc] = useState<string>('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // Now supports multiple generated images
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [imageCount, setImageCount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'cn' | 'en'>('cn');
  
  const [copiedEn, setCopiedEn] = useState(false);
  const [copiedCn, setCopiedCn] = useState(false);

  useEffect(() => {
    if (selectedFrame) {
      // Don't clear everything immediately if switching between frames, maybe just reset state
      // For now, clean slate is safer
      setEnglishPrompt('');
      setChineseDesc('');
      setGeneratedImages([]);
      setError(null);
      setAppState(AppState.IDLE);
      setActiveTab('cn');
    }
  }, [selectedFrame]);

  const handleAnalyze = async () => {
    if (!selectedFrame) return;

    setAppState(AppState.ANALYZING);
    setError(null);

    try {
      const result = await analyzeFrame(selectedFrame.dataUrl, apiKey);
      setEnglishPrompt(result.englishPrompt);
      setChineseDesc(result.chineseDescription);
      setAppState(AppState.IDLE);
      if (result.chineseDescription) setActiveTab('cn');
    } catch (err) {
      setError("分析图片失败，请检查网络或 API Key。");
      setAppState(AppState.ERROR);
    }
  };

  const handleGenerate = async () => {
    if (!englishPrompt) return;

    setAppState(AppState.GENERATING);
    setError(null);
    setGeneratedImages([]); // Clear previous batch

    try {
      const imageUrls = await generateImageFromPrompt(englishPrompt, aspectRatio, imageCount, apiKey);
      
      const newImages: GeneratedImage[] = imageUrls.map(url => ({
        id: generateId(),
        dataUrl: url,
        promptUsed: englishPrompt,
        createdAt: Date.now()
      }));

      setGeneratedImages(newImages);
      setAppState(AppState.IDLE);
    } catch (err) {
      setError("生成图片失败，模型可能繁忙，请重试。");
      setAppState(AppState.ERROR);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.dataUrl;
    link.download = `clipforge-gen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToGallery = (img: GeneratedImage) => {
    onImageSaved(img);
    // Visual feedback could go here
  };

  const copyToClipboard = (text: string, isEnglish: boolean) => {
    navigator.clipboard.writeText(text);
    if (isEnglish) {
      setCopiedEn(true);
      setTimeout(() => setCopiedEn(false), 2000);
    } else {
      setCopiedCn(true);
      setTimeout(() => setCopiedCn(false), 2000);
    }
  };

  if (!selectedFrame) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-gray-500">
        <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-700">
          <ImageIcon className="w-10 h-10 opacity-50" />
        </div>
        <div>
           <h3 className="text-lg font-medium text-gray-300">创意工坊待机中</h3>
           <p className="text-sm mt-2 max-w-[200px] mx-auto">
             请先在左侧选择一张截图，开始进行 AI 分析与创作。
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Top Section: Split View (Source + Text) */}
      <div className="flex-shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-4 h-[40%] min-h-[250px] max-h-[400px]">
        
        {/* Left: Source Image (Compact) */}
        <div className="relative bg-black rounded-xl border border-gray-800 overflow-hidden group shadow-lg flex flex-col">
          <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 rounded text-[10px] text-gray-300 backdrop-blur-sm">
            原始画面
          </div>
          <img src={selectedFrame.dataUrl} className="w-full h-full object-contain" alt="Source" />
          
          <div className="absolute bottom-3 right-3">
             <button
              onClick={handleAnalyze}
              disabled={appState === AppState.ANALYZING || appState === AppState.GENERATING}
              className="bg-blue-600/90 hover:bg-blue-500 text-white py-1.5 px-3 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm transition-all flex items-center gap-1.5 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {appState === AppState.ANALYZING ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 分析中...
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" /> 智能分析
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Analysis Text */}
        <div className="flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
           <div className="flex items-center gap-1 bg-gray-950 p-2 border-b border-gray-800">
              <button 
                onClick={() => setActiveTab('cn')}
                className={`flex-1 py-1.5 text-xs rounded-md transition-all text-center ${activeTab === 'cn' ? 'bg-gray-800 text-white shadow font-bold' : 'text-gray-500 hover:text-gray-300'}`}
              >
                中文场景描述
              </button>
              <button 
                onClick={() => setActiveTab('en')}
                className={`flex-1 py-1.5 text-xs rounded-md transition-all text-center ${activeTab === 'en' ? 'bg-blue-900/30 text-blue-200 shadow font-bold border border-blue-900/50' : 'text-gray-500 hover:text-gray-300'}`}
              >
                英文生图提示词 (Prompt)
              </button>
           </div>

           <div className="relative flex-1">
              <div className="absolute top-2 right-2 z-10">
                <button 
                   onClick={() => copyToClipboard(activeTab === 'cn' ? chineseDesc : englishPrompt, activeTab === 'en')}
                   className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-1.5 rounded backdrop-blur-sm"
                   title="复制内容"
                 >
                   {(activeTab === 'cn' ? copiedCn : copiedEn) ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                 </button>
              </div>

              {activeTab === 'cn' ? (
                <textarea 
                  className="w-full h-full bg-transparent p-4 text-gray-300 text-sm leading-relaxed focus:outline-none resize-none custom-scrollbar"
                  placeholder="等待 AI 分析画面..."
                  value={chineseDesc}
                  onChange={(e) => setChineseDesc(e.target.value)}
                  disabled={appState === AppState.ANALYZING}
                />
              ) : (
                <textarea 
                  className="w-full h-full bg-transparent p-4 text-blue-100 text-sm leading-relaxed focus:outline-none resize-none custom-scrollbar font-mono"
                  placeholder="Waiting for AI prompt generation..."
                  value={englishPrompt}
                  onChange={(e) => setEnglishPrompt(e.target.value)}
                  disabled={appState === AppState.ANALYZING}
                />
              )}
           </div>
        </div>
      </div>

      {/* Middle Section: Controls */}
      <div className="flex-shrink-0 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800">
        
        <div className="flex items-center gap-4">
           {/* Aspect Ratio */}
           <div className="flex flex-col gap-1">
             <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
                <Ratio className="w-3 h-3" /> 画幅比例
             </span>
             <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
               {ASPECT_RATIOS.map((ratio) => (
                 <button
                   key={ratio.value}
                   onClick={() => setAspectRatio(ratio.value)}
                   className={`px-2 py-1 text-[10px] rounded transition-all ${
                     aspectRatio === ratio.value 
                       ? 'bg-gray-700 text-white shadow' 
                       : 'text-gray-500 hover:text-gray-300'
                   }`}
                 >
                   {ratio.label}
                 </button>
               ))}
             </div>
           </div>

           {/* Image Count */}
           <div className="flex flex-col gap-1">
             <span className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
                <Layers className="w-3 h-3" /> 数量
             </span>
             <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
               {[1, 2, 3].map((num) => (
                 <button
                   key={num}
                   onClick={() => setImageCount(num)}
                   className={`w-7 py-1 text-[10px] rounded transition-all ${
                     imageCount === num 
                       ? 'bg-gray-700 text-white shadow' 
                       : 'text-gray-500 hover:text-gray-300'
                   }`}
                 >
                   {num}
                 </button>
               ))}
             </div>
           </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerate}
          disabled={!englishPrompt || appState === AppState.ANALYZING || appState === AppState.GENERATING}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2 px-8 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 active:scale-[0.98]"
        >
          {appState === AppState.GENERATING ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> 创作中...
            </>
          ) : (
            <>
              开始生成 ({imageCount}张) <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      
      {error && (
          <div className="mt-2 bg-red-500/10 border border-red-500/20 text-red-200 p-2 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </div>
      )}

      {/* Bottom Section: Results Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
        {generatedImages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-700 border-2 border-dashed border-gray-800 rounded-xl">
              <ImageIcon className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs">生成的图片将显示在这里</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {generatedImages.map((img) => (
               <div key={img.id} className="relative group bg-gray-900 rounded-xl border border-gray-800 overflow-hidden aspect-square shadow-lg">
                  <img src={img.dataUrl} className="w-full h-full object-contain bg-black" alt="Generated" />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                     <button
                       onClick={() => handleSaveToGallery(img)}
                       className="bg-emerald-600 hover:bg-emerald-500 text-white w-32 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
                     >
                       <BookmarkPlus className="w-3.5 h-3.5" /> 收藏到库
                     </button>
                     <button
                       onClick={() => handleDownload(img)}
                       className="bg-white hover:bg-gray-100 text-gray-900 w-32 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
                     >
                       <Download className="w-3.5 h-3.5" /> 下载原图
                     </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CreativeStudio;