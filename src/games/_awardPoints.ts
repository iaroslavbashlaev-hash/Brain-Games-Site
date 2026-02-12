import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

type Difficulty = "easy" | "medium" | "hard";

export function useAwardPoints(gameId: string, opts?: { level?: number; difficulty?: Difficulty }) {
  const addPoints = useMutation(api.scores.addPoints);

  const level = opts?.level ?? 1;
  const difficulty = opts?.difficulty ?? "easy";

  return async (params: { won: boolean; pointsOverride?: number }) => {
    try {
      const res = await addPoints({
        gameId,
        level,
        difficulty,
        won: params.won,
        ...(typeof params.pointsOverride === "number" ? { pointsOverride: params.pointsOverride } : {}),
      });
      if (res.pointsEarned > 0) {
        toast.success(`Начислено: ${res.pointsEarned} очков`);
      } else if (params.won) {
        toast.message("Этот результат уже засчитан — очки не начислены");
      }
      return res;
    } catch (e) {
      toast.error("Не удалось сохранить результат");
      // eslint-disable-next-line no-console
      console.error(e);
      return null;
    }
  };
}




