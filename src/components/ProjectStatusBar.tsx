import { ShieldCheck, Database, Workflow, Unlock, Menu, Bot } from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';

export function ProjectStatusBar({ 
  activeStepIndex, 
  unlockedSteps,
  onUnlockAll,
  onToggleSidebar,
  onToggleAssistant
}: { 
  activeStepIndex: number; 
  unlockedSteps: string[];
  onUnlockAll?: () => void;
  onToggleSidebar: () => void;
  onToggleAssistant: () => void;
}) {
  return (
    <div className="min-h-[56px] py-2 w-full border-b border-[var(--color-space-700)] glass-panel rounded-none flex flex-wrap items-center justify-between gap-3 px-3 sm:px-6 shrink-0 z-30 sticky top-0 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 sm:gap-6">
        <button 
          id="header-toggle-sidebar-btn"
          onClick={onToggleSidebar}
          className="p-1.5 sm:p-2 text-slate-100 hover:text-[#00F0FF] hover:bg-[#00F0FF]/15 border border-slate-500 hover:border-[#00F0FF]/50 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.3)] bg-slate-800/60 active:scale-90"
          title="Скрыть/показать панель навигации (сайдбар)"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold tracking-wide uppercase">Активный Проект</span>
          <span className="text-sm text-white font-bold flex items-center gap-2">
            Aura Space Movie <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF] drop-shadow-[0_0_5px_rgba(0,240,255,0.6)]" />
          </span>
        </div>
        
        <div className="hidden sm:block h-6 w-px bg-[var(--color-space-800)] shadow-[1px_0_0_rgba(255,255,255,0.05)]"></div>
        
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-medium overflow-hidden whitespace-nowrap">
          <Workflow className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
          <span className="hidden sm:inline">Статус пайплайна:</span>
          <AnimatePresence mode="wait">
            <motion.span 
              key={activeStepIndex}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-[#00F0FF] font-mono sm:ml-1 bg-[#00F0FF]/10 px-2 sm:px-2.5 py-0.5 rounded border border-[#00F0FF]/20 font-bold shadow-[0_0_10px_rgba(0,240,255,0.1)] inline-block relative"
            >
              ЭТАП {activeStepIndex + 1}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
        {onUnlockAll && (
          <button 
            onClick={onUnlockAll}
            className="hidden sm:flex items-center gap-2 cyber-btn px-3 py-1.5 rounded-md text-[#B026FF] font-bold active:scale-95 transition-transform"
          >
            <Unlock className="w-3.5 h-3.5" /> Свободный доступ
          </button>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 glass-card px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-[var(--color-space-700)] text-slate-300 font-medium shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <Database className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="hidden sm:inline">Слои Памяти:</span>
          <span className="text-white font-mono font-bold flex items-center">
             <AnimatePresence mode="popLayout" initial={false}>
               <motion.span
                 key={unlockedSteps.length}
                 initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                 animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                 exit={{ opacity: 0, scale: 1.5, filter: "blur(4px)" }}
                 className="inline-block text-[#B026FF] drop-shadow-[0_0_8px_rgba(176,38,255,0.8)] mx-1"
               >
                 {unlockedSteps.length - 1}
               </motion.span>
             </AnimatePresence>
             <span className="hidden lg:inline ml-1">Зафиксировано</span>
          </span>
        </div>

        <button 
          id="header-toggle-assistant-btn"
          onClick={onToggleAssistant}
          className="p-1.5 sm:p-2 text-[#00F0FF] hover:text-white bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF]/50 hover:border-[#00F0FF]/80 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)] active:scale-90"
          title="Скрыть/показать ИИ-помощника"
        >
          <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
