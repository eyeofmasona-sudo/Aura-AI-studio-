import React, { useState, useEffect } from 'react';
import { 
  Upload, User, X, Sparkles, Wand2, Copy, 
  Save, Forward, Loader2, MessageSquare, Edit3,
  RefreshCcw, AlertCircle, CheckCircle2, ChevronRight, Menu, Plus, Trash2, GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AiStore } from '../../services/aiStore';

interface Chapter {
  id: string;
  title: string;
  summary: string;
  emotionalGoal: string;
  plotFunction: string;
}

interface Scene {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  location: string;
  characters: string;
  conflict: string;
  action: string;
  dialogueNotes: string;
  emotionalBeat: string;
  visualNotes: string;
  audioNotes: string;
}

interface DialogueLine {
  id: string;
  sceneId: string;
  character: string;
  text: string;
  emotion: string;
  pauses: string;
  intonation: string;
}

interface ScenarioState {
  importedIdeaPrompt: string | null;
  importedCharacters: any[];
  scriptDraft: string;
  selectedStructure: string | null;
  selectedDuration: string | null;
  selectedFormat: string | null;
  chapters: Chapter[];
  selectedChapterId: string | null;
  scenes: Scene[];
  selectedSceneId: string | null;
  dialogueLines: DialogueLine[];
  finalScript: string;
  aiSuggestions: { id: string; title: string; text: string; type: string }[];
  validationErrors: Record<string, string>;
  isGenerating: boolean;
}

interface ScenarioModuleProps {
  key?: string | number;
  onApprove: () => void;
  isApproved?: boolean;
}

export function ScenarioModule({ onApprove, isApproved }: ScenarioModuleProps) {
  const [state, setState] = useState<ScenarioState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("aura_scenario_state");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse aura_scenario_state", e);
        }
      }
    }
    return {
      importedIdeaPrompt: null,
      importedCharacters: [],
      scriptDraft: "",
      selectedStructure: null,
      selectedDuration: null,
      selectedFormat: null,
      chapters: [],
      selectedChapterId: null,
      scenes: [],
      selectedSceneId: null,
      dialogueLines: [],
      finalScript: "",
      aiSuggestions: [],
      validationErrors: {},
      isGenerating: false
    };
  });

  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-save state to localStorage on state changes
  useEffect(() => {
    localStorage.setItem("aura_scenario_state", JSON.stringify(state));
  }, [state]);

  // Handle toast timeout
  useEffect(() => {
    if (localToast) {
      const timer = setTimeout(() => setLocalToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [localToast]);

  const [activeTab, setActiveTab] = useState<'draft' | 'chapters' | 'scenes' | 'dialogues' | 'final'>('draft');
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);

  const STRUCTURES = [
    "3 акта", "5 актов", "Hero’s Journey", "Save the Cat", 
    "Короткий рекламный сценарий", "Клип/монтажная структура", 
    "Документальная структура", "Эпизодическая структура"
  ];
  
  const DURATIONS = [
    "15 секунд", "30 секунд", "60 секунд", "90 секунд", 
    "3 минуты", "5 минут", "Custom"
  ];

  const FORMATS = [
    "Вертикальное видео", "Горизонтальное видео", "Рекламный ролик", 
    "Трейлер", "Короткометражная сцена", "Музыкальный клип", "Презентационный ролик"
  ];

  const updateField = (field: keyof ScenarioState, value: any) => {
    setState(s => ({ ...s, [field]: value }));
  };

  const addSuggestion = (title: string, text: string, type: string) => {
    const newSug = { id: Math.random().toString(36).substr(2, 9), title, text, type };
    setState(s => ({ ...s, aiSuggestions: [...s.aiSuggestions, newSug] }));
  };

  const runAiAction = async (
    title: string, 
    promptText: string, 
    callback: (res: string) => void, 
    customInstruction?: string,
    functionName: string = "splitIdeaIntoChapters"
  ) => {
    setState(s => ({ ...s, isGenerating: true }));
    try {
      const result = await AiStore.getInstance().requestExecution({
        module: "scenario",
        functionName,
        inputs: [
          promptText,
          state.scriptDraft || "Нет черновика",
          state.importedIdeaPrompt || "Нет идеи"
        ].filter(Boolean),
        actionName: title,
        systemInstruction: customInstruction,
        bypassCache: true
      });
      callback(result);
    } catch (err: any) {
      console.error("AI execution error in scenario:", err);
      setLocalToast({ message: `ошибка ИИ: ${err.message || err}. Запущено автоматическое восстановление.`, type: "error" });
      callback(`[Резерв] Исполнение: ${promptText}`);
    } finally {
      setState(s => ({ ...s, isGenerating: false }));
    }
  };

  const importIdeaPrompt = () => {
    let contextStr = localStorage.getItem("aura_imported_idea_context");
    let parsed: any = null;

    if (!contextStr) {
      const nativeStr = localStorage.getItem("aura_idea_prompt_state");
      if (nativeStr) {
        try {
          const nativeParsed = JSON.parse(nativeStr);
          parsed = {
            ideaText: nativeParsed.ideaText,
            finalPrompt: nativeParsed.finalPrompt,
            logline: nativeParsed.generatedLogline,
            synopsis: nativeParsed.generatedSynopsis,
            selectedGenres: nativeParsed.selectedGenres,
            selectedMoods: nativeParsed.selectedMoods,
            selectedEra: nativeParsed.selectedEra,
            selectedVisualStyle: nativeParsed.selectedVisualStyle,
            selectedCameraStyle: nativeParsed.selectedCameraStyle
          };
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      try {
        parsed = JSON.parse(contextStr);
      } catch (e) {
        console.error(e);
      }
    }

    if (!parsed || (!parsed.ideaText && !parsed.finalPrompt && !parsed.logline && !parsed.synopsis)) {
      setLocalToast({ message: "Не обнаружено сохраненных идей или промптов. Сначала введите их на шаге «Идея»!", type: "error" });
      return;
    }

    const idea = parsed.ideaText || "";
    const prompt = parsed.finalPrompt || "";
    const logline = parsed.logline || parsed.generatedLogline || "";
    const synopsis = parsed.synopsis || parsed.generatedSynopsis || "";
    const genres = (parsed.selectedGenres || []).join(", ");
    const moods = (parsed.selectedMoods || []).join(", ");
    
    let importText = `📌 [ИМПОРТИРОВАННАЯ ИДЕЯ & ПРОМПТ]\n`;
    if (idea) importText += `• ИДЕЯ: ${idea}\n`;
    if (logline) importText += `• ЛОГЛАЙН: ${logline}\n`;
    if (synopsis) importText += `• СИНОПСИС: ${synopsis}\n`;
    if (genres) importText += `• ЖАНРЫ: ${genres}\n`;
    if (moods) importText += `• НАСТРОЕНИЕ: ${moods}\n`;
    if (parsed.selectedEra) importText += `• ЭПОХА: ${parsed.selectedEra}\n`;
    if (parsed.selectedVisualStyle) importText += `• ВИЗУАЛЬНЫЙ СТИЛЬ: ${parsed.selectedVisualStyle}\n`;
    if (prompt) importText += `• РЕЖИССЁРСКИЙ ПРОМПТ: ${prompt}\n`;

    setState(s => ({
      ...s,
      scriptDraft: (s.scriptDraft ? s.scriptDraft + "\n\n" : "") + importText.trim(),
      importedIdeaPrompt: idea || prompt || "Идея импортирована"
    }));
    setLocalToast({ message: "Контекст темы и идеи успешно импортирован!", type: "success" });
  };

  const importCharacters = () => {
    const saved = localStorage.getItem("aura_character_state");
    if (!saved) {
      setLocalToast({ message: "Персонажи не найдены. Создайте их во вкладке «Персонажи»!", type: "error" });
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const charList: any[] = parsed.characters || [];
      if (charList.length === 0) {
        setLocalToast({ message: "На шаге «Персонажи» нет созданных героев!", type: "error" });
        return;
      }

      let importText = `👥 [ИМПОРТИРОВАННЫЕ ПЕРСОНАЖИ]\n`;
      charList.forEach((c) => {
        importText += `• ${c.characterName} (${c.characterRole || "Без роли"}, ${c.characterAge || "Adulthood"} лет):\n`;
        if (c.characterDescription) importText += `  Биография & описание: ${c.characterDescription}\n`;
        if (c.appearanceDescription) importText += `  Внешние черты: ${c.appearanceDescription}\n`;
        if (c.outfitDescription) importText += `  Стиль одежды: ${c.outfitDescription}\n`;
        if (c.characterGoal) importText += `  Мечта и цели: ${c.characterGoal}\n`;
      });

      setState(s => ({
        ...s,
        scriptDraft: (s.scriptDraft ? s.scriptDraft + "\n\n" : "") + importText.trim(),
        importedCharacters: charList
      }));
      setLocalToast({ message: `Успешно импортирован профиль героев (${charList.length})!`, type: "success" });
    } catch (err) {
      console.error(err);
      setLocalToast({ message: "Произошла ошибка при разборе данных героев", type: "error" });
    }
  };

  const updateScriptDraft = (value: string) => updateField('scriptDraft', value);
  const selectStructure = (value: string) => updateField('selectedStructure', value);
  const selectDuration = (value: string) => updateField('selectedDuration', value);
  const selectFormat = (value: string) => updateField('selectedFormat', value);

  // Chapters
  const addChapter = () => {
    const newCh: Chapter = { id: Math.random().toString(), title: "Новая глава", summary: "", emotionalGoal: "", plotFunction: "" };
    setState(s => ({ ...s, chapters: [...s.chapters, newCh], selectedChapterId: newCh.id }));
    setActiveTab('chapters');
  };

  const updateChapter = (id: string, patch: Partial<Chapter>) => {
    setState(s => ({ ...s, chapters: s.chapters.map(c => c.id === id ? { ...c, ...patch } : c) }));
  };

  const deleteChapter = (id: string) => {
    setState(s => ({ ...s, chapters: s.chapters.filter(c => c.id !== id), selectedChapterId: s.selectedChapterId === id ? null : s.selectedChapterId }));
  };

  const reorderChapters = (sourceIndex: number, targetIndex: number) => {
    setState(s => {
      const newCh = [...s.chapters];
      const [removed] = newCh.splice(sourceIndex, 1);
      newCh.splice(targetIndex, 0, removed);
      return { ...s, chapters: newCh };
    });
  };

  const [draggedChapterIndex, setDraggedChapterIndex] = useState<number | null>(null);

  // Scenes
  const addScene = (chapterId: string | null) => {
    const newSc: Scene = { 
      id: Math.random().toString(), chapterId: chapterId || '', title: "Новая сцена", 
      description: "", location: "", characters: "", conflict: "", action: "", 
      dialogueNotes: "", emotionalBeat: "", visualNotes: "", audioNotes: "" 
    };
    setState(s => ({ ...s, scenes: [...s.scenes, newSc], selectedSceneId: newSc.id }));
    setActiveTab('scenes');
  };

  const updateScene = (id: string, patch: Partial<Scene>) => {
    setState(s => ({ ...s, scenes: s.scenes.map(sc => sc.id === id ? { ...sc, ...patch } : sc) }));
  };

  const deleteScene = (id: string) => {
    setState(s => ({ ...s, scenes: s.scenes.filter(sc => sc.id !== id), selectedSceneId: s.selectedSceneId === id ? null : s.selectedSceneId }));
  };

  // Dialogues
  const addDialogueLine = (sceneId: string | null) => {
    const newDl: DialogueLine = { id: Math.random().toString(), sceneId: sceneId || '', character: "", text: "", emotion: "", pauses: "", intonation: "" };
    setState(s => ({ ...s, dialogueLines: [...s.dialogueLines, newDl] }));
    setActiveTab('dialogues');
  };

  const updateDialogueLine = (id: string, patch: Partial<DialogueLine>) => {
    setState(s => ({ ...s, dialogueLines: s.dialogueLines.map(dl => dl.id === id ? { ...dl, ...patch } : dl) }));
  };

  const deleteDialogueLine = (id: string) => {
    setState(s => ({ ...s, dialogueLines: s.dialogueLines.filter(dl => dl.id !== id) }));
  };

  // AI Helpers
  const getTimingConstraint = (duration: string | null) => {
    if (!duration) {
      return {
        totalSeconds: 30,
        estimatedBlocks: 4,
        text: "Длительность по умолчанию: 30 секунд. Раздели сюжет ровно на 4 видео-кадра/сцены делением по ~7-8 секунд каждый для генератора Veo (так как один ролик Veo длится ровно 8 секунд)."
      };
    }
    
    // Parse duration strings to estimated 8-second video segments
    if (duration.includes("15")) {
      return {
        totalSeconds: 15,
        estimatedBlocks: 2,
        text: "Длительность: ровно 15 секунд. Раздели сюжет ровно на 2 видео-кадра/сцены по ~7-8 секунд каждый для генератора Veo (так как одно видео Veo генерирует ровно 8 секунд). Хронометраж структуры не должен превышать 15 секунд!"
      };
    }
    if (duration.includes("30")) {
      return {
        totalSeconds: 30,
        estimatedBlocks: 4,
        text: "Длительность: ровно 30 секунд. Раздели сюжет ровно на 4 видео-кадра/сцены по ~7-8 секунд каждый для генератора Veo (так как одно видео Veo генерирует ровно 8 секунд). Хронометраж структуры не должен превышать 30 секунд!"
      };
    }
    if (duration.includes("60")) {
      return {
        totalSeconds: 60,
        estimatedBlocks: 8,
        text: "Длительность: ровно 60 секунд. Раздели сюжет ровно на 8 видео-кадров/сцен по ~7-8 секунд каждый для генератора Veo (так как одно видео Veo генерирует ровно 8 секунд). Хронометраж структуры не должен превышать 60 секунд!"
      };
    }
    if (duration.includes("90")) {
      return {
        totalSeconds: 90,
        estimatedBlocks: 11,
        text: "Длительность: ровно 90 секунд. Раздели сюжет ровно на 11 видео-кадров/сцен по ~8 секунд каждый для генератора Veo. Хронометраж структуры не должен превышать 90 секунд!"
      };
    }
    if (duration.includes("3 мин")) {
      return {
        totalSeconds: 180,
        estimatedBlocks: 22,
        text: "Длительность: ровно 180 секунд (3 минуты). Раздели сюжет ровно на 22 видео-кадра/сцены по ~8 секунд каждый для генератора Veo. Хронометраж структуры не должен превышать 180 секунд!"
      };
    }
    if (duration.includes("5 мин")) {
      return {
        totalSeconds: 300,
        estimatedBlocks: 37,
        text: "Длительность: ровно 300 секунд (5 минут). Раздели сюжет ровно на 37 видео-кадров/сцен по ~8 секунд каждый для генератора Veo."
      };
    }
    
    return {
      totalSeconds: 30,
      estimatedBlocks: 4,
      text: `Выбранная длительность: ${duration}. Раздели сюжет на видео-фрагменты по ~8 секунд каждый (так как одно видео Veo генерирует ровно 8 секунд).`
    };
  };

  const generateRobustFallbackChapters = (draft: string): Chapter[] => {
    // Try to split drafted ideas into sentences or paragraphs for rich realistic segments
    const lines = draft.split('\n')
      .map(line => line.replace(/^[•📌\-*\d.\s]+/, '').trim())
      .filter(line => line.length > 5 && !line.includes('ИМПОРТИРОВАННАЯ') && !line.includes('👥'));

    let parts = lines;
    if (parts.length < 2) {
      parts = draft.split(/[.!?]\s+/)
        .map(p => p.trim())
        .filter(p => p.length > 10 && !p.includes('📌') && !p.includes('👥'));
    }

    if (parts.length === 0) {
      parts = [
        "Введение в завязку и экспозиция ключевой идеи фильма.",
        "Развитие конфликта, первые трудности и вовлечение главных героев.",
        "Нарастание интриги, новые вызовы и подготовка к драматическому повороту.",
        "Кульминационное противостояние событий, раскрытие тайн.",
        "Развязка, финальные выводы и эмоциональное завершение сюжета."
      ];
    }

    const durationObj = getTimingConstraint(state.selectedDuration);
    // Suggest optimal chapter count based on block count
    const chaptersCount = durationObj.estimatedBlocks <= 2 ? 2 : durationObj.estimatedBlocks <= 4 ? 3 : Math.min(5, Math.max(3, parts.length));
    
    const result: Chapter[] = [];
    const plotFunctions = ["экспозиция", "завязка", "развитие", "кульминация", "развязка"];
    const emotionalGoals = ["Любопытство", "Напряжение", "Опасение", "Интрига", "Катарсис"];

    for (let i = 0; i < chaptersCount; i++) {
      const textPart = parts[Math.min(i, parts.length - 1)];
      const titleText = textPart.split(/[,:;.]/)[0].substring(0, 35).trim();
      result.push({
        id: "ch_" + Math.random().toString(36).substring(7),
        title: `Глава ${i + 1}: ${titleText || "Развитие истории"}`,
        summary: textPart,
        emotionalGoal: emotionalGoals[i] || "Эмпатия",
        plotFunction: plotFunctions[Math.min(i, plotFunctions.length - 1)]
      });
    }
    return result;
  };

  const generateChaptersFromIdea = () => {
    const draftText = state.scriptDraft || state.importedIdeaPrompt || "No idea draft provided";
    setIsGeneratingChapters(true);
    const durationObj = getTimingConstraint(state.selectedDuration);
    
    // Suggest optimal chapter count based on block count
    const targetChaptersCount = durationObj.estimatedBlocks <= 2 ? 2 : durationObj.estimatedBlocks <= 4 ? 3 : 4;

    const customPrompt = `Разбей данную идею или сценарий на ${targetChaptersCount} главы в формате JSON.
Требование по хронометражу всего проекта: ${durationObj.text}
Пожалуйста, учти, что весь сценарий длится ровно ${durationObj.totalSeconds} секунд и будет состоять из ${durationObj.estimatedBlocks} сцен/кадров по ~8 секунд каждый.
Распредели эти 8-секундные сцены пропорционально между этими ${targetChaptersCount} главами.
Текст идеи:\n${draftText}`;
    
    const sysInstruction = `You are a professional Creative Story Producer inside Aura AI Studio.
Given the movie or video concept and its total duration of ${durationObj.totalSeconds} seconds, divide it logically into exactly ${targetChaptersCount} sequential chapters that form a complete narrative arc.
You must return ONLY a raw valid JSON array of objects representing chapters. Do NOT wrap in markdown code blocks (\`\`\`json or \`\`\`), do NOT output any conversational text, greetings, or explanations.

Each object in the JSON array must contain exactly these keys:
- "title": string (the chapter title in Russian, e.g., "Глава 1: Пробуждение зверя")
- "summary": string (a concise outline summary of what happens in Russian)
- "emotionalGoal": string (emotional color or key feeling of this chapter in Russian, e.g. "Любопытство", "Напряжение")
- "plotFunction": string (its role in the plot in Russian, e.g. "экспозиция", "завязка", "развитие", "кульминация", "развязка")

Example output to follow precisely:
[
  {
    "title": "Глава 1: Пример",
    "summary": "Пример описания событий в рамках главы...",
    "emotionalGoal": "Любопытство",
    "plotFunction": "экспозиция"
  }
]`;

    runAiAction('Разбить идею на главы', customPrompt, (res) => {
      try {
        let clean = res.trim();
        // Extract array if embedded in conversational text or markdown code fences
        const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          clean = match[0];
        } else {
          clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        }

        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted: Chapter[] = parsed.map((c, i) => ({
            id: "ch_" + Math.random().toString(36).substring(7),
            title: c.title || `Глава ${i + 1}`,
            summary: c.summary || "Без описания",
            emotionalGoal: c.emotionalGoal || "Вовлечение",
            plotFunction: c.plotFunction || "развитие"
          }));
          setState(s => ({ ...s, chapters: formatted, selectedChapterId: formatted[0].id }));
          setLocalToast({ message: `Успешно разбито ИИ: сгенерировано ${formatted.length} глав!`, type: "success" });
          setActiveTab('chapters');
          return;
        }
        throw new Error("Invalid format");
      } catch (err) {
        console.warn("Could not parse JSON chapters, using robust offline fallback parser:", err, res);
        const fallbackChapters = generateRobustFallbackChapters(draftText);
        setState(s => ({ ...s, chapters: fallbackChapters, selectedChapterId: fallbackChapters[0].id }));
        setLocalToast({ message: `Созданы структурированные главы на основе анализа текста!`, type: "success" });
        setActiveTab('chapters');
      } finally {
        setIsGeneratingChapters(false);
        // Automatically scroll down to the Chapters section so the user sees them instantly
        setTimeout(() => {
          document.getElementById('section-chapters')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }, sysInstruction, "splitIdeaIntoChapters");
  };

  const generateScriptStructure = () => {
    const draftText = state.scriptDraft || state.importedIdeaPrompt;
    if (!draftText) {
      setLocalToast({ message: "Введите сначала идею или черновик сценария в поле ввода или импортируйте её!", type: "error" });
      return;
    }

    setIsGeneratingStructure(true);
    const durationObj = getTimingConstraint(state.selectedDuration);

    const customPrompt = `На основе данного черновика/идеи проекта определи лучшую структуру повествования (одну из: "3 акта", "5 актов", "Hero’s Journey", "Save the Cat", "Короткий рекламный сценарий", "Клип/монтажная структура", "Документальная структура", "Эпизодическая структура").
Требование по хронометражу всего проекта: ${durationObj.text}
Пожалуйста, составь структуру так, чтобы общее время составляло ровно ${durationObj.totalSeconds} секунд, разделенное на ровно ${durationObj.estimatedBlocks} кадров/эпизодов по 8 секунд каждый (так как генератор Veo создает именно 8-секундные кусочки). Укажи таймкод каждого кадра (например, 0:00-0:08, 0:08-0:16 и т.д.).
Текст идеи/проекта:
${draftText}`;

    const sysInstruction = `You are a high-level Creative Story Consultant inside Aura AI Studio. Analyze the provided project draft/idea and its timing constraints.
First, choose the single best-fitting structure from this exact Russian list:
["3 акта", "5 актов", "Hero’s Journey", "Save the Cat", "Короткий рекламный сценарий", "Клип/монтажная структура", "Документальная структура", "Эпизодическая структура"]

Crucial rule: Divide the story into EXACTLY ${durationObj.estimatedBlocks} sequential scenes/blocks of exactly 8 seconds each to fill the total budget of ${durationObj.totalSeconds} seconds (since Veo generates 8-second clips). Label each section with its precise video timestamp (e.g. 0:00-0:08, 0:08-0:16, 0:16-0:24, 0:24-0:30).

Your output must consist of TWO parts separated by a marker "---DELIMITER---":
Part 1: The exact structure name chosen from the list above. Do NOT include any punctuation, quotes, or markdown. Only the raw string.
Part 2: A beautiful step-by-step screenplay structure planning (in Russian) detailing how each section/act applies to this story. Keep it extremely structured and helpful, outlining exactly ${durationObj.estimatedBlocks} blocks of ~8 seconds each!

Example format for 30s duration:
Короткий рекламный сценарий
---DELIMITER---
### Пошаговая структура 30-секундного ролика (4 кадра по 8 секунд):
* **Кадр 1 (0:00 - 0:08):** Завязка сюжета...
* **Кадр 2 (0:08 - 0:16):** Развитие конфликта...
* **Кадр 3 (0:16 - 0:24):** Пик напряжения...
* **Кадр 4 (0:24 - 0:30):** Финал и пэкшот...`;

    runAiAction('Анализ структуры сценария', customPrompt, (res) => {
      try {
        const parts = res.split(/---DELIMITER---/i);
        let recommendedStr = "3 акта";
        let detailedPlan = res;

        if (parts.length >= 2) {
          recommendedStr = parts[0].trim().replace(/['"`]/g, "");
          detailedPlan = parts.slice(1).join("---DELIMITER---").trim();
        } else {
          // Fallback parsing: check if any of structures are named first
          const matched = STRUCTURES.find(st => res.toLowerCase().includes(st.toLowerCase()));
          if (matched) {
            recommendedStr = matched;
          }
        }

        // Clean recommendedStr to match exactly
        const exactMatch = STRUCTURES.find(st => st.toLowerCase() === recommendedStr.toLowerCase()) || STRUCTURES[0];
        
        // Apply to state
        setState(s => ({
          ...s,
          selectedStructure: exactMatch,
          aiSuggestions: [
            {
              id: "sug_" + Math.random().toString(36).substring(7),
              title: `Рекомендованный план (${exactMatch})`,
              text: detailedPlan,
              type: "concept"
            },
            ...s.aiSuggestions
          ]
        }));

        setLocalToast({ 
          message: `Рекомендована структура «${exactMatch}». Детальный план добавлен в ИИ-Помощник справа!`, 
          type: "success" 
        });

      } catch (err) {
        console.error("Failed to parse structure response:", err);
        setLocalToast({ message: "Структура определена, план предложен во вкладке ИИ-Помощника справа!", type: "success" });
        addSuggestion("Рекомендная структура", res, "concept");
      } finally {
        setIsGeneratingStructure(false);
      }
    }, sysInstruction, "createScenarioStructure");
  };

  const generateRobustFallbackScenes = (chapter: Chapter): Scene[] => {
    const summaries = chapter.summary.split(/[.!?]\s+/).filter(s => s.trim().length > 5);
    const result: Scene[] = [];
    
    const locations = [
      "ДОМ - ИНТЕРЬЕР - ДЕНЬ",
      "УЛИЦА ГОРОДА - ЭКСТЕРЬЕР - ВЕЧЕР",
      "СТУДИЯ - ИНТЕРЬЕР - НОЧЬ"
    ];

    const durationObj = getTimingConstraint(state.selectedDuration);
    const chapterIndex = state.chapters.findIndex(c => c.id === chapter.id);
    const totalChapters = state.chapters.length || 1;
    const baseScenesCount = Math.floor(durationObj.estimatedBlocks / totalChapters);
    const remainder = durationObj.estimatedBlocks % totalChapters;
    const targetScenes = baseScenesCount + (chapterIndex >= 0 && chapterIndex < remainder ? 1 : 0);
    const finalScenesLimit = Math.max(1, targetScenes);

    for (let i = 0; i < finalScenesLimit; i++) {
      const text = summaries[Math.min(i, summaries.length - 1)] || "Развитие ключевых событий в рамках сцены и раскрытие конфликта.";
      const cleanTitle = text.split(/[,:;.]/)[0].substring(0, 30).trim();
      result.push({
        id: "sc_" + Math.random().toString(36).substring(7),
        chapterId: chapter.id,
        title: `Сцена ${i + 1}: ${cleanTitle || "Драматический эпизод"}`,
        description: text,
        location: locations[i % locations.length],
        characters: "Главные герои",
        conflict: "Драматическое противостояние целей",
        action: text,
        dialogueNotes: "Обсуждение дальнейшего плана действий",
        emotionalBeat: "напряжение",
        visualNotes: "Контрастный свет, крупные планы глаз главных героев",
        audioNotes: "Усиливающийся фоновый гул, редкие ноты струнных инструментов"
      });
    }
    return result;
  };

  const generateScenesFromChapters = () => {
    const selectedCh = state.chapters.find(c => c.id === state.selectedChapterId);
    if (!selectedCh) {
      setLocalToast({ message: "Сначала выберите главу из списка слева, чтобы наполнить её сценами!", type: "error" });
      return;
    }

    setIsGeneratingScenes(true);
    const durationObj = getTimingConstraint(state.selectedDuration);

    const chapterIndex = state.chapters.indexOf(selectedCh);
    const totalChapters = state.chapters.length || 1;
    const baseScenesCount = Math.floor(durationObj.estimatedBlocks / totalChapters);
    const remainder = durationObj.estimatedBlocks % totalChapters;
    const targetScenesForThisChapter = baseScenesCount + (chapterIndex < remainder ? 1 : 0);
    const finalScenesLimit = Math.max(1, targetScenesForThisChapter);

    const customPrompt = `Сгенерируй последовательные драматические сцены для главы "${selectedCh.title}".
Описание главы: ${selectedCh.summary}. 
Требование по хронометражу всего проекта: ${durationObj.text}
Хронометраж конкретно этой главы должен состоять ровно из ${finalScenesLimit} сцен/кадров (каждая сцена - ровно один 8-секундный видеоролик для генератора Veo).
Общее количество сцен во всех главах должно составить ровно ${durationObj.estimatedBlocks} сцен.
Идея всего проекта: ${state.scriptDraft || "не указана"}`;
    
    const sysInstruction = `You are an expert Cinema Scriptwriter. Given a chapter summary and details, break it down logically into EXACTLY ${finalScenesLimit} sequential dramatic scenes/shots.
CRITICAL DIRECTIVE: Every scene represents exactly ONE 8-second video clip generator slot. You must output exactly ${finalScenesLimit} distinct scenes. Each scene should specify what happens during its 8-second window.

You must return ONLY a raw valid JSON array of objects representing scenes. Do NOT wrap in markdown code blocks (\`\`\`json or \`\`\`), do NOT output any conversational text, greetings, or explanations.

Each object in the JSON array must contain exactly these keys:
- "title": string (the scene title in Russian, e.g., "Сцена 1: Неожиданная весть")
- "description": string (detailed scene description setting the dramatic mood in Russian, perfect for generating an 8-second video)
- "location": string (location identifier, e.g., "БАР 'СИНИЙ ТУМАН' - ИНТЕРЬЕР - НОЧЬ")
- "characters": string (comma-separated list of characters present in Russian)
- "conflict": string (tension catalyst or subtext of conflict in Russian)
- "action": string (the action taking place in English or Russian)
- "dialogueNotes": string (short draft description or key dialogue cues in Russian)
- "emotionalBeat": string (emotional change/development in Russian, e.g. "отчаяние, надежда")
- "visualNotes": string (direction and camera hints, e.g., "сверхкрупный план рук, холодные тона")
- "audioNotes": string (key sound effects or music cues, e.g., "гул системника, редкие ноты пианино")

Example output schema to follow exactly:
[
  {
    "title": "Сцена 1: Пример",
    "description": "Пример описания...",
    "location": "ИНТ. КОРАБЛЬ",
    "characters": "Иван, Анна",
    "conflict": "Ограниченность времени",
    "action": "Иван пытается восстановить работу шлюза...",
    "dialogueNotes": "Анна просит уходить один, Иван отказывается",
    "emotionalBeat": "напряжение",
    "visualNotes": "Красная мигалка",
    "audioNotes": "Сирена тревоги"
  }
]`;

    runAiAction(`Разбить главу «${selectedCh.title}» на сцены`, customPrompt, (res) => {
      try {
        let clean = res.trim();
        // Extract array if embedded in conversational text or markdown code fences
        const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          clean = match[0];
        } else {
          clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        }

        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted: Scene[] = parsed.map((sc, idx) => ({
            id: "sc_" + Math.random().toString(36).substring(7),
            chapterId: selectedCh.id,
            title: sc.title || `Сцена ${idx + 1}`,
            description: sc.description || "Описание сцены",
            location: sc.location || "ИНТЕРЬЕР",
            characters: sc.characters || "Герои",
            conflict: sc.conflict || "Драматический узел",
            action: sc.action || "Основные действия",
            dialogueNotes: sc.dialogueNotes || "",
            emotionalBeat: sc.emotionalBeat || "напряжение",
            visualNotes: sc.visualNotes || "",
            audioNotes: sc.audioNotes || ""
          }));

          setState(s => {
            const preserved = s.scenes.filter(item => item.chapterId !== selectedCh.id);
            return {
              ...s,
              scenes: [...preserved, ...formatted],
              selectedSceneId: formatted[0].id
            };
          });
          setLocalToast({ message: `Успешно создано ${formatted.length} сцен ИИ для главы «${selectedCh.title}»!`, type: "success" });
          setActiveTab('scenes');
          return;
        }
        throw new Error("Invalid scenes array");
      } catch (err) {
        console.warn("Could not parse JSON scenes, using robust offline fallback parser:", err, res);
        const fallbackScenes = generateRobustFallbackScenes(selectedCh);
        setState(s => {
          const preserved = s.scenes.filter(item => item.chapterId !== selectedCh.id);
          return {
            ...s,
            scenes: [...preserved, ...fallbackScenes],
            selectedSceneId: fallbackScenes[0].id
          };
        });
        setLocalToast({ message: `Успешно структурированы сцены для главы «${selectedCh.title}»!`, type: "success" });
        setActiveTab('scenes');
      } finally {
        setIsGeneratingScenes(false);
        // Automatically scroll down to the Scenes section so the user sees them instantly
        setTimeout(() => {
          document.getElementById('section-scenes')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }, sysInstruction, "createScenesByChapters");
  };

  const buildFinalScript = () => {
    const text = state.chapters.map(c => `## ${c.title}\n${c.summary}\n\n` + 
      state.scenes.filter(sc => sc.chapterId === c.id).map(sc => `### ${sc.title}\n**Локация:** ${sc.location}\n**Действие:** ${sc.action}\n\n`).join('')
    ).join('');
    updateField('finalScript', text || state.scriptDraft);
    setActiveTab('final');
  };

  const applySuggestion = (id: string, action: 'replace' | 'append') => {
    const suggestion = state.aiSuggestions.find(s => s.id === id);
    if (!suggestion) return;
    
    const textToApply = suggestion.text;

    if (activeTab === 'draft') {
      setState(s => ({ ...s, scriptDraft: action === 'replace' ? textToApply : s.scriptDraft + '\n\n' + textToApply }));
      setLocalToast({ message: action === 'replace' ? "Черновик заменен!" : "Текст добавлен в черновик сценария!", type: "success" });
    } else if (activeTab === 'chapters') {
      const selectedId = state.selectedChapterId;
      if (selectedId) {
        setState(s => ({
          ...s,
          chapters: s.chapters.map(c => c.id === selectedId ? {
            ...c,
            summary: action === 'replace' ? textToApply : c.summary + '\n\n' + textToApply
          } : c)
        }));
        setLocalToast({ message: action === 'replace' ? "Описание главы заменено!" : "Текст добавлен к описанию главы!", type: "success" });
      } else {
        setState(s => ({ ...s, scriptDraft: action === 'replace' ? textToApply : s.scriptDraft + '\n\n' + textToApply }));
        setLocalToast({ message: "Глава не выбрана. Текст добавлен в общий черновик!", type: "success" });
      }
    } else if (activeTab === 'scenes') {
      const selectedId = state.selectedSceneId;
      if (selectedId) {
        setState(s => ({
          ...s,
          scenes: s.scenes.map(sc => sc.id === selectedId ? {
            ...sc,
            action: action === 'replace' ? textToApply : (sc.action ? sc.action + '\n\n' + textToApply : textToApply),
            description: action === 'replace' ? textToApply : (sc.description ? sc.description + '\n\n' + textToApply : textToApply)
          } : sc)
        }));
        setLocalToast({ message: action === 'replace' ? "Описание сцены заменено!" : "Текст добавлен к описанию сцены!", type: "success" });
      } else {
        setState(s => ({ ...s, scriptDraft: action === 'replace' ? textToApply : s.scriptDraft + '\n\n' + textToApply }));
        setLocalToast({ message: "Сцена не выбрана. Текст добавлен в общий черновик!", type: "success" });
      }
    } else if (activeTab === 'dialogues') {
      const selectedId = state.selectedSceneId;
      if (selectedId) {
        const newLine = {
          id: Math.random().toString(),
          sceneId: selectedId,
          character: "ИИ Помощник",
          text: textToApply,
          emotion: "Естественный тон",
          intonation: "",
          pauses: ""
        };
        setState(s => ({
          ...s,
          dialogueLines: [...s.dialogueLines, newLine],
          scenes: s.scenes.map(sc => sc.id === selectedId ? {
            ...sc,
            dialogueNotes: action === 'replace' ? textToApply : sc.dialogueNotes + '\n\n' + textToApply
          } : sc)
        }));
        setLocalToast({ message: "Реплика ИИ добавлена в блок диалогов!", type: "success" });
      } else {
        setState(s => ({ ...s, scriptDraft: action === 'replace' ? textToApply : s.scriptDraft + '\n\n' + textToApply }));
        setLocalToast({ message: "Сцена не выбрана. Текст добавлен в общий черновик!", type: "success" });
      }
    } else if (activeTab === 'final') {
      setState(s => ({ ...s, finalScript: action === 'replace' ? textToApply : s.finalScript + '\n\n' + textToApply }));
      setLocalToast({ message: action === 'replace' ? "Финальный сценарий заменен!" : "Текст добавлен в финальный сценарий!", type: "success" });
    } else {
      setState(s => ({ ...s, scriptDraft: action === 'replace' ? textToApply : s.scriptDraft + '\n\n' + textToApply }));
      setLocalToast({ message: "Черновик обновлен предложениями ИИ!", type: "success" });
    }
    
    setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(a => a.id !== id) }));
  };

  const copyFinalScript = () => { navigator.clipboard.writeText(state.finalScript); };

  const saveScenarioModule = () => {
    const saveData = { chapters: state.chapters, scenes: state.scenes, finalScript: state.finalScript, scriptDraft: state.scriptDraft, savedAt: new Date().toISOString() };
    localStorage.setItem("aura_scenario_state", JSON.stringify(saveData));
    setLocalToast({ message: `Сценарий сохранён: ${state.chapters.length} глав, ${state.scenes.length} сцен.`, type: "success" });
    onApprove();
  };

  const sendToFrameGeneratorModule = () => {
    const saveData = { chapters: state.chapters, scenes: state.scenes, finalScript: state.finalScript, scriptDraft: state.scriptDraft };
    localStorage.setItem("aura_scenario_state", JSON.stringify(saveData));
    setLocalToast({ message: "Сценарий сохранён. Откройте «Генератор Кадров» → «Импорт из Сценария».", type: "success" });
  };

  const sendToVideoGeneratorModule = () => {
    const saveData = { chapters: state.chapters, scenes: state.scenes, finalScript: state.finalScript, scriptDraft: state.scriptDraft };
    localStorage.setItem("aura_scenario_state", JSON.stringify(saveData));
    setLocalToast({ message: "Сценарий сохранён. Откройте «Генератор Видео» → «Импорт из Сценария».", type: "success" });
  };

  const sendToTTSModule = () => {
    const text = state.scenes.map(sc => sc.action || sc.title).filter(Boolean).join("\n\n");
    localStorage.setItem("aura_scenario_tts_text", text);
    setLocalToast({ message: "Текст сцен сохранён для модуля «Голос / TTS».", type: "success" });
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 h-full relative">
      {/* Local Toast Alert */}
      <AnimatePresence>
        {localToast && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-medium shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md bg-slate-900/95 min-w-[300px] ${
              localToast.type === 'success' 
                ? 'border-emerald-500/40 text-emerald-400' 
                : 'border-rose-500/40 text-rose-400'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-current" />
            <span className="flex-1">{localToast.message}</span>
            <button 
              onClick={() => setLocalToast(null)}
              className="ml-3 hover:text-white text-slate-400 text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Рабочая область */}
      <div className="flex-1 w-full flex flex-col min-h-0 bg-transparent relative pb-10 custom-scrollbar">
        
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 p-4">
          
          <div className="flex items-center justify-between bg-black/40 p-6 rounded-2xl border border-slate-800">
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-[#00F0FF]">
                Сценарий и Главы
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                Разработайте структуру истории, разбейте её на сцены и опишите действия и диалоги.
              </p>
            </div>
            
            <button
              onClick={onApprove}
              className={`px-6 py-2 rounded-xl font-bold uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${
                isApproved 
                  ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400' 
                  : 'bg-[#00F0FF] text-black hover:bg-[#4dffff] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isApproved ? 'Сценарий утвержден ✓' : 'Утвердить сценарий'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 p-1 bg-black/40 rounded-xl border border-slate-800 sticky top-0 z-10 backdrop-blur-md">
            <button 
              onClick={() => { document.getElementById('section-draft')?.scrollIntoView({ behavior: 'smooth' }); setActiveTab('draft'); }} 
              className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'draft' ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              1. Источник & Черновик
            </button>
            <button 
              onClick={() => { document.getElementById('section-chapters')?.scrollIntoView({ behavior: 'smooth' }); setActiveTab('chapters'); }} 
              className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'chapters' ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              2. Главы
            </button>
            <button 
              onClick={() => { document.getElementById('section-scenes')?.scrollIntoView({ behavior: 'smooth' }); setActiveTab('scenes'); }} 
              className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'scenes' ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              3. Сцены
            </button>
            <button 
              onClick={() => { document.getElementById('section-dialogues')?.scrollIntoView({ behavior: 'smooth' }); setActiveTab('dialogues'); }} 
              className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'dialogues' ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              4. Диалоги
            </button>
            <button 
              onClick={() => { document.getElementById('section-final')?.scrollIntoView({ behavior: 'smooth' }); setActiveTab('final'); }} 
              className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'final' ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              5. Финальный сценарий
            </button>
          </div>

          <div className="flex flex-col gap-6" id="section-draft">
            <div className="flex flex-col gap-4">
                <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 1. Источник сценария
                </h2>
                
                <div className="flex gap-4">
                  <button onClick={importIdeaPrompt} className="px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> Импорт из "Идея и Промпт"
                  </button>
                  <button onClick={importCharacters} className="px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <User className="w-4 h-4" /> Импорт из "Персонажи"
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Структура истории</span>
                    <select 
                      value={state.selectedStructure || ''}
                      onChange={e => selectStructure(e.target.value)}
                      className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    >
                      <option value="">Выберите структуру...</option>
                      {STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Длительность</span>
                    <select 
                      value={state.selectedDuration || ''}
                      onChange={e => selectDuration(e.target.value)}
                      className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    >
                      <option value="">Выберите длительность...</option>
                      {DURATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-[#00F0FF]">Формат</span>
                    <select 
                      value={state.selectedFormat || ''}
                      onChange={e => selectFormat(e.target.value)}
                      className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                    >
                      <option value="">Выберите формат...</option>
                      {FORMATS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <textarea 
                  placeholder="Общая идея сценария или черновик..." 
                  value={state.scriptDraft} 
                  onChange={e => updateScriptDraft(e.target.value)}
                  className="w-full min-h-[200px] bg-black/40 border border-slate-700/50 rounded-lg p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-slate-800 pt-4">
                <button 
                  onClick={generateScriptStructure} 
                  disabled={isGeneratingStructure || isGeneratingChapters}
                  className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10 transition-colors flex items-center gap-2 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingStructure ? (
                    <>
                      <Loader2 className="w-3 h-3 text-[#00F0FF] animate-spin" />
                      <span>Анализ структуры...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3 text-[#00F0FF]" />
                      <span>Создать структуру сценария</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={generateChaptersFromIdea} 
                  disabled={isGeneratingStructure || isGeneratingChapters}
                  className="p-2 text-xs text-left bg-black/40 border border-slate-700 rounded-lg hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10 transition-colors flex items-center gap-2 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingChapters ? (
                    <>
                      <Loader2 className="w-3 h-3 text-[#00F0FF] animate-spin" />
                      <span>Разбиение на главы...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3 text-[#00F0FF]" />
                      <span>Разбить идею на главы</span>
                    </>
                  )}
                </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-chapters">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 2. Главы
              </h2>
              
              <div className="flex gap-4">
                <button onClick={addChapter} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Добавить главу
                </button>
              </div>

              <div className="flex gap-6 items-start flex-col md:flex-row">
                {/* Chapters List */}
                <div className="w-full md:w-1/3 flex flex-col gap-2">
                  {state.chapters.map((c, index) => (
                    <div 
                      key={c.id} 
                      draggable
                      onDragStart={(e) => {
                        setDraggedChapterIndex(index);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedChapterIndex !== null && draggedChapterIndex !== index) {
                          reorderChapters(draggedChapterIndex, index);
                        }
                        setDraggedChapterIndex(null);
                      }}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${state.selectedChapterId === c.id ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 text-white' : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                      onClick={() => setState(s => ({ ...s, selectedChapterId: c.id }))}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium truncate">{c.title || 'Новая глава'}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteChapter(c.id); }} className="text-slate-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {state.chapters.length === 0 && (
                    <div className="p-4 text-center border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">Нет глав</div>
                  )}
                </div>

                {/* Chapter Editor */}
                {state.selectedChapterId ? (
                  <div className="w-full md:w-2/3 bg-black/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                    {(() => {
                      const c = state.chapters.find(ch => ch.id === state.selectedChapterId);
                      if (!c) return null;
                      return (
                        <>
                          <input 
                            type="text" 
                            placeholder="Название главы" 
                            value={c.title} 
                            onChange={e => updateChapter(c.id, { title: e.target.value })}
                            className="w-full bg-transparent border-b border-slate-700 p-2 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
                          />
                          <textarea 
                            placeholder="Краткое содержание (Summary)..." 
                            value={c.summary} 
                            onChange={e => updateChapter(c.id, { summary: e.target.value })}
                            className="w-full min-h-[100px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <textarea 
                              placeholder="Эмоциональная цель" 
                              value={c.emotionalGoal} 
                              onChange={e => updateChapter(c.id, { emotionalGoal: e.target.value })}
                              className="w-full min-h-[100px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                            />
                            <textarea 
                              placeholder="Функция для сюжета (Plot function)" 
                              value={c.plotFunction} 
                              onChange={e => updateChapter(c.id, { plotFunction: e.target.value })}
                              className="w-full min-h-[100px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                            />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="w-full md:w-2/3 bg-black/40 border border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                    <Wand2 className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
                    <p className="text-slate-400 text-sm text-center">Выберите главу из списка слева чтобы редактировать её детали</p>
                  </div>
                )}
              </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-scenes">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 3. Сцены
              </h2>

              <div className="flex gap-4">
                <button onClick={() => addScene(state.selectedChapterId)} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Добавить сцену
                </button>
                <button 
                  onClick={generateScenesFromChapters} 
                  disabled={isGeneratingScenes}
                  className="px-4 py-2 rounded-lg bg-black/40 border border-[#b026ff]/30 text-[#b026ff] text-sm hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingScenes ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#b026ff]" />
                      <span>Разбиение главы на сцены...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Разбить главу на сцены</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-6 items-start flex-col lg:flex-row">
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  {/* Select Chapter Grouping */}
                  <select 
                    value={state.selectedChapterId || ''}
                    onChange={e => setState(s => ({ ...s, selectedChapterId: e.target.value }))}
                    className="w-full bg-black/40 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                  >
                    <option value="">Все сцены...</option>
                    {state.chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>

                  <div className="flex flex-col gap-2">
                    {state.scenes.filter(sc => !state.selectedChapterId || sc.chapterId === state.selectedChapterId).map(sc => (
                      <div 
                        key={sc.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${state.selectedSceneId === sc.id ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 text-white' : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                        onClick={() => setState(s => ({ ...s, selectedSceneId: sc.id }))}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate">{sc.title || 'Новая сцена'}</span>
                          <span className="text-xs text-slate-500 truncate">{sc.location}</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteScene(sc.id); }} className="text-slate-500 hover:text-red-400 shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {state.scenes.length === 0 && (
                      <div className="p-4 text-center border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">Нет сцен</div>
                    )}
                  </div>
                </div>

                {state.selectedSceneId ? (
                  <div className="w-full lg:w-2/3 bg-black/40 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                    {(() => {
                      const sc = state.scenes.find(s => s.id === state.selectedSceneId);
                      if (!sc) return null;
                      return (
                        <>
                          <input 
                            type="text" 
                            placeholder="Название сцены" 
                            value={sc.title} 
                            onChange={e => updateScene(sc.id, { title: e.target.value })}
                            className="w-full bg-transparent border-b border-slate-700 p-2 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              placeholder="Локация" 
                              value={sc.location} 
                              onChange={e => updateScene(sc.id, { location: e.target.value })}
                              className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
                            />
                            <input 
                              type="text" 
                              placeholder="Персонажи в сцене" 
                              value={sc.characters} 
                              onChange={e => updateScene(sc.id, { characters: e.target.value })}
                              className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
                            />
                          </div>
                          <textarea 
                            placeholder="Действие (Action)" 
                            value={sc.action} 
                            onChange={e => updateScene(sc.id, { action: e.target.value })}
                            className="w-full min-h-[100px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 resize-y custom-scrollbar"
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <textarea placeholder="Конфликт сцены" value={sc.conflict} onChange={e => updateScene(sc.id, { conflict: e.target.value })} className="w-full min-h-[110px] resize-y bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white leading-relaxed placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 custom-scrollbar" />
                            <textarea placeholder="Визуальные заметки (Visual Notes)" value={sc.visualNotes} onChange={e => updateScene(sc.id, { visualNotes: e.target.value })} className="w-full min-h-[110px] resize-y bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white leading-relaxed placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 custom-scrollbar" />
                            <textarea placeholder="Аудио/Звуки (Audio Notes)" value={sc.audioNotes} onChange={e => updateScene(sc.id, { audioNotes: e.target.value })} className="w-full min-h-[110px] resize-y bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white leading-relaxed placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 custom-scrollbar" />
                            <textarea placeholder="Эмоциональный ритм" value={sc.emotionalBeat} onChange={e => updateScene(sc.id, { emotionalBeat: e.target.value })} className="w-full min-h-[110px] resize-y bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white leading-relaxed placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]/50 custom-scrollbar" />
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="w-full lg:w-2/3 bg-black/40 border border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
                    <Wand2 className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
                    <p className="text-slate-400 text-sm text-center">Выберите сцену из списка слева чтобы редактировать её детали</p>
                  </div>
                )}
              </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-dialogues">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 4. Диалоги
              </h2>
              
              <div className="flex gap-4">
                <button onClick={() => addDialogueLine(state.selectedSceneId)} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Добавить реплику
                </button>
                <button onClick={() => runAiAction('Улучшить диалог', 'Улучшить диалог', res => addSuggestion('Диалог', res, 'dialogue'))} className="px-4 py-2 rounded-lg bg-black/40 border border-[#b026ff]/30 text-[#b026ff] text-sm hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2">
                  <Wand2 className="w-4 h-4" /> ИИ: Сделать естественнее
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {state.dialogueLines.map(dl => (
                  <div key={dl.id} className="p-4 rounded-xl border border-slate-800 bg-black/40 flex flex-col gap-3 relative group">
                    <button onClick={() => deleteDialogueLine(dl.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <input type="text" placeholder="Персонаж" value={dl.character} onChange={e => updateDialogueLine(dl.id, { character: e.target.value })} className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-2 text-sm text-white font-bold" />
                      <input type="text" placeholder="Эмоция (опц.)" value={dl.emotion} onChange={e => updateDialogueLine(dl.id, { emotion: e.target.value })} className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-2 text-sm text-slate-400" />
                      <input type="text" placeholder="Интонация" value={dl.intonation} onChange={e => updateDialogueLine(dl.id, { intonation: e.target.value })} className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-2 text-sm text-slate-400" />
                      <input type="text" placeholder="Паузы (напр. '...')" value={dl.pauses} onChange={e => updateDialogueLine(dl.id, { pauses: e.target.value })} className="w-full bg-black/40 border border-slate-700/50 rounded-lg p-2 text-sm text-slate-400" />
                    </div>
                    <textarea placeholder="Реплика героя..." value={dl.text} onChange={e => updateDialogueLine(dl.id, { text: e.target.value })} className="w-full min-h-[85px] bg-black/40 border border-slate-700/50 rounded-lg p-3 text-sm text-white resize-y custom-scrollbar focus:border-[#00F0FF]/50 outline-none leading-relaxed" />
                  </div>
                ))}
                {state.dialogueLines.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-700 rounded-lg text-slate-500">
                    Нажмите "Добавить реплику" чтобы написать диалог
                  </div>
                )}
              </div>
          </div>

          <div className="flex flex-col gap-6 pt-8 border-t border-slate-800" id="section-final">
              <h2 className="text-sm font-bold text-[#b026ff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b026ff]"></span> 5. Финальный сценарий
              </h2>
              
              <div className="flex gap-4 flex-wrap">
                <button onClick={buildFinalScript} className="px-4 py-2 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] text-sm hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-2 font-bold">
                  <RefreshCcw className="w-4 h-4" /> Собрать финальный текст
                </button>
                <button onClick={() => runAiAction('Улучшить сценарий', 'Улучши финальный сценарий', res => addSuggestion('Финальный скрипт', res, 'final'))} className="px-4 py-2 rounded-lg bg-black/40 border border-[#b026ff]/30 text-[#b026ff] text-sm hover:bg-[#b026ff]/10 transition-colors flex items-center gap-2">
                  <Wand2 className="w-4 h-4" /> ИИ: Улучшить
                </button>
              </div>

              <textarea 
                placeholder="Здесь появится готовый сценарий..." 
                value={state.finalScript} 
                onChange={e => updateField('finalScript', e.target.value)}
                className="w-full min-h-[400px] bg-black/40 border border-slate-700/50 rounded-lg p-6 text-sm text-white leading-relaxed font-mono resize-y custom-scrollbar focus:outline-none focus:border-[#00F0FF]/50"
              />

              <div className="flex gap-3 flex-wrap">
                <button onClick={copyFinalScript} className="px-4 py-2 rounded-lg bg-[#00F0FF] text-black font-bold uppercase text-xs tracking-widest hover:bg-[#4dffff] transition-colors flex items-center gap-2">
                  <Copy className="w-4 h-4" /> Скопировать
                </button>
                <button onClick={saveScenarioModule} className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" /> Сохранить
                </button>
                <button onClick={sendToFrameGeneratorModule} className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Forward className="w-4 h-4" /> В Кадры
                </button>
                <button onClick={sendToVideoGeneratorModule} className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Forward className="w-4 h-4" /> В Видео
                </button>
                <button onClick={sendToTTSModule} className="px-4 py-2 rounded-lg bg-black/50 border border-slate-700 text-slate-300 font-bold uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <Forward className="w-4 h-4" /> В Голос (TTS)
                </button>
              </div>
            </div>

        </div>
      </div>

      {/* Правая панель ИИ-помощника */}
      <div className="w-full lg:w-[320px] bg-black/60 border border-slate-800 flex flex-col shrink-0 lg:h-[max(calc(100vh-140px),600px)] overflow-hidden lg:sticky top-[40px] rounded-xl self-start">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#b026ff]" /> ИИ-Помощник
          </h3>
          {state.isGenerating && <Loader2 className="w-4 h-4 text-[#00F0FF] animate-spin" />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase text-slate-500 font-bold tracking-wider">Действия по модулю</h4>
            <button onClick={() => runAiAction('Усилить конфликт', 'Усилитель', res => addSuggestion('Конфликт', res, 'concept'))} className="p-3 text-xs text-left bg-[#b026ff]/10 border border-[#b026ff]/30 text-white rounded-lg hover:bg-[#b026ff]/20 transition-colors flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-[#b026ff]" /> Усилить драматургию
            </button>
            <button onClick={() => runAiAction('Проверить логику', 'Логика', res => addSuggestion('Анализ логики', res, 'analysis'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-slate-500 hover:bg-black/60 transition-colors flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Проверить логику сюжета
            </button>
            <button onClick={() => runAiAction('Сократить', 'Сократить', res => addSuggestion('Сокращение', res, 'script'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-slate-500 transition-colors flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-slate-400" /> Сократить сценарий
            </button>
            <button onClick={() => runAiAction('Сделать подробнее', 'Подробнее', res => addSuggestion('Расширение', res, 'script'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-slate-500 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-400" /> Сделать подробнее
            </button>
            <button onClick={() => runAiAction('Добавить Cliffhanger', 'Cliffhanger', res => addSuggestion('Cliffhanger', res, 'concept'))} className="p-3 text-xs text-left bg-black/40 border border-slate-700 text-slate-300 rounded-lg hover:border-slate-500 transition-colors flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" /> Добавить cliffhanger
            </button>
          </div>

          <AnimatePresence>
            {state.aiSuggestions.map(sug => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={sug.id} 
                className="bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-wider">{sug.title}</span>
                  <button onClick={() => setState(s => ({ ...s, aiSuggestions: s.aiSuggestions.filter(a => a.id !== sug.id) }))} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-full overflow-hidden text-ellipsis whitespace-pre-wrap">{sug.text}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => applySuggestion(sug.id, 'replace')} className="py-1.5 bg-[#00F0FF] text-black text-[10px] font-bold uppercase rounded hover:bg-[#4dffff] transition-colors text-center truncate px-1">
                    Заменить
                  </button>
                  <button onClick={() => applySuggestion(sug.id, 'append')} className="py-1.5 bg-black/50 border border-[#00F0FF]/50 text-white text-[10px] uppercase font-bold rounded hover:bg-black/80 transition-colors text-center truncate px-1">
                    Добавить
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {state.aiSuggestions.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6 border border-dashed border-slate-700/50 rounded-xl w-full">
                <Wand2 className="w-6 h-6 text-slate-500 mx-auto mb-3 opacity-50" />
                <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Нет активных предложений</p>
                <p className="text-[10px] text-slate-600 mt-2">Используйте кнопки ИИ для генерации деталей</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
