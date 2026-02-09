import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { CircularCountdown } from "../components/CircularCountdown";

type LilyPad = {
  id: number;
  x: number;
  y: number;
  visited: boolean;
  clicked: boolean;
};

const GAME_DURATION_SECONDS = 60;
const PAD_MIN_DISTANCE = 16; // in "percent points" of the container (roughly prevents overlap)

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function generateNonOverlappingPads(count: number): Array<{ x: number; y: number }> {
  const pads: Array<{ x: number; y: number }> = [];
  const maxAttempts = 4000;

  for (let i = 0; i < maxAttempts && pads.length < count; i++) {
    const candidate = {
      x: Math.random() * 80 + 10,
      y: Math.random() * 75 + 12,
    };
    if (pads.every((p) => dist(p, candidate) >= PAD_MIN_DISTANCE)) {
      pads.push(candidate);
    }
  }

  // Fallback: if we couldn't place all pads (unlikely), just fill the rest without constraint
  while (pads.length < count) {
    pads.push({
      x: Math.random() * 80 + 10,
      y: Math.random() * 75 + 12,
    });
  }

  return pads;
}

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
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION_SECONDS);
  const [numJumps, setNumJumps] = useState<number>(3);
  const [submittingResult, setSubmittingResult] = useState<boolean>(false);
  const [wrongPadId, setWrongPadId] = useState<number | null>(null);

  const clickOrderByPadId = useMemo(() => {
    const m = new Map<number, number>();
    userPath.forEach((padId, idx) => m.set(padId, idx + 1));
    return m;
  }, [userPath]);

  useEffect(() => {
    if (gameState !== "showing" && gameState !== "playing") return;
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
    const positions = generateNonOverlappingPads(numPads);
    for (let i = 0; i < numPads; i++) {
      pads.push({
        id: i,
        x: positions[i].x,
        y: positions[i].y,
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
    setTimeLeft(GAME_DURATION_SECONDS);
    const jumps = Math.min(3 + level, 10);
    setNumJumps(jumps);
    generateLilyPads(jumps);
  };

  const goToNextSequence = () => {
    setWrongPadId(null);
    setUserPath([]);
    generateLilyPads(numJumps);
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
      toast.error("Неправильно! Штраф -5 и следующий уровень");
      setScore((prev) => prev - 5);
      setWrongPadId(id);

      setTimeout(() => {
        goToNextSequence();
      }, 900);
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
      if (res.pointsEarned > 0) {
        toast.success(`Начислено: ${res.pointsEarned} очков`);
      } else {
        toast.message("Этот уровень уже пройден — очки не начислены");
      }
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
                <span className="mr-2">Время:</span>
                <span className="inline-flex align-middle">
                  <CircularCountdown totalSeconds={GAME_DURATION_SECONDS} secondsLeft={timeLeft} size={40} />
                </span>
              </div>
              <div className="text-lg font-semibold">
                Ход: <span className="text-white font-bold">{userPath.length + 1}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-purple-500/10 p-4 relative h-[460px]">
              {lilyPads.map((pad) => (
                <button
                  key={pad.id}
                  onClick={() => handleLilyPadClick(pad.id)}
                  disabled={gameState !== "playing"}
                  className={[
                    "absolute w-16 h-16 rounded-full transition-all shadow-lg border border-white/10 flex items-center justify-center",
                    wrongPadId === pad.id
                      ? "bg-rose-500/80 ring-4 ring-rose-200/80"
                      : pad.clicked
                        ? "bg-emerald-300/80 ring-4 ring-white/40"
                        : pad.visited
                          ? "bg-cyan-200/80 ring-4 ring-white/60"
                          : "bg-emerald-400/55 hover:bg-emerald-300/65",
                    gameState === "playing" ? "cursor-pointer hover:scale-110" : "cursor-default",
                  ].join(" ")}
                  style={{
                    left: `${pad.x}%`,
                    top: `${pad.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <span className="text-3xl select-none">
                    {frogPosition === pad.id ? "🐸" : "🪷"}
                  </span>
                  {/* click order number */}
                  {pad.clicked && (
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-black/60 border border-white/20 text-white text-sm font-bold flex items-center justify-center">
                      {clickOrderByPadId.get(pad.id)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 text-center text-white/60">
              {gameState === "showing"
                ? "Запомните путь лягушки по кувшинкам..."
                : "Кликайте по кувшинкам в правильном порядке!"}
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


