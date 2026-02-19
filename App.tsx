
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Download, Settings2, Trash2, Github, Save } from 'lucide-react';
import { MarkdownEditor } from './components/MarkdownEditor';
import { MarkdownPreview } from './components/MarkdownPreview';
import { generatePDF } from './services/pdfService';
import { PDFOptions, PageSize, Orientation } from './types';

const STORAGE_KEY_CONTENT = 'mark2pdf_content';
const STORAGE_KEY_SETTINGS = 'mark2pdf_settings';

const DEFAULT_MARKDOWN = `# Welcome to Mark2PDF Pro
### A high-performance, client-side Markdown to PDF converter.

This app is **GitHub Pages ready** and runs entirely in your browser.

## Features:
- **Auto-Save**: Your work is saved to local storage.
- **Canvas Zoom**: Preview large formats without scrolling.
- **HTML Support**: Use <b>bold</b> or <span style="color: red">colored</span> text.
- **Images**: Drag and drop or link them.
  ![Office](https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop)

---

| Tool | Environment | Reliability |
| :--- | :--- | :--- |
| jspdf | Browser | High |
| marked | Browser | High |
| html2canvas | Browser | Medium-High |
`;

const App: React.FC = () => {
  const [markdown, setMarkdown] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CONTENT) || DEFAULT_MARKDOWN;
  });

  const [options, setOptions] = useState<PDFOptions>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved ? JSON.parse(saved) : {
      pageSize: 'a4',
      orientation: 'portrait',
      margin: 15,
      filename: 'document'
    };
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONTENT, markdown);
    setLastSaved(new Date());
  }, [markdown]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(options));
  }, [options]);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);
    try {
      await generatePDF(previewRef.current, options);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all content?")) {
      setMarkdown("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f1f5f9] text-slate-900 overflow-hidden">
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <FileText size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-[0.15em] text-slate-800 uppercase leading-none mb-1">
              Mark2PDF <span className="text-indigo-600">PRO</span>
            </h1>
            <div className="flex items-center text-[10px] text-slate-400 font-medium">
              <Save size={10} className="mr-1" />
              {lastSaved ? `Auto-saved at ${lastSaved.toLocaleTimeString()}` : 'Ready'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDownload}
            disabled={isGenerating || !markdown}
            className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
            ) : (
              <Download size={16} />
            )}
            <span>{isGenerating ? 'GENERATING...' : 'DOWNLOAD PDF'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex min-h-0">
        <aside className="w-72 border-r border-slate-200 bg-white p-5 overflow-y-auto space-y-6 hidden xl:block shrink-0">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-slate-400">
              <Settings2 size={14} />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em]">Layout Controls</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Document Name</label>
                <input 
                  type="text" 
                  value={options.filename}
                  onChange={(e) => setOptions({...options, filename: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                  placeholder="document-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Format</label>
                  <select 
                    value={options.pageSize}
                    onChange={(e) => setOptions({...options, pageSize: e.target.value as PageSize})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none transition-all font-medium"
                  >
                    <option value="a4">A4 Paper</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Orientation</label>
                  <select 
                    value={options.orientation}
                    onChange={(e) => setOptions({...options, orientation: e.target.value as Orientation})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none transition-all font-medium"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Page Pad (mm)</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={options.margin}
                    onChange={(e) => setOptions({...options, margin: parseInt(e.target.value) || 0})}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-600 w-8">{options.margin}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button 
              onClick={handleClear}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-all text-[11px] font-bold uppercase tracking-wider active:scale-[0.98]"
            >
              <Trash2 size={12} />
              <span>Clear Editor</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="p-4 bg-slate-900 rounded-xl">
              <h3 className="text-[10px] font-black text-white mb-2 flex items-center uppercase tracking-widest">
                <Github size={12} className="mr-2 text-indigo-400" />
                Pure Static
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                Client-side generation using jsPDF & html2canvas. No data ever leaves your device.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex p-4 gap-4 bg-[#f8fafc] min-w-0">
          <div className="flex-1 min-w-0 h-full">
            <MarkdownEditor value={markdown} onChange={setMarkdown} />
          </div>
          <div className="flex-1 min-w-0 h-full">
            <MarkdownPreview markdown={markdown} previewRef={previewRef} options={options} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
