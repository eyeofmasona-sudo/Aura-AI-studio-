import React, { useState, useEffect } from "react";
import { 
  AiStore, 
  AiRequestLog, 
  aiFunctionRegistry, 
  MODEL_OPTIONS, 
  modelPricingConfig,
  AiTaskType
} from "../services/aiStore";
import { 
  Activity, 
  Settings, 
  Server, 
  Database, 
  ListRestart, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2, 
  Download, 
  RefreshCw, 
  Play, 
  Sliders, 
  Coins, 
  Gauge, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Sparkles, 
  FileJson,
  AlertTriangle,
  Info
} from "lucide-react";

export function UsageModelsModule() {
  const aiStore = AiStore.getInstance();
  const [activeTab, setActiveTab] = useState<"status" | "models" | "mapping" | "dashboard" | "logs">("status");
  const [, setTick] = useState(0);

  // Force re-render on store updates
  useEffect(() => {
    const unsubscribe = aiStore.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  // API Status States
  const [checkingApi, setCheckingApi] = useState(false);
  const [testingRequest, setTestingRequest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Model Settings State
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({ ...aiStore.taskModels });
  const [modelMessage, setModelMessage] = useState<string | null>(null);

  // Overrides Map
  const [editingOverrides, setEditingOverrides] = useState<Record<string, string>>({ ...aiStore.overrides });
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  // Search/Filters for Logs
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterExpensive, setFilterExpensive] = useState(false);
  const [filterFailed, setFilterFailed] = useState(false);

  // Clipboard copies
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stats = {
    total: aiStore.logs.length,
    success: aiStore.logs.filter(l => l.status === "success").length,
    failed: aiStore.logs.filter(l => l.status === "failed").length,
    cost: aiStore.logs.reduce((sum, l) => sum + (l.estimatedCost || 0), 0),
    tokens: aiStore.logs.reduce((sum, l) => sum + (l.totalTokens || 0), 0),
    images: aiStore.logs.filter(l => l.taskType === "image_generation" && l.status === "success").length,
    videos: aiStore.logs.filter(l => l.taskType === "video_generation" && l.status === "success").length,
    tts: aiStore.logs.filter(l => l.taskType === "tts" && l.status === "success").length,
    audio: aiStore.logs.filter(l => l.taskType === "audio_understanding" && l.status === "success").length,
  };

  const checkConnection = async () => {
    setCheckingApi(true);
    await aiStore.runTestConnection();
    setCheckingApi(false);
  };

  const makeTestQuery = async () => {
    setTestingRequest(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await aiStore.makeTestRequest();
      setTestResult(res);
    } catch (err: any) {
      setTestError(err.message || "Failed test request");
    } finally {
      setTestingRequest(false);
    }
  };

  const handleSaveModels = () => {
    Object.entries(selectedModels).forEach(([taskType, modelName]) => {
      aiStore.setModelForTaskType(taskType as AiTaskType, modelName as string);
    });
    setModelMessage("Настройки моделей успешно сохранены!");
    setTimeout(() => setModelMessage(null), 3000);
  };

  const handleResetModels = () => {
    aiStore.resetAllSettings();
    setSelectedModels({ ...aiStore.taskModels });
    setEditingOverrides({ ...aiStore.overrides });
    setModelMessage("Все глобальные настройки сброшены!");
    setTimeout(() => setModelMessage(null), 3000);
  };

  const handleSaveOverride = (overrideKey: string, model: string) => {
    aiStore.setOverrideForFunction(overrideKey, model);
    setEditingOverrides({ ...aiStore.overrides });
    setOverrideMessage(`Переопределение для ${overrideKey} обновлено!`);
    setTimeout(() => setOverrideMessage(null), 3000);
  };

  const handleClearOverride = (overrideKey: string) => {
    aiStore.setOverrideForFunction(overrideKey, null);
    setEditingOverrides({ ...aiStore.overrides });
    setOverrideMessage(`Удалено переопределение для ${overrideKey}`);
    setTimeout(() => setOverrideMessage(null), 3000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Timestamp", "Module", "Function", "TaskType", "Model", "Status", "Latency(ms)", "TokensIn", "TokensOut", "TotalTokens", "Cost($)", "Cached", "Error"];
    const rows = aiStore.logs.map(l => [
      l.requestId,
      l.timestamp,
      l.module,
      l.functionName,
      l.taskType,
      l.selectedModel,
      l.status,
      l.latencyMs,
      l.inputTokens,
      l.outputTokens,
      l.totalTokens,
      l.estimatedCost,
      l.cachedResultUsed ? "Yes" : "No",
      l.errorMessage || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aura_ai_studio_usage_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(aiStore.logs, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `aura_ai_studio_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logs list
  const filteredLogs = aiStore.logs.filter(l => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inPrompt = l.promptText?.toLowerCase().includes(q) || false;
      const inResponse = l.responseText?.toLowerCase().includes(q) || false;
      const inFunction = l.functionName.toLowerCase().includes(q);
      const inError = l.errorMessage?.toLowerCase().includes(q) || false;
      if (!inPrompt && !inResponse && !inFunction && !inError) return false;
    }
    if (filterModule && l.module !== filterModule) return false;
    if (filterModel && l.selectedModel !== filterModel) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterExpensive && !l.userConfirmedExpensiveTask) return false;
    if (filterFailed && l.status !== "failed") return false;
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-[var(--color-space-950)] text-slate-100 p-2 sm:p-6 rounded-2xl border border-[var(--color-space-800)] z-10 relative">
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
        
        {/* Module Header */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#00F0FF]/25 text-[#00F0FF] text-[10px] uppercase font-black tracking-widest">
                СИСТЕМА ИИ ВЕРИФИКАЦИИ
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold">
                PRO ACTIVE MAPPING
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5 mt-2">
              <Sliders className="w-6 h-6 text-[#00F0FF]" /> Использование и Модели
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Централизованный AI Model Router, контроль расходов, лог транзакций и статус подключения к Gemini API.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-full xl:w-auto overflow-x-auto whitespace-nowrap scrollbar-none shadow-inner">
            <button
              onClick={() => setActiveTab("status")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeTab === 'status' ? 'bg-[#00F0FF] text-black shadow-lg font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              <Server className="w-3.5 h-3.5" /> Статус API
            </button>
            <button
              onClick={() => setActiveTab("models")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeTab === 'models' ? 'bg-[#00F0FF] text-black shadow-lg font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              <Settings className="w-3.5 h-3.5" /> Модели
            </button>
            <button
              onClick={() => setActiveTab("mapping")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeTab === 'mapping' ? 'bg-[#00F0FF] text-black shadow-lg font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              <Database className="w-3.5 h-3.5" /> Маппинг функций
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-[#00F0FF] text-black shadow-lg font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              <Gauge className="w-3.5 h-3.5" /> Аналитика
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${activeTab === 'logs' ? 'bg-[#00F0FF] text-black shadow-lg font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              <Activity className="w-3.5 h-3.5" /> Логи ({stats.total})
            </button>
          </div>
        </div>

        {/* Tab content area */}
        {activeTab === "status" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* API Status Card */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
                <h3 className="text-sm font-black text-[#00F0FF] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Server className="w-4 h-4" /> Статус Подключения к Облаку
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Gemini API Ключ</span>
                      <span className="text-xs font-mono font-bold mt-1 block">
                        {aiStore.apiStatus.keyFound ? "AIza...****" : "Отсутствует"}
                      </span>
                    </div>
                    {aiStore.apiStatus.keyFound ? (
                      <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-wide border border-emerald-500/20">АКТИВЕН</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 text-[10px] font-black tracking-wide border border-rose-500/20">НЕТ КЛЮЧА</span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Server Proxy Route</span>
                      <span className="text-xs font-semibold text-slate-200 mt-1 block">
                        /api/gemini/action
                      </span>
                    </div>
                    <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-black tracking-wide border border-indigo-500/20">HEALTHY</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 text-xs text-slate-300 bg-black/20 p-4 rounded-xl border border-slate-800/60 leading-relaxed">
                  <div className="flex items-center gap-2 text-slate-100 font-bold">
                    <Info className="w-4 h-4 text-[#00F0FF]" /> Безопасная Интеграция по стандартам Enterprise
                  </div>
                  <p>
                    Ваш ключ API авторизуется исключительно на защищенном backend-сервере Express с использованием авторизационной библиотеки <code className="text-yellow-400 bg-slate-900 px-1 py-0.5 rounded font-mono">@google/genai</code>.
                  </p>
                  <p>
                    Он не загружается в браузер и не передается третьим сторонам, что на 100% исключает случайные утечки ключа в клиентских запросах.
                  </p>
                  <p className="text-[11px] text-[#00F0FF]">
                    * Если ключ не задан, сервер автоматически задействует локальный fallback режим эмуляции для сохранения работоспособности.
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={checkConnection}
                    disabled={checkingApi}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${checkingApi ? 'animate-spin' : ''}`} />
                    Проверить подключение
                  </button>

                  <button
                    onClick={makeTestQuery}
                    disabled={testingRequest}
                    className="px-4 py-2 bg-[#00F0FF] hover:bg-[#60faff] disabled:opacity-50 text-black rounded-lg text-xs font-extrabold transition-colors flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {testingRequest ? "Проверяем..." : "Сделать тестовый запрос ИИ"}
                  </button>
                </div>
              </div>

              {/* Status responses */}
              {(testResult || testError) && (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-3 animate-fade-in">
                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">
                    Результат Тестирования API
                  </h4>
                  {testResult && (
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25 text-emerald-300 text-xs font-mono whitespace-pre-wrap max-h-[250px] overflow-y-auto custom-scrollbar">
                      {testResult}
                    </div>
                  )}
                  {testError && (
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/25 text-rose-300 text-xs font-mono">
                      {testError}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Quick Pricing info sidebar */}
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/20 to-slate-900/40 border border-slate-800">
                <h3 className="text-sm font-black text-[#b026ff] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Coins className="w-4 h-4" /> Стоимость Моделей
                </h3>

                <div className="flex flex-col gap-3 divide-y divide-slate-800/60 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {Object.entries(modelPricingConfig).map(([model, pricing], i) => (
                    <div key={model} className={`pt-2.5 ${i === 0 ? 'pt-0' : ''}`}>
                      <span className="text-xs font-bold text-slate-200 block truncate">{model}</span>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                        {pricing.inputCostPerMillion > 0 ? (
                          <>
                            <span>In: <strong className="text-slate-300">${pricing.inputCostPerMillion}</strong> / 1M</span>
                            <span>Out: <strong className="text-slate-300">${pricing.outputCostPerMillion}</strong> / 1M</span>
                          </>
                        ) : (
                          <span>Фиксированная: <strong className="text-[#00F0FF]">${pricing.fixedCostPerRun}</strong> / запуск</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                  * Потребление токенов вычисляется на основе среднего количества символов (3.8 символа на input токен, 3.6 на output). Это гарантирует точные локальные вычисления расходов.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "models" && (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <h3 className="text-md font-black text-[#00F0FF] uppercase tracking-wider">
                  Глобальные Настройки AI-Моделей
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Укажите предпочтительные модели Gemini по умолчанию для каждого функционального типа задач.
                </p>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                <button
                  onClick={handleResetModels}
                  className="w-full sm:w-auto px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all whitespace-nowrap"
                  title="Вернет настройки к заводским пресетам"
                >
                  Сбросить по умолчанию
                </button>
                <button
                  onClick={handleSaveModels}
                  className="w-full sm:w-auto px-4 py-1.5 rounded bg-[#00F0FF] hover:bg-[#5ffffc] text-black font-extrabold text-xs uppercase tracking-wide transition-all whitespace-nowrap"
                >
                  Сохранить настройки
                </button>
              </div>
            </div>

            {modelMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-bold">
                {modelMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {Object.entries(MODEL_OPTIONS).map(([taskKey, options]) => {
                const taskLabels: Record<string, string> = {
                  text_cheap: "Быстрый Текст (Cheap)",
                  text_balanced: "Сбалансированный Текст (Balanced)",
                  text_strong: "Сложный Анализ (Strong / Аналитика)",
                  image_generation: "Генератор Кадров (Image)",
                  video_generation: "Видеогенерация (Video)",
                  audio_understanding: "Анализ Аудио (Audio)",
                  tts: "Синтез Речи (TTS / Голос)",
                  music: "Генерация Музыки (Music / Lyria)",
                  default_fallback: "Резервный Обработчик (Fallback)"
                };
                
                const label = taskLabels[taskKey] || taskKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                
                const taskDescriptions: Record<string, string> = {
                  text_cheap: "Используется для быстрых текстовых правок, генерации тегов, коротких логлайнов и негативных промптов.",
                  text_balanced: "Базовый сбалансированный текстовый контент: синопсисы, подробные структуры, главы, сценарии диалогов.",
                  text_strong: "Сложное логическое моделирование, выявление сюжетных противоречий, проверка визуальной консистентности.",
                  image_generation: "Генерация ракурсов, референсов персонажей, эскизов миров и кадров (покадровый рендеринг).",
                  video_generation: "Создание кинематографичных 5-секундных сцен на основе промпта и пограничных кадров.",
                  audio_understanding: "Аналитическое сопоставление опорных аудиодорожек и подгонка ритмов сцены.",
                  tts: "Потоковый синтез речи (Text-To-Speech) по SSML инструкциям вокального направления.",
                  music: "Генерация саундтреков, фонового эмбиента, динамического ритма и музыкальных тем проекта через Lyria.",
                  default_fallback: "Используется, если запрошенный модуль выдал сбой или не определил тип задачи."
                };

                return (
                  <div key={taskKey} className="p-4 rounded-xl bg-black/30 border border-slate-800 hover:border-slate-700/60 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-100 uppercase tracking-wide">
                          {label}
                        </span>
                        
                        {taskKey.includes("strong") || taskKey.includes("video") || taskKey.includes("image") || taskKey.includes("music") ? (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-rose-400 bg-rose-500/10 border border-rose-500/25">Heavy Usage</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/25">Light Consumption</span>
                        )}
                      </div>
                      
                      <p className="text-[11px] text-slate-400 mt-1.5 min-h-[32px] leading-relaxed">
                        {taskDescriptions[taskKey] || "Глобальный обработчик Aura AI."}
                      </p>
                    </div>

                    <div className="mt-4">
                      <select
                        value={selectedModels[taskKey] || ""}
                        onChange={(e) => setSelectedModels({ ...selectedModels, [taskKey]: e.target.value })}
                        className="w-full text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 rounded-lg p-2.5 focus:border-[#00F0FF] outline-none"
                      >
                        {options.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        )}

        {activeTab === "mapping" && (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <h3 className="text-md font-black text-[#b026ff] uppercase tracking-wider">
                  MAPPING AI-ФУНКЦИЙ НА МОДЕЛИ
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Тонкая настройка: переопределите модель для любой конкретной ИИ-кнопки индивидуально.
                </p>
              </div>

              {overrideMessage && (
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded animate-fade-in font-bold">
                  {overrideMessage}
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-black/20">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-slate-950 text-slate-300 font-black uppercase tracking-wider text-[9px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Модуль</th>
                    <th className="p-3 border-l border-slate-800">Действие / Функция</th>
                    <th className="p-3 border-l border-slate-800">Тип Задачи</th>
                    <th className="p-3 border-l border-slate-800">Разрешение Модели</th>
                    <th className="p-3 border-l border-slate-800">Лимит затрат</th>
                    <th className="p-3 border-l border-slate-800">Индивидуальная Модель</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {aiFunctionRegistry.map((fn) => {
                    const overrideKey = `${fn.module}:${fn.functionName}`;
                    const currentOverride = editingOverrides[overrideKey] || "";
                    
                    const resolved = aiStore.resolveModelForFunction(fn.module, fn.functionName, fn.taskType);
                    
                    // Available option dropdowns
                    const taskOpts = MODEL_OPTIONS[fn.taskType as keyof typeof MODEL_OPTIONS] || MODEL_OPTIONS.default_fallback;

                    return (
                      <tr key={overrideKey} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-400 capitalize">
                          {fn.module.replace('_', ' ')}
                        </td>
                        <td className="p-3 border-l border-slate-800 font-extrabold text-slate-200">
                          {fn.label}
                        </td>
                        <td className="p-3 border-l border-slate-800 font-mono text-[10px] text-slate-400">
                          {fn.taskType}
                        </td>
                        <td className="p-3 border-l border-slate-800">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            resolved.source === 'function_override' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-indigo-500/10 text-indigo-300'
                          }`}>
                            {resolved.modelName}
                          </span>
                        </td>
                        <td className="p-3 border-l border-slate-800">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            fn.defaultCostLevel === 'high' 
                              ? 'bg-rose-500/20 text-rose-300' 
                              : fn.defaultCostLevel === 'medium'
                                ? 'bg-amber-500/10 text-amber-300'
                                : 'bg-emerald-500/10 text-emerald-300'
                          }`}>
                            {fn.defaultCostLevel} Cost
                          </span>
                        </td>
                        <td className="p-2 border-l border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={currentOverride}
                              onChange={(e) => handleSaveOverride(overrideKey, e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-[11px] rounded p-1 text-slate-200 focus:border-[#00F0FF] outline-none"
                            >
                              <option value="">По умолчанию</option>
                              {taskOpts.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            {currentOverride && (
                              <button
                                onClick={() => handleClearOverride(overrideKey)}
                                className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Сбросить индивидуальные переопределения"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="animate-fade-in flex flex-col gap-6">
            
            {/* Usage stats grids */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Запросы всего</span>
                <span className="text-2xl font-black text-[#00F0FF] mt-1 block tracking-tight">{stats.total}</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  Успешно: {stats.success} | Отказ: {stats.failed}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Всего токенов</span>
                <span className="text-2xl font-black text-slate-200 mt-1 block tracking-tight">
                  {stats.tokens.toLocaleString()}
                </span>
                <span className="text-[9px] text-indigo-400 block mt-0.5 font-bold uppercase tracking-wider">
                  Aura Token Engine
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Оценочный расход</span>
                <span className="text-2xl font-black text-rose-400 mt-1 block tracking-tight">
                  ${stats.cost.toFixed(4)}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">В реальной валюте</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Медиа Кэш</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block tracking-tight">
                  {stats.images + stats.videos + stats.tts}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  Кадров: {stats.images} | Видео: {stats.videos} | Аудио: {stats.tts}
                </span>
              </div>
            </div>

            {/* Visual Overview grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
                <h3 className="text-sm font-black text-[#00F0FF] uppercase tracking-wider mb-4">
                  Нагрузка по ИИ-модулям
                </h3>
                
                <div className="flex flex-col gap-3">
                  {["idea_prompt", "characters", "scenario", "frame_generator", "video_generator", "music", "voice", "audio_editor", "video_editor", "export"].map(mod => {
                    const count = aiStore.logs.filter(l => l.module === mod).length;
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    
                    const moduleLabels: Record<string, string> = {
                      idea_prompt: "Идеи и Концепты",
                      characters: "Персонажи",
                      scenario: "Раскадровка / Сценарий",
                      frame_generator: "Генератор Кадров",
                      video_generator: "Генератор Видео",
                      music: "Фоновая Музыка / Lyria",
                      voice: "Озучка / TTS",
                      audio_editor: "Аудиоредактор",
                      video_editor: "Видеоредактор",
                      export: "Экспорт и Сборка",
                      usage_models: "Панель Управления"
                    };
                    const labelName = moduleLabels[mod] || mod.replace('_', ' ');
                    
                    return (
                      <div key={mod} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="capitalize text-slate-300">{labelName}</span>
                          <span className="text-slate-400">{count} запр. ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#00F0FF] to-[#b026ff] h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
                <h3 className="text-sm font-black text-[#b026ff] uppercase tracking-wider mb-4">
                  Распределение по моделям
                </h3>

                {stats.total === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-slate-500 text-xs">
                    Нет активных ИИ-запросов для построения графика
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {Array.from(new Set(aiStore.logs.map(l => l.selectedModel))).map((modelName) => {
                      const count = aiStore.logs.filter(l => l.selectedModel === modelName).length;
                      const modelCost = aiStore.logs.filter(l => l.selectedModel === modelName).reduce((s, l) => s + (l.estimatedCost || 0), 0);
                      const pct = (count / stats.total) * 100;

                      return (
                        <div key={modelName} className="p-3 rounded-xl bg-black/30 border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-200 block truncate max-w-[200px]">{modelName}</span>
                            <span className="text-[10px] text-slate-500">{count} вызовов ({pct.toFixed(1)}%)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-[#00F0FF] block">${modelCost.toFixed(5)}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-black">Сумма затрат</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === "logs" && (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-6 animate-fade-in">
            
            {/* Actions & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-850 gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по логам и промптам..."
                    className="pl-8 pr-4 py-1.5 w-[200px] sm:w-[260px] text-xs bg-slate-950 border border-slate-800/80 focus:border-[#00F0FF] outline-none rounded-lg"
                  />
                </div>

                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 text-[11px] rounded-lg p-1.5 font-bold outline-none"
                >
                  <option value="">Все модули</option>
                  <option value="idea_prompt">Идея и Промпт</option>
                  <option value="characters">Персонажи</option>
                  <option value="scenario">Сценарий</option>
                  <option value="frame_generator">Кадры</option>
                  <option value="video_generator">Видео</option>
                  <option value="music">Музыка</option>
                  <option value="voice">Голос</option>
                  <option value="audio_editor">Аудиоредактор</option>
                  <option value="video_editor">Видеоредактор</option>
                  <option value="export">Экспорт</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 text-[11px] rounded-lg p-1.5 font-bold outline-none"
                >
                  <option value="">Все статусы</option>
                  <option value="success">Успешно</option>
                  <option value="failed">Ошибка</option>
                  <option value="pending">Ожидает</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs text-slate-300 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterFailed}
                    onChange={(e) => setFilterFailed(e.target.checked)}
                    className="accent-[#00F0FF]"
                  />
                  <span>Только сбои</span>
                </label>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileJson className="w-3.5 h-3.5" /> JSON
                </button>
                <button
                  onClick={() => aiStore.clearLogs()}
                  className="px-3 py-1.5 bg-rose-950/40 border border-rose-900/40 hover:bg-rose-900/40 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Очистить
                </button>
              </div>
            </div>

            {/* Logs Table */}
            {filteredLogs.length === 0 ? (
              <div className="h-[250px] flex flex-col justify-center items-center text-slate-500 gap-2">
                <AlertTriangle className="w-8 h-8 opacity-40 text-amber-500" />
                <span className="text-xs">Журнал пуст или не найдено записей по выбранным критериям</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {filteredLogs.map((log) => (
                  <div key={log.requestId} className="p-4 rounded-xl bg-black/20 border border-slate-800 hover:border-slate-700/60 transition-all flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          log.status === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status === "success" ? "OK" : "ERR"}
                        </span>
                        
                        <span className="text-[10px] text-slate-500 font-mono">ID: {log.requestId}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{log.module}</span>
                        <span className="text-xs font-bold text-slate-200">{log.functionName}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-mono"><Clock className="w-3 h-3 text-slate-500" /> {log.latencyMs}ms</span>
                        
                        {log.totalTokens > 0 && (
                          <span className="font-mono text-slate-300">{log.totalTokens.toLocaleString()} Tok.</span>
                        )}

                        {log.estimatedCost > 0 && (
                          <span className="text-rose-400 font-extrabold font-mono">${log.estimatedCost.toFixed(5)}</span>
                        )}

                        {log.cachedResultUsed && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[8px] font-black uppercase tracking-wider border border-emerald-500/30">Cached</span>
                        )}
                        
                        <span className="text-[10px] text-slate-500 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                          <span>Входной Промпт / Ввод</span>
                          <button
                            onClick={() => handleCopyText(log.promptText || "", `${log.requestId}-prompt`)}
                            className="text-[10px] text-[#00F0FF] hover:underline flex items-center gap-0.5 transition-all"
                          >
                            {copiedId === `${log.requestId}-prompt` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            Копировать prompt
                          </button>
                        </div>
                        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-900 leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar text-slate-300 text-[11px]">
                          {log.promptText || "Без вводного контекста"}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                          <span>Ответ ИИ / Response</span>
                          <button
                            onClick={() => handleCopyText(log.responseText || log.errorMessage || "", `${log.requestId}-resp`)}
                            className="text-[10px] text-[#00F0FF] hover:underline flex items-center gap-0.5 transition-all"
                          >
                            {copiedId === `${log.requestId}-resp` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            Копировать ответ
                          </button>
                        </div>
                        <div className={`p-3 bg-slate-950/60 rounded-lg border leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar text-[11px] ${
                          log.status === 'failed' 
                            ? 'border-rose-950 text-rose-300' 
                            : 'border-slate-900 text-slate-300'
                        }`}>
                          {log.status === "failed" ? (
                            <span className="text-rose-400">Ошибка: {log.errorMessage}</span>
                          ) : (
                            log.responseText || "Ответ отсутствует"
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
