import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Mic, Volume2, Upload, Trash2, Check, Copy, ArrowRight, Save, Layers,
  Sliders, Settings, Headphones, FastForward, Activity, AlertCircle, HelpCircle as HelpIcon, FileText, Sparkles, Wand2, Play, Pause, ListMusic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for State structure
export interface ImportedAudioItem {
  id: string;
  title: string;
  source: 'music' | 'voice' | 'upload';
  url: string;
  duration: string;
  createdAt?: string;
}

export interface AudioClip {
  id: string;
  audioId: string;
  title: string;
  trackType: 'music' | 'voice' | 'sfx' | 'ambience';
  startTime: number; // in seconds
  endTime: number;
  volume: number; // 0 to 100
  fadeIn: number; // in seconds
  fadeOut: number;
  isMuted: boolean;
  isSolo: boolean;
  order: number;
}

export interface SFXItem {
  id: string;
  name: string;
  sceneMapping: string;
  timing: string;
  intensity: string;
  description: string;
}

export interface AudioMixPlan {
  notes: string;
  loudnessTarget: string;
  platformTarget: string;
}

export interface FinalMixItem {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  duration: string;
}

export interface AudioEditorModuleState {
  importedMusic: ImportedAudioItem[];
  importedVoiceAudios: ImportedAudioItem[];
  uploadedAudioFiles: ImportedAudioItem[];
  audioTracks: AudioClip[];
  selectedClipId: string | null;
  noiseReductionEnabled: boolean;
  normalizationEnabled: boolean;
  eqNotes: string;
  compressionNotes: string;
  deEsserNotes: string;
  reverbAmount: number | null;
  stereoWidth: number | null;
  limiterTarget: number | null;
  sfxList: SFXItem[];
  ambiencePlan: string;
  audioMixPlan: string;
  selectedPlatformTarget: string | null;
  loudnessTarget: string | null;
  finalAudioMix: FinalMixItem | null;
  aiSuggestions: { id: string; title: string; text: string; type: string }[];
  validationErrors: Record<string, string>;
  isProcessing: boolean;
}

interface AudioEditorModuleProps {
  onApprove: () => void;
  key?: any;
}

const PLATFORMS = [
  { id: "youtube", label: "YouTube (-14 LUFS)" },
  { id: "tiktok", label: "TikTok (-14 LUFS / Punchy)" },
  { id: "instagram", label: "Instagram Reels (-14 LUFS)" },
  { id: "cinema", label: "Cinema Preview (-24 LKFS)" },
  { id: "podcast", label: "Podcast Style (-16 LUFS)" }
];

const TRACK_TYPES = [
  { id: 'voice', label: "Voice / TTS", color: "border-red-500", text: "text-red-400" },
  { id: 'music', label: "Music", color: "border-[#b026ff]", text: "text-[#b026ff]" },
  { id: 'sfx', label: "SFX", color: "border-emerald-500", text: "text-emerald-400" },
  { id: 'ambience', label: "Ambience", color: "border-indigo-500", text: "text-indigo-400" }
];

export function AudioEditorModule({ onApprove }: AudioEditorModuleProps) {
  const [state, setState] = useState<AudioEditorModuleState>(() => {
    return {
      importedMusic: [],
      importedVoiceAudios: [],
      uploadedAudioFiles: [],
      audioTracks: [],
      selectedClipId: null,
      noiseReductionEnabled: false,
      normalizationEnabled: false,
      eqNotes: "High-pass on voices at 80Hz.",
      compressionNotes: "",
      deEsserNotes: "",
      reverbAmount: 20,
      stereoWidth: 100,
      limiterTarget: -1,
      sfxList: [],
      ambiencePlan: "",
      audioMixPlan: "",
      selectedPlatformTarget: "youtube",
      loudnessTarget: "-14 LUFS",
      finalAudioMix: null,
      aiSuggestions: [
        { id: "as-1", title: "Частотный конфликт", text: "Музыка и голос конфликтуют в районе 2кГц. Рекомендуется использовать динамический эквалайзер на треке с музыкой.", type: "mix" }
      ],
      validationErrors: {},
      isProcessing: false
    };
  });

  const [activeTab, setActiveTab] = useState<'sources' | 'timeline' | 'clean' | 'sfx' | 'mix'>('sources');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('aura_audio_editor_state');
    if (cached) {
      try {
        const loaded = JSON.parse(cached);
        setState(prev => ({ ...prev, ...loaded }));
      } catch (err) {
        console.error("Failed to parse cached AudioEditor State", err);
      }
    }
  }, []);

  const saveGameState = (updated: AudioEditorModuleState) => {
    localStorage.setItem('aura_audio_editor_state', JSON.stringify(updated));
  };

  const updateState = (patch: Partial<AudioEditorModuleState>) => {
    setState(prev => {
      const u = { ...prev, ...patch };
      saveGameState(u);
      return u;
    });
  };

  // 1. Источники аудио (Import / Upload)
  const importMusic = () => {
    const mockMusic: ImportedAudioItem = {
      id: `mus-${Date.now()}`,
      title: "Generated Cinematic Theme",
      source: 'music',
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      duration: "2:05",
      createdAt: new Date().toLocaleTimeString()
    };
    updateState({ importedMusic: [...state.importedMusic, mockMusic] });
    alert("Музыка импортирована из модуля «Музыка»!");
  };

  const importVoiceAudios = () => {
    const mockVoice: ImportedAudioItem = {
      id: `voi-${Date.now()}`,
      title: "Voice Line - Scene 1",
      source: 'voice',
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      duration: "0:25",
      createdAt: new Date().toLocaleTimeString()
    };
    updateState({ importedVoiceAudios: [...state.importedVoiceAudios, mockVoice] });
    alert("TTS-реплики импортированы из модуля «Голос / TTS»!");
  };

  const openAudioUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processUploadedAudio = (files: FileList) => {
    const freshes: ImportedAudioItem[] = [];
    for (let i = 0; i < files.length; i++) {
      freshes.push({
        id: `upl-${Date.now()}-${i}`,
        title: files[i].name,
        source: 'upload',
        url: URL.createObjectURL(files[i]),
        duration: "??:??",
        createdAt: new Date().toLocaleTimeString()
      });
    }
    updateState({ uploadedAudioFiles: [...state.uploadedAudioFiles, ...freshes] });
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedAudio(e.dataTransfer.files);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedAudio(e.target.files);
    }
  };

  const removeAudioFile = (audioId: string) => {
    updateState({
      importedMusic: state.importedMusic.filter(a => a.id !== audioId),
      importedVoiceAudios: state.importedVoiceAudios.filter(a => a.id !== audioId),
      uploadedAudioFiles: state.uploadedAudioFiles.filter(a => a.id !== audioId),
      audioTracks: state.audioTracks.filter(t => t.audioId !== audioId)
    });
  };

  const replaceAudioFile = (audioId: string) => {
    // Simulated replace action
    alert(`Загрузите новый файл, чтобы заменить ${audioId}.`);
    openAudioUpload();
  };

  const togglePlayAudio = (url: string, id: string) => {
    if (isPlaying === id) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(id);
      audioRef.current = new Audio(url);
      audioRef.current.play().catch(e => {
        console.error(e);
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 300);
      });
      audioRef.current.onended = () => setIsPlaying(null);
    }
  };

  // 2. Audio Timeline
  const addAudioClipToTrack = (audioId: string, trackType: 'music' | 'voice' | 'sfx' | 'ambience', title: string) => {
    const newClip: AudioClip = {
      id: `clip-${Date.now()}`,
      audioId,
      title,
      trackType,
      startTime: 0,
      endTime: 10,
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      isMuted: false,
      isSolo: false,
      order: state.audioTracks.length
    };
    updateState({ audioTracks: [...state.audioTracks, newClip] });
    setActiveTab('timeline');
    alert("Клип добавлен на таймлайн!");
  };

  const updateAudioClip = (clipId: string, patch: Partial<AudioClip>) => {
    updateState({
      audioTracks: state.audioTracks.map(c => c.id === clipId ? { ...c, ...patch } : c)
    });
  };

  const deleteAudioClip = (clipId: string) => {
    updateState({
      audioTracks: state.audioTracks.filter(c => c.id !== clipId),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId
    });
  };

  const reorderAudioClips = () => {
    // Mock reorder to shift items up/down
    alert("Reorder functionality not fully implemented in UI preview yet.");
  };

  // 3. Clear and Process (Controls)
  // Covered directly by input bindings to state

  // 4. SFX and Ambience
  const generateSfxList = () => {
    const sfx: SFXItem[] = [
      { id: 'sfx1', name: "Cyberpunk Door Heavy", sceneMapping: "Сцена 1", timing: "00:05", intensity: "80%", description: "Тяжелая металлическая дверь с гидравлическим пневмо-выдохом." },
      { id: 'sfx2', name: "Rain Neon City", sceneMapping: "Сцена 1", timing: "Loop", intensity: "40%", description: "Мелкий дождь, ударяющийся о пластик и металл." }
    ];
    updateState({ sfxList: sfx });
    alert("ИИ подобрал SFX для сцен!");
  };

  const generateAmbiencePlan = () => {
    updateState({
      ambiencePlan: `[Сцена 1]: Низкочастотный гул (Drone) на бэкграунде (C1), капли воды, отдаленные сирены.\n[Сцена 2]: Шум толпы в синт-баре, приглушенный бас из соседней комнаты.`
    });
    alert("Атмосферный план (Ambience Plan) сгенерирован!");
  };

  // 5. Audio Mix Plan
  const generateAudioMixPlan = () => {
    updateState({
      audioMixPlan: "Микс должен быть плотным и агрессивным. Основной фокус на диалогах (Duck music under voice max -6dB). SFX выделены транзиентами. Лимитер настроить так, чтобы не было пиков выше -1dB True Peak."
    });
    alert("Микс-План успешно создан!");
  };

  const improveAudioMixPlan = () => {
    if (!state.audioMixPlan) return alert("Сначала создайте микс-план!");
    updateState({ isProcessing: true });
    setTimeout(() => {
      updateState({
        audioMixPlan: state.audioMixPlan + "\n\n[ИИ]: Добавлены рекомендации по параллельной компрессии на Drums buss, а также mid/side эквализация на синты, чтобы дать больше места голосу в центре.",
        isProcessing: false
      });
    }, 1000);
  };

  // 6. Processing / Export
  const processNoiseReductionIfSupported = () => {
    updateState({ isProcessing: true });
    setTimeout(() => {
      updateState({ isProcessing: false, noiseReductionEnabled: true });
      alert("Шляпа шума (Noise Print) проанализирована и удалена. Диалоги очищены!");
    }, 1500);
  };

  const normalizeVolumeIfSupported = () => {
    updateState({ isProcessing: true });
    setTimeout(() => {
      updateState({ isProcessing: false, normalizationEnabled: true });
      alert("Уровни громкости нормализованы для всех диалоговых клипов (-23 LUFS).");
    }, 1500);
  };

  const buildFinalAudioMixIfSupported = () => {
    updateState({ isProcessing: true });
    setTimeout(() => {
      const finalAudio: FinalMixItem = {
        id: `fin-${Date.now()}`,
        title: "Final_Mix_Bounce_v1.wav",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        createdAt: new Date().toLocaleTimeString(),
        duration: "03:15"
      };
      updateState({ isProcessing: false, finalAudioMix: finalAudio });
      alert("Финальный аудио микс успешно собран!");
      setActiveTab('mix');
    }, 3000);
  };

  // 7. ИИ-апгрейды
  const analyzeAudioIfSupported = () => alert("Аудио проанализировано. Проблем со спектром не найдено.");
  const proposeSoundImprovement = () => alert("ИИ предлагает добавить De-Esser на 6kHz для женского голоса.");
  const syncAudioWithScenes = () => alert("Авто-нарезка! SFX и Cues привязаны к таймкодам сцен.");
  const checkBalance = () => alert("Баланс: Голос звучит недостаточно ярко. Поднят ВЧ-спектр на +2dB.");
  const prepForPlatform = () => {
    updateState({ loudnessTarget: "-14 LUFS", selectedPlatformTarget: "youtube" });
    alert("Аудиочастоты и лимитер адаптированы под требования алгоритма YouTube.");
  };

  // 8. Передача дальше
  const sendToVideoEditor = () => alert("Аудио-микс (Bounced Stems) передан в Видеоредактор на новую звуковую дорожку!");
  const sendToExportModule = () => alert("Готовый микс направлен в Финальный Экспрот!");
  const saveAudioEditorModule = () => {
    alert("Состояние Аудиоредактора сохранено!");
    onApprove();
  };

  const allSources = [...state.importedMusic, ...state.importedVoiceAudios, ...state.uploadedAudioFiles];

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 min-h-screen text-slate-100 bg-transparent pb-32">
      
      {/* РАБОЧАЯ ОБЛАСТЬ */}
      <div className="flex-1 flex flex-col gap-6 bg-transparent">
        
        {/* Шапка модуля */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <Headphones className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-black tracking-widest uppercase">
                Модуль 8
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Рабочая область: Аудиоредактор
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={importMusic} className="px-3 py-1.5 bg-black/40 border border-slate-700 hover:border-[#b026ff]/40 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#b026ff]" /> Music
            </button>
            <button onClick={importVoiceAudios} className="px-3 py-1.5 bg-black/40 border border-slate-700 hover:border-red-400/40 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-red-400" /> TTS
            </button>
            <button onClick={saveAudioEditorModule} className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Сохранить Микс
            </button>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-800/60 custom-scrollbar">
          {[
            { id: 'sources', label: '1. Источники Аудио', icon: ListMusic },
            { id: 'timeline', label: '2. Audio Timeline', icon: Layers },
            { id: 'clean', label: '3. Обработка & FX', icon: Sliders },
            { id: 'sfx', label: '4. SFX & Атмосфера', icon: Volume2 },
            { id: 'mix', label: '5. Mix & Export', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 border-b-2 shrink-0 ${
                  active 
                    ? 'bg-indigo-500/10 border-indigo-400 text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-300 bg-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-400' : ''}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Вкладки */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            
            {/* ТАБ 1. SOURCES */}
            {activeTab === 'sources' && (
              <motion.div key="tab-sources" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
                
                <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 border-l-2 border-indigo-500 pl-2">
                       Загрузка и Импорт Аудио (Media Pool)
                    </span>
                  </div>

                  <div 
                    ref={fileInputRef as any}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleAudioDrop}
                    onClick={openAudioUpload}
                    className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                      isDragging ? 'border-indigo-400 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-black/40'
                    }`}
                  >
                    <Upload className="w-6 h-6 text-slate-500 mb-2" />
                    <p className="text-xs text-slate-300 font-bold">Перетащите медиа (.mp3, .wav) или кликните для обзора</p>
                    <input type="file" ref={fileInputRef} accept="audio/*" multiple className="hidden" onChange={handleAudioSelect} />
                  </div>
                  
                  {allSources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {allSources.map(audio => {
                        const isCur = isPlaying === audio.id;
                        return (
                          <div key={audio.id} className="p-3 bg-black/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3 group">
                            <div className="flex items-center gap-3 truncate">
                              <button onClick={() => togglePlayAudio(audio.url, audio.id)} className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all ${isCur ? 'bg-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
                                {isCur ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                              </button>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-bold text-slate-100 truncate">{audio.title}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    audio.source === 'music' ? 'bg-[#b026ff]/20 text-[#b026ff]' :
                                    audio.source === 'voice' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'
                                  }`}>{audio.source}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">{audio.duration}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select 
                                onChange={e => {
                                  if(e.target.value) {
                                    addAudioClipToTrack(audio.id, e.target.value as any, audio.title);
                                    e.target.value = "";
                                  }
                                }}
                                className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded p-1.5 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <option value="">+ на timeline</option>
                                <option value="music">как Music</option>
                                <option value="voice">как Voice</option>
                                <option value="sfx">как SFX</option>
                                <option value="ambience">как Ambience</option>
                              </select>
                              <button onClick={() => removeAudioFile(audio.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl mt-2">
                      Media Pool пуст. Импортируйте саундтрек или загрузите файлы.
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* ТАБ 2. TIMELINE */}
            {activeTab === 'timeline' && (
              <motion.div key="tab-timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
                
                <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 min-h-[300px]">
                   <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 border-l-2 border-indigo-500 pl-2">
                      Многодорожечный секвенсор
                    </span>
                    <button onClick={syncAudioWithScenes} className="px-3 py-1 bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300 rounded hover:text-white">Авто-Синхронизация по Сценам (ИИ)</button>
                  </div>

                  {/* Rendering tracks grouping */}
                  <div className="flex flex-col gap-2">
                    {TRACK_TYPES.map(track => {
                      const clips = state.audioTracks.filter(t => t.trackType === track.id);
                      return (
                        <div key={track.id} className="flex flex-col sm:flex-row gap-0 sm:gap-4 bg-black/60 border border-slate-800 rounded-xl overflow-hidden">
                          {/* Track Header */}
                          <div className={`w-full sm:w-32 bg-slate-900/80 p-3 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-slate-800 ${track.color} border-l-[3px]`}>
                            <span className={`text-[10px] uppercase font-black tracking-widest ${track.text}`}>{track.label}</span>
                            <div className="flex gap-1 mt-2 sm:mt-0">
                              <button className="px-1.5 py-0.5 bg-slate-800 text-slate-400 hover:text-white rounded text-[9px] font-bold">M</button>
                              <button className="px-1.5 py-0.5 bg-slate-800 text-slate-400 hover:text-white rounded text-[9px] font-bold">S</button>
                            </div>
                          </div>
                          
                          {/* Track Timeline Area */}
                          <div className="flex-1 p-2 flex gap-2 overflow-x-auto custom-scrollbar relative min-h-[60px] items-center">
                            {clips.length === 0 && <span className="text-[10px] text-slate-600 italic absolute left-4">Нет клипов...</span>}
                            {clips.map(clip => (
                              <div 
                                key={clip.id} 
                                onClick={() => updateState({ selectedClipId: clip.id })}
                                className={`shrink-0 h-10 min-w-[120px] rounded border px-2 py-1 flex flex-col justify-center cursor-pointer transition-colors relative group ${
                                  state.selectedClipId === clip.id ? 'bg-indigo-500/20 border-indigo-400' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                                }`}
                              >
                                <span className="text-[10px] font-bold text-white truncate w-full block">{clip.title}</span>
                                <span className="text-[9px] text-slate-400">{clip.startTime}s - {clip.endTime}s | Vol: {clip.volume}%</span>
                                
                                <button onClick={(e) => { e.stopPropagation(); deleteAudioClip(clip.id); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Инспектор выбранного клипа */}
                {state.selectedClipId && (
                  <div className="bg-black/30 border border-indigo-500/30 rounded-xl p-5 flex flex-col gap-4">
                     <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">Свойства Клипа</span>
                     {state.audioTracks.map(clip => {
                       if (clip.id !== state.selectedClipId) return null;
                       return (
                         <div key={"insp-" + clip.id} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="flex flex-col gap-1">
                             <label className="text-[10px] text-slate-400 uppercase font-bold">Start Time (sec)</label>
                             <input type="number" value={clip.startTime} onChange={e => updateAudioClip(clip.id, { startTime: Number(e.target.value) })} className="bg-black/50 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" />
                           </div>
                           <div className="flex flex-col gap-1">
                             <label className="text-[10px] text-slate-400 uppercase font-bold">End Time (sec)</label>
                             <input type="number" value={clip.endTime} onChange={e => updateAudioClip(clip.id, { endTime: Number(e.target.value) })} className="bg-black/50 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" />
                           </div>
                           <div className="flex flex-col gap-1">
                             <label className="text-[10px] text-slate-400 uppercase font-bold">Volume (%)</label>
                             <input type="number" min="0" max="150" value={clip.volume} onChange={e => updateAudioClip(clip.id, { volume: Number(e.target.value) })} className="bg-black/50 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" />
                           </div>
                           <div className="flex flex-col gap-1">
                             <label className="text-[10px] text-slate-400 uppercase font-bold">Fade In/Out (sec)</label>
                             <div className="flex gap-2">
                               <input type="number" value={clip.fadeIn} onChange={e => updateAudioClip(clip.id, { fadeIn: Number(e.target.value) })} className="w-full bg-black/50 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" placeholder="In" />
                               <input type="number" value={clip.fadeOut} onChange={e => updateAudioClip(clip.id, { fadeOut: Number(e.target.value) })} className="w-full bg-black/50 border border-slate-700 rounded p-1.5 text-xs text-white outline-none" placeholder="Out" />
                             </div>
                           </div>
                         </div>
                       )
                     })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ТАБ 3. PROCESSING / CLEANING */}
            {activeTab === 'clean' && (
              <motion.div key="tab-clean" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
                 
                 <div className="bg-black/30 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6 border-r border-slate-800/0 md:border-slate-800 pr-0 md:pr-4">
                      
                      <div>
                        <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 border-l-2 border-indigo-500 pl-2 mb-4 block">Очистка (Restoration)</span>
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-800 rounded-lg bg-black/40">
                            <input type="checkbox" checked={state.noiseReductionEnabled} onChange={e => updateState({ noiseReductionEnabled: e.target.checked })} className="w-4 h-4 accent-indigo-500 rounded" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-200">Noise Reduction (De-noise)</span>
                              <span className="text-[10px] text-slate-500">Удаляет фоновый шум из записей голоса.</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-800 rounded-lg bg-black/40">
                            <input type="checkbox" checked={state.normalizationEnabled} onChange={e => updateState({ normalizationEnabled: e.target.checked })} className="w-4 h-4 accent-indigo-500 rounded" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-200">Loudness Normalization</span>
                              <span className="text-[10px] text-slate-500">Приводит все клипы к единому уровню.</span>
                            </div>
                          </label>
                        </div>
                        <div className="mt-3 flex gap-2">
                           <button onClick={processNoiseReductionIfSupported} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 rounded hover:text-white transition-colors">Очистить шум (AI)</button>
                           <button onClick={normalizeVolumeIfSupported} className="flex-1 py-2 bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 rounded hover:text-white transition-colors">Нормализовать</button>
                        </div>
                      </div>

                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2 mb-2 block">DSP Эффекты</span>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">EQ Notes</label>
                            <input value={state.eqNotes} onChange={e => updateState({ eqNotes: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-indigo-500" placeholder="Прим: Срезать низкие частоты..." />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Compression</label>
                                <input value={state.compressionNotes} onChange={e => updateState({ compressionNotes: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none" placeholder="Ratio 4:1..." />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">De-Esser</label>
                                <input value={state.deEsserNotes} onChange={e => updateState({ deEsserNotes: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none" placeholder="Убрать свистящие на 7kHz..." />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Reverb (%)</label>
                                <input type="number" value={state.reverbAmount || 0} onChange={e => updateState({ reverbAmount: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Stereo Width (%)</label>
                                <input type="number" value={state.stereoWidth || 0} onChange={e => updateState({ stereoWidth: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Limit Target (dB)</label>
                                <input type="number" step="0.1" value={state.limiterTarget || 0} onChange={e => updateState({ limiterTarget: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none" />
                            </div>
                          </div>

                        </div>
                    </div>
                 </div>

              </motion.div>
            )}

            {/* ТАБ 4. SFX & AMBIENCE */}
            {activeTab === 'sfx' && (
              <motion.div key="tab-sfx" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
                 
                 <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2">
                        Атмосферный План (Ambience)
                      </span>
                      <button onClick={generateAmbiencePlan} className="px-3 py-1 bg-slate-900 border border-slate-700 text-[10px] font-bold text-[#00F0FF] rounded hover:border-[#00F0FF]">Создать Ambience Plan</button>
                    </div>
                    <textarea 
                      value={state.ambiencePlan}
                      onChange={e => updateState({ ambiencePlan: e.target.value })}
                      placeholder="Опишите постоянный фоновый шум, звуки окружения, текстуры для локаций..."
                      className="w-full min-h-[100px] bg-black/60 border border-slate-700 focus:border-[#00F0FF]/50 outline-none rounded-xl p-4 text-xs text-white resize-y"
                    />
                 </div>

                 <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 border-l-2 border-emerald-500 pl-2">
                        SFX Mapping List
                      </span>
                      <button onClick={generateSfxList} className="px-3 py-1 bg-slate-900 border border-slate-700 text-[10px] font-bold text-emerald-400 rounded hover:border-emerald-500">Подобрать SFX (ИИ)</button>
                    </div>
                    
                    {state.sfxList.length > 0 ? (
                      <div className="flex flex-col gap-3">
                         {state.sfxList.map(s => (
                           <div key={s.id} className="p-3 bg-black/50 border border-slate-800 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center">
                              <div className="flex-1 w-full">
                                <span className="text-xs font-bold text-slate-100 block">{s.name}</span>
                                <span className="text-[10px] text-slate-400 mt-1 block">{s.description}</span>
                              </div>
                              <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
                                 <div className="flex flex-col text-right">
                                   <span className="text-[9px] text-slate-500 uppercase font-bold">Сцена</span>
                                   <span className="text-[10px] text-white">{s.sceneMapping}</span>
                                 </div>
                                 <div className="flex flex-col text-right">
                                   <span className="text-[9px] text-slate-500 uppercase font-bold">Тайминг</span>
                                   <span className="text-[10px] text-emerald-400">{s.timing}</span>
                                 </div>
                                 <div className="flex flex-col text-right">
                                   <span className="text-[9px] text-slate-500 uppercase font-bold">Интенсив.</span>
                                   <span className="text-[10px] text-white">{s.intensity}</span>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                        Список звуковых эффектов пуст. ИИ может сгенерировать лист по Сценарию.
                      </div>
                    )}
                 </div>

              </motion.div>
            )}

            {/* ТАБ 5. MIX & EXPORT */}
            {activeTab === 'mix' && (
              <motion.div key="tab-mix" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                     <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="text-xs uppercase font-extrabold tracking-widest text-[#b026ff] border-l-2 border-[#b026ff] pl-2">
                          Audio Mix Plan
                        </span>
                        <div className="flex gap-2">
                           <button onClick={generateAudioMixPlan} className="p-1.5 bg-slate-900 border border-slate-700 text-slate-300 rounded hover:text-white"><Wand2 className="w-3.5 h-3.5" /></button>
                           <button onClick={improveAudioMixPlan} className="p-1.5 bg-slate-900 border border-[#b026ff]/30 text-[#b026ff] rounded hover:bg-[#b026ff]/10"><Sparkles className="w-3.5 h-3.5" /></button>
                        </div>
                     </div>
                     <textarea 
                        value={state.audioMixPlan}
                        onChange={e => updateState({ audioMixPlan: e.target.value })}
                        placeholder="Опишите концепцию сведения, баланс инструментов, приоритеты (напр. Ducking диалогов)..."
                        className="w-full min-h-[140px] bg-black/60 border border-slate-700 focus:border-[#b026ff]/50 outline-none rounded-xl p-4 text-xs text-white resize-y"
                      />
                   </div>

                   <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                     <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300 border-l-2 border-slate-500 pl-2">
                        Delivery Target (Mastering)
                     </span>
                     
                     <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Платформа / Стандарт</label>
                        <select 
                          value={state.selectedPlatformTarget || ""}
                          onChange={e => {
                            const val = e.target.value;
                            const plt = PLATFORMS.find(p => p.id === val);
                            updateState({ selectedPlatformTarget: val, loudnessTarget: plt ? plt.label.split('(')[1].replace(')', '').trim() : "" });
                          }}
                          className="bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                        >
                           {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                     </div>

                     <div className="flex flex-col gap-2 mt-2">
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Loudness Target (Целевая громкость)</label>
                        <input 
                           value={state.loudnessTarget || ""}
                           onChange={e => updateState({ loudnessTarget: e.target.value })}
                           className="bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-indigo-400 font-mono outline-none"
                        />
                     </div>
                   </div>
                 </div>

                 <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-indigo-500/50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                   <div className="flex flex-col flex-1">
                      <h3 className="text-lg font-black text-white">Финальный Рендеринг (Bounce)</h3>
                      <p className="text-xs text-slate-400 mt-1">Компиляция всех треков, очистка, применение эффектов и лимитирование под выбранный стандарт {state.loudnessTarget}.</p>
                   </div>
                   
                   <button 
                      onClick={buildFinalAudioMixIfSupported}
                      disabled={state.isProcessing}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                   >
                     {state.isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Activity className="w-5 h-5" />}
                     Собрать Финальный Микс
                   </button>
                 </div>

                 {state.finalAudioMix && (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-5 flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                         <Check className="w-6 h-6" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-white">{state.finalAudioMix.title}</span>
                         <span className="text-xs text-emerald-400/80 font-mono">Status: Mastered | {state.finalAudioMix.duration} | {state.loudnessTarget}</span>
                       </div>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                       <button onClick={() => togglePlayAudio(state.finalAudioMix!.url, state.finalAudioMix!.id)} className="w-full sm:w-10 h-10 shrink-0 bg-slate-900 border border-slate-700 rounded flex items-center justify-center text-white hover:border-emerald-400">
                         {isPlaying === state.finalAudioMix.id ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
                       </button>
                       <button onClick={sendToVideoEditor} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] md:text-xs rounded transition-colors uppercase whitespace-nowrap text-center">
                          Передать в Видеоредактор
                       </button>
                       <button onClick={sendToExportModule} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] md:text-xs rounded transition-colors uppercase whitespace-nowrap text-center flex items-center justify-center">
                          Финальный звук в Экспорт <ArrowRight className="w-3.5 h-3.5 inline ml-1 shrink-0" />
                       </button>
                     </div>
                   </motion.div>
                 )}

              </motion.div>
            )}

          </AnimatePresence>
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
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Анализ и микширование</span>
            <button onClick={analyzeAudioIfSupported} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" /> Проанализировать аудио
            </button>
            <button onClick={proposeSoundImprovement} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> Предложить улучшение звука
            </button>
            <button onClick={checkBalance} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Проверить баланс музыка/голос
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Генерация</span>
            <button onClick={generateSfxList} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Подобрать SFX
            </button>
            <button onClick={generateAudioMixPlan} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-rose-400" /> Создать audio mix plan
            </button>
            <button onClick={syncAudioWithScenes} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Синхронизировать звук со сценами
            </button>
            <button onClick={prepForPlatform} className="w-full py-2 px-3 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors text-left flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#00F0FF]" /> Подготовить звук под платформу
            </button>
          </div>
          
          {state.aiSuggestions.length > 0 && (
             <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-3">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Активные Советы</span>
               {state.aiSuggestions.map(s => (
                 <div key={s.id} className="p-3 bg-indigo-900/10 border border-indigo-500/30 rounded-lg text-xs relative">
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
