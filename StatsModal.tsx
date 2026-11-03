import React from 'react';
import { QuestionData, QuestionStatus } from './types.ts';
import { Trophy, CheckCircle2, XCircle, RotateCcw, Clock, ArrowRight, X } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionData[];
  statuses: Record<number, QuestionStatus>;
  secondsLeft: number;
  onRestart: () => void;
  onSelectQuestion: (index: number) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  questions,
  statuses,
  secondsLeft,
  onRestart,
  onSelectQuestion,
}) => {
  if (!isOpen) return null;

  const total = questions.length;
  let correct = 0;
  let incorrect = 0;
  let passed = 0;
  let unanswered = 0;

  questions.forEach((q) => {
    const s = statuses[q.id] || 'unanswered';
    if (s === 'correct') correct++;
    else if (s === 'incorrect') incorrect++;
    else if (s === 'passed') passed++;
    else unanswered++;
  });

  const timeUsedSeconds = Math.max(0, 1200 - secondsLeft);
  const usedMins = Math.floor(timeUsedSeconds / 60);
  const usedSecs = timeUsedSeconds % 60;
  const timeUsedFormatted = `${usedMins}m ${usedSecs.toString().padStart(2, '0')}s`;

  const percentage = Math.round((correct / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Resultados de Pasapalabra
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-armenian">
                Խաղի արդյունքները — Ֆուտբոլային գիտելիքներ 🇪🇸🇦🇲
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Score Cards */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
              <div className="text-3xl font-black text-emerald-400">{correct}</div>
              <div className="text-xs font-bold text-emerald-300 mt-1">Aciertos (Ճիշտ)</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40">
              <div className="text-3xl font-black text-rose-400">{incorrect}</div>
              <div className="text-xs font-bold text-rose-300 mt-1">Fallos (Սխալ)</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40">
              <div className="text-3xl font-black text-amber-400">{passed}</div>
              <div className="text-xs font-bold text-amber-300 mt-1">Pasadas (Անցած)</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/40">
              <div className="text-3xl font-black text-blue-400">{percentage}%</div>
              <div className="text-xs font-bold text-blue-300 mt-1">Efectividad</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Tiempo utilizado (Օգտագործված ժամանակ):</span>
            </div>
            <span className="font-mono font-bold text-white">{timeUsedFormatted}</span>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Revisión de las 27 preguntas (27 հարցերի ստուգում)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const s = statuses[q.id] || 'unanswered';
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      onSelectQuestion(idx);
                      onClose();
                    }}
                    role="button"
                    tabIndex={0}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/50 flex items-start justify-between gap-3 cursor-pointer transition-all hover:bg-slate-800/40"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        s === 'correct'
                          ? 'bg-emerald-600 text-white'
                          : s === 'incorrect'
                          ? 'bg-rose-600 text-white'
                          : s === 'passed'
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-900 text-blue-200'
                      }`}>
                        {q.letter}
                      </span>
                      <div className="text-left space-y-0.5">
                        <p className="text-xs sm:text-sm font-medium text-slate-200 line-clamp-1">
                          {q.questionEs}
                        </p>
                        <p className="text-[11px] text-slate-400 font-armenian line-clamp-1">
                          {q.questionAm}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 pt-1">
                      {s === 'correct' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {s === 'incorrect' && <XCircle className="w-4 h-4 text-rose-400" />}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition-all"
          >
            Continuar jugando (Շարունակել)
          </button>
          <button
            type="button"
            onClick={() => {
              onRestart();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar juego (Սկսել նորից - 20 րոպե)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
