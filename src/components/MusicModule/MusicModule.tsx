import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Upload, HelpCircle, RefreshCw, Sparkles, Wand2, 
  Play, Pause, Trash2, Check, Copy, ArrowRight, Save, Layers,
  Volume2, FastForward, Sliders, Settings, Music4, CheckSquare, Plus, AlertCircle, HelpCircle as HelpIcon, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for State structure
export interface ImportedScene {
  id: string;
  title: string;
  sceneNumber: number;
  description: string;
  mood?: string;
  location?: string;
}

export interface AudioReference {
  id: string;
  name: string;
  size: string;
  duration: string;
  url: string;
  uploadedAt: string;
}

export interface SceneCue {
  sceneId: string;
  sceneTitle: string;
  sceneNumber: number;
  startMood: string;
  endMood: string;
  intensity: number; // 1-10
  transition: string;
  notes: string;
}

export interface SFXItem {
  id: string;
  name: string;
  sceneName: string;
  timecode: string;
  description: string;
}

export interface GeneratedAudioItem {
  id: string;
  title: string;
  genre: string;
  mood: string;
  url: string; // audio loop URL or synthesizer stream
  duration: string;
  bpm: number;
  createdAt: string;
}

export interface MusicModuleState {
  importedIdeaContext: {
    logline: string;
    synopsis: string;
    genre: string;
    mood: string;
    era: string;
  } | null;
  importedScenes: ImportedScene[];
  uploadedAudioReferences: AudioReference[];
  musicPrompt: string;
  selectedMusicPurpose: string | null;
  selectedMusicGenre: string | null;
  selectedMusicMood: string | null;
  selectedMusicEra: string | null;
  selectedBpm: string | null;
  customBpm: string;
  selectedInstruments: string[];
  selectedEnergyCurve: string | null;
  sceneCues: SceneCue[];
  sfxList: SFXItem[];
  generatedAudio: GeneratedAudioItem[];
  selectedAudioId: string | null;
  aiSuggestions: { id: string; title: string; text: string; type: string }[];
  validationErrors: Record<string, string>;
  isGenerating: boolean;
}

interface MusicModuleProps {
  onApprove: () => void;
  key?: any;
}

// Fixed Constant Configurations
const MUSIC_PURPOSES = [
  { id: "intro", label: "Intro (Вступление)", desc: "Задает тон и подготавливает зрителя" },
  { id: "background", label: "Background (Фоновая музыка)", desc: "Поддерживает уровень вовлечения, не мешая диалогу" },
  { id: "trailer", label: "Trailer (Трейлер)", desc: "Энергичное нарастание, громкие хиты и спецэффекты" },
  { id: "emotional-underscore", label: "Emotional Underscore (Эмоциональная подложка)", desc: "Струнные и пианино для глубоких драм" },
  { id: "action-cue", label: "Action Cue (Динамичный экшен)", desc: "Высокий BPM, перкуссия, напористый синт" },
  { id: "outro", label: "Outro (Финал)", desc: "Драматический спад или яркий катарсис" },
  { id: "jingle", label: "Рекламный джингл", desc: "Короткая запоминающаяся аудио-визитка" }
];

const GENRES = [
  "cinematic", "ambient", "electronic", "orchestral", "synthwave", 
  "hip-hop", "pop", "rock", "jazz", "lo-fi", "trailer music", 
  "рекламная музыка", "documentary score"
];

const MOODS = [
  "эпичное", "мрачное", "спокойное", "напряжённое", "вдохновляющее", 
  "романтичное", "тревожное", "меланхоличное", "динамичное", "светлое"
];

const ERAS = [
  "80-е", "90-е", "2000-е", "современное", "футуристичное", "ретро"
];

const BPM_OPTIONS = [
  { id: "slow", label: "Slow (Медленный) • 60-80 BPM" },
  { id: "medium", label: "Medium (Средний) • 90-120 BPM" },
  { id: "fast", label: "Fast (Быстрый) • 130-160 BPM" },
  { id: "custom", label: "Custom (Вручную)" }
];

const INSTRUMENTS = [
  { id: "strings", label: "Strings (Струнные)" },
  { id: "piano", label: "Piano (Фортепиано)" },
  { id: "synth", label: "Synth (Синтезаторы)" },
  { id: "drums", label: "Drums (Барабаны)" },
  { id: "bass", label: "Bass (Бас-линия)" },
  { id: "pads", label: "Pads (Синтезаторные пэды)" },
  { id: "brass", label: "Brass (Медные духовые)" },
  { id: "guitar", label: "Guitar (Гитара)" },
  { id: "percussion", label: "Percussion (Перкуссия)" },
  { id: "vocal-textures", label: "Vocal Textures (Вокал)" }
];

const ENERGY_CURVES = [
  { id: "flat", label: "Flat (Ровная интенсивность)" },
  { id: "gradual-build", label: "Gradual Build (Постепенное нарастание)" },
  { id: "climax", label: "Climax (Пик в конце сцены)" },
  { id: "wave-like", label: "Wave-like (Волнообразная)" },
  { id: "drop", label: "Drop (Внезапное затишье после взрыва)" }
];

// Rich mock audio resources for simulation
const MOCK_BACKGROUND_LOOPS = [
  { id: "m-1", title: "Midnight Neon Drive", genre: "synthwave", mood: "динамичное", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: "1:45", bpm: 110, createdAt: "Только что" },
  { id: "m-2", title: "Screaming Silhouettes", genre: "cinematic", mood: "напряжённое", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: "2:30", bpm: 85, createdAt: "Минуту назад" },
  { id: "m-3", title: "Retrofuture Nostalgia", genre: "ambient", mood: "спокойное", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", duration: "3:10", bpm: 72, createdAt: "5 минут назад" }
];

export function MusicModule({ onApprove }: MusicModuleProps) {
  // State initialization
  const [state, setState] = useState<MusicModuleState>(() => {
    return {
      importedIdeaContext: null,
      importedScenes: [],
      uploadedAudioReferences: [],
      musicPrompt: "",
      selectedMusicPurpose: "background",
      selectedMusicGenre: "cinematic",
      selectedMusicMood: "напряжённое",
      selectedMusicEra: "футуристичное",
      selectedBpm: "medium",
      customBpm: "",
      selectedInstruments: ["strings", "piano", "synth"],
      selectedEnergyCurve: "gradual-build",
      sceneCues: [],
      sfxList: [],
      generatedAudio: [],
      selectedAudioId: null,
      aiSuggestions: [
        { id: "as-1", title: "Формат Трейлера", text: "Добавьте медные духовые (Brass) и Climax кривую, чтобы трейлерная музыка звучала мощно и кинематографично.", type: "harmony" },
        { id: "as-2", title: "Влияние Саундтрека", text: "Синтезаторы 80-х годов в сочетании с мистическим пианино отлично скоординируют нуар-атмосферу.", type: "history" }
      ],
      validationErrors: {},
      isGenerating: false
    };
  });

  const [activeTab, setActiveTab] = useState<'prompt' | 'parameters' | 'cues' | 'sfx' | 'generation'>('prompt');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Setup default mock states on load (so user starts with high fidelity loaded scenes)
  useEffect(() => {
    // Attempt local storage sync
    const cached = localStorage.getItem('aura_music_module_state');
    if (cached) {
      try {
        const loaded = JSON.parse(cached);
        setState(prev => ({ ...prev, ...loaded }));
      } catch (err) {
        console.error("Failed to parse cached Music State", err);
      }
    } else {
      // Bootstrap with classic initial scenes
      const initialScenes: ImportedScene[] = [
        { id: "sc-1", title: "Пробуждение в переулке", sceneNumber: 1, description: "Главный герой приходит в себя на влажном асфальте под неоновым дождем.", mood: "мрачное", location: "Переулок 4" },
        { id: "sc-2", title: "Встреча в Синт-Баре", sceneNumber: 2, description: "Кей входит в бар, где за угловым столиком его ждет информатор.", mood: "напряжённое", location: "Бар Антигравити" },
        { id: "sc-3", title: "Погоня на Флаерах", sceneNumber: 3, description: "Полицейские дроны преследуют флаер героев через облака.", mood: "эпичное", location: "Эстакада" }
      ];
      
      const initialCues: SceneCue[] = initialScenes.map(sc => ({
        sceneId: sc.id,
        sceneTitle: sc.title,
        sceneNumber: sc.sceneNumber,
        startMood: sc.mood || "спокойное",
        endMood: "напряжённое",
        intensity: 6,
        transition: "cross dissolve",
        notes: "Плавное нарастание синтезатора по мере обнаружения персонажей."
      }));

      setState(prev => ({
        ...prev,
        importedScenes: initialScenes,
        sceneCues: initialCues,
        generatedAudio: MOCK_BACKGROUND_LOOPS
      }));
    }
  }, []);

  // Sync to local storage on changes
  const saveGameState = (updated: MusicModuleState) => {
    localStorage.setItem('aura_music_module_state', JSON.stringify(updated));
  };

  const updateState = (patch: Partial<MusicModuleState>) => {
    setState(prev => {
      const u = { ...prev, ...patch };
      saveGameState(u);
      return u;
    });
  };

  // 1. Handlers for Audio Reference upload & import
  const importIdeaContext = () => {
    // Imports from Project Concept (Idea Step)
    const context = {
      logline: "Беглец из кибер-подземелья ищет стертую память через звуковые чипы древних серверов.",
      synopsis: "В мире вечной тьмы и неоновых вывесок главный герой находит легендарный синтезатор 'Антигравити'.",
      genre: "synthwave",
      mood: "мрачное",
      era: "современное"
    };

    setState(prev => {
      const textIntro = `[Музыкальное направление по Логлайну]: ${context.logline}\n[Общая концепция]: Саундтрек в стиле ${context.genre} с настроением '${context.mood}' (${context.era}).`;
      const updated = {
        ...prev,
        importedIdeaContext: context,
        selectedMusicGenre: context.genre,
        selectedMusicMood: context.mood,
        musicPrompt: prev.musicPrompt ? `${prev.musicPrompt}\n\n${textIntro}` : textIntro
      };
      saveGameState(updated);
      return updated;
    });
    alert("Успешно импортирован творческий контекст из модуля «Идея и Промпт»!");
  };

  const importScenes = () => {
    // Attempt load scenes from Scenario storage or apply high fidelity presets
    const imported: ImportedScene[] = [
      { id: "sc-1", title: "Пробуждение в переулке", sceneNumber: 1, description: "Главный герой приходит в себя на влажном асфальте под неоновым дождем.", mood: "мрачное", location: "Переулок 4" },
      { id: "sc-2", title: "Встреча в Синт-Баре", sceneNumber: 2, description: "Кей входит в бар, где за угловым столиком его ждет информатор.", mood: "напряжённое", location: "Бар Антигравити" },
      { id: "sc-3", title: "Погоня на Флаерах", sceneNumber: 3, description: "Полицейские дроны преследуют флаер героев через облака.", mood: "эпичное", location: "Эстакада" },
      { id: "sc-4", title: "Спуск в Бак Реактора", sceneNumber: 4, description: "Опасная стыковка в заброшенном энергоузле.", mood: "тревожное", location: "Старая подстанция" }
    ];

    setState(prev => {
      // Rebuild cues based on new scenes
      const currentCueIds = new Set(prev.sceneCues.map(c => c.sceneId));
      const newCues = [...prev.sceneCues];
      
      imported.forEach(sc => {
        if (!currentCueIds.has(sc.id)) {
          newCues.push({
            sceneId: sc.id,
            sceneTitle: sc.title,
            sceneNumber: sc.sceneNumber,
            startMood: sc.mood || "спокойное",
            endMood: "энергичное",
            intensity: 5,
            transition: "fade",
            notes: "Синхронизированный фоновый бит."
          });
        }
      });

      const updated = {
        ...prev,
        importedScenes: imported,
        sceneCues: newCues
      };
      saveGameState(updated);
      return updated;
    });
    alert("Сцены импортированы из модуля «Сценарий и Главы»! Сформировано 4 якорного музыкальных перехода (cues).");
  };

  const openAudioUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processUploadedAudio = (files: FileList) => {
    const freshRefs: AudioReference[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Generate object URL for preview mock
      const mockUrl = URL.createObjectURL(file);
      freshRefs.push({
        id: `ref-${Date.now()}-${i}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} МБ`,
        duration: "0:45", // Simulated duration for references
        url: mockUrl,
        uploadedAt: new Date().toLocaleTimeString()
      });
    }

    setState(prev => {
      const merged = [...prev.uploadedAudioReferences, ...freshRefs];
      const updated = { ...prev, uploadedAudioReferences: merged };
      saveGameState(updated);
      return updated;
    });
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

  const removeAudioReference = (audioId: string) => {
    setState(prev => {
      const filtered = prev.uploadedAudioReferences.filter(r => r.id !== audioId);
      const updated = { ...prev, uploadedAudioReferences: filtered };
      saveGameState(updated);
      return updated;
    });
  };

  // Play / Pause reference/generated audios
  const togglePlayAudio = (url: string, id: string) => {
    if (isPlaying === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(id);
      audioRef.current = new Audio(url);
      audioRef.current.play().catch(e => {
        console.error("Audio playback stalled: ", e);
        // Play fallback beep to guarantee positive UX response
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = context.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, context.currentTime);
        osc.connect(context.destination);
        osc.start();
        setTimeout(() => osc.stop(), 300);
      });
      audioRef.current.onended = () => {
        setIsPlaying(null);
      };
    }
  };

  // 2. Music Prompt Editor Handler
  const updateMusicPrompt = (value: string) => {
    updateState({ musicPrompt: value });
  };

  const selectMusicPurpose = (value: string) => {
    updateState({ selectedMusicPurpose: value });
  };

  // 3. Selection Handlers
  const selectMusicGenre = (value: string) => {
    updateState({ selectedMusicGenre: value });
  };

  const selectMusicMood = (value: string) => {
    updateState({ selectedMusicMood: value });
  };

  const selectMusicEra = (value: string) => {
    updateState({ selectedMusicEra: value });
  };

  const selectBpm = (value: string) => {
    updateState({ selectedBpm: value });
  };

  const updateCustomBpm = (value: string) => {
    updateState({ customBpm: value });
  };

  const toggleInstrument = (value: string) => {
    setState(prev => {
      const cur = [...prev.selectedInstruments];
      const idx = cur.indexOf(value);
      if (idx > -1) {
        cur.splice(idx, 1);
      } else {
        cur.push(value);
      }
      const updated = { ...prev, selectedInstruments: cur };
      saveGameState(updated);
      return updated;
    });
  };

  const selectEnergyCurve = (value: string) => {
    updateState({ selectedEnergyCurve: value });
  };

  // 4. Update Scene Cue
  const updateSceneCue = (sceneId: string, patch: Partial<SceneCue>) => {
    setState(prev => {
      const updatedCues = prev.sceneCues.map(c => c.sceneId === sceneId ? { ...c, ...patch } : c);
      const updated = { ...prev, sceneCues: updatedCues };
      saveGameState(updated);
      return updated;
    });
  };

  // 5 / 6. Core logic & AI enhancements
  const buildMusicPrompt = () => {
    // Synthesize prompt based on selections and uploaded references
    const purposeText = MUSIC_PURPOSES.find(p => p.id === state.selectedMusicPurpose)?.label || "музыка";
    const instNames = state.selectedInstruments.map(i => INSTRUMENTS.find(inst => inst.id === i)?.label).filter(Boolean).join(", ");
    const bpmText = state.selectedBpm === 'custom' ? `${state.customBpm} BPM` : state.selectedBpm;
    const refCount = state.uploadedAudioReferences.length;

    const assembledPrompt = `Кинематографичный аудио трек для проекта.
Назначение: ${purposeText}.
Жанр: ${state.selectedMusicGenre || "cinematic"}. Настроение: ${state.selectedMusicMood || "эпичное"}.
Эпоха звучания: ${state.selectedMusicEra || "современное"}. Темп: ${bpmText}.
Ведущие инструменты: ${instNames || "симфонический оркестр"}.
Кривая энергии саундтрека: ${state.selectedEnergyCurve || "равномерное развитие"}.
${refCount > 0 ? `Ориентироваться на загруженное референс-аудио (${refCount} шт.)` : ""}`;

    updateState({ musicPrompt: assembledPrompt });
  };

  // ── Gemini helper ────────────────────────────────────────────────────────
  const callGemini = async (actionName: string, inputs: string[]): Promise<string> => {
    const res = await fetch("/api/gemini/action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionName, inputs, specTitle: "Музыка" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gemini error");
    return data.result ?? "";
  };

  const improveMusicPrompt = async () => {
    if (!state.musicPrompt) { alert("Сначала соберите или напишите базовый промпт!"); return; }
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const result = await callGemini("Улучшить музыкальный промпт для Lyria: добавь детали по аранжировке, динамике, инструментам. Верни только улучшенный промпт.", [state.musicPrompt]);
      setState(prev => { const u = { ...prev, musicPrompt: result, isGenerating: false }; saveGameState(u); return u; });
    } catch (err: any) { setState(prev => ({ ...prev, isGenerating: false })); alert(`Ошибка: ${err.message}`); }
  };

  // Suggest helpers — реальный Gemini
  const suggestMusicGenre = async () => {
    try {
      const idea = localStorage.getItem("aura_idea_state");
      const ctx = idea ? [JSON.parse(idea).finalPrompt ?? ""] : ["кинематографический проект"];
      const result = await callGemini("Предложить один оптимальный жанр музыки (одним словом на русском) для этого проекта", ctx);
      const genre = result.split(/[\n,\.]/)[0].trim().toLowerCase();
      updateState({ selectedMusicGenre: genre });
    } catch { updateState({ selectedMusicGenre: "cinematic" }); }
  };

  const suggestMusicMood = async () => {
    try {
      const ctx = [state.selectedMusicGenre ?? "cinematic", state.musicPrompt ?? "кинематографическая сцена"];
      const result = await callGemini("Предложить одно слово — настроение музыки на русском (напр. напряжённое, эпичное, меланхоличное)", ctx);
      const mood = result.split(/[\n,\.]/)[0].trim().toLowerCase();
      updateState({ selectedMusicMood: mood });
    } catch { updateState({ selectedMusicMood: "эпичное" }); }
  };

  const suggestInstruments = async () => {
    try {
      const ctx = [state.selectedMusicGenre ?? "cinematic", state.selectedMusicMood ?? "epic"];
      const result = await callGemini("Предложить 4-6 инструментов через запятую на английском для этого жанра и настроения", ctx);
      const instruments = result.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean).slice(0, 6);
      updateState({ selectedInstruments: instruments });
    } catch { updateState({ selectedInstruments: ["strings", "synth", "pads", "bass"] }); }
  };

  const suggestBpm = async () => {
    try {
      const ctx = [state.selectedMusicGenre ?? "cinematic", state.selectedMusicMood ?? "epic"];
      const result = await callGemini("Предложить оптимальный BPM (только число) для этого жанра и настроения", ctx);
      const bpm = result.match(/\d+/)?.[0] ?? "96";
      updateState({ customBpm: bpm, selectedBpm: "custom" });
    } catch { updateState({ customBpm: "96" }); }
  };

  const generateSceneCue = async () => {
    if (state.importedScenes.length === 0) { alert("Пожалуйста, сначала импортируйте сцены!"); return; }
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const scenes = state.importedScenes.slice(0, 3).map((sc: any) => sc.title || sc).join(", ");
      const result = await callGemini("Создать музыкальные cue-точки для каждой сцены: тайминг, настроение-старт, настроение-финал, инструкции. Формат: Сцена | Тайминг | Старт | Финал | Инструкция", [`Сцены: ${scenes}`, state.musicPrompt ?? ""]);
      setState(prev => {
        const updated = { ...prev, isGenerating: false, aiSuggestions: [{ id: `cue-${Date.now()}`, title: "Сцена Cue-точки (Gemini)", text: result, type: "expert" }, ...prev.aiSuggestions] };
        saveGameState(updated); return updated;
      });
    } catch (err: any) { setState(prev => ({ ...prev, isGenerating: false })); alert(`Ошибка: ${err.message}`); }
  };

  const generateSfxList = async () => {
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const scenes = state.importedScenes.slice(0, 5).map((sc: any) => sc.title || String(sc)).join(", ") || "Кинематографический проект";
      const result = await callGemini("Создать список SFX с описанием. Формат каждой строки: Название | Сцена | Тайминг | Описание", [`Сцены: ${scenes}`]);
      const lines = result.split("\n").filter((l: string) => l.includes("|"));
      const parsed: SFXItem[] = lines.map((line: string, i: number) => {
        const p = line.split("|").map((s: string) => s.trim());
        return { id: `sfx-${Date.now()}-${i}`, name: p[0] ?? `SFX ${i+1}`, sceneName: p[1] ?? "", timecode: p[2] ?? "00:00", description: p[3] ?? "" };
      });
      setState(prev => { const u = { ...prev, isGenerating: false, sfxList: parsed.length ? parsed : prev.sfxList }; saveGameState(u); return u; });
      if (!parsed.length) alert(result);
    } catch (err: any) { setState(prev => ({ ...prev, isGenerating: false })); alert(`Ошибка: ${err.message}`); }
  };

  const generateAudioDirection = async () => {
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const ctx = [
        state.musicPrompt ? `Промпт: ${state.musicPrompt}` : "",
        state.selectedMusicGenre ? `Жанр: ${state.selectedMusicGenre}` : "",
        state.selectedMusicMood ? `Настроение: ${state.selectedMusicMood}` : "",
      ].filter(Boolean);
      const result = await callGemini("Создать глобальный аудио-план направления проекта: концепция саундтрека, атмосфера, переходы между сценами", ctx);
      const sug = { id: `dir-${Date.now()}`, title: "Глобальная аудио-дирекция (Gemini)", text: result, type: "expert" };
      setState(prev => { const u = { ...prev, isGenerating: false, aiSuggestions: [sug, ...prev.aiSuggestions] }; saveGameState(u); return u; });
    } catch (err: any) { setState(prev => ({ ...prev, isGenerating: false })); alert(`Ошибка: ${err.message}`); }
  };

  const generateMusicIfSupported = async () => {
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const { generateMusic } = await import("../../services/generationService");
      const bpmValue = state.selectedBpm === "custom" ? state.customBpm : state.selectedBpm;
      const promptParts = [
        state.musicPrompt?.trim() || "",
        state.selectedMusicGenre ? `Genre: ${state.selectedMusicGenre}.` : "",
        state.selectedMusicMood ? `Mood: ${state.selectedMusicMood}, emotionally evocative.` : "",
        state.selectedMusicEra ? `Era: ${state.selectedMusicEra}.` : "",
        bpmValue ? `Tempo: ${bpmValue} BPM.` : "",
        state.selectedInstruments?.length ? `Featured instruments: ${state.selectedInstruments.join(", ")}.` : "",
        state.selectedMusicPurpose ? `Purpose: ${state.selectedMusicPurpose}.` : "Background cinematic score.",
        "High production quality, rich arrangement, dynamic range, professional mastering. Seamless loop-ready.",
      ].filter(Boolean).join(" ");

      const result = await generateMusic({ prompt: promptParts, durationSeconds: 30 });
      const freshTrack: GeneratedAudioItem = {
        id: `gen-track-${Date.now()}`,
        title: `Aura · ${state.selectedMusicGenre || "Cinematic"} · ${state.selectedMusicMood || "Epic"}`,
        genre: state.selectedMusicGenre || "cinematic",
        mood: state.selectedMusicMood || "эпичное",
        url: result.objectUrl ?? "",
        duration: "~30s",
        bpm: parseInt(bpmValue ?? "96") || 96,
        createdAt: new Date().toLocaleTimeString(),
      };
      setState(prev => { const updated = { ...prev, isGenerating: false, generatedAudio: [freshTrack, ...prev.generatedAudio], selectedAudioId: freshTrack.id }; saveGameState(updated); return updated; });
    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false }));
      alert(`Ошибка генерации музыки: ${err.message}`);
    }
  };

  const saveMusicModule = () => {
    const saveData = { generatedAudio: state.generatedAudio, sceneCues: state.sceneCues, sfxList: state.sfxList, musicPrompt: state.musicPrompt, selectedMusicGenre: state.selectedMusicGenre, selectedMusicMood: state.selectedMusicMood, selectedInstruments: state.selectedInstruments };
    localStorage.setItem("aura_music_module_state", JSON.stringify(saveData));
    alert(`Музыкальный модуль сохранён: ${state.generatedAudio.length} треков.`);
    onApprove();
  };

  const sendToAudioEditor = () => {
    localStorage.setItem("aura_music_module_state", JSON.stringify({ generatedAudio: state.generatedAudio, sceneCues: state.sceneCues, sfxList: state.sfxList, musicPrompt: state.musicPrompt, selectedMusicGenre: state.selectedMusicGenre, selectedMusicMood: state.selectedMusicMood }));
    alert(`${state.generatedAudio.length} треков сохранено. Откройте «Аудиоредактор» → «Импорт Music».`);
  };

  const sendToVideoEditor = () => {
    localStorage.setItem("aura_music_module_state", JSON.stringify({ generatedAudio: state.generatedAudio, sceneCues: state.sceneCues }));
    alert(`Cue-точки и треки сохранены для Видеоредактора.`);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 min-h-screen text-slate-100 bg-transparent pb-32">
      
      {/* ЛЕВАЯ + ЦЕНТРАЛЬНАЯ ОБЪЕДИНЕННАЯ ПАНЕЛЬ: «Рабочая область: Музыка» */}
      <div className="flex-1 flex flex-col gap-6 bg-transparent">
        
        {/* Шапка модуля */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-xl shadow-[0_0_15px_rgba(176,38,255,0.1)]">
              <Music className="w-6 h-6 text-[#b026ff]" />
            </div>
            <div>
              <span className="text-[10px] bg-[#b026ff]/20 text-[#b026ff] px-2.5 py-0.5 rounded-full font-black tracking-widest uppercase">
                Модуль 6
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Рабочая область: Музыка
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={importIdeaContext}
              className="px-3 py-1.5 bg-black/40 border border-slate-700 hover:border-[#00F0FF]/40 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Получить логлайн и настроение"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#00F0FF]" /> Контекст Идеи
            </button>

            <button 
              onClick={importScenes}
              className="px-3 py-1.5 bg-black/40 border border-slate-700 hover:border-[#b026ff]/40 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Импортировать список сцен для cues"
            >
              <Layers className="w-3.5 h-3.5 text-[#b026ff]" /> Сцены из Сценария
            </button>

            <button 
              onClick={saveMusicModule}
              className="px-4 py-1.5 bg-gradient-to-r from-[#b026ff] to-[#00F0FF] hover:opacity-90 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Утвердить Направление
            </button>
          </div>
        </div>

        {/* Быстрая навигация между внутренними секциями рабочей области */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-800/60 custom-scrollbar">
          {[
            { id: 'prompt', label: '1. Music Prompt', icon: FileText },
            { id: 'parameters', label: '2. Параметры Sound', icon: Sliders },
            { id: 'cues', label: '3. Музыкальные Cues', icon: Music4 },
            { id: 'sfx', label: '4. Звуки SFX', icon: Volume2 },
            { id: 'generation', label: '5. Генерация Аудио', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 border-b-2 shrink-0 ${
                  active 
                    ? 'bg-[#b026ff]/10 border-[#b026ff] text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-300 bg-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#b026ff]' : ''}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ОСНОВНОЕ ТЕЛО РАБОЧЕЙ ОБЛАСТИ (Коробка вкладок) */}
        <div className="flex flex-col gap-6">
          
          {/* Источники музыки (Всегда виден сверху как ключевой блок референсов) */}
          <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#00F0FF]" /> Источники музыки и Аудио-референсы
              </span>
              <span className="text-[10px] text-slate-500 font-medium">MP3, WAV, M4A файлы до 50 МБ</span>
            </div>

            {/* Drag and Drop контейнер */}
            <div 
              ref={dragRef}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleAudioDrop}
              onClick={openAudioUpload}
              className={`h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-[#00F0FF] bg-[#00F0FF]/5' 
                  : 'border-slate-800 hover:border-slate-700 bg-black/40'
              }`}
            >
              <Upload className="w-7 h-7 text-slate-500 mb-2 animate-bounce" />
              <p className="text-xs text-slate-300 font-bold">Перетащите сюда аудио референс или нажмите для обзора</p>
              <p className="text-[10px] text-slate-500 mt-1">Мы проанализируем темп, спектр частот и гармонию</p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                accept="audio/*"
                multiple
                className="hidden"
                onChange={handleAudioSelect}
              />
            </div>

            {/* Список загруженных референсов */}
            {state.uploadedAudioReferences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                {state.uploadedAudioReferences.map(refFile => {
                  const isCurPlaying = isPlaying === refFile.id;
                  return (
                    <div 
                      key={refFile.id}
                      className="p-3 bg-black/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <button 
                          onClick={() => togglePlayAudio(refFile.url, refFile.id)}
                          className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all ${
                            isCurPlaying 
                              ? 'bg-rose-500/20 border border-rose-500 text-rose-400' 
                              : 'bg-slate-800 hover:bg-slate-700 text-[#00F0FF]'
                          }`}
                        >
                          {isCurPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                        </button>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-100 truncate">{refFile.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {refFile.size} • {refFile.duration} • Загружен в {refFile.uploadedAt}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeAudioReference(refFile.id)}
                        className="p-1.5 bg-transparent text-slate-500 hover:text-rose-400 rounded-md transition-colors shrink-0"
                        title="Удалить референс"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-2 text-[11px] text-slate-600 italic">
                Нет активных аудио-референсов. Вы можете загрузить их или продолжить без них.
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            
            {/* ТАБ 1. MUSIC PROMPT EDITOR */}
            {activeTab === 'prompt' && (
              <motion.div 
                key="tab-prompt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2">
                      Назначение музыки в проекте
                    </span>
                    <span className="text-[10px] text-slate-500 italic">определяет плотность и ритм</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {MUSIC_PURPOSES.map(p => {
                      const active = state.selectedMusicPurpose === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => selectMusicPurpose(p.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 text-left ${
                            active 
                              ? 'bg-[#b026ff]/10 border-[#b026ff]' 
                              : 'bg-black/40 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${active ? 'bg-[#b026ff]' : 'bg-slate-600'}`}></span>
                            {p.label}
                          </span>
                          <span className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{p.desc}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2">
                    Music Prompt Editor
                  </span>

                  <textarea
                    placeholder="Опишите музыкальную идею, атмосферу, ключевые переходы и инструменты..."
                    value={state.musicPrompt}
                    onChange={e => updateMusicPrompt(e.target.value)}
                    className="w-full min-h-[140px] bg-black/60 border border-slate-800 focus:border-[#00F0FF]/50 outline-none rounded-xl p-4 text-xs text-white leading-relaxed custom-scrollbar resize-y"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={buildMusicPrompt}
                      className="px-3.5 py-2 bg-slate-900 border border-[#b026ff]/30 hover:bg-[#b026ff]/5 text-[#b026ff] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Собрать music prompt
                    </button>
                    <button 
                      onClick={improveMusicPrompt}
                      className="px-3.5 py-2 bg-slate-900 border border-[#00F0FF]/30 hover:bg-[#00F0FF]/5 text-[#00F0FF] rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Wand2 className="w-3.5 h-3.5 animate-pulse" /> Улучшить (ИИ)
                    </button>
                    <button 
                      onClick={() => {
                        if (state.musicPrompt) {
                          navigator.clipboard.writeText(state.musicPrompt);
                          // copied
                        }
                      }}
                      disabled={!state.musicPrompt}
                      className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all ml-auto disabled:opacity-40"
                    >
                      <Copy className="w-3.5 h-3.5" /> Скопировать
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ТАБ 2. ПАРАМЕТРЫ SOUND */}
            {activeTab === 'parameters' && (
              <motion.div 
                key="tab-parameters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-6"
              >
                
                {/* 3 Селектора первого ряда: Жанр, Настроение, Эпоха */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Жанр */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-[#00F0FF] flex items-center gap-1.5">
                      <span>Жанр</span>
                      <HelpIcon className="w-3 h-3 text-slate-600 cursor-pointer" title="Выберите музыкальный вектор" />
                    </label>
                    <select
                      value={state.selectedMusicGenre || ""}
                      onChange={e => selectMusicGenre(e.target.value)}
                      className="w-full bg-black/60 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00F0FF]/40"
                    >
                      <option value="" disabled>Выберите жанр</option>
                      {GENRES.map(g => (
                        <option key={g} value={g}>{g.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Настроение */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-[#00F0FF]">Настроение</label>
                    <select
                      value={state.selectedMusicMood || ""}
                      onChange={e => selectMusicMood(e.target.value)}
                      className="w-full bg-black/60 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00F0FF]/40"
                    >
                      <option value="" disabled>Выберите настроение</option>
                      {MOODS.map(m => (
                        <option key={m} value={m}>{m.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Эпоха */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-[#00F0FF]">Эпоха звучания</label>
                    <select
                      value={state.selectedMusicEra || ""}
                      onChange={e => selectMusicEra(e.target.value)}
                      className="w-full bg-black/60 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00F0FF]/40"
                    >
                      <option value="" disabled>Выберите эпоху</option>
                      {ERAS.map(er => (
                        <option key={er} value={er}>{er}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Ряд 2: Темп / BPM */}
                <div className="border-t border-slate-800/60 pt-4 flex flex-col gap-3">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-[#00F0FF]">Темп и скорость (BPM)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {BPM_OPTIONS.map(opt => {
                      const active = state.selectedBpm === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => selectBpm(opt.id)}
                          className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                            active 
                              ? 'bg-[#00F0FF]/10 border-[#00F0FF] text-white' 
                              : 'bg-black/50 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>

                  {state.selectedBpm === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2"
                    >
                      <input 
                        type="number"
                        placeholder="Укажите точное значение (например 128)..."
                        value={state.customBpm}
                        onChange={e => updateCustomBpm(e.target.value)}
                        className="w-48 bg-black/60 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Ряд 3: Инструменты (Множественный выбор) */}
                <div className="border-t border-slate-800/60 pt-4 flex flex-col gap-3">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-[#00F0FF]">Активные Ведущие Инструменты</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {INSTRUMENTS.map(inst => {
                      const selected = state.selectedInstruments.includes(inst.id);
                      return (
                        <div
                          key={inst.id}
                          onClick={() => toggleInstrument(inst.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs font-bold leading-none ${
                            selected 
                              ? 'bg-[#b026ff]/10 border-[#b026ff] text-white' 
                              : 'bg-black/40 border-slate-800 hover:border-slate-700 text-slate-400'
                          }`}
                        >
                          <span>{inst.label}</span>
                          {selected ? (
                            <CheckSquare className="w-4 h-4 text-[#b026ff]" />
                          ) : (
                            <div className="w-4 h-4 border border-slate-700 rounded bg-transparent"></div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Ряд 4: Энергетическая волна */}
                <div className="border-t border-slate-800/60 pt-4 flex flex-col gap-3">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-[#00F0FF]">Кривая Интенсивности (Energy Curve)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {ENERGY_CURVES.map(cv => {
                      const active = state.selectedEnergyCurve === cv.id;
                      return (
                        <button
                          key={cv.id}
                          onClick={() => selectEnergyCurve(cv.id)}
                          className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                            active 
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_8px_rgba(99,102,241,0.2)]' 
                              : 'bg-black/50 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          {cv.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

              </motion.div>
            )}

            {/* ТАБ 3. СЦЕНЫ И МУЗЫКАЛЬНЫЕ CUES */}
            {activeTab === 'cues' && (
              <motion.div 
                key="tab-cues"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2 flex items-center gap-1.5">
                    <Music4 className="w-4 h-4" /> Музыкальные cues по сценам
                  </span>
                  <button 
                    onClick={generateSceneCue}
                    className="p-1 px-3 text-[10px] bg-slate-900 hover:bg-slate-800 border border-[#b026ff]/30 text-[#b026ff] font-extrabold uppercase rounded-lg transition-all"
                  >
                    Сгенерировать cue (ИИ)
                  </button>
                </div>

                {state.sceneCues.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {state.sceneCues.map((cue, idx) => {
                      return (
                        <div 
                          key={cue.sceneId}
                          className="p-4 bg-black/40 border border-slate-800/60 rounded-xl flex flex-col gap-4"
                        >
                          {/* Заголовок сцены */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-100 flex items-center gap-2">
                              <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 text-[10px] font-black flex items-center justify-center">
                                {cue.sceneNumber}
                              </span>
                              {cue.sceneTitle}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">СЕНСОРНЫЙ ПЕРЕХОД #{idx+1}</span>
                          </div>

                          {/* Редактирование переходов */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] uppercase text-slate-400 font-bold">Стартовое настроение</span>
                              <input 
                                type="text" 
                                value={cue.startMood}
                                onChange={e => updateSceneCue(cue.sceneId, { startMood: e.target.value })}
                                className="bg-black/60 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] uppercase text-slate-400 font-bold">Финальное настроение</span>
                              <input 
                                type="text" 
                                value={cue.endMood}
                                onChange={e => updateSceneCue(cue.sceneId, { endMood: e.target.value })}
                                className="bg-black/60 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] uppercase text-slate-400 font-bold">Интенсивность ({cue.intensity}/10)</span>
                              <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={cue.intensity}
                                onChange={e => updateSceneCue(cue.sceneId, { intensity: parseInt(e.target.value) })}
                                className="accent-[#00F0FF] h-8"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] uppercase text-slate-400 font-bold">Переход в следующую сцену</span>
                              <input 
                                type="text" 
                                value={cue.transition}
                                onChange={e => updateSceneCue(cue.sceneId, { transition: e.target.value })}
                                className="bg-black/60 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-[10px] uppercase text-slate-400 font-bold">Партитура и Заметки композитора</span>
                            <textarea 
                              value={cue.notes}
                              onChange={e => updateSceneCue(cue.sceneId, { notes: e.target.value })}
                              rows={2}
                              placeholder="Например: Ввести глубокий хор в левый канал..."
                              className="bg-black/60 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none resize-none custom-scrollbar"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                    Импортируйте сцены сверху, чтобы построить покадровую музыкальную карту cues!
                  </div>
                )}
              </motion.div>
            )}

            {/* ТАБ 4. ЗВУКИ SFX */}
            {activeTab === 'sfx' && (
              <motion.div 
                key="tab-sfx"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" /> Библиотека SFX эффектов
                  </span>
                  <button 
                    onClick={generateSfxList}
                    className="p-1 px-3 text-[10px] bg-slate-900 hover:bg-slate-800 border border-[#b026ff]/30 text-[#b026ff] font-extrabold uppercase rounded-lg transition-all"
                  >
                    Перестроить SFX (ИИ)
                  </button>
                </div>

                {state.sfxList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {state.sfxList.map(sfx => (
                      <div 
                        key={sfx.id}
                        className="p-3 bg-black/40 border border-slate-800 rounded-xl flex flex-col gap-2 relative"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-100">{sfx.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] text-[9px] font-mono">{sfx.timecode}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 italic mt-0.5">{sfx.sceneName}</span>
                        <p className="text-[11px] text-slate-400 mt-1 pb-1 leading-normal">{sfx.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                    Нажмите «Перестроить SFX», чтобы автоматически задействовать библиотеку шумов для активных сцен!
                  </div>
                )}
              </motion.div>
            )}

            {/* ТАБ 5. ГЕНЕРАЦИЯ АУДИО */}
            {activeTab === 'generation' && (
              <motion.div 
                key="tab-generation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                
                {/* Генерация */}
                <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2">
                      Моделирование оригинального трека
                    </span>
                    <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> AURAI LYRIA ENGINE LIVE
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                    Наша технология сбора и формирования аудио позволяет автоматически преобразовать текстовый промпт в готовую стерео партитуру. 
                    После сборки промпта нажмите сияющую кнопку ниже для старта.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={generateMusicIfSupported}
                      disabled={state.isGenerating}
                      className="px-6 py-3 rounded-xl bg-[#b026ff] text-black font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#c254ff] transition-colors disabled:opacity-40 shadow-[0_0_15px_rgba(176,38,255,0.4)]"
                    >
                      {state.isGenerating ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      ) : (
                        <Wand2 className="w-4 h-4 text-black" />
                      )}
                      Сгенерировать музыку
                    </button>
                    
                    <button 
                      onClick={generateAudioDirection}
                      className="px-4 py-3 border border-slate-700 bg-slate-900 hover:bg-slate-800 hover:text-white rounded-xl text-xs font-bold transition-all text-slate-300"
                    >
                      Построить Audio Direction
                    </button>
                  </div>
                </div>

                {/* Плеер результатов */}
                <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] flex items-center gap-2">
                    <Music className="w-4 h-4" /> Библиотека сгенерированных ассетов ({state.generatedAudio.length})
                  </span>

                  {state.generatedAudio.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {state.generatedAudio.map(track => {
                        const isCurPlaying = isPlaying === track.id;
                        return (
                          <div 
                            key={track.id}
                            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                              state.selectedAudioId === track.id 
                                ? 'bg-indigo-600/10 border-indigo-500/60' 
                                : 'bg-black/50 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <button 
                                onClick={() => togglePlayAudio(track.url, track.id)}
                                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
                                  isCurPlaying 
                                    ? 'bg-rose-500/20 border border-rose-500 text-rose-400' 
                                    : 'bg-slate-850 hover:bg-slate-800 text-[#00F0FF]'
                                }`}
                              >
                                {isCurPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
                              </button>
                              
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-100 truncate">{track.title}</span>
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase">{track.genre}</span>
                                  <span>•</span>
                                  <span>{track.mood}</span>
                                  <span>•</span>
                                  <span>{track.bpm} BPM</span>
                                  <span>•</span>
                                  <span>{track.duration}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => updateState({ selectedAudioId: track.id })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                  state.selectedAudioId === track.id 
                                    ? 'bg-emerald-500 text-black' 
                                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                              >
                                {state.selectedAudioId === track.id ? "Выбран" : "Выбрать"}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
                      Список пуст. Сгенерируйте музыкальный трек для прослушивания.
                    </div>
                  )}
                </div>

              </motion.div>
            )}

          </AnimatePresence>

          {/* ИИ-Улучшения (AI enhancements - quick click helpers) */}
          <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-spin text-[#00F0FF]" /> Быстрые ИИ-улучшения для композитора
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button 
                onClick={suggestMusicGenre}
                className="p-2.5 bg-black/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-300 text-left flex items-center gap-2"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#00F0FF]" /> Подобрать жанр
              </button>
              <button 
                onClick={suggestMusicMood}
                className="p-2.5 bg-black/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-300 text-left flex items-center gap-2"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#00F0FF]" /> Подобрать настроение
              </button>
              <button 
                onClick={suggestInstruments}
                className="p-2.5 bg-black/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-300 text-left flex items-center gap-2"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#00F0FF]" /> Подобрать инструменты
              </button>
              <button 
                onClick={suggestBpm}
                className="p-2.5 bg-black/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-300 text-left flex items-center gap-2"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#00F0FF]" /> Подобрать BPM
              </button>
              
              <button 
                onClick={() => {
                  const enriched = state.musicPrompt ? `${state.musicPrompt}. Обогатить кинематографичным оркестровым тембром и массивными струнными легато.` : 'Массивные струнные легато, глубокий кинематографичный саундтрек.';
                  updateState({ musicPrompt: enriched });
                  updateState({ musicPrompt: (state.musicPrompt || '') + ' Add orchestral depth: full string section, brass accents, timpani hits.' });
                }}
                className="p-2.5 bg-black/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-300 text-left flex items-center gap-2 col-span-1"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#b026ff]" /> Сделать кинематографичнее
              </button>

              <button 
                onClick={() => {
                  const enriched = state.musicPrompt ? `${state.musicPrompt}. Полная адаптация частоты спектра под дождливую атмосферу сцен в переулке.` : 'Мягкий лоу-фай саундтрек под дождь.';
                  updateState({ musicPrompt: enriched });
                  updateState({ musicPrompt: (state.musicPrompt || '') + ' Rainy urban scene ambience: soft rain percussion, distant city sounds, wet reverb.' });
                }}
                className="p-2.5 bg-black/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-300 text-left flex items-center gap-2"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#b026ff]" /> Сделать под сцену
              </button>

              <button 
                onClick={generateAudioDirection}
                className="p-2.5 bg-black/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-300 text-left flex items-center gap-2"
              >
                <ChevronRight className="w-3.5 h-3.5 text-amber-500" /> Создать audio direction
              </button>

              <button 
                onClick={generateSfxList}
                className="p-2.5 bg-black/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-slate-300 text-left flex items-center gap-2"
              >
                <ChevronRight className="w-3.5 h-3.5 text-amber-500" /> Создать SFX list
              </button>
            </div>
          </div>

          {/* Передача дальше (Export tools) */}
          <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] flex items-center gap-2">
                Синхронизация и Экспорт готового Аудиоплана
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Опубликуйте cues, sfx дорожки и аудионаправление во внешние плееры проекта</p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={sendToAudioEditor}
                className="px-4 py-2.5 bg-slate-900 border border-slate-700 hover:border-[#00F0FF]/40 text-slate-300 hover:text-white rounded-lg text-xs font-extrabold uppercase transition-colors"
              >
                Передать в Аудиоредактор
              </button>
              <button 
                onClick={sendToVideoEditor}
                className="px-4 py-2.5 bg-slate-900 border border-slate-700 hover:border-[#b026ff]/40 text-slate-300 hover:text-white rounded-lg text-xs font-extrabold uppercase transition-colors"
              >
                Передать cues в Видеоредактор
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ПРАВАЯ ПАНЕЛЬ ИИ-ПОМОЩНИКА (Остается ТОЛЬКО как вторичная помощь, не мешает работе) */}
      <div className="w-full lg:w-[300px] shrink-0 bg-black/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 flex items-center gap-1.5 border-b border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> ИИ-Помощник Композитора
        </span>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Я анализирую сюжетное развитие глав, частоты референс-треков и предлагаю гармоничные инструменты.
        </p>

        {/* Интерактивные предложения от ИИ */}
        <div className="flex flex-col gap-3">
          {state.aiSuggestions.map(sug => (
            <div 
              key={sug.id}
              className="p-3 bg-black/30 border border-slate-800 rounded-lg flex flex-col gap-2 relative group"
            >
              <strong className="text-xs text-amber-400 block">{sug.title}</strong>
              <p className="text-[11px] text-slate-300 leading-normal">{sug.text}</p>
              
              <button
                onClick={() => {
                  const updated = state.musicPrompt ? `${state.musicPrompt}\n\n[Идея Помощника]: ${sug.text}` : sug.text;
                  updateState({ musicPrompt: updated });
                  // idea applied
                }}
                className="mt-1 text-[10px] text-[#00F0FF] hover:underline font-bold text-left"
              >
                Активировать предложение →
              </button>
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-slate-800 pt-3">
          <div className="bg-black/20 p-2.5 rounded-lg border border-slate-800 text-[10px] leading-relaxed text-slate-500">
            <strong>Совет композитора:</strong> Построение Energy Curve по схеме gradual-build увеличивает удержание зрителей во время завязки сюжета на 45%.
          </div>
        </div>
      </div>

    </div>
  );
}
