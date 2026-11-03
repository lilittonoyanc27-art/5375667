import React, { useState, useEffect } from 'react';
import { QuestionData, QuestionStatus } from './types.ts';
import { Volume2, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight, ArrowLeft, RotateCw, Lightbulb, Sparkles } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionData;
  status: QuestionStatus;
  onAnswerSubmit: (isCorrect: boolean) => void;
  onPasapalabra: () => void;
  onNext: () => void;
  onPrevious: () => void;
  totalQuestions: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  status,
  onAnswerSubmit,
  onPasapalabra,
  onNext,
  onPrevious,
  totalQuestions,
}) => {
  const [showArmenianTranslation, setShowArmenianTranslation] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  const [speechActive, setSpeechActive] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Reset local states on question change
  useEffect(() => {
    setShowArmenianTranslation(false);
    setShowAnswer(false);
    setUserInput('');
    setFeedbackMsg(null);
  }, [question.id]);

  // Click on Spanish text to toggle Armenian translation
  const handleSpanishClick = () => {
    setShowArmenianTranslation((prev) => !prev);
  };

  // Text to speech for Spanish question
  const handleSpeak = (lang: 'es' | 'hy') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const textToSpeak = lang === 'es' ? question.questionEs : question.questionAm;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === 'es' ? 'es-ES' : 'hy-AM';
    utterance.rate = 0.95;

    utterance.onstart = () => setSpeechActive(true);
    utterance.onend = () => setSpeechActive(false);
    utterance.onerror = () => setSpeechActive(false);

    window.speechSynthesis.speak(utterance);
  };

  // Check typed user input against keywords/answer
  const handleCheckInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) {
      setShowAnswer(true);
      return;
    }

    const cleanInput = userInput.trim().toLowerCase();
    const cleanAnswer = question.answerEs.toLowerCase();
    
    // Check if input matches part of answer or keywords
    const matchesKeyword = question.keywords.some((k) => cleanInput.includes(k.toLowerCase()) || cleanInput === k.toLowerCase());
    const matchesAnswer = cleanAnswer.includes(cleanInput) || cleanInput.includes(cleanAnswer);

    if (matchesKeyword || matchesAnswer) {
      setFeedbackMsg({ text: '¡Excelente respuesta! Coincide con la idea clave.', type: 'success' });
      setShowAnswer(true);
      onAnswerSubmit(true);
    } else {
      setFeedbackMsg({ text: 'No coincide exactamente. Revisa la respuesta oficial:', type: 'info' });
      setShowAnswer(true);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Part info & Question letter */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            {question.letter}
          </div>
          <div>
            <div className="text-xs font-bold text-blue-400 tracking-wide uppercase">
              {question.partTitleEs}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {question.partTitleAm}
            </div>
          </div>
        </div>

        {/* Current status pill */}
        <div className="flex items-center gap-2">
          {status === 'correct' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Acierto (Ճիշտ)
            </span>
          )}
          {status === 'incorrect' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-400">
              <XCircle className="w-3.5 h-3.5" /> Fallo (Սխալ)
            </span>
          )}
          {status === 'passed' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-400">
              <RotateCw className="w-3.5 h-3.5" /> Pasapalabra (Անցած)
            </span>
          )}
          {status === 'unanswered' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
              #{question.id} de {totalQuestions}
            </span>
          )}
        </div>
      </div>

      {/* Main Question Block */}
      <div className="space-y-4">
        {/* Spanish Question (Interactive Click to reveal Armenian) */}
        <div className="group relative">
          <div
            onClick={handleSpanishClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleSpanishClick();
            }}
            title="Haz clic para ver/ocultar la traducción al armenio (Սեղմեք հայերեն թարգմանության համար)"
            className="w-full text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-800/80 to-blue-950/40 border border-blue-500/30 hover:border-blue-400/80 transition-all duration-200 cursor-pointer shadow-md group-hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span>🇪🇸 ESPAÑOL</span>
                  <span className="text-[11px] font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Clic para traducir al armenio
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white leading-relaxed tracking-wide pt-1">
                  {question.questionEs}
                </p>
              </div>

              {/* TTS Listen Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak('es');
                }}
                title="Escuchar pronunciación en español"
                className={`p-2 rounded-xl border transition-all ${
                  speechActive
                    ? 'bg-blue-600 text-white border-blue-400 animate-pulse'
                    : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Armenian Translation Box (Toggled by click on Spanish or toggle button) */}
        <div className="transition-all duration-300">
          {showArmenianTranslation ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 animate-fadeIn">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <span>🇦🇲 ՀԱՅԵՐԵՆ (ԹԱՐԳՄԱՆՈՒԹՅՈՒՆ)</span>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-amber-100 leading-relaxed font-armenian pt-1">
                    {question.questionAm}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSpeak('hy')}
                  title="Լսել հայերեն արտասանությունը"
                  className="p-2 rounded-xl bg-amber-900/40 text-amber-300 hover:bg-amber-900/60 border border-amber-600/40"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSpanishClick}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/40 hover:bg-amber-950/10 text-slate-400 hover:text-amber-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Սեղմեք այստեղ կամ հարցի վրա՝ հայերեն թարգմանությունը տեսնելու համար (Ver traducción al armenio)</span>
            </button>
          )}
        </div>

        {/* User Interactive Typing Input (Optional for practice/testing) */}
        <form onSubmit={handleCheckInput} className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Escribe tu respuesta en español o piensa tu respuesta..."
            className="flex-1 bg-slate-950/70 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20"
          >
            Comprobar
          </button>
        </form>

        {feedbackMsg && (
          <div className={`p-3 rounded-xl text-xs sm:text-sm font-medium ${
            feedbackMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border border-slate-700 text-slate-300'
          }`}>
            {feedbackMsg.text}
          </div>
        )}

        {/* Dedicated Answer Button ("отдельно кнопка ответ") */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAnswer((prev) => !prev)}
            className={`w-full py-3 px-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg ${
              showAnswer
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 shadow-amber-500/10'
                : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/25 active:scale-[0.99]'
            }`}
          >
            <Lightbulb className={`w-5 h-5 ${showAnswer ? 'text-amber-400' : 'text-slate-950'}`} />
            <span>
              {showAnswer
                ? 'Ocultar Respuesta Oficial (Թաքցնել պատասխանը)'
                : '💡 VER RESPUESTA OFICIAL (ՏԵՍՆԵԼ ՊԱՏԱՍԽԱՆԸ)'}
            </span>
          </button>
        </div>

        {/* Revealed Official Answer Panel */}
        {showAnswer && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/50 shadow-xl space-y-3.5 animate-fadeIn">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Respuesta Oficial (Պաշտոնական պատասխան)</span>
            </div>

            {/* Spanish Answer */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-[11px] font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                <span>🇪🇸 ESPAÑOL</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-emerald-300 leading-relaxed">
                ✅ {question.answerEs}
              </p>
            </div>

            {/* Armenian Answer */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                <span>🇦🇲 ՀԱՅԵՐԵՆ</span>
              </div>
              <p className="text-sm sm:text-base font-medium text-amber-200 leading-relaxed font-armenian">
                ✅ {question.answerAm}
              </p>
            </div>

            {/* Self Assessment: Did user get it right? */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <span className="text-xs text-slate-400 font-medium">
                ¿Acertaste la respuesta? (Ճի՞շտ պատասխանեցիր)
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onAnswerSubmit(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/30 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Correcto! (Ճիշտ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAnswerSubmit(false)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/30 active:scale-95"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Fallo (Սխալ)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Primary Game Action Buttons: Pasapalabra, Correct, Incorrect, Navigation */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
          {/* Previous Question Button */}
          <button
            type="button"
            onClick={onPrevious}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1"
            title="Pregunta anterior"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Central Game Actions */}
          <div className="flex items-center gap-2 flex-1 justify-center max-w-md">
            {/* Pasapalabra Button */}
            <button
              type="button"
              onClick={onPasapalabra}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm tracking-wide shadow-md shadow-amber-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-4 h-4 animate-spin-reverse" />
              <span>PASAPALABRA (ԱՆՑՆԵԼ)</span>
            </button>

            {/* Quick Correct Button */}
            <button
              type="button"
              onClick={() => onAnswerSubmit(true)}
              className="py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md active:scale-95"
              title="Marcar como acierto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Acierto</span>
            </button>

            {/* Quick Incorrect Button (Game continues!) */}
            <button
              type="button"
              onClick={() => onAnswerSubmit(false)}
              className="py-2.5 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-1 shadow-md active:scale-95"
              title="Marcar como fallo (el juego continúa)"
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Fallo</span>
            </button>
          </div>

          {/* Next Question Button */}
          <button
            type="button"
            onClick={onNext}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1"
            title="Siguiente pregunta"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
