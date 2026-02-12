import { useMemo, useState } from "react";
import { useAwardPoints } from "./_awardPoints";

export function ReactionTimeGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<"ready" | "waiting" | "react" | "result">("ready");
  const [reactionTime, setReactionTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const award = useAwardPoints("reaction-time", { level: 1, difficulty: "easy" });

  const startGame = () => {
    setGameState("waiting");
    setSubmitted(false);
    const delay = Math.random() * 3000 + 1000; // 1-4 сек
    setTimeout(() => {
      setStartTime(Date.now());
      setGameState("react");
    }, delay);
  };

  const handleReaction = () => {
    if (gameState === "react") {
      const endTime = Date.now();
      const time = endTime - startTime;
      setReactionTime(time);
      setAttempts((a) => [...a, time]);
      setBestTime((prev) => (prev === null || time < prev ? time : prev));
      setGameState("result");
    } else if (gameState === "waiting") {
      setGameState("ready");
    }
  };

  const resetGame = () => {
    setGameState("ready");
    setReactionTime(0);
  };

  const averageTime = useMemo(() => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
  }, [attempts]);

  const won = useMemo(() => reactionTime > 0 && reactionTime < 250, [reactionTime]);

  const submit = async () => {
    if (submitting || submitted || gameState !== "result") return;
    setSubmitting(true);
    try {
      await award({ won, pointsOverride: won ? 25 : undefined });
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
        <div className="text-sm text-white/60">Победа: &lt; 250мс</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Время реакции
          </h2>
          <p className="mt-3 text-white/70">Нажмите как можно быстрее, когда поле станет зелёным.</p>
        </div>

        <div className="mt-6 text-center space-y-1 text-white/80">
          {bestTime !== null && (
            <div>
              Лучший результат: <span className="font-bold text-emerald-300">{bestTime}мс</span>
            </div>
          )}
          {attempts.length > 0 && (
            <div>
              Среднее: <span className="font-bold text-cyan-300">{averageTime}мс</span>
            </div>
          )}
          <div className="text-sm text-white/50">Попыток: {attempts.length}</div>
        </div>

        <div
          className={[
            "mt-8 mx-auto w-[280px] h-[280px] sm:w-80 sm:h-80 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center text-xl sm:text-2xl font-extrabold border",
            gameState === "ready"
              ? "bg-cyan-500/25 border-cyan-400/30 text-white hover:bg-cyan-500/35"
              : gameState === "waiting"
                ? "bg-rose-500/25 border-rose-400/30 text-white"
                : gameState === "react"
                  ? "bg-emerald-500/25 border-emerald-400/30 text-white"
                  : "bg-white/10 border-white/15 text-white",
          ].join(" ")}
          onClick={handleReaction}
        >
          {gameState === "ready" && "Нажмите для начала"}
          {gameState === "waiting" && "Ждите..."}
          {gameState === "react" && "ЖМИ СЕЙЧАС!"}
          {gameState === "result" && "Результат"}
        </div>

        {gameState === "ready" && (
          <div className="mt-6 text-center">
            <button
              onClick={startGame}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-4 font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-purple-400 transition-all"
            >
              Начать
            </button>
          </div>
        )}

        {gameState === "result" && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-4xl font-extrabold text-white/95">{reactionTime}мс</div>
            <div className={`text-lg font-semibold ${won ? "text-emerald-300" : "text-rose-300"}`}>
              {won ? "Отлично!" : "Можно лучше"}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={submit}
                disabled={submitting || submitted}
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-6 py-4 font-semibold text-white hover:bg-white/15 transition-colors disabled:opacity-60"
              >
                {submitted ? "Сохранено" : submitting ? "Сохраняем..." : "Сохранить результат"}
              </button>
              <button
                onClick={resetGame}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white/90 hover:bg-white/10 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        )}

        {gameState === "waiting" && (
          <div className="mt-5 text-center text-rose-200 font-semibold">Не нажимайте раньше времени!</div>
        )}
      </div>
    </div>
  );
}


