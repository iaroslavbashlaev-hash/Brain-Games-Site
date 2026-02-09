import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Множители очков по сложности
const DIFFICULTY_MULTIPLIERS = {
  easy: 1,
  medium: 2,
  hard: 3,
} as const;

// Базовые очки за уровень
const BASE_POINTS_PER_LEVEL = 10;

// Получить общие очки и монеты пользователя
export const getUserScore = query({
  args: {},
  returns: v.union(
    v.object({
      totalPoints: v.number(),
      coins: v.number(),
      gamesPlayed: v.number(),
      gamesWon: v.number(),
      referralCode: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const userScore = await ctx.db
      .query("userScores")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!userScore) {
      // Генерируем реферальный код для нового пользователя
      const referralCode = userId.slice(-12).toUpperCase();
      return {
        totalPoints: 0,
        coins: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        referralCode,
      };
    }

    return {
      totalPoints: userScore.totalPoints,
      coins: userScore.coins ?? 0,
      gamesPlayed: userScore.gamesPlayed,
      gamesWon: userScore.gamesWon,
      referralCode: userScore.referralCode ?? userScore.userId.slice(-12).toUpperCase(),
    };
  },
});

// Получить прогресс по конкретной игре
export const getGameProgress = query({
  args: { gameId: v.string() },
  returns: v.union(
    v.object({
      level: v.number(),
      bestScore: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const progress = await ctx.db
      .query("gameProgress")
      .withIndex("by_userId_and_gameId", (q) => 
        q.eq("userId", userId).eq("gameId", args.gameId)
      )
      .unique();

    if (!progress) {
      return {
        level: 1,
        bestScore: 0,
      };
    }

    return {
      level: progress.level,
      bestScore: progress.bestScore,
    };
  },
});

// Начислить очки за пройденный уровень
export const addPoints = mutation({
  args: {
    gameId: v.string(),
    level: v.number(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    won: v.boolean(),
  },
  returns: v.object({
    pointsEarned: v.number(),
    totalPoints: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Необходимо войти в аккаунт");
    }

    // Загружаем общий счёт
    const existingScore = await ctx.db
      .query("userScores")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    // Загружаем прогресс по игре
    const existingProgress = await ctx.db
      .query("gameProgress")
      .withIndex("by_userId_and_gameId", (q) =>
        q.eq("userId", userId).eq("gameId", args.gameId),
      )
      .unique();

    // Если пользователь пытается пройти уже пройденный уровень — очки не начисляем
    const alreadyCompletedLevel =
      !!existingProgress && args.level < existingProgress.level;

    // Рассчитываем "кандидат" очков
    const multiplier = DIFFICULTY_MULTIPLIERS[args.difficulty];
    const levelBonus = args.level * 1;
    const candidatePoints = (BASE_POINTS_PER_LEVEL + levelBonus) * multiplier;

    // Начисляем очки только если:
    // - уровень выигран
    // - это новый уровень (ещё не пройден)
    // - за этот (gameId, level, difficulty) ещё не начисляли ранее
    let shouldReward = args.won && !alreadyCompletedLevel;
    if (shouldReward) {
      // NOTE: there may be legacy duplicates in pointsHistory; don't use .unique()
      const existingRewards = await ctx.db
        .query("pointsHistory")
        .withIndex("by_userId_and_gameId_and_level_and_difficulty", (q) =>
          q
            .eq("userId", userId)
            .eq("gameId", args.gameId)
            .eq("level", args.level)
            .eq("difficulty", args.difficulty),
        )
        .take(1);
      if (existingRewards.length > 0) {
        shouldReward = false;
      }
    }

    const pointsEarned = shouldReward ? candidatePoints : 0;

    // Обновляем общие очки
    let totalPoints: number;

    if (existingScore) {
      totalPoints = existingScore.totalPoints + pointsEarned;
      await ctx.db.patch(existingScore._id, {
        ...(pointsEarned > 0 ? { totalPoints } : {}),
        gamesPlayed: existingScore.gamesPlayed + 1,
        gamesWon: args.won ? existingScore.gamesWon + 1 : existingScore.gamesWon,
      });
    } else {
      totalPoints = pointsEarned;
      const referralCode = userId.slice(-12).toUpperCase();
      await ctx.db.insert("userScores", {
        userId,
        totalPoints,
        coins: 0, // Монеты начинаются с 0
        gamesPlayed: 1,
        gamesWon: args.won ? 1 : 0,
        referralCode,
      });
    }

    // Обновляем прогресс по игре
    if (existingProgress) {
      const updates: { level?: number; bestScore?: number; completedAt?: number } = {};
      
      if (args.won && args.level >= existingProgress.level) {
        updates.level = args.level + 1;
        updates.completedAt = Date.now();
      }
      
      if (pointsEarned > existingProgress.bestScore) {
        updates.bestScore = pointsEarned;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existingProgress._id, updates);
      }
    } else {
      await ctx.db.insert("gameProgress", {
        userId,
        gameId: args.gameId,
        level: args.won ? args.level + 1 : args.level,
        bestScore: pointsEarned,
        ...(args.won ? { completedAt: Date.now() } : {}),
      });
    }

    // Записываем в историю
    if (pointsEarned > 0) {
      await ctx.db.insert("pointsHistory", {
        userId,
        gameId: args.gameId,
        level: args.level,
        difficulty: args.difficulty,
        pointsEarned,
        earnedAt: Date.now(),
      });
    }

    return {
      pointsEarned,
      totalPoints,
    };
  },
});

// Получить историю очков
export const getPointsHistory = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      gameId: v.string(),
      level: v.number(),
      difficulty: v.string(),
      pointsEarned: v.number(),
      earnedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const history = await ctx.db
      .query("pointsHistory")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 10);

    return history.map((h) => ({
      gameId: h.gameId,
      level: h.level,
      difficulty: h.difficulty,
      pointsEarned: h.pointsEarned,
      earnedAt: h.earnedAt,
    }));
  },
});

