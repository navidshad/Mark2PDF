
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { marked } from 'marked';
import { PDFOptions } from '../types';

interface MarkdownPreviewProps {
  markdown: string;
  previewRef: React.RefObject<HTMLDivElement>;
  options: PDFOptions;
}

const PAGE_DIMENSIONS = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
  legal: { width: 215.9, height: 355.6 },
};

const MM_TO_PX = 3.7795275591;

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown, previewRef, options }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [totalHeightPx, setTotalHeightPx] = useState(0);

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const html = marked.parse(markdown);

  const baseDim = PAGE_DIMENSIONS[options.pageSize];
  const isLandscape = options.orientation === 'landscape';
  const pageWidthMm = isLandscape ? baseDim.height : baseDim.width;
  const pageHeightMm = isLandscape ? baseDim.width : baseDim.height;

  const pageWidthPx = pageWidthMm * MM_TO_PX;
  const pageHeightPx = pageHeightMm * MM_TO_PX;
  const marginPx = options.margin * MM_TO_PX;
  const maxContentHeightPx = pageHeightPx - (marginPx * 2);

  // Update scale to fit the available width of the container
  useLayoutEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const padding = 64; // Horizontal padding in the gray area
      const availableWidth = containerRef.current.offsetWidth - padding;
      const scaleX = availableWidth / pageWidthPx;
      // Clamp scale between 10% and 100%
      setScale(Math.max(0.1, Math.min(scaleX, 1.0)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pageWidthPx]);

  // Track the actual content height to handle scrolling and page breaks
  useEffect(() => {
    if (previewRef.current) {
      const updateHeight = () => {
        setTotalHeightPx(previewRef.current?.scrollHeight || 0);
      };
      // Short delay for marked to finish rendering
      const timeout = setTimeout(updateHeight, 50);
      return () => clearTimeout(timeout);
    }
  }, [markdown, options, scale]);

  const pageCount = Math.ceil(totalHeightPx / pageHeightPx) || 1;

  const paperStyle: React.CSSProperties = {
    width: `${pageWidthPx}px`,
    minHeight: `${pageHeightPx}px`,
    padding: `${marginPx}px`,
    backgroundColor: 'white',
    color: 'black',
    boxSizing: 'border-box',
    textAlign: 'left',
    transform: `scale(${scale})`,
    transformOrigin: 'top left', // Crucial for alignment with the wrapper
    position: 'relative',
    '--max-content-height': `${maxContentHeightPx}px`,
  } as React.CSSProperties;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center z-20 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Preview Canvas</span>
          <span className="text-[9px] text-slate-400 font-medium">
             {pageCount} Page{pageCount > 1 ? 's' : ''} • {Math.round(scale * 100)}% Zoom
          </span>
        </div>
        <div className="flex items-center space-x-2">
           <div className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[8px] font-bold text-slate-500 uppercase">
             {options.pageSize}
           </div>
           <div className="px-2 py-0.5 rounded-md bg-slate-200 text-[8px] font-bold text-slate-600 uppercase">
             {options.orientation}
           </div>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[#e2e8f0] p-8 scroll-smooth"
      >
        {/* The Wrapper is centered and sized to exactly match the scaled paper */}
        <div 
          style={{ 
            width: `${pageWidthPx * scale}px`, 
            height: `${Math.max(pageHeightPx, totalHeightPx) * scale}px`,
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <div 
            ref={previewRef}
            style={paperStyle}
            className="markdown-body shadow-[0_20px_50px_rgba(0,0,0,0.2)] prose prose-slate text-sm"
          >
             {/* Dynamic Page Break Visualizers */}
             {Array.from({ length: pageCount - 1 }).map((_, i) => (
               <div 
                 key={i}
                 className="absolute left-0 right-0 border-b-2 border-dashed border-indigo-200 z-30 pointer-events-none flex items-center justify-center"
                 style={{ top: `${(i + 1) * pageHeightPx}px` }}
               >
                 <span className="bg-indigo-50 text-[8px] text-indigo-400 font-black px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter -translate-y-1/2">
                   Page {i + 2}
                 </span>
               </div>
             ))}

             <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>
    </div>
  );
};
