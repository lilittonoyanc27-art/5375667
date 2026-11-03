import React from 'react';
import { QuestionData, QuestionStatus } from './types.ts';
import { Play, Pause } from 'lucide-react';

interface RoscoWheelProps {
  questions: QuestionData[];
  statuses: Record<number, QuestionStatus>;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  secondsLeft: number;
  score: { correct: number; incorrect: number; passed: number; unanswered: number };
  hasStarted: boolean;
  isTimerRunning: boolean;
  onStartGame: () => void;
  onToggleTimer: () => void;
}

export const RoscoWheel: React.FC<RoscoWheelProps> = ({
  questions,
  statuses,
  currentIndex,
  onSelectIndex,
  secondsLeft,
  score,
  hasStarted,
  isTimerRunning,
  onStartGame,
  onToggleTimer,
}) => {
  const total = questions.length;

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Outer Rosco Container */}
      <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px]">
        {/* Glow behind the Rosco */}
        <div className="absolute inset-8 rounded-full bg-blue-600/15 blur-2xl pointer-events-none animate-pulse" />

        {/* Center Arena */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-auto">
          <div className="w-[170px] h-[170px] sm:w-[210px] sm:h-[210px] rounded-full bg-slate-900/95 border-4 border-blue-500/30 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center p-3 sm:p-4 text-center">
            {/* TV Game Show Branding */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-300">
              <span>⚽</span>
              <span>PASAPALABRA</span>
            </div>

            {!hasStarted ? (
              /* Before Start: Prominent Start Game Trigger */
              <div className="my-1 flex flex-col items-center gap-1.5 animate-fadeIn">
                <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatTimer(secondsLeft)}
                </div>
                <button
                  type="button"
                  onClick={onStartGame}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>НАЧАТЬ ИГРУ</span>
                </button>
                <span className="text-[10px] text-slate-400 font-armenian">
                  Սկսել խաղը (20 րոպե)
                </span>
              </div>
            ) : (
              /* During Game: Active Letter & Live Timer */
              <>
                <div className="my-0.5 sm:my-1 flex items-center justify-center gap-2">
                  <span className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
                    {currentQ ? currentQ.letter : '—'}
                  </span>
                  <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/60 font-mono">
                    #{currentQ?.id}/27
                  </span>
                </div>

                {/* Big 20-min Countdown with Pause indicator */}
                <button
                  type="button"
                  onClick={onToggleTimer}
                  title={isTimerRunning ? 'Pausar cronómetro' : 'Reanudar cronómetro'}
                  className="flex items-center gap-1.5 group cursor-pointer"
                >
                  <span className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-wider ${
                    secondsLeft < 120
                      ? 'text-red-400 animate-pulse'
                      : secondsLeft < 300
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                  }`}>
                    {formatTimer(secondsLeft)}
                  </span>
                  {!isTimerRunning && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                      Pausa
                    </span>
                  )}
                </button>

                {/* Mini Score Track */}
                <div className="mt-1 flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1 text-emerald-400" title="Aciertos (Ճիշտ)">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]" />
                    {score.correct}
                  </span>
                  <span className="flex items-center gap-1 text-red-400" title="Fallos (Սխալ)">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-[0_0_6px_#ef4444]" />
                    {score.incorrect}
                  </span>
                  <span className="flex items-center gap-1 text-amber-300" title="Pasapalabra (Անցած)">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_#f59e0b]" />
                    {score.passed}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Circular Letters (El Rosco) */}
        <div className="absolute inset-0">
          {questions.map((q, idx) => {
            const angleDeg = -90 + (idx * 360) / total;
            const angleRad = (angleDeg * Math.PI) / 180;
            const percentRadius = 41;
            const left = 50 + percentRadius * Math.cos(angleRad);
            const top = 50 + percentRadius * Math.sin(angleRad);

            const status = statuses[q.id] || 'unanswered';
            const isActive = idx === currentIndex;

            let badgeStyles = '';
            if (isActive) {
              badgeStyles = 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black ring-4 ring-white shadow-[0_0_20px_#f59e0b] scale-125 z-30 animate-pulse';
            } else if (status === 'correct') {
              badgeStyles = 'bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white border-2 border-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.8)]';
            } else if (status === 'incorrect') {
              badgeStyles = 'bg-gradient-to-tr from-red-600 to-rose-400 text-white border-2 border-rose-200 shadow-[0_0_12px_rgba(239,68,68,0.8)]';
            } else if (status === 'passed') {
              badgeStyles = 'bg-gradient-to-tr from-amber-600 to-amber-400 text-white border-2 border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
            } else {
              badgeStyles = 'bg-gradient-to-tr from-blue-700 to-blue-500 text-white border-2 border-blue-400/50 shadow-md hover:brightness-110';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectIndex(idx)}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`Letra ${q.letter} (#${q.id}) - ${q.questionEs.slice(0, 45)}...`}
                className={`absolute w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white ${badgeStyles}`}
              >
                <span>{q.letter}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Under-wheel Quick legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span>Sin responder</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]" />
          <span>Acierto (Ճիշտ)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-[0_0_6px_#ef4444]" />
          <span>Fallo (Սխալ)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span>Pasada (Անցած)</span>
        </span>
      </div>
    </div>
  );
};
