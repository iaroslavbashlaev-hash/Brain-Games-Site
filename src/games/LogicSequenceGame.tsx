import { useEffect, useMemo, useRef, useState } from "react";
import { useAwardPoints } from "./_awardPoints";

export function LogicSequenceGame({ onBack }: { onBack: () => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [correctStreak, setCorrectStreak] = useState<number>(0);
  const [finished, setFinished] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const nextRoundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const award = useAwardPoints("logic-sequence", { level: 1, difficulty: "easy" });

  const WIN_STREAK = 5;

  const generateSequence = () => {
    const patterns = [
      // Арифметическая прогрессия
      () => {
        const start = Math.floor(Math.random() * 10) + 1;
        const diff = Math.floor(Math.random() * 5) + 1;
        const seq = [start, start + diff, start + 2 * diff, start + 3 * diff];
        return { sequence: seq, answer: start + 4 * diff };
      },
      // Геометрическая прогрессия
      () => {
        const start = Math.floor(Math.random() * 3) + 2;
        const ratio = 2;
        const seq = [start, start * ratio, start * ratio * ratio, start * ratio * ratio * ratio];
        return { sequence: seq, answer: start * Math.pow(ratio, 4) };
      },
      // Квадраты чисел
      () => {
        const start = Math.floor(Math.random() * 3) + 1;
        const seq = [
          start * start,
          (start + 1) * (start + 1),
          (start + 2) * (start + 2),
          (start + 3) * (start + 3),
        ];
        return { sequence: seq, answer: (start + 4) * (start + 4) };
      },
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)]();
    setSequence(pattern.sequence);
    setCorrectAnswer(pattern.answer);
    setAnswer("");
    setFeedback("");
  };

  useEffect(() => {
    generateSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressText = useMemo(() => `${correctStreak}/${WIN_STREAK}`, [correctStreak]);

  const checkAnswer = () => {
    if (finished) return;
    if (nextRoundTimerRef.current) {
      clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = null;
    }
    const userAnswer = parseInt(answer);
    if (userAnswer === correctAnswer) {
      const nextStreak = correctStreak + 1;
      setCorrectStreak(nextStreak);
      setFeedback("Правильно! 🎉");
      if (nextStreak >= WIN_STREAK) {
        setFinished(true);
      } else {
        nextRoundTimerRef.current = setTimeout(() => {
          generateSequence();
          nextRoundTimerRef.current = null;
        }, 700);
      }
    } else {
      setFeedback(`Неправильно. Правильный ответ: ${correctAnswer}`);
      setCorrectStreak(0);
      // Переходим к следующей "игре/раунду" даже при ошибке
      nextRoundTimerRef.current = setTimeout(() => {
        generateSequence();
        nextRoundTimerRef.current = null;
      }, 900);
    }
  };

  const bumpAnswer = (delta: number) => {
    if (finished) return;
    const current = answer.trim() === "" ? 0 : parseInt(answer);
    const next = (Number.isNaN(current) ? 0 : current) + delta;
    setAnswer(String(next));
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await award({ won: finished, pointsOverride: finished ? 35 : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setCorrectStreak(0);
    setFinished(false);
    setFeedback("");
    setAnswer("");
    if (nextRoundTimerRef.current) {
      clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = null;
    }
    generateSequence();
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-white/70 hover:text-white transition-colors">
          ← Назад к играм
        </button>
        <div className="text-sm text-white/60">
          Серия: <span className="text-white/90 font-semibold">{progressText}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Логические последовательности
          </h2>
          <p className="mt-3 text-white/70">Найдите закономерность и укажите следующее число.</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap text-2xl font-mono">
          {sequence.map((num, index) => (
            <span key={index} className="rounded-xl border border-white/10 bg-black/25 px-4 py-2 text-white/90">
              {num}
            </span>
          ))}
          <span className="text-white/40">→</span>
          <span className="rounded-xl border border-white/10 bg-black/10 px-4 py-2 text-white/40">?</span>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => bumpAnswer(-1)}
            disabled={finished}
            className="w-12 h-12 rounded-xl border border-white/15 bg-black/25 text-white/90 text-2xl font-black hover:bg-white/10 hover:border-white/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Уменьшить значение"
            title="Уменьшить"
          >
            −
          </button>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9-]*"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/[^\d-]/g, ""))}
            placeholder="Ответ"
            className="w-40 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-center text-lg text-white/90 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
            onKeyDown={(e) => e.key === "Enter" && answer && checkAnswer()}
            disabled={finished}
          />

          <button
            type="button"
            onClick={() => bumpAnswer(1)}
            disabled={finished}
            className="w-12 h-12 rounded-xl border border-white/15 bg-gradient-to-br from-cyan-500/35 to-purple-500/35 text-white text-2xl font-black hover:from-cyan-500/45 hover:to-purple-500/45 hover:border-white/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Увеличить значение"
            title="Увеличить"
          >
            +
          </button>

          <button
            onClick={checkAnswer}
            disabled={!answer || finished}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-3 font-semibold text-white hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-60"
          >
            Проверить
          </button>
        </div>

        {/* Reserve space to avoid layout shift when feedback appears */}
        <div className="mt-5 min-h-[28px] flex items-center justify-center">
          <div
            className={[
              "text-center text-lg font-semibold transition-opacity duration-200",
              feedback ? "opacity-100" : "opacity-0",
              feedback.includes("Правильно") ? "text-emerald-300" : "text-rose-300",
            ].join(" ")}
            aria-live="polite"
            role="status"
          >
            {feedback || "—"}
          </div>
        </div>

        {finished && (
          <div className="mt-6 text-center">
            <div className="text-2xl font-bold text-emerald-300">Готово! 🎉</div>
            <p className="mt-1 text-white/60">Засчитываем победу и выдаём очки один раз.</p>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-white/10 border border-white/15 px-6 py-4 font-semibold text-white hover:bg-white/15 transition-colors disabled:opacity-60"
          >
            {submitting ? "Сохраняем..." : "Сохранить результат"}
          </button>
          <button
            onClick={reset}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white/90 hover:bg-white/10 transition-colors"
          >
            Новая серия
          </button>
        </div>
      </div>
    </div>
  );
}


