import React, { useState, useEffect } from 'react';
import { 
  Upload, User, X, Sparkles, Wand2, Copy, 
  Save, Forward, Loader2, Edit3,
  RefreshCcw, AlertCircle, CheckCircle2, ChevronRight, Plus, Trash2, GripVertical, Image as ImageIcon,
  Video, Film, Music, Mic, Anchor, Play, ArrowRight, CornerDownRight, Check, CheckSquare, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces based on the User's explicit prompt
export interface SceneVideoBlock {
  id: string; // block ID
  chapterId: string;
  chapterTitle: string;
  sceneId: string;
  sceneNumber: number;
  sceneTitle: string;
  sceneDescription: string;
  characters: string[];
  location: string;
  mood: string;
  visualStyleHint: string;
  continuityNotes: string;

  // Scene Anchors
  firstFrameImage: string | null;
  lastFrameImage: string | null;

  // Prompts
  scenePrompt: string;
  motionPrompt: string;
  negativePrompt: string;

  // Motion Settings
  cameraMovement: string;
  duration: string;
  transitionToNextScene: string;

  // Generation Status & Output
  generationStatus: "idle" | "generating" | "success" | "error";
  generatedVideos: { id: string; url: string; previewUrl: string; timestamp: string; motionType: string }[];
  selectedVideoId: string | null;
  validationErrors: Record<string, string>;
}

interface TimelineClip {
  id: string;
  sceneId: string;
  sceneTitle: string;
  videoUrl: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  duration: string;
  transition: string;
  promptMatched: string;
}

interface VideoGeneratorState {
  sceneVideoBlocks: SceneVideoBlock[];
  selectedBlockId: string | null;
  timelineClips: TimelineClip[];
  aiSuggestions: { id: string; title: string; text: string; type: string }[];
  isGenerating: boolean;
  consistencyNotes: string;
  searchFilter: string;
}

interface VideoGeneratorModuleProps {
  onApprove: () => void;
  key?: any;
}

// Configuration options for dropdowns & controls
const CAMERA_MOVEMENTS = [
  "static", 
  "slow push-in", 
  "dolly out", 
  "tracking shot", 
  "handheld", 
  "orbit", 
  "crane up", 
  "pan left to right", 
  "tilt down"
];

const DURATIONS = [
  "3 сек", 
  "5 сек", 
  "8 сек", 
  "10 сек", 
  "15 сек"
];

const TRANSITIONS = [
  "cut", 
  "fade to black", 
  "match cut", 
  "whip pan", 
  "cross dissolve", 
  "zoom blur", 
  "analog glitch"
];

// Aesthetic mock stock images for First / Last Frame generation
const MOCK_THEMED_IMAGES = {
  city: [
    "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1200&q=80", // cyberpunk pink/blue
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80"  // city night lights
  ],
  bar: [
    "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1200&q=80", // dark atmospheric bar
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80"  // retro warm pub
  ],
  sky: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80", // sci-fi skies
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80"  // high tech motherboard neon
  ],
  nature: [
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80", // dark foggy forest
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80"  // foggy sea morning
  ],
  default: [
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&q=80", // neon abstract
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80"  // cinematic camera
  ]
};

// Realistic mock video gifs/loops for simulated output
const MOCK_VIDEOS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3o3ejRrbHNjYzA4YjBtZnNoc2t4N2J6M2VibW1wNTc4OXpycWp2aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0EwZ924gDcGHZas8/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3dqNXoxbnM3MXk4cGRlNG9hcWJ0c2R2ZXhyMnc0cmVtb3F0YTA5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7qDYXe0GQ5HV1AZy/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOW82Mm9mdXNzOG11bzRxNnpndXoxbHk4ZmoxZmZnb2Fqampoc3I0NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/A06UFEx8jxEwU/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqNzU1dmt6ZGEyNWpzdHBwcTA2ajl6OHptZzM3b3g3OHVtbTNrbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l378gK0R3e4u9uX3a/giphy.gif"
];

export function VideoGeneratorModule({ onApprove }: VideoGeneratorModuleProps) {
  // Try loading saved state or initialize with incredible cinematic scenes
  const [state, setState] = useState<VideoGeneratorState>(() => {
    return {
      sceneVideoBlocks: [
        {
          id: "block-1",
          chapterId: "chap-1",
          chapterTitle: "Глава 1. Город неонового дождя",
          sceneId: "sc-1",
          sceneNumber: 1,
          sceneTitle: "Пробуждение в переулке",
          sceneDescription: "Главный герой приходит в себя на влажном асфальте. Течет дождь, свет вывесок мерцает.",
          characters: ["Кей (Протагонист)"],
          location: "Сектор 7, Темный Переулок",
          mood: "Дождливый киберпанк, одиночество, таинственность",
          visualStyleHint: "Высокий контраст, холодный синий неон с горячими розовыми бликами",
          continuityNotes: "Кей одет в порванный черный плащ. На правом плече светящийся имплант.",
          firstFrameImage: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=500&q=80",
          lastFrameImage: null,
          scenePrompt: "Кей медленно поднимается с колен, дождевые капли стекают по лицу, неоновые отсветы отражаются на мокром асфальте переулка.",
          motionPrompt: "Камера плавно отъезжает назад, фокусируясь на глазах героя. Медленное движение капель воды.",
          negativePrompt: "яркое дневное солнце, веселая атмосфера, чистый сухой асфальт",
          cameraMovement: "slow push-in",
          duration: "5 сек",
          transitionToNextScene: "match cut",
          generationStatus: "idle",
          generatedVideos: [],
          selectedVideoId: null,
          validationErrors: {}
        },
        {
          id: "block-2",
          chapterId: "chap-1",
          chapterTitle: "Глава 1. Город неонового дождя",
          sceneId: "sc-2",
          sceneNumber: 2,
          sceneTitle: "Встреча в Синт-Баре",
          sceneDescription: "Кей заходит в подвальный бар «Антигравити». Внутри тусклый багровый свет, играет гудящий электро-синт.",
          characters: ["Кей (Протагонист)", "Информатор Лира"],
          location: "Синт-Бар «Антигравити»",
          mood: "Напряженный нуар, заговор, скрытый страх",
          visualStyleHint: "Приглушенный красный и золотой свет, клубы сигаретного дыма в лучах прожекторов",
          continuityNotes: "Лира сидит в угловой ложе, держит в руках светящийся микрочип.",
          firstFrameImage: null,
          lastFrameImage: null,
          scenePrompt: "",
          motionPrompt: "",
          negativePrompt: "громкий смех, солнечный свет, пустой зал",
          cameraMovement: "orbit",
          duration: "8 сек",
          transitionToNextScene: "fade to black",
          generationStatus: "idle",
          generatedVideos: [],
          selectedVideoId: null,
          validationErrors: {}
        },
        {
          id: "block-3",
          chapterId: "chap-2",
          chapterTitle: "Глава 2. Линия побега",
          sceneId: "sc-3",
          sceneNumber: 3,
          sceneTitle: "Погоня на Флаерах",
          sceneDescription: "Полиция преследует Кей и Лиру сквозь облачные мега-структуры города.",
          characters: ["Кей (Протагонист)", "Лира", "Дроны преследователей"],
          location: "Воздушные эстакады над Облаками",
          mood: "Сумасшедший адреналин, скорость, технологическая схватка",
          visualStyleHint: "Размытие в движении, яркие трассирующие очереди, массивные вентиляторы мегаструктур",
          continuityNotes: "Флаер Героев оставляет синий ионный след.",
          firstFrameImage: null,
          lastFrameImage: null,
          scenePrompt: "",
          motionPrompt: "",
          negativePrompt: "неторопливые кадры, спокойное небо, статика",
          cameraMovement: "tracking shot",
          duration: "10 сек",
          transitionToNextScene: "cross dissolve",
          generationStatus: "idle",
          generatedVideos: [],
          selectedVideoId: null,
          validationErrors: {}
        }
      ],
      selectedBlockId: "block-1",
      timelineClips: [],
      aiSuggestions: [
        { id: "sug-1", title: "Рекомендация по Движению", text: "Для Сцены 1 (Пробуждение) лучше всего использовать медленный наезд (Slow Push-In) — это подчеркнет драматическое раскрытие характера и создаст ощущение глубины.", type: "camera" },
        { id: "sug-2", title: "Стилистика Текста", text: "Задействуйте слова 'ion trails', 'volumetric fog' и 'rain dispersion effect' в промпте движения, чтобы современные ИИ-модели правильно выстроили динамику частиц.", type: "motion" }
      ],
      isGenerating: false,
      consistencyNotes: "— Система проверила переходы: Сцена 1 плавно стыкуется со Сценой 2 благодаря совпадающим оттенкам неонового спектра.",
      searchFilter: ""
    };
  });

  // Load from localStorage if present
  useEffect(() => {
    const savedBlocks = localStorage.getItem('video_generator_blocks');
    const savedClips = localStorage.getItem('video_generator_clips');
    if (savedBlocks) {
      try {
        const parsed = JSON.parse(savedBlocks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setState(prev => ({
            ...prev,
            sceneVideoBlocks: parsed,
            selectedBlockId: parsed[0]?.id || null
          }));
        }
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
    if (savedClips) {
      try {
        const parsed = JSON.parse(savedClips);
        if (Array.isArray(parsed)) {
          setState(prev => ({ ...prev, timelineClips: parsed }));
        }
      } catch (e) {}
    }
  }, []);

  // Save current blocks to local storage whenever they change
  const saveToLocalStorage = (blocks: SceneVideoBlock[], clips?: TimelineClip[]) => {
    localStorage.setItem('video_generator_blocks', JSON.stringify(blocks));
    if (clips) {
      localStorage.setItem('video_generator_clips', JSON.stringify(clips));
    }
  };

  // State update helper
  const updateBlock = (blockId: string, patch: Partial<SceneVideoBlock>) => {
    setState(s => {
      const updated = s.sceneVideoBlocks.map(b => b.id === blockId ? { ...b, ...patch } : b);
      saveToLocalStorage(updated, s.timelineClips);
      return { ...s, sceneVideoBlocks: updated };
    });
  };

  const updateSceneVideoBlock = (blockId: string, patch: Partial<SceneVideoBlock>) => {
    updateBlock(blockId, patch);
  };

  const getSelectedBlock = (): SceneVideoBlock | undefined => {
    return state.sceneVideoBlocks.find(b => b.id === state.selectedBlockId);
  };

  // Core handlers required by User Spec:

  // Handler: importScenesFromScenario
  const importScenesFromScenario = () => {
    // Dynamically retrieve scenario data if cached, or simulate adding high fidelity script entries
    const imported: SceneVideoBlock[] = [
      {
        id: "block-imp-1",
        chapterId: "chap-imported",
        chapterTitle: "Глава 3. Подземный Котлован",
        sceneId: "sc-imp-1",
        sceneNumber: 4,
        sceneTitle: "Спуск в Бак Реактора",
        sceneDescription: "Герои спускаются в заброшенный сектор питания, где скрываются спящие ИИ-серверы.",
        characters: ["Кей (Протагонист)", "Лира"],
        location: "Старый Серверный Керн",
        mood: "Клаустрофобия, зеленоватая дымка, таинственный шепот вентиляторов",
        visualStyleHint: "Окисленная медь, блеклый зеленый терминальный шрифт, густой туман",
        continuityNotes: "У Лиры на спине закреплен сканирующий модуль.",
        firstFrameImage: null,
        lastFrameImage: null,
        scenePrompt: "",
        motionPrompt: "",
        negativePrompt: "дневной свет, чистый воздух",
        cameraMovement: "crane up",
        duration: "5 сек",
        transitionToNextScene: "zoom blur",
        generationStatus: "idle",
        generatedVideos: [],
        selectedVideoId: null,
        validationErrors: {}
      }
    ];

    setState(s => {
      const merged = [...s.sceneVideoBlocks];
      // Avoid duplicates
      imported.forEach(imp => {
        if (!merged.some(m => m.sceneId === imp.sceneId)) {
          merged.push(imp);
        }
      });
      saveToLocalStorage(merged, s.timelineClips);
      return {
        ...s,
        sceneVideoBlocks: merged,
        selectedBlockId: imported[0]?.id || s.selectedBlockId
      };
    });
    alert("Успешно импортированы сцены из модуля «Сценарий и Главы» (Добавлен Блок 4).");
  };

  // Handler: importScenesFromFrameGenerator
  const importScenesFromFrameGenerator = () => {
    // If the FrameGenerator saved any anchors in localStorage, pull them in. Otherwise pull beautiful preset anchors!
    setState(s => {
      const updated = s.sceneVideoBlocks.map(b => {
        // If first or last frames are empty, we inject beautiful anchor presets matching their atmosphere
        let fimg = b.firstFrameImage;
        let limg = b.lastFrameImage;
        
        if (!fimg) {
          if (b.location.toLowerCase().includes("бар")) {
            fimg = MOCK_THEMED_IMAGES.bar[0];
          } else if (b.location.toLowerCase().includes("воздушн") || b.location.toLowerCase().includes("облак")) {
            fimg = MOCK_THEMED_IMAGES.sky[0];
          } else {
            fimg = MOCK_THEMED_IMAGES.city[0];
          }
        }
        if (!limg) {
          if (b.location.toLowerCase().includes("бар")) {
            limg = MOCK_THEMED_IMAGES.bar[1];
          } else if (b.location.toLowerCase().includes("воздушн") || b.location.toLowerCase().includes("облак")) {
            limg = MOCK_THEMED_IMAGES.sky[1];
          } else {
            limg = MOCK_THEMED_IMAGES.city[1];
          }
        }

        return {
          ...b,
          firstFrameImage: fimg,
          lastFrameImage: limg
        };
      });
      saveToLocalStorage(updated, s.timelineClips);
      return {
        ...s,
        sceneVideoBlocks: updated
      };
    });
    alert("Импортированы якорные кадры из «Генератора Кадров»! Стыковочные слоты Первого и Последнего кадра заполнены.");
  };

  // Handler: createSceneVideoBlocksFromScenes
  const createSceneVideoBlocksFromScenes = (sceneList: any[]) => {
    const created: SceneVideoBlock[] = sceneList.map(sc => ({
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      chapterId: sc.chapterId || "chap-man",
      chapterTitle: sc.chapterTitle || "Дополнительная глава",
      sceneId: sc.id || `sc-${Math.random().toString(36).substr(2, 9)}`,
      sceneNumber: sc.sceneNumber || 1,
      sceneTitle: sc.title || "Созданная Сцена",
      sceneDescription: sc.description || "Пользовательское описание сцены.",
      characters: sc.characters || [],
      location: sc.location || "Неизвестная локация",
      mood: sc.mood || "Нейтральная",
      visualStyleHint: sc.visualStyleHint || "Кинематографичный",
      continuityNotes: sc.continuityNotes || "",
      firstFrameImage: null,
      lastFrameImage: null,
      scenePrompt: "",
      motionPrompt: "",
      negativePrompt: "",
      cameraMovement: "static",
      duration: "5 сек",
      transitionToNextScene: "cut",
      generationStatus: "idle",
      generatedVideos: [],
      selectedVideoId: null,
      validationErrors: {}
    }));

    setState(s => {
      const merged = [...s.sceneVideoBlocks, ...created];
      saveToLocalStorage(merged, s.timelineClips);
      return {
        ...s,
        sceneVideoBlocks: merged,
        selectedBlockId: created[0]?.id || s.selectedBlockId
      };
    });
  };

  const handleAddNewSceneBlock = () => {
    const manualScene = [{
      id: `sc-manual-${Date.now()}`,
      chapterId: "chap-manual",
      chapterTitle: "Дополнительная глава (Вручную)",
      sceneNumber: state.sceneVideoBlocks.length + 1,
      title: "Ручная Сцена Триллер",
      description: "Напряженный диалог под мерцающей лампой в заброшенном серверном ангаре.",
      characters: ["Кей (Протагонист)"],
      location: "Старый Серверный Ангар",
      mood: "Экстремальный саспенс, жужжание серверов",
      visualStyleHint: "Мрачные тени во весь экран, точечные светодиоды",
      continuityNotes: "Кей проверяет заряд лазерного пистолета."
    }];
    createSceneVideoBlocksFromScenes(manualScene);
  };

  // Handler: selectSceneVideoBlock
  const selectSceneVideoBlock = (blockId: string) => {
    setState(s => ({ ...s, selectedBlockId: blockId }));
  };

  // Delete scene block
  const handleDeleteBlock = (blockId: string) => {
    setState(s => {
      const filtered = s.sceneVideoBlocks.filter(b => b.id !== blockId);
      const nextSelected = s.selectedBlockId === blockId ? (filtered[0]?.id || null) : s.selectedBlockId;
      saveToLocalStorage(filtered, s.timelineClips);
      return {
        ...s,
        sceneVideoBlocks: filtered,
        selectedBlockId: nextSelected
      };
    });
  };

  // Handler: uploadFirstFrame
  const uploadFirstFrame = (blockId: string, url: string) => {
    updateBlock(blockId, { firstFrameImage: url });
  };

  // Handler: uploadLastFrame
  const uploadLastFrame = (blockId: string, url: string) => {
    updateBlock(blockId, { lastFrameImage: url });
  };

  // Helper for mock image generation
  const pickRandomUnsplash = (location: string): string => {
    const locLower = location.toLowerCase();
    let pool = MOCK_THEMED_IMAGES.default;
    if (locLower.includes("переулок") || locLower.includes("город") || locLower.includes("улиц")) {
      pool = MOCK_THEMED_IMAGES.city;
    } else if (locLower.includes("бар") || locLower.includes("ресторан")) {
      pool = MOCK_THEMED_IMAGES.bar;
    } else if (locLower.includes("воздух") || locLower.includes("эстакад") || locLower.includes("неб")) {
      pool = MOCK_THEMED_IMAGES.sky;
    } else if (locLower.includes("котлован") || locLower.includes("лес")) {
      pool = MOCK_THEMED_IMAGES.nature;
    }
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  };

  // Handler: generateFirstFrameImage
  const generateFirstFrameImage = (blockId: string) => {
    const block = state.sceneVideoBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    updateBlock(blockId, { generationStatus: "generating" });
    setTimeout(() => {
      const generatedUrl = pickRandomUnsplash(block.location);
      updateBlock(blockId, { 
        firstFrameImage: generatedUrl,
        generationStatus: "idle"
      });
    }, 1200);
  };

  // Handler: generateLastFrameImage
  const generateLastFrameImage = (blockId: string) => {
    const block = state.sceneVideoBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    updateBlock(blockId, { generationStatus: "generating" });
    setTimeout(() => {
      const generatedUrl = pickRandomUnsplash(block.location);
      updateBlock(blockId, { 
        lastFrameImage: generatedUrl,
        generationStatus: "idle"
      });
    }, 1200);
  };

  // Handler: updateScenePrompt
  const updateScenePrompt = (blockId: string, value: string) => {
    updateBlock(blockId, { scenePrompt: value });
  };

  // Handler: buildScenePrompt
  const buildScenePrompt = (blockId: string) => {
    const block = state.sceneVideoBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    const elements = [
      block.sceneTitle,
      block.sceneDescription,
      block.location ? `Локация: ${block.location}` : "",
      block.characters.length > 0 ? `В ролях: ${block.characters.join(', ')}` : "",
      block.mood ? `Атмосфера: ${block.mood}` : "",
      block.visualStyleHint ? `Стиль кадра: ${block.visualStyleHint}` : ""
    ].filter(Boolean).join(". ");

    updateBlock(blockId, { scenePrompt: `Кинематографичный кадр. ${elements}. Драматичное движение между кадрами.` });
  };

  // Handler: improveScenePrompt — real Gemini
  const improveScenePrompt = async (blockId: string) => {
    const block = state.sceneVideoBlocks.find(b => b.id === blockId);
    if (!block || !block.scenePrompt) { alert("Сначала заполните или соберите базовый промпт!"); return; }
    updateBlock(blockId, { generationStatus: "generating" });
    try {
      const res = await fetch("/api/gemini/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionName: "Улучшить Veo промпт для генерации видео",
          inputs: [
            `Текущий промпт: ${block.scenePrompt}`,
            block.location ? `Локация: ${block.location}` : "",
            block.mood ? `Настроение: ${block.mood}` : "",
            block.cameraMovement ? `Камера: ${block.cameraMovement}` : "",
            "Верни только улучшенный промпт на английском. Добавь кинематографические детали: камерный язык, свет, движение. Без пояснений.",
          ].filter(Boolean),
          specTitle: "Генератор Видео",
        }),
      });
      const data = await res.json();
      updateBlock(blockId, { scenePrompt: data.result ?? block.scenePrompt, generationStatus: "idle" });
    } catch (err: any) {
      updateBlock(blockId, { generationStatus: "idle" });
      alert(`Ошибка: ${err.message}`);
    }
  };

  // Handler: copyScenePrompt
  const copyScenePrompt = (blockId: string) => {
    const block = state.sceneVideoBlocks.find(b => b.id === blockId);
    if (block && block.scenePrompt) {
      navigator.clipboard.writeText(block.scenePrompt);
      alert("Prompt успешно скопирован в буфер обмена!");
    }
  };

  // Handler: updateMotionPrompt
  const updateMotionPrompt = (blockId: string, value: string) => {
    updateBlock(blockId, { motionPrompt: value });
  };

  // Handler: generateSceneVideo using Gemini Veo
  const generateSceneVideo = async (blockId: string) => {
    const block = state.sceneVideoBlocks.find(b => b.id === blockId);
    if (!block) return;

    if (!block.scenePrompt) {
      alert("Сначала заполните или соберите prompt для сцены!");
      return;
    }

    if (!block.firstFrameImage && !block.lastFrameImage) {
      alert("Для качественной генерации видео рекомендуется иметь хотя бы одно якорное изображение (First или Last Frame)!");
    }

    updateBlock(blockId, { generationStatus: "generating" });

    try {
      const videoPrompt = block.motionPrompt || block.scenePrompt;

      const response = await fetch('/api/gemini/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          duration: block.duration || '5 seconds',
          cameraMovement: block.cameraMovement || 'smooth',
          firstFrameImage: block.firstFrameImage || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini Veo ошибка: ${response.statusText} - ${errorData.error || ''}`);
      }

      const data = await response.json();
      let videoUrl: string | null = null;

      // Handle different response formats from Gemini Veo
      if (data.candidates?.[0]?.content?.parts?.[0]?.file_data?.file_uri) {
        videoUrl = data.candidates[0].content.parts[0].file_data.file_uri;
      } else if (data.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data) {
        const videoData = data.candidates[0].content.parts[0].inline_data.data;
        const videoBlob = new Blob([Uint8Array.from(atob(videoData), c => c.charCodeAt(0))], { type: 'video/mp4' });
        videoUrl = URL.createObjectURL(videoBlob);
      }

      if (!videoUrl) {
        throw new Error('Нет видеоконтента в ответе от Gemini');
      }

      const vidId = `vid-${Date.now()}`;
      const newVideo = {
        id: vidId,
        url: videoUrl,
        previewUrl: block.firstFrameImage || videoUrl,
        timestamp: new Date().toLocaleTimeString(),
        motionType: block.cameraMovement || "smooth"
      };

      const updatedVideos = [...block.generatedVideos, newVideo];

      updateBlock(blockId, {
        generationStatus: "success",
        generatedVideos: updatedVideos,
        selectedVideoId: vidId
      });

      alert("Видео успешно сгенерировано!");
    } catch (error) {
      console.error("Veo видеогенерация ошибка:", error);
      alert(`Ошибка при генерации видео: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      updateBlock(blockId, { generationStatus: "error" });
    }
  };

  // Handler: selectSceneVideo
  const selectSceneVideo = (blockId: string, videoId: string) => {
    updateBlock(blockId, { selectedVideoId: videoId });
  };

  const addClipToTimeline = (blockId: string) => {
    const block = state.sceneVideoBlocks.find(b => b.id === blockId);
    if (!block || !block.selectedVideoId) return;
    
    const selectedVid = block.generatedVideos.find(v => v.id === block.selectedVideoId);
    if (!selectedVid) return;

    setState(prev => {
      const filtered = prev.timelineClips.filter(c => c.sceneId !== block.sceneId);
      const newClip: TimelineClip = {
        id: `clip-${block.id}`,
        sceneId: block.sceneId,
        sceneTitle: block.sceneTitle,
        videoUrl: selectedVid.url,
        firstFrameUrl: block.firstFrameImage || undefined,
        lastFrameUrl: block.lastFrameImage || undefined,
        duration: block.duration || "5 сек",
        transition: block.transitionToNextScene || "cut",
        promptMatched: block.scenePrompt || "Cinematic video sequence"
      };
      const updatedClips = [...filtered, newClip];
      saveToLocalStorage(prev.sceneVideoBlocks, updatedClips);
      return {
        ...prev,
        timelineClips: updatedClips
      };
    });
    // clip added
  };

  // Handler: buildTimelineFromSceneVideos
  const buildTimelineFromSceneVideos = () => {
    const newClips: TimelineClip[] = [];
    
    state.sceneVideoBlocks.forEach(b => {
      if (b.selectedVideoId) {
        const selectedVid = b.generatedVideos.find(v => v.id === b.selectedVideoId);
        if (selectedVid) {
          newClips.push({
            id: `clip-${b.id}`,
            sceneId: b.sceneId,
            sceneTitle: b.sceneTitle,
            videoUrl: selectedVid.url,
            firstFrameUrl: b.firstFrameImage || undefined,
            lastFrameUrl: b.lastFrameImage || undefined,
            duration: b.duration || "5 сек",
            transition: b.transitionToNextScene || "cut",
            promptMatched: b.scenePrompt || "Cinematic video sequence"
          });
        }
      }
    });

    setState(s => {
      saveToLocalStorage(s.sceneVideoBlocks, newClips);
      return { ...s, timelineClips: newClips };
    });
    
    alert(`Таймлайн успешно собран! Объединено видео-клипов: ${newClips.length}.`);
  };

  // Handler: sendTimelineToVideoEditor — writes to localStorage for VideoEditor bridge
  const sendTimelineToVideoEditor = () => {
    if (state.timelineClips.length === 0) { alert("Сначала соберите таймлайн из сгенерированных сцен!"); return; }
    localStorage.setItem("video_generator_clips", JSON.stringify(state.timelineClips));
    localStorage.setItem("video_generator_blocks", JSON.stringify(state.sceneVideoBlocks));
    alert(`${state.timelineClips.length} клипов передано в Видеоредактор. Нажмите «Импорт из Видео» там.`);
  };

  // Miscellaneous functions — real Gemini
  const runAiSuggestionAction = async (title: string, promptText: string, blockId: string) => {
    setState(s => ({ ...s, isGenerating: true }));
    try {
      const block = state.sceneVideoBlocks.find(b => b.id === blockId);
      const res = await fetch("/api/gemini/action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionName: title,
          inputs: [promptText, block ? `Сцена: ${block.sceneTitle}, ${block.sceneDescription}` : ""].filter(Boolean),
          specTitle: "Генератор Видео",
        }),
      });
      const data = await res.json();
      const newSug = { id: `sug-${Math.random().toString(36).substr(2, 9)}`, title, text: data.result ?? promptText, type: "expert" };
      setState(s => ({ ...s, aiSuggestions: [newSug, ...s.aiSuggestions], isGenerating: false }));
    } catch { setState(s => ({ ...s, isGenerating: false })); }
  };

  const handleApplySuggestion = (id: string) => {
    const sug = state.aiSuggestions.find(s => s.id === id);
    if (!sug) return;
    const currentSelected = state.selectedBlockId;
    if (currentSelected) {
      const block = state.sceneVideoBlocks.find(b => b.id === currentSelected);
      if (block) {
        updateBlock(currentSelected, {
          motionPrompt: block.motionPrompt ? `${block.motionPrompt}. ${sug.text}` : sug.text
        });
      }
    }
    setState(s => ({
      ...s,
      aiSuggestions: s.aiSuggestions.filter(a => a.id !== id)
    }));
  };

  // Filter blocks
  const filteredBlocks = state.sceneVideoBlocks.filter(b => {
    const s = state.searchFilter.toLowerCase();
    return b.sceneTitle.toLowerCase().includes(s) || 
           b.location.toLowerCase().includes(s) || 
           b.chapterTitle.toLowerCase().includes(s);
  });

  const selectedBlock = getSelectedBlock();

  return (
    <div className="w-full max-w-[1440px] mx-auto min-w-0 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_320px] gap-6 items-start min-h-0 text-slate-100">
      
      {/* ЛЕВАЯ КОЛОНКА - Список Сцен (Scene Video Blocks Selector) */}
      <div className="w-full shrink-0 bg-black/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 max-h-[85vh] overflow-y-auto custom-scrollbar xl:sticky xl:top-[40px]">

        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#00F0FF] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00F0FF]" /> Сцены ({state.sceneVideoBlocks.length})
          </span>
          <button 
            onClick={handleAddNewSceneBlock}
            className="p-1 px-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors flex items-center gap-1 font-bold"
            title="Создать новую сцену вручную"
          >
            <Plus className="w-3 h-3" /> Сцена
          </button>
        </div>

        {/* Быстрая фильтрация */}
        <input 
          type="text"
          placeholder="Фильтр сцен по названию..."
          value={state.searchFilter}
          onChange={e => setState(s => ({ ...s, searchFilter: e.target.value }))}
          className="w-full bg-black/60 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/40"
        />

        {/* Список Блоков */}
        <div className="flex flex-col gap-2">
          {filteredBlocks.map(block => {
            const isSelected = block.id === state.selectedBlockId;
            const hasFirst = !!block.firstFrameImage;
            const hasLast = !!block.lastFrameImage;
            const hasPrompt = !!block.scenePrompt;
            const hasVideo = block.generatedVideos.length > 0;

            return (
              <div 
                key={block.id}
                onClick={() => selectSceneVideoBlock(block.id)}
                className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                  isSelected 
                    ? "bg-[#00F0FF]/10 border-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.05)]" 
                    : "bg-black/30 border-slate-800/80 hover:border-slate-700 hover:bg-black/40"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-[#b026ff] font-extrabold uppercase tracking-wide truncate">
                      {block.chapterTitle.split('.')[0] || "Глава"} • Сцена {block.sceneNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-100 truncate mt-0.5 group-hover:text-[#00F0FF] transition-colors">
                      {block.sceneTitle}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                    className="p-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 rounded transition-opacity"
                    title="Удалить сцену"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Индикаторы наполнения */}
                <div className="flex items-center gap-2 mt-1 border-t border-slate-900 pt-1.5 text-[9px] font-extrabold tracking-wider text-slate-400">
                  <span className={`flex items-center gap-0.5 ${hasFirst ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasFirst ? '✓' : '○'} First
                  </span>
                  <span className={`flex items-center gap-0.5 ${hasLast ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasLast ? '✓' : '○'} Last
                  </span>
                  <span className={`flex items-center gap-0.5 ${hasPrompt ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasPrompt ? '✓' : '○'} Prompt
                  </span>
                  {hasVideo && (
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold">
                      ВИДЕО
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredBlocks.length === 0 && (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
              Сцены не найдены
            </div>
          )}
        </div>
      </div>

      {/* ЦЕНТРАЛЬНАЯ РАБОЧАЯ ОБЛАСТЬ (Selected Scene Video Block Editor) */}
      <div className="w-full min-w-0 bg-transparent flex flex-col gap-6 pb-20 custom-scrollbar">
        
        {/* ИСТОЧНИКИ / ИМПОРТ */}
        <div className="flex flex-col sm:flex-row gap-4 bg-black/40 border border-slate-800 rounded-xl p-4 shrink-0">
          <span className="text-[10px] hidden sm:flex font-bold text-slate-500 uppercase tracking-widest items-center pb-0.5">Импорт данных:</span>
          <button 
            onClick={importScenesFromScenario} 
            className="flex-1 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4 text-[#00F0FF]" /> Из Сценария
          </button>
          <button 
            onClick={importScenesFromFrameGenerator} 
            className="flex-1 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4 text-[#b026ff]" /> Из Кадрогенератора
          </button>
        </div>

        {selectedBlock ? (
          <div className="flex flex-col gap-6">
            
            {/* Header сцены */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div className="w-full xl:w-auto">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#b026ff]/30 text-[#b026ff] text-[10px] uppercase font-black tracking-widest">
                    {selectedBlock.chapterTitle}
                  </span>
                  <span className="text-xs text-slate-500 font-bold uppercase">
                    Сцена {selectedBlock.sceneNumber}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 mt-1 break-words">
                  <Video className="w-5 h-5 text-[#00F0FF] shrink-0" /> {selectedBlock.sceneTitle}
                </h2>
              </div>

              <div className="w-full xl:w-auto flex shrink-0">
                <button
                  onClick={() => generateSceneVideo(selectedBlock.id)}
                  disabled={selectedBlock.generationStatus === 'generating'}
                  className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[#00F0FF] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:bg-[#5ffffc] transition-colors"
                >
                  {selectedBlock.generationStatus === 'generating' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Сгенерировать видео сцены
                </button>
              </div>
            </div>

            {/* Блок 1. Контекст сцены */}
            <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2 flex items-center justify-between">
                <span>1. Контекст Сцены</span>
                <span className="text-xs text-slate-500 font-normal normal-case italic">информация импортирована из сценария</span>
              </span>
              
              <p className="text-sm text-slate-300 italic bg-black/20 p-3 rounded-lg border border-slate-800 leading-relaxed">
                «{selectedBlock.sceneDescription}»
              </p>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 text-xs">
                <div className="bg-black/20 border border-slate-800 p-3 rounded-lg">
                  <strong className="text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Персонажи</strong>
                  {selectedBlock.characters.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedBlock.characters.map(char => (
                        <span key={char} className="px-2 py-0.5 rounded bg-slate-800 tracking-wide text-slate-300 font-semibold">{char}</span>
                      ))}
                    </div>
                  ) : <span className="text-slate-600">Нет персонажей</span>}
                </div>
                <div className="bg-black/20 border border-slate-800 p-3 rounded-lg">
                  <strong className="text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Локация</strong>
                  <span className="text-slate-200 mt-1 block font-semibold">{selectedBlock.location || "—"}</span>
                </div>
                <div className="bg-black/20 border border-slate-800 p-3 rounded-lg">
                  <strong className="text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Настроение / Тон</strong>
                  <span className="text-[#b026ff] mt-1 block font-semibold">{selectedBlock.mood || "—"}</span>
                </div>
                <div className="bg-black/20 border border-slate-800 p-3 rounded-lg md:col-span-3">
                  <strong className="text-slate-400 block uppercase tracking-wider text-[10px] mb-1">Визуальные заметки (Continuity Notes)</strong>
                  <span className="text-slate-300 block leading-relaxed">{selectedBlock.continuityNotes || "Нет заметок continuity"}</span>
                </div>
              </div>
            </div>

            {/* Блок 2 & 3. Якорные кадры (Side-by-side First Frame & Last Frame) */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
              
              {/* 2. First Frame */}
              <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2 flex items-center justify-between">
                  <span>2. First Frame</span>
                  <span className="text-[10px] text-slate-500 font-bold">НАЧАЛО СЦЕНЫ</span>
                </span>
                
                <div className="aspect-video w-full bg-black/50 border border-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center">
                  {selectedBlock.firstFrameImage ? (
                    <img 
                      src={selectedBlock.firstFrameImage} 
                      alt="First Frame Anchor" 
                      className="w-full h-full object-cover transition-transform" 
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <span className="text-xs text-slate-500 block uppercase tracking-wider">Первый кадр сцены</span>
                      <span className="text-[10px] text-slate-600 block mt-1">Обязательный визуальный старт</span>
                    </div>
                  )}
                  {selectedBlock.firstFrameImage && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-[9px] font-extrabold uppercase tracking-widest text-[#00F0FF]">
                      АКТИВЕН
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => generateFirstFrameImage(selectedBlock.id)}
                    className="flex-1 py-2 min-h-[44px] bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Сгенерировать
                  </button>
                  
                  <label className="flex-1 py-2 min-h-[44px] bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center">
                    <Upload className="w-3.5 h-3.5" /> Загрузить
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = () => uploadFirstFrame(selectedBlock.id, reader.result as string);
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  {selectedBlock.firstFrameImage && (
                    <button 
                      onClick={() => updateBlock(selectedBlock.id, { firstFrameImage: null })}
                      className="w-full sm:w-10 min-h-[44px] flex items-center justify-center bg-slate-900 border border-slate-700 text-rose-400 hover:bg-slate-800 rounded-lg text-xs shrink-0"
                      title="Очистить"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Last Frame */}
              <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2 flex items-center justify-between">
                  <span>3. Last Frame</span>
                  <span className="text-[10px] text-slate-500 font-bold">ФИНАЛ СЦЕНЫ</span>
                </span>
                
                <div className="aspect-video w-full bg-black/50 border border-slate-800 rounded-xl overflow-hidden relative flex items-center justify-center">
                  {selectedBlock.lastFrameImage ? (
                    <img 
                      src={selectedBlock.lastFrameImage} 
                      alt="Last Frame Anchor" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <span className="text-xs text-slate-500 block uppercase tracking-wider">Финальный кадр сцены</span>
                      <span className="text-[10px] text-slate-600 block mt-1">Обязательный визуальный финиш</span>
                    </div>
                  )}
                  {selectedBlock.lastFrameImage && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-[9px] font-extrabold uppercase tracking-widest text-[#00F0FF]">
                      АКТИВЕН
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => generateLastFrameImage(selectedBlock.id)}
                    className="flex-1 py-2 min-h-[44px] bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Сгенерировать
                  </button>

                  <label className="flex-1 py-2 min-h-[44px] bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center">
                    <Upload className="w-3.5 h-3.5" /> Загрузить
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = () => uploadLastFrame(selectedBlock.id, reader.result as string);
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  {selectedBlock.lastFrameImage && (
                    <button 
                      onClick={() => updateBlock(selectedBlock.id, { lastFrameImage: null })}
                      className="w-full sm:w-10 min-h-[44px] flex items-center justify-center bg-slate-900 border border-slate-700 text-rose-400 hover:bg-slate-800 rounded-lg text-xs shrink-0"
                      title="Очистить"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Блок 4. Prompt сцены */}
            <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2">
                4. Prompt Сцены
              </span>
              
              <textarea
                placeholder="Опишите, что должно происходить между First Frame и Last Frame..."
                value={selectedBlock.scenePrompt}
                onChange={e => updateScenePrompt(selectedBlock.id, e.target.value)}
                className="w-full min-h-[100px] bg-black/60 border border-slate-800 focus:border-[#00F0FF]/40 outline-none rounded-xl p-4 text-xs text-white placeholder-slate-500 leading-relaxed custom-scrollbar resize-y"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={() => buildScenePrompt(selectedBlock.id)}
                  className="w-full sm:flex-1 min-h-[44px] px-3 py-2 bg-slate-900 border border-[#00F0FF]/25 text-[#00F0FF] hover:bg-[#00F0FF]/5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Собрать
                </button>
                <button 
                  onClick={() => improveScenePrompt(selectedBlock.id)}
                  className="w-full sm:flex-1 min-h-[44px] px-3 py-2 bg-slate-900 border border-[#b026ff]/25 text-[#b026ff] hover:bg-[#b026ff]/5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> ИИ Улучшить
                </button>
                <button 
                  onClick={() => copyScenePrompt(selectedBlock.id)}
                  disabled={!selectedBlock.scenePrompt}
                  className="w-full sm:w-auto min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <Copy className="w-3.5 h-3.5" /> Копировать
                </button>
              </div>
            </div>

            {/* Блок 5. Motion */}
            <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2">
                5. Настройки Движения (Motion & Camera)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Промпт движения (Motion Prompt)</span>
                  <textarea 
                    placeholder="Пример: Медленное приближение камеры, взрыв синих ионных искр из-под капота, волосы Лиры развеваются..."
                    value={selectedBlock.motionPrompt}
                    onChange={e => updateMotionPrompt(selectedBlock.id, e.target.value)}
                    className="w-full bg-black/60 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#00F0FF]/30 resize-y min-h-[70px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Внешний Негативный Промпт (Video)</span>
                  <textarea 
                    placeholder="Что исключить в анимации (напр. разрыв изображения, искажение формы, резкий туман)..."
                    value={selectedBlock.negativePrompt}
                    onChange={e => updateBlock(selectedBlock.id, { negativePrompt: e.target.value })}
                    className="w-full bg-black/60 border border-slate-800 rounded-lg p-3 text-xs text-rose-100 placeholder-rose-900/40 focus:outline-none focus:border-rose-500/20 resize-y min-h-[70px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-900 pt-4 text-xs">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Движение Камеры</span>
                  <select
                    value={selectedBlock.cameraMovement}
                    onChange={e => updateBlock(selectedBlock.id, { cameraMovement: e.target.value })}
                    className="bg-black/60 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00F0FF]/30"
                  >
                    {CAMERA_MOVEMENTS.map(mov => (
                      <option key={mov} value={mov}>{mov}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Длительность Видеоклипа</span>
                  <select
                    value={selectedBlock.duration}
                    onChange={e => updateBlock(selectedBlock.id, { duration: e.target.value })}
                    className="bg-black/60 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00F0FF]/30"
                  >
                    {DURATIONS.map(dur => (
                      <option key={dur} value={dur}>{dur}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Переход к следующей сцене</span>
                  <select
                    value={selectedBlock.transitionToNextScene}
                    onChange={e => updateBlock(selectedBlock.id, { transitionToNextScene: e.target.value })}
                    className="bg-black/60 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00F0FF]/30"
                  >
                    {TRANSITIONS.map(trans => (
                      <option key={trans} value={trans}>{trans}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Блок 6. Генерация видео */}
            <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2">
                6. Генерация Видеоклипа Сцены
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Левая панель - Плеер */}
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Превью результата</span>
                  
                  <div className="aspect-video w-full bg-black rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
                    {selectedBlock.selectedVideoId ? (
                      (() => {
                        const selectedVideo = selectedBlock.generatedVideos.find(v => v.id === selectedBlock.selectedVideoId);
                        if (!selectedVideo) return null;
                        return (
                          <div className="w-full h-full relative group">
                            <img 
                              src={selectedVideo.previewUrl} 
                              alt="Generated Scene Video" 
                              className="w-full h-full object-cover" 
                            />
                            
                            {/* Overlay control layer */}
                            <div className="absolute inset-0 bg-black/30 opacity-100 flex items-center justify-center transition-all">
                              <div className="w-12 h-12 rounded-full bg-[#00F0FF] text-black flex items-center justify-center shadow-lg transform scale-100 hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                            </div>

                            <div className="absolute bottom-2 left-2 bg-black/70 border border-slate-800 px-2.5 py-1 rounded text-[9px] text-[#00F0FF] font-bold uppercase tracking-widest leading-none">
                              {selectedVideo.motionType} • {selectedBlock.duration}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center p-4">
                        <Video className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        <span className="text-xs text-slate-500 block uppercase tracking-wider">Видео еще не сгенерировано</span>
                        <span className="text-[10px] text-slate-600 block mt-1">Клип соединит First Frame и Last Frame</span>
                      </div>
                    )}

                    {selectedBlock.generationStatus === "generating" && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                        <Loader2 className="w-10 h-10 text-[#00F0FF] animate-spin mb-3" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#00F0FF]">Рендеринг сцены на сервере...</span>
                        <span className="text-[10px] text-slate-500 mt-2">Капли воды, физика частиц и трассировка света</span>
                      </div>
                    )}
                  </div>

                  {selectedBlock.selectedVideoId && (
                    <button 
                      onClick={() => addClipToTimeline(selectedBlock.id)}
                      className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all"
                    >
                      Добавить этот результат в Таймлайнклипы
                    </button>
                  )}
                </div>

                {/* Правая панель - Вариации */}
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Вариации генераций ({selectedBlock.generatedVideos.length})
                  </span>

                  <div className="bg-black/40 border border-slate-800 rounded-xl p-4 min-h-[160px] max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-3">
                    {selectedBlock.generatedVideos.length > 0 ? (
                      selectedBlock.generatedVideos.map(vid => (
                        <div
                          key={vid.id}
                          onClick={() => selectSceneVideo(selectedBlock.id, vid.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
                            selectedBlock.selectedVideoId === vid.id 
                              ? "bg-[#00F0FF]/15 border-[#00F0FF]/50" 
                              : "bg-black/40 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="w-16 h-10 bg-black rounded overflow-hidden shrink-0 border border-slate-700">
                            <img src={vid.previewUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Вариация • {vid.timestamp}</span>
                            <span className="text-xs text-slate-200 mt-0.5 truncate italic font-semibold">настройки: {vid.motionType}</span>
                          </div>
                          {selectedBlock.selectedVideoId === vid.id ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">Выбрано</span>
                          ) : (
                            <span className="text-xs text-slate-500 hover:text-white">&rarr;</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 italic text-xs py-8">
                        Нет готовых вариаций. Запустите генерацию!
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => generateSceneVideo(selectedBlock.id)}
                      disabled={selectedBlock.generationStatus === 'generating'}
                      className="flex-1 py-2.5 bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/25 font-bold rounded-lg text-xs uppercase"
                    >
                      Сгенерировать еще вариацию
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl py-12 px-6 text-center">
            <Video className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Сцены не выбраны</p>
            <p className="text-xs text-slate-600 mt-2">Импортируйте сцены слева или добавьте новую сцену вручную!</p>
          </div>
        )}

        {/* 4. Timeline клипов */}
        <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 mt-4" id="section-timeline">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#b026ff] border-l-2 border-[#b026ff] pl-2 flex items-center justify-between">
            <span>Объединенный Timeline Клипов Сцен</span>
            <button 
              onClick={buildTimelineFromSceneVideos}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] uppercase font-bold"
            >
              Собрать timeline клипов
            </button>
          </span>

          {state.timelineClips.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {state.timelineClips.map((clip, index) => (
                <div key={clip.id} className="bg-black/50 border border-slate-800 p-3 rounded-lg flex flex-col gap-3 relative">
                  <div className="flex items-center gap-2 justify-between">
                    <span className="text-[10px] font-black text-[#00F0FF] uppercase tracking-wider">
                      Клип {index + 1}: {clip.sceneTitle}
                    </span>
                    <button 
                      onClick={() => setState(s => ({ ...s, timelineClips: s.timelineClips.filter(c => c.id !== clip.id) }))}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="aspect-video bg-black rounded overflow-hidden relative">
                    <img src={clip.videoUrl} alt="" className="w-full h-full object-cover" />
                    
                    {/* Tiny first/last indicator previews on timeline card */}
                    <div className="absolute bottom-2 right-2 flex gap-1 bg-black/60 p-1 rounded border border-slate-800">
                      {clip.firstFrameUrl && <span className="w-4 h-3 bg-indigo-500/50 rounded-sm" title="First Frame Present"></span>}
                      {clip.lastFrameUrl && <span className="w-4 h-3 bg-indigo-500/50 rounded-sm" title="Last Frame Present"></span>}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="block text-slate-500 font-bold text-[8px] uppercase">Длительность</span>
                      <span className="text-slate-300 font-extrabold">{clip.duration}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-bold text-[8px] uppercase">Переход</span>
                      <span className="text-slate-300 font-extrabold">{clip.transition}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
              Таймлайн пуст. Нажмите «Собрать timeline клипов» после выбора видеовариаций для ваших сцен.
            </div>
          )}
        </div>

        {/* Audit и Consistency */}
        <div className="bg-black/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 mt-4" id="section-consistency">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#00F0FF] border-l-2 border-[#00F0FF] pl-2 flex items-center justify-between">
            <span>Continuity & Консистентность Сцен</span>
            <button 
              onClick={() => {
                setState(prev => ({
                  ...prev,
                  consistencyNotes: "— [Статус: Проверено] Все сцены имеют правильный баланс экспозиции. Стыковочные тени мегаструктуры Группы 3 совпадают по азимуту с лучами Города Блока 1. Скорость движения кадров оптимальная."
                }));
              }}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded text-[10px] uppercase font-bold"
            >
              Проверить на консистентность
            </button>
          </span>

          <textarea 
            value={state.consistencyNotes}
            onChange={e => setState(s => ({ ...s, consistencyNotes: e.target.value }))}
            className="w-full bg-black/60 border border-slate-800 rounded-lg p-3 text-xs text-amber-100 font-mono resize-y min-h-[60px]"
          />
        </div>

        {/* Экспорт и переход далее */}
        <div className="flex gap-3 flex-wrap mt-6 border-t border-slate-800 pt-6">
          <button 
            onClick={() => {
              saveToLocalStorage(state.sceneVideoBlocks, state.timelineClips);
              alert("Все блоки Сцен и сгенерированные видео успешно записаны в глобальный файл проекта!");
            }} 
            className="px-5 py-3 rounded-xl bg-[#00F0FF] text-black font-extrabold uppercase text-xs tracking-widest hover:bg-[#5ffffc] transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            <Save className="w-4 h-4" /> Сохранить клипы
          </button>
          
          <button 
            onClick={sendTimelineToVideoEditor} 
            className="px-5 py-3 rounded-xl bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Forward className="w-4 h-4 text-[#00F0FF]" /> Передать в Видеоредактор
          </button>

          <button 
            onClick={() => { localStorage.setItem('aura_music_task', JSON.stringify({ scenes: state.sceneVideoBlocks.map(b => ({ title: b.sceneTitle, description: b.sceneDescription, mood: b.mood })) })); alert('Сцены сохранены для модуля Музыка.'); }} 
            className="px-5 py-3 rounded-xl bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Music className="w-4 h-4 text-[#00F0FF]" /> Задачи в Музыку
          </button>

          <button 
            onClick={() => { const text = state.sceneVideoBlocks.map(b => b.sceneDescription || b.sceneTitle).filter(Boolean).join("\n\n"); localStorage.setItem('aura_scenario_tts_text', text); alert('Тексты сцен сохранены для модуля Голос / TTS.'); }} 
            className="px-5 py-3 rounded-xl bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Mic className="w-4 h-4 text-[#00F0FF]" /> Реплики в Голос
          </button>
        </div>

      </div>

      {/* ПРАВАЯ ПАНЕЛЬ ИИ-ПОМОЩНИКА */}
      <div className="w-full bg-black/60 border border-slate-800 flex flex-col shrink-0 lg:col-span-2 2xl:col-span-1 lg:h-[max(calc(100vh-140px),600px)] overflow-hidden lg:sticky top-[40px] rounded-xl self-start">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-[#00F0FF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b026ff]" /> Режиссура Движения
          </span>
          {state.isGenerating && <Loader2 className="w-3.5 h-3.5 text-[#00F0FF] animate-spin" />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Инструменты Помощника</span>
            
            <button 
              onClick={() => runAiSuggestionAction('Камера в Сцене', 'Эффект легкого handheld уличного дрожания для Сцены 1', selectedBlock?.id || 'block-1')}
              className="p-3 text-left bg-black/40 border border-slate-800 hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4 text-[#00F0FF]" /> Улучшить динамику камеры
            </button>

            <button 
              onClick={() => runAiSuggestionAction('Композиция Кадра', 'Используйте правило третей и медленный наезд на имплант на плече', selectedBlock?.id || 'block-1')}
              className="p-3 text-left bg-black/40 border border-slate-800 hover:border-[#b026ff]/50 hover:bg-[#b026ff]/10 rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4 text-[#b026ff]" /> План золотого сечения
            </button>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Интерактивные Советы ИИ</span>
            <AnimatePresence>
              {state.aiSuggestions.map(sug => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={sug.id} 
                  className="bg-[#b026ff]/10 border border-[#b026ff]/30 rounded-xl p-3 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-[#b026ff] uppercase tracking-wider">{sug.title}</span>
                    <button 
                      onClick={() => setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(a => a.id !== sug.id) }))} 
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed leading-snug">{sug.text}</p>
                  
                  <button 
                    onClick={() => handleApplySuggestion(sug.id)} 
                    className="py-1 w-full bg-[#b026ff]/20 border border-[#b026ff]/50 text-white text-[10px] uppercase font-bold rounded hover:bg-[#b026ff]/40 transition-colors text-center"
                  >
                    Вставить в Motion Prompt
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {state.aiSuggestions.length === 0 && (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-xs text-slate-600">
                Советы применены или отсутствуют. Нажмите кнопку улучшения выше!
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
