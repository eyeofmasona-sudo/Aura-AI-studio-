import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StepSpec } from '../types';
import { PromptBuilder } from './PromptBuilder';
import { AiStore, aiFunctionRegistry } from '../services/aiStore';
import { 
  CheckCircle2, AlertCircle, Loader2, LayoutDashboard,
  Server, Check, Lock, ChevronRight, Puzzle, Terminal, Play, FileText, Volume2, Sparkles
} from 'lucide-react';

export function SpecDetail({ 
  spec, 
  isApproved, 
  onApprove 
}: { 
  spec: StepSpec;
  isApproved: boolean;
  onApprove: () => void;
  key?: React.Key;
}) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const [sfxResult, setSfxResult] = useState<string | null>(null);
  const [isGeneratingSfx, setIsGeneratingSfx] = useState(false);

  const handleActionClick = async (action: string) => {
    if (isLoadingAction) return;
    setActiveAction(action);
    setActionResult(null);
    setIsLoadingAction(true);
    
    try {
      // Find registered function
      const registered = aiFunctionRegistry.find(f => f.label === action || f.functionName === action);
      const functionName = registered ? registered.functionName : "genericAction";
      const moduleName = registered ? registered.module : spec.id;

      const result = await AiStore.getInstance().requestExecution({
        module: moduleName,
        functionName,
        inputs: spec.details.inputs,
        actionName: action,
      });

      setActionResult(result);
    } catch (err: any) {
      setActionResult(`Ошибка ИИ: ${err.message}`);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const generateRandomSfx = async () => {
    if (isGeneratingSfx) return;
    setIsGeneratingSfx(true);
    setSfxResult(null);
    try {
      const result = await AiStore.getInstance().requestExecution({
        module: "audio_editor",
        functionName: "selectSfx",
        inputs: ["Случайная идея для SFX", "Параметры аудио", "Продолжительность"],
        actionName: "Сгенерировать случайный SFX (шумовой эффект) из текста / Конвейер SFX",
      });

      setSfxResult(result);
    } catch (err: any) {
      setSfxResult(`Ошибка генерации: ${err.message}`);
    } finally {
      setIsGeneratingSfx(false);
    }
  };

  if (!spec) return null;

  const showSfxGenerator = spec.title.toLowerCase().includes('музыка') || spec.title.toLowerCase().includes('аудиоредактор') || spec.title.toLowerCase().includes('звук');

  return (
    <motion.div 
      key={spec.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-6xl mx-auto w-full pb-32 text-slate-200"
    >
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md glass-card border-[var(--color-space-700)] shadow-[0_0_10px_rgba(0,240,255,0.1)] text-[#00F0FF] text-[10px] uppercase font-bold tracking-widest mb-4">
            <Puzzle className="w-3 h-3" />
            Схема Экрана: {spec.layout}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3 drop-shadow-md">
            {spec.title}
          </h1>
          <p className="text-[15px] text-slate-400 leading-relaxed max-w-3xl font-medium">
            {spec.goal}
          </p>
        </div>
        
        {isApproved && (
           <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.2)]">
             <Lock className="w-4 h-4 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
             <span className="text-xs font-bold uppercase tracking-wider">Модуль Зафиксирован</span>
           </div>
        )}
      </div>

      <div className="flex flex-col gap-8 mb-10">
        
        <Section title="Интерактивные Панели Системы" icon={<LayoutDashboard className="w-4 h-4 text-[#00F0FF]" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PanelDescription title="Левая Панель" items={spec.sections.leftPanel} onAction={handleActionClick} loadingAction={isLoadingAction ? activeAction : null} />
            <PanelDescription title="Центр (Work Area)" items={spec.sections.mainWorkspace} onAction={handleActionClick} loadingAction={isLoadingAction ? activeAction : null} />
            <PanelDescription title="Сбоку (ИИ-Ассистент)" items={spec.sections.rightAIPanel} highlight onAction={handleActionClick} loadingAction={isLoadingAction ? activeAction : null} />
            {spec.sections.bottomArea && (
              <PanelDescription title="Нижняя Панель" items={spec.sections.bottomArea} onAction={handleActionClick} loadingAction={isLoadingAction ? activeAction : null} />
            )}
          </div>

          <AnimatePresence>
            {(isLoadingAction || actionResult) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 bg-black/40 border border-[#00F0FF]/30 rounded-lg p-5 overflow-hidden shadow-inner"
              >
                <h5 className="flex items-center gap-2 text-[#00F0FF] text-[12px] uppercase font-bold tracking-widest mb-3">
                   <Terminal className="w-4 h-4" /> Исполнение Функции / ИИ Ответ: {activeAction}
                </h5>
                {isLoadingAction ? (
                  <div className="flex items-center gap-3 text-sm text-slate-400 p-3 bg-black/50 rounded-lg border border-[var(--color-space-800)]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#B026FF]" />
                    Выполнение функции и генерация ответа алгоритма...
                  </div>
                ) : (
                  <div className="text-sm text-slate-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar p-4 bg-black/60 rounded-lg border border-[var(--color-space-800)] leading-relaxed shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                    {actionResult}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Section>
        
        <Section title="Сильный Prompt-Инженер (Prompt Builder)" icon={<Terminal className="w-4 h-4 text-[#00F0FF]" />}>
          <PromptBuilder moduleTitle={spec.title} />
        </Section>

        {/* COMBINED WIDE SFX / HANDOFF BLOCK */}
        <div className={`rounded-2xl border shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all ${isApproved ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-[var(--color-space-950)] border-[#00F0FF]/30 relative overflow-hidden group'}`}>
             {!isApproved && <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/10 to-[#B026FF]/10 opacity-50 pointer-events-none"></div>}
            
            <div className="relative z-10 flex flex-col md:flex-row p-6 md:p-8 gap-8 items-center justify-between">
               
               {/* Left side: Info / SFX */}
               <div className="flex-1 w-full space-y-6">
                 <div>
                   <h4 className={`flex items-center gap-2 text-[16px] font-bold uppercase tracking-widest mb-3 ${isApproved ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'text-[#00F0FF] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]'}`}>
                     <CheckCircle2 className="w-5 h-5" /> Передача Контекста (Handoff)
                   </h4>
                   <p className="text-[15px] text-slate-300 leading-relaxed font-medium">
                     {spec.handoff.description}
                   </p>
                 </div>
                 
                 <div className="bg-black/40 p-4 rounded-xl border border-[var(--color-space-800)] shadow-inner inline-block w-full">
                   <span className="text-[10px] text-[#B026FF] uppercase font-bold tracking-widest block mb-2">Блокирует / Передает связи:</span>
                   <div className="flex flex-wrap gap-3">
                     {spec.handoff.lockedDependencies.map(dep => (
                       <div key={dep} className="text-[12px] text-slate-300 font-bold flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-[var(--color-space-700)] shadow-sm">
                         <Lock className="w-3.5 h-3.5 text-[#00F0FF]" /> {dep}
                       </div>
                     ))}
                   </div>
                 </div>

                 {showSfxGenerator && (
                   <div className="mt-4 p-5 border border-[#B026FF]/30 rounded-xl bg-[#B026FF]/5 flex flex-col xl:flex-row gap-5 items-center justify-between shadow-[0_0_15px_rgba(176,38,255,0.05)]">
                     <div className="flex-1">
                       <h5 className="text-[#B026FF] text-[12px] uppercase font-bold tracking-widest mb-1.5 flex items-center gap-2"><Volume2 className="w-4 h-4"/> ИИ Генератор SFX</h5>
                       <p className="text-[12px] text-slate-300">Случайная генерация шумового эффекта (SFX) из текстового концепта.</p>
                     </div>
                     <button 
                       onClick={generateRandomSfx}
                       disabled={isGeneratingSfx}
                       className="w-full xl:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[12px] font-bold text-white uppercase tracking-widest bg-gradient-to-r from-[#B026FF]/20 to-[#B026FF]/50 border border-[#B026FF]/50 hover:from-[#B026FF]/30 hover:to-[#B026FF]/60 transition-all shadow-[0_0_15px_rgba(176,38,255,0.3)] hover:shadow-[0_0_25px_rgba(176,38,255,0.5)] disabled:opacity-50"
                     >
                       {isGeneratingSfx ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                       {isGeneratingSfx ? 'Генерация...' : 'Сгенерировать'}
                     </button>
                   </div>
                 )}
                 <AnimatePresence>
                   {sfxResult && (
                     <motion.div 
                       initial={{ opacity: 0, height: 0, marginTop: 0 }}
                       animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                       exit={{ opacity: 0, height: 0, marginTop: 0 }}
                       className="bg-black/60 border border-[#B026FF]/40 rounded-xl p-5 overflow-hidden shadow-inner"
                     >
                       <h5 className="text-[#B026FF] text-[10px] uppercase font-bold tracking-widest mb-3 flex items-center gap-1.5">
                         <FileText className="w-3.5 h-3.5" /> Результат ИИ
                       </h5>
                       <div className="text-[13px] text-slate-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar leading-relaxed">
                         {sfxResult}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>

               {/* Right side: Action Button */}
               <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-[var(--color-space-800)] pt-8 md:pt-0 md:pl-10 flex flex-col items-center justify-center">
                 {!isApproved ? (
                    <button 
                      onClick={onApprove}
                      className="w-full flex items-center justify-center gap-3 cyber-btn text-white text-[15px] font-bold py-5 px-6 rounded-2xl transition-all shimmer-btn-container group shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:shadow-[0_0_45px_rgba(0,240,255,0.6)]"
                    >
                      <span className="relative z-20 flex items-center justify-between w-full">
                        <span>{spec.handoff.actionName}</span> 
                        <span className="w-10 h-10 rounded-full bg-[#00F0FF]/20 flex items-center justify-center group-hover:bg-[#00F0FF] transition-colors"><ChevronRight className="w-6 h-6 text-[#00F0FF] group-hover:text-black transition-colors"/></span>
                      </span>
                    </button>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center gap-3 bg-emerald-500/10 text-emerald-400 py-8 px-4 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(52,211,153,0.15)] cursor-default text-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                        <Check className="w-7 h-7 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"/> 
                      </div>
                      <span className="text-[16px] font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">Утверждено</span>
                      <span className="text-[12px] text-emerald-500/80 font-medium">Модуль защищен</span>
                    </div>
                  )}
               </div>

            </div>
        </div>

      </div>
    </motion.div>
  );
}

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <h4 className="flex items-center gap-2 text-[11px] font-bold text-white uppercase tracking-widest mb-5">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

function Pill({ text, variant="default", icon }: { text: string, variant?: "default"|"action"|"asset", icon?: React.ReactNode, key?: import('react').Key }) {
  const styles = {
    default: "bg-[var(--color-space-900)] border-[var(--color-space-800)] text-slate-300 shadow-sm font-semibold",
    action: "bg-gradient-to-r from-slate-200 to-slate-300 border-slate-300 text-black shadow-[0_0_10px_rgba(255,255,255,0.2)] font-bold",
    asset: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.3)] font-bold"
  };
  return (
    <span className={`text-[11px] px-2.5 py-1.5 border rounded-md whitespace-nowrap flex items-center gap-1.5 ${styles[variant]}`}>
      {icon}
      {text}
    </span>
  );
}

function PanelDescription({ 
  title, 
  items, 
  highlight=false, 
  onAction,
  loadingAction
}: { 
  title: string, 
  items: string[], 
  highlight?: boolean,
  onAction: (item: string) => void,
  loadingAction: string | null
}) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col h-full ${highlight ? 'bg-[#00F0FF]/5 border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.05)]' : 'bg-black/30 border-[var(--color-space-800)]'}`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 pb-2 border-b border-[var(--color-space-800)] ${highlight ? 'text-[#00F0FF]' : 'text-slate-400'}`}>
        <span className={highlight ? 'w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_5px_rgba(0,240,255,0.8)]' : 'w-2 h-2 rounded-full bg-slate-500'}></span> {title}
      </span>
      <div className="flex flex-col gap-2 flex-1">
        {items.map((item, idx) => {
          const isLoading = loadingAction === item;
          return (
            <button 
              key={idx}
              onClick={() => onAction(item)}
              disabled={loadingAction !== null && loadingAction !== item}
              className={`text-left text-[12px] flex items-start gap-2.5 px-3 py-2.5 rounded-lg border transition-all ${
                isLoading 
                ? 'bg-gradient-to-r from-[#B026FF]/30 to-[#00F0FF]/30 border-[#00F0FF]/50 text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                : highlight
                  ? 'bg-black/40 border-[#00F0FF]/20 text-[#00F0FF] hover:bg-[#00F0FF]/15 hover:border-[#00F0FF]/60 hover:shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'bg-black/40 border-[var(--color-space-700)] text-slate-300 hover:bg-[var(--color-space-800)] hover:border-slate-500 hover:text-white'
              }`}
            >
              {isLoading ? (
                <Loader2 className={`w-3.5 h-3.5 shrink-0 mt-[1px] animate-spin ${highlight ? 'text-[#00F0FF]' : 'text-[#B026FF]'}`} />
              ) : (
                <Play className={`w-3.5 h-3.5 shrink-0 mt-[1px] ${highlight ? 'text-[#00F0FF]' : 'text-slate-500'}`} />
              )}
              <span className="leading-snug font-medium">{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}



