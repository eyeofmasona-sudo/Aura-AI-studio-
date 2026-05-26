import { specData } from "../data";

export type AiTaskType =
  | "text_cheap"
  | "text_balanced"
  | "text_strong"
  | "image_generation"
  | "video_generation"
  | "audio_understanding"
  | "tts"
  | "music"
  | "consistency_check"
  | "prompt_improvement"
  | "metadata";

export interface RegistryFunction {
  module: string;
  functionName: string;
  label: string;
  taskType: AiTaskType;
  defaultCostLevel: "low" | "medium" | "high";
  requiresConfirmation: boolean;
}

// Complete registry of all AI actions across Aura AI Studio
export const aiFunctionRegistry: RegistryFunction[] = [
  // 1. Идея и Промпт
  { module: "idea_prompt", functionName: "improveIdea", label: "Улучшить идею", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "idea_prompt", functionName: "makeCinematic", label: "Сделать кинематографичнее", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "idea_prompt", functionName: "expandConcept", label: "Развернуть в концепт", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "idea_prompt", functionName: "similarIdeas", label: "Предложить 5 похожих идей", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "idea_prompt", functionName: "generateLogline", label: "Создать логлайн", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "idea_prompt", functionName: "generateSynopsis", label: "Создать синопсис", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "idea_prompt", functionName: "generateMoodboard", label: "Создать мудборд", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "idea_prompt", functionName: "assemblePrompt", label: "Собрать финальный промпт", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "idea_prompt", functionName: "improveFinalPrompt", label: "Улучшить финальный промпт", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "idea_prompt", functionName: "audioAnalysis", label: "Анализ аудио (Идея)", taskType: "audio_understanding", defaultCostLevel: "high", requiresConfirmation: true },

  // 2. Персонажи
  { module: "characters", functionName: "improveCharacterDesc", label: "Улучшить описание персонажа", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "characters", functionName: "makeDetailedAppearance", label: "Сделать внешность детальнее", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "characters", functionName: "addGoalConflict", label: "Добавить цель и конфликт", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "characters", functionName: "createCharacterPersonality", label: "Придумать характер", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "characters", functionName: "designCharacterClothes", label: "Придумать одежду", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "characters", functionName: "createIdentityTags", label: "Создать identity tags", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "characters", functionName: "createConsistencyPrompt", label: "Создать consistency prompt", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "characters", functionName: "createNegativePrompt", label: "Создать negative prompt", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "characters", functionName: "verifyPhotoDesc", label: "Проверить соответствие фото и описания", taskType: "text_strong", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "characters", functionName: "generateCharacterByText", label: "Сгенерировать персонажа по тексту", taskType: "image_generation", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "characters", functionName: "generateCharacterByPhoto", label: "Сгенерировать по фото + описанию", taskType: "image_generation", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "characters", functionName: "generateCharactersFromIdea", label: "Создать персонажей из идеи", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },

  // 3. Сценарий и Главы
  { module: "scenario", functionName: "splitIdeaIntoChapters", label: "Разбить идею на главы", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "scenario", functionName: "createScenarioStructure", label: "Создать структуру сценария", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "scenario", functionName: "createScenesByChapters", label: "Создать сцены по главам", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "scenario", functionName: "addConflictToScenario", label: "Добавить конфликт сценария", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "scenario", functionName: "strengthenDrama", label: "Усилить драматургию", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "scenario", functionName: "improveDialogues", label: "Улучшить диалоги", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "scenario", functionName: "createCliffhanger", label: "Создать cliffhanger", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "scenario", functionName: "checkPlotLogic", label: "Проверить логику сюжета", taskType: "text_strong", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "scenario", functionName: "shortenScenario", label: "Сократить сценарий", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "scenario", functionName: "expandScenario", label: "Сделать сценарий подробнее", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "scenario", functionName: "assembleFinalScenario", label: "Собрать сценарий", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },

  // 4. Генератор Кадров
  { module: "frame_generator", functionName: "splitSeceneIntoFrames", label: "Разбить сцену на кадры", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "frame_generator", functionName: "createShotList", label: "Создать shot list", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "frame_generator", functionName: "chooseCameraAngle", label: "Подобрать ракурс", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "frame_generator", functionName: "chooseLightingStyle", label: "Подобрать свет", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "frame_generator", functionName: "makeFrameCinematic", label: "Сделать кадр кинематографичным", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "frame_generator", functionName: "createImagePrompt", label: "Создать image prompt", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "frame_generator", functionName: "createNegativePromptFrame", label: "Создать negative prompt кадров", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "frame_generator", functionName: "generateFrame", label: "Сгенерировать кадр", taskType: "image_generation", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "frame_generator", functionName: "generateFirstFrame", label: "Сгенерировать First Frame", taskType: "image_generation", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "frame_generator", functionName: "generateLastFrame", label: "Сгенерировать Last Frame", taskType: "image_generation", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "frame_generator", functionName: "generateFirstAndLastFrame", label: "Сгенерировать First + Last", taskType: "image_generation", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "frame_generator", functionName: "checkVisualContinuity", label: "Проверить visual continuity", taskType: "text_strong", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "frame_generator", functionName: "checkCharacterMatching", label: "Проверить соответствие персонажам", taskType: "text_strong", defaultCostLevel: "high", requiresConfirmation: true },

  // 5. Генератор Видео
  { module: "video_generator", functionName: "assembleScenePrompt", label: "Собрать prompt сцены", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "video_generator", functionName: "improveScenePrompt", label: "Улучшить prompt сцены", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_generator", functionName: "createMotionPrompt", label: "Создать motion prompt", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "video_generator", functionName: "addCameraMovement", label: "Добавить движение камеры", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_generator", functionName: "addCharacterMovement", label: "Добавить движение персонажа", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_generator", functionName: "makeSceneDynamic", label: "Сделать сцену динамичнее", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_generator", functionName: "makeMotionSofter", label: "Сделать motion мягче", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_generator", functionName: "adaptPromptForModel", label: "Адаптировать prompt под модель", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_generator", functionName: "checkConsistency", label: "Проверить consistency", taskType: "text_strong", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "video_generator", functionName: "generateSceneVideo", label: "Сгенерировать видео сцены", taskType: "video_generation", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "video_generator", functionName: "batchPromptGeneration", label: "Batch prompt для сцен", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "video_generator", functionName: "batchVideoGeneration", label: "Batch video generation", taskType: "video_generation", defaultCostLevel: "high", requiresConfirmation: true },

  // 6. Музыка
  { module: "music", functionName: "chooseMusicGenre", label: "Подобрать жанр", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "music", functionName: "chooseMusicMood", label: "Подобрать настроение", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "music", functionName: "chooseInstruments", label: "Подобрать инструменты", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "music", functionName: "chooseBmp", label: "Подобрать BPM", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "music", functionName: "makeMusicCinematic", label: "Сделать музыку кинематографичнее", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "music", functionName: "makeMusicForScene", label: "Сделать музыку под сцену", taskType: "music", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "music", functionName: "createMusicPrompt", label: "Создать music prompt", taskType: "music", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "music", functionName: "createAudioDirection", label: "Создать audio direction", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "music", functionName: "createSfxList", label: "Создать SFX list", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "music", functionName: "analyzeAudioReference", label: "Анализ audio reference", taskType: "audio_understanding", defaultCostLevel: "high", requiresConfirmation: true },

  // 7. Голос / TTS
  { module: "voice", functionName: "improveVoiceoverText", label: "Улучшить текст для озвучки", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "voice", functionName: "makeSpeechNatural", label: "Сделать речь естественнее", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "voice", functionName: "addEmotions", label: "Добавить эмоции", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "voice", functionName: "insertPauses", label: "Расставить паузы", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "voice", functionName: "createVoiceDirection", label: "Создать voice direction", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "voice", functionName: "createSsml", label: "Создать SSML", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "voice", functionName: "checkSsml", label: "Проверить SSML", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "voice", functionName: "checkPronunciation", label: "Проверить произношение", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "voice", functionName: "adaptVoiceForCharacter", label: "Адаптировать под персонажа", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "voice", functionName: "generateVoice", label: "Сгенерировать голос (TTS)", taskType: "tts", defaultCostLevel: "high", requiresConfirmation: true },

  // 8. Аудиоредактор
  { module: "audio_editor", functionName: "analyzeAudioAndSuggest", label: "Проанализировать аудио", taskType: "audio_understanding", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "audio_editor", functionName: "suggestSoundImprovement", label: "Предложить улучшение звука", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "audio_editor", functionName: "selectSfx", label: "Подобрать SFX", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "audio_editor", functionName: "createAmbiencePlan", label: "Создать ambience plan", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "audio_editor", functionName: "createAudioMixPlan", label: "Создать audio mix plan", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "audio_editor", functionName: "syncAudioWithScenes", label: "Синхронизировать звук со сценами", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "audio_editor", functionName: "checkMusicVoiceBalance", label: "Проверить баланс музыка/голос", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "audio_editor", functionName: "prepareAudioForPlatform", label: "Подготовить звук под платформу", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },

  // 9. Видеоредактор
  { module: "video_editor", functionName: "createMontagePlan", label: "Создать монтажный план", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "video_editor", functionName: "arrangeShotsOrder", label: "Подобрать порядок кадров", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_editor", functionName: "suggestTransitions", label: "Предложить переходы", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_editor", functionName: "syncWithMusic", label: "Синхронизировать с музыкой", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "video_editor", functionName: "suggestTitles", label: "Предложить титры", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_editor", functionName: "suggestColorCorrection", label: "Предложить цветокоррекцию", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "video_editor", functionName: "findMontageWeakPoints", label: "Найти слабые места монтажа", taskType: "text_strong", defaultCostLevel: "high", requiresConfirmation: true },
  { module: "video_editor", functionName: "createCutList", label: "Создать cut list", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "video_editor", functionName: "createEdl", label: "Создать EDL", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },

  // 10. Экспорт
  { module: "export", functionName: "prepareExportYoutube", label: "Подготовить под YouTube", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "export", functionName: "prepareExportTiktok", label: "Подготовить под TikTok", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "export", functionName: "prepareExportReels", label: "Подготовить под Reels", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "export", functionName: "createExportTitle", label: "Создать название", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "export", functionName: "createExportDescription", label: "Создать описание", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "export", functionName: "createExportTags", label: "Создать теги", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "export", functionName: "createExportHashtags", label: "Создать hashtags", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "export", functionName: "createThumbnailPrompt", label: "Создать thumbnail prompt", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "export", functionName: "checkExportQuality", label: "Проверить качество", taskType: "text_cheap", defaultCostLevel: "low", requiresConfirmation: false },
  { module: "export", functionName: "createAspectVersions", label: "Создать версии 16:9 / 9:16 / 1:1", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
  { module: "export", functionName: "assembleExportPackage", label: "Собрать export package", taskType: "text_balanced", defaultCostLevel: "medium", requiresConfirmation: false },
];

export interface AiRequestLog {
  requestId: string;
  timestamp?: string;
  module: string;
  functionName: string;
  taskType: AiTaskType;
  selectedModel: string;
  status: "success" | "failed" | "pending";
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  errorMessage?: string;
  userConfirmedExpensiveTask: boolean;
  cachedResultUsed: boolean;
  promptText?: string;
  responseText?: string;
}

export interface ModelPricing {
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  fixedCostPerRun?: number;
}

export const modelPricingConfig: Record<string, ModelPricing> = {
  "gemini-3.5-flash": { inputCostPerMillion: 0.075, outputCostPerMillion: 0.30 },
  "gemini-3.1-pro-preview": { inputCostPerMillion: 1.25, outputCostPerMillion: 5.00 },
  "gemini-2.5-flash-image": { inputCostPerMillion: 0, outputCostPerMillion: 0, fixedCostPerRun: 0.03 },
  "gemini-3.1-flash-image-preview": { inputCostPerMillion: 0, outputCostPerMillion: 0, fixedCostPerRun: 0.05 },
  "veo-3.1-lite-generate-preview": { inputCostPerMillion: 0, outputCostPerMillion: 0, fixedCostPerRun: 0.15 },
  "veo-3.1-generate-preview": { inputCostPerMillion: 0, outputCostPerMillion: 0, fixedCostPerRun: 0.25 },
  "gemini-3.1-flash-tts-preview": { inputCostPerMillion: 0, outputCostPerMillion: 0, fixedCostPerRun: 0.01 },
  "gemini-3.1-flash-live-preview": { inputCostPerMillion: 0.10, outputCostPerMillion: 0.40 },
  "lyria-3-pro-preview": { inputCostPerMillion: 0, outputCostPerMillion: 0, fixedCostPerRun: 0.10 },
  "default-fallback": { inputCostPerMillion: 0.075, outputCostPerMillion: 0.30 },
};

// Available Model Options
export const MODEL_OPTIONS = {
  text_cheap: [
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Рекомендуется)" },
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" }
  ],
  text_balanced: [
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview (Более точный)" }
  ],
  text_strong: [
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Быстрее)" }
  ],
  image_generation: [
    { value: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
    { value: "gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image Preview (Качественный)" }
  ],
  video_generation: [
    { value: "veo-3.1-lite-generate-preview", label: "Veo 3.1 Lite (Быстрый)" },
    { value: "veo-3.1-generate-preview", label: "Veo 3.1 High-Quality" }
  ],
  audio_understanding: [
    { value: "gemini-3.1-flash-live-preview", label: "Gemini 3.1 Live Audio (Быстрый)" },
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" }
  ],
  tts: [
    { value: "gemini-3.1-flash-tts-preview", label: "Gemini 3.1 TTS (Рекомендуется)" },
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Альтернатива)" }
  ],
  music: [
    { value: "lyria-3-pro-preview", label: "Lyria 3 Pro Preview (Рекомендуется для музыки)" },
    { value: "gemini-3.1-flash-live-preview", label: "Gemini 3.1 Live Audio (Альтернатива)" }
  ],
  default_fallback: [
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" }
  ]
};

export type TaskTypeModelsMap = Record<AiTaskType, string>;

const DEFAULT_TASK_TYPE_MODELS: TaskTypeModelsMap = {
  text_cheap: "gemini-3.5-flash",
  text_balanced: "gemini-3.5-flash",
  text_strong: "gemini-3.1-pro-preview",
  image_generation: "gemini-2.5-flash-image",
  video_generation: "veo-3.1-lite-generate-preview",
  audio_understanding: "gemini-3.1-flash-live-preview",
  tts: "gemini-3.1-flash-tts-preview",
  music: "lyria-3-pro-preview",
  consistency_check: "gemini-3.1-pro-preview",
  prompt_improvement: "gemini-3.5-flash",
  metadata: "gemini-3.5-flash",
};

type OverrideMap = Record<string, string>; // "module:functionName" -> model

export class AiStore {
  private static instance: AiStore;
  
  public taskModels: TaskTypeModelsMap = { ...DEFAULT_TASK_TYPE_MODELS };
  public overrides: OverrideMap = {};
  public logs: AiRequestLog[] = [];
  public cache: Record<string, string> = {};
  public apiStatus: {
    connected: boolean | null;
    keyFound: boolean;
    proxyWorking: boolean | null;
    lastCheck: string | null;
    lastError: string | null;
  } = {
    connected: null,
    keyFound: false,
    proxyWorking: null,
    lastCheck: null,
    lastError: null,
  };

  public pendingConfirmationRequest: {
    module: string;
    functionName: string;
    taskType: AiTaskType;
    inputs: string[];
    costLevel: "low" | "medium" | "high";
    modelName: string;
    resolve: (approved: boolean) => void;
  } | null = null;

  private listeners: (() => void)[] = [];

  private constructor() {
    this.loadFromStorage();
    this.checkInitialApiStatus();
  }

  public static getInstance(): AiStore {
    if (!AiStore.instance) {
      AiStore.instance = new AiStore();
    }
    return AiStore.instance;
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
      const storedModels = localStorage.getItem("aura_ai_task_models");
      if (storedModels) {
        this.taskModels = { ...DEFAULT_TASK_TYPE_MODELS, ...JSON.parse(storedModels) };
      }

      const storedOverrides = localStorage.getItem("aura_ai_function_overrides");
      if (storedOverrides) {
        this.overrides = JSON.parse(storedOverrides);
      }

      const storedLogs = localStorage.getItem("aura_ai_logs");
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }

      const storedCache = localStorage.getItem("aura_ai_cache");
      if (storedCache) {
        this.cache = JSON.parse(storedCache);
      }
    } catch (e) {
      console.error("Failed to load Aura AI config from storage", e);
    }
  }

  public saveToStorage() {
    try {
      localStorage.setItem("aura_ai_task_models", JSON.stringify(this.taskModels));
      localStorage.setItem("aura_ai_function_overrides", JSON.stringify(this.overrides));
      localStorage.setItem("aura_ai_logs", JSON.stringify(this.logs));
      localStorage.setItem("aura_ai_cache", JSON.stringify(this.cache));
    } catch (e) {
      console.error("Failed to save Aura AI config to storage", e);
    }
  }

  public async checkInitialApiStatus() {
    try {
      const res = await fetch("/api/gemini/status");
      const data = await res.json();
      this.apiStatus = {
        connected: data.connected,
        keyFound: data.keyFound,
        proxyWorking: data.proxyWorking,
        lastCheck: new Date().toISOString(),
        lastError: data.error || null,
      };
    } catch (err: any) {
      this.apiStatus = {
        connected: false,
        keyFound: false,
        proxyWorking: false,
        lastCheck: new Date().toISOString(),
        lastError: err.message || "Failed to contact proxy server",
      };
    }
    this.notify();
  }

  public async runTestConnection(): Promise<boolean> {
    this.apiStatus.connected = null;
    this.notify();
    await this.checkInitialApiStatus();
    return !!this.apiStatus.connected;
  }

  public async makeTestRequest(): Promise<string> {
    try {
      const model = this.taskModels.text_cheap || "gemini-3.5-flash";
      const start = Date.now();
      const res = await fetch("/api/gemini/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionName: "Test connection check",
          specTitle: "Usage & Models Settings",
          inputs: ["System status check"],
          modelName: model,
        }),
      });
      const data = await res.json();
      const latency = Date.now() - start;

      if (res.status >= 400 || data.error) {
        throw new Error(data.error || `Proxy error: ${res.status}`);
      }

      this.trackAiUsage({
        requestId: Math.random().toString(36).substring(7),
        module: "usage_models",
        functionName: "testConnection",
        taskType: "text_cheap",
        selectedModel: model,
        status: "success",
        latencyMs: latency,
        inputTokens: 15,
        outputTokens: 40,
        totalTokens: 55,
        estimatedCost: this.calculateCost(model, 15, 40),
        responseText: data.result,
        promptText: "Test connection check",
        cachedResultUsed: false,
        userConfirmedExpensiveTask: false,
      });

      return data.result || "Успешный пустой ответ";
    } catch (err: any) {
      this.apiStatus.connected = false;
      this.apiStatus.lastError = err.message || "Connection failed";
      this.notify();

      this.trackAiUsage({
        requestId: Math.random().toString(36).substring(7),
        module: "usage_models",
        functionName: "testConnection",
        taskType: "text_cheap",
        selectedModel: this.taskModels.text_cheap || "gemini-3.5-flash",
        status: "failed",
        latencyMs: 120,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        errorMessage: err.message || "Request timed out",
        cachedResultUsed: false,
        userConfirmedExpensiveTask: false,
      });

      throw err;
    }
  }

  public resolveModelForFunction(module: string, functionName: string, taskType: AiTaskType) {
    const overrideKey = `${module}:${functionName}`;
    const functionOverride = this.overrides[overrideKey];
    const registryItem = aiFunctionRegistry.find(f => f.module === module && f.functionName === functionName);

    let modelName = "gemini-3.5-flash";
    let source: "function_override" | "task_type_default" | "global_fallback" = "global_fallback";

    if (functionOverride) {
      modelName = functionOverride;
      source = "function_override";
    } else if (this.taskModels[taskType]) {
      modelName = this.taskModels[taskType];
      source = "task_type_default";
    } else if (registryItem) {
      modelName = DEFAULT_TASK_TYPE_MODELS[registryItem.taskType] || "gemini-3.5-flash";
      source = "task_type_default";
    }

    const costLevel = registryItem ? registryItem.defaultCostLevel : "low";
    const requiresConfirmation = registryItem ? registryItem.requiresConfirmation : false;

    return {
      modelName,
      source,
      requiresConfirmation,
      costLevel,
    };
  }

  public setModelForTaskType(taskType: AiTaskType, model: string) {
    this.taskModels[taskType] = model;
    this.saveToStorage();
    this.notify();
  }

  public setOverrideForFunction(overrideKey: string, model: string | null) {
    if (model === null || model === "") {
      delete this.overrides[overrideKey];
    } else {
      this.overrides[overrideKey] = model;
    }
    this.saveToStorage();
    this.notify();
  }

  public resetAllSettings() {
    this.taskModels = { ...DEFAULT_TASK_TYPE_MODELS };
    this.overrides = {};
    this.saveToStorage();
    this.notify();
  }

  public clearLogs() {
    this.logs = [];
    this.saveToStorage();
    this.notify();
  }

  public clearCache() {
    this.cache = {};
    this.saveToStorage();
    this.notify();
  }

  public calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = modelPricingConfig[model] || modelPricingConfig["default-fallback"];
    let cost = 0;
    if (pricing.inputCostPerMillion) {
      cost += (inputTokens / 1000000) * pricing.inputCostPerMillion;
    }
    if (pricing.outputCostPerMillion) {
      cost += (outputTokens / 1000000) * pricing.outputCostPerMillion;
    }
    if (pricing.fixedCostPerRun) {
      cost += pricing.fixedCostPerRun;
    }
    return parseFloat(cost.toFixed(6));
  }

  public trackAiUsage(log: AiRequestLog) {
    const fullLog: AiRequestLog = {
      ...log,
      timestamp: log.timestamp || new Date().toISOString()
    };
    this.logs.unshift(fullLog);
    // Keep last 400 logs
    if (this.logs.length > 400) {
      this.logs = this.logs.slice(0, 400);
    }
    this.saveToStorage();
    this.notify();
  }

  private generateInputHash(moduleName: string, functionName: string, modelName: string, inputs: string[]): string {
    const str = `${moduleName}||${functionName}||${modelName}||${inputs.join("&&")}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `hash_${hash}`;
  }

  public async requestExecution(params: {
    module: string;
    functionName: string;
    inputs: string[];
    actionName: string;
    systemInstruction?: string;
    bypassCache?: boolean;
    images?: { data: string, mimeType: string }[];
    onConfirmedStart?: () => void;
  }): Promise<string> {
    const registryItem = aiFunctionRegistry.find(
      f => f.module === params.module && f.functionName === params.functionName
    );
    const taskType = registryItem ? registryItem.taskType : "text_cheap";
    const info = this.resolveModelForFunction(params.module, params.functionName, taskType);

    // Prompt confirmations if needed and enabled
    if (info.requiresConfirmation) {
      const userApproved = await new Promise<boolean>((resolve) => {
        this.pendingConfirmationRequest = {
          module: params.module,
          functionName: params.functionName,
          taskType,
          inputs: params.inputs,
          costLevel: info.costLevel,
          modelName: info.modelName,
          resolve: (approved) => {
            this.pendingConfirmationRequest = null;
            this.notify();
            resolve(approved);
          },
        };
        this.notify();
      });

      if (!userApproved) {
        throw new Error("Запрос отменен пользователем для контроля расходов");
      }
    }

    if (params.onConfirmedStart) {
      params.onConfirmedStart();
    }

    const cacheKey = this.generateInputHash(params.module, params.functionName, info.modelName, params.inputs);
    if (!params.bypassCache && this.cache[cacheKey] && (!params.images || params.images.length === 0)) {
      // Return cached
      const cachedResult = this.cache[cacheKey];
      
      // Track a cached request
      this.trackAiUsage({
        requestId: Math.random().toString(36).substring(7),
        module: params.module,
        functionName: params.functionName,
        taskType,
        selectedModel: info.modelName,
        status: "success",
        latencyMs: 12,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        promptText: params.inputs.join("\n"),
        responseText: cachedResult,
        cachedResultUsed: true,
        userConfirmedExpensiveTask: info.requiresConfirmation,
      });

      return cachedResult;
    }

    const start = Date.now();
    try {
      const bodyPayload = {
        actionName: params.actionName,
        specTitle: params.module,
        inputs: params.inputs,
        modelName: info.modelName,
        systemInstruction: params.systemInstruction,
        images: params.images,
      };

      const res = await fetch("/api/gemini/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      const latency = Date.now() - start;

      if (res.status >= 400 || data.error) {
        throw new Error(data.error || `Server status ${res.status}`);
      }

      const returnedResult = data.result;

      // Estimate tokens
      const promptChars = params.inputs.join(" ").length;
      const responseChars = returnedResult ? returnedResult.length : 0;
      const inputTokens = Math.max(1, Math.ceil(promptChars / 3.8));
      const outputTokens = Math.max(1, Math.ceil(responseChars / 3.6));
      const totalTokens = inputTokens + outputTokens;
      const cost = this.calculateCost(info.modelName, inputTokens, outputTokens);

      // Cache the result
      this.cache[cacheKey] = returnedResult;
      this.saveToStorage();

      this.trackAiUsage({
        requestId: Math.random().toString(36).substring(7),
        module: params.module,
        functionName: params.functionName,
        taskType,
        selectedModel: info.modelName,
        status: "success",
        latencyMs: latency,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost: cost,
        promptText: params.inputs.join("\n"),
        responseText: returnedResult,
        cachedResultUsed: false,
        userConfirmedExpensiveTask: info.requiresConfirmation,
      });

      return returnedResult;
    } catch (err: any) {
      const latency = Date.now() - start;
      this.trackAiUsage({
        requestId: Math.random().toString(36).substring(7),
        module: params.module,
        functionName: params.functionName,
        taskType,
        selectedModel: info.modelName,
        status: "failed",
        latencyMs: latency,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        errorMessage: err.message || "Failed to call Gemini proxy server",
        promptText: params.inputs.join("\n"),
        cachedResultUsed: false,
        userConfirmedExpensiveTask: info.requiresConfirmation,
      });
      throw err;
    }
  }
}
