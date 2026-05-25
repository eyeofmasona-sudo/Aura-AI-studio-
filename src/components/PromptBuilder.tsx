import React, { useState, useEffect } from 'react';
import { Terminal, Sparkles, Copy, Check, Tags, Wand2, Loader2 } from 'lucide-react';
import { AiStore } from '../services/aiStore';

const getPromptTags = (title: string) => {
  const t = (title || "").toLowerCase();
  
  if (t.includes('аудио') || t.includes('звук') || t.includes('микс')) {
    return {
      жанр: ['Epic Orchestral', 'Cyberpunk Synthwave', 'Dark Ambient', 'Cinematic', 'Lofi'],
      настроение: ['Tense', 'Uplifting', 'Melancholic', 'Aggressive', 'Mysterious'],
      инструменты: ['Heavy Brass', 'Analog Synths', 'Distorted Guitars', 'Deep Bass', 'Strings'],
      темп: ['Fast Paced (140+ BPM)', 'Mid-tempo (90-110 BPM)', 'Slow & Heavy', 'Dynamic', 'Rubato']
    };
  }
  
  if (t.includes('видео') || t.includes('рендер') || t.includes('монтаж')) {
    return {
      стиль_монтажа: ['Fast Cuts', 'Long Takes', 'Glitch Transitions', 'Smooth Fades', 'Dynamic Zoom'],
      цветокоррекция: ['Teal & Orange', 'Matrix Green', 'Desaturated', 'High Contrast', 'Neon Bright'],
      эффекты: ['VFX Overlay', 'Film Grain', 'Lens Flare', 'Chromatic Aberration', 'Motion Blur'],
      формат: ['TikTok/Reels (9:16)', 'Cinematic (21:9)', 'Standard (16:9)', '4K 60fps', 'Vintage VHS']
    };
  }
  
  if (t.includes('сценари') || t.includes('концепт') || t.includes('ассистент') || t.includes('модул')) {
    return {
      жанр: ['Sci-Fi', 'Cyberpunk', 'Dark Fantasy', 'Thriller', 'Slice of Life'],
      архетип: ['Antihero', 'Hacker', 'Detective', 'Bounty Hunter', 'AI Entity'],
      сеттинг: ['Dystopian City', 'Space Station', 'Post-apocalyptic Wasteland', 'Cyber-slum', 'Megacorp HQ'],
      тональность: ['Gritty', 'Philosophical', 'Action-packed', 'Noir', 'Satirical']
    };
  }

  // Default image/3d like tags
  return {
    жанр: ['Sci-Fi', 'Cyberpunk', 'Dark Fantasy', 'Thriller', 'Slice of Life'],
    освещение: ['Cinematic Lighting', 'Neon Glow', 'Volumetric Fog', 'High Contrast', 'Golden Hour'],
    стиль_камеры: ['Wide Angle', 'Macro Focus', 'Drone View', 'Dutch Angle', 'CCTV Style'],
    рендеринг: ['Unreal Engine 5', 'Octane Render', 'Ray Tracing', '8k Resolution', 'Hyperrealistic']
  };
};

export function PromptBuilder({ moduleTitle = "" }: { moduleTitle?: string }) {
  const PROMPT_TAGS = getPromptTags(moduleTitle);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    const parts = [];
    if (customText.trim()) parts.push(customText.trim());
    if (selectedTags.length > 0) parts.push(selectedTags.join(', '));
    
    // Add some "best practice" prompt modifiers based on AI engineering
    if (parts.length > 0) {
      parts.push('masterpiece, highly detailed, dramatic composition');
    }
    
    setFinalPrompt(parts.join(', '));
  }, [selectedTags, customText]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const copyToClipboard = () => {
    if (!finalPrompt) return;
    navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enhancePrompt = async () => {
    if (!finalPrompt || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const result = await AiStore.getInstance().requestExecution({
        module: "idea_prompt",
        functionName: "improveFinalPrompt",
        inputs: [finalPrompt],
        actionName: "Улучшить финальный промпт",
      });
      
      // Update the custom text with the enhanced response (removing extra quotes if any)
      const cleanResponse = result.replace(/^["']|["']$/g, '').trim();
      setCustomText(cleanResponse);
      setSelectedTags([]); // Clear tags as they are now baked into the enhanced text
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="bg-black/40 border border-[#00F0FF]/20 rounded-xl p-5 shadow-[0_0_15px_rgba(0,240,255,0.05)] w-full flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col xl:flex-row gap-6">
        
        {/* Left/Top Area: Tags & Input */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#B026FF] uppercase text-[10px] tracking-widest font-bold">
                <Tags className="w-3.5 h-3.5" />
                Быстрые Теги
              </div>
              
              <button
                onClick={enhancePrompt}
                disabled={!finalPrompt || isEnhancing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-[#B026FF]/20 to-[#00F0FF]/20 border border-[#00F0FF]/30 text-white text-[10px] uppercase font-bold tracking-widest hover:border-[#00F0FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              >
                {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Wand2 className="w-3.5 h-3.5"/>}
                {isEnhancing ? 'Магия...' : 'Улучшить ИИ'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(PROMPT_TAGS).map(([category, tags]) => (
                <div key={category} className="space-y-2">
                  <span className="text-[10px] text-slate-400 capitalize">{category.replace('_', ' ')}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`text-[10px] px-2 py-1 rounded-md transition-all border ${
                            isSelected 
                              ? 'bg-[#00F0FF]/20 border-[#00F0FF]/50 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                              : 'bg-black/40 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <span className="text-[10px] text-slate-400 mb-2 block font-bold tracking-wider uppercase">Вставка и написание текста</span>
               <textarea 
                 value={customText}
                 onChange={(e) => setCustomText(e.target.value)}
                 placeholder="Напишите или вставьте ваш промпт, диалог или концепт..."
                 className="w-full bg-black/50 border border-[var(--color-space-700)] rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-[#00F0FF]/50 transition-colors placeholder:text-slate-600 resize-none h-24 custom-scrollbar shadow-inner focus:shadow-[0_0_15px_rgba(0,240,255,0.1)]"
               />
             </div>
             
             <div>
               <span className="text-[10px] text-slate-400 mb-2 block font-bold tracking-wider uppercase">Загрузка Медиа (Music/Audio)</span>
               <label className="flex flex-col items-center justify-center gap-2 w-full h-24 bg-black/40 border-2 border-dashed border-slate-700 rounded-lg hover:border-[#B026FF] hover:bg-[#B026FF]/10 cursor-pointer transition-all group">
                 <input type="file" accept="audio/*" className="hidden" />
                 <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-[#B026FF]/20 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-[#B026FF]">
                       <path d="M9 18V5l12-2v13"></path>
                       <circle cx="6" cy="18" r="3"></circle>
                       <circle cx="18" cy="16" r="3"></circle>
                     </svg>
                   </div>
                   <span className="text-[11px] font-bold text-slate-300 group-hover:text-slate-100 uppercase tracking-widest">Upload Media</span>
                 </div>
                 <span className="text-[9px] text-slate-500 text-center px-4">Перетащите файл или кликните для выбора (.mp3, .wav, .png)</span>
               </label>
             </div>
          </div>
        </div>

        {/* Right/Bottom Area: Output Display */}
        <div className="xl:w-[400px] flex flex-col bg-[var(--color-space-950)] border border-[rgba(0,240,255,0.3)] rounded-xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[#00F0FF] text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">
              <Terminal className="w-3.5 h-3.5" /> Сгенерированный Промпт
            </span>
            <button 
              onClick={copyToClipboard}
              className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-black/40 hover:bg-[#00F0FF]/20 border border-[var(--color-space-700)] hover:border-[#00F0FF]/50 text-slate-300 hover:text-[#00F0FF]'}`}
              title="Копировать"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <div className="flex-1 bg-black/60 rounded-lg p-4 border border-slate-800 shadow-inner overflow-y-auto custom-scrollbar relative z-10 min-h-[150px]">
            {finalPrompt ? (
               <p className="text-[13px] text-slate-300 font-mono leading-relaxed break-words">
                 {finalPrompt}
               </p>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 opacity-60">
                 <Wand2 className="w-6 h-6 mb-1" />
                 <span className="text-[11px] uppercase tracking-widest font-bold">Ожидание Ввода</span>
                 <span className="text-[10px] text-center max-w-[200px]">Выберите теги или введите текст для формирования промпта</span>
               </div>
            )}
          </div>
          
          {finalPrompt && (
             <div className="mt-4 relative z-10 flex items-center justify-center gap-2 text-[9px] text-[#B026FF] uppercase tracking-widest font-bold font-mono py-2 rounded bg-[#B026FF]/10 border border-[#B026FF]/20">
               <Sparkles className="w-3 h-3" /> Успешно Скомпилировано
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
