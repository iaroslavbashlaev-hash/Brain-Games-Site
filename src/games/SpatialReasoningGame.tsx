import { useEffect, useMemo, useRef, useState } from "react";
import { useAwardPoints } from "./_awardPoints";
import { CircularCountdown } from "../components/CircularCountdown";

interface Shape {
  pattern: boolean[][];
}

export function SpatialReasoningGame({ onBack }: { onBack: () => void }) {
  const [shape, setShape] = useState<Shape | null>(null);
  const [options, setOptions] = useState<boolean[][][]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [roundActive, setRoundActive] = useState(false);
  const nextRoundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const award = useAwardPoints("spatial-reasoning", { level: 1, difficulty: "easy" });
  const ROUND_SECONDS = 10;

  const rotateMatrix = (matrix: boolean[][]): boolean[][] => {
    const n = matrix.length;
    const rotated = Array.from({ length: n }, () => Array.from({ length: n }, () => false));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) rotated[j][n - 1 - i] = matrix[i][j];
    }
    return rotated;
  };

  const generateRandomShape = (): boolean[][] => {
    const patterns = [
      [
        [true, false, false, false],
        [true, false, false, false],
        [true, true, false, false],
        [false, false, false, false],
      ],
      [
        [true, true, false, false],
        [false, true, false, false],
        [false, true, false, false],
        [false, false, false, false],
      ],
      [
        [true, true, true, false],
        [true, false, false, false],
        [false, false, false, false],
        [false, false, false, false],
      ],
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  };

  const generatePuzzle = () => {
    const original = generateRandomShape();
    const rotated90 = rotateMatrix(original);
    const wrongOptions = [
      rotateMatrix(rotateMatrix(original)), // 180
      rotateMatrix(rotateMatrix(rotateMatrix(original))), // 270
      original, // 0
    ];
    const allOptions = [rotated90, ...wrongOptions.slice(0, 3)];
    const shuffled = allOptions.sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.indexOf(rotated90);

    setShape({ pattern: original });
    setOptions(shuffled);
    setCorrectAnswer(correctIndex);
    setSelectedAnswer(null);
    setFeedback("");
    setTimeLeft(ROUND_SECONDS);
    setRoundActive(true);
  };

  useEffect(() => {
    generatePuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (roundActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (roundActive && timeLeft === 0) {
      setRoundActive(false);
      setStreak(0);
      setFeedback("Время вышло");
      if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = setTimeout(() => {
        generatePuzzle();
        nextRoundTimerRef.current = null;
      }, 1000);
    }
    return () => timer && clearTimeout(timer);
  }, [roundActive, timeLeft]);

  const renderShape = (pattern: boolean[][], sizeClass: string) => (
    <div className="grid grid-cols-4 gap-1">
      {pattern.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={[
              sizeClass,
              "rounded-sm border border-white/10",
              cell ? "bg-cyan-400/80" : "bg-slate-950/40",
            ].join(" ")}
          />
        )),
      )}
    </div>
  );

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    if (!roundActive) return;
    if (nextRoundTimerRef.current) {
      clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = null;
    }
    if (selectedAnswer === correctAnswer) {
      setScore((s) => s + 1);
      setStreak((v) => v + 1);
      setFeedback("Правильно! +1");
      setRoundActive(false);
      nextRoundTimerRef.current = setTimeout(() => {
        generatePuzzle();
        nextRoundTimerRef.current = null;
      }, 650);
    } else {
      // Неверный ответ — серия сбивается
      setStreak(0);
      setFeedback("Неправильно!");
      setRoundActive(false);
      nextRoundTimerRef.current = setTimeout(() => {
        generatePuzzle();
        nextRoundTimerRef.current = null;
      }, 1000);
    }
  };

  const won = useMemo(() => streak >= 6, [streak]);

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
    setStreak(0);
    setSubmitted(false);
    setFeedback("");
    setRoundActive(false);
    if (nextRoundTimerRef.current) {
      clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = null;
    }
    generatePuzzle();
  };

  if (!shape) return null;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-white/70 hover:text-white transition-colors">
          ← Назад к играм
        </button>
        <div className="text-sm text-white/60">
          Серия: <span className="text-white/90 font-semibold">{streak}</span> · Счёт:{" "}
          <span className="text-white/90 font-semibold">{score}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Пространственное мышление
          </h2>
          <p className="mt-3 text-white/70">Как будет выглядеть фигура после поворота на 90° по часовой?</p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-white/80">
          <div className="text-lg font-semibold">
            <span className="mr-2">Время:</span>
          </div>
          <CircularCountdown totalSeconds={ROUND_SECONDS} secondsLeft={timeLeft} running={roundActive} size={44} />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-sm text-white/60 mb-2">Исходная</p>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              {renderShape(shape.pattern, "w-6 h-6")}
            </div>
          </div>

          <div className="text-4xl text-white/30">→</div>

          <div className="text-center">
            <p className="text-sm text-white/60 mb-2">Поворот 90°</p>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="w-24 h-24 rounded-xl border border-dashed border-white/25 flex items-center justify-center text-white/40 text-2xl">
                ?
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-white/70">Выберите вариант:</p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedAnswer(index)}
                disabled={!roundActive}
                className={[
                  "p-3 rounded-2xl border transition-all",
                  selectedAnswer === index
                    ? "border-cyan-400/60 bg-cyan-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10",
                  !roundActive ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                <div className="flex justify-center">{renderShape(option, "w-4 h-4")}</div>
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

        <div className="mt-8 text-center text-sm text-white/60">Победа: 6+ правильных</div>

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
            Новая фигура
          </button>
        </div>
      </div>
    </div>
  );
}


