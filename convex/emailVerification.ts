import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const upsertCode = internalMutation({
  args: {},
  returns: v.object({
    email: v.string(),
    code: v.string(),
  }),
  handler: async (ctx) => {
    const userIdRaw = await getAuthUserId(ctx);
    if (!userIdRaw) throw new Error("Необходимо войти в аккаунт");
    const userId = userIdRaw as Id<"users">;

    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("Не найден email пользователя");

    const now = Date.now();
    const existing = await ctx.db
      .query("emailVerificationCodes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(1);

    if (existing.length > 0) {
      const row = existing[0];
      if (now - row.lastSentAt < RESEND_COOLDOWN_MS) {
        throw new Error("Подождите 30 секунд перед повторной отправкой");
      }
    }

    const code = generateCode();
    const doc = {
      userId,
      code,
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      lastSentAt: now,
    };

    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, doc);
    } else {
      await ctx.db.insert("emailVerificationCodes", doc);
    }

    return { email: user.email, code };
  },
});

export const verifyEmail = mutation({
  args: {
    code: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userIdRaw = await getAuthUserId(ctx);
    if (!userIdRaw) throw new Error("Необходимо войти в аккаунт");
    const userId = userIdRaw as Id<"users">;

    const now = Date.now();
    const existing = await ctx.db
      .query("emailVerificationCodes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(1);

    if (existing.length === 0) {
      throw new Error("Сначала запросите код подтверждения");
    }

    const row = existing[0];
    if (now > row.expiresAt) {
      await ctx.db.delete(row._id);
      throw new Error("Код истёк. Отправьте новый код");
    }

    const trimmed = args.code.trim();
    if (trimmed !== row.code) {
      const attempts = (row.attempts ?? 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await ctx.db.delete(row._id);
        throw new Error("Слишком много попыток. Отправьте новый код");
      }
      await ctx.db.patch(row._id, { attempts });
      throw new Error(`Неверный код. Осталось попыток: ${MAX_ATTEMPTS - attempts}`);
    }

    await ctx.db.patch(userId, { emailVerificationTime: now });
    await ctx.db.delete(row._id);
    return null;
  },
});


