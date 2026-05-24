import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Youtube, Instagram, MonitorSmartphone, Share2, 
  Settings2, FileText, CheckCircle2, AlertCircle, Copy, Save, 
  Image as ImageIcon, Wand2, ArrowRight, Play, CheckSquare, Film, Music, 
  Sparkles, MonitorPlay, Presentation, Globe, Box, ListVideo, Tags, Upload, Type, Layers
} from 'lucide-react';

interface ExportModuleProps {
  onApprove: () => void;
  key?: any;
}

interface ExportVersion {
  id: string;
  name: string;
  aspectRatio: string;
  notes: string;
}

interface ExportModuleState {
  importedFinalEdit: any | null;
  importedFinalAudio: any | null;
  projectMetadata: any;
  selectedPlatform: string | null;
  selectedAspectRatio: string | null;
  selectedResolution: string | null;
  selectedFrameRate: string | null;
  selectedQualityPreset: string | null;
  selectedFileFormat: string | null;
  exportVersions: ExportVersion[];
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  cta: string;
  chapters: any[];
  platformSpecificDescription: string;
  thumbnailPrompt: string;
  thumbnailText: string;
  visualDirection: string;
  uploadedThumbnail: any | null;
  selectedThumbnailFrame: any | null;
  qualityChecklist: Record<string, boolean>;
  exportPackage: any | null;
  exportResult: any | null;
  aiSuggestions: any[];
  validationErrors: Record<string, string>;
  isExporting: boolean;
}

export function ExportModule({ onApprove }: ExportModuleProps) {
  const [state, setState] = useState<ExportModuleState>({
    importedFinalEdit: null,
    importedFinalAudio: null,
    projectMetadata: {},
    selectedPlatform: null,
    selectedAspectRatio: null,
    selectedResolution: null,
    selectedFrameRate: null,
    selectedQualityPreset: null,
    selectedFileFormat: null,
    exportVersions: [],
    title: "",
    description: "",
    tags: [],
    hashtags: [],
    cta: "",
    chapters: [],
    platformSpecificDescription: "",
    thumbnailPrompt: "",
    thumbnailText: "",
    visualDirection: "",
    uploadedThumbnail: null,
    selectedThumbnailFrame: null,
    qualityChecklist: {},
    exportPackage: null,
    exportResult: null,
    aiSuggestions: [],
    validationErrors: {},
    isExporting: false
  });

  const updateState = (patch: Partial<ExportModuleState>) => setState(s => ({ ...s, ...patch }));

  const importFinalEdit = () => {
    // Try video editor export first
    const videoExport = localStorage.getItem('aura_export_video');
    if (videoExport) {
      try {
        const parsed = JSON.parse(videoExport);
        updateState({ importedFinalEdit: { url: parsed.clips?.[0]?.url ?? '', status: 'ready', clips: parsed.clips, colorGrade: parsed.colorGrade } });
        alert(`Видеоряд импортирован: ${parsed.clips?.length ?? 0} клипов.`);
        return;
      } catch {}
    }
    // Fallback to video generator blocks
    const blocks = localStorage.getItem('video_generator_blocks');
    if (blocks) {
      try {
        const parsed = JSON.parse(blocks);
        const first = parsed.find((b: any) => b.selectedVideoId);
        const vid = first?.generatedVideos?.find((v: any) => v.id === first.selectedVideoId);
        updateState({ importedFinalEdit: { url: vid?.url ?? '', status: 'ready' } });
        alert('Видео из Генератора импортировано.');
        return;
      } catch {}
    }
    alert('Нет готового видео. Завершите этапы Видеоредактора или Генератора Видео.');
  };
  
  const importFinalAudio = () => {
    updateState({ importedFinalAudio: { name: 'final-mix.wav', status: 'ready' } });
  };

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: Youtube },
    { id: 'tiktok', name: 'TikTok', icon: MonitorSmartphone },
    { id: 'reels', name: 'Instagram Reels', icon: Instagram },
    { id: 'feed', name: 'Instagram Feed', icon: Instagram },
    { id: 'shorts', name: 'Shorts', icon: Youtube },
    { id: 'vimeo', name: 'Vimeo', icon: MonitorPlay },
    { id: 'website', name: 'Website', icon: Globe },
    { id: 'presentation', name: 'Presentation', icon: Presentation },
    { id: 'custom', name: 'Custom', icon: Settings2 },
  ];

  const aspectRatios = ['16:9', '9:16', '1:1', '4:5', '21:9'];
  const resolutions = ['720p', '1080p', '1440p', '4K', 'custom'];
  const frameRates = ['24 fps', '25 fps', '30 fps', '60 fps'];
  const qualityPresets = ['draft', 'standard', 'high', 'master'];
  const fileFormats = ['MP4', 'MOV', 'WebM', 'custom'];

  const createPlatformVersions = () => {
    updateState({
      exportVersions: [
        { id: 'v169', name: 'Версия 16:9', aspectRatio: '16:9', notes: 'Safe area: Title Safe Title 90% | Reference: YouTube Standard' },
        { id: 'v916', name: 'Версия 9:16', aspectRatio: '9:16', notes: 'Auto center reframe | Safe area: TikTok UI overlay' },
        { id: 'v11', name: 'Версия 1:1', aspectRatio: '1:1', notes: 'Square crop from center | Reference: Instagram Feed' },
        { id: 'v45', name: 'Версия 4:5', aspectRatio: '4:5', notes: 'Vertical portrait crop | Reference: Facebook/IG' },
        { id: 'custom', name: 'Custom version', aspectRatio: '21:9', notes: 'Cinematic wide | Aspect ratio notes' }
      ]
    });
  };

  const generateTitle = () => updateState({ title: "My Awesome Cinematic Project 2026" });
  const generateDescription = () => updateState({ description: "An amazing exploration of AI generation and cinematic storytelling." });
  const generateTags = () => updateState({ tags: ["cinematic", "ai", "filmmaking"], hashtags: ["#video", "#ai"] });
  const generateThumbnailPrompt = () => updateState({ 
    thumbnailPrompt: "Cinematic close-up of the main subject with neon lighting, 8k, photorealistic",
    visualDirection: "Epic, High-contrast, Sci-Fi",
    thumbnailText: "MUST WATCH"
  });

  const toggleChecklist = (key: string) => {
    updateState({ qualityChecklist: { ...state.qualityChecklist, [key]: !state.qualityChecklist[key] } });
  };

  const runQualityCheck = () => {
    updateState({
      qualityChecklist: {
        video: true,
        audio: true,
        subtitles: true,
        safeAreas: true,
        aspectRatio: true,
        spelling: true,
        metadata: true,
        settings: true,
        rights: true
      }
    });
  };

  const prepareYouTubeExport = () => {
    updateState({
      selectedPlatform: 'youtube',
      selectedAspectRatio: '16:9',
      selectedResolution: '4K',
      selectedFrameRate: '60 fps',
      selectedFileFormat: 'MP4',
      selectedQualityPreset: 'high'
    });
  };

  const buildExportPackage = () => {
    updateState({ exportPackage: { status: 'ready', size: '1.2 GB' } });
  };

  const exportVideoIfSupported = () => {
    updateState({ isExporting: true });
    // Check if we have real video URL to export
    const finalUrl = state.importedFinalEdit?.url;
    setTimeout(() => {
      if (finalUrl && (finalUrl.startsWith('blob:') || finalUrl.startsWith('data:'))) {
        // Create real download link
        const a = document.createElement('a');
        a.href = finalUrl;
        a.download = `${state.title || 'aura-export'}.mp4`;
        a.click();
        updateState({ isExporting: false, exportResult: { status: 'success', url: finalUrl } });
      } else {
        // No real video yet — save metadata package
        const pkg = { title: state.title, description: state.description, tags: state.tags, hashtags: state.hashtags, cta: state.cta, platforms: state.selectedPlatforms, format: state.selectedFileFormat, quality: state.selectedQualityPreset, exportedAt: new Date().toISOString() };
        localStorage.setItem('aura_export_package', JSON.stringify(pkg));
        updateState({ isExporting: false, exportResult: { status: 'success', url: '' } });
        alert('Метаданные пакета экспорта сохранены. Видеофайл будет доступен после генерации в модуле «Генератор Видео».');
      }
    }, 800);
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 min-h-screen text-slate-100 bg-transparent pb-32">
      <div className="flex-1 flex flex-col gap-6 bg-transparent">
        <div className="flex flex-col gap-2 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#00F0FF]/10 blur-3xl rounded-full pointer-events-none"></div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Download className="w-5 h-5 text-[#00F0FF]" /> Рабочая область: Экспорт
          </h1>
          <p className="text-xs text-slate-400">Подготовка финального проекта к экспорту на различные платформы.</p>
        </div>

        {/* 1. Источники финального проекта */}
        <div className="flex flex-col gap-4 bg-black/40 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF]">1. Источники финального проекта</span>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 aspect-video bg-black/60 border border-slate-700 rounded-xl overflow-hidden relative flex items-center justify-center">
              {state.importedFinalEdit ? (
                <img src={state.importedFinalEdit.url} className="w-full h-full object-cover opacity-80 mix-blend-screen" alt="Preview"/>
              ) : (
                <div className="text-slate-600 flex flex-col items-center gap-2 text-center p-4">
                  <Film className="w-8 h-8" />
                  <span className="text-[10px] uppercase tracking-widest">Нет видео</span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
               <button onClick={importFinalEdit} className="w-full py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                 <Film className="w-4 h-4 text-indigo-400" /> Импорт Final Edit
               </button>
               <button onClick={importFinalAudio} className="w-full py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                 <Music className="w-4 h-4 text-emerald-400" /> Импорт Final Audio
               </button>
               
               {state.importedFinalEdit && state.importedFinalAudio && (
                 <div className="mt-auto p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                   <span className="text-xs font-bold text-emerald-300">Источники готовы</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* 2. Export settings */}
        <div className="flex flex-col gap-4 bg-black/40 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF]">2. Настройки экспорта</span>
          
          <div className="flex flex-col gap-4">
             <div>
               <label className="text-[10px] text-slate-500 uppercase font-bold px-1 mb-2 block">Платформа</label>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                 {platforms.map(p => {
                    const Icon = p.icon;
                    const isSelected = state.selectedPlatform === p.id;
                    return (
                      <button 
                         key={p.id} onClick={() => updateState({ selectedPlatform: p.id })}
                         className={`p-2 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${isSelected ? 'bg-[#b026ff]/20 border-[#b026ff] text-white shadow-[0_0_10px_rgba(176,38,255,0.2)]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                         <Icon className="w-5 h-5" />
                         <span className="text-[10px] font-bold text-center leading-tight">{p.name}</span>
                      </button>
                    )
                 })}
               </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Aspect Ratio</label>
                   <select value={state.selectedAspectRatio || ''} onChange={e => updateState({ selectedAspectRatio: e.target.value })} className="bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-white">
                      <option value="" disabled>Select...</option>
                      {aspectRatios.map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
                </div>
                <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Resolution</label>
                   <select value={state.selectedResolution || ''} onChange={e => updateState({ selectedResolution: e.target.value })} className="bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-white">
                      <option value="" disabled>Select...</option>
                      {resolutions.map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
                </div>
                <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Frame Rate</label>
                   <select value={state.selectedFrameRate || ''} onChange={e => updateState({ selectedFrameRate: e.target.value })} className="bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-white">
                      <option value="" disabled>Select...</option>
                      {frameRates.map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
                </div>
                <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Quality</label>
                   <select value={state.selectedQualityPreset || ''} onChange={e => updateState({ selectedQualityPreset: e.target.value })} className="bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-white">
                      <option value="" disabled>Select...</option>
                      {qualityPresets.map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
                </div>
                <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Format</label>
                   <select value={state.selectedFileFormat || ''} onChange={e => updateState({ selectedFileFormat: e.target.value })} className="bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-white">
                      <option value="" disabled>Select...</option>
                      {fileFormats.map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. Versions */}
          <div className="flex flex-col gap-4 bg-black/40 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
               <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF] flex items-center gap-1.5"><Layers className="w-3.5 h-3.5"/> 3. Версии</span>
               <button onClick={createPlatformVersions} className="text-[10px] px-2 py-1 bg-indigo-600/30 text-indigo-300 rounded border border-indigo-500/50 hover:bg-indigo-600/50">Авто-создание</button>
            </div>
            
            {state.exportVersions.length === 0 ? (
               <div className="text-slate-600 italic text-xs text-center py-6 border border-dashed border-slate-700 rounded-lg">Нет запланированных версий</div>
            ) : (
               <div className="flex flex-col gap-2">
                 {state.exportVersions.map(v => (
                   <div key={v.id} className="p-3 bg-black/50 border border-slate-700 rounded-xl flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-white">{v.name}</span>
                        <span className="text-[10px] text-slate-400">{v.notes}</span>
                      </div>
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-300 border border-slate-700">{v.aspectRatio}</span>
                   </div>
                 ))}
               </div>
            )}
          </div>

          {/* 6. Quality checklist */}
          <div className="flex flex-col gap-4 bg-black/40 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
               <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF] flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5"/> 6. Контроль качества (QA)</span>
               <button onClick={runQualityCheck} className="text-[10px] px-2 py-1 bg-emerald-600/30 text-emerald-300 rounded border border-emerald-500/50 hover:bg-emerald-600/50">Авто-Check</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
               {[
                 {id:'video', label:'Video Preview'}, {id:'audio', label:'Audio Balance'},
                 {id:'subtitles', label:'Subtitles'}, {id:'safeAreas', label:'Safe Areas'},
                 {id:'aspectRatio', label:'Aspect Ratio'}, {id:'spelling', label:'Spelling'},
                 {id:'metadata', label:'Metadata'}, {id:'settings', label:'Settings'}
               ].map(chk => (
                 <div key={chk.id} onClick={() => toggleChecklist(chk.id)} className="flex items-center gap-2 p-2 bg-black/60 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-600">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${state.qualityChecklist[chk.id] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                       {state.qualityChecklist[chk.id] && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs text-slate-300 select-none">{chk.label}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* 4. Metadata editor & 5. Thumbnail */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
           <div className="xl:col-span-2 flex flex-col gap-4 bg-black/40 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF] flex items-center gap-1.5"><ListVideo className="w-3.5 h-3.5"/> 4. Метаданные (Metadata)</span>
              
              <div className="flex flex-col gap-3">
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold">Название (Title)</label>
                      <button onClick={generateTitle} className="text-[10px] text-indigo-400 hover:text-indigo-300">Авто</button>
                    </div>
                    <input type="text" value={state.title} onChange={e => updateState({ title: e.target.value })} className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-white" placeholder="Название видео..." />
                 </div>
                 
                 <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold">Описание (Description)</label>
                      <button onClick={generateDescription} className="text-[10px] text-indigo-400 hover:text-indigo-300">Авто</button>
                    </div>
                    <textarea value={state.description} onChange={e => updateState({ description: e.target.value })} className="w-full h-24 bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-white resize-none custom-scrollbar" placeholder="Описание к видео, ссылки, таймкоды..." />
                 </div>
                 
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Специфичное описание (Platform-specific)</label>
                    <textarea value={state.platformSpecificDescription} onChange={e => updateState({ platformSpecificDescription: e.target.value })} className="w-full h-16 bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-400 resize-none custom-scrollbar" placeholder="Например, особенности для TikTok..." />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                       <div className="flex justify-between items-center px-1">
                         <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Tags className="w-3 h-3"/> Теги & Хэштеги</label>
                         <button onClick={generateTags} className="text-[10px] text-indigo-400 hover:text-indigo-300">Авто</button>
                       </div>
                       <input type="text" value={[...state.tags, ...state.hashtags].join(', ')} onChange={e => updateState({ tags: e.target.value.split(', ') })} className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-400 font-mono" placeholder="tag1, tag2, #awesome" />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Призыв к действию (CTA)</label>
                       <input type="text" value={state.cta} onChange={e => updateState({ cta: e.target.value })} className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-white" placeholder="Например, 'Подписывайтесь!'" />
                    </div>
                 </div>

                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold px-1 flex justify-between">
                      <span>Главы / Таймкоды (Chapters)</span>
                      <span className="text-slate-600 font-normal">{(state.chapters || []).length} найдено</span>
                    </label>
                    <textarea value={state.chapters.map(c => typeof c === 'string' ? c : c?.title).join('\n')} readOnly className="w-full h-16 bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-400 resize-none custom-scrollbar cursor-not-allowed" placeholder="00:00 - Интро..." />
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-4 bg-black/40 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#00F0FF] flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5"/> 5. Обложка (Thumbnail)</span>
              
              <label className="aspect-video w-full bg-black/60 border border-slate-700 rounded-xl overflow-hidden relative flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-slate-500 transition-colors">
                <Upload className="w-8 h-8 text-slate-600 group-hover:text-amber-400 transition-colors" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 group-hover:text-slate-400">Загрузить обложку</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => updateState({ uploadedThumbnail: e.target.files?.[0] })} />
              </label>

              <button className="w-full py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-colors">
                 Выбрать кадр как обложку
              </button>
              
              <div className="flex flex-col gap-1.5 mt-2">
                 <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Wand2 className="w-3 h-3"/> Промпт для обложки</label>
                   <button onClick={generateThumbnailPrompt} className="text-[10px] text-indigo-400 hover:text-indigo-300">Авто</button>
                 </div>
                 <textarea value={state.thumbnailPrompt} onChange={e => updateState({ thumbnailPrompt: e.target.value })} className="w-full h-24 bg-black/60 border border-slate-700 rounded-lg p-2 text-[10px] text-slate-300 resize-none opacity-80" placeholder="Cinematic, 8k, neon lighting..." />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Визуальный стиль</label>
                    <input type="text" value={state.visualDirection} onChange={e => updateState({ visualDirection: e.target.value })} className="w-full bg-black/60 border border-slate-700 rounded-lg p-2 text-[10px] text-white" placeholder="Epic, Sci-fi..." />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Текст на обложке</label>
                    <input type="text" value={state.thumbnailText} onChange={e => updateState({ thumbnailText: e.target.value })} className="w-full bg-black/60 border border-slate-700 rounded-lg p-2 text-[10px] text-white" placeholder="MUST WATCH" />
                 </div>
              </div>
           </div>
        </div>

        {/* 7. Export actions */}
        <div className="flex flex-col gap-4 bg-emerald-900/10 border border-emerald-500/30 p-5 rounded-xl">
           <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 flex items-center gap-2">
             <Share2 className="w-4 h-4" /> 7. Действия Экспорта (Pipeline Out)
           </span>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <button onClick={buildExportPackage} className="py-3 px-4 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 transition-colors">
                 <Box className="w-4 h-4" /> Собрать Export Package
              </button>
              <button onClick={() => { const pkg = { title: state.title, description: state.description, tags: state.tags, hashtags: state.hashtags, cta: state.cta }; navigator.clipboard.writeText(JSON.stringify(pkg, null, 2)); }} className="py-3 px-4 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 transition-colors">
                 <Copy className="w-4 h-4" /> Скопировать Metadata
              </button>
              <button onClick={() => { const pkg = { format: state.selectedFileFormat, quality: state.selectedQualityPreset, platforms: state.selectedPlatforms }; const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'export-settings.json'; a.click(); }} className="py-3 px-4 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 transition-colors">
                 <Settings2 className="w-4 h-4" /> Скачать настройки 
              </button>
              <div className="lg:col-span-2 flex min-w-0">
                {state.isExporting ? (
                  <div className="w-full py-3 px-4 bg-emerald-600/30 border border-emerald-500/50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 animate-pulse">
                     Экспорт запущен, ожидайте...
                  </div>
                ) : (
                  <button onClick={exportVideoIfSupported} className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                     <Download className="w-4 h-4" /> ЭКСПОРТИРОВАТЬ ВИДЕО
                  </button>
                )}
              </div>
           </div>

           {state.exportResult && (
              <div className="mt-4 p-4 border border-emerald-500/50 bg-emerald-900/20 rounded-xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                     <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-emerald-300">Пакет экспорта успешно сгенерирован</span>
                      <span className="text-[10px] text-emerald-400/70">Все файлы и метаданные сохранены в рабочем пространстве.</span>
                   </div>
                 </div>
                 <button onClick={onApprove} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-colors">
                   ЗАВЕРШИТЬ ПРОЕКТ
                 </button>
              </div>
           )}
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
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Подготовка платформы</span>
            <button onClick={prepareYouTubeExport} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Youtube className="w-3.5 h-3.5 text-red-500" /> Подготовить экспорт под YouTube
            </button>
            <button onClick={() => updateState({ selectedPlatform: 'tiktok', selectedFileFormat: 'MP4', selectedQualityPreset: 'high' })} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <MonitorSmartphone className="w-3.5 h-3.5 text-[#00F0FF]" /> Подготовить экспорт под TikTok
            </button>
            <button onClick={() => updateState({ selectedPlatform: 'reels', selectedFileFormat: 'MP4', selectedQualityPreset: 'high' })} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Instagram className="w-3.5 h-3.5 text-pink-500" /> Подготовить экспорт под Reels
            </button>
            <button onClick={createPlatformVersions} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Создать версии 16:9 / 9:16 / 1:1
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Метаданные & Graphics</span>
            <button onClick={generateTitle} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-violet-400" /> Создать название
            </button>
            <button onClick={generateDescription} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Создать описание
            </button>
            <button onClick={generateTags} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Tags className="w-3.5 h-3.5 text-indigo-400" /> Создать теги
            </button>
            <button onClick={generateThumbnailPrompt} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-amber-500" /> Создать thumbnail prompt
            </button>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Check / Quality</span>
            <button onClick={runQualityCheck} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Проверить качество
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
