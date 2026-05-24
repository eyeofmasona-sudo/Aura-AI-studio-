import React, { useEffect, useState } from "react";
import { AiStore } from "../services/aiStore";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

export function AiCostModal() {
  const aiStore = AiStore.getInstance();
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setRequest(aiStore.pendingConfirmationRequest);
    };
    handleUpdate();
    const unsubscribe = aiStore.subscribe(handleUpdate);
    return unsubscribe;
  }, []);

  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-scale-in relative">
        <button
          onClick={() => request.resolve(false)}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-md font-black text-white uppercase tracking-wider">Подтверждение Расходов ИИ</h3>
            <p className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">COST-CONTROL ACTIVATED</p>
          </div>
        </div>

        <div className="py-5 flex flex-col gap-4 text-xs leading-relaxed text-slate-300">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Инициатор запроса:</span>
            <span className="text-sm font-extrabold text-slate-200 mt-1 block">
              {request.module.replace('_', ' ').toUpperCase()} &rsaquo; {request.functionName}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Предлагаемая Модель:</span>
            <span className="text-xs font-mono font-bold text-amber-300 mt-1 block">
              {request.modelName} (высокое качество)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400">
              Поскольку модель выбрана как тяжелая (<span className="text-rose-400 font-bold">strong/expensive</span>) или запускается пакетная/видеоконвертация, в Aura AI Studio активируется ручное подтверждение владельца аккаунта.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => request.resolve(false)}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all uppercase tracking-wide border border-slate-700"
          >
            Отмена
          </button>
          
          <button
            onClick={() => request.resolve(true)}
            className="flex-1 py-2.5 bg-[#00F0FF] hover:bg-[#6efcff] text-black rounded-lg text-xs font-extrabold transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
