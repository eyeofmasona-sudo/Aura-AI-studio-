import React from 'react';
import { X, Copy, Download, FileText, Check } from 'lucide-react';

interface SavedFile {
  id: string;
  name: string;
  type: 'text' | 'json' | 'image' | 'audio';
  content: string;
  timestamp: string;
  sizeKey?: string;
}

export function FileViewerModal({
  file,
  onClose
}: {
  file: SavedFile;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: file.type === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="file-viewer-modal-backdrop" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in">
      <div 
        id="file-viewer-modal-container"
        className="bg-[#0b101c] border border-[#00F0FF]/30 w-full max-w-3xl rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#00F0FF]/15 flex items-center justify-center border border-[#00F0FF]/30">
              <FileText className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{file.name}</h3>
              <p className="text-[10px] text-slate-400">Сохранено: {file.timestamp} • Размер: {file.sizeKey || "Н/Д"}</p>
            </div>
          </div>
          <button 
            id="file-viewer-close-btn"
            onClick={onClose}
            className="p-1 px-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-black/40 text-left">
          {file.type === 'json' ? (
            <pre className="text-xs font-mono text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {file.content}
            </pre>
          ) : (
            <div className="text-sm font-sans text-slate-200 whitespace-pre-wrap leading-relaxed prose prose-invert select-text">
              {file.content}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-800 bg-[#0d1424]">
          <button 
            id="file-viewer-copy-btn"
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Копировать</span>
              </>
            )}
          </button>
          
          <button 
            id="file-viewer-download-btn"
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg bg-[#00F0FF] text-black hover:bg-[#4dffff] text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать</span>
          </button>
        </div>
      </div>
    </div>
  );
}
