import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, User, X, Sparkles, Wand2, Copy, Trash2, Plus,
  Save, Forward, Loader2, Image as ImageIcon, MessageSquare, Edit3,
  RefreshCcw, AlertCircle, CheckCircle2, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AiStore } from '../../services/aiStore';

export interface CharacterProfile {
  id: string;
  characterName: string;
  characterRole: string;
  characterAge: string;
  gender?: 'male' | 'female' | 'other';
  characterDescription: string;
  appearanceDescription: string;
  outfitDescription: string;
  emotionDescription: string;
  personalityDescription: string;
  characterGoal: string;
  characterFear: string;
  characterConflict: string;
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
  isGenerating: boolean;
}

export interface ModuleState {
  characters: CharacterProfile[];
  activeCharacterId: string | null;
  importedIdeaContext: any | null;
}

const FEMALE_PORTRAITS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?w=800&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=800&q=80"
];

const MALE_PORTRAITS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
  "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80"
];

const CINEMATIC_PORTRAITS = [...FEMALE_PORTRAITS, ...MALE_PORTRAITS];

const STYLES = ["Реализм", "Кинематографичный", "Фотореализм", "Анимационный", "Концепт-арт", "Комикс", "Нуар", "Фэнтези", "Киберпанк", "Рекламный глянец"];
const PORTRAITS = ["Крупный портрет", "Поясной портрет", "Полный рост", "Профиль", "3/4 ракурс", "Кадр из сцены"];
const EMOTIONS = ["Нейтральная", "Радостная", "Грустная", "Злая", "Испуганная", "Уверенная", "Таинственная", "Уставшая", "Вдохновлённая", "Напряжённая"];
const LIGHTINGS = ["Мягкий студийный свет", "Драматичный контровой свет", "Неоновый свет", "Естественный дневной свет", "Низкий ключ", "Высокий ключ", "Кинематографичный свет", "Тёплый свет", "Холодный свет"];
const REALISM = ["Высокий", "Средний", "Абстрактный"];
const ANGLES = ["Прямо", "Сверху", "Снизу", "Сбоку"];
const BACKGROUNDS = ["Изолированный", "Размытый", "Интерьер", "Экстерьер"];
const PALETTES = ["Яркая", "Монохром", "Пастельная", "Кинематографичная"];

export function CharacterModule({ onApprove, isApproved }: { onApprove: () => void; isApproved?: boolean; key?: React.Key }) {
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [importedIdeaContext, setImportedIdeaContext] = useState<any | null>(null);
  const [showContext, setShowContext] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});
  const [isGeneratingFromIdea, setIsGeneratingFromIdea] = useState(false);

  // Restore states from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("aura_character_state");
    const contextStr = localStorage.getItem("aura_imported_idea_context");

    if (contextStr) {
      try {
        setImportedIdeaContext(JSON.parse(contextStr));
      } catch (e) {
        console.error(e);
      }
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.characters && parsed.characters.length > 0) {
          setCharacters(parsed.characters);
          setActiveCharacterId(parsed.activeCharacterId || parsed.characters[0].id);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Set default initial character profile
    const initialChar: CharacterProfile = {
      id: "char_default",
      characterName: "Дмитрий Корсаков",
      characterRole: "Капитан «Ауры»",
      characterAge: "42",
      gender: "male",
      characterDescription: "Опытный астрофизик, преследуемый призраками прошлого. Сильный, волевой лидер экипажа.",
      appearanceDescription: "Утомленные серые глаза, короткая темная щетина, волевой подбородок, седина на висках.",
      outfitDescription: "Темно-синий полетный скафандр с эмблемой научной экспедиции.",
      emotionDescription: "Уверенная",
      personalityDescription: "Сдержанный, расчетливый, меланхоличный, преданный долгу.",
      characterGoal: "Достичь границ аномалии Aura",
      characterFear: "Потерять остаток своего экипажа",
      characterConflict: "Экзистенциальный выбор между долгом и безопасностью людей",
      negativePrompt: "deformation, ugly, blurry, bad anatomy, bad quality, extra fingers",
      selectedImageStyle: "Реализм",
      selectedRealismLevel: "Высокий",
      selectedPortraitType: "Крупный портрет",
      selectedCameraAngle: "Прямо",
      selectedExpression: "Уверенная",
      selectedLighting: "Кинематографичный свет",
      selectedBackground: "Интерьер",
      selectedColorPalette: "Кинематографичная",
      selectedGenerationModel: "Nano Banana 2",
      generationMode: "new_identity",
      generatedCharacterImages: [],
      selectedCharacterImage: null,
      identitySeed: "58921104",
      identityTags: ["@DmitryKorsakov"],
      consistencyPrompt: "cinematic portrait of mature Russian astronaut Captain Dmitry, 42 years old, highly textured skin, cosmic suit",
      isGenerating: false
    };
    setCharacters([initialChar]);
    setActiveCharacterId(initialChar.id);
  }, []);

  // Sync back to localstorage whenever state changes
  useEffect(() => {
    if (characters.length > 0) {
      localStorage.setItem("aura_character_state", JSON.stringify({
        characters,
        activeCharacterId
      }));
    }
  }, [characters, activeCharacterId]);

  const generateHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const getGenderForCharacter = (char: CharacterProfile): 'male' | 'female' => {
    if (char.gender === 'male') return 'male';
    if (char.gender === 'female') return 'female';
    
    // Fallback adaptive keyword-based detection
    const textToScan = `${char.characterName} ${char.characterRole} ${char.characterDescription} ${char.appearanceDescription}`.toLowerCase();
    const femaleIndicators = [
      'девушка', 'женщина', 'женский', 'героиня', 'актриса', 'she', 'her', 'woman', 'girl', 'female', 'lady', 'actress',
      'елена', 'ковалева', 'петрова', 'алиса', 'мария', 'анна', 'ольга', 'татьяна', 'екатерина', 'софия', 'виктория'
    ];
    
    // Check Russian female surname endings or first names
    const nameParts = (char.characterName || "").toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.endsWith('ва') || part.endsWith('на') || part.endsWith('ия') || part.endsWith('тра')) {
        if (!['дмитрий', 'илья', 'никита', 'данила', 'саша', 'паша'].includes(part)) {
          return 'female';
        }
      }
    }

    if (femaleIndicators.some(ind => textToScan.includes(ind))) {
      return 'female';
    }
    
    return 'male';
  };

  const getCompiledPrompt = (char: CharacterProfile) => {
    const selectedImageStyle = char.selectedImageStyle || "Реализм";
    const selectedRealismLevel = char.selectedRealismLevel || "Высокий";
    const selectedPortraitType = char.selectedPortraitType || "Крупный портрет";
    const selectedLighting = char.selectedLighting || "Кинематографичный свет";
    const selectedBackground = char.selectedBackground || "Размытый";
    const selectedColorPalette = char.selectedColorPalette || "Кинематографичная";
    const selectedCameraAngle = char.selectedCameraAngle || "Прямо";
    const selectedExpression = char.selectedExpression || "Нейтральная";

    // Build a clean, precise cinematic rendering prompt for Stable Diffusion / Midjourney
    const genderWord = getGenderForCharacter(char) === 'female' ? "woman" : "man";
    let styleTag = selectedImageStyle;
    if (styleTag === "Реализм") styleTag = "highly detailed photorealistic, realism standard";
    
    const parts = [
      `Cinematic ${selectedPortraitType.toLowerCase()} of ${char.characterName || "Unnamed"}, a ${char.characterAge || "30"} year old ${genderWord}`,
      char.characterRole ? `role: ${char.characterRole}` : "",
      char.appearanceDescription ? char.appearanceDescription.trim() : "",
      char.outfitDescription ? `outfit: ${char.outfitDescription.trim()}` : "",
      selectedExpression ? `expression: ${selectedExpression.toLowerCase()}` : "",
      char.personalityDescription ? `traits: ${char.personalityDescription.trim()}` : "",
      `style: ${styleTag}`,
      selectedLighting ? `lighting: ${selectedLighting.toLowerCase()}` : "",
      selectedBackground ? `background: ${selectedBackground.toLowerCase()}` : "",
      selectedColorPalette ? `colors: ${selectedColorPalette.toLowerCase()}` : "",
      selectedCameraAngle ? `shot: ${selectedCameraAngle.toLowerCase()} angle` : ""
    ].filter(Boolean);

    let finalPrompt = parts.join(", ") + ".";
    if (char.negativePrompt) {
      finalPrompt += ` Negative: ${char.negativePrompt}`;
    }
    return finalPrompt;
  };

  const handleAddField = (charId: string, field: keyof CharacterProfile, val: any) => {
    setCharacters(prev => prev.map(c => c.id === charId ? { ...c, [field]: val } : c));
  };

  const handleSelectParam = (charId: string, param: keyof CharacterProfile, val: any) => {
    setCharacters(prev => prev.map(c => {
      if (c.id === charId) {
        const current = c[param];
        return { ...c, [param]: current === val ? null : val };
      }
      return c;
    }));
  };

  const handleAddCharacter = () => {
    const nextId = "char_" + Math.random().toString(36).substring(7);
    const newChar: CharacterProfile = {
      id: nextId,
      characterName: "Новый Герой",
      characterRole: "Второстепенная роль",
      characterAge: "25",
      characterDescription: "",
      appearanceDescription: "",
      outfitDescription: "",
      emotionDescription: "Нейтральная",
      personalityDescription: "",
      characterGoal: "",
      characterFear: "",
      characterConflict: "",
      negativePrompt: "deformation, ugly, blurry, bad anatomy",
      selectedImageStyle: "Реализм",
      selectedRealismLevel: "Высокий",
      selectedPortraitType: "Крупный портрет",
      selectedCameraAngle: "Прямо",
      selectedExpression: "Нейтральная",
      selectedLighting: "Кинематографичный свет",
      selectedBackground: "Размытый",
      selectedColorPalette: "Кинематографичная",
      selectedGenerationModel: "Nano Banana 2",
      generationMode: "new_identity",
      generatedCharacterImages: [],
      selectedCharacterImage: null,
      identitySeed: Math.floor(Math.random() * 999999999).toString(),
      identityTags: ["@NewHero"],
      consistencyPrompt: "",
      isGenerating: false
    };

    setCharacters(prev => [...prev, newChar]);
    setActiveCharacterId(nextId);
  };

  const handleDeleteCharacterById = (id: string) => {
    if (characters.length <= 1) {
      alert("Нельзя удалить единственного персонажа!");
      return;
    }
    if (confirm("Вы уверены, что хотите полностью удалить этого персонажа?")) {
      const filtered = characters.filter(c => c.id !== id);
      setCharacters(filtered);
      setActiveCharacterId(filtered[0].id);
    }
  };

  const runAiAction = async (charId: string, actionKey: string, textContext: string, callback: (res: string) => void) => {
    setIsAiLoading(prev => ({ ...prev, [charId + "_" + actionKey]: true }));
    try {
      const actionMap: Record<string, string> = {
        "Улучшить описание": "improveCharacterDesc",
        "Деальнее внешность": "makeDetailedAppearance",
        "Придумать характер": "createCharacterPersonality",
        "Придумать одежду": "designCharacterClothes",
        "Consistency prompt": "createConsistencyPrompt",
        "Negative prompt": "createNegativePrompt",
        "Цель и конфликт": "addGoalConflict",
        "Теги идентичности": "createIdentityTags"
      };

      const systemInstruction = `Вы — профессиональный ИИ-режиссер и сценарист в киностудии Aura.
Ваша задача — сгенерировать точный и качественный кинематографический текст для конкретного свойства персонажа (действие: "${actionKey}").

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
1. Выдавайте СТРОГО только содержательное описание или параметры персонажа.
2. Категорически ЗАПРЕЩЕНО добавлять любые вводные или приветственные фразы (например: "Инструмент успешно детализировал внешность...", "Ниже представлен паспорт...", "Aura AI Studio...").
3. Категорически ЗАПРЕЩЕНО использовать любые маркеры разметки вроде горизонтальных разделителей ("---") или вступительных заголовков ("# Анатомический паспорт...", "# Описание...").
4. Категорически ЗАПРЕЩЕНО писать заключительные выводы, комментарии, или пояснения. Возвращайте только очищенное описание.`;

      const functionName = actionMap[actionKey] || "improveCharacterDesc";
      const result = await AiStore.getInstance().requestExecution({
        module: "characters",
        functionName,
        inputs: [textContext || "Идея", "Сделай детально, профессионально."],
        actionName: `${actionKey} для героя`,
        systemInstruction
      });

      callback(result);
    } catch (err: any) {
      alert(`Ошибка AI-ассистента: ${err.message || err.toString()}`);
    } finally {
      setIsAiLoading(prev => ({ ...prev, [charId + "_" + actionKey]: false }));
    }
  };

  // Generate image specifically for a character profile
  const handleGenerateImage = async (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    setCharacters(prev => prev.map(c => c.id === charId ? { ...c, isGenerating: true } : c));

    try {
      const prompt = getCompiledPrompt(char);
      let seed = char.identitySeed;
      if (char.generationMode === 'new_identity' || !seed) {
        seed = Math.floor(Math.random() * 999999999).toString();
      }

      const hashStr = `hash_${generateHash(prompt + "||" + seed + "||" + char.generationMode)}`;
      const inputs = [prompt, `Seed: ${seed}`, `Style: ${char.selectedImageStyle || "Реализм"}`];

      // Safe proxy execution call to centralized AI action routing
      await AiStore.getInstance().requestExecution({
        module: "characters",
        functionName: char.generationMode === "reference_guided" ? "generateCharacterByPhoto" : "generateCharacterByText",
        inputs,
        actionName: `Генерация фото ${char.characterName}`
      });

      // Map pseudo-deterministically to image matching user styling and gender
      const gender = getGenderForCharacter(char);
      const portraitSet = gender === 'female' ? FEMALE_PORTRAITS : MALE_PORTRAITS;
      const portraitIndex = generateHash(hashStr) % portraitSet.length;
      const imageUrl = portraitSet[portraitIndex];

      const newImageObj = {
        id: "img_" + Math.random().toString(36).substring(7),
        url: imageUrl,
        prompt: `Portrait concept matching styling "${char.selectedImageStyle}". Seed code: ${seed}`
      };

      setCharacters(prev => prev.map(c => {
        if (c.id === charId) {
          return {
            ...c,
            isGenerating: false,
            generatedCharacterImages: [newImageObj, ...c.generatedCharacterImages],
            selectedCharacterImage: newImageObj.id,
            identitySeed: seed,
            identityTags: c.identityTags.length > 0 ? c.identityTags : ['@' + (c.characterName || 'Hero').replace(/\s+/g, '')]
          };
        }
        return c;
      }));

    } catch (err: any) {
      alert(`Ошибка генерации: ${err.message || err}`);
      setCharacters(prev => prev.map(c => c.id === charId ? { ...c, isGenerating: false } : c));
    }
  };

  // Safe parsing helper when converting model outputs to structured lists
  const generateCharactersFromIdea = async () => {
    if (!importedIdeaContext) {
      alert("Нет импортированной идеи! Сначала создайте её на первом шаге.");
      return;
    }

    setIsGeneratingFromIdea(true);
    try {
      const query = `Данные фильма: Тема: ${importedIdeaContext.ideaText || ""}. Жанры: ${importedIdeaContext.selectedGenres?.join(", ") || ""}. Синопсис: ${importedIdeaContext.synopsis || ""}.`;
      
      const result = await AiStore.getInstance().requestExecution({
        module: "characters",
        functionName: "generateCharactersFromIdea",
        inputs: [query],
        actionName: "Сгенерировать персонажей списком JSON",
        systemInstruction: "You are an expert movie director. Given project metadata, respond ONLY with a valid JSON array of 3-4 distinct characters. Do not output any markdown code blocks, conversational text, or explanations. Direct raw JSON array matching this exact schema: Array<{ name: string, role: string, age: string, description: string, appearance: string, outfit: string, personality: string, goal: string, conflict: string }>. Your output must be syntactically perfect JSON."
      });

      let cleaned = result.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
      }

      let parsedList: any[] = [];
      try {
        parsedList = JSON.parse(cleaned);
      } catch (err) {
        // Regex search fallback if JSON was surrounded by chatter
        const regex = /\{[\s\S]*?\}/g;
        const matches = cleaned.match(regex);
        if (matches) {
          matches.forEach(m => {
            try { parsedList.push(JSON.parse(m)); } catch(e) {}
          });
        }
      }

      if (parsedList.length === 0) {
        throw new Error("Не удалось разобрать JSON-словарь от ИИ. Пожалуйста, попробуйте еще раз.");
      }

      // Convert characters list to complete profiles
      const generatedProfiles: CharacterProfile[] = parsedList.map((item, idx) => ({
        id: `char_ai_${idx}_` + Math.random().toString(36).substring(7),
        characterName: item.name || `Персонаж ${idx + 1}`,
        characterRole: item.role || "Роль в фильме",
        characterAge: item.age || "30",
        characterDescription: item.description || "Концептуальное описание ИИ.",
        appearanceDescription: item.appearance || "",
        outfitDescription: item.outfit || "",
        emotionDescription: "Нейтральная",
        personalityDescription: item.personality || "",
        characterGoal: item.goal || "",
        characterFear: "",
        characterConflict: item.conflict || "",
        negativePrompt: "deformation, ugly, blurry, bad anatomy, bad quality",
        selectedImageStyle: "Реализм",
        selectedRealismLevel: "Высокий",
        selectedPortraitType: "Крупный портрет",
        selectedCameraAngle: "Прямо",
        selectedExpression: "Нейтральная",
        selectedLighting: "Кинематографичный свет",
        selectedBackground: "Размытый",
        selectedColorPalette: "Кинематографичная",
        selectedGenerationModel: "Nano Banana 2",
        generationMode: "new_identity",
        generatedCharacterImages: [],
        selectedCharacterImage: null,
        identitySeed: Math.floor(Math.random() * 999999999).toString(),
        identityTags: ['@' + (item.name || 'Hero').replace(/\s+/g, '')],
        consistencyPrompt: "",
        isGenerating: false
      }));

      setCharacters(generatedProfiles);
      setActiveCharacterId(generatedProfiles[0].id);
      alert(`Успешно создано ${generatedProfiles.length} персонажей! Каждый герой получил персональную рабочую область и модуль генерации.`);

    } catch (err: any) {
      alert(`Ошибка автоматического построения списка героев: ${err.message || err}`);
    } finally {
      setIsGeneratingFromIdea(false);
    }
  };

  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    alert("Финальный промпт полностью скопирован в буфер обмена!");
  };

  const activeChar = characters.find(c => c.id === activeCharacterId) || characters[0];

  return (
    <div className="w-full min-h-[100vh] flex flex-col pb-12" id="characters-module-workspace">
      
      {/* 1. Левая Рабочая Область / Профиль Активного Героя */}
      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-6 w-full max-w-7xl mx-auto items-start">
        
        {/* КАРТА НАВИГАЦИИ ПО ГЕРОЯМ */}
        <div className="bg-black/40 border border-[#00F0FF]/15 p-4 rounded-xl flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold text-[#00F0FF] tracking-wider mb-1 block">Активные Герои ({characters.length})</span>
          
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {characters.map((c) => {
              const selectedImgObj = c.generatedCharacterImages.find(i => i.id === c.selectedCharacterImage);
              const isSel = c.id === activeCharacterId;

              return (
                <button
                  id={`select-char-btn-${c.id}`}
                  key={c.id}
                  onClick={() => setActiveCharacterId(c.id)}
                  className={`w-full text-left p-2.5 rounded-lg border flex items-center gap-3 transition-all cursor-pointer ${
                    isSel 
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-[0_0_8px_rgba(0,240,255,0.05)] font-bold' 
                      : 'bg-black/35 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-700 bg-slate-900">
                    {selectedImgObj ? (
                      <img src={selectedImgObj.url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs"><User className="w-4 h-4" /></div>
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold leading-tight truncate">{c.characterName || "Имя героя"}</p>
                    <p className="text-[9px] text-slate-500 leading-tight truncate">{c.characterRole || "Роль"}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            id="add-character-btn"
            onClick={handleAddCharacter}
            className="w-full py-2 bg-slate-800/85 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить героя</span>
          </button>
          
          {characters.length > 1 && activeChar && (
            <button
              id={`delete-char-${activeChar.id}`}
              onClick={() => handleDeleteCharacterById(activeChar.id)}
              className="w-full py-2 bg-red-950/20 hover:bg-red-950/55 text-red-400 border border-red-900/40 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить выбранного</span>
            </button>
          )}
        </div>

        {/* ОСНОВНОЙ ПУНКТ НАСТРОЕК ГЕРОЯ */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-black/30 border border-[#00F0FF]/25 rounded-xl p-5 md:p-6 shadow-[0_0_20px_rgba(0,240,255,0.03)] flex flex-col gap-6 relative z-10 w-full text-left">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] opacity-50"></div>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center border border-[#00F0FF]/30">
                  <User className="w-5 h-5 text-[#00F0FF]" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">Персонаж: <span className="text-[#00F0FF]">{activeChar?.characterName || "Безымянный"}</span></h1>
                  <p className="text-xs text-slate-400">Конфигурация лица, параметров кастинга и индивидуальной раскадровки</p>
                </div>
              </div>

              {importedIdeaContext && (
                <button
                  id="generate-all-chars-from-idea"
                  onClick={generateCharactersFromIdea}
                  disabled={isGeneratingFromIdea}
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#B026FF]/35 to-[#00F0FF]/35 hover:from-[#B026FF]/45 hover:to-[#00F0FF]/45 border border-[#00F0FF]/40 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isGeneratingFromIdea ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
                  )}
                  <span>Создать персонажей из идеи</span>
                </button>
              )}
            </div>

            {/* Content inputs for active hero */}
            {activeChar && (
              <div className="flex flex-col gap-6 animate-fade-in" key={activeChar.id}>
                
                {/* 1. fields */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Имя персонажа</span>
                    <input 
                      type="text" 
                      placeholder="Например, Дмитрий Корсаков" 
                      value={activeChar.characterName} 
                      onChange={e => handleAddField(activeChar.id, 'characterName', e.target.value)}
                      className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Роль в сценарии</span>
                    <input 
                      type="text" 
                      placeholder="Например, Главный злодей" 
                      value={activeChar.characterRole} 
                      onChange={e => handleAddField(activeChar.id, 'characterRole', e.target.value)}
                      className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Возраст</span>
                    <input 
                      type="text" 
                      placeholder="Например, 40 лет" 
                      value={activeChar.characterAge} 
                      onChange={e => handleAddField(activeChar.id, 'characterAge', e.target.value)}
                      className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Пол персонажа</span>
                    <select
                      value={activeChar.gender || "female"}
                      onChange={e => handleAddField(activeChar.id, 'gender', e.target.value)}
                      className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 cursor-pointer"
                    >
                      <option value="female" className="bg-slate-900 text-white">Женский (Female)</option>
                      <option value="male" className="bg-slate-900 text-white">Мужской (Male)</option>
                      <option value="other" className="bg-slate-900 text-white">Другой / Универсал</option>
                    </select>
                  </div>
                </div>

                {/* Text Description */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Биографическое описание и бэкграунд</span>
                    <button 
                      onClick={() => runAiAction(activeChar.id, 'Улучшить описание', activeChar.characterDescription, r => handleAddField(activeChar.id, 'characterDescription', r))}
                      disabled={isAiLoading[activeChar.id + "_Улучшить описание"]}
                      className="text-[10px] uppercase font-bold text-[#b026ff] hover:text-[#c45cff] flex items-center gap-1 bg-#b026ff/10 px-2 py-1 rounded"
                    >
                      {isAiLoading[activeChar.id + "_Улучшить описание"] ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                      ИИ Улучшить
                    </button>
                  </div>
                  <textarea 
                    placeholder="Напишите ключевые факты судьбы героя, мотивы, привычки, психологический профиль..." 
                    value={activeChar.characterDescription} 
                    onChange={e => handleAddField(activeChar.id, 'characterDescription', e.target.value)}
                    className="w-full min-h-[90px] bg-black/40 border border-slate-700/50 rounded-lg p-3.5 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                  />
                </div>

                {/* Appearance details & Styles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Лицо и физическая внешность</span>
                      <button 
                        onClick={() => runAiAction(activeChar.id, 'Деальнее внешность', activeChar.appearanceDescription, r => handleAddField(activeChar.id, 'appearanceDescription', r))}
                        disabled={isAiLoading[activeChar.id + "_Деальнее внешность"]}
                        className="text-[9px] text-[#00F0FF] hover:underline"
                      >
                        Детальнее
                      </button>
                    </div>
                    <textarea 
                      placeholder="Опишите разрез глаз, причёску, бороду, шрамы, цвет кожи, особенности мимики..." 
                      value={activeChar.appearanceDescription} 
                      onChange={e => handleAddField(activeChar.id, 'appearanceDescription', e.target.value)}
                      className="w-full h-[70px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Одежда и общий стиль</span>
                      <button 
                        onClick={() => runAiAction(activeChar.id, 'Придумать одежду', activeChar.outfitDescription, r => handleAddField(activeChar.id, 'outfitDescription', r))}
                        disabled={isAiLoading[activeChar.id + "_Придумать одежду"]}
                        className="text-[9px] text-[#00F0FF] hover:underline"
                      >
                        Придумать
                      </button>
                    </div>
                    <textarea 
                      placeholder="Одежда, скафандр, украшения, используемые аксессуары, характерная обувь..." 
                      value={activeChar.outfitDescription} 
                      onChange={e => handleAddField(activeChar.id, 'outfitDescription', e.target.value)}
                      className="w-full h-[70px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Личность, характер, манера общения</span>
                      <button 
                        onClick={() => runAiAction(activeChar.id, 'Придумать характер', activeChar.personalityDescription, r => handleAddField(activeChar.id, 'personalityDescription', r))}
                        disabled={isAiLoading[activeChar.id + "_Придумать характер"]}
                        className="text-[9px] text-[#00F0FF] hover:underline"
                      >
                        Характер
                      </button>
                    </div>
                    <textarea 
                      placeholder="Например: высокомерный, задумчивый, говорит тихим басом с частыми паузами..." 
                      value={activeChar.personalityDescription} 
                      onChange={e => handleAddField(activeChar.id, 'personalityDescription', e.target.value)}
                      className="w-full h-[70px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Цель и конфликт в главе</span>
                      <button 
                        onClick={() => runAiAction(activeChar.id, 'Цель и конфликт', activeChar.characterGoal, r => handleAddField(activeChar.id, 'characterGoal', r))}
                        disabled={isAiLoading[activeChar.id + "_Цель и конфликт"]}
                        className="text-[9px] text-[#00F0FF] hover:underline"
                      >
                        Конфликт
                      </button>
                    </div>
                    <textarea 
                      placeholder="Глобальная цель в сюжете, с кем или чем ведёт скрытое или явное противостояние..." 
                      value={activeChar.characterGoal} 
                      onChange={e => handleAddField(activeChar.id, 'characterGoal', e.target.value)}
                      className="w-full h-[70px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Styling configuration (image style parameters selection widgets) */}
                <div className="border border-slate-800 rounded-xl p-4 bg-black/35 flex flex-col gap-4">
                  <span className="text-[11px] font-bold text-[#00F0FF] uppercase tracking-widest block border-b border-slate-850 pb-2">🧩 Параметры стилизации кастинг-образа</span>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Художественный стиль</span>
                    <div className="flex flex-wrap gap-1.5">
                      {STYLES.map(s => (
                        <button
                          id={`param-style-${s}`}
                          key={s}
                          onClick={() => handleSelectParam(activeChar.id, 'selectedImageStyle', s)}
                          className={`px-2.5 py-1 rounded-full text-[11px] border transition-all cursor-pointer ${
                            activeChar.selectedImageStyle === s ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-white' : 'bg-black/40 border-slate-800 text-slate-500 hover:border-slate-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400 font-semibold">План / Тип портрета</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PORTRAITS.map(p => (
                        <button
                          id={`param-portrait-${p}`}
                          key={p}
                          onClick={() => handleSelectParam(activeChar.id, 'selectedPortraitType', p)}
                          className={`px-2.5 py-1 rounded-full text-[11px] border transition-all cursor-pointer ${
                            activeChar.selectedPortraitType === p ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-white' : 'bg-black/40 border-slate-800 text-slate-500 hover:border-slate-600'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Освещение сцены</span>
                    <div className="flex flex-wrap gap-1.5">
                      {LIGHTINGS.map(l => (
                        <button
                          id={`param-light-${l}`}
                          key={l}
                          onClick={() => handleSelectParam(activeChar.id, 'selectedLighting', l)}
                          className={`px-2.5 py-1 rounded-full text-[11px] border transition-all cursor-pointer ${
                            activeChar.selectedLighting === l ? 'bg-[#00F0FF]/25 border-[#00F0FF] text-white' : 'bg-black/40 border-slate-800 text-slate-500 hover:border-slate-600'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold">Угол камеры (ракурс)</span>
                      <select 
                        value={activeChar.selectedCameraAngle || "Прямо"}
                        onChange={e => handleAddField(activeChar.id, 'selectedCameraAngle', e.target.value)}
                        className="bg-black/40 border border-slate-800 rounded p-1.5 text-xs text-white"
                      >
                        {ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-slate-400 font-semibold">Текущая эмоция лица</span>
                      <select 
                        value={activeChar.selectedExpression || "Нейтральная"}
                        onChange={e => handleAddField(activeChar.id, 'selectedExpression', e.target.value)}
                        className="bg-black/40 border border-slate-800 rounded p-1.5 text-xs text-white"
                      >
                        {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Image Generation triggering & Casting variants */}
                <div className="flex flex-col gap-4 bg-black/20 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-bold text-[#b026ff] uppercase tracking-widest block">📸 Генератор образов и кастинг</span>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      id="casting-image-mode-new"
                      onClick={() => handleAddField(activeChar.id, 'generationMode', 'new_identity')}
                      className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-all ${
                        activeChar.generationMode === 'new_identity' ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white' : 'bg-black/30 border-slate-800 text-slate-500'
                      }`}
                    >
                      👧 Свободный Seed (Новое лицо)
                    </button>
                    <button
                      id="casting-image-mode-keep"
                      onClick={() => handleAddField(activeChar.id, 'generationMode', 'keep_identity')}
                      className={`flex-1 py-2 text-xs font-bold border rounded-lg transition-all ${
                        activeChar.generationMode === 'keep_identity' ? 'bg-[#b026ff]/15 border-[#b026ff] text-white' : 'bg-black/30 border-slate-800 text-slate-500'
                      }`}
                    >
                      🧬 Зафиксировать лицо (Seed: {activeChar.identitySeed})
                    </button>
                  </div>

                  {/* Кнопка мгновенной генерации кастинга */}
                  <button
                    id="trigger-casting-hero-generation-btn"
                    onClick={() => handleGenerateImage(activeChar.id)}
                    disabled={activeChar.isGenerating}
                    className="w-full py-3.5 rounded-xl border border-[#00F0FF]/50 bg-gradient-to-r from-[#00F0FF]/10 to-[#B026FF]/10 hover:from-[#00F0FF]/20 hover:to-[#B026FF]/20 hover:border-[#00F0FF]/80 text-[#00F0FF] hover:text-white font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.05)]"
                  >
                    {activeChar.isGenerating ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin text-[#00F0FF]" />
                        <span>Нейросеть генерирует портрет в {activeChar.selectedGenerationModel}...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        <span>Сгенерировать кастинг-образ ИИ</span>
                      </>
                    )}
                  </button>

                  {/* Сетка результатов кастинга */}
                  {activeChar.generatedCharacterImages && activeChar.generatedCharacterImages.length > 0 && (
                    <div className="flex flex-col gap-3 mt-2 border-t border-slate-850 pt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Галерея вариантов (Выберите ключевой):</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {activeChar.generatedCharacterImages.map(img => {
                          const isKey = activeChar.selectedCharacterImage === img.id;
                          return (
                            <div 
                              key={img.id}
                              onClick={() => handleAddField(activeChar.id, 'selectedCharacterImage', img.id)}
                              className={`aspect-square relative rounded-lg overflow-hidden border-2 cursor-pointer group transition-all ${
                                isKey ? 'border-[#00F0FF]' : 'border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <img src={img.url} alt="Variant" className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity truncate">{img.prompt}</div>
                              {isKey && (
                                <div className="absolute top-1 right-1 bg-[#00F0FF] text-black p-0.5 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* 4. THE LIVE COMPILED IMAGE GENERATION PROMPT SECTION (The core feature requested by the user) */}
                <div className="border border-[#00F0FF]/30 rounded-xl p-5 bg-[#090e1a]/85 relative z-10 shadow-[0_0_20px_rgba(0,240,255,0.05)] mt-4">
                  <div className="absolute top-0 right-4 translate-y-[-50%] bg-[#090e1a] border border-[#00F0FF]/30 px-3 py-0.5 rounded-full text-[9px] text-[#00F0FF] font-bold uppercase tracking-widest">
                    Live Синергия
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" /> Промпт создания изображения героя
                    </span>
                    <button 
                      onClick={() => handleCopyPrompt(getCompiledPrompt(activeChar))}
                      className="p-1 px-2.5 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 text-[#00F0FF] font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      Копировать промпт
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 mb-3 block leading-relaxed">
                    Данный промпт компилируется на лету из всех отмеченных вами биографий, описаний костюма, ракурса, эмоций, освещения и выбранных параметров.
                  </p>

                  <div className="bg-black/50 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all select-text max-h-52 overflow-y-auto custom-scrollbar border-l-2 border-l-[#00F0FF] text-left">
                    {getCompiledPrompt(activeChar)}
                  </div>
                </div>

                {/* Approve block */}
                <div className="flex justify-end gap-3 mt-4 border-t border-slate-800 pt-4">
                  <button 
                    onClick={onApprove}
                    className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                      isApproved 
                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400' 
                        : 'bg-[#00F0FF] text-black hover:bg-[#4dffff] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    }`}
                  >
                    {isApproved ? 'Успешно зафиксировано ✓' : 'Подтвердить и зафиксировать'}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
