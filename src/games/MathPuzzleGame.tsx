import { useEffect, useMemo, useState } from "react";
import { useAwardPoints } from "./_awardPoints";
import { CircularCountdown } from "../components/CircularCountdown";

const GAME_SECONDS = 60;

export function MathPuzzleGame({ onBack }: { onBack: () => void }) {
  const [problem, setProblem] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [gameActive, setGameActive] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const award = useAwardPoints("math-puzzle", { level: 1, difficulty: "easy" });

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (gameActive && timeLeft === 0) {
      setGameActive(false);
    }
    return () => timer && clearTimeout(timer);
  }, [gameActive, timeLeft]);

  const generateProblem = () => {
    const operations = ["+", "-", "*"] as const;
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let a: number, b: number, result: number;
    switch (operation) {
      case "+":
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        result = a + b;
        break;
      case "-":
        a = Math.floor(Math.random() * 50) + 25;
        b = Math.floor(Math.random() * 25) + 1;
        result = a - b;
        break;
      case "*":
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        result = a * b;
        break;
    }
    setProblem(`${a} ${operation} ${b} = ?`);
    setCorrectAnswer(result);
    setAnswer("");
    setFeedback("");
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setGameActive(true);
    setSubmitted(false);
    setFeedback("");
    generateProblem();
  };

  const bumpAnswer = (delta: number) => {
    if (!gameActive) return;
    const current = answer.trim() === "" ? 0 : parseInt(answer);
    const next = (Number.isNaN(current) ? 0 : current) + delta;
    setAnswer(String(next));
  };

  const checkAnswer = () => {
    const userAnswer = parseInt(answer);
    if (Number.isNaN(userAnswer)) return;
    if (userAnswer === correctAnswer) {
      setScore((s) => s + 1);
      setFeedback("Правильно! +1");
      setTimeout(() => {
        if (gameActive) generateProblem();
      }, 350);
    } else {
      setFeedback(`Неправильно! Ответ: ${correctAnswer}`);
      setTimeout(() => {
        if (gameActive) generateProblem();
      }, 750);
    }
  };

  const won = useMemo(() => score >= 10, [score]);

  const submit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      // фиксированная награда за победу (1 раз); счёт всё равно показываем
      await award({ won, pointsOverride: won ? 40 : undefined });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-white/70 hover:text-white transition-colors">
          ← Назад к играм
        </button>
        <div className="text-sm text-white/60">Таймер: {GAME_SECONDS}с</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Математические головоломки
          </h2>
          <p className="mt-3 text-white/70">60 секунд. Решите как можно больше примеров.</p>
        </div>

        {!gameActive && timeLeft === GAME_SECONDS && (
          <div className="mt-8 text-center">
            <button
              onClick={startGame}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-4 font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-purple-400 transition-all"
            >
              Начать игру
            </button>
          </div>
        )}

        {gameActive && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between text-white/80">
              <div className="text-lg font-semibold">
                Счёт: <span className="text-white font-bold">{score}</span>
              </div>
              <div className="text-lg font-semibold">
                <span className="mr-2">Время:</span>
                <span className="inline-flex align-middle">
                  <CircularCountdown
                    totalSeconds={GAME_SECONDS}
                    secondsLeft={timeLeft}
                    running={gameActive}
                    size={44}
                  />
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <div className="text-4xl md:text-5xl font-mono font-extrabold text-center text-white/90">{problem}</div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => bumpAnswer(-1)}
                  disabled={!gameActive}
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
                  className="w-40 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-center text-xl text-white/90 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/15"
                  onKeyDown={(e) => e.key === "Enter" && answer && checkAnswer()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => bumpAnswer(1)}
                  disabled={!gameActive}
                  className="w-12 h-12 rounded-xl border border-white/15 bg-gradient-to-br from-cyan-500/35 to-purple-500/35 text-white text-2xl font-black hover:from-cyan-500/45 hover:to-purple-500/45 hover:border-white/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Увеличить значение"
                  title="Увеличить"
                >
                  +
                </button>
                <button
                  onClick={checkAnswer}
                  disabled={!answer}
                  className="rounded-xl bg-white/10 border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/15 transition-colors disabled:opacity-60"
                >
                  ✓
                </button>
              </div>
            </div>

            {feedback && (
              <div className={`text-center text-lg font-semibold ${feedback.includes("Правильно") ? "text-emerald-300" : "text-rose-300"}`}>
                {feedback}
              </div>
            )}
          </div>
        )}

        {!gameActive && timeLeft === 0 && (
          <div className="mt-8 text-center space-y-4">
            <div className="text-2xl font-bold text-white/90">Время вышло</div>
            <div className="text-lg text-white/70">Решено примеров: {score}</div>
            <div className="text-sm text-white/60">Победа: 10+ примеров</div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={submit}
                disabled={submitting || submitted}
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-6 py-4 font-semibold text-white hover:bg-white/15 transition-colors disabled:opacity-60"
              >
                {submitted ? "Сохранено" : submitting ? "Сохраняем..." : "Сохранить результат"}
              </button>
              <button
                onClick={startGame}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white/90 hover:bg-white/10 transition-colors"
              >
                Играть снова
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


