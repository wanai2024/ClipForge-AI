import React, { useRef } from 'react';
import { CapturedFrame } from '../types';
import { Trash2, Sparkles, Download, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ScreenshotGalleryProps {
  frames: CapturedFrame[];
  onSelect: (frame: CapturedFrame) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
}

const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({ frames, onSelect, onDelete, selectedId }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Adjust scroll distance
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount 
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleDownload = (e: React.MouseEvent, frame: CapturedFrame) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = frame.dataUrl;
    link.download = `clipforge-capture-${Math.floor(frame.timestamp)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (frames.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-800/50 rounded-xl bg-gray-900/30 m-2">
        <div className="p-3 bg-gray-800/50 rounded-full mb-2">
           <ImageIcon className="w-6 h-6 text-gray-600" />
        </div>
        <p className="text-gray-500 text-sm font-medium">暂无截图</p>
        <p className="text-gray-600 text-xs mt-1">播放视频时点击“截取画面”按钮</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group/gallery flex items-center bg-gray-950/20">
       {/* Left Button */}
       <button 
         onClick={() => scroll('left')}
         className="absolute left-0 z-20 h-full w-12 bg-gradient-to-r from-gray-950/90 to-transparent flex items-center justify-center text-gray-400 hover:text-white opacity-0 group-hover/gallery:opacity-100 transition-opacity disabled:opacity-0 focus:outline-none"
       >
         <ChevronLeft className="w-8 h-8 drop-shadow-lg transform active:scale-90 transition-transform" />
       </button>

       {/* Scroll Container */}
       <div 
         ref={scrollContainerRef}
         className="flex gap-3 overflow-x-auto overflow-y-hidden h-full items-center px-4 scroll-smooth no-scrollbar w-full"
       >
         {frames.map((frame) => (
            <div 
              key={frame.id}
              className={`relative flex-shrink-0 h-[80%] aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer bg-black group/item ${
                 selectedId === frame.id ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-xl shadow-blue-900/30 scale-105 z-10' : 'border-gray-800 hover:border-gray-600 hover:scale-105 hover:z-10 opacity-80 hover:opacity-100'
              }`}
              onClick={() => onSelect(frame)}
            >
               <img 
                 src={frame.dataUrl} 
                 alt={`Time: ${frame.timestamp.toFixed(1)}s`} 
                 className="w-full h-full object-contain bg-black"
                 draggable={false}
               />
               
               {/* Metadata Badge */}
               <div className="absolute top-1 left-1 pointer-events-none">
                 {frame.isGenerated ? (
                   <span className="bg-purple-600/90 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm font-bold tracking-wide">AI</span>
                 ) : (
                   <span className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm font-mono tracking-tighter">
                     {frame.timestamp.toFixed(1)}s
                   </span>
                 )}
               </div>

               {/* Hover Actions Overlay */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col justify-end p-2">
                 <div className="flex justify-end items-center w-full gap-2">
                   <button 
                      onClick={(e) => handleDownload(e, frame)}
                      className="text-gray-300 hover:text-blue-400 p-1.5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm"
                      title="下载截图"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(frame.id);
                      }}
                      className="text-gray-300 hover:text-red-400 p-1.5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm"
                      title="删除截图"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
               </div>

               {selectedId === frame.id && (
                 <div className="absolute top-1 right-1 pointer-events-none">
                   <span className="flex items-center gap-0.5 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                     <Sparkles className="w-2 h-2" />
                   </span>
                 </div>
               )}
            </div>
         ))}
         {/* Spacer for right padding ensuring last item isn't covered by button area if scrolled to end */}
         <div className="w-8 flex-shrink-0 h-full"></div>
       </div>

       {/* Right Button */}
       <button 
         onClick={() => scroll('right')}
         className="absolute right-0 z-20 h-full w-12 bg-gradient-to-l from-gray-950/90 to-transparent flex items-center justify-center text-gray-400 hover:text-white opacity-0 group-hover/gallery:opacity-100 transition-opacity focus:outline-none"
       >
         <ChevronRight className="w-8 h-8 drop-shadow-lg transform active:scale-90 transition-transform" />
       </button>
    </div>
  );
};

export default ScreenshotGallery;