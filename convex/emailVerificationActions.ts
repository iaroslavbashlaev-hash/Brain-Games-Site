"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const sendVerificationCode = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey) throw new Error("RESEND_API_KEY не задан");
    if (!from) throw new Error("EMAIL_FROM не задан");

    const { email, code } = await ctx.runMutation(internal.emailVerification.upsertCode, {});

    const subject = "Код подтверждения почты";
    const html = `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5">
        <p>Ваш код подтверждения:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 2px">${code}</p>
        <p style="color:#64748b">Код действует 10 минут. Если это были не вы — просто игнорируйте письмо.</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend error: ${res.status} ${text}`);
    }

    return null;
  },
});


