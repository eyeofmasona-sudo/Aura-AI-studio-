import React, { useState, useEffect } from 'react';
import { 
  Upload, User, X, Sparkles, Wand2, Copy, 
  Save, Forward, Loader2, MessageSquare, Edit3,
  RefreshCcw, AlertCircle, CheckCircle2, ChevronRight, Menu, Plus, Trash2, GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Chapter {
  id: string;
  title: string;
  summary: string;
  emotionalGoal: string;
  plotFunction: string;
}

interface Scene {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  location: string;
  characters: string;
  conflict: string;
  action: string;
  dialogueNotes: string;
  emotionalBeat: string;
  visualNotes: string;
  audioNotes: string;
}

interface DialogueLine {
  id: string;
  sceneId: string;
  character: string;
  text: string;
  emotion: string;
  pauses: string;
  intonation: string;
}

interface ScenarioState {
  importedIdeaPrompt: string | null;
  importedCharacters: any[];
  scriptDraft: string;
  selectedStructure: string | null;
  selectedDuration: string | null;
  selectedFormat: string | null;
  chapters: Chapter[];
  selectedChapterId: string | null;
  scenes: Scene[];
  selectedSceneId: string | null;
  dialogueLines: DialogueLine[];
  finalScript: string;
  aiSuggestions: { id: string; title: string; text: string; type: string }[];
  validationErrors: Record<string, string>;
  isGenerating: boolean;
}

interface ScenarioModuleProps {
  key?: string | number;
  onApprove: () => void;
  isApproved?: boolean;
}

export function ScenarioModule({ onApprove, isApproved }: ScenarioModuleProps) {
  const [state, setState] = useState<ScenarioState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("aura_scenario_state");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse aura_scenario_state", e);
        }
      }
    }
    return {
      importedIdeaPrompt: null,
      importedCharacters: [],
      scriptDraft: "",
      selectedStructure: null,
      selectedDuration: null,
      selectedFormat: null,
      chapters: [],
      selectedChapterId: null,
      scenes: [],
      selectedSceneId: null,
      dialogueLines: [],
      finalScript: "",
      aiSuggestions: [],
      validationErrors: {},
      isGenerating: false
    };
  });

  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-save state to localStorage on state changes
  useEffect(() => {
    localStorage.setItem("aura_scenario_state", JSON.stringify(state));
  }, [state]);

  // Handle toast timeout
  useEffect(() => {
    if (localToast) {
      const timer = setTimeout(() => setLocalToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [localToast]);

  const [activeTab, setActiveTab] = useState<'draft' | 'chapters' | 'scenes' | 'dialogues' | 'final'>('draft');

  const STRUCTURES = [
    "3 акта", "5 актов", "Hero’s Journey", "Save the Cat", 
    "Короткий рекламный сценарий", "Клип/монтажная структура", 
    "Документальная структура", "Эпизодическая структура"
  ];
  
  const DURATIONS = [
    "15 секунд", "30 секунд", "60 секунд", "90 секунд", 
    "3 минуты", "5 минут", "Custom"
  ];

  const FORMATS = [
    "Вертикальное видео", "Горизонтальное видео", "Рекламный ролик", 
    "Трейлер", "Короткометражная сцена", "Музыкальный клип", "Презентационный ролик"
  ];

  const updateField = (field: keyof ScenarioState, value: any) => {
    setState(s => ({ ...s, [field]: value }));
  };

  const addSuggestion = (title: string, text: string, type: string) => {
    const newSug = { id: Math.random().toString(36).substr(2, 9), title, text, type };
    setState(s => ({ ...s, aiSuggestions: [...s.aiSuggestions, newSug] }));
  };

  const runAiAction = (title: string, prompt: string, callback: (res: string) => void) => {
    setState(s => ({ ...s, isGenerating: true }));
    setTimeout(() => {
      callback(`[Сгенерировано ИИ для: ${title}]\nЗдесь будет результат работы модели. ИИ помощник выполнил задачу: ${prompt}`);
      setState(s => ({ ...s, isGenerating: false }));
    }, 1500);
  };

  const importIdeaPrompt = () => {
    let contextStr = localStorage.getItem("aura_imported_idea_context");
    let parsed: any = null;

    if (!contextStr) {
      const nativeStr = localStorage.getItem("aura_idea_prompt_state");
      if (nativeStr) {
        try {
          const nativeParsed = JSON.parse(nativeStr);
          parsed = {
            ideaText: nativeParsed.ideaText,
            finalPrompt: nativeParsed.finalPrompt,
            logline: nativeParsed.generatedLogline,
            synopsis: nativeParsed.generatedSynopsis,
            selectedGenres: nativeParsed.selectedGenres,
            selectedMoods: nativeParsed.selectedMoods,
            selectedEra: nativeParsed.selectedEra,
            selectedVisualStyle: nativeParsed.selectedVisualStyle,
            selectedCameraStyle: nativeParsed.selectedCameraStyle
          };
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      try {
        parsed = JSON.parse(contextStr);
      } catch (e) {
        console.error(e);
      }
    }

    if (!parsed || (!parsed.ideaText && !parsed.finalPrompt && !parsed.logline && !parsed.synopsis)) {
      setLocalToast({ message: "Не обнаружено сохраненных идей или промптов. Сначала введите их на шаге «Идея»!", type: "error" });
      return;
    }

    const idea = parsed.ideaText || "";
    const prompt = parsed.finalPrompt || "";
    const logline = parsed.logline || parsed.generatedLogline || "";
    const synopsis = parsed.synopsis || parsed.generatedSynopsis || "";
    const genres = (parsed.selectedGenres || []).join(", ");
    const moods = (parsed.selectedMoods || []).join(", ");
    
    let importText = `📌 [ИМПОРТИРОВАННАЯ ИДЕЯ & ПРОМПТ]\n`;
    if (idea) importText += `• ИДЕЯ: ${idea}\n`;
    if (logline) importText += `• ЛОГЛАЙН: ${logline}\n`;
    if (synopsis) importText += `• СИНОПСИС: ${synopsis}\n`;
    if (genres) importText += `• ЖАНРЫ: ${genres}\n`;
    if (moods) importText += `• НАСТРОЕНИЕ: ${moods}\n`;
    if (parsed.selectedEra) importText += `• ЭПОХА: ${parsed.selectedEra}\n`;
    if (parsed.selectedVisualStyle) importText += `• ВИЗУАЛЬНЫЙ СТИЛЬ: ${parsed.selectedVisualStyle}\n`;
    if (prompt) importText += `• РЕЖИССЁРСКИЙ ПРОМПТ: ${prompt}\n`;

    setState(s => ({
      ...s,
      scriptDraft: (s.scriptDraft ? s.scriptDraft + "\n\n" : "") + importText.trim(),
      importedIdeaPrompt: idea || prompt || "Идея импортирована"
    }));
    setLocalToast({ message: "Контекст темы и идеи успешно импортирован!", type: "success" });
  };

  const importCharacters = () => {
    const saved = localStorage.getItem("aura_character_state");
    if (!saved) {
      setLocalToast({ message: "Персонажи не найдены. Создайте их во вкладке «Персонажи»!", type: "error" });
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const charList: any[] = parsed.characters || [];
      if (charList.length === 0) {
        setLocalToast({ message: "На шаге «Персонажи» нет созданных героев!", type: "error" });
        return;
      }

      let importText = `👥 [ИМПОРТИРОВАННЫЕ ПЕРСОНАЖИ]\n`;
      charList.forEach((c) => {
        importText += `• ${c.characterName} (${c.characterRole || "Без роли"}, ${c.characterAge || "Adulthood"} лет):\n`;
        if (c.characterDescription) importText += `  Биография & описание: ${c.characterDescription}\n`;
        if (c.appearanceDescription) importText += `  Внешние черты: ${c.appearanceDescription}\n`;
        if (c.outfitDescription) importText += `  Стиль одежды: ${c.outfitDescription}\n`;
        if (c.characterGoal) importText += `  Мечта и цели: ${c.characterGoal}\n`;
      });

      setState(s => ({
        ...s,
        scriptDraft: (s.scriptDraft ? s.scriptDraft + "\n\n" : "") + importText.trim(),
        importedCharacters: charList
      }));
      setLocalToast({ message: `Успешно импортирован профиль героев (${charList.length})!`, type: "success" });
    } catch (err) {
      console.error(err);
      setLocalToast({ message: "Произошла ошибка при разборе данных героев", type: "error" });
    }
  };

  const updateScriptDraft = (value: string) => updateField('scriptDraft', value);
  const selectStructure = (value: string) => updateField('selectedStructure', value);
  const selectDuration = (value: string) => updateField('selectedDuration', value);
  const selectFormat = (value: string) => updateField('selectedFormat', value);

  // Chapters
  const addChapter = () => {
    const newCh: Chapter = { id: Math.random().toString(), title: "Новая глава", summary: "", emotionalGoal: "", plotFunction: "" };
    setState(s => ({ ...s, chapters: [...s.chapters, newCh], selectedChapterId: newCh.id }));
    setActiveTab('chapters');
  };

  const updateChapter = (id: string, patch: Partial<Chapter>) => {
    setState(s => ({ ...s, chapters: s.chapters.map(c => c.id === id ? { ...c, ...patch } : c) }));
  };

  const deleteChapter = (id: string) => {
    setState(s => ({ ...s, chapters: s.chapters.filter(c => c.id !== id), selectedChapterId: s.selectedChapterId === id ? null : s.selectedChapterId }));
  };

  const reorderChapters = (sourceIndex: number, targetIndex: number) => {
    setState(s => {
      const newCh = [...s.chapters];
      const [removed] = newCh.splice(sourceIndex, 1);
      newCh.splice(targetIndex, 0, removed);
      return { ...s, chapters: newCh };
    });
  };

  const [draggedChapterIndex, setDraggedChapterIndex] = useState<number | null>(null);

  // Scenes
  const addScene = (chapterId: string | null) => {
    const newSc: Scene = { 
      id: Math.random().toString(), chapterId: chapterId || '', title: "Новая сцена", 
      description: "", location: "", characters: "", conflict: "", action: "", 
      dialogueNotes: "", emotionalBeat: "", visualNotes: "", audioNotes: "" 
    };
    setState(s => ({ ...s, scenes: [...s.scenes, newSc], selectedSceneId: newSc.id }));
    setActiveTab('scenes');
  };

  const updateScene = (id: string, patch: Partial<Scene>) => {
    setState(s => ({ ...s, scenes: s.scenes.map(sc => sc.id === id ? { ...sc, ...patch } : sc) }));
  };

  const deleteScene = (id: string) => {
    setState(s => ({ ...s, scenes: s.scenes.filter(sc => sc.id !== id), selectedSceneId: s.selectedSceneId === id ? null : s.selectedSceneId }));
  };

  // Dialogues
  const addDialogueLine = (sceneId: string | null) => {
    const newDl: DialogueLine = { id: Math.random().toString(), sceneId: sceneId || '', character: "", text: "", emotion: "", pauses: "", intonation: "" };
    setState(s => ({ ...s, dialogueLines: [...s.dialogueLines, newDl] }));
    setActiveTab('dialogues');
  };

  const updateDialogueLine = (id: string, patch: Partial<DialogueLine>) => {
    setState(s => ({ ...s, dialogueLines: s.dialogueLines.map(dl => dl.id === id ? { ...dl, ...patch } : dl) }));
  };

  const deleteDialogueLine = (id: string) => {
    setState(s => ({ ...s, dialogueLines: s.dialogueLines.filter(dl => dl.id !== id) }));
  };

  // AI Helpers
  const generateChaptersFromIdea = () => runAiAction('Разбить идею', 'Разбить идею на главы', res => {
    addChapter();
  });
  const generateScriptStructure = () => runAiAction('Структура', 'Создать структуру', res => selectStructure(STRUCTURES[0]));
  const generateScenesFromChapters = () => runAiAction('Сцены', 'Создать сцены', res => addScene(state.selectedChapterId));

  const buildFinalScript = () => {
    const text = state.chapters.map(c => `## ${c.title}\n${c.summary}\n\n` + 
      state.scenes.filter(sc => sc.chapterId === c.id).map(sc => `### ${sc.title}\n**Локация:** ${sc.location}\n**Действие:** ${sc.action}\n\n`).join('')
    ).join('');
    updateField('finalScript', text || state.scriptDraft);
    setActiveTab('final');
  };

  const applySuggestion = (id: string, action: 'replace' | 'append') => {
    const suggestion = state.aiSuggestions.find(s => s.id === id);
    if (!suggestion) return;
    
    // Simplistic handling of appending based on active tab/fields
    if (activeTab === 'draft') {
      setState(s => ({ ...s, scriptDraft: action === 'replace' ? suggestion.text : s.scriptDraft + '\n\n' + suggestion.text }));
    } else if (activeTab === 'final') {
      setState(s => ({ ...s, finalScript: action === 'replace' ? suggestion.text : s.finalScript + '\n\n' + suggestion.text }));
    }
    
    setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(a => a.id !== id) }));
  };

  const copyFinalScript = () => {
    navigator.clipboard.writeText(state.finalScript);
  };
  const saveScenarioModule = () => alert("Сценарий сохранён");
  const sendToFrameGeneratorModule = () => alert("Передано в Генератор Кадров");
  const sendToVideoGeneratorModule = () => alert("Передано в Генератор Видео");
  const sendToTTSModule = () => alert("Передано в Голос (TTS)");

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 h-full relative">
      {/* Local Toast Alert */}
      <AnimatePresence>
        {localToast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-medium shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md bg-slate-900/95 min-w-[300px] ${
              localToast.type === 'success' 
                ? 'border-emerald-500/40 text-emerald-400' 
                : 'border-rose-500/40 text-rose-400'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-current" />
            <span className="flex-1">{localToast.message}</span>
            <button 
              onClick={() => setLocalToast(null)}
              className="ml-3 hover:text-white text-slate-400 text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Рабочая область */}
      <div className="flex-1 w-full flex flex-col min-h-0 bg-transparent relative pb-10 custom-scrollbar">
        
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 p-4">
          
          <div className="flex items-center justify-between bg-black/40 p-6 rounded-2xl border border-slate-800">
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-[#00F0FF]">
                Сценарий и Главы
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                Разработайте структуру истории, разбейте её на сцены и опишите действия и диалоги.
              </p>
            </div>
            
            <button
              onClick={onApprove}
              className={`px-6 py-2 rounded-xl font-bold uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${
                isApproved 
                  ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400' 
                  : 'bg-[#00F0FF] text-black hover:bg-[#4dffff] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isApproved ? 'Сценарий утвержден ✓' : 'Утвердить сценарий'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-black/40 rounded-xl border border-slate-800 sticky top-0 z-10 backdrop-blur-md">
            <button onClick={() => document.getElementById('section-draft')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800 hover:text-white">1. Источник & Черновик</button>
            <button onClick={() => document.getElementById('section-chapters')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800 hover:text-white">2. Главы</button>
            <button onClick={() => document.getElementById('section-scenes')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800 hover:text-white">3. Сцены</button>
            <button onClick={() => document.getElementById('section-dialogues')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800 hover:text-white">4. Диалоги</button>
            <button onClick={() => document.getElementById('section-final')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800 hover:text-white">5. Финальный сценарий</button>
          </div>

          <div className="flex flex-col gap-6" id="section-draft">
            <div className="flex flex-col gap-4">
                <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 1. Источник сценария
                </h2>
                
                <div className="flex gap-4">
                  <button onClick={importIdeaPrompt} className="px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> Импорт из "Идея и Промпт"
                  </button>
                  <button onClick={importCharacters} className="px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <User className="w-4 h-4" /> Импорт из "Персонажи"
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Структура истории</span>
                    <select 
                      value={state.selectedStructure || ''}
                      onChange={e => selectStructure(e.target.value)}
                      className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    >
                      <option value="">Выберите структуру...</option>
                      {STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Длительность</span>
                    <select 
                      value={state.selectedDuration || ''}
                      onChange={e => selectDuration(e.target.value)}
                      className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    >
                      <option value="">Выберите длительность...</option>
                      {DURATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Формат</span>
                    <select 
                      value={state.selectedFormat || ''}
                      onChange={e => selectFormat(e.target.value)}
                      className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    >
                      <option value="">Выберите формат...</option>
                      {FORMATS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <textarea 
                  placeholder="Общая идея сценария или черновик..." 
                  value={state.scriptDraft} 
                  onChange={e => updateScriptDraft(e.target.value)}
                  className="w-full min-h-[200px] bg-black/40 border border-slate-700/50 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-slate-800 pt-4">
                <button onClick={generateScriptStructure} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#00F0FF]" /> Создать структуру сценария
                </button>
                <button onClick={generateChaptersFromIdea} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#00F0FF]" /> Разбить идею на главы
                </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-chapters">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 2. Главы
              </h2>
              
              <div className="flex gap-4">
                <button onClick={addChapter} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Добавить главу
                </button>
              </div>

              <div className="flex gap-6 items-start flex-col md:flex-row">
                {/* Chapters List */}
                <div className="w-full md:w-1/3 flex flex-col gap-2">
                  {state.chapters.map((c, index) => (
                    <div 
                      key={c.id} 
                      draggable
                      onDragStart={(e) => {
                        setDraggedChapterIndex(index);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedChapterIndex !== null && draggedChapterIndex !== index) {
                          reorderChapters(draggedChapterIndex, index);
                        }
                        setDraggedChapterIndex(null);
                      }}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${state.selectedChapterId === c.id ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 text-white' : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                      onClick={() => setState(s => ({ ...s, selectedChapterId: c.id }))}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium truncate">{c.title || 'Новая глава'}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteChapter(c.id); }} className="text-slate-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {state.chapters.length === 0 && (
                    <div className="p-4 text-center border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">Нет глав</div>
                  )}
                </div>

                {/* Chapter Editor */}
                {state.selectedChapterId && (
                  <div className="w-full md:w-2/3 bg-black/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                    {(() => {
                      const c = state.chapters.find(ch => ch.id === state.selectedChapterId);
                      if (!c) return null;
                      return (
                        <>
                          <input 
                            type="text" 
                            placeholder="Название главы" 
                            value={c.title} 
                            onChange={e => updateChapter(c.id, { title: e.target.value })}
                            className="w-full bg-transparent border-b border-slate-700 p-2 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
                          />
                          <textarea 
                            placeholder="Краткое содержание (Summary)..." 
                            value={c.summary} 
                            onChange={e => updateChapter(c.id, { summary: e.target.value })}
                            className="w-full min-h-[100px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <textarea 
                              placeholder="Эмоциональная цель" 
                              value={c.emotionalGoal} 
                              onChange={e => updateChapter(c.id, { emotionalGoal: e.target.value })}
                              className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 custom-scrollbar"
                            />
                            <textarea 
                              placeholder="Функция для сюжета (Plot function)" 
                              value={c.plotFunction} 
                              onChange={e => updateChapter(c.id, { plotFunction: e.target.value })}
                              className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 custom-scrollbar"
                            />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-scenes">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 3. Сцены
              </h2>

              <div className="flex gap-4">
                <button onClick={() => addScene(state.selectedChapterId)} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Добавить сцену
                </button>
                <button onClick={generateScenesFromChapters} className="px-4 py-2 rounded-lg bg-black/40 border border-[#b026ff]/30 text-[#b026ff] text-sm hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2">
                  <Wand2 className="w-4 h-4" /> Разбить главу на сцены
                </button>
              </div>

              <div className="flex gap-6 items-start flex-col lg:flex-row">
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  {/* Select Chapter Grouping */}
                  <select 
                    value={state.selectedChapterId || ''}
                    onChange={e => setState(s => ({ ...s, selectedChapterId: e.target.value }))}
                    className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                  >
                    <option value="">Все сцены...</option>
                    {state.chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>

                  <div className="flex flex-col gap-2">
                    {state.scenes.filter(sc => !state.selectedChapterId || sc.chapterId === state.selectedChapterId).map(sc => (
                      <div 
                        key={sc.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${state.selectedSceneId === sc.id ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 text-white' : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                        onClick={() => setState(s => ({ ...s, selectedSceneId: sc.id }))}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate">{sc.title || 'Новая сцена'}</span>
                          <span className="text-xs text-slate-500 truncate">{sc.location}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteScene(sc.id); }} className="text-slate-500 hover:text-red-400 shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {state.scenes.length === 0 && (
                      <div className="p-4 text-center border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">Нет сцен</div>
                    )}
                  </div>
                </div>

                {state.selectedSceneId && (
                  <div className="w-full lg:w-2/3 bg-black/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                    {(() => {
                      const sc = state.scenes.find(s => s.id === state.selectedSceneId);
                      if (!sc) return null;
                      return (
                        <>
                          <input 
                            type="text" 
                            placeholder="Название сцены" 
                            value={sc.title} 
                            onChange={e => updateScene(sc.id, { title: e.target.value })}
                            className="w-full bg-transparent border-b border-slate-700 p-2 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              placeholder="Локация" 
                              value={sc.location} 
                              onChange={e => updateScene(sc.id, { location: e.target.value })}
                              className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
                            />
                            <input 
                              type="text" 
                              placeholder="Персонажи в сцене" 
                              value={sc.characters} 
                              onChange={e => updateScene(sc.id, { characters: e.target.value })}
                              className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
                            />
                          </div>
                          <textarea 
                            placeholder="Действие (Action)" 
                            value={sc.action} 
                            onChange={e => updateScene(sc.id, { action: e.target.value })}
                            className="w-full min-h-[100px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <textarea placeholder="Конфликт сцены" value={sc.conflict} onChange={e => updateScene(sc.id, { conflict: e.target.value })} className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 custom-scrollbar" />
                            <textarea placeholder="Визуальные заметки (Visual Notes)" value={sc.visualNotes} onChange={e => updateScene(sc.id, { visualNotes: e.target.value })} className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 custom-scrollbar" />
                            <textarea placeholder="Аудио/Звуки (Audio Notes)" value={sc.audioNotes} onChange={e => updateScene(sc.id, { audioNotes: e.target.value })} className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 custom-scrollbar" />
                            <textarea placeholder="Эмоциональный ритм" value={sc.emotionalBeat} onChange={e => updateScene(sc.id, { emotionalBeat: e.target.value })} className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 custom-scrollbar" />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-dialogues">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 4. Диалоги
              </h2>
              
              <div className="flex gap-4">
                <button onClick={() => addDialogueLine(state.selectedSceneId)} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Добавить реплику
                </button>
                <button onClick={() => runAiAction('Улучшить диалог', 'Улучшить диалог', res => addSuggestion('Диалог', res, 'dialogue'))} className="px-4 py-2 rounded-lg bg-black/40 border border-[#b026ff]/30 text-[#b026ff] text-sm hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2">
                  <Wand2 className="w-4 h-4" /> ИИ: Сделать естественнее
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {state.dialogueLines.map(dl => (
                  <div key={dl.id} className="p-4 rounded-xl border border-slate-800 bg-black/40 flex flex-col gap-3 relative group">
                    <button onClick={() => deleteDialogueLine(dl.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <input type="text" placeholder="Персонаж" value={dl.character} onChange={e => updateDialogueLine(dl.id, { character: e.target.value })} className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-2 text-sm text-white font-bold" />
                      <input type="text" placeholder="Эмоция (опц.)" value={dl.emotion} onChange={e => updateDialogueLine(dl.id, { emotion: e.target.value })} className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-2 text-sm text-slate-400" />
                      <input type="text" placeholder="Интонация" value={dl.intonation} onChange={e => updateDialogueLine(dl.id, { intonation: e.target.value })} className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-2 text-sm text-slate-400" />
                      <input type="text" placeholder="Паузы (напр. '...')" value={dl.pauses} onChange={e => updateDialogueLine(dl.id, { pauses: e.target.value })} className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-2 text-sm text-slate-400" />
                    </div>
                    <textarea placeholder="Реплика героя..." value={dl.text} onChange={e => updateDialogueLine(dl.id, { text: e.target.value })} className="w-full h-[60px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white resize-y custom-scrollbar focus:border-[#00F0FF]/50 outline-none" />
                  </div>
                ))}
                {state.dialogueLines.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-700 rounded-lg text-slate-500">
                    Нажмите "Добавить реплику" чтобы написать диалог
                  </div>
                )}
              </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-final">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 5. Финальный сценарий
              </h2>
              
              <div className="flex gap-4 flex-wrap">
                <button onClick={buildFinalScript} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2 font-bold">
                  <RefreshCcw className="w-4 h-4" /> Собрать финальный текст
                </button>
                <button onClick={() => runAiAction('Улучшить сценарий', 'Улучши финальный сценарий', res => addSuggestion('Финальный скрипт', res, 'final'))} className="px-4 py-2 rounded-lg bg-black/40 border border-[#b026ff]/30 text-[#b026ff] text-sm hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2">
                  <Wand2 className="w-4 h-4" /> ИИ: Улучшить
                </button>
              </div>

              <textarea 
                placeholder="Здесь появится готовый сценарий..." 
                value={state.finalScript} 
                onChange={e => updateField('finalScript', e.target.value)}
                className="w-full min-h-[400px] bg-black/40 border border-slate-700/50 rounded-lg p-6 text-sm text-white leading-relaxed font-mono resize-y custom-scrollbar focus:outline-none focus:border-[#00F0FF]/50"
              />

              <div className="flex gap-3 flex-wrap">
                <button onClick={copyFinalScript} className="px-4 py-2 rounded-lg bg-[#00F0FF] text-black font-bold uppercase text-xs tracking-widest hover:bg-[#4dffff] transition-colors flex items-center gap-2">
                  <Copy className="w-4 h-4" /> Скопировать
                </button>
                <button onClick={saveScenarioModule} className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Сохранить
                </button>
                <button onClick={sendToFrameGeneratorModule} className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Forward className="w-4 h-4" /> В Кадры
                </button>
                <button onClick={sendToVideoGeneratorModule} className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Forward className="w-4 h-4" /> В Видео
                </button>
                <button onClick={sendToTTSModule} className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Forward className="w-4 h-4" /> В Голос (TTS)
                </button>
              </div>
            </div>

        </div>
      </div>

      {/* Правая панель ИИ-помощника */}
      <div className="w-full lg:w-[320px] bg-black/60 border border-slate-800 flex flex-col shrink-0 lg:h-[max(calc(100vh-140px),600px)] overflow-hidden lg:sticky top-[40px] rounded-xl self-start">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b026ff]" /> ИИ-Помощник
          </h3>
          {state.isGenerating && <Loader2 className="w-4 h-4 text-[#00F0FF] animate-spin" />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider">Действия по модулю</h4>
            <button onClick={() => runAiAction('Усилить конфликт', 'Усилитель', res => addSuggestion('Конфликт', res, 'concept'))} className="p-3 text-xs text-left bg-[#b026ff]/10 border border-[#b026ff]/30 text-white rounded-lg hover:bg-[#b026ff]/20 transition-colors flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-[#b026ff]" /> Усилить драматургию
            </button>
            <button onClick={() => runAiAction('Проверить логику', 'Логика', res => addSuggestion('Анализ логики', res, 'analysis'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-slate-500 hover:bg-black/60 transition-colors flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Проверить логику сюжета
            </button>
            <button onClick={() => runAiAction('Сократить', 'Сократить', res => addSuggestion('Сокращение', res, 'script'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-slate-500 transition-colors flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-slate-400" /> Сократить сценарий
            </button>
            <button onClick={() => runAiAction('Сделать подробнее', 'Подробнее', res => addSuggestion('Расширение', res, 'script'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-slate-500 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-400" /> Сделать подробнее
            </button>
            <button onClick={() => runAiAction('Добавить Cliffhanger', 'Cliffhanger', res => addSuggestion('Cliffhanger', res, 'concept'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-slate-500 transition-colors flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" /> Добавить cliffhanger
            </button>
          </div>

          <AnimatePresence>
            {state.aiSuggestions.map(sug => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={sug.id} 
                className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider">{sug.title}</span>
                  <button onClick={() => setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(a => a.id !== sug.id) }))} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-full overflow-hidden text-ellipsis whitespace-pre-wrap">{sug.text}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => applySuggestion(sug.id, 'replace')} className="py-1.5 bg-[#00F0FF] text-black text-[10px] font-bold uppercase rounded hover:bg-[#4dffff] transition-colors text-center truncate px-1">
                    Заменить
                  </button>
                  <button onClick={() => applySuggestion(sug.id, 'append')} className="py-1.5 bg-black/50 border border-[#00F0FF]/50 text-white text-[10px] uppercase font-bold rounded hover:bg-black/80 transition-colors text-center truncate px-1">
                    Добавить
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {state.aiSuggestions.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6 border border-dashed border-slate-700/50 rounded-xl w-full">
                <Wand2 className="w-6 h-6 text-slate-500 mx-auto mb-3 opacity-50" />
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Нет активных предложений</p>
                <p className="text-[10px] text-slate-600 mt-2">Используйте кнопки ИИ для генерации деталей</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
