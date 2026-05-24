import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Upload, Import, CheckSquare, Settings2, Trash2, Scissors, 
  Layers, Volume2, Mic, Music, Layout, Sliders, Type, Split, Sparkles, AlertCircle, FileText, Anchor, ArrowRight, Save
} from 'lucide-react';

interface TimelineClip {
  id: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  duration: number; // in seconds
  startTime: number; // on timeline
  title: string;
  transition?: string;
  speed?: number;
  opacity?: number;
}

interface TitleItem {
  id: string;
  text: string;
  startTime: number;
  duration: number;
  position: 'top' | 'center' | 'bottom';
  animationStyle: string;
}

interface VideoEditorState {
  importedVideoClips: any[];
  importedFrames: any[];
  importedAudioMix: any | null;
  uploadedMedia: any[];
  mediaLibrary: any[];
  timelineClips: TimelineClip[];
  selectedClipId: string | null;
  currentTime: number;
  selectedTransition: string | null;
  selectedPacing: string | null;
  titleItems: TitleItem[];
  subtitleItems: any[];
  selectedColorGrade: string | null;
  colorSettings: any;
  editDecisionList: string;
  cutList: any[];
  musicSyncNotes: string;
  previewRender: any | null;
  aiSuggestions: any[];
  validationErrors: Record<string, string>;
  isRendering: boolean;
}

interface VideoEditorModuleProps {
  onApprove: () => void;
  key?: any;
}

export function VideoEditorModule({ onApprove }: VideoEditorModuleProps) {
  const [state, setState] = useState<VideoEditorState>({
    importedVideoClips: [],
    importedFrames: [],
    importedAudioMix: null,
    uploadedMedia: [],
    mediaLibrary: [],
    timelineClips: [],
    selectedClipId: null,
    currentTime: 0,
    selectedTransition: null,
    selectedPacing: null,
    titleItems: [],
    subtitleItems: [],
    selectedColorGrade: null,
    colorSettings: {},
    editDecisionList: "",
    cutList: [],
    musicSyncNotes: "",
    previewRender: null,
    aiSuggestions: [],
    validationErrors: {},
    isRendering: false
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const updateState = (patch: Partial<VideoEditorState>) => setState(s => ({ ...s, ...patch }));

  // ── Gemini helper ─────────────────────────────────────────────────────────
  const callGemini = async (actionName: string, inputs: string[]): Promise<string> => {
    const res = await fetch("/api/gemini/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionName, inputs, specTitle: "Видеоредактор" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gemini error");
    return data.result ?? "";
  };

  // ── Реальный импорт из модулей ────────────────────────────────────────────
  const importVideoClips = async () => {
    const { getVideoAssets } = await import("../../services/moduleBridge");
    const clips = getVideoAssets();
    if (!clips.length) {
      alert("Нет сгенерированных видео из модуля «Генератор Видео». Создайте видеоклипы сначала.");
      return;
    }
    const existingIds = new Set(state.importedVideoClips.map((c: any) => c.id));
    const fresh = clips
      .filter(c => !existingIds.has(c.id))
      .map(c => ({
        id: c.id,
        type: "video" as const,
        url: c.url,
        title: c.title,
        duration: parseFloat(c.duration) || 5,
        sceneNumber: c.sceneNumber,
      }));
    if (!fresh.length) { alert("Все клипы уже импортированы."); return; }
    const library = [...state.mediaLibrary, ...fresh];
    updateState({ importedVideoClips: [...state.importedVideoClips, ...fresh], mediaLibrary: library });
    alert(`Импортировано видеоклипов: ${fresh.length}`);
  };

  const importFrames = async () => {
    const { getFrameAssets } = await import("../../services/moduleBridge");
    const frames = getFrameAssets();
    if (!frames.length) {
      alert("Нет сгенерированных кадров (First/Last Frame). Создайте изображения в модуле «Генератор Видео».");
      return;
    }
    const existingIds = new Set(state.importedFrames.map((f: any) => f.id));
    const fresh = frames
      .filter(f => !existingIds.has(f.id))
      .map(f => ({
        id: f.id,
        type: "image" as const,
        url: f.url,
        title: f.title,
        duration: 3,
      }));
    if (!fresh.length) { alert("Все кадры уже импортированы."); return; }
    const library = [...state.mediaLibrary, ...fresh];
    updateState({ importedFrames: [...state.importedFrames, ...fresh], mediaLibrary: library });
    alert(`Импортировано кадров: ${fresh.length}`);
  };

  const importAudioMix = async () => {
    const { getMusicAssets, getVoiceAssets } = await import("../../services/moduleBridge");
    const music = getMusicAssets();
    const voice = getVoiceAssets();
    const all = [...music, ...voice];
    if (!all.length) {
      alert("Нет аудио из модулей «Музыка» и «Голос». Создайте треки сначала.");
      return;
    }
    const primaryMix = all[0];
    const audioItem = { id: primaryMix.id, type: "audio" as const, url: primaryMix.url, title: primaryMix.title, duration: 60 };
    const library = [...state.mediaLibrary.filter((m: any) => m.type !== "audio"), audioItem];
    updateState({ importedAudioMix: audioItem, mediaLibrary: library });
    alert(`Аудио микс импортирован: ${primaryMix.title}`);
  };

  const openMediaUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*,image/*,audio/*";
    input.multiple = true;
    input.onchange = (e: any) => {
      const files: FileList = e.target.files;
      if (!files?.length) return;
      const fresh = Array.from(files).map((f, i) => ({
        id: `upl-${Date.now()}-${i}`,
        type: f.type.startsWith("video") ? "video" as const : f.type.startsWith("audio") ? "audio" as const : "image" as const,
        url: URL.createObjectURL(f),
        title: f.name,
        duration: 5,
      }));
      updateState({ uploadedMedia: [...state.uploadedMedia, ...fresh], mediaLibrary: [...state.mediaLibrary, ...fresh] });
    };
    input.click();
  };

  const addMediaToTimeline = (mediaId: string) => {
    const media = state.mediaLibrary.find((m: any) => m.id === mediaId);
    if (!media) return;
    const lastClip = state.timelineClips[state.timelineClips.length - 1];
    const startTime = lastClip ? lastClip.startTime + lastClip.duration : 0;
    updateState({ timelineClips: [...state.timelineClips, { ...media, startTime }] });
  };

  const updateTimelineClip = (clipId: string, patch: Partial<TimelineClip>) => {
    updateState({ timelineClips: state.timelineClips.map(c => c.id === clipId ? { ...c, ...patch } : c) });
  };

  const deleteTimelineClip = (clipId: string) => {
    updateState({
      timelineClips: state.timelineClips.filter(c => c.id !== clipId),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId
    });
  };

  const addTitleItem = () => {
    const newTitle: TitleItem = { id: `title-${Date.now()}`, text: "Новый Титр", startTime: state.currentTime, duration: 4, position: "center", animationStyle: "fade" };
    updateState({ titleItems: [...state.titleItems, newTitle] });
  };

  const updateTitleItem = (titleId: string, patch: Partial<TitleItem>) => {
    updateState({ titleItems: state.titleItems.map(t => t.id === titleId ? { ...t, ...patch } : t) });
  };

  const deleteTitleItem = (titleId: string) => {
    updateState({ titleItems: state.titleItems.filter(t => t.id !== titleId) });
  };

  const selectColorGrade = (value: string) => updateState({ selectedColorGrade: value });

  const buildPreviewRenderIfSupported = () => {
    updateState({ isRendering: true });
    setTimeout(() => {
      const firstVideo = state.timelineClips.find(c => c.type === "video" || c.type === "image");
      updateState({
        isRendering: false,
        previewRender: { url: firstVideo?.url ?? "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80", description: "Preview Render" }
      });
    }, 2000);
  };

  const sendToExportModule = () => {
    if (!state.previewRender) return alert("Сначала соберите тестовый рендер!");
    alert("Видео передано в Экспорт!");
    onApprove();
  };

  // ── AI кнопки — реальный Gemini ──────────────────────────────────────────
  const getSceneContext = () => state.timelineClips.map((c, i) => `Клип ${i+1}: ${c.title} (${c.duration}s, ${c.transition ?? "cut"})`);

  const suggestTransitions = async () => {
    updateState({ isRendering: true });
    try {
      const result = await callGemini("Предложить оптимальные переходы между клипами для кинематографичного монтажа", getSceneContext());
      updateState({ isRendering: false, aiSuggestions: [{ title: "Переходы (Gemini)", text: result }, ...state.aiSuggestions] });
    } catch (err: any) { updateState({ isRendering: false }); alert(err.message); }
  };

  const suggestTitles = async () => {
    updateState({ isRendering: true });
    try {
      const context = [...getSceneContext(), `Цветокоррекция: ${state.selectedColorGrade ?? "не выбрана"}`];
      const result = await callGemini("Предложить кинематографичные титры: текст, позиция, стиль анимации для каждой сцены", context);
      updateState({ isRendering: false, aiSuggestions: [{ title: "Титры (Gemini)", text: result }, ...state.aiSuggestions] });
    } catch (err: any) { updateState({ isRendering: false }); alert(err.message); }
  };

  const suggestColorGrade = async () => {
    updateState({ isRendering: true });
    try {
      const result = await callGemini("Предложить цветокоррекцию и LUT стиль для проекта исходя из жанра и настроения сцен", getSceneContext());
      updateState({ isRendering: false, aiSuggestions: [{ title: "Цветокоррекция (Gemini)", text: result }, ...state.aiSuggestions] });
    } catch (err: any) { updateState({ isRendering: false }); alert(err.message); }
  };

  const findEditWeaknesses = async () => {
    updateState({ isRendering: true });
    try {
      const context = [...getSceneContext(), `EDL: ${state.editDecisionList || "нет"}`, `Cut list: ${state.cutList.join(", ") || "нет"}`];
      const result = await callGemini("Найти слабые места монтажа: слишком длинные планы, неудачные переходы, темп, ритм", context);
      updateState({ isRendering: false, aiSuggestions: [{ title: "Слабые места (Gemini)", text: result }, ...state.aiSuggestions] });
    } catch (err: any) { updateState({ isRendering: false }); alert(err.message); }
  };

  const syncWithMusic = async () => {
    updateState({ isRendering: true });
    try {
      const audioClips = state.timelineClips.filter(c => c.type === "audio").map(c => c.title);
      const context = [...getSceneContext(), `Аудио треки: ${audioClips.join(", ") || "нет"}`];
      const result = await callGemini("Синхронизировать монтаж с музыкой: предложить точки разрезов на сильные доли, BPM-based cuts", context);
      updateState({ isRendering: false, musicSyncNotes: result, aiSuggestions: [{ title: "Синхронизация с музыкой", text: result }, ...state.aiSuggestions] });
    } catch (err: any) { updateState({ isRendering: false }); alert(err.message); }
  };

  const generateEditPlan = async () => {
    updateState({ isRendering: true });
    try {
      const result = await callGemini("Создать монтажный план (EDL) с таймкодами, типами cuts и переходами. Формат: номер | таймкод | тип | описание", getSceneContext());
      updateState({ isRendering: false, editDecisionList: result });
    } catch (err: any) { updateState({ isRendering: false }); alert(err.message); }
  };

  const generateCutList = async () => {
    updateState({ isRendering: true });
    try {
      const result = await callGemini("Создать cut list: список всех разрезов с таймкодами и типами переходов", getSceneContext());
      updateState({ isRendering: false, cutList: result.split("\n").filter(Boolean) });
    } catch (err: any) { updateState({ isRendering: false }); alert(err.message); }
  };

  const generateEdl = async () => {
    updateState({ isRendering: true });
    try {
      const result = await callGemini("Сгенерировать EDL (Edit Decision List) в профессиональном формате для финального монтажа", getSceneContext());
      updateState({ isRendering: false, editDecisionList: result, aiSuggestions: [{ title: "EDL (Gemini)", text: result }, ...state.aiSuggestions] });
    } catch (err: any) { updateState({ isRendering: false }); alert(err.message); }
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 min-h-screen text-slate-100 bg-transparent pb-32">
      <div className="flex-1 flex flex-col gap-6 bg-transparent">
        <div className="flex flex-col gap-2 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#00F0FF]/10 blur-3xl rounded-full pointer-events-none"></div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#00F0FF]" /> Рабочая область: Видеоредактор
          </h1>
          <p className="text-xs text-slate-400">Сборка финального видеоряда из сцен, аудио и спецэффектов.</p>
        </div>

        {/* 1. Источники медиа */}
        <div className="flex flex-col gap-4 bg-black/40 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF]">1. Источники медиа</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <button onClick={importVideoClips} className="px-3 py-4 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex flex-col items-center justify-center gap-2">
               <Layers className="w-5 h-5 text-indigo-400" /> Из Видео
             </button>
             <button onClick={importFrames} className="px-3 py-4 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex flex-col items-center justify-center gap-2">
               <Anchor className="w-5 h-5 text-purple-400" /> Из Кадров
             </button>
             <button onClick={importAudioMix} className="px-3 py-4 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex flex-col items-center justify-center gap-2">
               <Volume2 className="w-5 h-5 text-emerald-400" /> Из Аудио
             </button>
             <button onClick={openMediaUpload} className="px-3 py-4 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex flex-col items-center justify-center gap-2">
               <Upload className="w-5 h-5 text-[#00F0FF]" /> Локальные файлы
             </button>
          </div>
          {state.mediaLibrary.length > 0 && (
             <div className="flex flex-wrap gap-2 mt-2">
               {state.mediaLibrary.map(m => (
                 <div key={m.id} className="relative w-20 h-20 bg-black rounded border border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-slate-500" onClick={() => addMediaToTimeline(m.id)}>
                    {m.type === 'video' || m.type === 'image' ? (
                       <img src={m.url} className="w-full h-full object-cover opacity-80" alt={m.title} />
                    ) : (
                       <Volume2 className="w-6 h-6 text-slate-500" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-1 py-0.5 text-[8px] text-center truncate">{m.title}</div>
                 </div>
               ))}
             </div>
          )}
        </div>

        {/* 3. Preview Area */}
        <div className="flex flex-col gap-4 bg-black/40 border border-slate-800 p-4 rounded-xl">
           <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF]">3. Область Предпросмотра (Preview)</span>
           <div className="w-full aspect-video bg-black rounded-lg border border-slate-700 relative flex items-center justify-center overflow-hidden shadow-black shadow-inner">
              {state.timelineClips.length > 0 ? (
                 <img src={state.timelineClips[0].url} className="w-full h-full object-cover opacity-80 mix-blend-screen" alt="Preview" />
              ) : (
                 <div className="text-slate-700 flex flex-col items-center gap-2">
                    <Play className="w-12 h-12" />
                    <span className="text-xs uppercase font-bold tracking-widest">Нет медиа на таймлайне</span>
                 </div>
              )}

              {/* Title overlay in preview */}
              {state.titleItems.map(t => (
                <div key={t.id} className={`absolute inset-x-0 mx-auto text-center font-bold text-white drop-shadow-md text-2xl ${t.position === 'top' ? 'top-10' : t.position === 'bottom' ? 'bottom-10' : 'top-1/2 -translate-y-1/2'}`}>
                  {t.text}
                </div>
              ))}
           </div>
           
           <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
             <button className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white" onClick={() => setIsPlaying(!isPlaying)}>
               {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
             </button>
             <div className="flex-1 mx-4 h-2 bg-slate-800 rounded-full relative cursor-pointer">
                <div className="absolute left-0 top-0 h-full bg-[#00F0FF] rounded-full" style={{ width: '30%' }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full p-[2px] shadow-lg shadow-[#00F0FF]/50 border-2 border-[#00F0FF]" style={{ left: '30%' }}></div>
             </div>
             <span className="text-xs font-mono text-[#00F0FF]">00:00:15 / 00:01:20</span>
           </div>
        </div>

        {/* 2. Timeline Editor */}
        <div className="flex flex-col gap-4 bg-black/40 border border-slate-800 p-4 shrink-0 rounded-xl">
           <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF]">2. Монтаж (Timeline)</span>
           
           <div className="flex flex-col gap-1 w-full bg-slate-900 border border-slate-700/50 rounded p-2 overflow-x-auto relative min-h-[150px]">
             {/* Rules line */}
             <div className="flex items-end h-6 border-b border-slate-700 mb-2 whitespace-nowrap min-w-[600px] relative">
               {Array.from({length: 10}).map((_, i) => (
                 <div key={i} className="flex-1 border-l border-slate-700 h-4 pl-1 text-[8px] text-slate-500 font-mono">00:0{i}</div>
               ))}
             </div>

             {/* Title Track */}
             <div className="flex bg-slate-800/30 rounded h-10 w-full min-w-[600px] items-center px-2 relative mb-1 border-l-2 border-amber-500">
                <span className="absolute left-[-24px] rotate-[-90deg] uppercase text-[8px] font-bold text-amber-500/50 mix-blend-screen tracking-widest w-10 text-center">TITLES</span>
                {state.titleItems.map(t => (
                  <div key={t.id} className="h-8 bg-amber-600/20 border border-amber-500/50 rounded flex items-center px-2 absolute text-[10px] text-amber-300 font-bold truncate hover:bg-amber-600/40 cursor-pointer" style={{ left: '150px', width: '100px' }}>
                    {t.text}
                  </div>
                ))}
             </div>

             {/* Video Track */}
             <div className="flex bg-slate-800/50 rounded h-16 w-full min-w-[600px] items-center px-2 relative border-l-2 border-indigo-500">
               <span className="absolute left-[-24px] rotate-[-90deg] uppercase text-[8px] font-bold text-indigo-500/50 mix-blend-screen tracking-widest w-16 text-center">VIDEO</span>
                {state.timelineClips.filter(c => c.type === 'video' || c.type === 'image').map((c, i) => (
                  <div key={c.id} onClick={() => updateState({ selectedClipId: c.id })} className={`h-12 border ${state.selectedClipId === c.id ? 'border-[#00F0FF] bg-[#00F0FF]/20' : 'border-indigo-500/50 bg-indigo-900/30'} rounded-lg mx-1 relative overflow-hidden flex cursor-pointer hover:border-[#00F0FF]/50 transition-colors cursor-pointer group`} style={{ width: c.type === 'video' ? '120px' : '80px', flexShrink: 0 }}>
                    {c.type === 'video' || c.type === 'image' ? <img src={c.url} className="w-full h-full object-cover opacity-50" /> : null}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-2">
                       <span className="text-[9px] font-bold text-white truncate break-words w-full">{c.title}</span>
                    </div>
                     {state.selectedClipId === c.id && (
                        <button className="absolute top-1 right-1 w-4 h-4 bg-red-600 rounded flex items-center justify-center hover:bg-red-500 z-10" onClick={(e) => { e.stopPropagation(); deleteTimelineClip(c.id); }}><Trash2 className="w-2.5 h-2.5 text-white" /></button>
                     )}
                  </div>
                ))}
             </div>

             {/* Audio Track */}
             <div className="flex bg-slate-800/30 rounded h-12 w-full min-w-[600px] items-center px-2 relative mt-1 border-l-2 border-emerald-500">
                <span className="absolute left-[-24px] rotate-[-90deg] uppercase text-[8px] font-bold text-emerald-500/50 mix-blend-screen tracking-widest w-12 text-center">AUDIO</span>
                {state.timelineClips.filter(c => c.type === 'audio').map(c => (
                  <div key={c.id} className="h-8 bg-emerald-900/40 border border-emerald-500/50 rounded flex flex-col justify-center px-2 mx-1 flex-1 min-w-[100px]">
                    <span className="text-[9px] font-bold text-emerald-300 truncate">{c.title}</span>
                  </div>
                ))}
             </div>
           </div>
           
           {/* Clip Controls (only active when clip is selected) */}
           <div className={`p-4 rounded-xl border ${state.selectedClipId ? 'border-indigo-500/30 bg-indigo-900/10' : 'border-slate-800 bg-black/40'} transition-colors`}>
              <div className="flex items-center gap-2 mb-3">
                 <Settings2 className="w-4 h-4 text-slate-400" />
                 <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Настройки клипа</span>
              </div>
              {state.selectedClipId ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold">Скорость (Speed)</label>
                      <select className="bg-black/50 border border-slate-700 rounded-lg p-2 text-xs text-white" value={state.timelineClips.find(c=>c.id === state.selectedClipId)?.speed || 1} onChange={e => updateTimelineClip(state.selectedClipId!, { speed: parseFloat(e.target.value) })}>
                        <option value={0.5}>0.5x Slowmo</option>
                        <option value={1}>1.0x Normal</option>
                        <option value={2}>2.0x Fast</option>
                        <option value={4}>4.0x Timelapse</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold">Переход (Вход)</label>
                      <select className="bg-black/50 border border-slate-700 rounded-lg p-2 text-xs text-white" value={state.timelineClips.find(c=>c.id === state.selectedClipId)?.transition || 'cut'} onChange={e => updateTimelineClip(state.selectedClipId!, { transition: e.target.value })}>
                        <option value="cut">Direct Cut (Нет)</option>
                        <option value="fade">Кросс-фейд</option>
                        <option value="dissolve">Растворение</option>
                        <option value="glitch">Glitch</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                       <button className="h-9 px-3 w-full bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 hover:text-white flex items-center justify-center gap-2"><Scissors className="w-3.5 h-3.5" /> Разрезать</button>
                    </div>
                 </div>
              ) : (
                 <span className="text-xs text-slate-600 italic">Выберите клип на таймлайне для редактирования</span>
              )}
           </div>
        </div>

        {/* 5. Титры и текст & 6. Цвет */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Титры */}
           <div className="bg-black/40 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
             <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF] flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> 5. Титры (Titles)</span>
                <button onClick={addTitleItem} className="text-[10px] uppercase font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">+ Титр</button>
             </div>
             {state.titleItems.length === 0 ? <span className="text-xs text-slate-600 italic">Нет титров в проекте</span> : (
               <div className="flex flex-col gap-2">
                 {state.titleItems.map(t => (
                    <div key={t.id} className="flex gap-2 items-center">
                       <input type="text" value={t.text} onChange={e => updateTitleItem(t.id, { text: e.target.value })} className="flex-1 bg-black/50 border border-slate-700 rounded p-2 text-xs text-white" />
                       <select value={t.position} onChange={e => updateTitleItem(t.id, { position: e.target.value as any })} className="w-24 bg-black/50 border border-slate-700 rounded p-2 text-xs text-white">
                         <option value="top">Сверху</option><option value="center">По центру</option><option value="bottom">Снизу</option>
                       </select>
                       <button onClick={() => deleteTitleItem(t.id)} className="w-8 h-8 flex items-center justify-center bg-red-900/30 text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                 ))}
               </div>
             )}
           </div>

           {/* Цвет */}
           <div className="bg-black/40 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
             <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF] flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5" /> 6. Цветокоррекция (LUT)</span>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
               {['natural', 'cinematic', 'cold (cyberpunk)', 'warm (noir)', 'high contrast', 'muted'].map(c => (
                 <button 
                   key={c}
                   onClick={() => selectColorGrade(c)}
                   className={`p-2 border rounded text-[10px] uppercase font-bold text-center flex flex-col gap-1 items-center justify-center ${state.selectedColorGrade === c ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-slate-700 bg-black/50 text-slate-400 hover:border-slate-500'}`}
                 >
                   <div className="w-4 h-4 rounded-full" style={{ background: c.includes('cold') ? '#3b82f6' : c.includes('warm') ? '#f59e0b' : c.includes('cinematic') ? 'linear-gradient(45deg, #1e293b, #0ea5e9)' : '#64748b' }}></div>
                   <span className="truncate w-full">{c}</span>
                 </button>
               ))}
             </div>
           </div>
        </div>

        {/* 7 & 8. EDL State and Export */}
        <div className="flex flex-col gap-4 bg-indigo-900/10 border border-indigo-500/30 p-5 rounded-xl">
           <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 flex items-center gap-2">
             <CheckSquare className="w-4 h-4" /> 7. Edit Decision List & 8. Render
           </span>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 relative">
                 <label className="text-[10px] text-indigo-300 uppercase font-bold px-1">Монтажный план (EDL)</label>
                 <textarea 
                   placeholder="Сгенерируйте EDL или напишите вручную"
                   value={state.editDecisionList}
                   onChange={e => updateState({ editDecisionList: e.target.value })}
                   className="w-full h-32 bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-3 text-xs text-white custom-scrollbar focus:border-[#00F0FF]/50 outline-none resize-none font-mono"
                 />
                 <button onClick={generateEditPlan} className="absolute top-0 right-0 text-[10px] text-indigo-200 hover:text-white px-2 mt-0.5">Автогенерация</button>
              </div>
              <div className="flex flex-col justify-end gap-3 pb-1">
                 {state.isRendering ? (
                    <div className="w-full flex-1 border border-dashed border-emerald-500/50 bg-emerald-900/10 rounded-xl flex items-center justify-center p-4">
                       <span className="text-emerald-400 font-mono text-xs uppercase animate-pulse">Rendering preview...</span>
                    </div>
                 ) : state.previewRender ? (
                    <div className="w-full flex-1 flex flex-col gap-2">
                       <div className="w-full h-20 bg-black rounded overflow-hidden relative border border-emerald-500">
                          <img src={state.previewRender.url} className="w-full h-full object-cover mix-blend-screen opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-emerald-400 font-mono font-bold text-xs bg-black/60 px-2 py-1 rounded">RENDER OK</span>
                          </div>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={buildPreviewRenderIfSupported} className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 text-slate-300 hover:text-white rounded text-xs font-bold transition-colors">Пересобрать</button>
                         <button onClick={sendToExportModule} className="flex-[2] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-colors uppercase whitespace-nowrap overflow-hidden flex items-center justify-center">
                            Финальный Render в Экспорт <ArrowRight className="w-3.5 h-3.5 inline ml-1 shrink-0" />
                         </button>
                       </div>
                    </div>
                 ) : (
                    <div className="flex flex-col gap-2 h-full justify-end">
                       <p className="text-xs text-slate-400 mb-2">Нажмите «Собрать render», чтобы получить финальное видео в низком разрешении для проверки.</p>
                       <button onClick={buildPreviewRenderIfSupported} className="w-full px-4 py-4 bg-indigo-600 border border-indigo-400 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all">
                          Собрать preview render
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>

      </div>

      {/* ПРАВАЯ ПАНЕЛЬ ИИ-ПОМОЩНИКА */}
      <div className="w-full xl:w-[320px] bg-black/60 border border-slate-800 flex flex-col shrink-0 xl:h-[max(calc(100vh-140px),600px)] overflow-hidden xl:sticky top-[40px] rounded-xl self-start">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-[#00F0FF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b026ff]" /> AI Assistant
          </span>
        </div>
        <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Анализ и монтаж</span>
            <button onClick={suggestTransitions} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Split className="w-3.5 h-3.5 text-blue-400" /> Предложить переходы
            </button>
            <button onClick={syncWithMusic} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-indigo-400" /> Синхронизоровать с музыкой
            </button>
            <button onClick={suggestTitles} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-yellow-500" /> Предложить титры
            </button>
            <button onClick={suggestColorGrade} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-purple-400" /> Предложить цветокоррекцию
            </button>
            <button onClick={findEditWeaknesses} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Найти слабые места
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Генерация</span>
            <button onClick={generateEditPlan} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-rose-400" /> Создать монтажный план
            </button>
            <button onClick={generateCutList} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-emerald-400" /> Создать cut list
            </button>
            <button onClick={generateEdl} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#00F0FF]" /> Создать EDL
            </button>
          </div>
          
          {state.aiSuggestions.length > 0 && (
             <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-3">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Активные Советы</span>
               {state.aiSuggestions.map((s, idx) => (
                 <div key={idx} className="p-3 bg-indigo-900/10 border border-indigo-500/30 rounded-lg text-xs relative">
                    <span className="font-bold text-indigo-300 block mb-1">{s.title}</span>
                    <p className="text-slate-400 leading-relaxed">{s.text}</p>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
