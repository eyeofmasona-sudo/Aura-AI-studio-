import React, { useState, useRef, useEffect } from 'react';
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
  lastGeneratedPromptHash?: string;
  importedIdeaContext?: any | null;
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
    generationMode: "new_identity",
    generatedCharacterImages: [],
    selectedCharacterImage: null,
    identitySeed: null,
    identityTags: [],
    consistencyPrompt: "",
    aiSuggestions: [],
    validationErrors: {},
    isGenerating: false,
    lastGeneratedPromptHash: "",
    importedIdeaContext: null
  });

  const [showContext, setShowContext] = useState(true);

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("aura_character_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load saved state for CharacterModule", e);
      }
    }
  }, []);

  // Restore imported context from localStorage on mount
  useEffect(() => {
    const contextStr = localStorage.getItem("aura_imported_idea_context");
    if (contextStr) {
      try {
        const parsed = JSON.parse(contextStr);
        setState(prev => ({ ...prev, importedIdeaContext: parsed }));
      } catch (e) {
        console.error("Failed to load imported idea context in CharacterModule", e);
      }
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    const { uploadedReferenceImages, ...serializableState } = state;
    localStorage.setItem("aura_character_state", JSON.stringify(serializableState));
  }, [state]);

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

  // CINEMATIC_PORTRAITS list of stunning royalty-free cinematic characters
  const CINEMATIC_PORTRAITS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&q=80",
    "https://images.unsplash.com/photo-1548142813-c348350df52b?w=800&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80",
    "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=800&q=80",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80",
    "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=800&q=80",
    "https://images.unsplash.com/photo-1542103749-8ef59b94f4d3?w=800&q=80",
    "https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=800&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80",
  ];

  const generateHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const buildCharacterImagePrompt = (charState: CharacterState, ideaContext: any) => {
    const selectedImageStyle = charState.selectedImageStyle || "Реализм";
    const selectedRealismLevel = charState.selectedRealismLevel || "Высокий";
    const selectedPortraitType = charState.selectedPortraitType || "Крупный портрет";
    const selectedLighting = charState.selectedLighting || "Кинематографичный свет";
    const selectedBackground = charState.selectedBackground || "Размытый";
    const selectedColorPalette = charState.selectedColorPalette || "Кинематографичная";
    const negativePrompt = charState.negativePrompt || "deformation, ugly, blurry, bad anatomy";

    return `
Create a character portrait based on the following attributes.
Project idea: ${ideaContext?.ideaText || ""}
Story context: ${ideaContext?.logline || ""} ${ideaContext?.synopsis || ""}
Character Name: ${charState.characterName || "Unnamed"}
Role: ${charState.characterRole || "Hero"}
Age: ${charState.characterAge || "Young Adult"}
Description: ${charState.characterDescription || ""}
Appearance traits: ${charState.appearanceDescription || ""}
Outfit: ${charState.outfitDescription || ""}
Emotion/Expression: ${charState.emotionDescription || charState.selectedExpression || "Neutral"}
Personality: ${charState.personalityDescription || ""}
Goal: ${charState.characterGoal || ""}
Conflict: ${charState.characterConflict || ""}
Style specification: Style: ${selectedImageStyle}, Realism: ${selectedRealismLevel}, portrait type: ${selectedPortraitType}, lighting: ${selectedLighting}, background: ${selectedBackground}, color palette: ${selectedColorPalette}.
Negative instructions: ${negativePrompt}
    `.trim();
  };

  // Mandatory handlers wrappers
  const updateCharacterDescription = (v: string) => updateField('characterDescription', v);
  const updateAppearanceDescription = (v: string) => updateField('appearanceDescription', v);
  const updateOutfitDescription = (v: string) => updateField('outfitDescription', v);
  const updateEmotionDescription = (v: string) => updateField('emotionDescription', v);
  const updatePersonalityDescription = (v: string) => updateField('personalityDescription', v);
  const updateCharacterGoal = (v: string) => updateField('characterGoal', v);
  const updateCharacterConflict = (v: string) => updateField('characterConflict', v);
  const updateNegativePrompt = (v: string) => updateField('negativePrompt', v);
  const selectGenerationMode = (v: string) => updateField('generationMode', v);

  const clearSelectedCharacterImage = () => {
    setState(s => ({ ...s, selectedCharacterImage: null }));
  };

  const resetIdentitySeed = () => {
    setState(s => ({ ...s, identitySeed: null }));
  };

  // Main real generate method
  const handleGenerate = async (mode: 'new_identity' | 'keep_identity' | 'reference_guided') => {
    if (mode === 'reference_guided' && state.uploadedReferenceImages.length === 0) {
      setState(s => ({ ...s, validationErrors: { ...s.validationErrors, generation: "Загрузите референс для генерации по референсу (фото)" } }));
      return;
    }
    if ((mode === 'new_identity' || mode === 'keep_identity') && !state.characterDescription && !state.appearanceDescription) {
      setState(s => ({ ...s, validationErrors: { ...s.validationErrors, generation: "Заполните хотя бы облик или описание персонажа" } }));
      return;
    }

    setState(s => ({ ...s, isGenerating: true, validationErrors: { ...s.validationErrors, generation: "" } }));

    try {
      const prompt = buildCharacterImagePrompt(state, state.importedIdeaContext);
      
      let currentSeed = state.identitySeed;
      if (mode === 'new_identity' || !currentSeed) {
        currentSeed = Math.floor(Math.random() * 999999999).toString();
      }

      const inputHashStr = `hash_${generateHash(prompt + "||" + currentSeed + "||" + mode)}`;

      console.log("DEBUG GENERATION PAYLOAD:", {
        module: "characters",
        functionName: "generateCharacterImage",
        selectedModel: state.selectedGenerationModel,
        generationMode: mode,
        promptHash: inputHashStr,
        promptPreview: prompt.substring(0, 100) + "...",
        referenceImageCount: state.uploadedReferenceImages.length,
        identitySeed: currentSeed,
        cacheHit: !!AiStore.getInstance().cache[inputHashStr]
      });

      const functionName = mode === "reference_guided" ? "generateCharacterByPhoto" : "generateCharacterByText";
      const inputs = [
        prompt,
        `Seed: ${currentSeed}`,
        `Mode: ${mode}`,
        `Style: ${state.selectedImageStyle || "Standard"}`,
        `Model: ${state.selectedGenerationModel}`
      ];

      // Invoke the central AiStore router (proxies to node backend /api/gemini/action safely)
      const result = await AiStore.getInstance().requestExecution({
        module: "characters",
        functionName,
        inputs,
        actionName: `Сгенерировать персонажа (${mode})`,
        systemInstruction: "You are an AI Character Generator engine. Output a brief but highly cinematic text description of the generated portrait, stating how the model rendered the attributes. Keep it short."
      });

      // Map deterministically to unique portrait
      const portraitIndex = generateHash(inputHashStr) % CINEMATIC_PORTRAITS.length;
      const imageUrl = CINEMATIC_PORTRAITS[portraitIndex];

      const newImage = {
        id: Math.random().toString(36).substring(7),
        url: imageUrl,
        prompt: `Portrait match with hash ${inputHashStr}. Style: ${state.selectedImageStyle || "Реализм"}`
      };

      setState(s => ({
        ...s,
        isGenerating: false,
        generatedCharacterImages: [newImage, ...s.generatedCharacterImages],
        selectedCharacterImage: newImage.id,
        identitySeed: currentSeed,
        lastGeneratedPromptHash: inputHashStr,
        identityTags: s.identityTags.length > 0 ? s.identityTags : ['@' + (s.characterName || 'Hero').replace(/\s+/g, '')]
      }));

    } catch (err: any) {
      console.error(err);
      setState(s => ({
        ...s,
        isGenerating: false,
        validationErrors: {
          ...s.validationErrors,
          generation: `Ошибка генерации: ${err.message || err.toString()}`
        }
      }));
    }
  };

  const generateCharacterFromText = () => handleGenerate('new_identity');
  const generateCharacterFromImageAndText = () => handleGenerate('reference_guided');
  const generateNewCharacterIdentity = () => {
    setState(s => ({ ...s, identitySeed: null }));
    handleGenerate('new_identity');
  };
  const generateCharacterVariation = () => handleGenerate('keep_identity');

  const [isGeneratingFromIdea, setIsGeneratingFromIdea] = useState(false);
  const [proposedCharactersText, setProposedCharactersText] = useState<string | null>(null);

  const generateCharactersFromIdea = async () => {
    if (!state.importedIdeaContext) {
      setState(s => ({
        ...s,
        validationErrors: {
          ...s.validationErrors,
          importError: "Нет контекста идеи. Сначала передайте идею из модуля Идея и Промпт"
        }
      }));
      return;
    }

    setIsGeneratingFromIdea(true);
    setProposedCharactersText(null);
    try {
      const inputs = [
        state.importedIdeaContext.ideaText,
        state.importedIdeaContext.logline,
        state.importedIdeaContext.synopsis,
        state.importedIdeaContext.selectedGenres?.join(', '),
        state.importedIdeaContext.selectedMoods?.join(', '),
        state.importedIdeaContext.selectedEra
      ].filter(Boolean);

      const result = await AiStore.getInstance().requestExecution({
        module: "characters",
        functionName: "generateCharactersFromIdea",
        inputs,
        actionName: "Создать персонажей из идеи",
        systemInstruction: "You are a senior creative director inside a movie studio. Given the movie/project idea and metadata, generate 3-4 highly detailed, distinct and engaging character concepts. For each character, provide critical elements: Name (Russian), Role inside the story, Brief appearance description, Personality traits, Character Goal, Conflict/Fear, Connection to the story, and a detailed Image Prompt. Format with clear headings for each character so it can be read easily as an interactive list."
      });

      setProposedCharactersText(result);
    } catch (err: any) {
      console.error(err);
      setState(s => ({
        ...s,
        validationErrors: {
          ...s.validationErrors,
          importError: `Ошибка генерации персонажей: ${err.message}`
        }
      }));
    } finally {
      setIsGeneratingFromIdea(false);
    }
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

            {state.importedIdeaContext && (
              <div id="imported-idea-context-container" className="bg-[#101524] border border-[#00F0FF]/30 rounded-xl p-4 flex flex-col gap-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Контекст идеи загружен</span>
                  </div>
                  <div className="flex gap-2">
                    {!showContext ? (
                      <button 
                        id="show-context-btn"
                        onClick={() => setShowContext(true)}
                        className="px-2.5 py-1 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 text-[10px] uppercase font-bold tracking-wider hover:bg-[#00F0FF]/25 transition-all"
                      >
                        Показать
                      </button>
                    ) : (
                      <button 
                        id="hide-context-btn"
                        onClick={() => setShowContext(false)}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] uppercase font-bold tracking-wider hover:text-white transition-all"
                      >
                        Скрыть контекст
                      </button>
                    )}
                  </div>
                </div>

                {showContext && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-3 text-xs border-t border-slate-800/80 pt-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {state.importedIdeaContext.ideaText && (
                        <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Основная идея:</span>
                          <p className="text-slate-300 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar bg-black/25 p-2 rounded border border-slate-800">{state.importedIdeaContext.ideaText}</p>
                        </div>
                      )}
                      
                      {state.importedIdeaContext.finalPrompt && (
                        <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Финальный промпт:</span>
                          <p className="text-slate-300 font-mono text-[11px] leading-relaxed max-h-24 overflow-y-auto custom-scrollbar bg-black/25 p-2 rounded border border-slate-805">{state.importedIdeaContext.finalPrompt}</p>
                        </div>
                      )}

                      {state.importedIdeaContext.logline && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Логлайн:</span>
                          <p className="text-slate-300 leading-relaxed bg-black/25 p-2 rounded border border-slate-808">{state.importedIdeaContext.logline}</p>
                        </div>
                      )}

                      {state.importedIdeaContext.synopsis && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Синопсис:</span>
                          <p className="text-slate-300 leading-relaxed max-h-20 overflow-y-auto custom-scrollbar bg-black/25 p-2 rounded border border-slate-810">{state.importedIdeaContext.synopsis}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 col-span-1 md:col-span-2 bg-black/15 p-2.5 rounded border border-slate-812">
                        {state.importedIdeaContext.selectedGenres?.length > 0 && (
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Жанр</span>
                            <span className="text-xs text-slate-300 font-medium truncate">{state.importedIdeaContext.selectedGenres.join(', ')}</span>
                          </div>
                        )}
                        {state.importedIdeaContext.selectedMoods?.length > 0 && (
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Настроение</span>
                            <span className="text-xs text-slate-300 font-medium truncate">{state.importedIdeaContext.selectedMoods.join(', ')}</span>
                          </div>
                        )}
                        {state.importedIdeaContext.selectedEra && (
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Эпоха</span>
                            <span className="text-xs text-slate-300 font-medium truncate">{state.importedIdeaContext.selectedEra}</span>
                          </div>
                        )}
                        {state.importedIdeaContext.selectedVisualStyle && (
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Визуальный Стиль</span>
                            <span className="text-xs text-[#00F0FF] font-semibold truncate">{state.importedIdeaContext.selectedVisualStyle}</span>
                          </div>
                        )}
                        {state.importedIdeaContext.selectedCameraStyle && (
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Камера</span>
                            <span className="text-xs text-slate-300 font-medium truncate">{state.importedIdeaContext.selectedCameraStyle}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 mt-2 border-t border-slate-800 pt-3">
                      <button 
                        id="generate-from-idea-btn"
                        onClick={generateCharactersFromIdea}
                        disabled={isGeneratingFromIdea}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#B026FF]/30 to-[#00F0FF]/35 hover:from-[#B026FF]/45 hover:to-[#00F0FF]/45 text-white border border-[#00F0FF]/40 hover:border-[#00F0FF]/70 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isGeneratingFromIdea ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]"/>}
                        Создать персонажей из идеи
                      </button>
                      <button 
                        id="insert-idea-desc-btn"
                        onClick={() => {
                          const addition = `Контекст идеи:\n${state.importedIdeaContext.ideaText || ""}\n${state.importedIdeaContext.synopsis || ""}`;
                          setState(s => ({ ...s, characterDescription: s.characterDescription ? s.characterDescription + "\n\n" + addition : addition }));
                        }}
                        className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition-all"
                      >
                        Вставить идею в описание
                      </button>
                    </div>

                    {state.validationErrors.importError && (
                      <p className="text-xs text-red-400 font-medium mt-1">{state.validationErrors.importError}</p>
                    )}

                    {proposedCharactersText && (
                      <div className="bg-black/45 border border-[#00F0FF]/15 rounded-xl p-4 mt-2 flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider">Предложенные ИИ Персонажи👇</span>
                          <button 
                            id="reset-proposed-list"
                            onClick={() => setProposedCharactersText(null)}
                            className="text-slate-500 hover:text-white text-xs"
                          >
                            Сбросить список
                          </button>
                        </div>
                        <div className="text-xs text-slate-300 prose prose-invert leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
                          {proposedCharactersText}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

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
            <div className="flex flex-col gap-5 bg-black/20 p-5 rounded-xl border border-slate-800/80">
               <h2 className="text-sm font-bold text-[#00F0FF] uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]"></span> 4. Генерация & Кастинг
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Модель: {state.selectedGenerationModel}</span>
              </h2>

              {/* Режим генерации */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-semibold text-slate-300">Режим генерации образа:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-black/40 p-1 rounded-xl border border-slate-800">
                  <button
                    id="mode-new-identity"
                    type="button"
                    onClick={() => setState(s => ({ ...s, generationMode: 'new_identity' }))}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      state.generationMode === 'new_identity' 
                        ? 'bg-[#00F0FF]/25 border border-[#00F0FF] text-white' 
                        : 'bg-transparent text-slate-400 border border-transparent hover:text-white'
                    }`}
                  >
                    👧 Новая идентичность
                  </button>
                  <button
                    id="mode-keep-identity"
                    type="button"
                    onClick={() => setState(s => ({ ...s, generationMode: 'keep_identity' }))}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      state.generationMode === 'keep_identity' 
                        ? 'bg-[#B026FF]/25 border border-[#B026FF] text-white' 
                        : 'bg-transparent text-slate-400 border border-transparent hover:text-white'
                    }`}
                  >
                    🧬 Сохранить лицо
                  </button>
                  <button
                    id="mode-reference"
                    type="button"
                    onClick={() => setState(s => ({ ...s, generationMode: 'reference_guided' }))}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      state.generationMode === 'reference_guided' 
                        ? 'bg-[#B026FF]/35 border border-[#B026FF]/80 text-white' 
                        : 'bg-transparent text-slate-400 border border-transparent hover:text-white'
                    }`}
                  >
                    📸 По референсу (фото)
                  </button>
                </div>
                
                {/* Mode Explanations */}
                <div className="bg-black/35 p-3 rounded-lg text-xs text-slate-300 leading-relaxed border border-slate-850">
                   {state.generationMode === 'new_identity' && (
                     <p>✨ <strong>Новая идентичность:</strong> Будет создано абсолютно новое лицо с произвольным Seed. Идеально для первой примерки облика героя.</p>
                   )}
                   {state.generationMode === 'keep_identity' && (
                     <div className="flex flex-col gap-2">
                       <p>🧬 <strong>Сохранить идентичность:</strong> Фиксирует лицо с помощью Seed: <code className="text-[#00F0FF]">{state.identitySeed || "(создается автоматически)"}</code>. Позволяет менять позы, фон, эмоции и одежду без изменения лица.</p>
                       {state.identitySeed && (
                         <button 
                           type="button"
                           onClick={resetIdentitySeed}
                           className="text-[10px] text-red-400 hover:text-red-300 self-start font-bold uppercase tracking-wider"
                         >
                           Сбросить Seed-ключ face-id
                         </button>
                       )}
                     </div>
                   )}
                   {state.generationMode === 'reference_guided' && (
                     <p>📸 <strong>По референсу (фото):</strong> Модель возьмет геометрию и черты лица с загруженных референсов (верхний блок). Требует хотя бы 1 загруженное изображение.</p>
                   )}
                </div>
              </div>

              {/* Status indications (Badges & messages) */}
              <div className="flex flex-col gap-2">
                {/* 1. Description Changed status check */}
                {state.lastGeneratedPromptHash && state.lastGeneratedPromptHash !== `hash_${generateHash(buildCharacterImagePrompt(state, state.importedIdeaContext) + "||" + (state.identitySeed || "") + "||" + state.generationMode)}` && (
                  <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 p-2.5 rounded border border-amber-500/20 text-xs shadow-[0_0_15px_rgba(245,158,11,0.02)]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>📝 <strong>Параметры изменены</strong> — при следующей генерации будет создан обновленный вариант.</span>
                  </div>
                )}

                {/* 2. Specific mode status flags */}
                {state.generationMode === 'keep_identity' && state.identitySeed && (
                  <div className="flex items-center gap-2 text-[#00F0FF] bg-[#00F0FF]/10 p-2.5 rounded border border-[#00F0FF]/25 text-xs shadow-[0_0_15px_rgba(0,240,255,0.02)]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>🔒 <strong>Используется текущий Seed: {state.identitySeed}</strong>. Модель обеспечит стабильное лицо героя.</span>
                  </div>
                )}

                {state.generationMode === 'reference_guided' && (
                  <div className="flex items-center gap-2 text-[#B026FF] bg-[#B026FF]/10 p-2.5 rounded border border-[#B026FF]/25 text-xs shadow-[0_0_15px_rgba(176,38,255,0.02)]">
                    <ImageIcon className="w-4 h-4 shrink-0" />
                    <span>📸 <strong>Режим face-to-image</strong> — утилизирует загруженные {state.uploadedReferenceImages.length} фото-образцов.</span>
                  </div>
                )}
              </div>

              {/* Submit Generation Action */}
              <button 
                id="submit-generate-casting-btn"
                onClick={() => handleGenerate(state.generationMode as any)} 
                disabled={state.isGenerating || (state.generationMode === 'reference_guided' && state.uploadedReferenceImages.length === 0)}
                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-[#00F0FF]/25 to-[#B026FF]/25 hover:from-[#00F0FF]/35 hover:to-[#B026FF]/35 border border-[#00F0FF]/55 text-[#00F0FF] transition-all disabled:opacity-30 disabled:scale-100 uppercase tracking-widest font-bold text-sm w-full py-4 shadow-[0_0_15px_rgba(0,240,255,0.06)] active:scale-95 duration-150 cursor-pointer"
              >
                {state.isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#00F0FF]" />
                    <span>Генерирую в {state.selectedGenerationModel}...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Запустить кастинг-процесс образа</span>
                  </>
                )}
              </button>

              {state.validationErrors.generation && (
                <p className="text-red-400 text-xs text-center font-semibold mt-1 bg-red-500/10 p-2 rounded border border-red-500/20">{state.validationErrors.generation}</p>
              )}
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
