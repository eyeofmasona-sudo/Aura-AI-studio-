export interface SavedFile {
  id: string;
  name: string;
  type: 'text' | 'json' | 'image' | 'audio';
  content: string; // Markdown layout, json representation, or url
  timestamp: string;
  sizeKey?: string; // e.g. "4.2 KB"
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  files: SavedFile[];
  stateSnapshot: Record<string, string>; // Maps localStorage key -> value
}

export class ProjectsStore {
  private static instance: ProjectsStore;
  public projects: Project[] = [];
  public activeProjectId: string | null = null;
  private listeners: (() => void)[] = [];

  private constructor() {
    this.loadFromStorage();
    if (this.projects.length === 0) {
      this.createDemoProject();
    }
  }

  public static getInstance(): ProjectsStore {
    if (!ProjectsStore.instance) {
      ProjectsStore.instance = new ProjectsStore();
    }
    return ProjectsStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem("aura_projects");
      if (stored) {
        this.projects = JSON.parse(stored);
      }
      const activeId = localStorage.getItem("aura_active_project_id");
      this.activeProjectId = activeId || (this.projects[0]?.id || null);
    } catch (e) {
      console.error("Failed to load projects from storage", e);
    }
  }

  public saveToStorage() {
    try {
      localStorage.setItem("aura_projects", JSON.stringify(this.projects));
      if (this.activeProjectId) {
        localStorage.setItem("aura_active_project_id", this.activeProjectId);
      } else {
        localStorage.removeItem("aura_active_project_id");
      }
    } catch (e) {
      console.error("Failed to save projects to storage", e);
    }
    this.notify();
  }

  // Auto-generation of structured files from current LocalStorage states
  private generateFilesFromCurrentState(): SavedFile[] {
    const files: SavedFile[] = [];
    const timestamp = new Date().toLocaleString("ru-RU");

    // 1. Idea & Prompt file
    try {
      const ideaStateStr = localStorage.getItem("aura_idea_prompt_state");
      if (ideaStateStr) {
        const state = JSON.parse(ideaStateStr);
        const md = `# 💡 Идея и Промпт проекта: ${state.projectName || "Aura Film Project"}

**Жанры:** ${state.selectedGenres?.join(", ") || "Не выбрано"}
**Настроения:** ${state.selectedMoods?.join(", ") || "Не выбрано"}
**Эпоха:** ${state.selectedEra || "Современность"}
**Визуальный стиль:** ${state.selectedVisualStyle || "Кинематографичный"}

## 📝 Ручное описание идеи:
${state.ideaText || "Описание отсутствует."}

## 🎯 Глобальный Логлайн:
${state.logline || "Логлайн еще не сгенерирован."}

## 📑 Синопсис (3 акта):
${state.synopsis || "Синопсис еще не сгенерирован."}

## 🎨 Визуальные теги (Мудборд):
${state.moodboardTags?.join(", ") || "Теги отсутствуют."}

---
*Сгенерировано Aura AI Studio (${timestamp})*`;
        
        files.push({
          id: "file-idea",
          name: "1_Идея_и_Солид.md",
          type: "text",
          content: md,
          timestamp,
          sizeKey: `${Math.ceil(md.length / 102.4) / 10} KB`
        });
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Characters file
    try {
      const charStateStr = localStorage.getItem("aura_character_state");
      if (charStateStr) {
        const state = JSON.parse(charStateStr);
        const hasImg = state.generatedCharacterImages && state.generatedCharacterImages.length > 0;
        const md = `# 👥 Спецификация Персонажа: ${state.characterName || "Безымянный герой"}

**Роль:** ${state.characterRole || "Главный герой"}
**Возраст:** ${state.characterAge || "Не указан"}
**Теги идентификации:** ${state.identityTags?.join(", ") || "Нет тегов"}

## 🔍 Описание персонажа:
${state.characterDescription || "Описание отсутствует."}

## 👗 Внешность и одежда:
* **Лицо/Внешний вид:** ${state.appearanceDescription || "Нет деталей"}
* **Одежда и стиль:** ${state.outfitDescription || "Нет деталей"}

## 🧠 Личность и мотивы:
* **Характер:** ${state.personalityDescription || "Нет деталей"}
* **Цель героя:** ${state.characterGoal || "Нет деталей"}
* **Скрытые страхи:** ${state.characterFear || "Нет деталей"}

## 🧬 Техническая идентичность:
* **Seed лица:** \`${state.identitySeed || "Не зафиксирован"}\`
* **Исключения (Negative Prompt):** \`${state.negativePrompt || "Отсутствует"}\`
* **Выбранная AI Модель:** ${state.selectedGenerationModel || "Nano Banana 2"}

## 🎬 Промпт Генерации Изображения:
\`\`\`text
${this.buildCharacterImagePrompt(state)}
\`\`\`

---
*Сгенерировано Aura AI Studio (${timestamp})*`;

        files.push({
          id: "file-char-specs",
          name: `2_Персонаж_${(state.characterName || "Герой").replace(/\s+/g, "_")}.md`,
          type: "text",
          content: md,
          timestamp,
          sizeKey: `${Math.ceil(md.length / 102.4) / 10} KB`
        });

        if (hasImg) {
          files.push({
            id: "file-char-images",
            name: "2_Портреты_Кастинга.json",
            type: "json",
            content: JSON.stringify(state.generatedCharacterImages, null, 2),
            timestamp,
            sizeKey: `${Math.ceil(JSON.stringify(state.generatedCharacterImages).length / 102.4) / 10} KB`
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Scenario & Story chapters
    try {
      const scenarioStr = localStorage.getItem("aura_scenario_state") || localStorage.getItem("scenario_scenes");
      if (scenarioStr) {
        files.push({
          id: "file-scenario",
          name: "3_Сценарий_и_Главы.json",
          type: "json",
          content: scenarioStr,
          timestamp,
          sizeKey: `${Math.ceil(scenarioStr.length / 102.4) / 10} KB`
        });
      }
    } catch (e) {}

    // 4. Frames & Master Images
    try {
      const framesStr = localStorage.getItem("aura_frames_gallery") || localStorage.getItem("frames_state");
      if (framesStr) {
        files.push({
          id: "file-frames",
          name: "4_Мастер_Кадры.json",
          type: "json",
          content: framesStr,
          timestamp,
          sizeKey: `${Math.ceil(framesStr.length / 102.4) / 10} KB`
        });
      }
    } catch (e) {}

    // 5. Video footage & clips
    try {
      const clipsStr = localStorage.getItem("video_generator_clips");
      if (clipsStr) {
        files.push({
          id: "file-footage",
          name: "5_Сгенерированные_Клипы.json",
          type: "json",
          content: clipsStr,
          timestamp,
          sizeKey: `${Math.ceil(clipsStr.length / 102.4) / 10} KB`
        });
      }
    } catch (e) {}

    // 6. Music & OST
    try {
      const musicStr = localStorage.getItem("aura_music_module_state");
      if (musicStr) {
        const state = JSON.parse(musicStr);
        const md = `# 🎵 Музыкальные Саундтреки и OST

${state.tracks && state.tracks.length > 0 ? state.tracks.map((t: any, i: number) => `### ${i+1}. ${t.title || "Оригинальный трек"}
* **Жанр & Стиль:** ${t.genre || "Кинематографичный"}
* **Настроение:** ${t.mood || "Эпичное"}
* **Инструменты:** ${t.instruments || "Симфонический оркестр"}
* **BPM (Темп):** ${t.bpm || "120"}
* **Текст лирики:** 
${t.lyrics || "Инструментальный трек."}
* **Аудиодорожка:** [Ссылка на файл](${t.audioUrl || "https://images.unsplash.com"})
`).join("\n---\n") : "Треки еще не сгенерированы."}

---
*Студийный OST-Пак Aura (${timestamp})*`;

        files.push({
          id: "file-music",
          name: "6_Плейлист_Музыки.md",
          type: "text",
          content: md,
          timestamp,
          sizeKey: `${Math.ceil(md.length / 102.4) / 10} KB`
        });
      }
    } catch (e) {}

    // 7. Voice & Dialogues
    try {
      const voiceStr = localStorage.getItem("aura_voice_module_state");
      if (voiceStr) {
        const state = JSON.parse(voiceStr);
        const md = `# 🎤 Спецификация Синтеза Речи (TTS) и Озвучка

${state.lines && state.lines.length > 0 ? state.lines.map((l: any, i: number) => `### Реплика ${i+1} (${l.character || "Рассказчик"})
* **Персонаж:** ${l.character || "Голос за кадром"}
* **Текст реплики:** "${l.text || ""}"
* **Голосовая модель:** ${l.voiceModel || "Стандартный мужской (Gemini)"}
* **Эмоция / Тон:** ${l.emotion || "Нейтральный"}
* **Скорость / Питч:** Скорость: ${l.speed || "1.0"}, Высота: ${l.pitch || "1.0"}
* **Сгенерированный WAV:** ${l.audioUrl ? `[Скачать аудиозапись](${l.audioUrl})` : "В очереди на озвучку"}
`).join("\n---\n") : "Диалоги в сценарии не озвучены."}

---
*Сгенерировано Aura AI Studio TTS (${timestamp})*`;

        files.push({
          id: "file-voice",
          name: "7_Голоса_и_Реплики.md",
          type: "text",
          content: md,
          timestamp,
          sizeKey: `${Math.ceil(md.length / 102.4) / 10} KB`
        });
      }
    } catch (e) {}

    // 8. Audio Editor Mix
    try {
      const audioEditorStr = localStorage.getItem("aura_audio_editor_state");
      if (audioEditorStr) {
        files.push({
          id: "file-audio-editor",
          name: "8_Сведение_Звука.json",
          type: "json",
          content: audioEditorStr,
          timestamp,
          sizeKey: `${Math.ceil(audioEditorStr.length / 102.4) / 10} KB`
        });
      }
    } catch (e) {}

    // Return all compiled virtual files
    return files.length > 0 ? files : this.getDefaultProjectFiles();
  }

  private buildCharacterImagePrompt(charState: any) {
    return `Create a character portrait based on the following attributes.
Character Name: ${charState.characterName || "Unnamed"}
Role: ${charState.characterRole || "Hero"}
Age: ${charState.characterAge || "Young Adult"}
Description: ${charState.characterDescription || ""}
Appearance traits: ${charState.appearanceDescription || ""}
Outfit: ${charState.outfitDescription || ""}
Emotion/Expression: ${charState.emotionDescription || charState.selectedExpression || "Neutral"}
Personality: ${charState.personalityDescription || ""}
Goal: ${charState.characterGoal || ""}
Style: ${charState.selectedImageStyle || "Реализм"}, Realism: ${charState.selectedRealismLevel || "Высокий"}, Portrait: ${charState.selectedPortraitType || "Крупный портрет"}, Lighting: ${charState.selectedLighting || "Кинематографичный свет"}, Background: ${charState.selectedBackground || "Размытый"}, Palette: ${charState.selectedColorPalette || "Кинематографичная"}.
Negative instructions: ${charState.negativePrompt || "deformation, ugly"}`.trim();
  }

  private getDefaultProjectFiles(): SavedFile[] {
    const timestamp = new Date().toLocaleString("ru-RU");
    return [
      {
        id: "demo-idea",
        name: "1_Идея_Проекта.txt",
        type: "text",
        content: `Тема: Космическая Одиссея «Аура»\nЖанр: Научная фантастика\nНастроение: Эпичное, загадочное, глубокое\nЭпоха: Будущее (2250 год)`,
        timestamp,
        sizeKey: "0.2 KB"
      },
      {
        id: "demo-chars",
        name: "2_Персонажи_Спецификация.json",
        type: "json",
        content: `[\n  {\n    "name": "Дмитрий Корсаков",\n    "role": "Капитан «Ауры»",\n    "age": "42",\n    "description": "Опытный астрофизик, преследуемый прошлым."\n  }\n]`,
        timestamp,
        sizeKey: "0.4 KB"
      }
    ];
  }

  private createDemoProject() {
    const timestamp = new Date().toLocaleString("ru-RU");
    const demo: Project = {
      id: "project-aura-space",
      name: "Космическая Одиссея",
      description: "Эпичная фантастическая драма в глубоком космосе с ИИ-модуляцией.",
      createdAt: timestamp,
      updatedAt: timestamp,
      files: this.getDefaultProjectFiles(),
      stateSnapshot: {}
    };
    this.projects.push(demo);
    this.activeProjectId = demo.id;
    this.saveToStorage();
  }

  // Create new project with current inputs snapshots
  public createProject(name: string, description: string): Project {
    const timestamp = new Date().toLocaleString("ru-RU");
    const id = "proj_" + Math.random().toString(36).substring(7);

    // Save current snapshots of all keys
    const snapshot: Record<string, string> = {};
    const keys = [
      "aura_idea_prompt_state",
      "aura_character_state",
      "aura_imported_idea_context",
      "video_generator_blocks",
      "video_generator_clips",
      "aura_music_module_state",
      "aura_voice_module_state",
      "aura_audio_editor_state",
      "scenario_scenes",
      "aura_scenario_state",
      "aura_frames_gallery"
    ];
    keys.forEach(k => {
      const v = localStorage.getItem(k);
      if (v) snapshot[k] = v;
    });

    const newProj: Project = {
      id,
      name,
      description: description || "Новый творческий проект в Aura AI Studio",
      createdAt: timestamp,
      updatedAt: timestamp,
      files: this.generateFilesFromCurrentState(),
      stateSnapshot: snapshot
    };

    this.projects.push(newProj);
    this.activeProjectId = id;
    this.saveToStorage();
    return newProj;
  }

  // Save changes to current project
  public saveCurrentProject(): string {
    if (!this.activeProjectId) {
      const defaultProj = this.createProject("Мой Фильм", "Сохраненный проект по умолчанию");
      return defaultProj.name;
    }

    const index = this.projects.findIndex(p => p.id === this.activeProjectId);
    if (index === -1) {
      const defaultProj = this.createProject("Мой Фильм", "Сохраненный проект по умолчанию");
      return defaultProj.name;
    }

    const timestamp = new Date().toLocaleString("ru-RU");
    const project = this.projects[index];

    // Take snapshot of everything current
    const snapshot: Record<string, string> = {};
    const keys = [
      "aura_idea_prompt_state",
      "aura_character_state",
      "aura_imported_idea_context",
      "video_generator_blocks",
      "video_generator_clips",
      "aura_music_module_state",
      "aura_voice_module_state",
      "aura_audio_editor_state",
      "scenario_scenes",
      "aura_scenario_state",
      "aura_frames_gallery"
    ];
    keys.forEach(k => {
      const v = localStorage.getItem(k);
      if (v) snapshot[k] = v;
    });

    project.updatedAt = timestamp;
    project.files = this.generateFilesFromCurrentState();
    project.stateSnapshot = snapshot;

    this.projects[index] = project;
    this.saveToStorage();
    return project.name;
  }

  // Load project - restoring all localStorage keys back and reloading tabs
  public loadProject(projectId: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) return;

    this.activeProjectId = projectId;
    
    // Clear existing storage keys first
    const keysToClean = [
      "aura_idea_prompt_state",
      "aura_character_state",
      "aura_imported_idea_context",
      "video_generator_blocks",
      "video_generator_clips",
      "aura_music_module_state",
      "aura_voice_module_state",
      "aura_audio_editor_state",
      "scenario_scenes",
      "aura_scenario_state",
      "aura_frames_gallery"
    ];
    keysToClean.forEach(k => localStorage.removeItem(k));

    // Fill with snapshots from project
    Object.entries(project.stateSnapshot || {}).forEach(([k, v]) => {
      localStorage.setItem(k, v);
    });

    this.saveToStorage();
    
    // Reload components by raising event/reloading page
    window.location.reload();
  }

  public deleteProject(projectId: string) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    if (this.activeProjectId === projectId) {
      this.activeProjectId = this.projects[0]?.id || null;
    }
    this.saveToStorage();
  }
}
