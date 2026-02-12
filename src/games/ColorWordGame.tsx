import { useEffect, useMemo, useState } from "react";
import { useAwardPoints } from "./_awardPoints";
import { CircularCountdown } from "../components/CircularCountdown";

interface ColorWord {
  text: string;
  color: string;
  isCorrect: boolean;
}

const GAME_SECONDS = 30;

export function ColorWordGame({ onBack }: { onBack: () => void }) {
  const [currentWord, setCurrentWord] = useState<ColorWord | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [gameActive, setGameActive] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const award = useAwardPoints("color-word", { level: 1, difficulty: "easy" });

  const colors = useMemo(
    () => [
      { name: "красный", value: "#ef4444" },
      { name: "синий", value: "#3b82f6" },
      { name: "зелёный", value: "#22c55e" },
      { name: "жёлтый", value: "#eab308" },
      { name: "фиолетовый", value: "#a855f7" },
      { name: "оранжевый", value: "#f97316" },
    ],
    [],
  );

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (gameActive && timeLeft > 0) timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    if (gameActive && timeLeft === 0) setGameActive(false);
    return () => timer && clearTimeout(timer);
  }, [gameActive, timeLeft]);

  const generateWord = () => {
    const textColor = colors[Math.floor(Math.random() * colors.length)];
    const displayColor = colors[Math.floor(Math.random() * colors.length)];
    setCurrentWord({
      text: textColor.name,
      color: displayColor.value,
      isCorrect: textColor.name === displayColor.name,
    });
    setFeedback("");
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setGameActive(true);
    setSubmitted(false);
    generateWord();
  };

  const handleAnswer = (answer: boolean) => {
    if (!currentWord || !gameActive) return;
    const correct = currentWord.isCorrect === answer;
    if (correct) {
      setScore((s) => s + 1);
      setFeedback("Правильно! +1");
    } else {
      setFeedback("Неправильно!");
    }
    setTimeout(() => {
      if (gameActive) generateWord();
    }, 350);
  };

  const won = useMemo(() => score >= 12, [score]);

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
            Цвет и слово
          </h2>
          <p className="mt-3 text-white/70">
            Совпадает ли цвет текста с написанным словом? Игнорируйте значение слова.
          </p>
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

        {gameActive && currentWord && (
          <div className="mt-8 text-center space-y-6">
            <div className="flex justify-between items-center max-w-md mx-auto text-white/80">
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

            <div className="rounded-2xl border border-white/10 bg-black/20 p-10">
              <div className="text-6xl font-extrabold" style={{ color: currentWord.color }}>
                {currentWord.text}
              </div>
            </div>

            <div className="text-lg font-semibold text-white/80">Цвет совпадает?</div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleAnswer(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-8 py-4 text-lg font-bold text-white hover:shadow-lg transition-all"
              >
                ДА
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 px-8 py-4 text-lg font-bold text-white hover:shadow-lg transition-all"
              >
                НЕТ
              </button>
            </div>

            {feedback && (
              <div className={`text-lg font-semibold ${feedback.includes("Правильно") ? "text-emerald-300" : "text-rose-300"}`}>
                {feedback}
              </div>
            )}
          </div>
        )}

        {!gameActive && timeLeft === 0 && (
          <div className="mt-8 text-center space-y-4">
            <div className="text-2xl font-bold text-white/90">Игра окончена</div>
            <div className="text-lg text-white/70">Правильных ответов: {score}</div>
            <div className="text-sm text-white/60">Победа: 12+ правильных</div>
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


