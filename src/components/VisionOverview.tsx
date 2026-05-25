import React from 'react';
import { AppWindow, GitCommit, Combine, Workflow, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export function VisionOverview() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto w-full pb-20 text-slate-200"
    >
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Aura AI Studio</h1>
        <p className="text-lg text-[#00F0FF] font-medium leading-relaxed drop-shadow-[0_0_5px_rgba(0,240,255,0.3)]">
          Интерактивная UX/UI спецификация для полного цикла производства AI-видео.
          Премиальный SaaS-дашборд, объединяющий генеративные модели (Gemini, Nano Banano, Veo, Suno) в единый, структурированный рабочий процесс.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <OverviewCard 
          icon={<AppWindow className="text-[#00F0FF] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />}
          title="Темный Кибер-Интерфейс"
          description="Глубокая космическая база с голографическими 3D-тенями и неоновыми акцентами для эффекта присутствия в виртуальной лаборатории."
        />
        <OverviewCard 
          icon={<Combine className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />}
          title="Контекст Проекта"
          description="Система централизованной памяти, кэширующая ресурсы (персонажи, промпты, аудио), гарантируя непротиворечивость и связность всех шагов производства."
        />
        <OverviewCard 
          icon={<GitCommit className="text-[#B026FF] drop-shadow-[0_0_5px_rgba(176,38,255,0.8)]" />}
          title="Передача Контекста (Handoff)"
          description="Явная механика «Утвердить и заблокировать», которая защищает утвержденный этап и пробрасывает проверенные данные в следующие модули пайплайна."
        />
        <OverviewCard 
          icon={<Zap className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />}
          title="ИИ-Менеджер (Ассистент)"
          description="Глобальный AI-помощник (в правой боковой панели), который анализирует каждый шаг, правит промпты и сопровождает пользователя, выступая интеллектуальным куратором."
        />
      </div>

      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-[var(--color-space-800)] pb-2 text-white">
        <Workflow className="w-5 h-5 text-[#00F0FF]" /> Архитектура потока данных
      </h2>

      <div className="glass-card rounded-xl p-6 text-[13px] font-mono font-medium text-slate-300 leading-relaxed overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-[0.05] text-[#00F0FF]">
          <DatabaseIcon />
        </div>
        [Шаг 1] Идея {'->'} Системный Контекст (Тема, Настроение)<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
        [Шаг 2] Фото Лица {'->'} [NanoBanano] {'->'} Идентичность Персонажей (@Актеры)<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
        [Шаг 3] Текст Сцены {'->'} [Gemini] {'->'} Промпты Ключевых Кадров<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
        [Шаг 4] Логика Кадра + @Актеры {'->'} [NanoBanano] {'->'} Мастер-Кадры (PNG)<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
        [Шаг 5] Мастер-Кадры + Движение {'->'} [Veo / WanAi] {'->'} Видео-футажи (MP4)<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
        [Шаг 6/7] Сценарий {'->'} [Gemini TTS / Suno] {'->'} Речь и Музыка (WAV)<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
        [Шаг 8] Мультитрек {'->'} Синтез Аудио {'->'} Мастер Аудио-Микс<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;|<br/>
        [Шаг 9/10] Видео Клипы + Микс {'->'} Синхронизация {'->'} Очередь Рендера {'->'} Экспорт
      </div>
    </motion.div>
  );
}

function OverviewCard({ icon, title, description }: any) {
  return (
    <div className="glass-card rounded-xl p-5 hover:border-[#00F0FF] transition-colors shadow-lg overflow-hidden group">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgba(0,240,255,0.5)] to-transparent left-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="w-10 h-10 rounded-lg bg-[var(--color-space-900)] border border-[var(--color-space-700)] flex items-center justify-center mb-4 shadow-inner">
        {React.cloneElement(icon, { className: `w-5 h-5 ${icon.props.className}` })}
      </div>
      <h3 className="text-[15px] font-bold text-white mb-2 group-hover:text-[#00F0FF] transition-colors">{title}</h3>
      <p className="text-[13px] text-slate-400 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function DatabaseIcon() {
  return (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  );
}
