import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const iconMap = {
  success: <CheckCircle size={16} className="text-emerald-400" />,
  error:   <XCircle size={16} className="text-red-400" />,
  info:    <Info size={16} className="text-blue-400" />,
  warning: <AlertTriangle size={16} className="text-amber-400" />,
};

const bgMap = {
  success: 'border-emerald-800/60 bg-emerald-950/80',
  error:   'border-red-800/60 bg-red-950/80',
  info:    'border-blue-800/60 bg-blue-950/80',
  warning: 'border-amber-800/60 bg-amber-950/80',
};

export default function ToastStack() {
  const { toasts, removeToast } = useApp();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-start gap-3 p-3 rounded-xl border backdrop-blur-sm
            shadow-xl animate-fade-in ${bgMap[t.type]}`}
        >
          <span className="mt-0.5 flex-shrink-0">{iconMap[t.type]}</span>
          <p className="flex-1 text-sm text-slate-200">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="text-slate-500 hover:text-slate-300">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
