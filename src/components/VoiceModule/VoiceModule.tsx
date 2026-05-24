import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Play, Pause, Trash2, Check, Copy, ArrowRight, Save, Layers,
  Volume2, FastForward, Sliders, Settings, Mic, CheckSquare, Plus, AlertCircle, HelpCircle as HelpIcon, FileText, ChevronRight, Wand2, Sparkles, Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for State structure
export interface VoiceLine {
  id: string;
  character: string;
  text: string;
  emotionTag: string;
  pauseNotes: string;
  pronunciationNotes: string;
}

export interface ImportedScript {
  title: string;
  rawText: string;
}

export interface GeneratedVoiceAudioItem {
  id: string;
  textRef: string;
  voiceModel: string;
  url: string; 
  duration: string;
  createdAt: string;
}

export interface VoiceModuleState {
  importedScript: ImportedScript | null;
  importedCharacters: string[];
  voiceText: string;
  voiceLines: VoiceLine[];
  selectedVoiceType: string | null;
  selectedTone: string | null;
  selectedSpeed: string | null;
  customSpeed: string;
  selectedPitch: string | null;
  selectedEmotion: string | null;
  selectedTtsModel: string | null;
  ssmlText: string;
  ssmlErrors: string[];
  generatedVoiceAudios: GeneratedVoiceAudioItem[];
  selectedVoiceAudioId: string | null;
  aiSuggestions: { id: string; title: string; text: string; type: string }[];
  validationErrors: Record<string, string>;
  isGenerating: boolean;
}

interface VoiceModuleProps {
  onApprove: () => void;
  key?: any;
}

// Fixed Constant Configurations
const VOICE_TYPES = ["мужской", "женский", "нейтральный", "детский", "пожилой", "персонажный", "дикторский"];
const TONES = ["спокойный", "драматичный", "уверенный", "мягкий", "напряжённый", "энергичный", "таинственный", "рекламный"];
const SPEEDS = [
  { id: "медленно", label: "Медленно" },
  { id: "нормально", label: "Нормально" },
  { id: "быстро", label: "Быстро" },
  { id: "custom", label: "Custom (вручную)" }
];
const PITCHES = ["низкая", "средняя", "высокая"];
const EMOTIONS = ["нейтральная", "радость", "грусть", "страх", "злость", "удивление", "вдохновение", "напряжение"];
const TTS_MODELS = [
  { id: "elevenlabs", label: "ElevenLabs (Высокий реализм)" },
  { id: "google", label: "Google Cloud TTS (Классический)" },
  { id: "openai", label: "OpenAI TTS (Выразительный)" }
];

export function VoiceModule({ onApprove }: VoiceModuleProps) {
  // State initialization
  const [state, setState] = useState<VoiceModuleState>(() => {
    return {
      importedScript: null,
      importedCharacters: [],
      voiceText: "",
      voiceLines: [],
      selectedVoiceType: "мужской",
      selectedTone: "драматичный",
      selectedSpeed: "нормально",
      customSpeed: "",
      selectedPitch: "низкая",
      selectedEmotion: "напряжение",
      selectedTtsModel: "elevenlabs",
      ssmlText: "",
      ssmlErrors: [],
      generatedVoiceAudios: [],
      selectedVoiceAudioId: null,
      aiSuggestions: [
        { id: "as-1", title: "Коррекция эмоции", text: "В реплике 'Они идут!' используйте тег <amazon:emotion name='excited' intensity='high'>.", type: "ssml" }
      ],
      validationErrors: {},
      isGenerating: false
    };
  });

  const [activeTab, setActiveTab] = useState<'text' | 'lines' | 'parameters' | 'ssml' | 'generation'>('text');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('aura_voice_module_state');
    if (cached) {
      try {
        const loaded = JSON.parse(cached);
        setState(prev => ({ ...prev, ...loaded }));
      } catch (err) {
        console.error("Failed to parse cached Voice State", err);
      }
    }
  }, []);

  const saveGameState = (updated: VoiceModuleState) => {
    localStorage.setItem('aura_voice_module_state', JSON.stringify(updated));
  };

  const updateState = (patch: Partial<VoiceModuleState>) => {
    setState(prev => {
      const u = { ...prev, ...patch };
      saveGameState(u);
      return u;
    });
  };

  // 1. Источники текста
  const importScript = () => {
    const scriptMock = {
      title: "Сцена 1. Пробуждение в переулке",
      rawText: "Кей: Где я? Что произошло?\nЛира (по рации): Кей, ты меня слышишь? Уходи из этого сектора, они уже выслали патруль!\nКей: Я ничего не помню... Моя голова раскалывается.\nЛира: Нет времени объяснять. Беги к старому терминалу, я скину координаты."
    };
    updateState({
      importedScript: scriptMock,
      voiceText: state.voiceText ? `${state.voiceText}\n\n${scriptMock.rawText}` : scriptMock.rawText
    });
    alert("Реплики импортированы из модуля «Сценарий и Главы»!");
  };

  const importCharacters = () => {
    const charMock = ["Кей (Протагонист)", "Лира", "Диктор", "Патрульный Дрон"];
    updateState({
      importedCharacters: charMock
    });
    alert("Персонажи импортированы! (" + charMock.join(", ") + ")");
  };

  const updateVoiceText = (value: string) => {
    updateState({ voiceText: value });
  };

  const splitTextIntoLines = () => {
    if (!state.voiceText) {
      alert("Сначала введите или импортируйте текст озвучки.");
      return;
    }
    
    // Primitive splitting logic based on newlines and colons
    const rawLines = state.voiceText.split('\n').filter(l => l.trim() !== "");
    const generatedVoiceLines: VoiceLine[] = rawLines.map((l, index) => {
      const parts = l.split(':');
      let character = "Диктор";
      let text = l;
      if (parts.length > 1) {
        character = parts[0].trim();
        text = parts.slice(1).join(':').trim();
      }
      return {
        id: `line-${Date.now()}-${index}`,
        character: character,
        text: text,
        emotionTag: state.selectedEmotion || "нейтральная",
        pauseNotes: "",
        pronunciationNotes: ""
      };
    });

    updateState({ voiceLines: generatedVoiceLines });
    alert(`Текст разбит на ${generatedVoiceLines.length} реплик! Перейдите во вкладку 'Voice Script' для их редактирования.`);
    setActiveTab('lines');
  };

  const improveVoiceText = () => {
    if (!state.voiceText) {
      alert("Нечего улучшать. Пожалуйста, добавьте текст.");
      return;
    }
    updateState({ isGenerating: true });
    setTimeout(() => {
      const improved = state.voiceText
        .replace(/Что произошло\?/g, "Что... произошло?")
        .replace(/Я ничего не помню/g, "Чёрт, я ничего не помню");
      updateState({ voiceText: improved, isGenerating: false });
    }, 1000);
  };

  // 2. Voice script editor
  const updateVoiceLine = (lineId: string, patch: Partial<VoiceLine>) => {
    setState(prev => {
      const u = prev.voiceLines.map(l => l.id === lineId ? { ...l, ...patch } : l);
      saveGameState({ ...prev, voiceLines: u });
      return { ...prev, voiceLines: u };
    });
  };

  const naturalizeSpeech = () => {
    setState(prev => {
      const updatedLines = prev.voiceLines.map(l => ({
        ...l,
        text: l.text.replace(/Я /g, "Я... ").replace(/\!/g, "!!")
      }));
      saveGameState({ ...prev, voiceLines: updatedLines });
      return { ...prev, voiceLines: updatedLines };
    });
    alert("Речь 'натурализована' (добавлены паузы и хезитации)!");
  };

  const addEmotionsToLines = () => {
    setState(prev => {
      const updatedLines = prev.voiceLines.map(l => {
        let em = l.emotionTag;
        if (l.text.includes("?")) em = "удивление";
        if (l.text.includes("!")) em = "напряжение";
        return { ...l, emotionTag: em };
      });
      saveGameState({ ...prev, voiceLines: updatedLines });
      return { ...prev, voiceLines: updatedLines };
    });
    alert("Эмоции автоматически распределены по репликам.");
  };

  const addPauses = () => {
    setState(prev => {
      const updatedLines = prev.voiceLines.map(l => ({
        ...l,
        pauseNotes: l.text.length > 30 ? "Пауза 0.5s в середине" : "Без пауз"
      }));
      saveGameState({ ...prev, voiceLines: updatedLines });
      return { ...prev, voiceLines: updatedLines };
    });
    alert("Паузы (breath notes) добавлены.");
  };

  // 3. Параметры голоса (Selectors)
  const selectVoiceType = (val: string) => updateState({ selectedVoiceType: val });
  const selectTone = (val: string) => updateState({ selectedTone: val });
  const selectSpeed = (val: string) => updateState({ selectedSpeed: val });
  const updateCustomSpeed = (val: string) => updateState({ customSpeed: val });
  const selectPitch = (val: string) => updateState({ selectedPitch: val });
  const selectEmotion = (val: string) => updateState({ selectedEmotion: val });
  const selectTtsModel = (val: string) => updateState({ selectedTtsModel: val });

  const generateVoiceDirection = () => {
    const sug = {
      id: `dir-${Date.now()}`,
      title: "Voice Direction Guideline",
      text: `Для типа голоса '${state.selectedVoiceType}' и тона '${state.selectedTone}' необходимо использовать близкий микрофонный эффект. Темп должен быть '${state.selectedSpeed}', с высотой '${state.selectedPitch}'.`,
      type: "expert"
    };
    setState(prev => ({
      ...prev,
      aiSuggestions: [sug, ...prev.aiSuggestions]
    }));
    alert("Audio Voice Direction сгенерирован (смотри панель справа)");
  };

  // 4. SSML editor
  const generateSsml = () => {
    if (state.voiceLines.length === 0) {
      alert("Сначала разбейте текст на реплики, чтобы сгенерировать точный SSML.");
      return;
    }
    
    let ssml = `<speak>\n`;
    state.voiceLines.forEach(l => {
      const pitchAttr = state.selectedPitch === "низкая" ? "-2st" : state.selectedPitch === "высокая" ? "+2st" : "0st";
      const rateAttr = state.selectedSpeed === "медленно" ? "slow" : state.selectedSpeed === "быстро" ? "fast" : "medium";
      
      ssml += `  <!-- Character: ${l.character} | Emotion: ${l.emotionTag} -->\n`;
      ssml += `  <voice name="${l.character === 'Лира' ? 'en-US-JennyNeural' : 'en-US-GuyNeural'}">\n`;
      ssml += `    <prosody pitch="${pitchAttr}" rate="${rateAttr}">\n`;
      ssml += `      ${l.text}\n`;
      if (l.pauseNotes.includes("0.5s")) {
        ssml += `      <break time="500ms"/>\n`;
      }
      ssml += `    </prosody>\n`;
      ssml += `  </voice>\n`;
    });
    ssml += `</speak>`;
    
    updateState({ ssmlText: ssml, ssmlErrors: [] });
    setActiveTab('ssml');
    alert("SSML успешно сформирован!");
  };

  const validateSsml = () => {
    const errors = [];
    if (!state.ssmlText.includes("<speak>")) errors.push("Отсутствует корневой тег <speak>");
    if (!state.ssmlText.includes("</speak>")) errors.push("Отсутствует закрывающий тег </speak>");
    if (state.ssmlText.includes("<prosody>") && !state.ssmlText.includes("</prosody>")) errors.push("Незакрытый тег <prosody>");
    
    if (errors.length > 0) {
      updateState({ ssmlErrors: errors });
      alert(`SSML содержит ошибки (${errors.length})`);
    } else {
      updateState({ ssmlErrors: [] });
      alert("SSML валидный. Ошибок не найдено!");
    }
  };

  const copySsml = () => {
    if (state.ssmlText) {
      navigator.clipboard.writeText(state.ssmlText);
      alert("SSML успешно скопирован в буфер обмена!");
    }
  };

  // 5. Генерация TTS
  const generateTtsIfSupported = () => {
    if (!state.voiceText && state.voiceLines.length === 0 && !state.ssmlText) {
      alert("Нет текста или SSML для генерации!");
      return;
    }
    updateState({ isGenerating: true });
    
    setTimeout(() => {
      // Mock generation
      const freshAudio: GeneratedVoiceAudioItem = {
        id: `tts-${Date.now()}`,
        textRef: state.voiceLines.length > 0 ? state.voiceLines[0].text.substring(0, 30) + "..." : "Полный скрипт",
        voiceModel: TTS_MODELS.find(m => m.id === state.selectedTtsModel)?.label || "ElevenLabs",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        duration: "0:25",
        createdAt: new Date().toLocaleTimeString()
      };
      setState(prev => {
        const u = {
          ...prev,
          generatedVoiceAudios: [freshAudio, ...prev.generatedVoiceAudios],
          selectedVoiceAudioId: freshAudio.id,
          isGenerating: false
        };
        saveGameState(u);
        return u;
      });
      alert("Вокальный трек сгенерирован!");
    }, 2500);
  };

  const selectGeneratedVoiceAudio = (audioId: string) => {
    updateState({ selectedVoiceAudioId: audioId });
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
        console.error("Audio playback stalled", e);
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

  // 7. Передача дальше
  const saveTtsModule = () => {
    alert("Направления голоса и сгенерированные TTS аудиофайлы сохранены в проекте!");
    onApprove();
  };
  
  const sendToAudioEditor = () => {
    alert("Голос передан в Аудиоредактор (в виде выделенных дорожек диалогов).");
  };

  const sendToVideoEditor = () => {
    alert("Реплики и субтитры переданы в Видеоредактор для синхронизации.");
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 min-h-screen text-slate-100 bg-transparent pb-32">
      
      {/* ЛЕВАЯ + ЦЕНТРАЛЬНАЯ ОБЪЕДИНЕННАЯ ПАНЕЛЬ */}
      <div className="flex-1 flex flex-col gap-6 bg-transparent">
        
        {/* Шапка модуля */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <Mic className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full font-black tracking-widest uppercase">
                Модуль 7
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Рабочая область: Голос / TTS
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={importScript}
              className="px-3 py-1.5 bg-black/40 border border-slate-700 hover:border-red-400/40 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" /> Из Сценария
            </button>
            <button 
              onClick={importCharacters}
              className="px-3 py-1.5 bg-black/40 border border-slate-700 hover:border-red-400/40 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-red-400" /> Персонажи
            </button>
            <button 
              onClick={saveTtsModule}
              className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-rose-500 hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Сохранить TTS
            </button>
          </div>
        </div>

        {/* Навигация вкладок */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-800/60 custom-scrollbar">
          {[
            { id: 'text', label: '1. Текст озвучки', icon: FileText },
            { id: 'lines', label: '2. Voice Script', icon: Layers },
            { id: 'parameters', label: '3. Параметры', icon: Sliders },
            { id: 'ssml', label: '4. SSML Редактор', icon: Code },
            { id: 'generation', label: '5. Генерация TTS', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-2 border-b-2 shrink-0 ${
                  active 
                    ? 'bg-red-500/10 border-red-500 text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-300 bg-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-red-500' : ''}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ОСНОВНАЯ ОБЛАСТЬ ВКЛАДОК */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            
            {/* ТАБ 1. ТЕКСТ ОЗВУЧКИ */}
            {activeTab === 'text' && (
              <motion.div 
                key="tab-text"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-red-400 border-l-2 border-red-500 pl-2">
                    Исходный текст (Ручной ввод / Импорт)
                  </span>
                </div>
                
                <textarea
                  placeholder="Введите текст для озвучивания..."
                  value={state.voiceText}
                  onChange={e => updateVoiceText(e.target.value)}
                  className="w-full min-h-[250px] bg-black/60 border border-slate-800 focus:border-red-500/50 outline-none rounded-xl p-4 text-sm text-white leading-relaxed custom-scrollbar resize-y"
                />

                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={improveVoiceText}
                    className="px-3.5 py-2 bg-slate-900 border border-red-500/30 hover:bg-red-500/5 text-red-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Улучшить текст для озвучки
                  </button>
                  <button 
                    onClick={splitTextIntoLines}
                    className="px-3.5 py-2 bg-slate-900 border border-indigo-500/30 hover:bg-indigo-500/5 text-indigo-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    <Layers className="w-3.5 h-3.5" /> Разбить на реплики
                  </button>
                </div>
              </motion.div>
            )}

            {/* ТАБ 2. VOICE SCRIPT */}
            {activeTab === 'lines' && (
              <motion.div 
                key="tab-lines"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-red-400 border-l-2 border-red-500 pl-2">
                      Редактор Реплик
                    </span>
                    <div className="flex gap-2">
                      <button onClick={naturalizeSpeech} className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 rounded text-[10px] font-bold transition-colors">Сделать речь естественнее</button>
                      <button onClick={addEmotionsToLines} className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 rounded text-[10px] font-bold transition-colors">Добавить эмоции</button>
                      <button onClick={addPauses} className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 rounded text-[10px] font-bold transition-colors">Расставить паузы</button>
                    </div>
                  </div>

                  {state.voiceLines.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {state.voiceLines.map((line, idx) => (
                        <div key={line.id} className="bg-black/40 border border-slate-700 hover:border-slate-600 rounded-lg p-4 flex flex-col gap-3 transition-colors">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Персонаж</label>
                              <input 
                                value={line.character}
                                onChange={e => updateVoiceLine(line.id, { character: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white mt-1 outline-none focus:border-red-400"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Emotion Tag</label>
                              <select 
                                value={line.emotionTag}
                                onChange={e => updateVoiceLine(line.id, { emotionTag: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white mt-1 outline-none focus:border-red-400"
                              >
                                {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Текст реплики</label>
                            <textarea 
                              value={line.text}
                              onChange={e => updateVoiceLine(line.id, { text: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 mt-1 min-h-[60px] outline-none focus:border-red-400"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-slate-500">Паузы (Breath notes)</label>
                                <input 
                                  value={line.pauseNotes} placeholder="напр. пауза 1s..."
                                  onChange={e => updateVoiceLine(line.id, { pauseNotes: e.target.value })}
                                  className="w-full bg-transparent border-b border-slate-700 p-1 text-xs text-slate-400 outline-none focus:border-red-400"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500">Pronunciation notes</label>
                                <input 
                                  value={line.pronunciationNotes} placeholder="транскрипция, акцент..."
                                  onChange={e => updateVoiceLine(line.id, { pronunciationNotes: e.target.value })}
                                  className="w-full bg-transparent border-b border-slate-700 p-1 text-xs text-slate-400 outline-none focus:border-red-400"
                                />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-700 rounded-lg">
                      Нет сформированных реплик. Вернитесь на вкладку "Текст" и разбейте текст.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ТАБ 3. ПАРАМЕТРЫ ГОЛОСА */}
            {activeTab === 'parameters' && (
              <motion.div 
                key="tab-parameters"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-red-400 border-l-2 border-red-500 pl-2">
                    Глобальные параметры Voices
                  </span>
                  <button onClick={generateVoiceDirection} className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded font-bold hover:text-white">Создать Voice Direction</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Тип голоса</label>
                    <select value={state.selectedVoiceType || ""} onChange={e => selectVoiceType(e.target.value)} className="bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500">
                      <option value="" disabled>Выберите тип</option>
                      {VOICE_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Тон голоса</label>
                    <select value={state.selectedTone || ""} onChange={e => selectTone(e.target.value)} className="bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500">
                      <option value="" disabled>Выберите тон</option>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Скорость (Tempo)</label>
                    <div className="flex flex-wrap gap-2">
                      {SPEEDS.map(s => (
                        <button key={s.id} onClick={() => selectSpeed(s.id)} className={`px-3 py-1.5 rounded border text-xs font-bold transition-colors ${state.selectedSpeed === s.id ? 'bg-red-500/20 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    {state.selectedSpeed === 'custom' && (
                      <input value={state.customSpeed} onChange={e => updateCustomSpeed(e.target.value)} placeholder="SSML Rate (2.0x, +10%)..." className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs mt-1 text-white" />
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Высота (Pitch)</label>
                    <div className="flex flex-wrap gap-2">
                      {PITCHES.map(p => (
                        <button key={p} onClick={() => selectPitch(p)} className={`px-3 py-1.5 rounded border text-xs font-bold transition-colors uppercase ${state.selectedPitch === p ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3 block">Базовая Эмоция</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map(em => (
                      <button key={em} onClick={() => selectEmotion(em)} className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors capitalize ${state.selectedEmotion === em ? 'bg-pink-500/20 border-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'bg-black/50 border-slate-700 text-slate-400'}`}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ТАБ 4. SSML EDITOR */}
            {activeTab === 'ssml' && (
              <motion.div 
                key="tab-ssml"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800 pb-4">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-red-400 border-l-2 border-red-500 pl-2">
                    SSML Markup
                  </span>
                  <div className="flex gap-2">
                    <button onClick={generateSsml} className="px-3 py-1.5 bg-slate-900 border border-red-500/30 hover:border-red-500 text-red-400 rounded text-xs font-bold transition-colors">Создать SSML из реплик</button>
                    <button onClick={validateSsml} className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 rounded text-xs font-bold transition-colors">Проверить SSML</button>
                    <button onClick={copySsml} className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:text-white text-slate-300 rounded text-xs font-bold transition-colors">Копировать</button>
                  </div>
                </div>

                {state.ssmlErrors.length > 0 && (
                  <div className="bg-red-950/40 border border-red-900/50 rounded-lg p-4 text-xs text-red-300 flex flex-col gap-2">
                    <span className="font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Ошибки синтаксиса SSML:</span>
                    <ul className="list-disc pl-5">
                      {state.ssmlErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                <textarea
                  className="w-full min-h-[300px] bg-black/60 border border-slate-700 focus:border-red-500/50 font-mono text-[11px] text-emerald-400 p-4 rounded-xl outline-none resize-y"
                  value={state.ssmlText}
                  onChange={e => updateState({ ssmlText: e.target.value })}
                  placeholder="<speak>...</speak>"
                />
              </motion.div>
            )}

            {/* ТАБ 5. ГЕНЕРАЦИЯ TTS */}
            {activeTab === 'generation' && (
              <motion.div 
                key="tab-generation"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-6"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">TTS Модель интеграции</label>
                      <select 
                        value={state.selectedTtsModel || ""}
                        onChange={e => selectTtsModel(e.target.value)}
                        className="bg-black border border-slate-700 text-white rounded p-2 text-xs outline-none focus:border-red-500 min-w-[200px]"
                      >
                        {TTS_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={generateTtsIfSupported}
                    disabled={state.isGenerating}
                    className="w-full md:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {state.isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Сгенерировать голос
                  </button>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Сгенерированные файлы</span>
                  {state.generatedVoiceAudios.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {state.generatedVoiceAudios.map(audio => {
                        const isCurPlaying = isPlaying === audio.id;
                        const isSelected = state.selectedVoiceAudioId === audio.id;
                        return (
                          <div key={audio.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${isSelected ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-black/50 border-slate-800 hover:border-slate-700'}`}>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex gap-3 min-w-0">
                                <button onClick={() => togglePlayAudio(audio.url, audio.id)} className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isCurPlaying ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                                  {isCurPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
                                </button>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-white truncate">{audio.voiceModel} Generated</span>
                                  <span className="text-[10px] text-slate-400 truncate mt-0.5" title={audio.textRef}>"{audio.textRef}"</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                              <span className="text-[10px] text-slate-500 font-mono">{audio.duration} | {audio.createdAt}</span>
                              <div className="flex gap-2">
                                {!isSelected && <button onClick={() => selectGeneratedVoiceAudio(audio.id)} className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300">Выбрать вариант</button>}
                                {isSelected && <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1"><Check className="w-3 h-3"/> Active</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      Нет сгенерированных аудиодорожек.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
