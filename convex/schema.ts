import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  // Очки и монеты пользователей
  userScores: defineTable({
    userId: v.id("users"),
    totalPoints: v.number(),
    coins: v.number(), // Монеты (вторая валюта)
    gamesPlayed: v.number(),
    gamesWon: v.number(),
    referralCode: v.optional(v.string()), // Реферальный код
    referredBy: v.optional(v.id("users")), // Кто пригласил
  }).index("by_userId", ["userId"])
    .index("by_referralCode", ["referralCode"]),

  // Прогресс по играм
  gameProgress: defineTable({
    userId: v.id("users"),
    gameId: v.string(), // "numismat", "frog", "puzzle", "fireflies"
    level: v.number(),
    bestScore: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_userId_and_gameId", ["userId", "gameId"]),

  // История начисления очков
  pointsHistory: defineTable({
    userId: v.id("users"),
    gameId: v.string(),
    level: v.number(),
    difficulty: v.string(), // "easy", "medium", "hard"
    pointsEarned: v.number(),
    earnedAt: v.number(),
  }).index("by_userId", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
