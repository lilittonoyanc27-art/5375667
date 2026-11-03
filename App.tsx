import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { QUESTIONS_DATA } from './questions.ts';
import { QuestionData, QuestionStatus } from './types.ts';
import { RoscoWheel } from './RoscoWheel.tsx';
import { QuestionCard } from './QuestionCard.tsx';
import { StatsModal } from './StatsModal.tsx';
import { sounds } from './audio.ts';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  BookOpen,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ListOrdered
} from 'lucide-react';

const TOTAL_TIME_SECONDS = 20 * 60; // 20 minutes (1200 seconds)

export default function App() {
  const [questions] = useState<QuestionData[]>(QUESTIONS_DATA);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [statuses, setStatuses] = useState<Record<number, QuestionStatus>>({});
  
  // Game start and Timer state: 20 minutes countdown starts ONLY on "Начать игру"
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(TOTAL_TIME_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());
  
  // Modals & view states
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'rosco' | 'study'>('rosco');

  // Trigger celebration once when finished
  const hasCelebrated = useRef<boolean>(false);

  // Score calculations
  const calculateScore = useCallback(() => {
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

    return { correct, incorrect, passed, unanswered };
  }, [questions, statuses]);

  const score = calculateScore();

  // Start game handler: triggers whistle and starts the 20-minute countdown
  const handleStartGame = () => {
    setHasStarted(true);
    setIsTimerRunning(true);
    sounds.playStart();
  };

  const handleToggleTimer = () => {
    if (!hasStarted) {
      handleStartGame();
    } else {
      setIsTimerRunning((prev) => !prev);
    }
  };

  // Timer interval: only ticks when hasStarted AND isTimerRunning
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (hasStarted && isTimerRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsStatsOpen(true);
            sounds.playIncorrect();
            return 0;
          }
          if (prev <= 10) {
            sounds.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [hasStarted, isTimerRunning, secondsLeft]);

  // Check if all questions are finished
  useEffect(() => {
    if (!hasStarted) return;
    const allAnswered = questions.every((q) => {
      const s = statuses[q.id];
      return s === 'correct' || s === 'incorrect';
    });

    if (allAnswered && !hasCelebrated.current) {
      hasCelebrated.current = true;
      setIsTimerRunning(false);
      sounds.playFanfare();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        setIsStatsOpen(true);
      }, 600);
    }
  }, [statuses, questions, hasStarted]);

  // Helper to find next pending or unanswered question
  const getNextAvailableIndex = useCallback(
    (fromIndex: number) => {
      const total = questions.length;
      for (let step = 1; step <= total; step++) {
        const nextIdx = (fromIndex + step) % total;
        const qId = questions[nextIdx].id;
        const s = statuses[qId] || 'unanswered';
        if (s === 'unanswered' || s === 'passed') {
          return nextIdx;
        }
      }
      return (fromIndex + 1) % total;
    },
    [questions, statuses]
  );

  // Handle Answer Submit (True = correct, False = incorrect)
  // CRITICAL REQUIREMENT: "и если ответ неверный всё рвно продолжитть играть"
  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsTimerRunning(true);
    }

    const currentQ = questions[currentIndex];
    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playIncorrect();
    }

    setStatuses((prev) => ({
      ...prev,
      [currentQ.id]: isCorrect ? 'correct' : 'incorrect',
    }));

    // Move to next question immediately so game continues smoothly
    setTimeout(() => {
      setCurrentIndex((prev) => getNextAvailableIndex(prev));
    }, 280);
  };

  // Handle Pasapalabra (Pass current question and come back later)
  const handlePasapalabra = () => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsTimerRunning(true);
    }

    sounds.playPasapalabra();
    const currentQ = questions[currentIndex];
    setStatuses((prev) => ({
      ...prev,
      [currentQ.id]: prev[currentQ.id] === 'correct' || prev[currentQ.id] === 'incorrect' ? prev[currentQ.id] : 'passed',
    }));

    setCurrentIndex((prev) => getNextAvailableIndex(prev));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
  };

  // Restart game
  const handleRestart = () => {
    setStatuses({});
    setCurrentIndex(0);
    setSecondsLeft(TOTAL_TIME_SECONDS);
    setHasStarted(false);
    setIsTimerRunning(false);
    hasCelebrated.current = false;
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePasapalabra();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePasapalabra, handleNext, handlePrevious]);

  const currentQuestion = questions[currentIndex];
  const currentStatus = statuses[currentQuestion.id] || 'unanswered';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.35),rgba(2,6,23,0))] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>PASAPALABRA</span>
                  <span className="text-amber-400">FÚTBOL</span>
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  🇪🇸 🇦🇲
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-armenian hidden sm:block">
                27 հարց և պատասխան ֆուտբոլի մասին • 20 րոպե
              </p>
            </div>
          </div>

          {/* Controls Bar: Start Button + Timer + Sound + Restart + Rules */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('rosco')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'rosco'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                El Rosco
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('study')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'study'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">27 Preguntas</span>
              </button>
            </div>

            {/* If not started: Highlighted "Начать игру" Navbar Button */}
            {!hasStarted ? (
              <button
                type="button"
                onClick={handleStartGame}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 animate-pulse transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>НАЧАТЬ ИГРУ (20:00)</span>
              </button>
            ) : (
              /* Timer Toggle (Pause/Resume) when game has started */
              <button
                type="button"
                onClick={handleToggleTimer}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                title={isTimerRunning ? 'Pausar cronómetro' : 'Reanudar cronómetro'}
              >
                {isTimerRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              </button>
            )}

            {/* Restart Button */}
            <button
              type="button"
              onClick={handleRestart}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              title="Reiniciar partida (20 minutos)"
            >
              <RotateCcw className="w-4 h-4 text-blue-400" />
            </button>

            {/* Sound Mute Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Scorecard Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsStatsOpen(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Resultados</span>
            </button>

            {/* Instructions / Rules */}
            <button
              type="button"
              onClick={() => setIsRulesOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              title="Instrucciones del juego"
            >
              <HelpCircle className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Start Game Callout Banner if game hasn't started */}
      {!hasStarted && (
        <div className="relative z-10 bg-gradient-to-r from-emerald-950/80 via-blue-950/80 to-slate-900 border-b border-emerald-500/30 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">⏱️</span>
              <div>
                <p className="text-sm font-bold text-emerald-300">
                  Таймер на 20 минут включится при нажатии «Начать игру»!
                </p>
                <p className="text-xs text-slate-300 font-armenian">
                  Սեղմեք «Սկսել խաղը»՝ 20 րոպեանոց ժամաչափը միացնելու և խաղն սկսելու համար:
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartGame}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>НАЧАТЬ ИГРУ (ՍԿՍԵԼ ԽԱՂԸ)</span>
            </button>
          </div>
        </div>
      )}

      {/* Rules Banner (Collapsible) */}
      {isRulesOpen && (
        <div className="relative z-10 bg-slate-900 border-b border-slate-800 px-4 py-4 text-xs sm:text-sm text-slate-300 animate-fadeIn">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="font-bold text-white flex items-center gap-2">
                <span>📖 Reglas de Pasapalabra Fútbol 🇪🇸🇦🇲</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>
                  <strong className="text-emerald-300">Начать игру:</strong> Таймер на 20:00 запускается только после нажатия на кнопку «Начать игру».
                </li>
                <li>
                  <strong className="text-blue-300">20 minutos:</strong> Tienes 20:00 para recorrer las 27 preguntas del Rosco (A a Z + Ñ).
                </li>
                <li>
                  <strong className="text-amber-300">Clic en español:</strong> Al hacer clic sobre cualquier pregunta en español, se desplegará de inmediato la traducción al armenio.
                </li>
                <li>
                  <strong className="text-emerald-300">Botón Respuesta:</strong> Pulsa el botón "VER RESPUESTA OFICIAL" para ver la respuesta correcta tanto en español como en armenio.
                </li>
                <li>
                  <strong className="text-rose-300">Si fallas, continúas jugando:</strong> Aunque una respuesta sea incorrecta, el juego no se detiene; se anota el fallo y puedes continuar con las demás preguntas.
                </li>
                <li>
                  <strong className="text-yellow-300">Pasapalabra:</strong> Si dudas, haz clic en "PASAPALABRA" o pulsa la barra espaciadora para saltar y resolverla más adelante.
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setIsRulesOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs shrink-0 self-end sm:self-auto"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center relative z-10">
        {activeTab === 'rosco' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center my-auto">
            {/* Left Column: Rosco Wheel */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <RoscoWheel
                questions={questions}
                statuses={statuses}
                currentIndex={currentIndex}
                onSelectIndex={(idx) => setCurrentIndex(idx)}
                secondsLeft={secondsLeft}
                score={score}
                hasStarted={hasStarted}
                isTimerRunning={isTimerRunning}
                onStartGame={handleStartGame}
                onToggleTimer={handleToggleTimer}
              />
            </div>

            {/* Right Column: Question Card & Controls */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center w-full">
              <QuestionCard
                question={currentQuestion}
                status={currentStatus}
                onAnswerSubmit={handleAnswerSubmit}
                onPasapalabra={handlePasapalabra}
                onNext={handleNext}
                onPrevious={handlePrevious}
                totalQuestions={questions.length}
              />

              {/* Progress Bar under card */}
              <div className="w-full max-w-2xl mt-4 px-2">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
                  <span>Progreso de respuestas</span>
                  <span>{score.correct + score.incorrect} de {questions.length} respondidas</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${(score.correct / questions.length) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                  />
                  <div
                    style={{ width: `${(score.incorrect / questions.length) * 100}%` }}
                    className="bg-rose-500 transition-all duration-300"
                  />
                  <div
                    style={{ width: `${(score.passed / questions.length) * 100}%` }}
                    className="bg-amber-500 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Study / Complete 27 Questions Directory */
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-blue-400" />
                  <span>27 Preguntas y Respuestas sobre Fútbol</span>
                </h2>
                <p className="text-xs text-slate-400 font-armenian">
                  27 հարց և պատասխան ֆուտբոլի մասին՝ իսպաներեն և հայերեն
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('rosco')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto transition-all"
              >
                <span>Volver a El Rosco</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* List of 27 Questions */}
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                        {q.letter}
                      </span>
                      <span className="text-xs font-semibold text-blue-400 uppercase">
                        #{q.id} • {q.partTitleEs}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setActiveTab('rosco');
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
                    >
                      Jugar esta letra
                    </button>
                  </div>

                  {/* Question */}
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white">
                      🇪🇸 {q.questionEs}
                    </p>
                    <p className="text-sm font-medium text-amber-200/90 font-armenian">
                      🇦🇲 {q.questionAm}
                    </p>
                  </div>

                  {/* Answer */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-emerald-400">
                      ✅ 🇪🇸 {q.answerEs}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-amber-300 font-armenian">
                      ✅ 🇦🇲 {q.answerAm}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/40 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Pasapalabra 🇪🇸🇦🇲 • 27 preguntas y respuestas sobre fútbol</span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Atajos: [Espacio] Pasapalabra</span>
            <span>[← / →] Navegar</span>
          </div>
        </div>
      </footer>

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        questions={questions}
        statuses={statuses}
        secondsLeft={secondsLeft}
        onRestart={handleRestart}
        onSelectQuestion={(idx) => {
          setCurrentIndex(idx);
          setActiveTab('rosco');
        }}
      />
    </div>
  );
}
