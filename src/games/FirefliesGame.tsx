import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { CircularCountdown } from "../components/CircularCountdown";

type Firefly = {
  id: number;
  x: number;
  y: number;
  isTarget: boolean;
  clicked: boolean;
};

const ROUNDS_PER_GAME = 3;
const GAME_DURATION_SECONDS = 60;

export function FirefliesGame({ onBack }: { onBack: () => void }) {
  const progress = useQuery(api.scores.getGameProgress, { gameId: "fireflies" });
  const addPoints = useMutation(api.scores.addPoints);

  const level = progress?.level ?? 1;
  const bestScore = progress?.bestScore ?? 0;

  const [gameState, setGameState] = useState<"idle" | "showing" | "moving" | "selecting" | "finished">("idle");
  const [fireflies, setFireflies] = useState<Array<Firefly>>([]);
  const [round, setRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [numFireflies, setNumFireflies] = useState<number>(4);
  const [numTargets, setNumTargets] = useState<number>(2);
  const [submittingResult, setSubmittingResult] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION_SECONDS);

  useEffect(() => {
    if (gameState === "idle" || gameState === "finished") return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState !== "idle" && gameState !== "finished" && timeLeft === 0) {
      void endGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameState]);

  const generateFireflies = (total: number, targets: number) => {
    const newFireflies: Array<Firefly> = [];
    for (let i = 0; i < total; i++) {
      newFireflies.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 75 + 12,
        isTarget: i < targets,
        clicked: false,
      });
    }
    setFireflies(newFireflies);

    setTimeout(() => {
      setGameState("moving");
      setTimeout(() => shuffleFireflies(newFireflies), 120);
    }, 1700);
  };

  const shuffleFireflies = (flies: Array<Firefly>) => {
    const shuffled = flies.map((f) => ({
      ...f,
      x: Math.random() * 80 + 10,
      y: Math.random() * 75 + 12,
    }));
    setFireflies(shuffled);
    setTimeout(() => setGameState("selecting"), 1200);
  };

  const startGame = () => {
    setScore(0);
    setRound(1);
    setTimeLeft(GAME_DURATION_SECONDS);
    const flies = Math.min(4 + level, 12);
    const targets = Math.min(2 + Math.floor(level / 2), 6);
    setNumFireflies(flies);
    setNumTargets(targets);
    setGameState("showing");
    generateFireflies(flies, targets);
  };

  const handleFireflyClick = (id: number) => {
    if (gameState !== "selecting") return;
    const firefly = fireflies.find((f) => f.id === id);
    if (!firefly || firefly.clicked) return;

    const newFireflies = fireflies.map((f) => (f.id === id ? { ...f, clicked: true } : f));
    setFireflies(newFireflies);

    if (firefly.isTarget) {
      setScore((prev) => prev + 10);
      toast.success("Правильно! +10");
    } else {
      setScore((prev) => prev - 5);
      toast.error("Неправильно! -5");
    }

    const allTargetsClicked = newFireflies.filter((f) => f.isTarget).every((f) => f.clicked);
    if (!allTargetsClicked) return;

    setTimeout(() => {
      if (round < ROUNDS_PER_GAME) {
        setRound((prev) => prev + 1);
        setGameState("showing");
        generateFireflies(numFireflies, numTargets);
      } else {
        void endGame();
      }
    }, 700);
  };

  const endGame = async () => {
    if (submittingResult) return;
    setSubmittingResult(true);
    setGameState("finished");

    const won = score >= 20;
    try {
      const res = await addPoints({
        gameId: "fireflies",
        level,
        difficulty: "easy",
        won,
      });
      toast.success(`Начислено: ${res.pointsEarned} очков`);
    } catch (e) {
      toast.error("Не удалось сохранить результат");
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setSubmittingResult(false);
    }
  };

  // Ensure the "showing" ring is visible right away on state transitions
  useEffect(() => {
    if (gameState !== "showing") return;
    // no-op: just triggers rerender timing alignment for some browsers
  }, [gameState]);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-white/70 hover:text-white transition-colors">
          ← Назад к играм
        </button>
        <div className="text-sm text-white/60">
          Уровень: <span className="text-white/90 font-semibold">{level}</span> · Лучший:{" "}
          <span className="text-white/90 font-semibold">{bestScore}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 md:p-8">
        {gameState === "idle" && (
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Светлячки
            </h2>
            <p className="mt-3 text-white/70">
              Запомните отмеченных светлячков, затем найдите их после перемещения. {ROUNDS_PER_GAME} раунда.
            </p>
            <button
              onClick={startGame}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-4 font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-purple-400 transition-all"
            >
              Начать игру
            </button>
          </div>
        )}

        {gameState === "finished" && (
          <div className="text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-white/90">Игра завершена</h2>
            <div className="mt-3 text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              {score > 0 ? "+" : ""}
              {score}
            </div>
            <p className="mt-2 text-white/60">Порог победы: 20+</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-3 font-semibold text-white hover:from-cyan-400 hover:to-purple-400 transition-all disabled:opacity-60"
                disabled={submittingResult}
              >
                Играть снова
              </button>
              <button
                onClick={onBack}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white/90 hover:bg-white/10 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {gameState !== "idle" && gameState !== "finished" && (
          <>
            <div className="mb-4 flex items-center justify-between text-white/80">
              <div className="text-lg font-semibold">
                Счёт: <span className="text-white font-bold">{score}</span>
              </div>
              <div className="text-lg font-semibold">
                Раунд: <span className="text-white font-bold">{round}/{ROUNDS_PER_GAME}</span>
              </div>
              <div className="text-lg font-semibold">
                <span className="mr-2">Время:</span>
                <span className="inline-flex align-middle">
                  <CircularCountdown totalSeconds={GAME_DURATION_SECONDS} secondsLeft={timeLeft} size={28} />
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/60 via-purple-950/30 to-slate-950/60 p-4 relative h-[460px] overflow-hidden">
              {fireflies.map((firefly) => (
                <button
                  key={firefly.id}
                  onClick={() => handleFireflyClick(firefly.id)}
                  disabled={gameState !== "selecting"}
                  className={[
                    "absolute w-12 h-12 rounded-full transition-all duration-700 shadow-lg border border-white/10 flex items-center justify-center text-2xl",
                    firefly.clicked
                      ? firefly.isTarget
                        ? "bg-emerald-400/90"
                        : "bg-rose-400/90"
                      : "bg-yellow-300/85",
                    gameState === "showing" && firefly.isTarget ? "ring-4 ring-white/70 ring-offset-2 ring-offset-black/30" : "",
                    gameState === "selecting" ? "cursor-pointer hover:scale-110" : "cursor-default",
                  ].join(" ")}
                  style={{
                    left: `${firefly.x}%`,
                    top: `${firefly.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  ✨
                </button>
              ))}
            </div>

            <div className="mt-4 text-center text-white/60">
              {gameState === "showing" && "Запомните отмеченных..."}
              {gameState === "moving" && "Светлячки перемещаются..."}
              {gameState === "selecting" && "Кликните по тем, что были отмечены!"}
            </div>

            <button
              onClick={() => void endGame()}
              className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white/80 hover:bg-white/10 transition-colors"
            >
              Завершить
            </button>
          </>
        )}
      </div>
    </div>
  );
}


