import { useEffect, useMemo, useState } from "react";
import { useAwardPoints } from "./_awardPoints";
import { CircularCountdown } from "../components/CircularCountdown";

interface Target {
  id: number;
  x: number;
  y: number;
}

const GAME_SECONDS = 30;

export function ClickSpeedGame({ onBack }: { onBack: () => void }) {
  const [target, setTarget] = useState<Target | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [gameActive, setGameActive] = useState(false);
  const [gameArea] = useState({ width: 420, height: 320 });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const award = useAwardPoints("click-speed", { level: 1, difficulty: "easy" });

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (gameActive && timeLeft > 0) timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    if (gameActive && timeLeft === 0) {
      setGameActive(false);
      setTarget(null);
    }
    return () => timer && clearTimeout(timer);
  }, [gameActive, timeLeft]);

  const spawnTarget = (): Target => ({
    id: Date.now(),
    x: Math.random() * (gameArea.width - 56),
    y: Math.random() * (gameArea.height - 56),
  });

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setTarget(spawnTarget());
    setGameActive(true);
    setSubmitted(false);
  };

  const hitTarget = (targetId: number) => {
    if (!gameActive) return;
    if (!target || target.id !== targetId) return;
    setScore((s) => s + 1);
    // Сразу показываем следующую цель, другие до клика не появляются
    setTarget(spawnTarget());
  };

  const won = useMemo(() => score >= 15, [score]);

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
            Скорость кликов
          </h2>
          <p className="mt-3 text-white/70">30 секунд. Попадите по целям как можно больше раз.</p>
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
          <div className="mt-8 space-y-4">
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

            <div className="flex justify-center">
              <div
                className="relative rounded-2xl border border-white/10 bg-black/25 overflow-hidden"
                style={{ width: gameArea.width, height: gameArea.height }}
              >
                {target && (
                  <button
                    key={target.id}
                    onClick={() => hitTarget(target.id)}
                    className="absolute w-12 h-12 rounded-full border border-white/20 bg-gradient-to-br from-rose-500/90 to-pink-500/90 shadow-lg transition-transform duration-150 hover:scale-105 flex items-center justify-center text-white font-bold"
                    style={{ left: target.x, top: target.y }}
                  >
                    🎯
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!gameActive && timeLeft === 0 && (
          <div className="mt-8 text-center space-y-4">
            <div className="text-2xl font-bold text-white/90">Время вышло</div>
            <div className="text-lg text-white/70">Попаданий: {score}</div>
            <div className="text-sm text-white/60">Победа: 15+ попаданий</div>

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


