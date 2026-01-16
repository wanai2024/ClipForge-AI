import React from 'react';
import { CapturedFrame } from '../types';
import { Clock, Info, Hash, Maximize, FileDigit, Calendar, Trash2, Download, MonitorPlay } from 'lucide-react';

interface FrameInfoSidebarProps {
  frame: CapturedFrame | null;
  onDelete: (id: string) => void;
  onDownload: (frame: CapturedFrame) => void;
}

const FrameInfoSidebar: React.FC<FrameInfoSidebarProps> = ({ frame, onDelete, onDownload }) => {
  if (!frame) {
    return (
      <div className="w-72 bg-gray-950 border-l border-gray-800 flex flex-col items-center justify-center p-6 text-center h-full">
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-800">
           <Info className="w-6 h-6 text-gray-600" />
        </div>
        <h3 className="text-gray-300 font-medium text-sm">暂无选中素材</h3>
        <p className="text-gray-600 text-xs mt-2">
          请在底部的素材库中点击图片<br/>查看详细信息
        </p>
      </div>
    );
  }

  // Calculate approximate file size (base64 string length * 0.75 for bytes)
  const calculateSize = (base64: string) => {
    const stringLength = base64.length - (base64.indexOf(',') + 1);
    const sizeInBytes = 4 * Math.ceil((stringLength / 3)) * 0.5624896334383812;
    const sizeInKb = sizeInBytes / 1000;
    return `${sizeInKb.toFixed(1)} KB`;
  };

  const formattedDate = new Date(frame.createdAt).toLocaleString('zh-CN', {
     month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="w-72 bg-gray-950 border-l border-gray-800 flex flex-col h-full overflow-hidden shadow-xl z-20">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50">
        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <MonitorPlay className="w-4 h-4 text-blue-500" />
          素材详情
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Thumbnail */}
        <div className="w-full aspect-video bg-black rounded-lg border border-gray-800 overflow-hidden mb-6 group relative shadow-lg">
          <img src={frame.dataUrl} alt="Selected" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button 
               onClick={() => onDownload(frame)}
               className="bg-white/90 text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:scale-105 transition-transform"
             >
               <Download className="w-3 h-3" /> 查看原图
             </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="space-y-4">
           
           <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Hash className="w-3.5 h-3.5" /> <span>ID</span>
                 </div>
                 <span className="text-xs text-gray-300 font-mono truncate max-w-[120px]" title={frame.id}>
                   {frame.id.split('-')[1]}...
                 </span>
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Clock className="w-3.5 h-3.5" /> <span>时间戳</span>
                 </div>
                 <span className="text-xs text-blue-300 font-mono bg-blue-900/20 px-1.5 py-0.5 rounded">
                   {frame.timestamp.toFixed(2)}s
                 </span>
              </div>
           </div>

           <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Maximize className="w-3.5 h-3.5" /> <span>分辨率</span>
                 </div>
                 <span className="text-xs text-gray-300 font-mono">
                    {frame.width ? `${frame.width} × ${frame.height}` : 'N/A'} px
                 </span>
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <FileDigit className="w-3.5 h-3.5" /> <span>大小</span>
                 </div>
                 <span className="text-xs text-gray-300 font-mono">
                    {calculateSize(frame.dataUrl)}
                 </span>
              </div>
              
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar className="w-3.5 h-3.5" /> <span>创建时间</span>
                 </div>
                 <span className="text-xs text-gray-400">
                    {formattedDate}
                 </span>
              </div>
           </div>

           {frame.isGenerated && (
             <div className="bg-purple-900/10 border border-purple-500/20 p-3 rounded-lg">
                <span className="text-xs text-purple-300 font-medium block mb-1">AI 生成内容</span>
                <p className="text-[10px] text-purple-200/60 leading-relaxed">
                  该图像由 Gemini 模型生成，并非原始视频截图。
                </p>
             </div>
           )}

        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/30 flex gap-2">
         <button
           onClick={() => onDownload(frame)}
           className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
         >
           <Download className="w-3.5 h-3.5" /> 下载
         </button>
         <button
           onClick={() => onDelete(frame.id)}
           className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
         >
           <Trash2 className="w-3.5 h-3.5" /> 删除
         </button>
      </div>
    </div>
  );
};

export default FrameInfoSidebar;