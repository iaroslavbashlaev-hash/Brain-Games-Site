import { useEffect, useMemo, useState } from "react";
import { useAwardPoints } from "./_awardPoints";
import { CircularCountdown } from "../components/CircularCountdown";

export function FindDifferenceGame({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<string[]>([]);
  const [differentIndex, setDifferentIndex] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const GAME_SECONDS = 30;
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [gameActive, setGameActive] = useState(false);

  const award = useAwardPoints("find-difference", { level: 1, difficulty: "easy" });

  const shapes = ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠"];
  const animals = ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊"];
  const fruits = ["🍎", "🍊", "🍌", "🍇", "🍓", "🥝"];

  const generateRound = () => {
    const categories = [shapes, animals, fruits];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const mainItem = category[Math.floor(Math.random() * category.length)];
    const differentItem = category.find((it) => it !== mainItem) ?? category[0];

    const gridSize = 16;
    const newItems = Array(gridSize).fill(mainItem);
    const diffIndex = Math.floor(Math.random() * gridSize);
    newItems[diffIndex] = differentItem;

    setItems(newItems);
    setDifferentIndex(diffIndex);
    setFeedback("");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (gameActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (gameActive && timeLeft === 0) {
      setGameActive(false);
    }
    return () => timer && clearTimeout(timer);
  }, [gameActive, timeLeft]);

  const startGame = () => {
    setScore(0);
    setSubmitted(false);
    setSubmitting(false);
    setFeedback("");
    setTimeLeft(GAME_SECONDS);
    setGameActive(true);
    generateRound();
  };

  const handleItemClick = (index: number) => {
    if (!gameActive) return;
    if (index === differentIndex) {
      setScore((s) => s + 1);
      setFeedback("Правильно! +1");
      setTimeout(() => generateRound(), 450);
    } else {
      setFeedback("Почти! Попробуйте ещё раз.");
    }
  };

  const won = useMemo(() => score >= 10, [score]);

  const submit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      await award({ won, pointsOverride: won ? 30 : undefined });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    startGame();
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
            Найди отличия
          </h2>
          <p className="mt-3 text-white/70">Найдите элемент, который отличается от остальных.</p>
        </div>

        {!gameActive && timeLeft === GAME_SECONDS && (
          <div className="mt-8 text-center">
            <button
              onClick={startGame}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-4 font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-purple-400 transition-all"
            >
              Начать (30 секунд)
            </button>
          </div>
        )}

        {gameActive && (
          <div className="mt-8 space-y-5">
            <div className="flex items-center justify-between text-white/80 max-w-xl mx-auto">
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
              <div className="grid grid-cols-4 gap-2 bg-black/20 p-4 rounded-2xl border border-white/10">
                {items.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleItemClick(index)}
                    className="w-14 h-14 sm:w-16 sm:h-16 text-3xl hover:bg-white/10 transition-all duration-150 rounded-xl flex items-center justify-center border border-white/5"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {feedback && (
          <div className={`mt-5 text-center text-lg font-semibold ${feedback.includes("Правильно") ? "text-emerald-300" : "text-amber-200"}`}>
            {feedback}
          </div>
        )}

        {!gameActive && timeLeft === 0 && (
          <div className="mt-8 text-center space-y-4">
            <div className="text-2xl font-bold text-white/90">Время вышло</div>
            <div className="text-lg text-white/70">Правильных: {score}</div>
            <div className="text-sm text-white/60">Победа: 10+ правильных</div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={submit}
                disabled={submitting || submitted}
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-6 py-4 font-semibold text-white hover:bg-white/15 transition-colors disabled:opacity-60"
              >
                {submitted ? "Сохранено" : submitting ? "Сохраняем..." : "Сохранить результат"}
              </button>
              <button
                onClick={reset}
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


