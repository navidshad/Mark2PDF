
import React from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files) as File[];
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          const imageTag = `![${file.name}](${base64})\n`;
          onChange(value + (value.endsWith('\n') ? '' : '\n') + imageTag);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col h-full bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="bg-[#0f172a] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Editor (Markdown / HTML)</span>
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
        </div>
      </div>
      <textarea
        className="flex-1 p-5 lg:p-6 font-mono text-[13px] resize-none outline-none bg-[#1e293b] text-[#cbd5e1] leading-relaxed caret-blue-400 placeholder-slate-600 transition-colors overflow-y-auto"
        placeholder="# Start typing...
Use standard Markdown or HTML.
Images are supported via ![alt](url).
TIP: Drag and drop image files here!"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        spellCheck={false}
      />
    </div>
  );
};
