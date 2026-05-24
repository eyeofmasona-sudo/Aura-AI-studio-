import React, { useState, useRef } from 'react';
import { 
  Upload, User, X, Sparkles, Wand2, Copy, 
  Save, Forward, Loader2, Image as ImageIcon, MessageSquare, Edit3,
  RefreshCcw, AlertCircle, CheckCircle2, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AiStore } from '../../services/aiStore';

export interface CharacterState {
  uploadedReferenceImages: { id: string; file: File; objectUrl: string }[];
  characterName: string;
  characterRole: string;
  characterAge: string;
  characterDescription: string;
  appearanceDescription: string;
  outfitDescription: string;
  emotionDescription: string;
  personalityDescription: string;
  characterGoal: string;
  characterFear: string;
  characterConflict: string;
  relationshipNotes: string;
  negativePrompt: string;
  selectedImageStyle: string | null;
  selectedRealismLevel: string | null;
  selectedPortraitType: string | null;
  selectedCameraAngle: string | null;
  selectedExpression: string | null;
  selectedLighting: string | null;
  selectedBackground: string | null;
  selectedColorPalette: string | null;
  selectedGenerationModel: string;
  generationMode: string;
  generatedCharacterImages: { id: string; url: string; prompt: string }[];
  selectedCharacterImage: string | null;
  identitySeed: string | null;
  identityTags: string[];
  consistencyPrompt: string;
  aiSuggestions: any[];
  validationErrors: Record<string, string>;
  isGenerating: boolean;
}

export function CharacterModule({ onApprove }: { onApprove: () => void, key?: React.Key }) {
  const [state, setState] = useState<CharacterState>({
    uploadedReferenceImages: [],
    characterName: "",
    characterRole: "",
    characterAge: "",
    characterDescription: "",
    appearanceDescription: "",
    outfitDescription: "",
    emotionDescription: "",
    personalityDescription: "",
    characterGoal: "",
    characterFear: "",
    characterConflict: "",
    relationshipNotes: "",
    negativePrompt: "",
    selectedImageStyle: null,
    selectedRealismLevel: null,
    selectedPortraitType: null,
    selectedCameraAngle: null,
    selectedExpression: null,
    selectedLighting: null,
    selectedBackground: null,
    selectedColorPalette: null,
    selectedGenerationModel: "Nano Banana 2",
    generationMode: "text-to-image",
    generatedCharacterImages: [],
    selectedCharacterImage: null,
    identitySeed: null,
    identityTags: [],
    consistencyPrompt: "",
    aiSuggestions: [],
    validationErrors: {},
    isGenerating: false
  });

  const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STYLES = ["Реализм", "Кинематографичный", "Фотореализм", "Анимационный", "Концепт-арт", "Комикс", "Нуар", "Фэнтези", "Киберпанк", "Рекламный глянец"];
  const PORTRAITS = ["Крупный портрет", "Поясной портрет", "Полный рост", "Профиль", "3/4 ракурс", "Кадр из сцены"];
  const EMOTIONS = ["Нейтральная", "Радостная", "Грустная", "Злая", "Испуганная", "Уверенная", "Таинственная", "Уставшая", "Вдохновлённая", "Напряжённая"];
  const LIGHTINGS = ["Мягкий студийный свет", "Драматичный контровой свет", "Неоновый свет", "Естественный дневной свет", "Низкий ключ", "Высокий ключ", "Кинематографичный свет", "Тёплый свет", "Холодный свет"];
  const REALISM = ["Высокий", "Средний", "Абстрактный"];
  const ANGLES = ["Прямо", "Сверху", "Снизу", "Сбоку"];
  const BACKGROUNDS = ["Изолированный", "Размытый", "Интерьер", "Экстерьер"];
  const PALETTES = ["Яркая", "Монохром", "Пастельная", "Кинематографичная"];

  // A. Handlers for File Upload
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setState(s => ({ ...s, validationErrors: { ...s.validationErrors, images: 'Неподдерживаемый формат. Только изображения.' } }));
      return;
    }
    
    if (state.uploadedReferenceImages.length + validFiles.length > 5) {
      setState(s => ({ ...s, validationErrors: { ...s.validationErrors, images: 'Максимум 5 референсов.' } }));
      return;
    }

    const newRefs = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      objectUrl: URL.createObjectURL(file)
    }));

    setState(s => ({ 
      ...s, 
      uploadedReferenceImages: [...s.uploadedReferenceImages, ...newRefs],
      validationErrors: { ...s.validationErrors, images: '' }
    }));
  };

  const removeReferenceImage = (id: string) => {
    setState(s => {
      const idx = s.uploadedReferenceImages.findIndex(r => r.id === id);
      if (idx !== -1) URL.revokeObjectURL(s.uploadedReferenceImages[idx].objectUrl);
      return { ...s, uploadedReferenceImages: s.uploadedReferenceImages.filter(r => r.id !== id) };
    });
  };

  const openImageUpload = () => fileInputRef.current?.click();

  const updateField = (field: keyof CharacterState, value: string | string[]) => {
    setState(s => ({ ...s, [field]: value }));
  };

  const selectParam = (key: keyof CharacterState, val: string) => {
    setState(s => ({ ...s, [key]: s[key] === val ? null : val }));
  };

  // C. AI Helpers & Generators (Safe API routing via Centralized AiStore Router)
  const runAiAction = async (actionKey: string, promptInfo: string, callback: (res: string) => void) => {
    setIsAiLoading(prev => ({ ...prev, [actionKey]: true }));
    try {
      const actionMap: Record<string, string> = {
        "Улучшить описание": "improveCharacterDesc",
        "Сделать детальнее": "makeDetailedAppearance",
        "Добавить цель и конфликт": "addGoalConflict",
        "Придумать характер": "createCharacterPersonality",
        "Придумать одежду": "designCharacterClothes",
        "Создать identity tags": "createIdentityTags",
        "Создать consistency prompt": "createConsistencyPrompt",
        "Создать negative prompt": "createNegativePrompt",
        "Проверить соответствие": "verifyPhotoDesc",
        "Сгенерировать по тексту": "generateCharacterByText",
        "Сгенерировать по фото + описанию": "generateCharacterByPhoto",
      };

      const functionName = actionMap[actionKey] || "improveCharacterDesc";
      const inputs = [promptInfo, state.characterDescription, state.characterName, state.characterRole, state.appearanceDescription].filter(Boolean);

      const result = await AiStore.getInstance().requestExecution({
        module: "characters",
        functionName,
        inputs,
        actionName: actionKey,
      });

      callback(result);
    } catch (err: any) {
      console.error(err);
      callback(`[Ошибка генерации: ${err.message || err.toString()}]`);
    } finally {
      setIsAiLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const addSuggestion = (title: string, text: string, type: string) => {
    setState(s => ({
      ...s,
      aiSuggestions: [...s.aiSuggestions, { id: Math.random().toString(36).substring(7), title, text, type }]
    }));
  };

  const improveCharacterDescription = () => runAiAction('Улучшить описание', 'Сделай описание глубже', res => addSuggestion('Улучшенное описание', res, 'description'));
  const generateCharacterPersonality = () => runAiAction('Придумать характер', 'Напиши характер', res => addSuggestion('Предлагаемый характер', res, 'personality'));
  const generateConsistencyPrompt = () => runAiAction('Создать consistency prompt', 'Сделай технический промпт', res => addSuggestion('Consistency Prompt', res, 'consistency'));

  const applySuggestion = (id: string, action: 'replace' | 'append') => {
    const suggestion = state.aiSuggestions.find(s => s.id === id);
    if (!suggestion) return;
    if (suggestion.type === 'description') {
      setState(s => ({ ...s, characterDescription: action === 'replace' ? suggestion.text : s.characterDescription + '\n\n' + suggestion.text }));
    } else if (suggestion.type === 'personality') {
      setState(s => ({ ...s, personalityDescription: action === 'replace' ? suggestion.text : s.personalityDescription + '\n\n' + suggestion.text }));
    } else if (suggestion.type === 'consistency') {
      setState(s => ({ ...s, consistencyPrompt: action === 'replace' ? suggestion.text : s.consistencyPrompt + '\n\n' + suggestion.text }));
    }
    setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(a => a.id !== id) }));
  };

  const removeSuggestion = (id: string) => {
    setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(a => a.id !== id) }));
  };

  // Generation Logic
  const handleGenerate = async (mode: 'text' | 'image-text') => {
    if (mode === 'text' && !state.characterDescription && !state.appearanceDescription) {
      setState(s => ({ ...s, validationErrors: { ...s.validationErrors, generation: "Заполните хотя бы облик или описание для генерации по тексту" } }));
      return;
    }
    if (mode === 'image-text' && state.uploadedReferenceImages.length === 0) {
      setState(s => ({ ...s, validationErrors: { ...s.validationErrors, generation: "Загрузите референс для image-to-image генерации" } }));
      return;
    }

    setState(s => ({ ...s, isGenerating: true, validationErrors: { ...s.validationErrors, generation: "" } }));
    
    // MOCK Generation Delay
    setTimeout(() => {
      const mockResult = {
        id: Math.random().toString(36).substring(7),
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80", 
        prompt: "Generated character variant"
      };
      setState(s => ({
        ...s,
        isGenerating: false,
        generatedCharacterImages: [mockResult, ...s.generatedCharacterImages],
        selectedCharacterImage: mockResult.id, // Auto-select the first generated
        // Generate mock identity seed
        identitySeed: s.identitySeed || Math.floor(Math.random() * 1000000).toString(),
        identityTags: s.identityTags.length > 0 ? s.identityTags : ['@' + (s.characterName || 'Hero').replace(/\\s+/g, '')]
      }));
    }, 2000);
  };

  const selectGeneratedImage = (id: string) => {
    setState(s => ({ ...s, selectedCharacterImage: id }));
  };

  const saveCharacter = () => {
    onApprove();
  };

  const selectedImageObj = state.generatedCharacterImages.find(img => img.id === state.selectedCharacterImage);

  return (
    <div className="w-full min-h-[100vh] flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 w-full max-w-7xl mx-auto items-start">
        {/* ЛЕВАЯ ЧАСТЬ: Единая Рабочая Область */}
        <div className="h-auto min-h-0 overflow-visible pb-8 flex flex-col gap-6">
          
          <div className="bg-black/30 border border-[#00F0FF]/20 rounded-xl p-5 md:p-6 shadow-[0_0_20px_rgba(0,240,255,0.03)] flex flex-col gap-8 relative z-10 w-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] opacity-50"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center border border-[#00F0FF]/30">
                <User className="w-5 h-5 text-[#00F0FF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Рабочая область: Персонажи</h1>
                <p className="text-sm text-slate-400">Формирование облика, параметров генерации и образа героя</p>
              </div>
            </div>

            {/* 1. Источники Персонажа */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 1. Источники (Референсы)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {/* Upload Area */}
                 <div 
                  className="border-2 border-dashed border-slate-700 bg-black/40 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/5 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3 transition-colors cursor-pointer min-h-[160px]"
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleImageDrop}
                  onClick={openImageUpload}
                >
                  <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                  <Upload className="w-8 h-8 text-slate-500 mb-1" />
                  <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">Drag & Drop фото</span>
                  <span className="text-[10px] text-slate-500">До 5 лиц (PNG/JPG)</span>
                </div>
                {/* Previews */}
                {state.uploadedReferenceImages.map(img => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden min-h-[160px] border border-slate-700">
                    <img src={img.objectUrl} alt="Reference" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeReferenceImage(img.id); }} 
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {state.validationErrors.images && <p className="text-red-400 text-xs mt-1">{state.validationErrors.images}</p>}
            </div>

            {/* 2. Текстовое описание персонажа */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 2. Описание персонажа
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input 
                  type="text" 
                  placeholder="Имя персонажа" 
                  value={state.characterName} 
                  onChange={e => updateField('characterName', e.target.value)}
                  className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50"
                />
                <input 
                  type="text" 
                  placeholder="Роль в истории" 
                  value={state.characterRole} 
                  onChange={e => updateField('characterRole', e.target.value)}
                  className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50"
                />
                <input 
                  type="text" 
                  placeholder="Возраст" 
                  value={state.characterAge} 
                  onChange={e => updateField('characterAge', e.target.value)}
                  className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50"
                />
              </div>

              <textarea 
                placeholder="Опишите внешность, возраст, стиль, одежду, эмоцию, характер и роль персонажа" 
                value={state.characterDescription} 
                onChange={e => updateField('characterDescription', e.target.value)}
                className="w-full min-h-[120px] bg-black/40 border border-slate-700/50 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
              />
              <div className="text-right text-[10px] text-slate-500 mt-[-8px]">
                {state.characterDescription.length} символов
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <textarea 
                  placeholder="Внешность (лицо, телосложение, причёска)" 
                  value={state.appearanceDescription} 
                  onChange={e => updateField('appearanceDescription', e.target.value)}
                  className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                />
                <textarea 
                  placeholder="Одежда и стиль" 
                  value={state.outfitDescription} 
                  onChange={e => updateField('outfitDescription', e.target.value)}
                  className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                />
                <textarea 
                  placeholder="Характер и эмоция (по умолчанию)" 
                  value={state.personalityDescription} 
                  onChange={e => updateField('personalityDescription', e.target.value)}
                  className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                />
                <textarea 
                  placeholder="Цель персонажа и конфликт" 
                  value={state.characterGoal} 
                  onChange={e => updateField('characterGoal', e.target.value)}
                  className="w-full h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 mt-2">
                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1 mb-1">Negative Prompt</p>
                 <textarea 
                  placeholder="Исключить (уродства, мутации, и т.д.)" 
                  value={state.negativePrompt} 
                  onChange={e => updateField('negativePrompt', e.target.value)}
                  className="w-full h-[60px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-red-100 placeholder-red-900/50 focus:outline-none focus:border-red-500/50 custom-scrollbar"
                />
              </div>
            </div>

            {/* 3. Параметры генерации */}
            <div className="flex flex-col gap-4 mt-4">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 3. ИИ-помощник (Авторизация идей)
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <button onClick={() => runAiAction('Улучшить описание', 'Улучши', res => updateField('characterDescription', res))} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#b026ff]" /> Улучшить описание
                </button>
                <button onClick={() => runAiAction('Деальнее внешность', 'Детальнее', res => updateField('appearanceDescription', res))} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#b026ff]" /> Детальнее внешность
                </button>
                <button onClick={() => runAiAction('Придумать характер', 'Характер', res => updateField('personalityDescription', res))} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#b026ff]" /> Придумать характер
                </button>
                <button onClick={() => runAiAction('Цель и конфликт', 'Конфликт', res => { updateField('characterGoal', res); updateField('characterConflict', res); })} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#b026ff]" /> Добавить цель
                </button>
                <button onClick={() => runAiAction('Придумать одежду', 'Одежда', res => updateField('outfitDescription', res))} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#b026ff]" /> Описать одежду
                </button>
                <button onClick={() => runAiAction('Теги идентичности', 'Теги', res => updateField('identityTags', res.split(',').map(s => s.trim()).filter(Boolean)))} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#b026ff]" /> Теги идентичности
                </button>
                <button onClick={() => runAiAction('Consistency prompt', 'Consistency', res => updateField('consistencyPrompt', res))} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#b026ff]" /> Consistency prompt
                </button>
                <button onClick={() => runAiAction('Negative prompt', 'Negative', res => updateField('negativePrompt', res))} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 text-slate-300">
                  <Wand2 className="w-3 h-3 text-[#b026ff]" /> Negative prompt
                </button>
                <button onClick={() => runAiAction('Проверить фото', 'Проверить фото', res => addSuggestion('Проверка фото', res, 'analysis'))} className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 text-slate-300 col-span-full">
                  <AlertCircle className="w-3 h-3 text-[#b026ff]" /> Проверить соответствие фото и описания
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 4. Параметры генерации
              </h2>
              
              <div className="grid gap-6 p-4 rounded-xl border border-slate-800 bg-black/30">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Целевая Модель</span>
                  <div className="flex flex-wrap gap-2">
                    {["Nano Banana 2", "Stable Diffusion XL", "Midjourney Style"].map(m => (
                      <button 
                        key={m} 
                        onClick={() => updateField('selectedGenerationModel', m)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${state.selectedGenerationModel === m ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Стиль изображения</span>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map(g => (
                      <button 
                        key={g} 
                        onClick={() => selectParam('selectedImageStyle', g)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${state.selectedImageStyle === g ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Тип портрета</span>
                  <div className="flex flex-wrap gap-2">
                    {PORTRAITS.map(g => (
                      <button 
                        key={g} 
                        onClick={() => selectParam('selectedPortraitType', g)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${state.selectedPortraitType === g ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Эмоция</span>
                  <div className="flex flex-wrap gap-2">
                    {EMOTIONS.map(g => (
                      <button 
                        key={g} 
                        onClick={() => selectParam('selectedExpression', g)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${state.selectedExpression === g ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Освещение</span>
                  <div className="flex flex-wrap gap-2">
                    {LIGHTINGS.map(g => (
                      <button 
                        key={g} 
                        onClick={() => selectParam('selectedLighting', g)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${state.selectedLighting === g ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Уровень реализма</span>
                  <div className="flex flex-wrap gap-2">
                    {REALISM.map(g => (
                      <button 
                        key={g} 
                        onClick={() => selectParam('selectedRealismLevel', g)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${state.selectedRealismLevel === g ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Ракурс (ракурс камеры)</span>
                  <div className="flex flex-wrap gap-2">
                    {ANGLES.map(g => (
                      <button 
                        key={g} 
                        onClick={() => selectParam('selectedCameraAngle', g)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${state.selectedCameraAngle === g ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Фон</span>
                  <div className="flex flex-wrap gap-2">
                    {BACKGROUNDS.map(g => (
                      <button 
                        key={g} 
                        onClick={() => selectParam('selectedBackground', g)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${state.selectedBackground === g ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Цветовая палитра</span>
                  <div className="flex flex-wrap gap-2">
                    {PALETTES.map(g => (
                      <button 
                        key={g} 
                        onClick={() => selectParam('selectedColorPalette', g)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all border ${state.selectedColorPalette === g ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Генерация */}
            <div className="flex flex-col gap-4">
               <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 4. Генерация
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => handleGenerate('text')} 
                  disabled={state.isGenerating}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] transition-all disabled:opacity-50"
                >
                  {state.isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  <span className="font-bold text-sm">Сгенерировать по тексту</span>
                </button>

                <button 
                  onClick={() => handleGenerate('image-text')} 
                  disabled={state.isGenerating || state.uploadedReferenceImages.length === 0}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-[#B026FF]/10 hover:bg-[#B026FF]/20 border border-[#B026FF]/30 text-[#B026FF] transition-all disabled:opacity-50"
                >
                  {state.isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                  <span className="font-bold text-sm">Генерация по фото + тексту</span>
                </button>
              </div>

              {state.validationErrors.generation && <p className="text-red-400 text-xs text-center">{state.validationErrors.generation}</p>}
            </div>

            {/* 5 & 6. Сетка и Результирующая Карточка (Только если есть сгенерированные изображения) */}
            {state.generatedCharacterImages.length > 0 && (
              <div className="flex flex-col border-t border-[var(--color-space-800)] pt-8 mt-4 gap-8">
                <h2 className="text-sm font-bold text-[#00F0FF] uppercase tracking-widest">5. Кастинг и Карточка персонажа</h2>

                {/* Сетка Вариантов */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {state.generatedCharacterImages.map(img => (
                    <div 
                      key={img.id} 
                      onClick={() => selectGeneratedImage(img.id)}
                      className={`relative cursor-pointer aspect-square rounded-xl overflow-hidden border-2 transition-all ${state.selectedCharacterImage === img.id ? 'border-[#00F0FF] scale-[1.02] shadow-[0_0_15px_#00F0FF50]' : 'border-slate-800 hover:border-slate-600'}`}
                    >
                      <img src={img.url} alt="Variant" className="w-full h-full object-cover" />
                      {state.selectedCharacterImage === img.id && (
                        <div className="absolute top-2 right-2 bg-[#00F0FF] text-black p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Выбранная карточка персонажа */}
                <AnimatePresence>
                  {selectedImageObj && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="w-full p-6 bg-black/40 border border-[#00F0FF]/30 rounded-xl flex flex-col md:flex-row gap-6 relative"
                    >
                      <div className="w-40 h-40 shrink-0 rounded-lg overflow-hidden border border-slate-700">
                        <img src={selectedImageObj.url} alt={state.characterName} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex flex-col flex-1 gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white uppercase tracking-wider">{state.characterName || "Безымянный персонаж"}</h3>
                          <p className="text-[#00F0FF] text-sm uppercase font-bold tracking-widest">{state.characterRole || "Роль не назначена"}</p>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {state.identityTags.map(t => (
                            <span key={t} className="px-2 py-1 rounded bg-[#B026FF]/20 text-[#B026FF] text-[10px] font-bold uppercase tracking-widest border border-[#B026FF]/30">
                              {t}
                            </span>
                          ))}
                        </div>
                        
                        {(state.identitySeed || state.consistencyPrompt) && (
                          <div className="p-3 bg-black/50 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 break-words">
                            {state.consistencyPrompt && <p className="mb-2"><span className="text-slate-500">Пропмт:</span> {state.consistencyPrompt}</p>}
                            {state.identitySeed && <p><span className="text-slate-500">Seed Лица:</span> {state.identitySeed}</p>}
                          </div>
                        )}

                        <div className="flex gap-3 mt-auto flex-wrap">
                          <button onClick={saveCharacter} className="px-4 py-2 rounded-lg bg-[#00F0FF] text-black font-bold uppercase text-xs tracking-widest hover:bg-[#4dffff] transition-colors flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Сохранить
                          </button>
                          <button className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <Forward className="w-4 h-4" />
                            В Сценарий
                          </button>
                          <button className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <Forward className="w-4 h-4" />
                            В Кадры
                          </button>
                          <button className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <Forward className="w-4 h-4" />
                            В Видео
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: ИИ-Помощник (Вторичная панель) */}
        <div className="w-full lg:sticky lg:top-4 bg-black/20 border border-[var(--color-space-800)] rounded-xl flex flex-col max-h-[calc(100vh-32px)] overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-[var(--color-space-800)] bg-black/40 flex items-center gap-2 sticky top-0 z-10">
            <Wand2 className="w-4 h-4 text-[#B026FF]" />
            <h3 className="font-bold text-sm text-white uppercase tracking-widest">ИИ-Помощник</h3>
          </div>
          
          <div className="p-4 flex flex-col gap-6">
            {/* Текущий Контекст */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Статус</span>
              <div className="p-3 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-300">
                {!state.characterDescription && state.uploadedReferenceImages.length === 0 ? "Ожидание данных..." : "Анализ контекста:"}
                <ul className="mt-2 flex flex-col gap-1">
                  <li className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${state.uploadedReferenceImages.length > 0 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div> {state.uploadedReferenceImages.length} референсов загружено</li>
                  <li className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${state.characterDescription ? 'bg-emerald-500' : 'bg-slate-700'}`}></div> Текстовое описание</li>
                  <li className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${state.selectedGenerationModel ? 'bg-[#00F0FF]' : 'bg-slate-700'}`}></div> {state.selectedGenerationModel}</li>
                </ul>
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#b026ff]">Действия</span>
              
              <button 
                onClick={improveCharacterDescription}
                disabled={isAiLoading['Улучшить описание']}
                className="w-full text-left p-3 rounded-lg bg-[#b026ff]/5 hover:bg-[#b026ff]/10 border border-[#b026ff]/20 text-xs text-slate-200 transition-colors flex items-center gap-2"
              >
                {isAiLoading['Улучшить описание'] ? <Loader2 className="w-3 h-3 animate-spin text-[#b026ff]" /> : <Wand2 className="w-3 h-3 text-[#b026ff]" />}
                Улучшить описание персонажа
              </button>

              <button 
                onClick={generateCharacterPersonality}
                disabled={isAiLoading['Придумать характер']}
                className="w-full text-left p-3 rounded-lg bg-black/40 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition-colors flex items-center gap-2"
              >
                {isAiLoading['Придумать характер'] ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3 text-emerald-400" />}
                Придумать характер
              </button>
              
              <button 
                onClick={generateConsistencyPrompt}
                disabled={isAiLoading['Создать consistency prompt']}
                className="w-full text-left p-3 rounded-lg bg-black/40 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition-colors flex items-center gap-2"
              >
                {isAiLoading['Создать consistency prompt'] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Terminal className="w-3 h-3 text-amber-400" />}
                Создать consistency prompt
              </button>
            </div>

            {/* AI Suggestions Stack */}
            <AnimatePresence>
              {state.aiSuggestions.map(sugg => (
                <motion.div 
                  key={sugg.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-lg p-3 text-xs flex flex-col gap-3 relative"
                >
                  <button onClick={() => removeSuggestion(sugg.id)} className="absolute top-2 right-2 text-slate-400 hover:text-white"><X className="w-3 h-3" /></button>
                  <span className="font-bold text-[#b026ff] uppercase tracking-wider text-[10px] pr-4">{sugg.title}</span>
                  <p className="text-slate-300 leading-relaxed font-serif italic max-h-[200px] overflow-y-auto custom-scrollbar">{sugg.text}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => applySuggestion(sugg.id, 'replace')} className="px-2 py-1.5 rounded bg-[#b026ff]/20 hover:bg-[#b026ff]/40 text-[#b026ff] font-bold text-[10px] uppercase border border-[#b026ff]/30">Заменить</button>
                    <button onClick={() => applySuggestion(sugg.id, 'append')} className="px-2 py-1.5 rounded bg-black/40 hover:bg-slate-800 text-white font-bold text-[10px] uppercase border border-slate-600">Дополнить</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}
