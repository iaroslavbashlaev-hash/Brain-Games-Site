import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

type LilyPad = {
  id: number;
  x: number;
  y: number;
  visited: boolean;
  clicked: boolean;
};

const MAX_ATTEMPTS = 3;
const GAME_DURATION_SECONDS = 60;

export function FrogGame({ onBack }: { onBack: () => void }) {
  const progress = useQuery(api.scores.getGameProgress, { gameId: "frog" });
  const addPoints = useMutation(api.scores.addPoints);

  const level = progress?.level ?? 1;
  const bestScore = progress?.bestScore ?? 0;

  const [gameState, setGameState] = useState<"idle" | "showing" | "playing" | "finished">("idle");
  const [lilyPads, setLilyPads] = useState<Array<LilyPad>>([]);
  const [path, setPath] = useState<Array<number>>([]);
  const [userPath, setUserPath] = useState<Array<number>>([]);
  const [frogPosition, setFrogPosition] = useState<number>(-1);
  const [attempts, setAttempts] = useState<number>(MAX_ATTEMPTS);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION_SECONDS);
  const [numJumps, setNumJumps] = useState<number>(3);
  const [submittingResult, setSubmittingResult] = useState<boolean>(false);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === "playing" && timeLeft === 0) {
      void endGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, timeLeft]);

  const generateLilyPads = (jumps: number) => {
    const pads: Array<LilyPad> = [];
    const numPads = jumps + 3;
    for (let i = 0; i < numPads; i++) {
      pads.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 75 + 12,
        visited: false,
        clicked: false,
      });
    }
    setLilyPads(pads);

    const newPath: Array<number> = [];
    const availableIndices = [...Array(numPads).keys()];
    for (let i = 0; i < jumps; i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      newPath.push(availableIndices[randomIndex]);
      availableIndices.splice(randomIndex, 1);
    }

    setPath(newPath);
    setUserPath([]);
    void showPath(newPath, pads);
  };

  const showPath = async (pathToShow: Array<number>, pads: Array<LilyPad>) => {
    setGameState("showing");
    for (let i = 0; i < pathToShow.length; i++) {
      setFrogPosition(pathToShow[i]);
      setLilyPads((prev) =>
        prev.map((p) => (p.id === pathToShow[i] ? { ...p, visited: true } : p)),
      );
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    setFrogPosition(-1);
    setLilyPads(pads.map((p) => ({ ...p, visited: false, clicked: false })));
    setGameState("playing");
  };

  const startGame = () => {
    setScore(0);
    setAttempts(MAX_ATTEMPTS);
    setTimeLeft(GAME_DURATION_SECONDS);
    const jumps = Math.min(3 + level, 10);
    setNumJumps(jumps);
    generateLilyPads(jumps);
  };

  const handleLilyPadClick = (id: number) => {
    if (gameState !== "playing") return;
    if (userPath.includes(id)) return;

    const newUserPath = [...userPath, id];
    setUserPath(newUserPath);

    setLilyPads((prev) => prev.map((p) => (p.id === id ? { ...p, clicked: true } : p)));

    const currentIndex = newUserPath.length - 1;
    const correct = path[currentIndex] === id;

    if (!correct) {
      toast.error("Неправильно! -5");
      setScore((prev) => prev - 5);
      setAttempts((prev) => prev - 1);

      setTimeout(() => {
        setUserPath([]);
        setLilyPads((prev) => prev.map((p) => ({ ...p, clicked: false })));
      }, 600);
      return;
    }

    setScore((prev) => prev + 10);
    if (newUserPath.length === path.length) {
      toast.success("Отлично! Путь пройден");
      setTimeout(() => {
        generateLilyPads(numJumps);
      }, 900);
    }
  };

  const endGame = async () => {
    if (submittingResult) return;
    setSubmittingResult(true);
    setGameState("finished");

    const won = score >= 20;
    try {
      const res = await addPoints({
        gameId: "frog",
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
              Лягушка
            </h2>
            <p className="mt-3 text-white/70">
              Запомните путь лягушки по кувшинкам, затем повторите его. У вас {MAX_ATTEMPTS} попытки.
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
            <h2 className="text-2xl font-bold text-white/90">Сессия завершена</h2>
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

        {(gameState === "showing" || gameState === "playing") && (
          <>
            <div className="mb-4 flex items-center justify-between text-white/80">
              <div className="text-lg font-semibold">
                Счёт: <span className="text-white font-bold">{score}</span>
              </div>
              <div className="text-lg font-semibold">
                Время: <span className="text-white font-bold">{timeLeft}с</span>
              </div>
              <div className="text-lg font-semibold">
                Попытки: <span className="text-white font-bold">{attempts}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-purple-500/10 p-4 relative h-[460px]">
              {lilyPads.map((pad) => (
                <button
                  key={pad.id}
                  onClick={() => handleLilyPadClick(pad.id)}
                  disabled={gameState !== "playing"}
                  className={[
                    "absolute w-16 h-16 rounded-full transition-all shadow-lg border border-white/10",
                    pad.clicked
                      ? "bg-emerald-500/90"
                      : pad.visited
                        ? "bg-yellow-300/90 ring-4 ring-white/60"
                        : "bg-emerald-400/70 hover:bg-emerald-300/70",
                    gameState === "playing" ? "cursor-pointer hover:scale-110" : "cursor-default",
                  ].join(" ")}
                  style={{
                    left: `${pad.x}%`,
                    top: `${pad.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span className="text-3xl">
                    {frogPosition === pad.id ? "🐸" : "🌿"}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 text-center text-white/60">
              {gameState === "showing" ? "Запомните путь..." : "Кликайте по кувшинкам по памяти!"}
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


