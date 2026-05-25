import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { specData } from '../data';
import { AiStore } from '../services/aiStore';

export type Message = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  action?: {
    label: string;
    stepId?: string;
    type: 'approve' | 'navigate';
  };
};

export function AIAssistant({ 
  activeStepId, 
  unlockedSteps,
  approvedSteps,
  messages,
  setMessages,
  onApprove,
  onNavigate,
  onClose
}: {
  activeStepId: string;
  unlockedSteps: string[];
  approvedSteps: string[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onApprove: (id: string, index: number) => void;
  onNavigate: (id: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg }]);
    setInput('');
    
    // Add loading AI msg
    const loadingId = Date.now().toString() + "-ai";
    setMessages(prev => [...prev, { id: loadingId, sender: 'ai', text: 'Думаю...' }]);

    try {
      const result = await AiStore.getInstance().requestExecution({
        module: "ai_assistant",
        functionName: "chat",
        inputs: [activeStepId, "Чат помощника"],
        actionName: userMsg,
      });

      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: result } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: `Ошибка: ${err.message}` } : m));
    }
  };

  const handleAction = (msgAction?: Message['action']) => {
    if (!msgAction) return;
    if (msgAction.type === 'approve' && msgAction.stepId) {
      const idx = specData.findIndex(s => s.id === msgAction.stepId);
      onApprove(msgAction.stepId, idx);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: `Успешно! Все ресурсы для этого этапа заблокированы от случайных изменений и доступны остальным модулям.`
      }]);
    } else if (msgAction.type === 'navigate' && msgAction.stepId) {
      onNavigate(msgAction.stepId);
    }
  };

  return (
    <div className="w-80 glass-panel border-l border-[var(--color-space-800)] h-full flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-30 shrink-0 relative">
      <div className="p-4 border-b border-[var(--color-space-800)] bg-black/30 flex items-center gap-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF] opacity-[0.05] blur-3xl rounded-full"></div>
        <div className="w-9 h-9 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <Bot className="w-5 h-5 text-[#00F0FF]" />
        </div>
        <div className="relative z-10 flex-1">
          <h3 className="text-sm font-bold text-white leading-none">ИИ-Помощник</h3>
          <div className="flex items-center gap-1.5 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_8px_rgba(0,240,255,1)]"></div>
             <p className="text-[10px] text-[#00F0FF] font-semibold uppercase tracking-wider drop-shadow-sm">Подключен (Gemini)</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden relative z-10 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-black/10">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex flex-col max-w-[95%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div className={`p-3.5 rounded-[18px] text-[13px] leading-relaxed shadow-lg ${msg.sender === 'user' ? 'bg-gradient-to-br from-[#00F0FF]/80 to-[#B026FF]/80 text-white rounded-br-sm border border-white/20 backdrop-blur-md' : 'glass-card text-slate-200 rounded-bl-sm border-[var(--color-space-700)]'}`}>
                {msg.text}
              </div>
              {msg.action && (
                <button 
                  onClick={() => handleAction(msg.action)}
                  className="mt-2 text-[11px] flex items-center gap-1.5 cyber-btn text-[#00F0FF] px-3 py-2 rounded-xl font-bold transition-all active:scale-95"
                >
                  {msg.action.type === 'approve' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" /> : <ArrowRight className="w-3.5 h-3.5 text-[#00F0FF]" />}
                  {msg.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black/40 border-t border-[var(--color-space-800)] backdrop-blur-md">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Спросите меня о пайплайне..." 
            className="w-full bg-[var(--color-space-900)] border border-[var(--color-space-700)] text-slate-200 text-[13px] rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] focus:border-[#00F0FF] transition-all placeholder:text-slate-500 shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#B026FF] hover:brightness-110 disabled:from-[var(--color-space-700)] disabled:to-[var(--color-space-700)] disabled:text-slate-500 text-white flex items-center justify-center transition-all shadow-[0_0_10px_rgba(0,240,255,0.4)] disabled:shadow-none relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity"></div>
            <Send className="w-3.5 h-3.5 ml-0.5 relative z-10" />
          </button>
        </form>
      </div>
    </div>
  );
}
