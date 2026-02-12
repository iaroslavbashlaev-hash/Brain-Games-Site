import { useEffect, useMemo, useRef, useState } from "react";
import { useAwardPoints } from "./_awardPoints";

export function NumberMemoryGame({ onBack }: { onBack: () => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [gameState, setGameState] = useState<"ready" | "showing" | "input" | "result">("ready");
  const [level, setLevel] = useState(3);
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const award = useAwardPoints("number-memory", { level: 1, difficulty: "easy" });

  const startGame = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    const newSequence = Array.from({ length: level }, () => Math.floor(Math.random() * 10));
    setSequence(newSequence);
    setUserInput("");
    setFeedback("");
    setGameState("showing");

    // Время на запоминание:
    // - до уровня 6 включительно: 1.0с
    // - на уровне 7: +0.2с (1.2с)
    // - далее каждый следующий уровень: +0.3с
    const memorizeMs =
      level <= 6 ? 1000 : 1400 + Math.max(0, level - 7) * 300;

    showTimerRef.current = setTimeout(() => {
      setGameState("input");
      showTimerRef.current = null;
    }, memorizeMs);
  };

  const checkAnswer = () => {
    const userSequence = userInput.split("").map(Number);
    const isCorrect =
      userSequence.length === sequence.length && userSequence.every((num, index) => num === sequence[index]);

    if (isCorrect) {
      setFeedback("Правильно! 🎉");
      setLevel((l) => l + 1);
    } else {
      setFeedback(`Неправильно. Правильно: ${sequence.join("")}`);
      setLevel((l) => Math.max(3, l - 1));
    }
    setGameState("result");
  };

  const resetRound = () => {
    setGameState("ready");
    setUserInput("");
    setFeedback("");
  };

  const won = useMemo(() => level >= 6, [level]);

  const submit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      await award({ won, pointsOverride: won ? 35 : undefined });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setLevel(3);
    setSubmitted(false);
    setFeedback("");
    setUserInput("");
    setGameState("ready");
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
  }, []);

  // Автофокус на поле ввода, чтобы можно было сразу печатать без клика
  useEffect(() => {
    if (gameState !== "input") return;
    // небольшой defer чтобы input гарантированно был в DOM
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [gameState, level]);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-white/70 hover:text-white transition-colors">
          ← Назад к играм
        </button>
        <div className="text-sm text-white/60">
          Уровень: <span className="text-white/90 font-semibold">{level}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Запомни числа
          </h2>
          <p className="mt-3 text-white/70">Запомните последовательность и введите её без пробелов.</p>
        </div>

        <div className="mt-6 text-center text-white/60">
          Длина последовательности: <span className="text-white/90 font-semibold">{level}</span> · Победа: уровень 6+
        </div>

        {gameState === "ready" && (
          <div className="mt-8 text-center space-y-4">
            <button
              onClick={startGame}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-4 font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-purple-400 transition-all"
            >
              Начать
            </button>
          </div>
        )}

        {gameState === "showing" && (
          <div className="mt-8 text-center space-y-4">
            <p className="text-white/70">Запомните:</p>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-6 py-6 text-4xl font-mono font-extrabold text-cyan-200">
              {sequence.join(" ")}
            </div>
          </div>
        )}

        {gameState === "input" && (
          <div className="mt-8 text-center space-y-4">
            <p className="text-white/70">Введите последовательность:</p>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Например: 1234"
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-center text-2xl font-mono text-white/90 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
              maxLength={level}
              onKeyDown={(e) => e.key === "Enter" && userInput.length === level && checkAnswer()}
            />
            <button
              onClick={checkAnswer}
              disabled={userInput.length !== level}
              className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 font-semibold text-white hover:shadow-lg transition-all disabled:opacity-60"
            >
              Проверить
            </button>
          </div>
        )}

        {gameState === "result" && (
          <div className="mt-8 text-center space-y-4">
            <div className={`text-lg font-semibold ${feedback.includes("Правильно") ? "text-emerald-300" : "text-rose-300"}`}>
              {feedback}
            </div>
            <button
              onClick={resetRound}
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white/90 hover:bg-white/10 transition-colors"
            >
              Продолжить
            </button>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={submit}
                disabled={submitting || submitted}
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-6 py-4 font-semibold text-white hover:bg-white/15 transition-colors disabled:opacity-60"
              >
                {submitted ? "Сохранено" : submitting ? "Сохраняем..." : "Сохранить результат"}
              </button>
              <button
                onClick={resetAll}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white/90 hover:bg-white/10 transition-colors"
              >
                Сброс
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


