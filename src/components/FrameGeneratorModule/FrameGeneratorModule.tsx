import React, { useState } from 'react';
import { 
  Upload, User, X, Sparkles, Wand2, Copy, 
  Save, Forward, Loader2, Edit3,
  RefreshCcw, AlertCircle, CheckCircle2, Plus, Trash2, GripVertical, Image as ImageIcon, Camera, Film, Layers, Crosshair, Anchor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  emotionalGoal: string;
  visualTone: string;
  isImported: boolean;
}

interface Scene {
  id: string;
  chapterId: string;
  sceneNumber: number;
  title: string;
  description: string;
  location: string;
  characters: string[];
  conflict: string;
  emotionalBeat: string;
  visualStyleHint: string;
  continuityNotes: string;
  isImported: boolean;
}

interface Frame {
  id: string;
  chapterId?: string;
  sceneId?: string;
  number: string;
  title: string;
  action: string;
  characters: string;
  location: string;
  emotionalGoal: string;
  continuityNotes: string;
  generationMode?: string;
  selectedImageId?: string | null;
  firstFrameAnchorId?: string | null;
  lastFrameAnchorId?: string | null;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  frameType: 'standard' | 'first-frame' | 'last-frame' | 'nano-banana' | 'anchor-pair';
  sceneName?: string;
  chapterName?: string;
  pairId?: string; // If this is part of a pair
  pairRole?: 'first' | 'last';
}

interface AnchorPair {
  id: string;
  firstFrameId: string;
  lastFrameId: string;
}

interface FrameState {
  importedScript: any;
  importedCharacters: any[];
  chapters: Chapter[];
  scenes: Scene[];
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  manualFrameDescription: string;
  frames: Frame[];
  selectedFrameId: string | null;
  
  // generation parameters
  selectedShotType: string | null;
  selectedCameraAngle: string | null;
  selectedCameraMovement: string | null;
  selectedLighting: string | null;
  selectedColorPalette: string | null;
  selectedVisualStyle: string | null;
  selectedRealismLevel: string | null;
  selectedAspectRatio: string | null;
  selectedGenerationModel: string;
  selectedGenerationMode: string;
  selectedVariationCount: number;
  
  imagePrompt: string;
  negativePrompt: string;
  generatedFrameImages: GeneratedImage[];
  generatedAnchorPairs: AnchorPair[];
  selectedFrameImage: string | null;
  selectedFirstFrameId: string | null;
  selectedLastFrameId: string | null;
  
  continuityNotes: string;
  aiSuggestions: { id: string; title: string; text: string; type: string }[];
  validationErrors: Record<string, string>;
  isGenerating: boolean;
}

interface FrameGeneratorModuleProps {
  key?: string | number;
  onApprove: () => void;
}

const SHOT_TYPES = ["extreme close-up", "close-up", "medium shot", "full shot", "wide shot", "extreme wide shot", "over-the-shoulder", "POV", "insert shot", "establishing shot"];
const CAMERA_ANGLES = ["eye level", "low angle", "high angle", "Dutch angle", "top-down", "profile", "3/4 view"];
const CAMERA_MOVEMENTS = ["static", "slow push-in", "dolly out", "tracking shot", "handheld", "orbit", "crane", "pan", "tilt"];
const LIGHTINGS = ["soft light", "hard light", "low-key", "high-key", "neon", "golden hour", "moonlight", "cinematic volumetric light", "dramatic backlight"];
const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:5", "21:9"];
const VISUAL_STYLES = ["cinematic realism", "stylized realism", "concept art", "noir", "cyberpunk", "fantasy", "commercial glossy", "documentary realism", "animation-inspired"];
const REALISM_LEVELS = ["Photorealistic", "Hyperrealistic", "Stylized", "Abstract", "Lens Feeling"];
const COLOR_PALETTES = ["Vibrant", "Desaturated", "Warm", "Cool", "Pastel", "High Contrast", "Monochromatic"];
const GENERATION_MODELS = ["Standard", "Nano Banana", "First Frame", "Last Frame", "First + Last Pair"];
const VARIATION_COUNTS = [1, 2, 4, 6];

export function FrameGeneratorModule({ onApprove }: FrameGeneratorModuleProps) {
  const [state, setState] = useState<FrameState>({
    importedScript: null,
    importedCharacters: [],
    chapters: [],
    scenes: [],
    selectedChapterId: null,
    selectedSceneId: null,
    manualFrameDescription: "",
    frames: [],
    selectedFrameId: null,
    selectedShotType: null,
    selectedCameraAngle: null,
    selectedCameraMovement: null,
    selectedLighting: null,
    selectedColorPalette: null,
    selectedVisualStyle: null,
    selectedRealismLevel: null,
    selectedAspectRatio: "16:9",
    selectedGenerationModel: "Standard",
    selectedGenerationMode: "single-frame",
    selectedVariationCount: 1,
    imagePrompt: "",
    negativePrompt: "",
    generatedFrameImages: [],
    generatedAnchorPairs: [],
    selectedFrameImage: null,
    selectedFirstFrameId: null,
    selectedLastFrameId: null,
    continuityNotes: "",
    aiSuggestions: [],
    validationErrors: {},
    isGenerating: false
  });

  const [draggedFrameIndex, setDraggedFrameIndex] = useState<number | null>(null);
  
  // Helpers
  const updateField = (field: keyof FrameState, value: any) => {
    setState(s => ({ ...s, [field]: value }));
  };

  const addSuggestion = (title: string, text: string, type: string) => {
    const newSug = { id: Math.random().toString(36).substr(2, 9), title, text, type };
    setState(s => ({ ...s, aiSuggestions: [...s.aiSuggestions, newSug] }));
  };

  const runAiAction = (title: string, prompt: string, callback: (res: string) => void) => {
    setState(s => ({ ...s, isGenerating: true }));
    setTimeout(() => {
      callback(`[Сгенерировано ИИ: ${title}]\n${prompt}`);
      setState(s => ({ ...s, isGenerating: false }));
    }, 1500);
  };

  const applySuggestion = (id: string) => {
    const suggestion = state.aiSuggestions.find(s => s.id === id);
    if (!suggestion) return;
    updateField('continuityNotes', state.continuityNotes + "\n\nТочка контроля ИИ: " + suggestion.text);
    setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(a => a.id !== id) }));
  };

  // Handlers for Chapter / Scene
  const loadChaptersFromScript = () => {
    const saved = localStorage.getItem("aura_scenario_state");
    if (!saved) {
      const newChap: Chapter = {
        id: Math.random().toString(),
        chapterNumber: state.chapters.length + 1,
        title: "Импортированная глава (Черновик)",
        summary: "Сохраните основной сценарий чтобы полностью загрузить данные.",
        emotionalGoal: "Завязка конфликта",
        visualTone: "Dark, moody",
        isImported: true
      };
      setState(s => ({ ...s, chapters: [...s.chapters, newChap], selectedChapterId: newChap.id }));
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const chs = parsed.chapters || [];
      if (chs.length === 0) {
        alert("В вашем сценарии нет глав.");
        return;
      }
      const mappedChapters: Chapter[] = chs.map((c: any, index: number) => ({
        id: c.id || Math.random().toString(),
        chapterNumber: index + 1,
        title: c.title || `Глава ${index + 1}`,
        summary: c.summary || "Без резюме",
        emotionalGoal: c.emotionalGoal || "Не задана",
        visualTone: c.plotFunction || "Стандартный",
        isImported: true
      }));

      setState(s => ({
        ...s,
        chapters: mappedChapters,
        selectedChapterId: mappedChapters[0]?.id || null
      }));
    } catch(err) {
      console.error("Failed to parse scenario chapters from storage:", err);
    }
  };

  const createChapterManually = () => {
    const newChap: Chapter = {
      id: Math.random().toString(),
      chapterNumber: state.chapters.length + 1,
      title: "Новая глава (Вручную)",
      summary: "",
      emotionalGoal: "",
      visualTone: "",
      isImported: false
    };
    setState(s => ({ ...s, chapters: [...s.chapters, newChap], selectedChapterId: newChap.id }));
  };

  const loadScenesFromScript = () => {
    if (!state.selectedChapterId) {
      updateField('validationErrors', { scene: 'Выберите главу сначала' });
      return;
    }
    const saved = localStorage.getItem("aura_scenario_state");
    if (!saved) {
      const newScene: Scene = {
        id: Math.random().toString(),
        chapterId: state.selectedChapterId,
        sceneNumber: state.scenes.length + 1,
        title: "Импортированная сцена",
        description: "Параметры сцены",
        location: "Улица",
        characters: ["Арам"],
        conflict: "Прекрасный вид",
        emotionalBeat: "Спокойствие",
        visualStyleHint: "Мягкий свет",
        continuityNotes: "",
        isImported: true
      };
      setState(s => ({ ...s, scenes: [...s.scenes, newScene], selectedSceneId: newScene.id, validationErrors: {} }));
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const scs = parsed.scenes || [];
      const chapterScenes = scs.filter((sc: any) => sc.chapterId === state.selectedChapterId);
      if (chapterScenes.length === 0) {
        alert("В выбранной главе нет ни одной сохраненной сцены!");
        return;
      }
      
      const mappedScenes: Scene[] = chapterScenes.map((sc: any, idx: number) => ({
        id: sc.id || Math.random().toString(),
        chapterId: sc.chapterId || state.selectedChapterId!,
        sceneNumber: idx + 1,
        title: sc.title || `Сцена ${idx + 1}`,
        description: sc.action || sc.description || "Действие не задано",
        location: sc.location || "Виноградники",
        characters: typeof sc.characters === 'string' 
          ? sc.characters.split(',').map((u: string) => u.trim()).filter(Boolean)
          : (Array.isArray(sc.characters) ? sc.characters : []),
        conflict: sc.conflict || "",
        emotionalBeat: sc.emotionalBeat || "",
        visualStyleHint: sc.visualNotes || "",
        continuityNotes: sc.audioNotes || "",
        isImported: true
      }));

      setState(s => ({
        ...s,
        scenes: [...s.scenes.filter(oldSc => oldSc.chapterId !== state.selectedChapterId), ...mappedScenes],
        selectedSceneId: mappedScenes[0]?.id || null,
        validationErrors: {}
      }));
    } catch (err) {
      console.error("Failed to parse scenario scenes from storage:", err);
    }
  };

  const createSceneManually = () => {
    if (!state.selectedChapterId) {
      updateField('validationErrors', { scene: 'Выберите главу для сцены' });
      return;
    }
    const newScene: Scene = {
      id: Math.random().toString(),
      chapterId: state.selectedChapterId,
      sceneNumber: state.scenes.length + 1,
      title: "Новая сцена (Вручную)",
      description: "",
      location: "",
      characters: [],
      conflict: "",
      emotionalBeat: "",
      visualStyleHint: "",
      continuityNotes: "",
      isImported: false
    };
    setState(s => ({ ...s, scenes: [...s.scenes, newScene], selectedSceneId: newScene.id, validationErrors: {} }));
  };

  const importScript = () => {
    const saved = localStorage.getItem("aura_scenario_state");
    if (!saved) {
      alert("Сценарий не обнаружен в локальном сейфе. Пожалуйста, откройте вкладку «Сценарий», заполните её контентом и нажмите кнопку «Сохранить»!");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const chs = parsed.chapters || [];
      const scs = parsed.scenes || [];

      if (chs.length === 0) {
        alert("Импортируемый сценарий пуст. Создайте структуру глав во вкладке «Сценарий».");
        return;
      }

      const mappedChapters: Chapter[] = chs.map((c: any, index: number) => ({
        id: c.id || Math.random().toString(),
        chapterNumber: index + 1,
        title: c.title || `Глава ${index + 1}`,
        summary: c.summary || "Резюме главы отсутствует",
        emotionalGoal: c.emotionalGoal || "",
        visualTone: c.plotFunction || "Драматический",
        isImported: true
      }));

      const mappedScenes: Scene[] = scs.map((sc: any, index: number) => ({
        id: sc.id || Math.random().toString(),
        chapterId: sc.chapterId || "",
        sceneNumber: index + 1,
        title: sc.title || `Сцена ${index + 1}`,
        description: sc.action || sc.description || "Описание сцены",
        location: sc.location || "Пленэр",
        characters: typeof sc.characters === 'string'
          ? sc.characters.split(',').map((char: string) => char.trim()).filter(Boolean)
          : (Array.isArray(sc.characters) ? sc.characters : []),
        conflict: sc.conflict || "",
        emotionalBeat: sc.emotionalBeat || "",
        visualStyleHint: sc.visualNotes || "",
        continuityNotes: sc.audioNotes || "",
        isImported: true
      }));

      // Automatically construct the Shot List frames with imported scenes so generating is plug-and-play
      const mappedFrames: Frame[] = mappedScenes.map((sc: any, index: number) => ({
        id: sc.id,
        chapterId: sc.chapterId,
        sceneId: sc.id,
        number: `#${index + 1}`,
        title: sc.title || `Кадр ${index + 1}`,
        action: sc.description || "Описать действие в кадре",
        characters: Array.isArray(sc.characters) ? sc.characters.join(', ') : (sc.characters || ""),
        location: sc.location || "",
        emotionalGoal: sc.emotionalBeat || "",
        continuityNotes: sc.continuityNotes || "",
        selectedImageId: null,
        firstFrameAnchorId: null,
        lastFrameAnchorId: null
      }));

      setState(s => ({
        ...s,
        importedScript: parsed,
        chapters: mappedChapters,
        scenes: mappedScenes,
        frames: mappedFrames,
        selectedChapterId: mappedChapters[0]?.id || null,
        selectedSceneId: mappedScenes.find(sn => sn.chapterId === mappedChapters[0]?.id)?.id || null,
        selectedFrameId: mappedFrames[0]?.id || null,
        validationErrors: {}
      }));
      alert(`Сценарий успешно синхронизирован! Загружено: Глава ${mappedChapters.length}, Сцен: ${mappedScenes.length}. Shot List инициализирован.`);
    } catch(err) {
      console.error(err);
      alert("Ошибка при разборе файла сценария из локального кэша.");
    }
  };

  const importCharacters = () => {
    const saved = localStorage.getItem("aura_character_state");
    if (!saved) {
      alert("База персонажей пуста. Пожалуйста, посетите вкладку «Персонажи», добавьте своих персонажей и зафиксируйте их параметры перед импортом!");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const chars = parsed.characters || parsed || [];
      if (chars.length === 0) {
        alert("В локальной памяти не обнаружено сохраненных карточек персонажей.");
        return;
      }
      setState(s => ({
        ...s,
        importedCharacters: chars
      }));
      alert(`Персонажи (${chars.length}) успешно импортированы! Теперь они доступны как удобные быстрые кнопки под источниками.`);
    } catch(err) {
      console.error(err);
      alert("Ошибка декодирования профилей персонажей.");
    }
  };

  const selectChapter = (value: string) => {
    updateField('selectedChapterId', value);
    // Auto-select first scene of this chapter if available
    const chapterScenes = state.scenes.filter(s => s.chapterId === value);
    if (chapterScenes.length > 0) {
      updateField('selectedSceneId', chapterScenes[0].id);
    } else {
      updateField('selectedSceneId', null);
    }
  };

  const selectScene = (value: string) => updateField('selectedSceneId', value);

  // Frames / Shot List
  const addFrame = () => {
    const newFr: Frame = { 
      id: Math.random().toString(), 
      number: `#${state.frames.length + 1}`, 
      title: "Новый кадр", 
      action: state.manualFrameDescription, 
      characters: "", 
      location: "", 
      emotionalGoal: "", 
      continuityNotes: "",
      chapterId: state.selectedChapterId || undefined,
      sceneId: state.selectedSceneId || undefined
    };
    setState(s => ({ ...s, frames: [...s.frames, newFr], selectedFrameId: newFr.id }));
    document.getElementById('section-shotlist')?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateFrame = (id: string, patch: Partial<Frame>) => {
    setState(s => ({ ...s, frames: s.frames.map(f => f.id === id ? { ...f, ...patch } : f) }));
  };

  const deleteFrame = (id: string) => {
    setState(s => ({ ...s, frames: s.frames.filter(f => f.id !== id), selectedFrameId: s.selectedFrameId === id ? null : s.selectedFrameId }));
  };

  const reorderFrames = (sourceIndex: number, targetIndex: number) => {
    setState(s => {
      const newFr = [...s.frames];
      const [removed] = newFr.splice(sourceIndex, 1);
      newFr.splice(targetIndex, 0, removed);
      return { ...s, frames: newFr };
    });
  };

  // Prompts & Generation
  const buildImagePrompt = () => {
    let prompt = "";
    
    // Scene Context
    if (state.selectedChapterId) {
      const chapter = state.chapters.find(c => c.id === state.selectedChapterId);
      if (chapter) prompt += `Chapter Context: ${chapter.visualTone || chapter.summary}. `;
    }
    if (state.selectedSceneId) {
      const scene = state.scenes.find(s => s.id === state.selectedSceneId);
      if (scene) prompt += `Scene Description: ${scene.description || scene.title}. Location: ${scene.location}. Style Hint: ${scene.visualStyleHint || ''}. `;
    }

    // Frame particulars
    if (state.selectedFrameId) {
      const frame = state.frames.find(f => f.id === state.selectedFrameId);
      if (frame) {
        if (frame.action) prompt += `Shot Action: ${frame.action}. `;
        if (frame.characters) prompt += `Characters present: ${frame.characters}. `;
        if (frame.location) prompt += `Environment: ${frame.location}. `;
        if (frame.emotionalGoal) prompt += `Mood: ${frame.emotionalGoal}. `;
      }
    }

    if (state.manualFrameDescription) {
      prompt += `Details: ${state.manualFrameDescription}. `;
    }

    // Parameters
    const paramsList = [
      state.selectedShotType ? `shot type: ${state.selectedShotType}` : null,
      state.selectedCameraAngle ? `angle: ${state.selectedCameraAngle}` : null,
      state.selectedCameraMovement ? `camera movement: ${state.selectedCameraMovement}` : null,
      state.selectedLighting ? `lighting: ${state.selectedLighting}` : null,
      state.selectedVisualStyle ? `style: ${state.selectedVisualStyle}` : null,
      state.selectedRealismLevel ? `realism: ${state.selectedRealismLevel}` : null,
      state.selectedColorPalette ? `color palette: ${state.selectedColorPalette}` : null,
      state.selectedAspectRatio ? `aspect ratio: ${state.selectedAspectRatio}` : null
    ].filter(Boolean);

    if (paramsList.length > 0) {
      prompt += ` Cinematic details: ${paramsList.join(", ")}.`;
    }

    updateField('imagePrompt', prompt.trim() || 'Cinematic shot, highly detailed.');
  };

  const getSceneName = () => state.scenes.find(s => s.id === state.selectedSceneId)?.title || "Unknown Scene";
  const getChapterName = () => state.chapters.find(c => c.id === state.selectedChapterId)?.title || "Unknown Chapter";

  const generateWithParams = (type: 'standard' | 'first-frame' | 'last-frame' | 'nano-banana') => {
    setState(s => ({ ...s, isGenerating: true }));
    setTimeout(() => {
      const newImages: GeneratedImage[] = [];
      const numVars = state.selectedVariationCount || 1;
      
      const selectedStyle = state.selectedVisualStyle || "cinematic realism";
      const englishStyle = selectedStyle === "cinematic realism" ? "epic dramatic cinematic wide shot film scene"
                         : selectedStyle === "stylized realism" ? "photorealistic styled film scene"
                         : selectedStyle === "concept art" ? "stylized digital concept art illustration"
                         : selectedStyle === "noir" ? "black and white cinematic moody film noir scene"
                         : selectedStyle === "cyberpunk" ? "neon-lit cyberpunk street scene keyframe"
                         : selectedStyle === "fantasy" ? "magical illustration conceptual art scene"
                         : selectedStyle === "commercial glossy" ? "high-end commercial professional studio lighting glossy keyframe"
                         : selectedStyle === "documentary realism" ? "realistic raw documentary camera photo style"
                         : selectedStyle === "animation-inspired" ? "anime series screenshot dynamic keyframe"
                         : `${selectedStyle} styled movie theme`;

      // Build parameters list dynamically so they are always guaranteed in the prompt
      const paramsList = [
        state.selectedShotType ? `shot type: ${state.selectedShotType}` : null,
        state.selectedCameraAngle ? `angle: ${state.selectedCameraAngle}` : null,
        state.selectedCameraMovement ? `camera movement: ${state.selectedCameraMovement}` : null,
        state.selectedLighting ? `lighting: ${state.selectedLighting}` : null,
        state.selectedRealismLevel ? `realism: ${state.selectedRealismLevel}` : null,
        state.selectedColorPalette ? `colors: ${state.selectedColorPalette}` : null,
        state.selectedAspectRatio ? `aspect ratio: ${state.selectedAspectRatio}` : null,
      ].filter(Boolean);

      const paramsSuffix = paramsList.length > 0 ? `, style nuances: ${paramsList.join(", ")}` : "";

      for(let i=0; i<numVars; i++) {
        const seedValue = Math.floor(Math.random() * 999999999).toString();
        // Fallback context if prompt is empty
        let basePrompt = state.imagePrompt;
        if (!basePrompt.trim()) {
          const currentFrame = state.frames.find(fr => fr.id === state.selectedFrameId);
          basePrompt = currentFrame?.action || "cinematic shot, highly detailed composition";
        }

        const cleanPrompt = `${englishStyle}, ${basePrompt}${paramsSuffix}, highly detailed, 8k`
          .replace(/[^a-zA-Z0-9,\s\-:()]/g, "")
          .substring(0, 400);

        const imageUrl = `https://image.pollinations.ai/p/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&nologo=true&seed=${seedValue}`;

        newImages.push({
          id: Math.random().toString(),
          url: imageUrl,
          prompt: basePrompt,
          frameType: type,
          sceneName: getSceneName(),
          chapterName: getChapterName()
        });
      }

      setState(s => {
        let firstFrameId = s.selectedFirstFrameId;
        let lastFrameId = s.selectedLastFrameId;
        
        if (type === 'first-frame' && newImages.length > 0) firstFrameId = newImages[0].id;
        if (type === 'last-frame' && newImages.length > 0) lastFrameId = newImages[0].id;
        
        return {
          ...s,
          generatedFrameImages: [...newImages, ...s.generatedFrameImages],
          selectedFrameImage: newImages[0].id,
          selectedFirstFrameId: firstFrameId,
          selectedLastFrameId: lastFrameId,
          isGenerating: false
        };
      });
    }, 2000);
  };

  const generateFirstLastPair = () => {
    setState(s => ({ ...s, isGenerating: true }));
    setTimeout(() => {
      const pairId = Math.random().toString();
      const seed1 = Math.floor(Math.random() * 999999999).toString();
      const seed2 = Math.floor(Math.random() * 999999999).toString();
      const selectedStyle = state.selectedVisualStyle || "cinematic realism";

      const englishStyle = selectedStyle === "cinematic realism" ? "epic dramatic cinematic wide shot film scene"
                         : selectedStyle === "stylized realism" ? "photorealistic styled film scene"
                         : selectedStyle === "concept art" ? "stylized digital concept art illustration"
                         : selectedStyle === "noir" ? "black and white cinematic moody film noir scene"
                         : selectedStyle === "cyberpunk" ? "neon-lit cyberpunk street scene keyframe"
                         : selectedStyle === "fantasy" ? "magical illustration conceptual art scene"
                         : selectedStyle === "commercial glossy" ? "high-end commercial professional studio lighting glossy keyframe"
                         : selectedStyle === "documentary realism" ? "realistic raw documentary camera photo style"
                         : selectedStyle === "animation-inspired" ? "anime series screenshot dynamic keyframe"
                         : `${selectedStyle} styled movie theme`;

      // Build parameters list dynamically so they are always guaranteed in the prompt
      const paramsList = [
        state.selectedShotType ? `shot type: ${state.selectedShotType}` : null,
        state.selectedCameraAngle ? `angle: ${state.selectedCameraAngle}` : null,
        state.selectedCameraMovement ? `camera movement: ${state.selectedCameraMovement}` : null,
        state.selectedLighting ? `lighting: ${state.selectedLighting}` : null,
        state.selectedRealismLevel ? `realism: ${state.selectedRealismLevel}` : null,
        state.selectedColorPalette ? `colors: ${state.selectedColorPalette}` : null,
        state.selectedAspectRatio ? `aspect ratio: ${state.selectedAspectRatio}` : null,
      ].filter(Boolean);

      const paramsSuffix = paramsList.length > 0 ? `, style nuances: ${paramsList.join(", ")}` : "";

      const basePrompt = state.imagePrompt || "atmospheric scene keyframe";

      const cleanPromptFirst = `keyframe start of scene, ${englishStyle}, ${basePrompt}${paramsSuffix}, cinematic lighting, detailed, 8k`
        .replace(/[^a-zA-Z0-9,\s\-:()]/g, "")
        .substring(0, 400);

      const cleanPromptLast = `keyframe end of scene, dynamic climax, ${englishStyle}, ${basePrompt}${paramsSuffix}, cinematic lighting, detailed, 8k`
        .replace(/[^a-zA-Z0-9,\s\-:()]/g, "")
        .substring(0, 400);

      const firstPairImg: GeneratedImage = {
        id: Math.random().toString(),
        url: `https://image.pollinations.ai/p/${encodeURIComponent(cleanPromptFirst)}?width=1024&height=1024&nologo=true&seed=${seed1}`,
        prompt: `[START OF SCENE] ${state.imagePrompt}`,
        frameType: 'anchor-pair',
        sceneName: getSceneName(),
        chapterName: getChapterName(),
        pairId,
        pairRole: 'first'
      };
      const lastPairImg: GeneratedImage = {
        id: Math.random().toString(),
        url: `https://image.pollinations.ai/p/${encodeURIComponent(cleanPromptLast)}?width=1024&height=1024&nologo=true&seed=${seed2}`,
        prompt: `[END OF SCENE] ${state.imagePrompt}`,
        frameType: 'anchor-pair',
        sceneName: getSceneName(),
        chapterName: getChapterName(),
        pairId,
        pairRole: 'last'
      };

      setState(s => ({
        ...s,
        generatedFrameImages: [firstPairImg, lastPairImg, ...s.generatedFrameImages],
        generatedAnchorPairs: [...s.generatedAnchorPairs, { id: pairId, firstFrameId: firstPairImg.id, lastFrameId: lastPairImg.id }],
        selectedFirstFrameId: firstPairImg.id,
        selectedLastFrameId: lastPairImg.id,
        isGenerating: false
      }));
    }, 3000);
  };

  const handleGenerationMenu = () => {
    switch (state.selectedGenerationModel) {
      case "First Frame": return generateWithParams('first-frame');
      case "Last Frame": return generateWithParams('last-frame');
      case "First + Last Pair": return generateFirstLastPair();
      case "Nano Banana": return generateWithParams('nano-banana');
      default: return generateWithParams('standard');
    }
  };

  const enhanceFrameCinematic = () => runAiAction('Make Cinematic', state.imagePrompt, res => updateField('imagePrompt', res));
  const enhanceFrameAccuracyToScene = () => runAiAction('Accuracy to Scene', state.imagePrompt, res => updateField('imagePrompt', res));
  const checkSceneContinuity = () => runAiAction('Continuity', 'Проверить кадры', res => updateField('continuityNotes', res));
  const checkFirstLastConsistency = () => runAiAction('First/Last Check', 'Сравнить', res => updateField('continuityNotes', res));

  const saveFrameGeneratorModule = () => alert("Shot List сохранен!");
  const sendFramesToVideoGenerator = () => alert("Якорные кадры переданы в Видеогенератор");
  const sendFramesToVideoEditor = () => alert("Кадры переданы в Видеоредактор");

  const assignFrameRole = (imageId: string, role: 'primary' | 'first' | 'last') => {
    if (role === 'primary') {
      if (!state.selectedFrameId) {
        alert("Сначала выберите кадр в Shot List (слева) чтобы привязать изображение!");
        return;
      }
      updateFrame(state.selectedFrameId, { selectedImageId: imageId });
    } else if (role === 'first') {
      updateField('selectedFirstFrameId', imageId);
      if (state.selectedFrameId) {
        updateFrame(state.selectedFrameId, { firstFrameAnchorId: imageId });
      }
    } else if (role === 'last') {
      updateField('selectedLastFrameId', imageId);
      if (state.selectedFrameId) {
        updateFrame(state.selectedFrameId, { lastFrameAnchorId: imageId });
      }
    }
  };

  const renderSelector = (title: string, options: string[] | number[], value: any, onSelect: (val: any) => void) => (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">{title}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button 
            key={String(o)} 
            onClick={() => onSelect(o)}
            className={`px-3 py-1.5 rounded-full text-xs transition-all border ${value === o ? 'bg-[#00F0FF]/20 border-[#00F0FF]' : 'bg-black/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 h-full">
      {/* Рабочая область */}
      <div className="flex-1 w-full flex flex-col min-h-0 bg-transparent relative pb-10 custom-scrollbar">
        
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 p-4">
          
          <div className="flex items-center justify-between bg-black/40 p-6 rounded-2xl border border-slate-800">
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-[#00F0FF]">
                Генератор Кадров
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                Создавайте ключевые кадры из сценария, генерируйте First/Last Anchors и настраивайте shot list.
              </p>
            </div>
            
            <button
              onClick={onApprove}
              className="px-6 py-2 rounded-xl bg-[#00F0FF] text-black font-bold uppercase text-xs tracking-widest hover:bg-[#4dffff] transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Утвердить кадры
            </button>
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-black/40 rounded-xl border border-slate-800 sticky top-0 z-10 backdrop-blur-md">
            <button onClick={() => document.getElementById('section-sources')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800 hover:text-white">1. Сценарий & Контекст</button>
            <button onClick={() => document.getElementById('section-generation')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800 hover:text-white">2. Генерация Изображений</button>
            <button onClick={() => document.getElementById('section-shotlist')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800 hover:text-white">3. Shot List</button>
            <button onClick={() => document.getElementById('section-continuity')?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800 hover:text-white">4. Continuity</button>
          </div>

          {/* 1. Источники */}
          <div className="flex flex-col gap-6" id="section-sources">
            <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 1. Источники & Сценарий
            </h2>
            
            <div className="flex gap-4">
              <button onClick={importScript} className="px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2">
                <RefreshCcw className="w-4 h-4" /> Импорт из "Сценарий"
              </button>
              <button onClick={importCharacters} className="px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2">
                <User className="w-4 h-4" /> Импорт Персонажей
              </button>
            </div>

            {state.importedCharacters && state.importedCharacters.length > 0 && (
              <div className="flex flex-col gap-2 p-3 bg-black/30 border border-[#b026ff]/20 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#b026ff]">Быстрый выбор персонажей для кадра:</span>
                <div className="flex flex-wrap gap-2">
                  {state.importedCharacters.map((char: any) => {
                    const charName = char.fullName || char.name || "Персонаж";
                    const charTraits = char.clothesType || char.clothing || char.appearance || "standard look";
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          const desc = `${charName} (${charTraits})`;
                          const existing = state.manualFrameDescription || "";
                          const updated = existing.includes(charName) 
                            ? existing 
                            : (existing ? `${existing}, with ${desc}` : desc);
                          updateField('manualFrameDescription', updated);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#b026ff]/10 border border-[#b026ff]/30 text-xs text-[#b026ff] hover:bg-[#b026ff]/20 transition-colors flex items-center gap-1.5"
                      >
                        <User className="w-3 h-3 text-[#b026ff]" />
                        <span className="font-medium">{charName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Выбор Главы */}
            <div className="flex flex-col gap-4 bg-black/30 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Выбор главы</span>
                <div className="flex gap-2">
                  <button onClick={loadChaptersFromScript} className="text-[10px] text-slate-400 hover:text-white uppercase">Обновить из сценария</button>
                  <button onClick={createChapterManually} className="text-[10px] text-slate-400 hover:text-white uppercase">+ Вручную</button>
                </div>
              </div>
              <div className="flex gap-4 flex-col lg:flex-row items-stretch">
                <div className="w-full lg:w-1/3">
                  <select 
                    value={state.selectedChapterId || ''}
                    onChange={e => selectChapter(e.target.value)}
                    className="w-full h-full bg-black/40 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                  >
                    <option value="">Выберите главу...</option>
                    {state.chapters.map(c => <option key={c.id} value={c.id}>{c.chapterNumber}. {c.title}</option>)}
                  </select>
                </div>
                {state.selectedChapterId && (
                  <div className="flex-1 bg-black/40 border border-slate-800 rounded-lg p-3 grid grid-cols-2 gap-4 text-xs text-slate-400">
                    <div className="flex flex-col gap-1 max-w-full">
                      <strong className="text-slate-200">Резюме:</strong>
                      <span className="whitespace-pre-wrap leading-relaxed block max-h-[150px] overflow-y-auto pr-1">{state.chapters.find(c => c.id === state.selectedChapterId)?.summary || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-1 max-w-full">
                      <strong className="text-slate-200">Тон:</strong>
                      <span className="whitespace-pre-wrap leading-relaxed block max-h-[150px] overflow-y-auto pr-1">{state.chapters.find(c => c.id === state.selectedChapterId)?.visualTone || "—"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Выбор Сцены */}
            <div className="flex flex-col gap-4 bg-black/30 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Выбор сцены (по главе)</span>
                <div className="flex gap-2">
                  <button onClick={loadScenesFromScript} className="text-[10px] text-slate-400 hover:text-white uppercase">Обновить из сценария</button>
                  <button onClick={createSceneManually} className="text-[10px] text-slate-400 hover:text-white uppercase">+ Вручную</button>
                </div>
              </div>
              {state.validationErrors.scene && <span className="text-xs text-rose-500">{state.validationErrors.scene}</span>}
              <div className="flex gap-4 flex-col lg:flex-row items-stretch">
                <div className="w-full lg:w-1/3">
                  <select 
                    value={state.selectedSceneId || ''}
                    onChange={e => selectScene(e.target.value)}
                    className={`w-full h-full bg-black/40 border rounded-lg p-3 text-sm text-white focus:outline-none ${!state.selectedChapterId ? 'border-slate-800 opacity-50 cursor-not-allowed' : 'border-slate-700 focus:border-[#00F0FF]/50'}`}
                    disabled={!state.selectedChapterId}
                  >
                    <option value="">Выберите сцену...</option>
                    {state.scenes.filter(s => s.chapterId === state.selectedChapterId).map(s => <option key={s.id} value={s.id}>{s.sceneNumber}. {s.title}</option>)}
                  </select>
                </div>
                {state.selectedSceneId && (
                  <div className="flex-1 bg-black/40 border border-slate-800 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400">
                    <div className="flex flex-col gap-1 max-w-full">
                      <strong className="text-slate-200">Локация:</strong>
                      <span className="whitespace-pre-wrap leading-relaxed block max-h-[150px] overflow-y-auto pr-1">{state.scenes.find(s => s.id === state.selectedSceneId)?.location || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-1 max-w-full">
                      <strong className="text-slate-200">Стиль:</strong>
                      <span className="whitespace-pre-wrap leading-relaxed block max-h-[150px] overflow-y-auto pr-1">{state.scenes.find(s => s.id === state.selectedSceneId)?.visualStyleHint || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 max-w-full">
                      <strong className="text-slate-200">Описание:</strong>
                      <span className="whitespace-pre-wrap leading-relaxed block max-h-[150px] overflow-y-auto pr-1">{state.scenes.find(s => s.id === state.selectedSceneId)?.description || "—"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Ручное описание кадра или контекста сцены</span>
              <textarea 
                placeholder="Если хотите добавить детали помимо сценария..." 
                value={state.manualFrameDescription}
                onChange={e => updateField('manualFrameDescription', e.target.value)}
                className="w-full min-h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
              />
            </div>
          </div>

          {/* 2. Generation Params & Prompt */}
          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-generation">
            <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 2. Генерация Изображений
            </h2>
            
            <div className="grid gap-6 p-4 rounded-xl border border-slate-800 bg-black/30">
              {renderSelector("Крупность / Тип кадра", SHOT_TYPES, state.selectedShotType, selectField => updateField('selectedShotType', selectField))}
              {renderSelector("Ракурс камеры", CAMERA_ANGLES, state.selectedCameraAngle, selectField => updateField('selectedCameraAngle', selectField))}
              {renderSelector("Освещение", LIGHTINGS, state.selectedLighting, selectField => updateField('selectedLighting', selectField))}
              {renderSelector("Стиль (Visual Style)", VISUAL_STYLES, state.selectedVisualStyle, selectField => updateField('selectedVisualStyle', selectField))}
              {renderSelector("Уровень реализма", REALISM_LEVELS, state.selectedRealismLevel, selectField => updateField('selectedRealismLevel', selectField))}
              <div className="flex flex-col lg:flex-row gap-6 border-t border-slate-800 pt-4 mt-2">
                <div className="flex-1">
                  {renderSelector("Режим генерации", GENERATION_MODELS, state.selectedGenerationModel, selectField => updateField('selectedGenerationModel', selectField))}
                </div>
                <div>
                  {renderSelector("Количество вариантов", VARIATION_COUNTS, state.selectedVariationCount, selectField => updateField('selectedVariationCount', selectField))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <button onClick={buildImagePrompt} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2 font-bold">
                <Wand2 className="w-4 h-4" /> Собрать Image Prompt
              </button>
              <button onClick={enhanceFrameCinematic} className="px-4 py-2 rounded-lg bg-black/40 border border-[#b026ff]/30 text-[#b026ff] text-sm hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Сделать кинематографичнее
              </button>
              <button onClick={enhanceFrameAccuracyToScene} className="px-4 py-2 rounded-lg bg-black/40 border border-[#b026ff]/30 text-[#b026ff] text-sm hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2">
                <Crosshair className="w-4 h-4" /> Точнее по сценарию
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Финальный Image Prompt</span>
                <textarea 
                  placeholder="The core prompt..." 
                  value={state.imagePrompt} 
                  onChange={e => updateField('imagePrompt', e.target.value)}
                  className="w-full min-h-[100px] bg-black/40 border border-[#00F0FF]/30 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                />
              </div>

              <div className="flex gap-4 flex-wrap">
                <button 
                  onClick={() => generateWithParams('standard')} 
                  disabled={state.isGenerating || !state.imagePrompt.trim()}
                  className="px-6 py-3 rounded-xl bg-slate-800 text-slate-100 hover:bg-slate-700 transition-all font-bold uppercase tracking-wider text-xs border border-slate-600 disabled:opacity-50"
                >
                  Сгенерировать Кадр
                </button>
                <button 
                  onClick={() => generateWithParams('first-frame')} 
                  disabled={state.isGenerating || !state.imagePrompt.trim()}
                  className="px-6 py-3 rounded-xl bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60 transition-all font-bold uppercase tracking-wider text-xs border border-indigo-500/50 flex gap-2 items-center disabled:opacity-50"
                >
                  <Anchor className="w-4 h-4" /> First Frame
                </button>
                <button 
                  onClick={() => generateWithParams('last-frame')} 
                  disabled={state.isGenerating || !state.imagePrompt.trim()}
                  className="px-6 py-3 rounded-xl bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60 transition-all font-bold uppercase tracking-wider text-xs border border-indigo-500/50 flex gap-2 items-center disabled:opacity-50"
                >
                  <Anchor className="w-4 h-4" /> Last Frame
                </button>
                <button 
                  onClick={handleGenerationMenu} 
                  disabled={state.isGenerating || !state.imagePrompt.trim()}
                  className="px-6 py-3 rounded-xl bg-[#00F0FF] text-black hover:bg-[#4dffff] transition-all font-bold uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 flex items-center gap-2"
                >
                  {state.isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Генерировать ({state.selectedGenerationModel})
                </button>
              </div>
            </div>

            {/* Gallery */}
            <div className="flex flex-col gap-4 mt-4 bg-black/40 border border-slate-800 rounded-xl p-4">
              <h3 className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF] flex items-center justify-between">
                <span>Результаты генерации</span>
                <span className="text-slate-500">{state.generatedFrameImages.length} кадров</span>
              </h3>
              
              {state.generatedFrameImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Группируем пары для отображения вместе */}
                  {(() => {
                    const renderedIds = new Set<string>();
                    const galleryItems = [];

                    for (const img of state.generatedFrameImages) {
                      if (renderedIds.has(img.id)) continue;

                      if (img.frameType === 'anchor-pair' && img.pairId) {
                        const firstImg = img.pairRole === 'first' ? img : state.generatedFrameImages.find(i => i.pairId === img.pairId && i.pairRole === 'first');
                        const lastImg = img.pairRole === 'last' ? img : state.generatedFrameImages.find(i => i.pairId === img.pairId && i.pairRole === 'last');

                        if (firstImg && lastImg) {
                          renderedIds.add(firstImg.id);
                          renderedIds.add(lastImg.id);

                          galleryItems.push(
                            <div key={`pair-${img.pairId}`} className="col-span-1 lg:col-span-2 bg-indigo-900/10 border border-indigo-500/30 rounded-xl p-3 flex flex-col gap-2">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 flex items-center gap-2">
                                <Anchor className="w-3 h-3" /> Сгенерированная пара (First + Last)
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[firstImg, lastImg].map(pairMember => (
                                  <div 
                                    key={pairMember.id} 
                                    className={`flex flex-col gap-2 rounded-xl p-2 transition-all ${state.selectedFrameImage === pairMember.id ? 'bg-[#00F0FF]/10 border border-[#00F0FF]' : 'bg-black/60 border border-slate-800 hover:border-slate-600'}`}
                                    onClick={() => updateField('selectedFrameImage', pairMember.id)}
                                  >
                                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                                      <img src={pairMember.url} alt="Variant" className="w-full h-full object-cover" />
                                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border border-slate-700">
                                        {pairMember.pairRole === 'first' ? 'FIRST FRAME' : 'LAST FRAME'}
                                      </div>
                                    </div>
                                    <div className="px-1 py-1 flex flex-col gap-1 border-b border-slate-800/50 mb-1">
                                      <span className="text-xs text-slate-400 truncate">{pairMember.sceneName || "No scene"}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                      <button onClick={(e) => { e.stopPropagation(); assignFrameRole(pairMember.id, 'primary'); }} className="px-2 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[10px] uppercase tracking-widest w-full">В Shot List</button>
                                      <button onClick={(e) => { e.stopPropagation(); assignFrameRole(pairMember.id, pairMember.pairRole as 'first'|'last'); }} className={`px-2 py-1.5 rounded text-[10px] uppercase tracking-widest flex-1 ${(pairMember.pairRole === 'first' && state.selectedFirstFrameId === pairMember.id) || (pairMember.pairRole === 'last' && state.selectedLastFrameId === pairMember.id) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                                        As {pairMember.pairRole === 'first' ? 'First' : 'Last'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                          continue;
                        }
                      }

                      // Рендер обычного кадра
                      renderedIds.add(img.id);
                      galleryItems.push(
                        <div 
                          key={img.id} 
                          className={`flex flex-col gap-2 rounded-xl p-2 transition-all ${state.selectedFrameImage === img.id ? 'bg-[#00F0FF]/10 border border-[#00F0FF]' : 'bg-black/60 border border-slate-800 hover:border-slate-600'}`}
                          onClick={() => updateField('selectedFrameImage', img.id)}
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                            <img src={img.url} alt="Variant" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest border border-slate-700">
                              {img.frameType}
                            </div>
                          </div>
                          <div className="px-1 py-1 flex flex-col gap-1 border-b border-slate-800/50 mb-1">
                            <span className="text-xs text-slate-400 truncate">{img.sceneName || "No scene"}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-center">
                            <button onClick={(e) => { e.stopPropagation(); assignFrameRole(img.id, 'primary'); }} className="px-2 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[10px] uppercase tracking-widest w-full">В Shot List</button>
                            <button onClick={(e) => { e.stopPropagation(); assignFrameRole(img.id, 'first'); }} className={`px-2 py-1.5 rounded text-[10px] uppercase tracking-widest flex-1 ${state.selectedFirstFrameId === img.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>As First</button>
                            <button onClick={(e) => { e.stopPropagation(); assignFrameRole(img.id, 'last'); }} className={`px-2 py-1.5 rounded text-[10px] uppercase tracking-widest flex-1 ${state.selectedLastFrameId === img.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>As Last</button>
                          </div>
                        </div>
                      );
                    }

                    return galleryItems;
                  })()}
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl text-center">
                  <ImageIcon className="w-8 h-8 mb-4 opacity-50" />
                  <p className="text-sm font-medium uppercase tracking-widest">Нет генераций</p>
                  <p className="text-xs mt-2 opacity-70">Нажмите кнопку сгенерировать выше</p>
                </div>
              )}
            </div>

            {/* Anchor visualization preview */}
            {(state.selectedFirstFrameId || state.selectedLastFrameId) && (
              <div className="flex flex-col gap-4 bg-indigo-900/10 border border-indigo-500/30 p-4 rounded-xl mt-4">
                <span className="text-[11px] uppercase font-bold tracking-widest text-indigo-400 flex items-center gap-2">
                  <Anchor className="w-3 h-3" /> Текущие Scene Anchors
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400">First Frame</span>
                    {state.selectedFirstFrameId ? (
                      <div className="aspect-video rounded border border-indigo-500/50 overflow-hidden relative">
                         <img src={state.generatedFrameImages.find(i => i.id === state.selectedFirstFrameId)?.url} className="w-full h-full object-cover opacity-80" />
                      </div>
                    ) : <div className="aspect-video bg-black/50 border border-dashed border-slate-700 rounded flex items-center justify-center text-xs text-slate-600">No first frame</div>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400">Last Frame</span>
                    {state.selectedLastFrameId ? (
                      <div className="aspect-video rounded border border-indigo-500/50 overflow-hidden relative">
                         <img src={state.generatedFrameImages.find(i => i.id === state.selectedLastFrameId)?.url} className="w-full h-full object-cover opacity-80" />
                      </div>
                    ) : <div className="aspect-video bg-black/50 border border-dashed border-slate-700 rounded flex items-center justify-center text-xs text-slate-600">No last frame</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Shot list */}
          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-shotlist">
            <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 3. Shot List
            </h2>
            
            <div className="flex gap-4">
              <button onClick={addFrame} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Добавить кадр вручную
              </button>
            </div>

            <div className="flex gap-6 items-start flex-col xl:flex-row">
              {/* Список кадров */}
              <div className="w-full xl:w-1/3 flex flex-col gap-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {state.frames.map((f, index) => (
                  <div 
                    key={f.id} 
                    draggable
                    onDragStart={(e) => {
                      setDraggedFrameIndex(index);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedFrameIndex !== null && draggedFrameIndex !== index) {
                        reorderFrames(draggedFrameIndex, index);
                      }
                      setDraggedFrameIndex(null);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${state.selectedFrameId === f.id ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 text-white' : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                    onClick={() => updateField('selectedFrameId', f.id)}
                  >
                    <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />
                    
                    <div className="w-16 h-10 bg-slate-900 rounded overflow-hidden shrink-0 border border-slate-700">
                      {f.selectedImageId ? (
                        <img src={state.generatedFrameImages.find(i=>i.id === f.selectedImageId)?.url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30"><ImageIcon className="w-3 h-3"/></div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-xs font-bold text-[#00F0FF]">{f.number} {state.scenes.find(s=>s.id === f.sceneId)?.title?.substring(0,10)}...</span>
                      <span className="text-sm font-medium truncate">{f.title || 'Новый кадр'}</span>
                    </div>
                    
                    <button onClick={(e) => { e.stopPropagation(); deleteFrame(f.id); }} className="text-slate-500 hover:text-red-400 shrink-0 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {state.frames.length === 0 && (
                  <div className="p-4 text-center border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">Нет кадров</div>
                )}
              </div>

              {/* Shot Editor */}
              {state.selectedFrameId && (
                <div className="w-full xl:w-2/3 bg-black/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                  {(() => {
                    const f = state.frames.find(frame => frame.id === state.selectedFrameId);
                    if (!f) return null;
                    return (
                      <>
                        <div className="flex gap-4">
                          <input 
                            type="text" placeholder="Номер (напр. 1.1A)" value={f.number} onChange={e => updateFrame(f.id, { number: e.target.value })}
                            className="bg-black/40 border-b border-slate-700 p-2 text-sm text-white focus:outline-none focus:border-[#00F0FF] w-24"
                          />
                          <input 
                            type="text" placeholder="Название кадра" value={f.title} onChange={e => updateFrame(f.id, { title: e.target.value })}
                            className="flex-1 bg-transparent border-b border-slate-700 p-2 text-lg text-white focus:outline-none focus:border-[#00F0FF]"
                          />
                        </div>

                        {f.selectedImageId && (
                          <div className="w-full aspect-video rounded-xl border border-slate-700 overflow-hidden bg-black">
                            <img src={state.generatedFrameImages.find(i=>i.id===f.selectedImageId)?.url} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <input 
                            type="text" placeholder="Локация" value={f.location} onChange={e => updateFrame(f.id, { location: e.target.value })}
                            className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:border-[#00F0FF]/50 outline-none"
                          />
                          <input 
                            type="text" placeholder="Персонажи" value={f.characters} onChange={e => updateFrame(f.id, { characters: e.target.value })}
                            className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:border-[#00F0FF]/50 outline-none"
                          />
                        </div>
                        <textarea 
                          placeholder="Действие (Action) в кадре..." value={f.action} onChange={e => updateFrame(f.id, { action: e.target.value })}
                          className="w-full min-h-[80px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white focus:border-[#00F0FF]/50 outline-none resize-y custom-scrollbar"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <textarea 
                            placeholder="Эмоциональная цель кадра" value={f.emotionalGoal} onChange={e => updateFrame(f.id, { emotionalGoal: e.target.value })}
                            className="w-full h-[60px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white custom-scrollbar focus:border-[#00F0FF]/50 outline-none"
                          />
                          <textarea 
                            placeholder="Zаметки (Continuity)" value={f.continuityNotes} onChange={e => updateFrame(f.id, { continuityNotes: e.target.value })}
                            className="w-full h-[60px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white custom-scrollbar focus:border-[#00F0FF]/50 outline-none"
                          />
                        </div>

                        {(f.firstFrameAnchorId || f.lastFrameAnchorId) && (
                          <div className="flex gap-4 mt-2">
                            {f.firstFrameAnchorId && (
                              <div className="flex-1 flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-widest flex items-center gap-1"><Anchor className="w-3 h-3" /> Anchored First Frame</span>
                                <div className="h-20 bg-black rounded border border-indigo-500/50 overflow-hidden relative">
                                  <img src={state.generatedFrameImages.find(i=>i.id===f.firstFrameAnchorId)?.url} className="w-full h-full object-cover opacity-80" />
                                </div>
                              </div>
                            )}
                            {f.lastFrameAnchorId && (
                              <div className="flex-1 flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-widest flex items-center gap-1"><Anchor className="w-3 h-3" /> Anchored Last Frame</span>
                                <div className="h-20 bg-black rounded border border-indigo-500/50 overflow-hidden relative">
                                  <img src={state.generatedFrameImages.find(i=>i.id===f.lastFrameAnchorId)?.url} className="w-full h-full object-cover opacity-80" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* 4. Continuity */}
          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-continuity">
            <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 4. Continuity & Проверка
            </h2>
            
            <div className="flex gap-4 flex-wrap">
              <button 
                onClick={checkSceneContinuity}
                className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors flex items-center gap-2 font-bold uppercase tracking-widest"
              >
                <AlertCircle className="w-4 h-4" /> Проверить Continuity Сцены
              </button>
              <button 
                onClick={checkFirstLastConsistency}
                className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm hover:bg-indigo-500/20 transition-colors flex items-center gap-2 font-bold uppercase tracking-widest"
              >
                <Anchor className="w-4 h-4" /> Проверить First/Last
              </button>
            </div>

            <textarea 
              placeholder="Результаты аудита continuity..." 
              value={state.continuityNotes} 
              onChange={e => updateField('continuityNotes', e.target.value)}
              className="w-full h-[150px] bg-black/40 border border-slate-700/50 rounded-lg p-4 text-sm text-amber-100/80 placeholder-amber-900/50 focus:outline-none focus:border-amber-500/50 custom-scrollbar font-mono resize-y"
            />
          </div>

          {/* Export / Bottom Buttons */}
          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800">
            <div className="flex gap-3 flex-wrap">
              <button onClick={saveFrameGeneratorModule} className="px-5 py-3 rounded-xl bg-[#00F0FF] text-black font-bold uppercase text-xs tracking-widest hover:bg-[#4dffff] transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                <Save className="w-4 h-4" /> Сохранить Shot List & Кадры
              </button>
              <button onClick={sendFramesToVideoGenerator} className="px-5 py-3 rounded-xl bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                <Forward className="w-4 h-4" /> Передать в Генератор Видео
              </button>
              <button onClick={sendFramesToVideoEditor} className="px-5 py-3 rounded-xl bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                <Forward className="w-4 h-4" /> Передать в Редактор
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Правая панель ИИ-помощника */}
      <div className="w-full lg:w-[320px] bg-black/60 border border-slate-800 flex flex-col shrink-0 lg:h-[max(calc(100vh-140px),600px)] overflow-hidden lg:sticky top-[40px] rounded-xl self-start">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#00F0FF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b026ff]" /> ИИ-Ассистент
          </h3>
          {state.isGenerating && <Loader2 className="w-4 h-4 text-[#00F0FF] animate-spin" />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider">Генерация Кадров</h4>
            <button onClick={() => runAiAction('Сделать Cinematic', 'Улучшить вид', res => addSuggestion('Стиль', res, 'style'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b026ff]" /> Сделать кинематографичнее
            </button>
            <button onClick={() => runAiAction('Подобрать ракурс', 'Какой ракурс лучше?', res => addSuggestion('Ракурс', res, 'camera'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-[#b026ff]" /> Подобрать ракурс
            </button>
            <button onClick={() => runAiAction('Проверить Continuity', 'Проверь стыки', res => addSuggestion('Continuity', res, 'continuity'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10 transition-colors flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00F0FF]" /> Аудит Continuity
            </button>
          </div>

          <AnimatePresence>
            {state.aiSuggestions.map(sug => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={sug.id} 
                className="bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#b026ff] uppercase tracking-wider">{sug.title}</span>
                  <button onClick={() => setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(a => a.id !== sug.id) }))} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-full overflow-hidden text-ellipsis whitespace-pre-wrap">{sug.text}</p>
                <div className="grid gap-2 mt-2">
                  <button onClick={() => applySuggestion(sug.id)} className="py-1.5 w-full bg-[#b026ff]/20 border border-[#b026ff]/50 text-white text-[10px] uppercase font-bold rounded hover:bg-[#b026ff]/40 transition-colors text-center">
                    Вставить в заметки
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {state.aiSuggestions.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6 border border-dashed border-slate-700/50 rounded-xl w-full">
                <Wand2 className="w-6 h-6 text-slate-500 mx-auto mb-3 opacity-50" />
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Рекомендации ИИ</p>
                <p className="text-[10px] text-slate-600 mt-2">Советы по кадру появятся здесь</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
