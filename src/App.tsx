import React, { useState, useEffect } from 'react';
import { specData } from './data';
import { Sidebar } from './components/Sidebar';
import { IdeaPromptModule } from './components/IdeaPromptModule/IdeaPromptModule';
import { CharacterModule } from './components/CharacterModule/CharacterModule';
import { SpecDetail } from './components/SpecDetail';
import { ProjectStatusBar } from './components/ProjectStatusBar';
import { VisionOverview } from './components/VisionOverview';
import { AIAssistant, Message } from './components/AIAssistant';
import { AnimatePresence, motion } from 'motion/react';

import { ScenarioModule } from './components/ScenarioModule/ScenarioModule';
import { FrameGeneratorModule } from './components/FrameGeneratorModule/FrameGeneratorModule';
import { VideoGeneratorModule } from './components/VideoGeneratorModule/VideoGeneratorModule';
import { MusicModule } from './components/MusicModule/MusicModule';
import { VoiceModule } from './components/VoiceModule/VoiceModule';
import { AudioEditorModule } from './components/AudioEditorModule/AudioEditorModule';
import { VideoEditorModule } from './components/VideoEditorModule/VideoEditorModule';
import { ExportModule } from './components/ExportModule/ExportModule';
import { UsageModelsModule } from './components/UsageModelsModule';
import { AiCostModal } from './components/AiCostModal';
import { AiStore } from './services/aiStore';

export default function App() {
  const [activeStepId, setActiveStepId] = useState('vision');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  
  const [unlockedSteps, setUnlockedSteps] = useState<string[]>(specData.map(s => s.id));
  const [approvedSteps, setApprovedSteps] = useState<string[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: 'Привет! Я ваш ИИ-менеджер проекта. Отвечаю за перенос контекста между этапами, помогаю правильно настроить генераторы и проверяю пайплайн.'
    }
  ]);

  const handleSidebarAction = async (action: string, specTitle: string, inputs: string[]) => {
    setIsSidebarOpen(false);
    setIsAssistantOpen(true);
    
    const userMsg = action;
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg }]);
    
    const loadingId = Date.now().toString() + "-ai";
    setMessages(prev => [...prev, { id: loadingId, sender: 'ai', text: 'Думаю...' }]);

    try {
      const result = await AiStore.getInstance().requestExecution({
        module: "sidebar_assistant",
        functionName: "quickAction",
        inputs,
        actionName: userMsg,
      });

      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: result } : m));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: `Ошибка: ${err.message}` } : m));
    }
  };

  const handleApprove = (id: string, currentIndex: number) => {
    if (!approvedSteps.includes(id)) {
      setApprovedSteps([...approvedSteps, id]);
    }
    if (currentIndex < specData.length - 1) {
      const nextId = specData[currentIndex + 1].id;
      if (!unlockedSteps.includes(nextId)) {
        setUnlockedSteps([...unlockedSteps, nextId]);
      }
    }
  };

  const handleUnlockAll = () => {
    setUnlockedSteps(specData.map(s => s.id));
    setApprovedSteps(specData.map(s => s.id));
  };

  const handleDoubleTap = (e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapTime < 300) {
      if (window.innerWidth < 1024) {
        setIsFocusMode(prev => !prev);
      } else {
         // Also allow tablet/desktop if they want
         setIsFocusMode(prev => !prev);
      }
      setIsSidebarOpen(false);
      setIsAssistantOpen(false);
    }
    setLastTapTime(now);
  };

  const getActiveIndex = () => specData.findIndex(s => s.id === activeStepId);
  const activeSpec = specData.find(s => s.id === activeStepId);

  return (
    <div className="flex h-[100dvh] w-full max-w-[100vw] bg-[var(--color-space-950)] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 relative">
      {/* Mobile Backdrop for Sidebar */}
      {isSidebarOpen && !isFocusMode && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
        isFocusMode ? 'hidden' : 'xl:static xl:block'
      } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}`}>
        <Sidebar 
          steps={specData} 
          activeStepId={activeStepId} 
          unlockedSteps={unlockedSteps}
          approvedSteps={approvedSteps}
          onSelect={(id) => {
            setActiveStepId(id);
            setIsSidebarOpen(false);
          }} 
          onClose={() => setIsSidebarOpen(false)}
          onActionClick={handleSidebarAction}
        />
      </div>
      
      <main 
        className="flex-1 flex flex-col min-w-0 relative h-full touch-manipulation"
        onTouchEnd={handleDoubleTap}
        onDoubleClick={handleDoubleTap}
      >
        <ProjectStatusBar 
          activeStepIndex={getActiveIndex() !== -1 ? getActiveIndex() : 0} 
          unlockedSteps={unlockedSteps} 
          onUnlockAll={unlockedSteps.length < specData.length ? handleUnlockAll : undefined}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onToggleAssistant={() => setIsAssistantOpen(true)}
        />
        
        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pt-6 sm:pt-10 pb-20 relative custom-scrollbar bg-[var(--color-space-900)]">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[var(--color-space-950)] to-transparent pointer-events-none z-10"></div>
          
          <AnimatePresence mode="wait">
            {isFocusMode && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-space-800)] border border-[#00F0FF]/30 text-[#00F0FF] px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.2)] backdrop-blur-md pointer-events-none lg:hidden"
              >
                Фокус Режим
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeStepId === 'usage_models' ? (
              <UsageModelsModule key="usage-models" />
            ) : activeStepId === 'vision' ? (
              <VisionOverview key="vision-overview" />
            ) : activeStepId === 'step-1' ? (
              <IdeaPromptModule 
                key="step-1" 
                onApprove={() => handleApprove('step-1', getActiveIndex())} 
              />
            ) : activeStepId === 'step-2' ? (
              <CharacterModule 
                key="step-2" 
                onApprove={() => handleApprove('step-2', getActiveIndex())} 
              />
            ) : activeStepId === 'step-3' ? (
              <ScenarioModule 
                key="step-3" 
                onApprove={() => handleApprove('step-3', getActiveIndex())} 
              />
            ) : activeStepId === 'step-4' ? (
              <FrameGeneratorModule 
                key="step-4" 
                onApprove={() => handleApprove('step-4', getActiveIndex())} 
              />
            ) : activeStepId === 'step-5' ? (
              <VideoGeneratorModule 
                key="step-5" 
                onApprove={() => handleApprove('step-5', getActiveIndex())} 
              />
            ) : activeStepId === 'step-6' ? (
              <MusicModule 
                key="step-6" 
                onApprove={() => handleApprove('step-6', getActiveIndex())} 
              />
            ) : activeStepId === 'step-7' ? (
              <VoiceModule 
                key="step-7" 
                onApprove={() => handleApprove('step-7', getActiveIndex())} 
              />
            ) : activeStepId === 'step-8' ? (
              <AudioEditorModule
                key="step-8"
                onApprove={() => handleApprove('step-8', getActiveIndex())}
              />
            ) : activeStepId === 'step-9' ? (
              <VideoEditorModule
                key="step-9"
                onApprove={() => handleApprove('step-9', getActiveIndex())}
              />
            ) : activeStepId === 'step-10' ? (
              <ExportModule
                key="step-10"
                onApprove={() => handleApprove('step-10', getActiveIndex())}
              />
            ) : (
              activeSpec && (
                <SpecDetail 
                  key={activeSpec.id} 
                  spec={activeSpec} 
                  isApproved={approvedSteps.includes(activeSpec.id)}
                  onApprove={() => handleApprove(activeSpec.id, getActiveIndex())}
                />
              )
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Mobile Backdrop for Assistant */}
      {isAssistantOpen && !isFocusMode && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 2xl:hidden"
          onClick={() => setIsAssistantOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isFocusMode ? 'hidden' : '2xl:static 2xl:block'
      } ${isAssistantOpen ? 'translate-x-0' : 'translate-x-full 2xl:translate-x-0'}`}>
        <AIAssistant 
          activeStepId={activeStepId} 
          unlockedSteps={unlockedSteps} 
          approvedSteps={approvedSteps} 
          messages={messages}
          setMessages={setMessages}
          onApprove={(id, idx) => {
            handleApprove(id, idx);
            setIsAssistantOpen(false);
          }} 
          onNavigate={(id) => {
            setActiveStepId(id);
            setIsAssistantOpen(false);
          }} 
          onClose={() => setIsAssistantOpen(false)}
        />
      </div>

      <AiCostModal />
    </div>
  );
}
