import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { CircularCountdown } from "../components/CircularCountdown";

const COIN_TYPES: Array<string> = ["🪙", "💰", "💴", "💵", "💶", "💷", "💸", "🏅"];
const GAME_DURATION_SECONDS = 60;

export function NumismatGame({ onBack }: { onBack: () => void }) {
  const progress = useQuery(api.scores.getGameProgress, { gameId: "numismat" });
  const addPoints = useMutation(api.scores.addPoints);

  const level = progress?.level ?? 1;
  const bestScore = progress?.bestScore ?? 0;
  const stepsBack = useMemo(() => Math.min(level, 5), [level]);

  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [coins, setCoins] = useState<Array<string>>([]);
  const [currentCoin, setCurrentCoin] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION_SECONDS);
  const [timerStarted, setTimerStarted] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [submittingResult, setSubmittingResult] = useState<boolean>(false);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (!timerStarted) return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [gameState, timerStarted, timeLeft]);

  useEffect(() => {
    if (gameState === "playing" && timerStarted && timeLeft === 0) {
      void endGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, timerStarted, timeLeft]);

  const nextCoin = () => {
    const newCoin = COIN_TYPES[Math.floor(Math.random() * COIN_TYPES.length)];
    setCurrentCoin(newCoin);
    setShowResult(false);
  };

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCoins([]);
    setTimeLeft(GAME_DURATION_SECONDS);
    setTimerStarted(false);
    setShowResult(false);
    nextCoin();
  };

  const handleAnswer = (isIdentical: boolean) => {
    if (gameState !== "playing") return;
    if (showResult) return;
    if (!timerStarted) setTimerStarted(true);

    if (coins.length < stepsBack) {
      setCoins((prev) => [...prev, currentCoin]);
      nextCoin();
      return;
    }

    const compareIndex = coins.length - stepsBack;
    const actuallyIdentical = coins[compareIndex] === currentCoin;
    const correct = isIdentical === actuallyIdentical;

    if (correct) {
      setScore((prev) => prev + 10);
      toast.success("Правильно! +10");
    } else {
      setScore((prev) => prev - 5);
      toast.error("Неправильно! -5");
    }

    setCoins((prev) => [...prev, currentCoin]);
    setShowResult(true);
    setTimeout(() => nextCoin(), 450);
  };

  const handleRemember = () => {
    if (gameState !== "playing") return;
    if (showResult) return;
    if (!timerStarted) setTimerStarted(true);
    // Memorization phase: we don't score until we have enough history to compare.
    setCoins((prev) => [...prev, currentCoin]);
    nextCoin();
  };

  const endGame = async () => {
    if (submittingResult) return;
    setSubmittingResult(true);
    setGameState("finished");

    const won = score >= 50;
    try {
      const res = await addPoints({
        gameId: "numismat",
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
        <button
          onClick={onBack}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          ← Назад к играм
        </button>
        <div className="text-sm text-white/60">
          Уровень: <span className="text-white/90 font-semibold">{level}</span> · Лучший:{" "}
          <span className="text-white/90 font-semibold">{bestScore}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5">
        {gameState === "idle" && (
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Нумизмат
            </h2>
            <p className="mt-3 text-white/70">
              Запоминайте монеты и отвечайте: совпадает ли текущая монета с той, что была{" "}
              <span className="text-white/90 font-semibold">{stepsBack}</span> шаг(а) назад.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/60">Длительность</div>
                <div className="text-2xl font-bold text-white/90">{GAME_DURATION_SECONDS}с</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/60">Шагов назад</div>
                <div className="text-2xl font-bold text-white/90">{stepsBack}</div>
              </div>
            </div>

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
            <p className="mt-2 text-white/60">Порог победы: 50+</p>
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

        {gameState === "playing" && (
          <>
            <div className="mb-6 flex items-center justify-between text-white/80">
              <div className="text-lg font-semibold">
                Счёт: <span className="text-white font-bold">{score}</span>
              </div>
              <div className="text-lg font-semibold">
                <span className="mr-2">Время:</span>
                <span className="inline-flex align-middle">
                  <CircularCountdown
                    totalSeconds={GAME_DURATION_SECONDS}
                    secondsLeft={timeLeft}
                    running={timerStarted}
                    size={40}
                  />
                </span>
              </div>
              <div className="text-lg font-semibold">
                Шаг: <span className="text-white font-bold">{stepsBack}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 md:p-14 flex items-center justify-center min-h-[220px]">
              <div className={`text-8xl md:text-9xl transition-transform ${showResult ? "scale-110" : "scale-100"}`}>
                {currentCoin}
              </div>
            </div>

            {coins.length < stepsBack ? (
              <>
                <div className="mt-6 text-center text-white/60">
                  Запомните монету. Сравнение начнётся через{" "}
                  <span className="text-white/90 font-semibold">
                    {stepsBack - coins.length}
                  </span>{" "}
                  ход(а).
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleRemember}
                    disabled={showResult}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-5 font-bold text-white hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Запомнил
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswer(true)}
                  disabled={showResult}
                  className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-5 font-bold text-white hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Идентична
                </button>
                <button
                  onClick={() => handleAnswer(false)}
                  disabled={showResult}
                  className="rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 px-6 py-5 font-bold text-white hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Не идентична
                </button>
              </div>
            )}

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


