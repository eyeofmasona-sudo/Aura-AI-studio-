import { Sparkles, Play, Maximize, Settings, AlignLeft, Layers, User, Film } from "lucide-react";
import { LayoutType } from "../types";

export function getLayoutSchematic(layout: LayoutType) {
  switch (layout) {
    case 'split':
      return (
        <div className="flex h-[200px] w-full gap-3 p-3 bg-[var(--color-space-900)] rounded-xl border border-[var(--color-space-800)] relative z-10">
          <div className="flex-1 rounded-lg bg-[var(--color-space-800)] border border-[rgba(255,255,255,0.05)] flex flex-col p-4 relative overflow-hidden shadow-inner">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-2">
              <Settings className="w-3 h-3 text-[#B026FF]"/> Элементы управления
            </span>
            <div className="w-full h-8 bg-black/40 rounded-lg border border-[var(--color-space-700)] mb-2 shadow-inner"></div>
            <div className="w-full h-16 bg-black/40 rounded-lg border border-[var(--color-space-700)] mb-auto shadow-inner"></div>
            <div className="w-24 h-7 cyber-btn rounded-md text-[10px] text-white flex items-center justify-center font-bold">Применить</div>
          </div>
          <div className="flex-[1.8] rounded-lg bg-[var(--color-space-800)] border border-[rgba(255,255,255,0.05)] flex flex-col p-4 relative overflow-hidden shadow-inner">
            <span className="text-[9px] uppercase tracking-widest text-[#00F0FF] font-bold mb-3 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
              <Sparkles className="w-3 h-3"/> AI Рабочая Среда
            </span>
            <div className="flex-1 w-full border-2 border-dashed border-[#00F0FF]/30 rounded-lg bg-[var(--color-space-950)] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.05)_inset]">
               <div className="w-20 h-2 bg-[#00F0FF]/40 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-32 border-l border-[#00F0FF]/20 bg-[var(--color-space-900)]/80 backdrop-blur flex flex-col p-3 gap-2 translate-x-4 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
               <div className="text-[8px] text-[#00F0FF] uppercase font-bold tracking-wider mb-1 mt-1">Опции Панели</div>
               <div className="w-full h-4 bg-[#00F0FF]/20 rounded"></div>
               <div className="w-3/4 h-4 bg-[#00F0FF]/20 rounded"></div>
            </div>
          </div>
        </div>
      );
    case 'grid':
      return (
        <div className="flex h-[200px] w-full gap-3 p-3 bg-[var(--color-space-900)] rounded-xl border border-[var(--color-space-800)] relative z-10">
          <div className="w-[180px] shrink-0 rounded-lg bg-[var(--color-space-800)] border border-[rgba(255,255,255,0.05)] p-3 flex flex-col shadow-inner">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-3 flex items-center gap-2">
               <Layers className="w-3 h-3 text-[#B026FF]"/> Фильтры Библиотеки
            </span>
            <div className="w-full h-6 bg-black/40 rounded-md border border-[var(--color-space-700)] mb-2"></div>
            <div className="w-full h-6 bg-black/40 rounded-md border border-[var(--color-space-700)] mb-2"></div>
          </div>
          <div className="flex-1 rounded-lg bg-[var(--color-space-800)] border border-[rgba(255,255,255,0.05)] flex flex-col p-3 overflow-hidden shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                 <User className="w-3 h-3 text-[var(--color-neon-blue)]"/> Галерея Ассетов
              </span>
              <Sparkles className="w-3 h-3 text-[#00F0FF] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
            </div>
            <div className="grid grid-cols-4 gap-2 flex-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-black/30 rounded-lg border border-[var(--color-space-700)] flex items-center justify-center overflow-hidden group hover:border-[#00F0FF]/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all cursor-pointer">
                  <div className="w-full h-full bg-[var(--color-space-700)] group-hover:bg-[#00F0FF]/20 transition-colors"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'timeline':
      return (
        <div className="flex flex-col h-[200px] w-full gap-2 p-2 bg-[var(--color-space-900)] rounded-xl border border-[var(--color-space-800)] relative z-10">
          <div className="flex flex-1 gap-2 overflow-hidden">
             <div className="w-48 bg-[var(--color-space-800)] rounded-lg border border-[rgba(255,255,255,0.05)] flex items-center justify-center flex-col gap-2 relative shadow-inner">
               <Film className="w-6 h-6 text-[#B026FF] drop-shadow-[0_0_8px_rgba(176,38,255,0.5)]" />
               <span className="text-[9px] text-[#B026FF] font-bold tracking-widest uppercase">Asset Bin</span>
             </div>
             <div className="flex-1 bg-black rounded-lg border border-[var(--color-space-800)] flex items-center justify-center relative shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
               <Play className="w-8 h-8 text-white hover:text-[#00F0FF] cursor-pointer transition-colors shadow-[0_0_15px_rgba(0,240,255,0.5)] rounded-full bg-slate-800/80 p-1" />
               <Maximize className="w-4 h-4 absolute top-3 right-3 text-white/50 hover:text-white transition-colors cursor-pointer" />
             </div>
          </div>
          <div className="h-20 shrink-0 bg-[var(--color-space-800)] rounded-lg border border-[rgba(255,255,255,0.05)] p-1 flex gap-1 relative overflow-hidden shadow-inner">
            <div className="w-12 bg-black/40 border-r border-[var(--color-space-700)] h-full z-10 flex flex-col justify-around py-1">
               <div className="text-[8px] text-slate-400 text-center font-bold">V-1</div>
               <div className="text-[8px] text-slate-400 text-center font-bold">A-1</div>
            </div>
            <div className="absolute left-14 right-0 top-0 bottom-0 grid grid-rows-2 gap-1 py-1 px-2">
              <div className="h-full flex items-center relative overflow-hidden rounded bg-black/20">
                 <div className="absolute left-10 w-32 h-full bg-[#00F0FF]/20 border border-[#00F0FF]/50 rounded-md shadow-[0_0_10px_rgba(0,240,255,0.2)]"></div>
                 <div className="absolute left-44 w-40 h-full bg-[#00F0FF]/20 border border-[#00F0FF]/50 rounded-md shadow-[0_0_10px_rgba(0,240,255,0.2)]"></div>
              </div>
              <div className="h-full flex items-center relative rounded bg-black/20">
                 <div className="absolute left-4 w-48 h-full bg-[#B026FF]/20 border border-[#B026FF]/50 rounded-md flex items-center overflow-hidden shadow-[0_0_10px_rgba(176,38,255,0.2)]">
                   <div className="w-full h-px bg-[#B026FF]/80 scale-y-150 relative"></div>
                 </div>
              </div>
            </div>
            <div className="absolute top-0 bottom-0 left-[35%] w-px bg-rose-500 z-20 shadow-[0_0_8px_rgba(244,63,94,1)]">
               <div className="absolute top-0 -left-1 w-2 h-2.5 bg-rose-500 rounded-b cursor-ew-resize"></div>
            </div>
          </div>
        </div>
      );
    case 'master-detail':
      return (
        <div className="flex h-[200px] w-full gap-3 p-3 bg-[var(--color-space-900)] rounded-xl border border-[var(--color-space-800)] relative z-10">
          <div className="w-[200px] rounded-lg bg-[var(--color-space-800)] border border-[rgba(255,255,255,0.05)] p-3 flex flex-col gap-2 shadow-inner">
            <span className="text-[9px] uppercase tracking-widest text-[#B026FF] font-bold flex items-center gap-2 mb-1 drop-shadow-md">
               <AlignLeft className="w-3 h-3"/> Структура / Главы
            </span>
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-8 rounded-md flex items-center px-2 transition-colors cursor-pointer ${i === 1 ? 'bg-[#00F0FF]/10 border border-[#00F0FF]/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]' : 'bg-black/30 hover:bg-black/50'}`}>
                <div className={`w-3/4 h-1.5 rounded ${i === 1 ? 'bg-[#00F0FF] shadow-[0_0_5px_rgba(0,240,255,0.8)]' : 'bg-slate-600'}`}></div>
              </div>
            ))}
          </div>
          <div className="flex-1 rounded-lg bg-[var(--color-space-800)] border border-[rgba(255,255,255,0.05)] flex flex-col p-5 shadow-inner">
             <div className="flex justify-between items-center mb-4 border-b border-[var(--color-space-700)] pb-2">
               <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">WYSIWYG Редактор Текста</span>
               <div className="w-16 h-5 bg-black/40 rounded border border-[var(--color-space-700)]"></div>
             </div>
             <div className="space-y-3">
               <div className="w-1/3 h-2.5 bg-slate-500 rounded mx-auto"></div>
               <div className="flex flex-col gap-2 px-10">
                 <div className="w-full h-1.5 bg-slate-600 rounded"></div>
                 <div className="w-full h-1.5 bg-slate-600 rounded"></div>
                 <div className="w-5/6 h-1.5 bg-slate-600 rounded"></div>
               </div>
               <div className="w-1/4 h-2 bg-[#00F0FF]/40 rounded mx-auto mt-4 mb-2 shadow-[0_0_8px_rgba(0,240,255,0.3)]"></div>
               <div className="flex flex-col gap-2 px-16 text-center">
                 <div className="w-full h-1.5 bg-slate-600 rounded"></div>
                 <div className="w-2/3 h-1.5 bg-slate-600 rounded mx-auto"></div>
               </div>
             </div>
          </div>
        </div>
      );
  }
}
