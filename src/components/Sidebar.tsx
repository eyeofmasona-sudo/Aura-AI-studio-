import React, { useEffect, useState } from 'react';
import { 
  Lightbulb, Users, BookOpen, Image as ImageIcon, 
  Video, Music, Mic, Sliders, Film, Download,
  Lock, CheckCircle2, LayoutTemplate, X,
  Folder, Plus, Trash2, Save as SaveIcon
} from 'lucide-react';
import { StepSpec } from '../types';
import { ProjectsStore, Project, SavedFile } from '../services/projectsStore';
import { FileViewerModal } from './FileViewerModal';

const Icons: Record<string, any> = {
  Lightbulb, Users, BookOpen, Image: ImageIcon,
  Video, Music, Mic, Sliders, Film, Download
};

export function Sidebar({ 
  steps, 
  activeStepId, 
  unlockedSteps,
  approvedSteps,
  onSelect,
  onClose,
  onActionClick
}: { 
  steps: StepSpec[], 
  activeStepId: string,
  unlockedSteps: string[],
  approvedSteps: string[],
  onSelect: (id: string) => void,
  onClose?: () => void,
  onActionClick?: (action: string, title: string, inputs: string[]) => void
}) {
  const store = ProjectsStore.getInstance();
  const [projects, setProjects] = useState<Project[]>(store.projects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(store.activeProjectId);
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [selectedFileObj, setSelectedFileObj] = useState<SavedFile | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setProjects([...store.projects]);
      setActiveProjectId(store.activeProjectId);
    });
    return unsub;
  }, [store]);

  const handleSaveCurrent = () => {
    const pName = store.saveCurrentProject();
    alert(`Все данные и файлы проекта "${pName}" успешно сохранены в локальную базу данных!`);
  };

  const handleLoadProject = (id: string) => {
    if (confirm("Вы желаете загрузить этот проект? Это сменит активные данные, файлы и состояние всех разделов студии.")) {
      store.loadProject(id);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Вы действительно хотите удалить этот проект? Это уничтожит все его сохраненные файлы.")) {
      store.deleteProject(id);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    store.createProject(newProjectName, newProjectDesc);
    setNewProjectName("");
    setNewProjectDesc("");
    setShowCreatePrompt(false);
    alert("Проект успешно создан и запущен!");
  };

  return (
    <div className="w-72 glass-panel border-r border-[var(--color-space-800)] h-full flex flex-col z-10 box-border shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      <div className="p-5 border-b border-[var(--color-space-800)] bg-black/20 flex justify-between items-start shrink-0">
        <div>
          <div className="flex flex-col items-center justify-center w-full mt-2 mb-4 relative">
            <div className="relative w-24 h-24 mb-1">
              <div className="absolute inset-0 bg-[#00F0FF]/10 blur-[20px] rounded-full"></div>
              <img 
                 src="/logo.png" 
                 alt="Aura AI Studio"
                 className="w-full h-full object-contain relative z-20"
                 onError={(e) => {
                   (e.target as HTMLImageElement).style.display = 'none';
                   const svgFallback = document.getElementById('sidebar-logo-fallback');
                   if (svgFallback) svgFallback.style.display = 'block';
                 }}
              />
              <svg id="sidebar-logo-fallback" viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] hidden">
                <defs>
                  <linearGradient id="metal" x1="20%" y1="0%" x2="80%" y2="100%">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="30%" stopColor="#94a3b8" />
                    <stop offset="50%" stopColor="#cbd5e1" />
                    <stop offset="70%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#f1f5f9" />
                  </linearGradient>
                  <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="30%" stopColor="#00F0FF" />
                    <stop offset="70%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#B026FF" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* A letter shapes */}
                <path d="M50 15 L80 85 L62 85 L50 50 L38 85 L20 85 Z" fill="url(#metal)" />
                <path d="M35 70 L65 70 L60 55 L40 55 Z" fill="url(#metal)" />
                
                {/* Center Sparkle */}
                <path d="M50 40 Q50 48 44 50 Q50 52 50 60 Q50 52 56 50 Q50 48 50 40 Z" fill="#00F0FF" filter="url(#glow)" />

                {/* Film Strip Swoosh Base */}
                <path d="M10 70 Q 30 50, 55 65 T 90 45 L 95 60 Q 70 85, 45 70 T 5 80 Z" fill="url(#blueGlow)" filter="url(#glow)" />
                
                {/* Film Strip Accents/Holes */}
                <g fill="#020617" opacity="0.8">
                   <rect x="55" y="55" width="2.5" height="4" transform="rotate(-20 56 57)" />
                   <rect x="62" y="52" width="2.5" height="4" transform="rotate(-25 63 54)" />
                   <rect x="69" y="49" width="2.5" height="4" transform="rotate(-30 70 51)" />
                   <rect x="76" y="46" width="2.5" height="4" transform="rotate(-35 77 48)" />
                   <rect x="83" y="43" width="2.5" height="4" transform="rotate(-40 84 45)" />
                   
                   <rect x="58" y="65" width="2.5" height="4" transform="rotate(-20 59 67)" />
                   <rect x="65" y="62" width="2.5" height="4" transform="rotate(-25 66 64)" />
                   <rect x="72" y="59" width="2.5" height="4" transform="rotate(-30 73 61)" />
                   <rect x="79" y="56" width="2.5" height="4" transform="rotate(-35 80 58)" />
                   <rect x="86" y="53" width="2.5" height="4" transform="rotate(-40 87 55)" />
                </g>
              </svg>
            </div>
            
            <div className="flex items-center gap-1.5 font-bold tracking-widest text-xl z-10 font-sans px-2">
              <span className="text-slate-200">Aura</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#3b82f6] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] px-0.5">AI</span>
              <span className="text-slate-200">Studio</span>
            </div>
            <p className="text-[9px] text-[#00F0FF] uppercase tracking-widest font-bold mt-2 opacity-80">Спецификация AI-Студии</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1.5 custom-scrollbar">
        
        <button
          onClick={() => onSelect('vision')}
          className={`
            relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left mb-2.5
            ${activeStepId === 'vision' 
              ? 'bg-[var(--color-space-800)] text-[#00F0FF] border border-[rgba(0,240,255,0.3)] shadow-[0_0_10px_rgba(0,240,255,0.1)]' 
              : 'text-slate-400 hover:bg-[var(--color-space-800)] hover:text-slate-200 border border-transparent'}
          `}
        >
          <LayoutTemplate className="w-4 h-4 shrink-0" />
          <span className="text-sm font-bold tracking-wide">Видение продукта</span>
        </button>

        <button
          onClick={() => onSelect('usage_models')}
          className={`
            relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left mb-2.5
            ${activeStepId === 'usage_models' 
              ? 'bg-[var(--color-space-800)] text-[#b026ff] border border-[rgba(176,38,255,0.3)] shadow-[0_0_10px_rgba(176,38,255,0.1)]' 
              : 'text-slate-400 hover:bg-[var(--color-space-800)] hover:text-slate-200 border border-transparent'}
          `}
        >
          <Sliders className="w-4 h-4 shrink-0 text-[#00F0FF]" />
          <span className="text-sm font-bold tracking-wide">Использование и ИИ</span>
        </button>

        <div className="text-[9px] uppercase text-slate-500 font-bold tracking-widest px-3 mb-2.5 mt-2">Пайплайн производства</div>

        {steps.map((step) => {
          const Icon = Icons[step.icon];
          const isActive = step.id === activeStepId;
          const isUnlocked = unlockedSteps.includes(step.id);
          const isApproved = approvedSteps.includes(step.id);
          
          return (
            <div key={step.id}>
              <button
                disabled={!isUnlocked}
                onClick={() => onSelect(step.id)}
                className={`
                  relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group
                  ${isActive ? 'glass-card text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] font-bold' 
                    : isUnlocked 
                      ? 'text-slate-400 hover:bg-[var(--color-space-800)] hover:text-slate-200 border border-transparent font-medium' 
                      : 'text-slate-600 cursor-not-allowed border border-transparent font-medium opacity-60'}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-[#00F0FF] to-[#B026FF] rounded-r-md shadow-[0_0_8px_rgba(0,240,255,0.6)]"></div>
                )}
                
                <div className={`relative z-10 flex items-center justify-center w-5 shrink-0 ${isActive ? 'text-[#00F0FF] drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]' : ''}`}>
                  {Icon && <Icon className="w-4 h-4" />}
                </div>
                
                <span className="relative z-10 text-[13px] flex-1 truncate leading-tight mt-[1px]">{step.title}</span>

                {isApproved && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 drop-shadow-[0_0_3px_rgba(52,211,153,0.8)]" />
                )}
                {!isUnlocked && (
                  <Lock className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                )}
              </button>

              {isActive && (
                <div className="px-3 py-3 mt-2 mb-3 bg-black/30 border border-[#00F0FF]/10 rounded-lg shadow-inner flex flex-col gap-3 ml-2 border-l border-l-[#00F0FF]/30">
                  <div>
                    <span className="text-[9px] text-[#00F0FF] uppercase font-bold tracking-widest block mb-1.5">Входные данные (Inputs)</span>
                    <div className="flex flex-wrap gap-1">
                      {step.details.inputs.map((input, i) => (
                        <button key={i} onClick={() => onActionClick && onActionClick(`Ввод: ${input}`, step.title, step.details.inputs)} className="text-[9px] bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/25 hover:border-[#00F0FF]/60 px-1.5 py-0.5 rounded truncate max-w-[200px] transition-all text-left">{input}</button>
                      ))}
                    </div>
                  </div>
                  {step.details.generatedAssets && step.details.generatedAssets.length > 0 && (
                    <div>
                      <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest block mb-1.5">Ассеты (Кэш)</span>
                      <div className="flex flex-wrap gap-1">
                        {step.details.generatedAssets.map((asset, i) => (
                          <button key={i} onClick={() => onActionClick && onActionClick(`Ассет: ${asset}`, step.title, step.details.inputs)} className="text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/60 px-1.5 py-0.5 rounded truncate max-w-[200px] transition-all text-left">{asset}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* РАЗДЕЛ: ПРОЕКТЫ И ФАЙЛЫ */}
        <div className="pt-4 border-t border-slate-800/80 mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between px-3 text-[10px] uppercase text-slate-400 font-bold tracking-widest">
            <span className="flex items-center gap-1.5 text-[#00F0FF]">
              <Folder className="w-3.5 h-3.5 text-[#00F0FF]" /> Проекты ({projects.length})
            </span>
            <button 
              id="create-new-project-toggle-btn"
              onClick={() => setShowCreatePrompt(true)}
              className="p-1 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 hover:bg-[#00F0FF]/25 hover:border-[#00F0FF]/50 transition-all flex items-center justify-center cursor-pointer"
              title="Создать новый проект"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Быстрая кнопка "СОХРАНИТЬ ВСЁ" */}
          <div className="px-2">
            <button
              id="sidebar-save-project-btn"
              onClick={handleSaveCurrent}
              className="w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-[#00F0FF]/15 to-[#B026FF]/15 hover:from-[#00F0FF]/25 hover:to-[#B026FF]/25 border border-[#00F0FF]/30 hover:border-[#00F0FF]/60 text-[#00F0FF] rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(0,240,255,0.05)] cursor-pointer"
            >
              <SaveIcon className="w-3.5 h-3.5" />
              <span>Сохранить всё</span>
            </button>
          </div>

          {/* Форма создания проекта */}
          {showCreatePrompt && (
            <form onSubmit={handleCreateProject} className="bg-[#101524] border border-[#00F0FF]/30 rounded-xl p-3 mx-2 flex flex-col gap-2 text-left animate-slide-in">
              <span className="text-[9px] uppercase font-bold text-slate-400">Новый проект:</span>
              <input 
                type="text" 
                placeholder="Название проекта" 
                value={newProjectName} 
                onChange={e => setNewProjectName(e.target.value)}
                required
                className="w-full bg-black/40 border border-slate-700/80 rounded p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50"
              />
              <input 
                type="text" 
                placeholder="Краткое описание" 
                value={newProjectDesc} 
                onChange={e => setNewProjectDesc(e.target.value)}
                className="w-full bg-black/40 border border-slate-700/80 rounded p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50"
              />
              <div className="flex gap-1.5 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowCreatePrompt(false)} 
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase font-bold"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="px-2 py-1 rounded bg-[#00F0FF] text-black hover:bg-[#4dffff] text-[10px] uppercase font-bold"
                >
                  Создать
                </button>
              </div>
            </form>
          )}

          {/* Список Проектов */}
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto custom-scrollbar px-1 mt-1">
            {projects.map(p => {
              const isActive = p.id === activeProjectId;
              return (
                <div key={p.id} className={`rounded-lg border p-2 transition-all flex flex-col gap-1.5 ${
                  isActive 
                    ? 'bg-[#101524] border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.05)]' 
                    : 'bg-black/20 border-slate-800 hover:border-slate-700'
                }`}>
                  <div className="flex items-center justify-between gap-1.5">
                    <button 
                      id={`load-project-${p.id}`}
                      onClick={() => handleLoadProject(p.id)} 
                      className={`text-xs font-bold text-left truncate flex-1 hover:text-[#00F0FF] transition-all cursor-pointer ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                      title="Кликните, чтобы загрузить этот проект"
                    >
                      📁 {p.name}
                    </button>
                    {projects.length > 1 && (
                      <button 
                        id={`delete-project-${p.id}`}
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                        className="p-1 px-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 opacity-60 hover:opacity-100 transition-all"
                        title="Удалить проект"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {p.description && (
                    <p className="text-[10px] text-slate-500 leading-tight px-1 truncate">{p.description}</p>
                  )}

                  {/* Сгенерированные Файлы Проекта (показываем только для активного проекта) */}
                  {isActive && (
                    <div className="flex flex-col gap-1 border-t border-slate-800/80 pt-1.5 pl-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Файлы проекта:</span>
                      {p.files && p.files.length > 0 ? (
                        p.files.map(f => (
                          <button
                            id={`view-file-${f.id}`}
                            key={f.id}
                            onClick={() => setSelectedFileObj(f)}
                            className="text-[11px] text-slate-400 hover:text-white hover:bg-slate-800/50 px-1 py-1 rounded text-left truncate flex items-center gap-1 transition-all"
                          >
                            📄 {f.name}
                          </button>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Файлы отсутствуют. Нажмите сохранить.</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedFileObj && (
        <FileViewerModal 
          file={selectedFileObj} 
          onClose={() => setSelectedFileObj(null)} 
        />
      )}
    </div>
  );
}
