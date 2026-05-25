import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, FileAudio, X, Sparkles, Wand2, Copy, 
  Save, Forward, Loader2, Film, MessageSquare, Plus, AlignLeft, Layout, Edit3,
  RefreshCcw, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AiStore } from '../../services/aiStore';
import { ProjectsStore } from '../../services/projectsStore';

interface IdeaState {
  uploadedAudioFile: File | null;
  ideaText: string;
  selectedGenres: string[];
  selectedMoods: string[];
  selectedEra: string | null;
  generatedLogline: string;
  generatedSynopsis: string;
  generatedDialogue: string;
  selectedDialogueMood: string;
  generatedMoodboard: string[];
  finalPrompt: string;
  aiSuggestions: any[];
  validationErrors: Record<string, string>;
  magicLanguage: string;
  magicDuration: number;
  magicClipDuration: string;
  magicGenerateCharacters: boolean;
  isMagicRunning: boolean;
  magicProgress: number;
  magicStatusText: string;
}

export function IdeaPromptModule({ 
  onApprove,
  onSendToCharacters,
  onMagicComplete
}: { 
  onApprove: () => void;
  onSendToCharacters?: (payload: any) => void;
  onMagicComplete?: () => void;
  key?: React.Key;
}) {
  const [state, setState] = useState<IdeaState>({
    uploadedAudioFile: null,
    ideaText: "",
    selectedGenres: [],
    selectedMoods: [],
    selectedEra: null,
    generatedLogline: "",
    generatedSynopsis: "",
    generatedDialogue: "",
    selectedDialogueMood: "Напряженный",
    generatedMoodboard: [],
    finalPrompt: "",
    aiSuggestions: [],
    validationErrors: {},
    magicLanguage: "Русский",
    magicDuration: 30, // in seconds (Total duration)
    magicClipDuration: "5", // 5 seconds per clip default
    magicGenerateCharacters: true,
    isMagicRunning: false,
    magicProgress: 0,
    magicStatusText: ""
  });

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("aura_idea_prompt_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load saved state for IdeaPromptModule", e);
      }
    }
  }, []);

  // Save state to localStorage on state changes
  useEffect(() => {
    const { uploadedAudioFile, ...serializableState } = state;
    localStorage.setItem("aura_idea_prompt_state", JSON.stringify(serializableState));
  }, [state]);

  const sendToCharactersModule = () => {
    const payload = {
      ideaText: state.ideaText,
      finalPrompt: state.finalPrompt,
      logline: state.generatedLogline,
      synopsis: state.generatedSynopsis,
      selectedGenres: state.selectedGenres,
      selectedMoods: state.selectedMoods,
      selectedEra: state.selectedEra,
      uploadedAudioFileMeta: state.uploadedAudioFile ? {
        name: state.uploadedAudioFile.name,
        size: state.uploadedAudioFile.size,
        type: state.uploadedAudioFile.type
      } : null,
      projectId: "aura_project_1",
      sourceModule: "idea_prompt" as const,
      updatedAt: new Date().toISOString()
    };

    if (!payload.ideaText && !payload.finalPrompt && !payload.logline && !payload.synopsis) {
      setState(s => ({
        ...s,
        validationErrors: {
          ...s.validationErrors,
          sendError: "Сначала введите идею или соберите промпт"
        }
      }));
      return;
    }

    setState(s => ({
      ...s,
      validationErrors: {
        ...s.validationErrors,
        sendError: ""
      }
    }));

    // Save the imported context
    localStorage.setItem("aura_imported_idea_context", JSON.stringify(payload));

    if (onSendToCharacters) {
      onSendToCharacters(payload);
    }
  };

  const [isAiLoading, setIsAiLoading] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const GENRES = [
    "Сай-фай", "Киберпанк", "Драма", "Триллер", "Фэнтези", "Хоррор", "Комедия", 
    "Романтика", "Детектив", "Экшен", "Приключение", "Документальный", "Реклама", 
    "Музыкальный клип", "Социальный ролик", "Обучающее видео", "Исторический", 
    "Постапокалипсис", "Нуар", "Артхаус"
  ];
  const MOODS = [
    "Мрачное", "Грустное", "Эпичное", "Напряжённое", "Спокойное", "Романтичное", 
    "Весёлое", "Тревожное", "Таинственное", "Вдохновляющее", "Агрессивное", 
    "Меланхоличное", "Мечтательное", "Динамичное", "Сюрреалистичное", "Тёплое", 
    "Холодное", "Ностальгическое", "Минималистичное", "Кинематографичное"
  ];
  const ERAS = [
    "Прошлое", "Настоящее", "Будущее", "Альтернативная история", "Средневековье", 
    "80-е", "90-е", "2000-е", "Постапокалипсис", "Далёкое будущее"
  ];

  // A. Upload Audio
  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setState(s => ({ ...s, uploadedAudioFile: file, validationErrors: { ...s.validationErrors, audio: '' } }));
      } else {
        setState(s => ({ ...s, validationErrors: { ...s.validationErrors, audio: 'Неподдерживаемый формат. Только аудио.' } }));
      }
    }
  };
  
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setState(s => ({ ...s, uploadedAudioFile: e.target.files![0], validationErrors: { ...s.validationErrors, audio: '' } }));
    }
  };

  const removeAudioFile = () => setState(s => ({ ...s, uploadedAudioFile: null }));
  const openAudioUpload = () => fileInputRef.current?.click();

  // B. Idea Editor
  const updateIdeaText = (val: string) => setState(s => ({ ...s, ideaText: val }));

  // C. Selectors
  const selectParam = (key: keyof IdeaState, val: string) => {
    setState(s => ({ ...s, [key]: s[key] === val ? null : val }));
  };

  const selectMultiParam = (key: 'selectedGenres' | 'selectedMoods', val: string) => {
    setState(s => ({
       ...s,
       [key]: s[key].includes(val) ? s[key].filter(i => i !== val) : [...s[key], val]
    }));
  };

  // AI Actions (Secure API routing via Centralized AiStore Router)
  const runAiAction = async (actionKey: string, promptInfo: string, callback: (res: string) => void) => {
    setIsAiLoading(prev => ({ ...prev, [actionKey]: true }));
    try {
      const actionMap: Record<string, string> = {
        "Улучшить идею": "improveIdea",
        "Сделать кинематографичнее": "makeCinematic",
        "Развернуть в концепт": "expandConcept",
        "Предложить 5 похожих идей": "similarIdeas",
        "Создать логлайн": "generateLogline",
        "Создать синопсис": "generateSynopsis",
        "Создать мудборд": "generateMoodboard",
        "Создать диалог": "generateDialogue",
        "Собрать финальный промпт": "assemblePrompt",
        "Улучшить финальный промпт": "improveFinalPrompt",
        "Анализ аудио": "audioAnalysis",
      };
      
      const functionName = actionMap[actionKey] || "improveIdea";
      const inputs = [promptInfo, state.ideaText, state.selectedGenres.join(', '), state.selectedMoods.join(', '), state.selectedEra].filter(Boolean) as string[];

      const result = await AiStore.getInstance().requestExecution({
        module: "idea_prompt",
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

  const addSuggestion = (title: string, content: string, type: 'idea' | 'prompt') => {
    setState(s => ({
      ...s,
      aiSuggestions: [{ id: Date.now().toString(), title, content, type }, ...s.aiSuggestions]
    }));
  };

  const handleIdeaResponse = (res: string) => {
    const loglineMatch = res.match(/###\s*Логлайн\s*\n?([^#]+)/i) || res.match(/\*\*Логлайн:?\*\*\s*\n?([^#\n]+)/i);
    const synopsisMatch = res.match(/###\s*Синопсис\s*\n?([^#]+)/i) || res.match(/\*\*Синопсис:?\*\*\s*\n?([^#]+)/i);
    
    let newLogline = state.generatedLogline;
    let newSynopsis = state.generatedSynopsis;

    if (loglineMatch && loglineMatch[1]) newLogline = loglineMatch[1].trim();
    if (synopsisMatch && synopsisMatch[1]) newSynopsis = synopsisMatch[1].trim();

    setState(s => ({ ...s, ideaText: res, generatedLogline: newLogline, generatedSynopsis: newSynopsis }));
  };

  const improveIdea = () => runAiAction('Улучшить идею', 'Опираясь на жанр, настроение и эпоху, улучши идею. Верни только саму улучшенную идею, без лишних слов, без вступлений и без комментариев. ОБЯЗАТЕЛЬНО включи в ответ блоки с точными заголовками "### Логлайн" и "### Синопсис".', handleIdeaResponse);
  const makeIdeaCinematic = () => runAiAction('Сделать кинематографичнее', 'Добавь визуальных деталей, сделай кинематографично. Если меняешь сюжет, ОБЯЗАТЕЛЬНО включи блоки "### Логлайн" и "### Синопсис".', handleIdeaResponse);
  const expandIdeaToConcept = () => runAiAction('Развернуть в концепт', 'Напиши подробный концепт. Обязательно включи блоки "### Логлайн" и "### Синопсис".', handleIdeaResponse);
  const generateSimilarIdeas = () => runAiAction('Предложить 5 похожих идей', 'Верни 5 альтернатив', res => setState(s => ({ ...s, ideaText: s.ideaText + '\n\nПохожие идеи:\n' + res })));
  
  const analyzeAudio = async () => {
    if (!state.uploadedAudioFile) return;
    
    if (state.uploadedAudioFile.size > 3.3 * 1024 * 1024) {
      alert("Файл слишком большой для прямого анализа ИИ (лимит Vercel ~3.3 МБ). Пожалуйста, загрузите более короткий отрывок.");
      return;
    }

    setIsAiLoading(prev => ({ ...prev, ['Анализ аудио']: true }));
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;
          if (!result) throw new Error("Failed to read file");
          
          const base64Data = result.split(',')[1];
          
          const response = await fetch('/api/gemini/analyze-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioData: base64Data,
              mimeType: state.uploadedAudioFile!.type || 'audio/mp3',
            })
          });
          
          if (!response.ok) {
             const errData = await response.json().catch(() => ({}));
             throw new Error(errData.error || response.statusText);
          }
          
          const data = await response.json();
          handleIdeaResponse(data.result);
          setIsAiLoading(prev => ({ ...prev, ['Анализ аудио']: false }));
        } catch (err: any) {
          console.error(err);
          alert(`Ошибка при запросе: ${err.message}`);
          setIsAiLoading(prev => ({ ...prev, ['Анализ аудио']: false }));
        }
      };
      
      reader.onerror = () => {
        alert("Ошибка при чтении аудиофайла");
        setIsAiLoading(prev => ({ ...prev, ['Анализ аудио']: false }));
      };
      
      reader.readAsDataURL(state.uploadedAudioFile);
    } catch (err: any) {
      console.error(err);
      alert(`Ошибка при анализе аудио: ${err.message}`);
      setIsAiLoading(prev => ({ ...prev, ['Анализ аудио']: false }));
    }
  };
  
  const generateLogline = () => runAiAction('Создать логлайн', 'Напиши 1 короткое предложение', res => setState(s => ({ ...s, generatedLogline: res })));
  const generateSynopsis = () => runAiAction('Создать синопсис', 'Напиши 3 абзаца синопсиса', res => setState(s => ({ ...s, generatedSynopsis: res })));
  const generateMoodboard = () => {
    runAiAction('Создать мудборд', 'Верни 5-7 визуальных тегов через запятую', res => {
      const tags = res.split(',').map(t => t.trim()).filter(Boolean);
      setState(s => ({ ...s, generatedMoodboard: tags.length > 0 ? tags : [res] }));
    });
  };

  const generateDialogue = () => runAiAction('Создать диалог', `Опираясь на описанную идею, синопсис и логлайн, напиши сцену с небольшим диалогом между главными героями этой истории. Настроение диалога: ${state.selectedDialogueMood}. Не пиши ничего кроме самого диалога.`, res => setState(s => ({ ...s, generatedDialogue: res })));

  const buildFinalPrompt = () => {
    const parts = [
      `Название: ${state.ideaText ? "Проект" : "Без названия"}`,
      `Основная идея: ${state.ideaText || "Не указана"}`,
      `Жанр: ${state.selectedGenres.length > 0 ? state.selectedGenres.join(', ') : "Не указан"}`,
      `Настроение: ${state.selectedMoods.length > 0 ? state.selectedMoods.join(', ') : "Не указано"}`,
      `Эпоха: ${state.selectedEra || "Не указана"}`,
      state.generatedLogline ? `Логлайн: ${state.generatedLogline}` : "",
      state.generatedSynopsis ? `Синопсис: ${state.generatedSynopsis}` : "",
      state.generatedMoodboard.length > 0 ? `Мудборд: ${state.generatedMoodboard.join(', ')}` : "",
      state.uploadedAudioFile ? `Музыкальное/аудио направление: ${state.uploadedAudioFile.name}` : ""
    ].filter(Boolean);
    
    setState(s => ({ ...s, finalPrompt: parts.join('\n\n') }));
  };

  const improveFinalPrompt = () => runAiAction('Улучшить финальный промпт', 'Сделай промпт идеальным для генерации', res => setState(s => ({ ...s, finalPrompt: res })));

  const applySuggestion = (id: string, action: 'replace' | 'append') => {
    const suggestion = state.aiSuggestions.find(s => s.id === id);
    if (!suggestion) return;
    
    setState(s => {
      if (suggestion.type === 'idea') {
        return { 
          ...s, 
          ideaText: action === 'replace' ? suggestion.content : s.ideaText + '\n\nКонцепт: ' + suggestion.content,
          aiSuggestions: s.aiSuggestions.filter(sug => sug.id !== id)
        };
      } else {
        return {
          ...s,
          finalPrompt: action === 'replace' ? suggestion.content : s.finalPrompt + '\n\n' + suggestion.content,
          aiSuggestions: s.aiSuggestions.filter(sug => sug.id !== id)
        };
      }
    });
  };

  const dismissSuggestion = (id: string) => {
    setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(sug => sug.id !== id) }));
  };

  const copyFinalPrompt = () => {
    navigator.clipboard.writeText(state.finalPrompt);
  };

  const handleSaveLocally = () => {
    const pName = ProjectsStore.getInstance().saveCurrentProject();
    alert(`Идея успешно сохранена в проект "${pName}"! Вы найдете сгенерированный Markdown файл (1_Идея_и_Солид.md) в левом сайдбаре проекта.`);
  };

  // Helper to extract the last frame of a generated video for 100% continuity
  const extractLastFrame = async (videoUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.src = videoUrl;
      video.onloadeddata = () => {
        video.currentTime = Math.max(0, video.duration - 0.1);
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Compress the image to save localStorage quota
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      video.onerror = () => resolve(null);
    });
  };

  // --- MAGIC PIPELINE ---
  const runMagicPipeline = async () => {
    setState(s => ({ ...s, isMagicRunning: true, magicProgress: 5, magicStatusText: "Инициализация конвейера..." }));
    
    try {
      const context = [
        state.ideaText,
        state.selectedGenres.join(", "),
        state.selectedMoods.join(", "),
        state.selectedEra
      ].filter(Boolean).join(" | ");

      if (!context && !state.uploadedAudioFile) throw new Error("Введите идею для начала!");

      const isArmenian = state.magicLanguage === "Հայերեն";
      const languageInstruction = isArmenian 
        ? "ОТВЕЧАЙ СТРОГО НА АРМЯНСКОМ ЯЗЫКЕ (Հայերեն), но поля 'videoPrompt' и 'motionPrompt' всегда пиши на английском." 
        : `Отвечай на языке: ${state.magicLanguage}. Поля промптов для видео - строго на английском.`;

      // 1. Characters
      let characterContext = "";
      if (state.magicGenerateCharacters) {
        setState(s => ({ ...s, magicProgress: 15, magicStatusText: "Генерация персонажей..." }));
        
        const charRes = await fetch('/api/gemini/action', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionName: "Generate Characters Magic",
            inputs: [
              `Идея: ${context}`,
              languageInstruction,
              `Верни ТОЛЬКО валидный JSON массив объектов (от 1 до 3). Формат: [{"id": "1", "name": "имя", "role": "роль", "archetype": "архетип", "visualDescription": "описание", "psychology": "психология", "videoPrompt": "English prompt", "validationErrors": {}}]`
            ],
            specTitle: "Магия"
          })
        });
        
        if (!charRes.ok) throw new Error("Ошибка генерации персонажей");
        const charData = await charRes.json();
        let characters = [];
        try {
           const cleaned = charData.result.replace(/```json/g, '').replace(/```/g, '').trim();
           characters = JSON.parse(cleaned);
           localStorage.setItem('aura_character_state', JSON.stringify({ characters }));
           characterContext = "Персонажи: " + characters.map((c:any) => `${c.name} (${c.role})`).join(", ");
        } catch(e) { console.warn("Failed to parse characters"); }
      }

      // Calculate number of scenes based on Total Duration and Clip Duration
      const sceneCount = Math.max(1, Math.ceil(state.magicDuration / Number(state.magicClipDuration)));

      // 2. Scenario
      setState(s => ({ ...s, magicProgress: 35, magicStatusText: `Написание сценария (Сцен: ${sceneCount})...` }));
      const sceneRes = await fetch('/api/gemini/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName: "Generate Scenes Magic",
          inputs: [
            `Идея: ${context}`,
            characterContext,
            `Создай ровно ${sceneCount} сцен. Каждая сцена длится ${state.magicClipDuration} секунд. Общая длительность фильма: ${state.magicDuration} секунд.`,
            languageInstruction,
            `Верни ТОЛЬКО валидный JSON массив объектов. Формат: [{"id": "1", "title": "название", "description": "описание", "location": "локация", "characters": ["имя"], "videoPrompt": "English cinematic prompt for Veo", "duration": "${state.magicClipDuration} сек", "cameraMovement": "static"}]`
          ],
          specTitle: "Магия"
        })
      });
      
      if (!sceneRes.ok) throw new Error("Ошибка генерации сценария");
      const sceneData = await sceneRes.json();
      let scenes = [];
      try {
         const cleaned = sceneData.result.replace(/```json/g, '').replace(/```/g, '').trim();
         scenes = JSON.parse(cleaned);
         localStorage.setItem('aura_scenario_state', JSON.stringify({ scenes }));
      } catch(e) { throw new Error("Сценарий не в формате JSON"); }

      // Map Blocks
      let videoBlocks: any[] = scenes.map((sc: any, idx: number) => ({
        id: `block-magic-${Date.now()}-${idx}`,
        chapterId: "chap-magic",
        chapterTitle: "Магия",
        sceneId: sc.id || `sc-magic-${idx}`,
        sceneNumber: idx + 1,
        sceneTitle: sc.title || `Сцена ${idx + 1}`,
        sceneDescription: sc.description || "",
        characters: typeof sc.characters === 'string' ? sc.characters.split(',') : (sc.characters || []),
        location: sc.location || "",
        mood: "",
        visualStyleHint: "",
        continuityNotes: "",
        firstFrameImage: null,
        lastFrameImage: null,
        scenePrompt: sc.videoPrompt || "",
        motionPrompt: "",
        negativePrompt: "",
        cameraMovement: sc.cameraMovement || "static",
        duration: `${state.magicClipDuration} сек`,
        transitionToNextScene: "cut",
        generationStatus: "idle",
        generatedVideos: [],
        selectedVideoId: null,
        validationErrors: {}
      }));

      // 3. Videos
      let timelineClips: any[] = [];
      const totalScenes = videoBlocks.length;
      let previousLastFrame: string | null = null;
      
      for (let i = 0; i < totalScenes; i++) {
        setState(s => ({ ...s, magicProgress: 40 + (i / totalScenes) * 50, magicStatusText: `Генерация видео ${i + 1} из ${totalScenes}...` }));
        const block = videoBlocks[i];
        
        // Pass the first frame from the previous video for 100% continuity
        if (previousLastFrame) {
          block.firstFrameImage = previousLastFrame;
        }

        try {
          const vRes = await fetch('/api/gemini/video', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: block.scenePrompt,
              duration: `${state.magicClipDuration} seconds`,
              cameraMovement: block.cameraMovement,
              firstFrameImage: previousLastFrame // FOR CONTINUITY
            })
          });
          
          if (vRes.ok) {
             const vData = await vRes.json();
             let videoUrl = null;
             if (vData.candidates?.[0]?.content?.parts?.[0]?.file_data?.file_uri) {
               videoUrl = vData.candidates[0].content.parts[0].file_data.file_uri;
             } else if (vData.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data) {
               // Fix Quota Exceeded by creating a Blob URL instead of storing raw base64 string
               const videoData = vData.candidates[0].content.parts[0].inline_data.data;
               const videoBlob = new Blob([Uint8Array.from(atob(videoData), c => c.charCodeAt(0))], { type: 'video/mp4' });
               videoUrl = URL.createObjectURL(videoBlob);
             }
             
             if (videoUrl) {
                const vidId = `vid-magic-${Date.now()}`;
                block.generationStatus = "success";
                block.generatedVideos = [{ id: vidId, url: videoUrl, previewUrl: videoUrl, timestamp: new Date().toLocaleTimeString(), motionType: block.cameraMovement }];
                block.selectedVideoId = vidId;
                
                // Extract last frame for continuity of the NEXT block
                previousLastFrame = await extractLastFrame(videoUrl);
                block.lastFrameImage = previousLastFrame;
                
                timelineClips.push({
                  id: `clip-magic-${block.id}`,
                  sceneId: block.sceneId,
                  sceneTitle: block.sceneTitle,
                  videoUrl: videoUrl,
                  duration: `${state.magicClipDuration} сек`,
                  transition: "cut",
                  promptMatched: block.scenePrompt
                });
             }
          }
        } catch(e) { console.warn(`Видео ${i + 1} ошибка:`, e); }
      }
      
      localStorage.setItem('video_generator_blocks', JSON.stringify(videoBlocks));
      localStorage.setItem('video_generator_clips', JSON.stringify(timelineClips));

      setState(s => ({ ...s, magicProgress: 100, magicStatusText: "Готово! Переход в Видеоредактор..." }));
      
      setTimeout(() => {
        setState(s => ({ ...s, isMagicRunning: false }));
        if (onMagicComplete) onMagicComplete();
      }, 1500);

    } catch(err: any) {
      console.error(err);
      alert("Ошибка Магии: " + err.message);
      setState(s => ({ ...s, isMagicRunning: false }));
    }
  };

  return (

    <div className="w-full min-h-[100vh] flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_320px] gap-6 w-full max-w-7xl mx-auto items-start">
        {/* ЛЕВАЯ ЧАСТЬ: Единая Рабочая Область */}
        <div className="h-auto min-h-0 overflow-visible pb-8 flex flex-col gap-6">
          
          <div className="bg-black/30 border border-[#00F0FF]/20 rounded-xl p-5 md:p-6 shadow-[0_0_20px_rgba(0,240,255,0.03)] flex flex-col gap-8 relative z-10 w-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] opacity-50"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center border border-[#00F0FF]/30">
              <Sparkles className="w-5 h-5 text-[#00F0FF]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Рабочая область: Идея и Промпт</h1>
              <p className="text-sm text-slate-400">Формирование основы истории, настройка визуального стиля и сборка промпта</p>
            </div>
          </div>

          {/* MAGIC MODE OVERLAY */}
          <AnimatePresence>
            {state.isMagicRunning && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
              >
                <div className="bg-[#121824] border border-[#B026FF]/50 p-8 rounded-2xl max-w-md w-full shadow-[0_0_50px_rgba(176,38,255,0.2)] flex flex-col items-center text-center gap-6 relative overflow-hidden">
                   <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-[#B026FF] to-[#00F0FF] transition-all duration-300" style={{width: `${state.magicProgress}%`}}></div>
                   
                   <div className="w-20 h-20 rounded-full bg-[#B026FF]/20 flex items-center justify-center border-2 border-[#B026FF]/50 animate-pulse">
                     <Sparkles className="w-10 h-10 text-[#B026FF] animate-spin-slow" />
                   </div>
                   
                   <div className="flex flex-col gap-2 w-full">
                     <h2 className="text-2xl font-bold text-white">Режим «Магия»</h2>
                     <p className="text-[#00F0FF] font-medium tracking-wide uppercase text-sm animate-pulse">{state.magicStatusText}</p>
                   </div>
                   
                   <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                     <div className="h-full bg-gradient-to-r from-[#B026FF] to-[#00F0FF] transition-all duration-300" style={{width: `${state.magicProgress}%`}}></div>
                   </div>
                   <p className="text-xs text-slate-500">Пожалуйста, подождите. ИИ-Директор собирает ваш фильм...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAGIC MODE UI */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-[#B026FF] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B026FF] animate-pulse"></span> 0. Авто-Генератор (Магия)
            </h2>
            <div className="bg-[#B026FF]/5 border border-[#B026FF]/30 p-5 rounded-xl shadow-[0_0_20px_rgba(176,38,255,0.05)] flex flex-col gap-4 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#B026FF] to-transparent opacity-50"></div>
               
               <p className="text-xs text-slate-400 leading-relaxed">
                 Опишите идею ниже, настройте эти параметры и нажмите кнопку. Система сама сгенерирует персонажей, сценарий и видео-ряд!
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                 <div className="flex flex-col gap-1.5">
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Язык контента</span>
                   <select 
                     value={state.magicLanguage} 
                     onChange={e => setState(s => ({ ...s, magicLanguage: e.target.value }))}
                     className="bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-[#B026FF]/50"
                   >
                     <option value="Русский">Русский (Ru)</option>
                     <option value="English">English (En)</option>
                     <option value="Հայերեն">Հայերեն (Am)</option>
                   </select>
                 </div>
                 
                 <div className="flex flex-col gap-1.5">
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Длительность фильма</span>
                   <select 
                     value={state.magicDuration} 
                     onChange={e => setState(s => ({ ...s, magicDuration: Number(e.target.value) }))}
                     className="bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-[#B026FF]/50"
                   >
                     <option value={15}>15 Секунд</option>
                     <option value={30}>30 Секунд</option>
                     <option value={60}>1 Минута</option>
                     <option value={120}>2 Минуты</option>
                   </select>
                 </div>

                 <div className="flex flex-col gap-1.5">
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Длина кадра (Сек.)</span>
                   <select 
                     value={state.magicClipDuration} 
                     onChange={e => setState(s => ({ ...s, magicClipDuration: e.target.value }))}
                     className="bg-black/60 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-[#B026FF]/50"
                   >
                     <option value="3">3 Секунды</option>
                     <option value="5">5 Секунд</option>
                     <option value="8">8 Секунд</option>
                   </select>
                 </div>
                 
                 <div className="flex flex-col gap-1.5 justify-end">
                   <label className="flex items-center gap-2 cursor-pointer group bg-black/60 border border-slate-700 rounded-lg p-2">
                     <input 
                       type="checkbox" 
                       checked={state.magicGenerateCharacters} 
                       onChange={e => setState(s => ({ ...s, magicGenerateCharacters: e.target.checked }))}
                       className="accent-[#B026FF] w-4 h-4"
                     />
                     <span className="text-[11px] text-slate-300 font-medium group-hover:text-white transition-colors">Создать персонажей</span>
                   </label>
                 </div>
               </div>
               
               <button 
                 onClick={runMagicPipeline}
                 disabled={(!state.ideaText && !state.uploadedAudioFile) || state.isMagicRunning}
                 className="w-full flex justify-center items-center gap-2 mt-2 py-3 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold text-sm shadow-[0_0_20px_rgba(176,38,255,0.4)] hover:shadow-[0_0_30px_rgba(176,38,255,0.6)] hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
               >
                 <Sparkles className="w-4 h-4" /> Запустить Магический Конвейер!
               </button>
            </div>
          </div>


          {/* 1. ИСТОЧНИКИ ИДЕИ */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 1. Источники Идеи
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Аудио Upload */}
              <div 
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3 transition-colors ${
                  state.uploadedAudioFile 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-slate-700 bg-black/40 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/5'
                }`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleAudioDrop}
              >
                <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleAudioSelect} className="hidden" />
                
                {state.uploadedAudioFile ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <FileAudio className="w-8 h-8 text-emerald-400 mb-1" />
                    <span className="text-xs font-semibold text-emerald-300 truncate w-full px-4">{state.uploadedAudioFile.name}</span>
                    <div className="flex gap-2 mt-2 flex-wrap justify-center">
                      <button 
                        onClick={analyzeAudio} 
                        disabled={isAiLoading['Анализ аудио']}
                        className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 text-[10px] uppercase font-bold text-emerald-300 transition-colors flex items-center gap-1"
                      >
                        {isAiLoading['Анализ аудио'] ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                        Генерировать идею
                      </button>
                      <button onClick={openAudioUpload} className="px-3 py-1.5 rounded bg-black/40 hover:bg-black/60 border border-slate-600 text-[10px] uppercase font-bold text-slate-300">Заменить</button>
                      <button onClick={removeAudioFile} className="px-3 py-1.5 rounded bg-black/40 hover:bg-black/60 border border-red-500/30 text-[10px] uppercase font-bold text-red-400">Удалить</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-500 mb-1" />
                    <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">Drag & Drop аудиофайла</span>
                    <span className="text-[10px] text-slate-500">MP3 / WAV</span>
                    <button onClick={openAudioUpload} className="mt-2 px-4 py-2 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/25 hover:border-[#00F0FF]/60 text-[11px] uppercase font-bold tracking-widest transition-all">
                      Выбрать аудиофайл
                    </button>
                  </>
                )}
                {state.validationErrors.audio && <p className="text-[10px] text-red-400">{state.validationErrors.audio}</p>}
              </div>

              {/* Текстовый реактор */}
              <div className="flex flex-col gap-2 h-full">
                <textarea 
                  value={state.ideaText}
                  onChange={e => updateIdeaText(e.target.value)}
                  placeholder="Опишите идею, атмосферу, сюжет, сцену или референсы вручную..."
                  className="w-full flex-1 bg-black/40 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-[#00F0FF]/50 transition-colors placeholder:text-slate-600 resize-none min-h-[140px] custom-scrollbar focus:shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                />
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-slate-500">{state.ideaText.length} символов</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ПАРАМЕТРЫ ИДЕИ */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 2. Параметры Идеи
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <MultiSelectorBlock title="Жанр" options={GENRES} selected={state.selectedGenres} onSelect={v => selectMultiParam('selectedGenres', v)} />
              <MultiSelectorBlock title="Настроение" options={MOODS} selected={state.selectedMoods} onSelect={v => selectMultiParam('selectedMoods', v)} />
              <SelectorBlock title="Эпоха" options={ERAS} selected={state.selectedEra} onSelect={v => selectParam('selectedEra', v)} />
            </div>
          </div>

          {/* 3. ИИ-УЛУЧШЕНИЯ */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> 3. ИИ-Улучшения (по требованию)
            </h2>
            <div className="flex flex-wrap gap-2">
              <AiActionButton icon={<Wand2 />} label="Улучшить идею" onClick={improveIdea} isLoading={isAiLoading['Улучшить идею']} disabled={!state.ideaText} />
              <AiActionButton icon={<Film />} label="Сделать кинематографичнее" onClick={makeIdeaCinematic} isLoading={isAiLoading['Сделать кинематографичнее']} disabled={!state.ideaText} />
              <AiActionButton icon={<Plus />} label="Развернуть в концепт" onClick={expandIdeaToConcept} isLoading={isAiLoading['Развернуть в концепт']} disabled={!state.ideaText} />
              <AiActionButton icon={<RefreshCcw />} label="Предложить 5 похожих идей" onClick={generateSimilarIdeas} isLoading={isAiLoading['Предложить 5 похожих идей']} disabled={!state.ideaText} />
            </div>
          </div>

          {/* 4. ЧЕРНОВИКИ */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-[#00F0FF] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]"></span> 4. Черновики Сценария
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DraftField 
                title="Логлайн (1 фраза)" 
                value={state.generatedLogline} 
                onChange={v => setState(s => ({ ...s, generatedLogline: v}))}
                onGenerate={generateLogline}
                isLoading={isAiLoading['Создать логлайн']}
                generateLabel="Создать логлайн"
              />
              <DraftField 
                title="Синопсис (3 абзаца)" 
                value={state.generatedSynopsis} 
                onChange={v => setState(s => ({ ...s, generatedSynopsis: v}))}
                onGenerate={generateSynopsis}
                isLoading={isAiLoading['Создать синопсис']}
                generateLabel="Создать синопсис"
                multiline
              />
            </div>
            
            <div className="bg-black/40 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Диалог между героями</span>
                <div className="flex items-center gap-2">
                  <select 
                    value={state.selectedDialogueMood} 
                    onChange={e => setState(s => ({ ...s, selectedDialogueMood: e.target.value }))}
                    className="bg-black/60 border border-slate-700 rounded p-1 text-[10px] text-white outline-none focus:border-[#00F0FF]/50"
                  >
                    {["Напряженный", "Смешной", "Драматичный", "Обыденный", "Романтичный", "Конфликтный"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <button 
                    onClick={generateDialogue}
                    disabled={isAiLoading['Создать диалог']}
                    className="px-2 py-1 rounded bg-black/60 border border-slate-600 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] text-[9px] uppercase font-bold text-slate-400 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {isAiLoading['Создать диалог'] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Сгенерировать
                  </button>
                </div>
              </div>
              <textarea 
                value={state.generatedDialogue}
                onChange={e => setState(s => ({ ...s, generatedDialogue: e.target.value }))}
                placeholder="Сгенерируйте диалог..."
                className="w-full bg-transparent border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-slate-500 resize-none h-32 custom-scrollbar"
              />
            </div>
            
            <div className="bg-black/40 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Визуальный Мудборд</span>
                <button 
                  onClick={generateMoodboard}
                  disabled={isAiLoading['Создать мудборд'] || !state.ideaText}
                  className="px-3 py-1.5 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/25 text-[10px] uppercase font-bold tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAiLoading['Создать мудборд'] ? <Loader2 className="w-3 h-3 animate-spin"/> : <Layout className="w-3 h-3"/>}
                  Создать мудборд
                </button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px] items-start">
                {state.generatedMoodboard.length > 0 ? state.generatedMoodboard.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-600 text-xs text-slate-300">{tag}</span>
                )) : (
                  <span className="text-xs text-slate-600 italic">Мудборд пока не сгенерирован...</span>
                )}
              </div>
            </div>
          </div>

          {/* 5. ФИНАЛЬНЫЙ ПРОМПТ */}
          <div className="flex flex-col gap-4 mt-4 pt-6 border-t border-[var(--color-space-800)] relative">
            <h2 className="text-base font-bold text-white uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                 <Terminal className="w-5 h-5 text-[#B026FF]" /> 5. Финальный Промпт
              </span>
            </h2>
            
            <div className="bg-black/60 border border-[#B026FF]/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(176,38,255,0.1)]">
              <div className="p-2 border-b border-slate-800 bg-black/40 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    onClick={buildFinalPrompt}
                    className="px-3 py-1.5 md:py-2 md:px-4 rounded-lg bg-gradient-to-r from-[#B026FF]/20 to-[#00F0FF]/20 text-white border border-[#00F0FF]/40 hover:bg-[#00F0FF]/20 text-[10px] md:text-xs uppercase font-bold tracking-widest transition-all flex items-center gap-1.5"
                  >
                    <Layout className="w-3.5 h-3.5"/> Собрать из элементов
                  </button>
                  <button 
                    onClick={improveFinalPrompt}
                    disabled={!state.finalPrompt || isAiLoading['Улучшить финальный промпт']}
                    className="px-3 py-1.5 md:py-2 md:px-4 rounded-lg bg-black/50 text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 text-[10px] md:text-xs uppercase font-bold tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isAiLoading['Улучшить финальный промпт'] ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>} 
                    Улучшить промпт (AI)
                  </button>
                </div>
                <button 
                  onClick={copyFinalPrompt}
                  className="px-3 py-1.5 rounded-lg bg-black/50 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500 text-[10px] uppercase font-bold transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5"/> Скопировать
                </button>
              </div>
              <textarea 
                value={state.finalPrompt}
                onChange={e => setState(s => ({ ...s, finalPrompt: e.target.value }))}
                placeholder="Соберите промпт чтобы увидеть результат или введите его вручную..."
                className="w-full bg-transparent p-4 text-sm font-mono text-slate-300 outline-none resize-none min-h-[200px] custom-scrollbar focus:bg-white/[0.02] transition-colors leading-relaxed"
              />
            </div>
            
            {/* Actions for next steps */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-wrap gap-3 mt-2 justify-end">
                <button onClick={handleSaveLocally} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-space-800)] border border-slate-600 text-sm font-bold text-slate-200 hover:bg-slate-700 transition-colors">
                  <Save className="w-4 h-4" /> Сохранить локально
                </button>
                <button 
                  onClick={sendToCharactersModule}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/55 hover:bg-[#00F0FF]/25 text-sm font-bold text-[#00F0FF] hover:text-white transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                >
                  <Sparkles className="w-4 h-4" /> Передать в Персонажи
                </button>
                <button 
                  onClick={onApprove}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B026FF] to-[#00F0FF] text-white font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:scale-[1.02] transition-all"
                >
                  Передать дальше <Forward className="w-4 h-4" />
                </button>
              </div>
              {state.validationErrors.sendError && (
                <p className="text-red-400 font-semibold text-xs text-right mt-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                  {state.validationErrors.sendError}
                </p>
              )}
            </div>
          </div>
          
        </div>
      </div>

        {/* ПРАВАЯ ЧАСТЬ: ИИ-Помощник (Вторичная панель) */}
        <div className="w-full lg:sticky lg:top-4 bg-black/20 border border-[var(--color-space-800)] rounded-xl flex flex-col max-h-[calc(100vh-32px)] overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-[var(--color-space-800)] bg-black/40 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[#B026FF]" />
          <h3 className="font-bold text-sm text-white uppercase tracking-widest">ИИ-Помощник</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar flex flex-col gap-6">
          
          <div className="space-y-3">
            <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-800 pb-1">Текущий Контекст</h4>
            <div className="text-xs text-slate-300 space-y-2 font-medium">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-500 uppercase">Медиа:</span>
                <span className="truncate">{state.uploadedAudioFile ? state.uploadedAudioFile.name : '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-500 uppercase">Жанр / Настроение / Эпоха:</span>
                <span>{[...state.selectedGenres, ...state.selectedMoods, state.selectedEra].filter(Boolean).join(', ') || '—'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-500 uppercase">Логлайн:</span>
                <span className="truncate">{state.generatedLogline || '—'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 flex-1 flex flex-col pt-4 sm:pt-0">
            <h4 className="text-[10px] text-[#00F0FF] uppercase font-bold tracking-widest border-b border-slate-800 pb-1 drop-shadow-[0_0_5px_rgba(0,240,255,0.4)]">Предложения (AI)</h4>
            <div className="flex flex-col gap-3 flex-1">
              <AnimatePresence>
                {state.aiSuggestions.length > 0 ? state.aiSuggestions.map((sug) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={sug.id}
                    className="flex flex-col text-xs bg-black/60 border border-[#00F0FF]/30 text-slate-300 p-3 rounded-lg flex-col gap-2 shadow-[0_0_15px_rgba(0,240,255,0.05)]"
                  >
                    <span className="font-bold text-[#00F0FF] text-[10px] uppercase block mb-1">{sug.title}</span>
                    <p className="line-clamp-4 leading-relaxed opacity-90">{sug.content}</p>
                    
                    <div className="flex flex-wrap gap-1.5 mt-2">
                       <button onClick={() => applySuggestion(sug.id, 'replace')} className="px-2 py-1 rounded bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/25 text-[9px] uppercase font-bold tracking-wider">
                         Заменить
                       </button>
                       <button onClick={() => applySuggestion(sug.id, 'append')} className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[9px] uppercase font-bold tracking-wider">
                         Добавить
                       </button>
                       <button onClick={() => dismissSuggestion(sug.id)} className="px-2 py-1 rounded hover:bg-red-500/10 text-red-400 text-[9px] uppercase font-bold tracking-wider ml-auto">
                         Сбросить
                       </button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-[10px] text-slate-500 italic text-center p-4 border border-dashed border-slate-800 rounded-lg">
                    Пока нет предложений. Нажмите любую кнопку улучшений.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
        
        <div className="p-3 border-t border-[var(--color-space-800)] bg-black/40">
           <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> Свободный запрос к ИИ
           </button>
        </div>
      </div>
    </div>
    </div>
  );
}

// Subcomponents
function SelectorBlock({ title, options, selected, onSelect }: { title: string, options: string[], selected: string | null, onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
              selected === opt 
               ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
               : 'bg-black/30 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelectorBlock({ title, options, selected, onSelect }: { title: string, options: string[], selected: string[], onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
              selected.includes(opt) 
               ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
               : 'bg-black/30 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function AiActionButton({ icon, label, onClick, isLoading, disabled }: { icon: React.ReactNode, label: string, onClick: () => void, isLoading?: boolean, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={isLoading || disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-lg bg-black/40 border border-slate-600 hover:border-amber-400/50 hover:bg-amber-400/10 text-slate-300 hover:text-amber-400 text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}
      {label}
    </button>
  );
}

function DraftField({ title, value, onChange, onGenerate, isLoading, generateLabel, multiline=false }: any) {
  return (
    <div className="bg-black/40 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <button 
          onClick={onGenerate}
          disabled={isLoading}
          className="px-2 py-1 rounded bg-black/60 border border-slate-600 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] text-[9px] uppercase font-bold text-slate-400 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} {generateLabel}
        </button>
      </div>
      {multiline ? (
        <textarea 
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Сгенерируйте или напишите текст..."
          className="w-full bg-transparent border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-slate-500 resize-none h-24 custom-scrollbar"
        />
      ) : (
        <input 
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Сгенерируйте или напишите текст..."
          className="w-full bg-transparent border border-slate-800 rounded p-2 text-xs text-slate-300 outline-none focus:border-slate-500"
        />
      )}
    </div>
  )
}
