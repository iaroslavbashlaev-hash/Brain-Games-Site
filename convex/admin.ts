import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Возвращает количество зарегистрированных пользователей.
 * Convex Dashboard → Functions → admin.getUserCount
 */
export const getUserCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});

/**
 * Сбросить все уровни игрока до 1 (и обнулить серию побед).
 * Convex Dashboard → Functions → admin.resetUserLevels
 */
export const resetUserLevels = mutation({
  args: { userId: v.id("users") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("gameProgress")
      .withIndex("by_userId_and_gameId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const p of all) {
      await ctx.db.patch(p._id, { level: 1, winStreak: 0 } as any);
    }
    return all.length;
  },
});

/**
 * Полностью удалить пользователя и связанные данные (каскадно).
 * Чистит ваши игровые таблицы и auth-таблицы Convex Auth.
 *
 * Convex Dashboard → Functions → admin.deleteUserCascade
 */
export const deleteUserCascade = mutation({
  args: { userId: v.id("users") },
  returns: v.object({
    deleted: v.record(v.string(), v.number()),
  }),
  handler: async (ctx, args) => {
    const deleted: Record<string, number> = {};
    const bump = (table: string, n: number) => {
      deleted[table] = (deleted[table] ?? 0) + n;
    };

    // Grab user email (helps cleanup verifier/reset rows)
    const userDoc = await ctx.db.get(args.userId);
    const userEmail =
      userDoc && typeof (userDoc as any).email === "string"
        ? ((userDoc as any).email as string)
        : null;

    // Helper: delete docs in table where predicate(doc) is true
    const deleteWhere = async (tableName: any, predicate: (doc: any) => boolean) => {
      const all = (await ctx.db.query(tableName as any).collect()) as Array<any>;
      let count = 0;
      for (const doc of all) {
        if (predicate(doc)) {
          await ctx.db.delete(doc._id);
          count++;
        }
      }
      if (count > 0) bump(String(tableName), count);
    };

    // --- Your app tables ---
    await deleteWhere("emailVerificationCodes", (d) => d.userId === args.userId);
    await deleteWhere("pointsHistory", (d) => d.userId === args.userId);
    await deleteWhere("userScores", (d) => d.userId === args.userId);
    await deleteWhere("gameProgress", (d) => d.userId === args.userId);

    // --- Convex Auth tables ---
    // 1) accounts (collect accountIds)
    const accounts = await ctx.db.query("authAccounts").collect();
    const accountIds = new Set<string>();
    for (const a of accounts as Array<any>) {
      if (a.userId === args.userId) accountIds.add(a._id);
    }

    // 2) sessions (collect sessionIds)
    const sessions = await ctx.db.query("authSessions").collect();
    const sessionIds = new Set<string>();
    for (const s of sessions as Array<any>) {
      if (s.userId === args.userId) sessionIds.add(s._id);
    }

    // refresh tokens / verifiers / codes / rate limits may refer to sessionId/accountId/identifier
    await deleteWhere(
      "authRefreshTokens",
      (d) =>
        d.userId === args.userId ||
        (typeof d.sessionId === "string" && sessionIds.has(d.sessionId)),
    );
    await deleteWhere(
      "authVerifiers",
      (d) =>
        d.userId === args.userId ||
        (typeof d.accountId === "string" && accountIds.has(d.accountId)) ||
        (!!userEmail &&
          (d.identifier === userEmail || d.email === userEmail || d.to === userEmail)),
    );
    await deleteWhere(
      "authVerificationCodes",
      (d) =>
        d.userId === args.userId ||
        (typeof d.accountId === "string" && accountIds.has(d.accountId)) ||
        (!!userEmail &&
          (d.identifier === userEmail || d.email === userEmail || d.to === userEmail)),
    );
    await deleteWhere(
      "authRateLimits",
      (d) =>
        d.userId === args.userId ||
        (!!userEmail &&
          (d.identifier === userEmail || d.email === userEmail || d.to === userEmail)),
    );

    // Finally delete sessions and accounts and user record
    await deleteWhere("authSessions", (d) => d.userId === args.userId);
    await deleteWhere("authAccounts", (d) => d.userId === args.userId);

    if (userDoc) {
      await ctx.db.delete(args.userId);
      bump("users", 1);
    }

    return { deleted };
  },
});

