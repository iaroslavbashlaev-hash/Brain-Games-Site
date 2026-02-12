import { useEffect, useMemo, useRef, useState } from "react";
import { useAwardPoints } from "./_awardPoints";
import { CircularCountdown } from "../components/CircularCountdown";

interface Pattern {
  grid: string[][];
  answer: number;
  baseShape: string;
}

export function PatternRecognitionGame({ onBack }: { onBack: () => void }) {
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [roundActive, setRoundActive] = useState(false);
  const nextRoundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const award = useAwardPoints("pattern-recognition", { level: 1, difficulty: "easy" });

  const ROUND_SECONDS = 10;
  const shapes = ["●", "■", "▲", "◆"];

  const generatePattern = () => {
    const baseShape = shapes[Math.floor(Math.random() * shapes.length)];
    const altShape = shapes[(shapes.indexOf(baseShape) + 1) % shapes.length];

    const grid = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ""));
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === 2 && j === 2) grid[i][j] = "?";
        else grid[i][j] = (i + j) % 2 === 0 ? baseShape : altShape;
      }
    }

    // [2][2] has parity even => baseShape
    setPattern({ grid, answer: 0, baseShape });
    setSelectedAnswer(null);
    setFeedback("");
    setTimeLeft(ROUND_SECONDS);
    setRoundActive(true);
  };

  useEffect(() => {
    generatePattern();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (roundActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (roundActive && timeLeft === 0) {
      setRoundActive(false);
      setFeedback("Время вышло");
      if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = setTimeout(() => {
        generatePattern();
        nextRoundTimerRef.current = null;
      }, 1000);
    }
    return () => timer && clearTimeout(timer);
  }, [roundActive, timeLeft]);

  const checkAnswer = () => {
    if (selectedAnswer === null || !pattern) return;
    if (!roundActive) return;
    if (nextRoundTimerRef.current) {
      clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = null;
    }
    if (selectedAnswer === pattern.answer) {
      setScore((s) => s + 1);
      setFeedback("Правильно! +1");
      setRoundActive(false);
      nextRoundTimerRef.current = setTimeout(() => {
        generatePattern();
        nextRoundTimerRef.current = null;
      }, 1050);
    } else {
      setFeedback("Неправильно. Попробуйте ещё раз!");
    }
  };

  const won = useMemo(() => score >= 8, [score]);

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
    setScore(0);
    setSubmitted(false);
    setFeedback("");
    setRoundActive(false);
    if (nextRoundTimerRef.current) {
      clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = null;
    }
    generatePattern();
  };

  if (!pattern) return null;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-white/70 hover:text-white transition-colors">
          ← Назад к играм
        </button>
        <div className="text-sm text-white/60">
          Счёт: <span className="text-white/90 font-semibold">{score}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Распознавание паттернов
          </h2>
          <p className="mt-3 text-white/70">Найдите закономерность и выберите фигуру для пропущенной ячейки.</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-white/80">
          <div className="text-lg font-semibold">
            <span className="mr-2">Время:</span>
          </div>
          <CircularCountdown totalSeconds={ROUND_SECONDS} secondsLeft={timeLeft} running={roundActive} size={44} />
        </div>

        <div className="mt-8 flex justify-center">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <div className="grid grid-cols-3 gap-2">
              {pattern.grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="w-16 h-16 rounded-xl border border-white/10 bg-slate-950/40 flex items-center justify-center"
                  >
                    <span className="text-3xl text-white/90">{cell}</span>
                  </div>
                )),
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-white/70">Выберите правильную фигуру:</p>
          <div className="flex justify-center gap-4">
            {[pattern.baseShape, shapes[(shapes.indexOf(pattern.baseShape) + 1) % shapes.length]].map((shape, index) => (
              <button
                key={index}
                onClick={() => setSelectedAnswer(index)}
                disabled={!roundActive}
                className={[
                  "w-16 h-16 rounded-xl border flex items-center justify-center text-3xl transition-all",
                  selectedAnswer === index
                    ? "border-cyan-400/60 bg-cyan-500/15"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10",
                  !roundActive ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <span className="text-white/90">{shape}</span>
              </button>
            ))}
          </div>

          <button
            onClick={checkAnswer}
            disabled={selectedAnswer === null || !roundActive}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 font-semibold text-white hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-60"
          >
            Проверить
          </button>
        </div>

        {feedback && (
          <div className={`mt-5 text-center text-lg font-semibold ${feedback.includes("Правильно") ? "text-emerald-300" : "text-rose-300"}`}>
            {feedback}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-white/60">Победа: 8+ правильных</div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
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
            Новый паттерн
          </button>
        </div>
      </div>
    </div>
  );
}


